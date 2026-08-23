import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { collection, collectionGroup, doc, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useAuth } from '@/context/AuthContext';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function scheduleLocal(title: string, body: string) {
  try {
    await Notifications.scheduleNotificationAsync({
      content: { title, body },
      trigger: null,
    });
  } catch {}
}

export function useNotifications() {
  const { user } = useAuth();

  /* ── Permission + token Expo Push ──────────────────────── */
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') return;

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'PharmaSign',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#0F766E',
        });
      }

      // Les notifications push distantes nécessitent un development build — voir docs/notifications.md
    })();
  }, [user?.id]);

  /* ── Sourd : changements de statut RDV ─────────────────── */
  useEffect(() => {
    if (!user || user.role !== 'sourd') return;

    const prevStatus: Record<string, string> = {};
    let firstLoad = true;

    const q = query(collection(db, 'appointments'), where('patientId', '==', user.id));
    return onSnapshot(q, (snap) => {
      if (firstLoad) {
        snap.docs.forEach((d) => { prevStatus[d.id] = d.data().status; });
        firstLoad = false;
        return;
      }
      snap.docChanges().forEach((change) => {
        if (change.type === 'added') {
          prevStatus[change.doc.id] = change.doc.data().status;
          return;
        }
        if (change.type !== 'modified') return;
        const prev = prevStatus[change.doc.id];
        const curr = change.doc.data().status;
        const name = change.doc.data().interpreterName ?? 'Un interprète';
        if (prev === 'pending' && curr === 'accepted') {
          scheduleLocal('RDV confirmé ! ✅', `${name} a accepté votre demande d'interprétation.`);
        } else if (prev === 'pending' && curr === 'declined') {
          scheduleLocal('RDV non attribué', 'Aucun interprète disponible. Vous pouvez reprogrammer.');
        }
        prevStatus[change.doc.id] = curr;
      });
    });
  }, [user?.id, user?.role]);

  /* ── Interprète : nouvelles demandes disponibles ────────── */
  useEffect(() => {
    if (!user || user.role !== 'interprete') return;

    const known = new Set<string>();
    let firstLoad = true;

    const q = query(collection(db, 'appointments'), where('status', '==', 'pending'));
    return onSnapshot(q, (snap) => {
      if (firstLoad) {
        snap.docs.forEach((d) => known.add(d.id));
        firstLoad = false;
        return;
      }
      snap.docChanges().forEach((change) => {
        if (change.type === 'added' && !known.has(change.doc.id)) {
          const data = change.doc.data();
          const urgent = data.type === 'urgences';
          scheduleLocal(
            urgent ? '🚨 Urgence à proximité !' : 'Nouvelle demande de RDV',
            `${data.patientName} recherche un interprète LSF.`,
          );
        }
        if (change.type === 'added') known.add(change.doc.id);
      });
    });
  }, [user?.id, user?.role]);

  /* ── Tous rôles : nouveaux messages de chat ────────────── */
  useEffect(() => {
    if (!user) return;
    const knownIds = new Set<string>();
    let firstLoad = true;
    const q = query(
      collectionGroup(db, 'chatMessages'),
      where('recipientId', '==', user.id),
      where('read', '==', false),
    );
    return onSnapshot(q, (snap) => {
      if (firstLoad) {
        snap.docs.forEach((d) => knownIds.add(d.id));
        firstLoad = false;
        return;
      }
      snap.docChanges().forEach((change) => {
        if (change.type === 'added' && !knownIds.has(change.doc.id)) {
          const data = change.doc.data();
          const preview = String(data.text ?? '');
          scheduleLocal(
            '💬 Nouveau message',
            `${data.senderName} : ${preview.slice(0, 60)}${preview.length > 60 ? '…' : ''}`,
          );
          knownIds.add(change.doc.id);
        }
      });
    }, () => { /* permissions Firestore non encore accordées — silencieux */ });
  }, [user?.id]);

  /* ── Apprenti : validation / refus brevet ───────────────── */
  useEffect(() => {
    if (!user || user.role !== 'apprenti') return;

    let prevValidated: boolean | undefined;
    let prevRefused: boolean | undefined;
    let firstLoad = true;

    return onSnapshot(doc(db, 'users', user.id), (snap) => {
      const data = snap.data();
      if (!data) return;
      if (firstLoad) {
        prevValidated = data.brevetValidated;
        prevRefused = data.brevetRefused;
        firstLoad = false;
        return;
      }
      if (!prevValidated && data.brevetValidated) {
        scheduleLocal(
          'Brevet LSF validé ! 🏆',
          'Félicitations ! Vous pouvez maintenant devenir interprète agréé PharmaSign.',
        );
      } else if (!prevRefused && data.brevetRefused) {
        const reason = data.brevetRefusalReason;
        scheduleLocal(
          'Brevet LSF non retenu',
          reason ? `Raison : ${reason}` : "Votre dossier n'a pas été retenu par le jury.",
        );
      }
      prevValidated = data.brevetValidated;
      prevRefused = data.brevetRefused;
    });
  }, [user?.id, user?.role]);
}
