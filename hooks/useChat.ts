import { useCallback, useEffect, useState } from 'react';
import {
  addDoc,
  collection,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useAuth } from '@/context/AuthContext';

export type ChatMessage = {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  recipientId: string;
  text: string;
  createdAt: { toMillis: () => number } | null;
  read: boolean;
  appointmentId: string;
};

// Subcollection path: messages/{appointmentId}/chatMessages/{messageId}
// Required Firestore index (collection group): chatMessages — recipientId ASC, read ASC
function chatCol(appointmentId: string) {
  return collection(db, 'messages', appointmentId, 'chatMessages');
}

export function useChat(appointmentId: string, recipientId: string) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading]   = useState(true);
  const [sending, setSending]   = useState(false);

  useEffect(() => {
    if (!appointmentId) return;
    const q = query(chatCol(appointmentId), orderBy('createdAt', 'asc'));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() } as ChatMessage)));
        setLoading(false);
      },
      (err) => {
        console.error('[Chat] onSnapshot error:', err);
        setLoading(false);
      },
    );
    return unsub;
  }, [appointmentId]);

  const markAllRead = useCallback(async () => {
    if (!user || !appointmentId) return;
    try {
      const snap = await getDocs(
        query(
          chatCol(appointmentId),
          where('recipientId', '==', user.id),
          where('read', '==', false),
        ),
      );
      if (snap.empty) return;
      const batch = writeBatch(db);
      snap.docs.forEach((d) => batch.update(d.ref, { read: true }));
      await batch.commit();
    } catch {}
  }, [appointmentId, user?.id]);

  const sendMessage = useCallback(async (text: string) => {
    if (!user || !text.trim() || !recipientId) return;
    setSending(true);
    try {
      await addDoc(chatCol(appointmentId), {
        senderId: user.id,
        senderName: user.name,
        senderRole: user.role,
        recipientId,
        text: text.trim(),
        createdAt: serverTimestamp(),
        read: false,
        appointmentId,
      });
    } catch (err) {
      console.error('[Chat] sendMessage error:', err);
    } finally {
      setSending(false);
    }
  }, [user, appointmentId, recipientId]);

  return { messages, loading, sending, sendMessage, markAllRead };
}
