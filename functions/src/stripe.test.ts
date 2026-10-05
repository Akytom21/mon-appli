import { test } from 'node:test';
import assert from 'node:assert/strict';
import { payoutStatus, priceCents, returnPage } from './stripe';

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
