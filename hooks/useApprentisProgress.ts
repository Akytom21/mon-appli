import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useAuth } from '@/context/AuthContext';
import { useVideoProgress } from './useVideoProgress';

export type Etape = {
  id: number;
  label: string;
  done: boolean;
};

export function useApprentisProgress() {
  const { user } = useAuth();
  const { watchedCount, loaded: videoLoaded } = useVideoProgress();
  const [reservationsCount, setReservationsCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    // Single where clause to avoid composite index requirement; filter status in memory
    const q = query(collection(db, 'reservations'), where('userId', '==', user.id));
    const unsub = onSnapshot(q, (snap) => {
      const confirmed = snap.docs.filter((d) => d.data().status === 'confirmed').length;
      setReservationsCount(confirmed);
    });
    return unsub;
  }, [user?.id]);

  const etapes: Etape[] = [
    {
      id: 1,
      label: 'Introduction à la LSF',
      done: videoLoaded && watchedCount >= 2,
    },
    {
      id: 2,
      label: 'Vocabulaire médical de base',
      done: videoLoaded && watchedCount >= 4,
    },
    {
      id: 3,
      label: 'Mises en situation clinique',
      done: reservationsCount >= 1,
    },
    {
      id: 4,
      label: 'Stage pratique en milieu médical',
      done: user?.brevetSubmitted ?? false,
    },
    {
      id: 5,
      label: 'Examen de certification',
      done: user?.brevetValidated ?? false,
    },
  ];

  const done = etapes.filter((e) => e.done).length;
  const progress = done / etapes.length;

  return { etapes, done, progress };
}
