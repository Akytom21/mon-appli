import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import {
  addDoc,
  collection,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  where,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useAuth } from '@/context/AuthContext';

export type Review = {
  id: string;
  appointmentId: string;
  patientId: string;
  interpreterId: string;
  rating: number;
  comment: string;
  createdAt: any;
};

/* ── Notes soumises par un patient ───────────────────────────── */
export function usePatientReviews() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'reviews'), where('patientId', '==', user.id));
    const unsub = onSnapshot(q, (snap) => {
      setReviews(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Review)));
    });
    return unsub;
  }, [user?.id]);

  const submitReview = async (
    appointmentId: string,
    interpreterId: string,
    rating: number,
    comment: string,
  ): Promise<void> => {
    if (!user) return;
    setSubmitting(true);
    try {
      // Guard: one review per patient per appointment
      const dupSnap = await getDocs(
        query(
          collection(db, 'reviews'),
          where('appointmentId', '==', appointmentId),
          where('patientId', '==', user.id),
        ),
      );
      if (!dupSnap.empty) {
        Alert.alert('Avis déjà soumis', 'Vous avez déjà noté ce rendez-vous.');
        setSubmitting(false);
        return;
      }

      await addDoc(collection(db, 'reviews'), {
        appointmentId,
        patientId: user.id,
        interpreterId,
        rating,
        comment: comment.trim(),
        createdAt: serverTimestamp(),
      });
      // La note moyenne est calculée côté interprète à partir de ses avis
      // (un patient ne peut pas lire les avis des autres patients).
    } catch {
      Alert.alert('Erreur', 'Impossible d\'envoyer votre avis. Veuillez réessayer.');
    } finally {
      setSubmitting(false);
    }
  };

  return { reviews, submitting, submitReview };
}

/* ── Notes reçues par un interprète ─────────────────────────── */
export function useInterpreterReviews() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [averageRating, setAverageRating] = useState<number | null>(null);

  useEffect(() => {
    if (!user || user.role !== 'interprete') return;
    const q = query(collection(db, 'reviews'), where('interpreterId', '==', user.id));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Review));
      setReviews(data);
      if (data.length > 0) {
        const avg = data.reduce((s, r) => s + r.rating, 0) / data.length;
        setAverageRating(Math.round(avg * 10) / 10);
      }
    });
    return unsub;
  }, [user?.id]);

  return { reviews, averageRating };
}
