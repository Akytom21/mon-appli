export const NICE_CENTER = {
  latitude: 43.7102,
  longitude: 7.262,
  latitudeDelta: 0.07,
  longitudeDelta: 0.07,
};

export type Interprete = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  available: boolean;
  specialite: string;
  note: number;
  distance: string;
};

export type DemandeRDV = {
  id: string;
  latitude: number;
  longitude: number;
  besoin: string;
  urgence: boolean;
  heure: string;
  date: string;
  patient: string;
};

export const INTERPRETES_NICE: Interprete[] = [
  { id: '1', name: 'Marie Dupont', latitude: 43.712, longitude: 7.264, available: true, specialite: 'Médical général', note: 4.9, distance: '0.8 km' },
  { id: '2', name: 'Jean-Paul Martin', latitude: 43.708, longitude: 7.259, available: true, specialite: 'Pédiatrie', note: 4.7, distance: '1.2 km' },
  { id: '3', name: 'Sophie Bernard', latitude: 43.715, longitude: 7.268, available: false, specialite: 'Cardiologie', note: 4.8, distance: '2.1 km' },
  { id: '4', name: 'Lucas Rousseau', latitude: 43.706, longitude: 7.272, available: true, specialite: 'Psychiatrie', note: 4.6, distance: '2.5 km' },
  { id: '5', name: 'Emma Laurent', latitude: 43.71, longitude: 7.255, available: false, specialite: 'Généraliste', note: 4.9, distance: '1.8 km' },
];

export const DEMANDES_NICE: DemandeRDV[] = [
  { id: '1', latitude: 43.712, longitude: 7.264, besoin: 'Médecin généraliste', urgence: false, heure: '10h30', date: "Aujourd'hui", patient: 'Patient A.' },
  { id: '2', latitude: 43.708, longitude: 7.259, besoin: 'Psychiatrie', urgence: true, heure: '11h00', date: "Aujourd'hui", patient: 'Patient B.' },
  { id: '3', latitude: 43.715, longitude: 7.268, besoin: 'Spécialiste', urgence: false, heure: '14h00', date: 'Demain', patient: 'Patient C.' },
];
