export type HealthCategory = 'hospital' | 'pharmacy' | 'doctor' | 'specialist';

export type MedicalEquipmentCategory =
  | 'fauteuil-roulant'
  | 'location-materiel'
  | 'orthopedie'
  | 'incontinence'
  | 'diabete';

export const EQUIPMENT_CATEGORIES: { id: MedicalEquipmentCategory; label: string; emoji: string }[] = [
  { id: 'fauteuil-roulant',  label: 'Fauteuils roulants',  emoji: '♿' },
  { id: 'location-materiel', label: 'Location matériel',   emoji: '🔄' },
  { id: 'orthopedie',        label: 'Orthopédie',          emoji: '🦴' },
  { id: 'incontinence',      label: 'Incontinence',        emoji: '💧' },
  { id: 'diabete',           label: 'Diabète',             emoji: '💉' },
];

export const CATEGORY_CONFIG: Record<
  HealthCategory,
  { label: string; emoji: string; color: string }
> = {
  hospital:   { label: 'Hôpital / Urgences',  emoji: '🏥', color: '#DC2626' },
  pharmacy:   { label: 'Pharmacie',            emoji: '💊', color: '#16A34A' },
  doctor:     { label: 'Médecin généraliste',  emoji: '🩺', color: '#2563EB' },
  specialist: { label: 'Spécialiste',          emoji: '👨‍⚕️', color: '#EA580C' },
};

export type HealthProfessional = {
  id: string;
  name: string;
  address: string;
  category: HealthCategory;
  latitude: number;
  longitude: number;
  phone: string;
  hours: string;
  specialite?: string;
  medicalEquipment?: {
    hasEquipment: boolean;
    categories: MedicalEquipmentCategory[];
    lastUpdated: any;
  };
};

// Hôpitaux réels de Nice — non présents dans les données RPPS, maintenus ici en dur
export const HEALTH_PROFESSIONALS: HealthProfessional[] = [
  {
    id: 'h1',
    name: 'CHU Hôpital Pasteur',
    address: '30 Avenue de la Voie Romaine, Nice 06001',
    category: 'hospital',
    latitude: 43.7073,
    longitude: 7.2682,
    phone: '04 92 03 33 75',
    hours: 'Urgences 24h/24 · 7j/7',
  },
  {
    id: 'h2',
    name: "CHU Hôpital L'Archet",
    address: '151 Route Saint-Antoine de Ginestière, Nice 06200',
    category: 'hospital',
    latitude: 43.6742,
    longitude: 7.2198,
    phone: '04 92 03 60 00',
    hours: 'Urgences 24h/24 · 7j/7',
  },
  {
    id: 'h3',
    name: 'CHU Hôpital Saint-Roch',
    address: '5 Rue Pierre Dévoluy, Nice 06000',
    category: 'hospital',
    latitude: 43.7009,
    longitude: 7.2747,
    phone: '04 92 03 33 75',
    hours: 'Urgences 24h/24 · 7j/7',
  },
  {
    id: 'h4',
    name: 'CHU Hôpital Cimiez',
    address: '4 Avenue Reine Victoria, Nice 06010',
    category: 'hospital',
    latitude: 43.7198,
    longitude: 7.2731,
    phone: '04 92 03 77 77',
    hours: 'Lun–Ven 8h–18h',
  },
  {
    id: 'h5',
    name: 'Hôpitaux pédiatriques Lenval',
    address: '57 Avenue de la Californie, Nice 06200',
    category: 'hospital',
    latitude: 43.6978,
    longitude: 7.2389,
    phone: '04 92 03 03 92',
    hours: 'Urgences pédiatriques 24h/24',
  },
  {
    id: 'h6',
    name: 'Clinique Saint-George',
    address: '2 Avenue Notre-Dame, Nice 06000',
    category: 'hospital',
    latitude: 43.7156,
    longitude: 7.2512,
    phone: '04 92 17 20 00',
    hours: 'Lun–Ven 7h–20h · Sam 8h–14h',
  },
  {
    id: 'h7',
    name: 'Clinique du Parc Impérial',
    address: '31 Avenue de Suède, Nice 06000',
    category: 'hospital',
    latitude: 43.7134,
    longitude: 7.2467,
    phone: '04 93 88 15 12',
    hours: 'Lun–Sam 7h30–19h',
  },
];
