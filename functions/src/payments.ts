/* Paiements (Stripe Connect, mode test tant que PharmaSign n'a pas de SIRET).
   Étape A : compte Express des interprètes (identité et IBAN saisis chez Stripe,
   PharmaSign ne stocke que l'identifiant du compte et son état).
   Étape B : paiement du RDV par le patient ; l'argent reste sur le compte
   PharmaSign (transfer_group = id du RDV) jusqu'au versement de l'étape C.
   Suivi du paiement dans payments/{apptId}, écrit uniquement ici. */
import './options';
import { FieldValue, Timestamp, getFirestore } from 'firebase-admin/firestore';
import * as logger from 'firebase-functions/logger';
import { defineSecret } from 'firebase-functions/params';
import { onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { HttpsError, onCall, onRequest } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import Stripe from 'stripe';
import { send, tokenOf } from './notify';
import { Appointment, paidPush, parisInstant, payoutPush, refundPush } from './push';
import {
  DEFAULT_FEE_PERCENT, RefundPlan, ScheduleAppt,
  isStalePayment, paymentQuote, paymentStatusFromEvent, payoutEligibleAt, payoutSplit, payoutStatus,
  refundOnChange, returnPage, shouldApplyStatus,
} from './stripe';

// Saisis hors du code : firebase functions:secrets:set STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET
const STRIPE_SECRET_KEY = defineSecret('STRIPE_SECRET_KEY');
const STRIPE_WEBHOOK_SECRET = defineSecret('STRIPE_WEBHOOK_SECRET');
const stripe = () => new Stripe(STRIPE_SECRET_KEY.value());

const RETURN_URL = 'https://europe-west1-pharmasign.cloudfunctions.net/stripeReturn';

async function interpreterRef(uid: string | undefined) {
  if (!uid) throw new HttpsError('unauthenticated', 'Connexion requise.');
  const ref = getFirestore().doc(`users/${uid}`);
  const snap = await ref.get();
  if (snap.get('role') !== 'interprete') {
    throw new HttpsError('permission-denied', 'Réservé aux interprètes.');
  }
  return { ref, snap };
}

/* ── Étape A : compte de l'interprète ───────────────────────────── */

/* Lien vers le formulaire Stripe (création du compte au premier appel) */
export const stripeOnboardingLink = onCall({ secrets: [STRIPE_SECRET_KEY] }, async (req) => {
  const { ref, snap } = await interpreterRef(req.auth?.uid);
  let accountId = snap.get('stripeAccountId') as string | undefined;
  if (!accountId) {
    const account = await stripe().accounts.create(
      {
        type: 'express',
        country: 'FR',
        email: req.auth?.token.email,
        business_type: 'individual',
        capabilities: { transfers: { requested: true } },
        metadata: { uid: ref.id },
      },
      { idempotencyKey: `connect-account-${ref.id}` }, // double appui : un seul compte
    );
    accountId = account.id;
    await ref.update({ stripeAccountId: accountId, stripePayoutStatus: 'incomplete' });
  }
  const link = await stripe().accountLinks.create({
    account: accountId,
    type: 'account_onboarding',
    refresh_url: `${RETURN_URL}?r=refresh`,
    return_url: `${RETURN_URL}?r=done`,
  });
  return { url: link.url };
});

/* Relit l'état du compte chez Stripe et le recopie dans le profil */
export const stripeRefreshStatus = onCall({ secrets: [STRIPE_SECRET_KEY] }, async (req) => {
  const { ref, snap } = await interpreterRef(req.auth?.uid);
  const accountId = snap.get('stripeAccountId') as string | undefined;
  if (!accountId) return { status: 'none' };
  const status = payoutStatus(await stripe().accounts.retrieve(accountId));
  await ref.update({ stripePayoutStatus: status });
  return { status };
});

/* Fin du formulaire Stripe → page qui renvoie dans l'appli (pharmasign://) */
export const stripeReturn = onRequest((req, res) => {
  res.set('Cache-Control', 'no-store').type('html')
    .send(returnPage(req.query.r === 'refresh' ? 'refresh' : 'done'));
});

/* ── Étape B : paiement du RDV par le patient ───────────────────── */

/* Prépare le paiement : montant recalculé ici (tarif × durée), jamais fourni par l'appli */
export const createPayment = onCall({ secrets: [STRIPE_SECRET_KEY] }, async (req) => {
  const uid = req.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'Connexion requise.');
  const apptId = req.data?.apptId;
  if (typeof apptId !== 'string' || !/^[A-Za-z0-9]{1,64}$/.test(apptId)) {
    throw new HttpsError('invalid-argument', 'Rendez-vous invalide.');
  }

  const db = getFirestore();
  const apptSnap = await db.doc(`appointments/${apptId}`).get();
  if (!apptSnap.exists) throw new HttpsError('not-found', 'Rendez-vous introuvable.');
  const appt = apptSnap.data() as Appointment & { interpreterHourlyRate?: number | null };
  const interpreterStatus = appt.interpreterId
    ? (await db.doc(`users/${appt.interpreterId}`).get()).get('stripePayoutStatus')
    : undefined;
  const quote = paymentQuote(appt, uid, interpreterStatus);
  if (!quote.ok) throw new HttpsError(quote.code, quote.message);

  const payRef = db.doc(`payments/${apptId}`);
  const pay = await payRef.get();
  if (pay.get('status') === 'paid') throw new HttpsError('already-exists', 'Ce rendez-vous est déjà réglé.');

  // Même montant et même interprète : on reprend le paiement déjà préparé
  let intent: Stripe.PaymentIntent | null = null;
  let attempt = (pay.get('attempt') as number | undefined) ?? 0;
  if (pay.get('intentId') && pay.get('amount') === quote.amount && pay.get('interpreterId') === appt.interpreterId) {
    intent = await stripe().paymentIntents.retrieve(pay.get('intentId'));
    if (intent.status === 'canceled') {
      intent = null;
      attempt++;
    }
  } else if (pay.get('intentId')) {
    attempt++; // montant ou interprète changé : nouveau paiement
  }
  if (!intent) {
    intent = await stripe().paymentIntents.create(
      {
        amount: quote.amount,
        currency: 'eur',
        automatic_payment_methods: { enabled: true },
        description: `Interprétation LSF — RDV du ${appt.date ?? ''} à ${appt.time ?? ''}`,
        receipt_email: req.auth?.token.email,
        transfer_group: apptId,
        metadata: { apptId, patientId: uid, interpreterId: appt.interpreterId ?? '' },
      },
      // Double appui simultané : Stripe renvoie le même paiement au lieu d'en créer deux
      { idempotencyKey: `pay-${apptId}-${attempt}` },
    );
    // Nouveau paiement : on repart de zéro (un remboursement précédent reste visible chez Stripe)
    await payRef.set({
      attempt,
      apptId,
      patientId: uid,
      interpreterId: appt.interpreterId,
      amount: quote.amount,
      currency: 'eur',
      intentId: intent.id,
      status: 'pending',
      createdAt: FieldValue.serverTimestamp(),
    });
  }
  return { clientSecret: intent.client_secret, amount: quote.amount };
});

