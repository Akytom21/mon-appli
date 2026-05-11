import { useCallback, useEffect, useState } from 'react';
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

// getDocs (one-shot) plutôt que onSnapshot : les formations changent rarement.
// reload() force un nouveau fetch (utilisé par pull-to-refresh).
export function useFormations() {
  const [formations, setFormations] = useState<Formation[]>([]);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
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
  }, [reloadKey]);

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  return { formations, loading, reload };
}
