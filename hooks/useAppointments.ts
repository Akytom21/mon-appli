import { useEffect, useState } from 'react';
import {
  addDoc,
  arrayUnion,
  collection,
  doc,
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

export function useAppointments() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'appointments'), (snap) => {
      setAppointments(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Appointment)));
      setLoading(false);
    });
    return unsub;
  }, []);

  const acceptMission = async (id: string) => {
    if (!user) return;
    await updateDoc(doc(db, 'appointments', id), {
      status: 'accepted',
      interpreterId: user.id,
      interpreterName: user.name,
    });
  };

  const declineMission = async (id: string) => {
    if (!user) return;
    await updateDoc(doc(db, 'appointments', id), {
      declinedBy: arrayUnion(user.id),
    });
  };

  const uid = user?.id ?? '';

  const pending = appointments.filter(
    (a) => a.status === 'pending' && !a.declinedBy?.includes(uid)
  );

  const myMissions = appointments.filter(
    (a) => a.status === 'accepted' && a.interpreterId === uid && a.date >= TODAY
  );

  const history = appointments.filter(
    (a) =>
      (a.status === 'accepted' && a.interpreterId === uid && a.date < TODAY) ||
      a.declinedBy?.includes(uid)
  );

  return { appointments, pending, myMissions, history, loading, acceptMission, declineMission };
}

/* ── Création d'un RDV par le patient ─────────────────────── */
export function useCreateAppointment() {
  const { user } = useAuth();

  return async (data: {
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
  };
}

/* ── RDV du patient en temps réel ─────────────────────────── */
export function usePatientAppointments() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'appointments'),
      where('patientId', '==', user.id)
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
