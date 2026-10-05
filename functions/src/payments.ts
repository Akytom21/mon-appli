/* Paiements — étape A : compte Stripe Connect (Express) des interprètes.
   Les données d'identité et bancaires sont saisies sur les pages Stripe :
   PharmaSign ne stocke que l'identifiant du compte et son état. */
import './options';
import { getFirestore } from 'firebase-admin/firestore';
import { defineSecret } from 'firebase-functions/params';
import { HttpsError, onCall, onRequest } from 'firebase-functions/v2/https';
import Stripe from 'stripe';
import { payoutStatus, returnPage } from './stripe';

// Saisie par l'utilisateur : firebase functions:secrets:set STRIPE_SECRET_KEY
const STRIPE_SECRET_KEY = defineSecret('STRIPE_SECRET_KEY');
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
