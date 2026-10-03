import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { router, type Href } from 'expo-router';
import { collection, collectionGroup, doc, onSnapshot, query, updateDoc, where } from 'firebase/firestore';
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
  // true dès que le jeton push est enregistré : les Cloud Functions (functions/)
  // envoient alors RDV et messages, et les alertes locales ci-dessous se taisent
  // pour éviter les doublons. Dans Expo Go (pas de push), elles restent actives.
  const [pushEnabled, setPushEnabled] = useState(false);

  /* ── Permission + token Expo Push ──────────────────────── */
  useEffect(() => {
    if (!user) return;
    setPushEnabled(false);
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

      try {
        const projectId = Constants.expoConfig?.extra?.eas?.projectId;
        const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
        await updateDoc(doc(db, 'users', user.id), { expoPushToken: token });
        setPushEnabled(true);
      } catch {
        // Expo Go Android (SDK 53+) : pas de push distant — voir docs/notifications.md
      }
    })();
  }, [user?.id]);

  /* ── Clic sur une notification → écran concerné ────────── */
  // Couvre aussi l'appli lancée depuis une notification (démarrage à froid).
  const lastResponse = Notifications.useLastNotificationResponse();
  const handledId = useRef<string | null>(null);
  useEffect(() => {
    if (!user || !lastResponse) return;
    const { identifier, content } = lastResponse.notification.request;
    if (handledId.current === identifier) return;
    handledId.current = identifier;
    const url = content.data?.url;
    if (typeof url === 'string' && url.startsWith('/')) router.push(url as Href);
  }, [lastResponse, user?.id]);

  /* ── Sourd : changements de statut RDV ─────────────────── */
  useEffect(() => {
    if (!user || user.role !== 'sourd' || pushEnabled) return;

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
  }, [user?.id, user?.role, pushEnabled]);

  /* ── Interprète : nouvelles demandes disponibles ────────── */
  useEffect(() => {
    if (!user || user.role !== 'interprete' || pushEnabled) return;

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
  }, [user?.id, user?.role, pushEnabled]);

  /* ── Tous rôles : nouveaux messages de chat ────────────── */
  useEffect(() => {
    if (!user || pushEnabled) return;
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
    }, (err) => console.error('[Chat notif]', err));
  }, [user?.id, pushEnabled]);

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
