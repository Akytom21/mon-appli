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
  doctor:     15,
  specialist: 10,
  pharmacy:   10,
};

export function useHealthProfessionals(categoryFilter?: FirestoreCategory) {
  const [professionals, setProfessionals] = useState<HealthProfessional[]>([]);
  const [loading, setLoading] = useState(true);

  console.log('[useHealthProfessionals] hook appelé, categoryFilter=', categoryFilter);

  useEffect(() => {
    console.log('[useHealthProfessionals] useEffect déclenché');
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
        console.log(
          `[useHealthProfessionals] Firestore → ${fromFirestore.length} pros` +
          ` (doctor: ${fromFirestore.filter(p => p.category === 'doctor').length}` +
          `, specialist: ${fromFirestore.filter(p => p.category === 'specialist').length}` +
          `, pharmacy: ${fromFirestore.filter(p => p.category === 'pharmacy').length})`,
        );
        console.log('[useHealthProfessionals] Échantillon coordonnées:',
          fromFirestore.slice(0, 3).map(p =>
            `${p.id} lat=${p.latitude} lng=${p.longitude} cat=${p.category}`
          )
        );
        const ids = fromFirestore.map(p => p.id);
        const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
        if (dupes.length) console.warn('[useHealthProfessionals] IDs dupliqués:', dupes.length, dupes.slice(0, 5));
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