/* Stripe → PharmaSign : suivi des paiements (signature vérifiée) */
export const stripeWebhook = onRequest(
  { secrets: [STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET] },
  async (req, res) => {
    let event: Stripe.Event;
    try {
      event = stripe().webhooks.constructEvent(
        req.rawBody, req.get('stripe-signature') ?? '', STRIPE_WEBHOOK_SECRET.value(),
      );
    } catch {
      res.status(400).send('Signature invalide');
      return;
    }

    const status = paymentStatusFromEvent(event.type);
    const intent = event.data.object as Stripe.PaymentIntent;
    const apptId = intent.metadata?.apptId;
    if (!status || intent.object !== 'payment_intent' || !apptId) {
      res.json({ received: true });
      return;
    }

    const db = getFirestore();
    const payRef = db.doc(`payments/${apptId}`);
    let replacedPaid = false;
    const newlyPaid = await db.runTransaction(async (tx) => {
      replacedPaid = false;
      const cur = await tx.get(payRef);
      if (cur.get('intentId') && cur.get('intentId') !== intent.id) {
        // Ancien paiement réglé alors qu'un autre l'a remplacé : remboursé ci-dessous
        replacedPaid = status === 'paid';
        return false;
      }
      if (!shouldApplyStatus(cur.get('status'), status)) return false;
      const wasPaid = cur.get('status') === 'paid';
      tx.set(payRef, {
        status,
        updatedAt: FieldValue.serverTimestamp(),
        ...(status === 'paid' && !wasPaid
          ? { paidAt: FieldValue.serverTimestamp(), chargeId: intent.latest_charge ?? null }
          : {}),
      }, { merge: true });
      return status === 'paid' && !wasPaid;
    });

    if (replacedPaid) {
      logger.warn(`Paiement ${apptId} : ancien intent ${intent.id} réglé — remboursement intégral`);
      await stripe().refunds.create(
        { payment_intent: intent.id, metadata: { apptId, reason: 'replaced' } },
        { idempotencyKey: `refund-${intent.id}-${intent.amount}` },
      );
    }

    if (newlyPaid) {
      logger.info(`Paiement ${apptId} : réglé (${intent.amount} centimes)`);
      const appt = (await db.doc(`appointments/${apptId}`).get()).data() as
        (Appointment & ScheduleAppt) | undefined;
      if (isStalePayment(appt, intent.metadata.interpreterId)) {
        // RDV annulé ou interprète changé pendant que le patient payait
        await refundAndRecord(apptId, { reason: 'stale', refund: intent.amount, payoutBase: 0 }, appt);
      } else {
        const eligible = payoutEligibleAt(appt!, parisInstant) ?? Date.now() + 24 * 3_600_000;
        await payRef.update({
          payoutStatus: 'scheduled',
          payoutBase: intent.amount,
          payoutEligibleAt: Timestamp.fromMillis(eligible),
        });
        const token = await tokenOf(intent.metadata.interpreterId);
        if (appt && token) await send([paidPush(appt, intent.amount, token)], `Paiement ${apptId}`);
      }
    }
    res.json({ received: true });
  },
);

