import { useEffect, useRef, useState } from 'react';
import {
  collection,
  doc,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useAuth } from '@/context/AuthContext';

type InterpreterStats = {
  missionsThisMonth: number | null;
  averageRating: number | null;
  acceptanceRate: number | null;
};

export function useInterpreterStats(): InterpreterStats {
  const { user } = useAuth();
  const uid = user?.id ?? '';

  const [missionsThisMonth, setMissionsThisMonth] = useState<number | null>(null);
  const [averageRating, setAverageRating]         = useState<number | null>(null);
  const [acceptanceRate, setAcceptanceRate]       = useState<number | null>(null);

  // Refs partagés entre les deux listeners du taux d'acceptation
  const acceptedRef      = useRef(0);
  const declinedRef      = useRef(0);
  const acceptedReadyRef = useRef(false);
  const declinedReadyRef = useRef(false);

  useEffect(() => {
    if (!uid) return;

    acceptedRef.current      = 0;
    declinedRef.current      = 0;
    acceptedReadyRef.current = false;
    declinedReadyRef.current = false;

    const now         = new Date();
    const firstDayStr = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString().split('T')[0]; // "YYYY-MM-01"
    const lastDayStr  = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      .toISOString().split('T')[0]; // dernier jour du mois

    const updateRate = () => {
      if (!acceptedReadyRef.current || !declinedReadyRef.current) return;
      const total = acceptedRef.current + declinedRef.current;
      setAcceptanceRate(total > 0 ? Math.round((acceptedRef.current / total) * 100) : null);
    };

    // Q1 — missions acceptées par cet interprète
    // Sert à la fois pour "missions ce mois" (filtré côté client)
    // et pour le numérateur/dénominateur du taux d'acceptation.
    const qAccepted = query(
      collection(db, 'appointments'),
      where('interpreterId', '==', uid),
      where('status', '==', 'accepted'),
    );
    const unsubAccepted = onSnapshot(
      qAccepted,
      (snap) => {
        const count = snap.docs.filter((d) => {
          const date = d.data().date as string | undefined;
          return date !== undefined && date >= firstDayStr && date <= lastDayStr;
        }).length;
        setMissionsThisMonth(count > 0 ? count : null);

        acceptedRef.current      = snap.size;
        acceptedReadyRef.current = true;
        updateRate();
      },
      () => {},
    );

    // Q2 — note moyenne stockée dans users/{uid} (mise à jour par submitReview)
    const unsubUser = onSnapshot(
      doc(db, 'users', uid),
      (snap) => {
        const rating = snap.data()?.averageRating;
        setAverageRating(typeof rating === 'number' ? rating : null);
      },
      () => {},
    );

    // Q3 — missions refusées par cet interprète (declinedBy array-contains)
    const qDeclined = query(
      collection(db, 'appointments'),
      where('declinedBy', 'array-contains', uid),
    );
    const unsubDeclined = onSnapshot(
      qDeclined,
      (snap) => {
        declinedRef.current      = snap.size;
        declinedReadyRef.current = true;
        updateRate();
      },
      () => {},
    );

    return () => { unsubAccepted(); unsubUser(); unsubDeclined(); };
  }, [uid]);

  return { missionsThisMonth, averageRating, acceptanceRate };
}
