import { useEffect, useState } from 'react';
import { collection, getDocs, limit, orderBy, query, where } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { HEALTH_PROFESSIONALS, type HealthProfessional } from '@/data/healthProfessionals';

/* ─── Hook carte : limité pour les performances (marqueurs) ─
   Requiert des index composites Firestore (category ASC, name ASC).
   Si Firestore renvoie une erreur d'index, le message contient
   un lien direct pour les créer en un clic dans la console Firebase. */

export type FirestoreCategory = 'doctor' | 'specialist' | 'pharmacy';

const MAP_LIMITS: Record<FirestoreCategory, number> = {
  doctor:     100,
  specialist: 150,
  pharmacy:   202,
};

export function useHealthProfessionals(categoryFilter?: FirestoreCategory) {
  const [professionals, setProfessionals] = useState<HealthProfessional[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const col = collection(db, 'healthProfessionals');

    const queries = categoryFilter
      ? [getDocs(query(col, where('category', '==', categoryFilter), orderBy('name'), limit(MAP_LIMITS[categoryFilter])))]
      : [
          getDocs(query(col, where('category', '==', 'doctor'),     orderBy('name'), limit(MAP_LIMITS.doctor))),
          getDocs(query(col, where('category', '==', 'specialist'), orderBy('name'), limit(MAP_LIMITS.specialist))),
          getDocs(query(col, where('category', '==', 'pharmacy'),   orderBy('name'), limit(MAP_LIMITS.pharmacy))),
        ];

    Promise.all(queries)
      .then((snaps) => {
        const fromFirestore: HealthProfessional[] = snaps.flatMap((snap) =>
          snap.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              ...data,
              latitude: Number(data.latitude),
              longitude: Number(data.longitude),
            } as HealthProfessional;
          }),
        );
        // Les hôpitaux viennent du fichier statique (absents des données RPPS)
        const hospitals = HEALTH_PROFESSIONALS.filter((h) => h.category === 'hospital');
        setProfessionals(categoryFilter ? fromFirestore : [...hospitals, ...fromFirestore]);
        setLoading(false);
      })
      .catch((err) => {
        console.error('[useHealthProfessionals] Erreur Firestore :', err?.code ?? err?.message ?? err);
        setProfessionals(categoryFilter ? [] : HEALTH_PROFESSIONALS);
        setLoading(false);
      });
  }, [categoryFilter]);

  return { professionals, loading };
}

/* ─── Hook recherche : tous les documents, pas de limite ──── */

export function useHealthProfessionalsSearch() {
  const [professionals, setProfessionals] = useState<HealthProfessional[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDocs(collection(db, 'healthProfessionals'))
      .then((snap) => {
        const results: HealthProfessional[] = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            ...data,
            latitude: Number(data.latitude),
            longitude: Number(data.longitude),
          } as HealthProfessional;
        });
        setProfessionals(results);
        setLoading(false);
      })
      .catch((err) => {
        console.error('[useHealthProfessionalsSearch] Erreur :', err?.code ?? err?.message ?? err);
        setLoading(false);
      });
  }, []);

  return { professionals, loading };
}
