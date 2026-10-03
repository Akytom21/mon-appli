import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  Appointment, FetchLike, PushMessage,
  chatPush, isExpoToken, newRequestPushes, sendPushes, statusChangePush,
} from './push';

const T1 = 'ExponentPushToken[aaa]';
const T2 = 'ExponentPushToken[bbb]';
const appt: Appointment = {
  patientId: 'p1', patientName: 'Marie Dupont', type: 'generaliste',
  date: '2026-10-12', time: '10:30', status: 'pending', interpreterId: null,
};

test('jetons Expo reconnus, le reste écarté', () => {
  assert.ok(isExpoToken(T1));
  assert.ok(isExpoToken('ExpoPushToken[x]'));
  assert.ok(!isExpoToken('abc'));
  assert.ok(!isExpoToken(undefined));
});

test('nouvelle demande : un message par interprète, sans nom du patient', () => {
  const msgs = newRequestPushes(appt, [T1, T2]);
  assert.equal(msgs.length, 2);
  assert.equal(msgs[0].title, 'Nouvelle demande d’interprétation');
  assert.equal(msgs[0].body, 'Médecin généraliste le 12/10 à 10:30');
  assert.equal(msgs[0].priority, 'default');
  assert.equal(msgs[0].data.url, '/(tabs)/interpretes/missions');
  assert.ok(!JSON.stringify(msgs).includes('Marie'));
});

test('demande urgente : titre d’alerte et priorité haute', () => {
  const [m] = newRequestPushes({ ...appt, type: 'urgences' }, [T1]);
  assert.match(m.title, /Urgence/);
  assert.equal(m.priority, 'high');
});

test('acceptation → patient prévenu avec le nom de l’interprète', () => {
  const after = { ...appt, status: 'accepted', interpreterId: 'i1', interpreterName: 'Luc' };
  const push = statusChangePush(appt, after);
  assert.equal(push?.recipientId, 'p1');
  const m = push!.build(T1);
  assert.equal(m.body, 'Luc sera votre interprète le 12/10 à 10:30.');
  assert.equal(m.data.url, '/(tabs)/malentendants/mes-rdv');
});

test('annulation d’un RDV accepté → interprète prévenu', () => {
  const accepted = { ...appt, status: 'accepted', interpreterId: 'i1' };
  const push = statusChangePush(accepted, { ...accepted, status: 'cancelled' });
  assert.equal(push?.recipientId, 'i1');
  assert.equal(push!.build(T1).title, 'Mission annulée');
});

test('autres changements : aucune notification', () => {
  assert.equal(statusChangePush(appt, { ...appt, status: 'cancelled' }), null); // annulé avant acceptation
  assert.equal(statusChangePush(appt, { ...appt }), null);                       // refus (declinedBy)
  const accepted = { ...appt, status: 'accepted', interpreterId: 'i1' };
  assert.equal(statusChangePush(accepted, { ...accepted }), null);               // transcription, etc.
});

test('message de chat : jamais le texte, lien vers la bonne conversation', () => {
  const m = chatPush({ senderId: 'i1', senderName: 'Luc', recipientId: 'p1' }, 'rdv42', T1);
  assert.equal(m.body, 'Luc vous a écrit.');
  assert.equal(m.data.url, '/(tabs)/messagerie/rdv42?recipientId=i1&name=Luc');
});

function fakeExpo(errorFor: Record<string, string> = {}) {
  const calls: PushMessage[][] = [];
  const fetchImpl: FetchLike = async (_url, init) => {
    const chunk = JSON.parse(init.body) as PushMessage[];
    calls.push(chunk);
    const data = chunk.map((m) => (errorFor[m.to]
      ? { status: 'error', details: { error: errorFor[m.to] } }
      : { status: 'ok' }));
    return { ok: true, status: 200, json: async () => ({ data }) };
  };
  return { calls, fetchImpl };
}

test('envoi par paquets de 100', async () => {
  const tokens = Array.from({ length: 250 }, (_, i) => `ExponentPushToken[t${i}]`);
  const { calls, fetchImpl } = fakeExpo();
  const { sent } = await sendPushes(newRequestPushes(appt, tokens), fetchImpl);
  assert.deepEqual(calls.map((c) => c.length), [100, 100, 50]);
  assert.equal(sent, 250);
});

test('jetons invalides ignorés, appareils désinscrits signalés', async () => {
  const { calls, fetchImpl } = fakeExpo({ [T2]: 'DeviceNotRegistered' });
  const msgs = newRequestPushes(appt, [T1, T2, 'pas-un-jeton']);
  const { sent, staleTokens } = await sendPushes(msgs, fetchImpl);
  assert.equal(calls[0].length, 2);
  assert.equal(sent, 1);
  assert.deepEqual(staleTokens, [T2]);
});

test('aucun appel réseau sans destinataire', async () => {
  const { calls, fetchImpl } = fakeExpo();
  await sendPushes([], fetchImpl);
  assert.equal(calls.length, 0);
});

test('erreur HTTP du service Expo remontée', async () => {
  const fetchImpl: FetchLike = async () => ({ ok: false, status: 503, json: async () => ({}) });
  await assert.rejects(sendPushes(newRequestPushes(appt, [T1]), fetchImpl), /503/);
});
