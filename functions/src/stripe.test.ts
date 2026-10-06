import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  paymentQuote, paymentStatusFromEvent, payoutStatus, priceCents, returnPage, shouldApplyStatus,
} from './stripe';
import { paidPush } from './push';

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
