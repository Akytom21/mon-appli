import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  Appointment, FetchLike, PushMessage,
  chatPush, interpreterTokens, isExpoToken, newRequestPushes, parisDate, parisInstant,
  planReminders, reminderPush, sendPushes, statusChangePush,
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

test('durée affichée dans la demande', () => {
  const [m] = newRequestPushes({ ...appt, durationMin: 90 }, [T1]);
  assert.equal(m.body, 'Médecin généraliste le 12/10 à 10:30 (1 h 30)');
});

test('interprètes prévenus : disponibles, hors patient et hors refus', () => {
  const tokens = interpreterTokens({ ...appt, declinedBy: ['i2'] }, [
    { id: 'i1', expoPushToken: T1 },
    { id: 'i2', expoPushToken: T2 },                                  // a refusé / s'est désisté
    { id: 'i3', disponible: false, expoPushToken: 'ExponentPushToken[c]' },
    { id: 'p1', expoPushToken: 'ExponentPushToken[d]' },              // le patient lui-même
    { id: 'i4' },                                                     // pas de jeton
  ]);
  assert.deepEqual(tokens, [T1]);
});

test('désistement → patient prévenu et demande relancée', () => {
  const accepted = { ...appt, status: 'accepted', interpreterId: 'i1', interpreterName: 'Luc' };
  const after = { ...appt, status: 'pending', interpreterId: null, declinedBy: ['i1'] };
  const push = statusChangePush(accepted, after);
  assert.equal(push?.recipientId, 'p1');
  assert.equal(push?.relaunch, true);
  assert.match(push!.build(T1).title, /désisté/);
  const [relaunch] = newRequestPushes(after, [T2], true);
  assert.equal(relaunch.title, 'Demande à reprendre');
});

test('heure de Paris → UTC, été comme hiver', () => {
  assert.equal(new Date(parisInstant('2026-07-01', '10:00')).toISOString(), '2026-07-01T08:00:00.000Z');
  assert.equal(new Date(parisInstant('2026-01-15', '10:00')).toISOString(), '2026-01-15T09:00:00.000Z');
  // 25/10/2026 : passage à l'heure d'hiver à 3 h
  assert.equal(new Date(parisInstant('2026-10-25', '10:00')).toISOString(), '2026-10-25T09:00:00.000Z');
  assert.equal(new Date(parisInstant('2026-10-24', '10:00')).toISOString(), '2026-10-24T08:00:00.000Z');
  assert.equal(parisDate(Date.parse('2026-10-03T22:30:00Z')), '2026-10-04'); // 0 h 30 à Paris
});

const accepted = { ...appt, status: 'accepted', interpreterId: 'i1', interpreterName: 'Luc' };
const at = (iso: string) => Date.parse(iso);

test('rappel de la veille : patient et interprète', () => {
  // RDV le 12/10 à 10:30 Paris = 08:30Z ; maintenant = la veille 10:00Z (22 h 30 avant)
  const plans = planReminders([{ id: 'r1', appt: accepted, sent: [] }], at('2026-10-11T10:00:00Z'));
  assert.deepEqual(plans.map((p) => `${p.kind}:${p.recipientId}:${p.today}`), ['dayBefore:p1:false', 'dayBefore:i1:false']);
});

test('rappel 1 h avant, sans renvoyer ce qui est déjà parti', () => {
  const plans = planReminders(
    [{ id: 'r1', appt: accepted, sent: ['hourBefore:p1'] }],
    at('2026-10-12T07:30:00Z'), // 60 min avant
  );
  assert.deepEqual(plans.map((p) => p.key), ['hourBefore:i1']);
});

test('pas de rappel : trop tôt, entre deux fenêtres, passé, ou sans interprète', () => {
  const run = (a: Appointment, iso: string) => planReminders([{ id: 'r', appt: a, sent: [] }], at(iso));
  assert.equal(run(accepted, '2026-10-11T07:00:00Z').length, 0);   // 25 h 30 avant
  assert.equal(run(accepted, '2026-10-12T06:30:00Z').length, 0);   // 2 h avant
  assert.equal(run(accepted, '2026-10-12T09:00:00Z').length, 0);   // RDV passé
  assert.equal(run(appt, '2026-10-12T07:30:00Z').length, 0);       // toujours en attente
});

test('rappel le jour même : « aujourd’hui », pas « demain »', () => {
  const [p] = planReminders([{ id: 'r1', appt: accepted, sent: [] }], at('2026-10-12T04:00:00Z')); // 4 h 30 avant
  assert.equal(p.today, true);
  const m = reminderPush(accepted, p, true, T1);
  assert.equal(m.title, '📅 Rappel : RDV aujourd’hui à 10:30');
  assert.equal(m.body, 'Luc vous retrouve aujourd’hui à 10:30.');
  const forInterp = reminderPush({ ...accepted, durationMin: 60 }, { kind: 'hourBefore', today: true }, false, T1);
  assert.equal(forInterp.body, 'Mission d’interprétation à 10:30 (1 h).');
  assert.equal(forInterp.data.url, '/(tabs)/interpretes/planning');
});

test('erreur HTTP du service Expo remontée', async () => {
  const fetchImpl: FetchLike = async () => ({ ok: false, status: 503, json: async () => ({}) });
  await assert.rejects(sendPushes(newRequestPushes(appt, [T1]), fetchImpl), /503/);
});
