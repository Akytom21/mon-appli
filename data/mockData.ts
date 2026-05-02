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
  status: 'available' | 'busy' | 'en-route';
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
  { id: '1', name: 'Marie Dupont',     latitude: 43.7120, longitude: 7.2640, available: true,  status: 'available', specialite: 'Médical général', note: 4.9, distance: '0.8 km' },
  { id: '2', name: 'Jean-Paul Martin', latitude: 43.7080, longitude: 7.2590, available: true,  status: 'available', specialite: 'Pédiatrie',       note: 4.7, distance: '1.2 km' },
  { id: '3', name: 'Sophie Bernard',   latitude: 43.7150, longitude: 7.2680, available: false, status: 'busy',      specialite: 'Cardiologie',     note: 4.8, distance: '2.1 km' },
  { id: '4', name: 'Lucas Rousseau',   latitude: 43.7060, longitude: 7.2720, available: true,  status: 'en-route',  specialite: 'Psychiatrie',     note: 4.6, distance: '2.5 km' },
  { id: '5', name: 'Emma Laurent',     latitude: 43.7100, longitude: 7.2550, available: false, status: 'busy',      specialite: 'Généraliste',     note: 4.9, distance: '1.8 km' },
];

export const DEMANDES_NICE: DemandeRDV[] = [
  { id: '1', latitude: 43.712, longitude: 7.264, besoin: 'Médecin généraliste', urgence: false, heure: '10h30', date: "Aujourd'hui", patient: 'Patient A.' },
  { id: '2', latitude: 43.708, longitude: 7.259, besoin: 'Psychiatrie', urgence: true, heure: '11h00', date: "Aujourd'hui", patient: 'Patient B.' },
  { id: '3', latitude: 43.715, longitude: 7.268, besoin: 'Spécialiste', urgence: false, heure: '14h00', date: 'Demain', patient: 'Patient C.' },
];
