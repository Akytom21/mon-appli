/* Notifications push de PharmaSign.
   Ces fonctions ne font qu'envoyer des notifications : elles n'écrivent jamais
   dans les documents qui les déclenchent (appointments, chatMessages), donc
   aucune boucle de déclenchement possible. Écritures : effacer de users/{uid}
   un jeton push devenu invalide, et noter les rappels envoyés dans reminders/
   (collection fermée aux clients par les règles). */
import './options';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { onDocumentCreated, onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { send, tokenOf } from './notify';
import {
  Appointment, ChatMessage,
  chatPush, interpreterTokens, isExpoToken, newRequestPushes, parisDate, planReminders,
  reminderPush, statusChangePush,
} from './push';

const db = getFirestore();

export {
  createPayment, stripeOnboardingLink, stripeRefreshStatus, stripeReturn, stripeWebhook,
} from './payments';

/* Demande ouverte → interprètes disponibles qui ne l'ont pas refusée */
async function broadcastRequest(appt: Appointment, context: string, relaunched = false): Promise<void> {
  const snap = await db.collection('users').where('role', '==', 'interprete').get();
  const interpreters = snap.docs.map((d) => ({
    id: d.id, disponible: d.get('disponible'), expoPushToken: d.get('expoPushToken'),
  }));
  await send(newRequestPushes(appt, interpreterTokens(appt, interpreters), relaunched), context);
}

/* Nouvelle demande de RDV → tous les interprètes disponibles */
export const notifyNewRequest = onDocumentCreated('appointments/{apptId}', async (event) => {
  const appt = event.data?.data() as Appointment | undefined;
  if (!appt || appt.status !== 'pending') return;
  await broadcastRequest(appt, `Demande ${event.params.apptId}`);
});

/* RDV accepté → patient ; RDV accepté puis annulé → interprète ;
   interprète désisté → patient + demande relancée aux autres interprètes */
export const notifyStatusChange = onDocumentUpdated('appointments/{apptId}', async (event) => {
  const before = event.data?.before.data() as Appointment | undefined;
  const after = event.data?.after.data() as Appointment | undefined;
  if (!before || !after) return;
  const push = statusChangePush(before, after);
  if (!push) return;
  const context = `Statut ${event.params.apptId}`;
  const token = await tokenOf(push.recipientId);
  if (token) await send([push.build(token)], context);
  if (push.relaunch) await broadcastRequest(after, `${context} (relance)`, true);
});

/* Nouveau message → destinataire */
export const notifyChatMessage = onDocumentCreated('messages/{apptId}/chatMessages/{msgId}', async (event) => {
  const msg = event.data?.data() as ChatMessage | undefined;
  if (!msg || msg.recipientId === msg.senderId) return;
  const token = await tokenOf(msg.recipientId);
  if (token) await send([chatPush(msg, event.params.apptId, token)], `Message ${event.params.msgId}`);
});

/* Rappels : la veille et moins d'une heure avant, au patient et à l'interprète */
export const sendReminders = onSchedule(
  { schedule: 'every 15 minutes', timeZone: 'Europe/Paris', maxInstances: 1 },
  async () => {
    const now = Date.now();
    const snap = await db.collection('appointments')
      .where('date', '>=', parisDate(now))
      .where('date', '<=', parisDate(now + 25 * 3_600_000))
      .get();
    const accepted = snap.docs.filter((d) => d.get('status') === 'accepted');
    if (accepted.length === 0) return;

    const reminderRefs = accepted.map((d) => db.doc(`reminders/${d.id}`));
    const sentSnaps = await db.getAll(...reminderRefs);
    const plans = planReminders(
      accepted.map((d, i) => ({ id: d.id, appt: d.data() as Appointment, sent: sentSnaps[i].get('sent') ?? [] })),
      now,
    );
    if (plans.length === 0) return;

    const appts = new Map(accepted.map((d) => [d.id, d.data() as Appointment]));
    const recipients = [...new Set(plans.map((p) => p.recipientId))];
    const userSnaps = await db.getAll(...recipients.map((uid) => db.doc(`users/${uid}`)));
    const tokens = new Map(userSnaps.map((s) => [s.id, s.get('expoPushToken')]));

    const messages = plans.flatMap((p) => {
      const appt = appts.get(p.apptId)!;
      const token = tokens.get(p.recipientId);
      return isExpoToken(token) ? [reminderPush(appt, p, p.recipientId === appt.patientId, token)] : [];
    });
    // Échec du service Expo : rien n'est noté, nouvel essai dans 15 min.
    // Destinataire sans jeton : noté quand même, inutile de réessayer.
    if (!(await send(messages, `Rappels (${plans.length} prévu(s))`))) return;

    const batch = db.batch();
    for (const p of plans) {
      batch.set(db.doc(`reminders/${p.apptId}`), { sent: FieldValue.arrayUnion(p.key) }, { merge: true });
    }
    await batch.commit();
  },
);
