import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  limit,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useAuth } from '@/context/AuthContext';

export type AppointmentType = 'generaliste' | 'urgences' | 'specialiste' | 'pharmacie';
export type AppointmentStatus = 'pending' | 'accepted' | 'declined';

export type Appointment = {
  id: string;
  patientName: string;
  patientId: string;
  type: AppointmentType;
  date: string;
  time: string;
  location: string;
  address: string;
  coordinates: { lat: number; lng: number };
  status: AppointmentStatus;
  interpreterId: string | null;
  interpreterName?: string | null;
  declinedBy?: string[];
  createdAt?: { toMillis?: () => number };
};

const TODAY = new Date().toISOString().split('T')[0];

/* ── Hook interprète — deux requêtes ciblées ─────────────────
   Q1 : demandes en attente (max 50) — vues par tous les interprètes
   Q2 : missions acceptées par CET interprète (sans limite)
   ⚠  Remplace l'ancienne requête "collection entière" non filtrée  */
export function useAppointments() {
  const { user } = useAuth();
  const [pendingAppts, setPendingAppts] = useState<Appointment[]>([]);
  const [myAppts, setMyAppts]   = useState<Appointment[]>([]);
  const [loading, setLoading]   = useState(true);

  const uid = user?.id ?? '';

  useEffect(() => {
    if (!uid) { setLoading(false); return; }

    setLoading(true);
    let q1Done = false;
    let q2Done = false;
    const tryFinish = () => { if (q1Done && q2Done) setLoading(false); };

    // Q1 — demandes en attente (limitées à 50)
    const q1 = query(
      collection(db, 'appointments'),
      where('status', '==', 'pending'),
      limit(50),
    );
    const unsub1 = onSnapshot(
      q1,
      (snap) => {
        setPendingAppts(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Appointment)));
        q1Done = true; tryFinish();
      },
      () => { q1Done = true; tryFinish(); },
    );

    // Q2 — missions de cet interprète (accepted)
    const q2 = query(
      collection(db, 'appointments'),
      where('interpreterId', '==', uid),
    );
    const unsub2 = onSnapshot(
      q2,
      (snap) => {
        setMyAppts(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Appointment)));
        q2Done = true; tryFinish();
      },
      () => { q2Done = true; tryFinish(); },
    );

    return () => { unsub1(); unsub2(); };
  }, [uid]);

  const acceptMission = useCallback(async (id: string) => {
    if (!user) return;
    await updateDoc(doc(db, 'appointments', id), {
      status: 'accepted',
      interpreterId: user.id,
      interpreterName: user.name,
    });
  }, [user]);

  const declineMission = useCallback(async (id: string) => {
    if (!user) return;
    await updateDoc(doc(db, 'appointments', id), {
      declinedBy: arrayUnion(user.id),
    });
  }, [user]);

  // Demandes disponibles (exclut celles déjà refusées par cet interprète)
  const pending = useMemo(
    () => pendingAppts.filter((a) => !a.declinedBy?.includes(uid)),
    [pendingAppts, uid],
  );

  // Missions futures acceptées
  const myMissions = useMemo(
    () => myAppts.filter((a) => a.status === 'accepted' && a.date >= TODAY),
    [myAppts],
  );

  // Historique : missions passées acceptées
  const history = useMemo(
    () => myAppts
      .filter((a) => a.status === 'accepted' && a.date < TODAY)
      .sort((a, b) => b.date.localeCompare(a.date)),
    [myAppts],
  );

  return { pending, myMissions, history, loading, acceptMission, declineMission };
}

/* ── Création d'un RDV par le patient ─────────────────────── */
export function useCreateAppointment() {
  const { user } = useAuth();

  return useCallback(async (data: {
    professionalName: string;
    professionalAddress: string;
    professionalType: AppointmentType;
    date: string;
    time: string;
    coordinates?: { lat: number; lng: number };
  }): Promise<string> => {
    if (!user) throw new Error('Non authentifié');
    const docRef = await addDoc(collection(db, 'appointments'), {
      patientId: user.id,
      patientName: user.name,
      type: data.professionalType,
      date: data.date,
      time: data.time,
      location: data.professionalName,
      address: data.professionalAddress,
      coordinates: data.coordinates ?? { lat: 43.7102, lng: 7.262 },
      status: 'pending',
      interpreterId: null,
      interpreterName: null,
      declinedBy: [],
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  }, [user]);
}

/* ── RDV du patient en temps réel ─────────────────────────── */
export function usePatientAppointments() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }

    const q = query(
      collection(db, 'appointments'),
      where('patientId', '==', user.id),
    );

    const unsub = onSnapshot(q, (snap) => {
      const docs = snap.docs
        .map((d) => ({ id: d.id, ...d.data() } as Appointment))
        .sort((a, b) => {
          const ta = a.createdAt?.toMillis?.() ?? 0;
          const tb = b.createdAt?.toMillis?.() ?? 0;
          return tb - ta;
        });
      setAppointments(docs);
      setLoading(false);
    });

    return unsub;
  }, [user?.id]);

  return { appointments, loading };
}
