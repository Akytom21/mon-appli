import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  isStalePayment, paymentQuote, paymentStatusFromEvent, payoutEligibleAt, payoutSplit, payoutStatus,
  priceCents, refundOnChange, returnPage, shouldApplyStatus,
} from './stripe';
import { paidPush, parisInstant, payoutPush, refundPush } from './push';

test('commission : 5 % pour PharmaSign, le reste à l’interprète', () => {
  assert.deepEqual(payoutSplit(6750, 5), { fee: 338, net: 6412 });   // 67,50 € → 3,38 € / 64,12 €
  assert.deepEqual(payoutSplit(3375, 5), { fee: 169, net: 3206 });   // dédommagement 50 %
  assert.deepEqual(payoutSplit(6750, 0), { fee: 0, net: 6750 });
  assert.deepEqual(payoutSplit(6750, 80), { fee: 338, net: 6412 });  // taux aberrant → 5 % par défaut
  assert.deepEqual(payoutSplit(6750, Number.NaN), { fee: 338, net: 6412 });
});

const rdv = { date: '2026-10-12', time: '10:30', durationMin: 90 }; // 08:30Z → 10:00Z
const at = (iso: string) => Date.parse(iso);

test('versement possible 24 h après la fin du RDV', () => {
  assert.equal(new Date(payoutEligibleAt(rdv, parisInstant)!).toISOString(), '2026-10-13T10:00:00.000Z');
  assert.equal(payoutEligibleAt({}, parisInstant), null);
});

test('désistement de l’interprète → remboursement intégral', () => {
  const plan = refundOnChange({ status: 'accepted' }, { ...rdv, status: 'pending' }, 6750, at('2026-10-12T08:00:00Z'), parisInstant);
  assert.deepEqual(plan, { reason: 'withdrawn', refund: 6750, payoutBase: 0 });
});

test('annulation par le patient : 100 % avant 24 h, 50 % après', () => {
  const cancel = (iso: string) => refundOnChange({ status: 'accepted' }, { ...rdv, status: 'cancelled' }, 6750, at(iso), parisInstant);
  assert.deepEqual(cancel('2026-10-11T08:00:00Z'), { reason: 'cancelled_early', refund: 6750, payoutBase: 0 }); // 24 h 30 avant
  assert.deepEqual(cancel('2026-10-11T09:00:00Z'), { reason: 'cancelled_late', refund: 3375, payoutBase: 3375 }); // 23 h 30 avant
  assert.deepEqual(cancel('2026-10-12T12:00:00Z'), { reason: 'cancelled_late', refund: 3375, payoutBase: 3375 }); // après le RDV
});

test('pas de remboursement hors de ces cas', () => {
  assert.equal(refundOnChange({ status: 'pending' }, { ...rdv, status: 'cancelled' }, 6750, 0, parisInstant), null); // jamais accepté
  assert.equal(refundOnChange({ status: 'accepted' }, { ...rdv, status: 'accepted' }, 6750, 0, parisInstant), null);
  assert.equal(refundOnChange({ status: 'accepted' }, { ...rdv, status: 'cancelled' }, 0, 0, parisInstant), null);
});

test('paiement « périmé » : RDV annulé ou interprète changé pendant le paiement', () => {
  assert.equal(isStalePayment({ status: 'accepted', interpreterId: 'i1' }, 'i1'), false);
  assert.equal(isStalePayment({ status: 'accepted', interpreterId: 'i2' }, 'i1'), true);
  assert.equal(isStalePayment({ status: 'pending', interpreterId: null }, 'i1'), true);
  assert.equal(isStalePayment({ status: 'cancelled', interpreterId: 'i1' }, 'i1'), true);
  assert.equal(isStalePayment(undefined, 'i1'), true);
});

test('notifications de remboursement et de versement', () => {
  const a = { patientId: 'p1', date: '2026-10-12', time: '10:30' };
  const late = refundPush(a, 3375, 'cancelled_late', 'ExponentPushToken[x]');
  assert.equal(late.title, '↩️ Remboursement de 33,75 €');
  assert.match(late.body, /50 %/);
  assert.match(refundPush(a, 6750, 'withdrawn', 'ExponentPushToken[x]').body, /désisté/);
  assert.equal(payoutPush(a, 6412, 'ExponentPushToken[x]').title, '💶 Versement de 64,12 €');
});