/* ── Étape C : remboursements et versements ─────────────────────── */

/* Rembourse le patient (tout ou partie) et note le résultat dans payments/{apptId}.
   Une seule exécution par paiement, même si plusieurs déclencheurs arrivent ensemble. */
async function refundAndRecord(apptId: string, plan: RefundPlan, appt: Appointment | undefined): Promise<void> {
  const db = getFirestore();
  const payRef = db.doc(`payments/${apptId}`);
  const claimed = await db.runTransaction(async (tx) => {
    const cur = await tx.get(payRef);
    if (cur.get('status') !== 'paid' || cur.get('refundStatus')) return null;
    if (cur.get('payoutStatus') === 'transferred') return null; // déjà versé : traitement manuel
    tx.update(payRef, { refundStatus: 'processing' });
    return { intentId: cur.get('intentId') as string, patientId: cur.get('patientId') as string };
  });
  if (!claimed) return;

  try {
    const refund = await stripe().refunds.create(
      { payment_intent: claimed.intentId, amount: plan.refund, metadata: { apptId, reason: plan.reason } },
      { idempotencyKey: `refund-${claimed.intentId}-${plan.refund}` },
    );
    await payRef.update({
      status: plan.payoutBase > 0 ? 'partially_refunded' : 'refunded',
      refundStatus: 'done',
      refundId: refund.id,
      refundedAmount: plan.refund,
      refundReason: plan.reason,
      refundedAt: FieldValue.serverTimestamp(),
      payoutBase: plan.payoutBase,
      payoutStatus: plan.payoutBase > 0 ? 'scheduled' : 'none',
      payoutEligibleAt: Timestamp.now(), // dédommagement versé dès la prochaine tournée
    });
    logger.info(`Paiement ${apptId} : remboursé ${plan.refund} centimes (${plan.reason})`);
    const token = await tokenOf(claimed.patientId);
    if (appt && token) await send([refundPush(appt, plan.refund, plan.reason, token)], `Remboursement ${apptId}`);
  } catch (err) {
    logger.error(`Paiement ${apptId} : échec du remboursement (${plan.reason})`, err);
    await payRef.update({ refundStatus: FieldValue.delete() }); // nouvel essai au prochain déclenchement
  }
}

