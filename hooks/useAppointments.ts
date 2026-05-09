import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert } from 'react-native';
import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  QueryDocumentSnapshot,
  serverTimestamp,
  startAfter,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useAuth } from '@/context/AuthContext';

export type AppointmentType = 'generaliste' | 'urgences' | 'specialiste' | 'pharmacie';
export type AppointmentStatus = 'pending' | 'accepted' | 'declined' | 'cancelled';

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
  const [realtimeAppts, setRealtimeAppts] = useState<Appointment[]>([]);
  const [extraAppts, setExtraAppts]       = useState<Appointment[]>([]);
  const [loading, setLoading]             = useState(true);
  const [hasMore, setHasMore]             = useState(false);
  const [loadingMore, setLoadingMore]     = useState(false);
  const lastDocRef = useRef<QueryDocumentSnapshot | null>(null);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    setRealtimeAppts([]);
    setExtraAppts([]);
    setHasMore(false);
    lastDocRef.current = null;

    const q = query(
      collection(db, 'appointments'),
      where('patientId', '==', user.id),
      orderBy('createdAt', 'desc'),
      limit(50),
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        setRealtimeAppts(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Appointment)));
        lastDocRef.current = snap.docs[snap.docs.length - 1] ?? null;
        setHasMore(snap.docs.length === 50);
        setLoading(false);
      },
      () => {
        Alert.alert('Erreur', 'Impossible de charger vos rendez-vous. Vérifiez votre connexion.');
        setLoading(false);
      },
    );

    return unsub;
  }, [user?.id]);

  const loadMore = useCallback(async () => {
    if (!user || !lastDocRef.current || loadingMore) return;
    setLoadingMore(true);
    try {
      const q = query(
        collection(db, 'appointments'),
        where('patientId', '==', user.id),
        orderBy('createdAt', 'desc'),
        startAfter(lastDocRef.current),
        limit(50),
      );
      const snap = await getDocs(q);
      const more = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Appointment));
      setExtraAppts((prev) => [...prev, ...more]);
      if (snap.docs.length > 0) lastDocRef.current = snap.docs[snap.docs.length - 1];
      setHasMore(snap.docs.length === 50);
    } finally {
      setLoadingMore(false);
    }
  }, [user, loadingMore]);

  const cancelAppointment = useCallback(async (id: string) => {
    await updateDoc(doc(db, 'appointments', id), { status: 'cancelled' });
  }, []);

  const appointments = useMemo(() => {
    const map = new Map<string, Appointment>();
    for (const a of realtimeAppts) map.set(a.id, a);
    for (const a of extraAppts) if (!map.has(a.id)) map.set(a.id, a);
    return Array.from(map.values());
  }, [realtimeAppts, extraAppts]);

  return { appointments, loading, hasMore, loadingMore, loadMore, cancelAppointment };
}