const appt = { patientId: 'p1', status: 'accepted', interpreterId: 'i1', interpreterHourlyRate: 45, durationMin: 90 };

test('devis : montant recalculé côté serveur', () => {
  assert.deepEqual(paymentQuote(appt, 'p1', 'active'), { ok: true, amount: 6750 });
  // ancien RDV sans durée : 1 h par défaut
  assert.deepEqual(paymentQuote({ ...appt, durationMin: undefined }, 'p1', 'active'), { ok: true, amount: 4500 });
});

test('devis refusé : autre patient, pas d’interprète, compte inactif, pas de tarif', () => {
  const code = (r: ReturnType<typeof paymentQuote>) => (r.ok ? 'ok' : r.code);
  assert.equal(code(paymentQuote(appt, 'intrus', 'active')), 'permission-denied');
  assert.equal(code(paymentQuote({ ...appt, status: 'pending', interpreterId: null }, 'p1', 'active')), 'failed-precondition');
  assert.equal(code(paymentQuote(appt, 'p1', 'pending')), 'failed-precondition');
  assert.equal(code(paymentQuote(appt, 'p1', undefined)), 'failed-precondition');
  assert.equal(code(paymentQuote({ ...appt, interpreterHourlyRate: null }, 'p1', 'active')), 'failed-precondition');
});

test('événements Stripe → statut du paiement', () => {
  assert.equal(paymentStatusFromEvent('payment_intent.succeeded'), 'paid');
  assert.equal(paymentStatusFromEvent('payment_intent.payment_failed'), 'failed');
  assert.equal(paymentStatusFromEvent('payment_intent.processing'), 'processing');
  assert.equal(paymentStatusFromEvent('charge.succeeded'), null);
});

test('un paiement réussi ne redevient jamais « échoué » (événements dans le désordre)', () => {
  assert.equal(shouldApplyStatus('paid', 'failed'), false);
  assert.equal(shouldApplyStatus('paid', 'processing'), false);
  assert.equal(shouldApplyStatus('paid', 'paid'), true);
  assert.equal(shouldApplyStatus('pending', 'paid'), true);
  assert.equal(shouldApplyStatus(undefined, 'failed'), true);
});

test('notification « mission réglée » pour l’interprète', () => {
  const m = paidPush({ patientId: 'p1', date: '2026-10-12', time: '10:30' }, 6750, 'ExponentPushToken[x]');
  assert.equal(m.body, 'Le patient a payé 67,50 € pour le RDV le 12/10 à 10:30.');
  assert.equal(m.data.url, '/(tabs)/interpretes/planning');
});

test('montant : tarif × durée, en centimes', () => {
  assert.equal(priceCents(45, 90), 6750);   // 45 €/h × 1 h 30 = 67,50 €
  assert.equal(priceCents(40, 60), 4000);
  assert.equal(priceCents(33.33, 30), 1667); // arrondi au centime
  assert.equal(priceCents(0, 60), 0);        // pas de tarif → pas de montant
  assert.equal(priceCents(45, 0), 0);
});

test('état des versements de l’interprète', () => {
  assert.equal(payoutStatus(null), 'none');
  assert.equal(payoutStatus({ details_submitted: false }), 'incomplete');
  assert.equal(payoutStatus({ details_submitted: true, payouts_enabled: false }), 'pending');
  assert.equal(payoutStatus({ details_submitted: true, payouts_enabled: true, capabilities: { transfers: 'inactive' } }), 'pending');
  assert.equal(payoutStatus({ details_submitted: true, payouts_enabled: true, capabilities: { transfers: 'active' } }), 'active');
});

test('page de retour : renvoie dans l’appli', () => {
  assert.match(returnPage('done'), /pharmasign:\/\/stripe-return\?r=done/);
  assert.match(returnPage('refresh'), /expiré/);
});