/* Désistement de l'interprète ou annulation par le patient d'un RDV payé */
export const refundOnAppointmentChange = onDocumentUpdated(
  { document: 'appointments/{apptId}', secrets: [STRIPE_SECRET_KEY] },
  async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data() as (Appointment & ScheduleAppt) | undefined;
    if (!before || !after || before.status === after.status) return;
    const pay = await getFirestore().doc(`payments/${event.params.apptId}`).get();
    if (pay.get('status') !== 'paid') return;
    const plan = refundOnChange(before, after, pay.get('amount'), Date.now(), parisInstant);
    if (plan) await refundAndRecord(event.params.apptId, plan, after);
  },
);

/* Versements aux interprètes, toutes les heures : 24 h après la fin du RDV
   (ou tout de suite pour un dédommagement d'annulation tardive), moins la commission. */
export const payoutMissions = onSchedule(
  { schedule: 'every 60 minutes', timeZone: 'Europe/Paris', maxInstances: 1, secrets: [STRIPE_SECRET_KEY] },
  async () => {
    const db = getFirestore();
    const now = Date.now();
    const feePercent = (await db.doc('config/payments').get()).get('feePercent') ?? DEFAULT_FEE_PERCENT;
    const due = (await db.collection('payments').where('payoutStatus', 'in', ['scheduled', 'processing']).get())
      .docs.filter((d) => ((d.get('payoutEligibleAt') as Timestamp | undefined)?.toMillis() ?? Infinity) <= now);

    for (const d of due) {
      const p = d.data();
      const interpreter = await db.doc(`users/${p.interpreterId}`).get();
      const accountId = interpreter.get('stripeAccountId') as string | undefined;
      if (!accountId || interpreter.get('stripePayoutStatus') !== 'active' || !p.chargeId || !(p.payoutBase > 0)) {
        logger.warn(`Versement ${d.id} en attente : compte interprète inactif ou paiement incomplet`);
        continue;
      }
      const { fee, net } = payoutSplit(p.payoutBase, feePercent);
      await d.ref.update({ payoutStatus: 'processing' });
      try {
        const transfer = await stripe().transfers.create(
          {
            amount: net,
            currency: 'eur',
            destination: accountId,
            transfer_group: d.id,
            source_transaction: p.chargeId, // fonds du paiement, même s'ils ne sont pas encore disponibles
            metadata: { apptId: d.id, feePercent: String(feePercent) },
          },
          { idempotencyKey: `payout-${d.id}-${p.attempt ?? 0}` },
        );
        await d.ref.update({
          payoutStatus: 'transferred', transferId: transfer.id, fee, net,
          transferredAt: FieldValue.serverTimestamp(),
        });
        logger.info(`Versement ${d.id} : ${net} centimes à l'interprète (commission ${fee})`);
        const appt = (await db.doc(`appointments/${d.id}`).get()).data() as Appointment | undefined;
        const token = await tokenOf(p.interpreterId);
        if (appt && token) await send([payoutPush(appt, net, token)], `Versement ${d.id}`);
      } catch (err) {
        logger.error(`Versement ${d.id} : échec, nouvel essai dans 1 h`, err);
        await d.ref.update({ payoutStatus: 'scheduled' });
      }
    }
  },
);
