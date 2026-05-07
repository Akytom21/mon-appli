import { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
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

export function useFormations() {
  const [formations, setFormations] = useState<Formation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'formations'),
      (snap) => {
        const data = snap.docs
          .map((d) => ({ id: d.id, ...(d.data() as Omit<Formation, 'id'>) }))
          .sort((a, b) => a.id.localeCompare(b.id));
        setFormations(data);
        setLoading(false);
      },
      () => setLoading(false),
    );
    return unsub;
  }, []);

  return { formations, loading };
}
