import { useEffect, useState } from 'react';
import { collectionGroup, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useAuth } from '@/context/AuthContext';

// Returns appointmentId → unread count for the current user, updated in real-time.
// Required Firestore collection group index: chatMessages — (recipientId ASC, read ASC)
export function useUnreadMessages(): Map<string, number> {
  const { user } = useAuth();
  const [unread, setUnread] = useState<Map<string, number>>(new Map());

  useEffect(() => {
    if (!user) return;
    const q = query(
      collectionGroup(db, 'chatMessages'),
      where('recipientId', '==', user.id),
      where('read', '==', false),
    );
    return onSnapshot(
      q,
      (snap) => {
        const counts = new Map<string, number>();
        snap.docs.forEach((d) => {
          const id = d.data().appointmentId as string;
          counts.set(id, (counts.get(id) ?? 0) + 1);
        });
        setUnread(counts);
      },
      (err) => console.error('[UnreadMessages]', err),
    );
  }, [user?.id]);

  return unread;
}
