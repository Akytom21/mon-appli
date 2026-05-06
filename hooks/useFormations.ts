import { useEffect, useState } from 'react';
import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  setDoc,
} from 'firebase/firestore';
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

const SEED: { id: string; data: Omit<Formation, 'id'> }[] = [
  {
    id: 'formation-1',
    data: {
      titre: "Introduction à l'interprétariat médical",
      niveau: 'Débutant',
      formateur: 'Marie Dupont',
      date: 'Samedi 24 mai 2026',
      heure: '10h00 – 12h00',
      places: 8,
      lieu: 'En visioconférence',
      description:
        "Découverte du métier d'interprète LSF en contexte médical. Règles déontologiques, posture professionnelle et premiers exercices.",
      prix: 'Gratuit (formation agréée)',
    },
  },
  {
    id: 'formation-2',
    data: {
      titre: 'Mises en situation clinique',
      niveau: 'Intermédiaire',
      formateur: 'Dr. Claire Lefèvre',
      date: 'Samedi 10 mai 2026',
      heure: '09h00 – 13h00',
      places: 3,
      lieu: 'Centre de formation LSF, Paris 9e',
      description:
        'Entraînement pratique avec des médecins partenaires. Simulations de consultations réelles en LSF avec retour personnalisé.',
      prix: 'Gratuit (formation agréée)',
    },
  },
  {
    id: 'formation-3',
    data: {
      titre: 'Vocabulaire médical avancé',
      niveau: 'Avancé',
      formateur: 'Antoine Garnier',
      date: 'Dimanche 11 mai 2026',
      heure: '14h00 – 18h00',
      places: 5,
      lieu: 'En visioconférence',
      description:
        'Approfondissement du vocabulaire médical en LSF : cardiologie, neurologie, psychiatrie. Exercices interactifs en groupe.',
      prix: 'Gratuit (formation agréée)',
    },
  },
  {
    id: 'formation-4',
    data: {
      titre: 'Urgences et soins intensifs',
      niveau: 'Expert',
      formateur: 'Sarah Nguyen',
      date: 'Samedi 17 mai 2026',
      heure: '09h00 – 17h00',
      places: 1,
      lieu: 'Hôpital de simulation, Paris 15e',
      description:
        "Formation intensive en environnement hospitalier simulé. Gestion des situations d'urgence en LSF.",
      prix: 'Gratuit (formation agréée)',
    },
  },
];

// Uses fixed IDs → setDoc is idempotent, safe to call concurrently
async function seedIfEmpty() {
  const snap = await getDocs(collection(db, 'formations'));
  if (!snap.empty) return;
  await Promise.all(SEED.map(({ id, data }) => setDoc(doc(db, 'formations', id), data)));
}

export function useFormations() {
  const [formations, setFormations] = useState<Formation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    seedIfEmpty().then(() => {
      unsubscribe = onSnapshot(
        query(collection(db, 'formations')),
        (snap) => {
          const data = snap.docs
            .map((d) => ({ id: d.id, ...(d.data() as Omit<Formation, 'id'>) }))
            .sort((a, b) => a.id.localeCompare(b.id));
          setFormations(data);
          setLoading(false);
        },
        () => setLoading(false)
      );
    });

    return () => unsubscribe?.();
  }, []);

  return { formations, loading };
}
