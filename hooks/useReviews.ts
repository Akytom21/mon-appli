import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import {
  addDoc,
  collection,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  doc,
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
      await addDoc(collection(db, 'reviews'), {
        appointmentId,
        patientId: user.id,
        interpreterId,
        rating,
        comment: comment.trim(),
        createdAt: serverTimestamp(),
      });

      // Recalcule la note moyenne de l'interprète
      const snap = await getDocs(
        query(collection(db, 'reviews'), where('interpreterId', '==', interpreterId)),
      );
      const ratings = snap.docs.map((d) => d.data().rating as number);
      const avg = ratings.reduce((s, r) => s + r, 0) / ratings.length;
      await updateDoc(doc(db, 'users', interpreterId), {
        averageRating: Math.round(avg * 10) / 10,
        reviewCount: ratings.length,
      });
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
