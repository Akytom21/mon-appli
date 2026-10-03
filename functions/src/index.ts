/* Notifications push de PharmaSign.
   Ces fonctions ne font qu'envoyer des notifications : elles n'écrivent jamais
   dans les documents qui les déclenchent (appointments, chatMessages), donc
   aucune boucle de déclenchement possible. Seule écriture : effacer de
   users/{uid} un jeton push devenu invalide. */
import { initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { setGlobalOptions } from 'firebase-functions/v2';
import { onDocumentCreated, onDocumentUpdated } from 'firebase-functions/v2/firestore';
import * as logger from 'firebase-functions/logger';
import {
  Appointment, ChatMessage, PushMessage,
  chatPush, isExpoToken, newRequestPushes, sendPushes, statusChangePush,
} from './push';

initializeApp();
const db = getFirestore();

// Base Firestore en eur3 → fonctions en europe-west1. maxInstances plafonne les coûts.
setGlobalOptions({ region: 'europe-west1', maxInstances: 5 });

async function tokenOf(uid: string | null | undefined): Promise<string | null> {
  if (!uid) return null;
  const token = (await db.doc(`users/${uid}`).get()).get('expoPushToken');
  return isExpoToken(token) ? token : null;
}

async function send(messages: PushMessage[], context: string): Promise<void> {
  if (messages.length === 0) return;
  try {
    const { sent, staleTokens } = await sendPushes(messages, fetch);
    logger.info(`${context} : ${sent}/${messages.length} notification(s) envoyée(s)`);
    for (const token of staleTokens) {
      const snap = await db.collection('users').where('expoPushToken', '==', token).get();
      await Promise.all(snap.docs.map((d) => d.ref.update({ expoPushToken: FieldValue.delete() })));
    }
  } catch (err) {
    logger.error(`${context} : échec de l'envoi`, err);
  }
}

/* Nouvelle demande de RDV → tous les interprètes disponibles */
export const notifyNewRequest = onDocumentCreated('appointments/{apptId}', async (event) => {
  const appt = event.data?.data() as Appointment | undefined;
  if (!appt || appt.status !== 'pending') return;
  const interpreters = await db.collection('users').where('role', '==', 'interprete').get();
  const tokens = interpreters.docs
    .filter((d) => d.get('disponible') !== false && d.id !== appt.patientId)
    .map((d) => d.get('expoPushToken'))
    .filter(isExpoToken);
  await send(newRequestPushes(appt, tokens), `Demande ${event.params.apptId}`);
});

/* RDV accepté → patient ; RDV accepté puis annulé → interprète */
export const notifyStatusChange = onDocumentUpdated('appointments/{apptId}', async (event) => {
  const before = event.data?.before.data() as Appointment | undefined;
  const after = event.data?.after.data() as Appointment | undefined;
  if (!before || !after) return;
  const push = statusChangePush(before, after);
  if (!push) return;
  const token = await tokenOf(push.recipientId);
  if (token) await send([push.build(token)], `Statut ${event.params.apptId}`);
});

/* Nouveau message → destinataire */
export const notifyChatMessage = onDocumentCreated('messages/{apptId}/chatMessages/{msgId}', async (event) => {
  const msg = event.data?.data() as ChatMessage | undefined;
  if (!msg || msg.recipientId === msg.senderId) return;
  const token = await tokenOf(msg.recipientId);
  if (token) await send([chatPush(msg, event.params.apptId, token)], `Message ${event.params.msgId}`);
});
