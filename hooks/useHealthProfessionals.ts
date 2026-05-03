import { useEffect, useState } from 'react';
import { collection, getDocs, limit, query, where } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { HEALTH_PROFESSIONALS, type HealthProfessional } from '@/data/healthProfessionals';

export type FirestoreCategory = 'doctor' | 'specialist' | 'pharmacy';

export function useHealthProfessionals(categoryFilter?: FirestoreCategory) {
  const [professionals, setProfessionals] = useState<HealthProfessional[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const col = collection(db, 'healthProfessionals');

    const queries = categoryFilter
      ? [getDocs(query(col, where('category', '==', categoryFilter), limit(100)))]
      : [
          getDocs(query(col, where('category', '==', 'doctor'), limit(50))),
          getDocs(query(col, where('category', '==', 'specialist'), limit(50))),
          getDocs(query(col, where('category', '==', 'pharmacy'), limit(50))),
        ];

    Promise.all(queries)
      .then((snaps) => {
        const fromFirestore: HealthProfessional[] = snaps.flatMap((snap) =>
          snap.docs.map((d) => ({ id: d.id, ...d.data() } as HealthProfessional)),
        );
        const hospitals = HEALTH_PROFESSIONALS.filter((h) => h.category === 'hospital');
        setProfessionals(categoryFilter ? fromFirestore : [...hospitals, ...fromFirestore]);
        setLoading(false);
      })
      .catch(() => {
        setProfessionals(categoryFilter ? [] : HEALTH_PROFESSIONALS);
        setLoading(false);
      });
  }, [categoryFilter]);

  return { professionals, loading };
}
