import { useEffect, useState } from 'react';
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  where,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { HEALTH_PROFESSIONALS, type HealthProfessional } from '@/data/healthProfessionals';

export type FirestoreCategory = 'doctor' | 'specialist' | 'pharmacy';

/* ─── Hook carte : ~25 marqueurs max pour les performances ───
   Hôpitaux (7) viennent du fichier statique.
   Requiert des index composites Firestore (category ASC, name ASC). */

const MAP_LIMITS: Record<FirestoreCategory, number> = {
  doctor:     8,
  specialist: 5,
  pharmacy:   5,
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

/* ─── Helper pagination : charge tous les docs d'une catégorie ─
   Pagine par batches de 500 pour couvrir les grandes collections
   (1 757 spécialistes, 407 généralistes, 202 pharmaciens). */

async function fetchCategoryAll(
  col: ReturnType<typeof collection>,
  category: FirestoreCategory,
  batchSize = 500,
): Promise<HealthProfessional[]> {
  const results: HealthProfessional[] = [];
  let lastVisible: any = null;

  for (;;) {
    const q = lastVisible
      ? query(col, where('category', '==', category), orderBy('name'), startAfter(lastVisible), limit(batchSize))
      : query(col, where('category', '==', category), orderBy('name'), limit(batchSize));

    const snap = await getDocs(q);
    for (const d of snap.docs) {
      const data = d.data();
      results.push({
        id: d.id,
        ...data,
        latitude: Number(data.latitude),
        longitude: Number(data.longitude),
      } as HealthProfessional);
    }

    if (snap.docs.length < batchSize) break;
    lastVisible = snap.docs[snap.docs.length - 1];
  }

  return results;
}

/* ─── Hook recherche : TOUS les professionnels (formulaire RDV) ─
   Requêtes paginées par catégorie pour garantir l'exhaustivité :
   ~407 généralistes + ~1 757 spécialistes + 202 pharmaciens. */

export function useHealthProfessionalsSearch() {
  const [professionals, setProfessionals] = useState<HealthProfessional[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const col = collection(db, 'healthProfessionals');
    const categories: FirestoreCategory[] = ['doctor', 'specialist', 'pharmacy'];

    Promise.all(categories.map((cat) => fetchCategoryAll(col, cat)))
      .then((results) => {
        const fromFirestore = results.flat();
        const hospitals = HEALTH_PROFESSIONALS.filter((h) => h.category === 'hospital');
        setProfessionals([...hospitals, ...fromFirestore]);
        setLoading(false);
      })
      .catch((err) => {
        console.error('[useHealthProfessionalsSearch] Erreur :', err?.code ?? err?.message ?? err);
        setProfessionals(HEALTH_PROFESSIONALS);
        setLoading(false);
      });
  }, []);

  return { professionals, loading };
}
