import { useEffect, useState } from 'react';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '@/config/firebase';

export type Formation = {
  id: string;
  titre: string;
  niveau: string;
  formateur: string;
  date: string;
  heure: string;
  places: number;
  lieu: string;
  description: string;
  prix: string;
};

// getDocs (one-shot) plutôt que onSnapshot : les formations changent rarement
// et on évite ainsi un listener Firestore permanent sur un onglet inactif.
export function useFormations() {
  const [formations, setFormations] = useState<Formation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getDocs(query(collection(db, 'formations'), orderBy('date')))
      .then((snap) => {
        if (cancelled) return;
        setFormations(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Formation, 'id'>) })));
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  return { formations, loading };
}
