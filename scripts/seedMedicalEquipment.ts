/**
 * Marque 15 pharmacies de Nice avec leur matériel médical dans Firestore.
 *
 * Usage: npx tsx scripts/seedMedicalEquipment.ts
 * Prérequis: variable GOOGLE_APPLICATION_CREDENTIALS pointant vers service-account.json
 *            OU fichier ./service-account.json à la racine du projet.
 *
 * Installe firebase-admin si absent: npm install --save-dev firebase-admin tsx
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import * as path from 'path';
import * as fs from 'fs';

type EquipCategory = 'fauteuil-roulant' | 'location-materiel' | 'orthopedie' | 'incontinence' | 'diabete';

if (!getApps().length) {
  const saPath = process.env.GOOGLE_APPLICATION_CREDENTIALS ??
    path.join(process.cwd(), 'service-account.json');
  if (!fs.existsSync(saPath)) {
    console.error(`❌ Fichier service account introuvable : ${saPath}`);
    console.error('   Définissez GOOGLE_APPLICATION_CREDENTIALS ou placez service-account.json à la racine.');
    process.exit(1);
  }
  initializeApp({ credential: cert(saPath) });
}

const db = getFirestore();

const PHARMACIES: {
  name: string; address: string; phone: string; hours: string;
  latitude: number; longitude: number; categories: EquipCategory[];
}[] = [
  {
    name: 'PHARMACIE RIQUIER',
    address: '42 Bd Riquier, 06300 Nice',
    phone: '04 93 55 10 12',
    hours: 'Lun–Sam 8h30–20h',
    latitude: 43.7073, longitude: 7.2961,
    categories: ['fauteuil-roulant', 'location-materiel', 'orthopedie'],
  },
  {
    name: "PHARMACIE DU CARRE D'OR",
    address: '10 Rue de la Buffa, 06000 Nice',
    phone: '04 93 87 50 75',
    hours: 'Lun–Sam 8h30–20h',
    latitude: 43.6985, longitude: 7.2588,
    categories: ['incontinence', 'diabete'],
  },
  {
    name: 'PHARMACIE MASSENA',
    address: '8 Pl. Masséna, 06000 Nice',
    phone: '04 93 87 78 94',
    hours: 'Lun–Dim 8h–21h',
    latitude: 43.6961, longitude: 7.2699,
    categories: ['fauteuil-roulant', 'orthopedie', 'diabete'],
  },
  {
    name: "PHARMACIE DE L'ARENAS",
    address: '455 Promenade des Anglais, 06200 Nice',
    phone: '04 93 21 22 23',
    hours: 'Lun–Sam 8h30–20h',
    latitude: 43.6632, longitude: 7.2133,
    categories: ['location-materiel', 'orthopedie', 'fauteuil-roulant'],
  },
  {
    name: 'PHARMACIE DU PORT',
    address: '23 Quai Lunel, 06300 Nice',
    phone: '04 93 89 25 10',
    hours: 'Lun–Sam 8h30–19h30',
    latitude: 43.6989, longitude: 7.2823,
    categories: ['incontinence', 'fauteuil-roulant'],
  },
  {
    name: 'PHARMACIE GAMBETTA',
    address: '120 Bd Gambetta, 06000 Nice',
    phone: '04 93 44 22 10',
    hours: 'Lun–Sam 8h30–20h',
    latitude: 43.7059, longitude: 7.2489,
    categories: ['orthopedie', 'diabete', 'incontinence'],
  },
  {
    name: 'PHARMACIE DE LA BUFFA',
    address: '31 Rue de la Buffa, 06000 Nice',
    phone: '04 93 88 60 17',
    hours: 'Lun–Sam 8h30–19h30',
    latitude: 43.6942, longitude: 7.2536,
    categories: ['fauteuil-roulant', 'location-materiel'],
  },
  {
    name: 'PHARMACIE BARLA',
    address: '5 Rue Barla, 06300 Nice',
    phone: '04 93 56 01 35',
    hours: 'Lun–Ven 8h30–19h30 · Sam 8h30–13h',
    latitude: 43.7030, longitude: 7.2760,
    categories: ['orthopedie', 'incontinence'],
  },
  {
    name: 'PHARMACIE DE CIMIEZ',
    address: '8 Bd de Cimiez, 06000 Nice',
    phone: '04 93 81 37 06',
    hours: 'Lun–Sam 8h30–20h',
    latitude: 43.7178, longitude: 7.2698,
    categories: ['fauteuil-roulant', 'orthopedie', 'incontinence', 'diabete'],
  },
  {
    name: 'PHARMACIE DE LA LIBERATION',
    address: '8 Pl. du Général de Gaulle, 06000 Nice',
    phone: '04 93 85 30 65',
    hours: 'Lun–Sam 8h30–20h',
    latitude: 43.7095, longitude: 7.2555,
    categories: ['location-materiel', 'orthopedie'],
  },
  {
    name: 'PHARMACIE PASTEUR',
    address: '32 Av. de la Californie, 06200 Nice',
    phone: '04 93 44 75 13',
    hours: 'Lun–Sam 8h30–19h30',
    latitude: 43.7009, longitude: 7.2489,
    categories: ['diabete', 'incontinence'],
  },
  {
    name: 'PHARMACIE SAINT-ROCH',
    address: '14 Av. Saint-Roch, 06300 Nice',
    phone: '04 93 56 40 30',
    hours: 'Lun–Sam 8h30–20h',
    latitude: 43.7007, longitude: 7.2741,
    categories: ['fauteuil-roulant', 'location-materiel', 'orthopedie', 'diabete'],
  },
  {
    name: 'PHARMACIE DU PARC IMPERIAL',
    address: '33 Av. de Suède, 06000 Nice',
    phone: '04 93 44 54 01',
    hours: 'Lun–Sam 8h30–19h30',
    latitude: 43.7125, longitude: 7.2431,
    categories: ['incontinence', 'orthopedie'],
  },
  {
    name: 'PHARMACIE SAINT-ISIDORE',
    address: '330 Route de Turin, 06300 Nice',
    phone: '04 93 29 30 30',
    hours: 'Lun–Sam 8h30–20h',
    latitude: 43.7330, longitude: 7.2105,
    categories: ['fauteuil-roulant', 'location-materiel'],
  },
  {
    name: 'PHARMACIE DE LA CORNICHE',
    address: '10 Bd Franck Pilatte, 06300 Nice',
    phone: '04 93 26 76 86',
    hours: 'Lun–Sam 8h30–19h',
    latitude: 43.6876, longitude: 7.2948,
    categories: ['orthopedie', 'fauteuil-roulant', 'diabete'],
  },
  {
    name: "GRANDE PHARMACIE DE L'HORLOGE",
    address: '98 Bd de Cessole, 06100 Nice',
    phone: '04 93 84 48 86',
    hours: 'Lun–Sam 8h30–19h30',
    latitude: 43.7178, longitude: 7.2527,
    categories: ['fauteuil-roulant', 'location-materiel', 'orthopedie', 'incontinence'],
  },
  {
    name: 'PHARMACIE CHARPENEL VICTOR HUGO',
    address: '45 Bd Victor Hugo, 06000 Nice',
    phone: '04 93 88 01 45',
    hours: 'Lun–Ven 8h30–12h30, 14h–19h30 · Sam 8h30–12h30',
    latitude: 43.6975, longitude: 7.2625,
    categories: ['fauteuil-roulant', 'location-materiel', 'orthopedie'],
  },
  {
    name: 'PHARMACIE CLEMENCEAU',
    address: '14 Av. Georges Clemenceau, 06000 Nice',
    phone: '04 93 88 51 58',
    hours: 'Lun–Ven 9h–19h · Sam 9h–12h15',
    latitude: 43.7043, longitude: 7.2582,
    categories: ['fauteuil-roulant', 'location-materiel'],
  },
  {
    name: "PHARMACIE DE L'OUEST",
    address: '44 Av. Saint Augustin, 06200 Nice',
    phone: '04 93 83 18 14',
    hours: 'Lun–Ven 8h30–19h30 · Sam 8h30–12h30, 15h–18h',
    latitude: 43.6928, longitude: 7.1963,
    categories: ['location-materiel', 'orthopedie'],
  },
];

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9 ]/g, '')
    .trim();
}

async function seed() {
  const col = db.collection('healthProfessionals');
  const snap = await col.where('category', '==', 'pharmacy').get();
  const existing = snap.docs;

  const batch = db.batch();
  let updated = 0;
  let created = 0;

  for (const target of PHARMACIES) {
    const normTarget = normalize(target.name);

    const match = existing.find((d) => {
      const normDoc = normalize(String(d.data().name ?? ''));
      return normDoc.includes(normTarget) || normTarget.includes(normDoc);
    });

    const equipment = {
      hasEquipment: true,
      categories: target.categories,
      lastUpdated: Timestamp.now(),
    };

    if (match) {
      batch.update(match.ref, { medicalEquipment: equipment });
      updated++;
      console.log(`✅ Mis à jour  : ${match.data().name}`);
    } else {
      const docId = `med-equip-${normTarget.replace(/ /g, '-')}`;
      const ref = col.doc(docId);
      batch.set(ref, {
        name: target.name,
        category: 'pharmacy',
        address: target.address,
        phone: target.phone,
        hours: target.hours,
        latitude: target.latitude,
        longitude: target.longitude,
        medicalEquipment: equipment,
      });
      created++;
      console.log(`➕ Créé       : ${target.name} (${docId})`);
    }
  }

  await batch.commit();
  console.log(`\n🎉 Terminé : ${updated} mis à jour, ${created} créés.`);
}

seed().catch((err) => {
  console.error('❌ Erreur :', err);
  process.exit(1);
});
