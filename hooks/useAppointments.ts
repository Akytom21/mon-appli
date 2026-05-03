import { useEffect, useRef, useState } from 'react';
import {
  arrayUnion,
  collection,
  doc,
  onSnapshot,
  updateDoc,
  writeBatch,
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
  declinedBy?: string[];
};

const TODAY = '2026-05-03';

export function useAppointments() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const seeded = useRef(false);
  const userRef = useRef(user);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'appointments'), async (snap) => {
      if (snap.empty && !seeded.current) {
        seeded.current = true;
        const uid = userRef.current?.id ?? 'demo';

        const DEMO: Omit<Appointment, 'id'>[] = [
          {
            patientName: 'Sophie Lemaire', patientId: 'p001', type: 'generaliste',
            date: '2026-05-05', time: '09:30', location: 'Cabinet Dr. Martin',
            address: '12 rue Masséna, Nice', coordinates: { lat: 43.6961, lng: 7.2686 },
            status: 'pending', interpreterId: null,
          },
          {
            patientName: 'Thomas Girard', patientId: 'p002', type: 'urgences',
            date: '2026-05-04', time: '14:00', location: 'CHU de Nice – Urgences',
            address: '4 av. Reine Victoria, Nice', coordinates: { lat: 43.7102, lng: 7.262 },
            status: 'pending', interpreterId: null,
          },
          {
            patientName: 'Isabelle Perrin', patientId: 'p003', type: 'specialiste',
            date: '2026-05-07', time: '11:00', location: 'Clinique Saint-Georges',
            address: '2 av. Camus, Nice', coordinates: { lat: 43.708, lng: 7.2631 },
            status: 'pending', interpreterId: null,
          },
          {
            patientName: 'Marc Dubois', patientId: 'p004', type: 'pharmacie',
            date: '2026-05-06', time: '16:30', location: 'Pharmacie Centrale',
            address: '37 av. Jean Médecin, Nice', coordinates: { lat: 43.6982, lng: 7.2712 },
            status: 'pending', interpreterId: null,
          },
          {
            patientName: 'Émilie Rousseau', patientId: 'p005', type: 'specialiste',
            date: '2026-05-08', time: '10:00', location: 'Centre médical Pasteur',
            address: '89 bd de Cimiez, Nice', coordinates: { lat: 43.7191, lng: 7.2783 },
            status: 'pending', interpreterId: null,
          },
          {
            patientName: 'Antoine Lefevre', patientId: 'p006', type: 'generaliste',
            date: '2026-05-12', time: '08:45', location: 'Maison médicale Vieux-Nice',
            address: '5 rue du Marché, Nice', coordinates: { lat: 43.6952, lng: 7.2772 },
            status: 'accepted', interpreterId: uid,
          },
          {
            patientName: 'Claire Morin', patientId: 'p007', type: 'generaliste',
            date: '2026-04-28', time: '09:00', location: 'Cabinet Dr. Blanc',
            address: '8 rue de France, Nice', coordinates: { lat: 43.6967, lng: 7.2627 },
            status: 'accepted', interpreterId: uid,
          },
          {
            patientName: 'Pierre Fabre', patientId: 'p008', type: 'specialiste',
            date: '2026-04-25', time: '14:30', location: 'Hôpital Pasteur',
            address: '30 av. de la Voie Romaine, Nice', coordinates: { lat: 43.7095, lng: 7.256 },
            status: 'accepted', interpreterId: uid,
          },
        ];

        const batch = writeBatch(db);
        for (const item of DEMO) {
          const ref = doc(collection(db, 'appointments'));
          batch.set(ref, item);
        }
        await batch.commit();
        return;
      }

      setAppointments(
        snap.docs.map((d) => ({ id: d.id, ...d.data() } as Appointment))
      );
      setLoading(false);
    });

    return unsub;
  }, []);

  const acceptMission = async (id: string) => {
    if (!user) return;
    await updateDoc(doc(db, 'appointments', id), {
      status: 'accepted',
      interpreterId: user.id,
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
