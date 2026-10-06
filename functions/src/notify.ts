/* Envoi des notifications push et nettoyage des jetons invalides. */
import './options';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import * as logger from 'firebase-functions/logger';
import { PushMessage, isExpoToken, sendPushes } from './push';

export async function tokenOf(uid: string | null | undefined): Promise<string | null> {
  if (!uid) return null;
  const token = (await getFirestore().doc(`users/${uid}`).get()).get('expoPushToken');
  return isExpoToken(token) ? token : null;
}

/* false si le service Expo n'a pas pu être joint (l'erreur est journalisée) */
export async function send(messages: PushMessage[], context: string): Promise<boolean> {
  if (messages.length === 0) return true;
  try {
    const { sent, staleTokens } = await sendPushes(messages, fetch);
    logger.info(`${context} : ${sent}/${messages.length} notification(s) envoyée(s)`);
    for (const token of staleTokens) {
      const snap = await getFirestore().collection('users').where('expoPushToken', '==', token).get();
      await Promise.all(snap.docs.map((d) => d.ref.update({ expoPushToken: FieldValue.delete() })));
    }
    return true;
  } catch (err) {
    logger.error(`${context} : échec de l'envoi`, err);
    return false;
  }
}
