/**
 * scripts/importRPPS.ts
 * Import du fichier RPPS dans Firestore → collection "healthProfessionals"
 *
 * Prérequis :
 *   1. Règles Firestore en mode test (allow read, write: if true) le temps de l'import
 *   2. Node.js 18+ (fetch natif)
 *
 * Usage :
 *   npx tsx scripts/importRPPS.ts
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { initializeApp } from 'firebase/app';
import {
  collection,
  doc,
  getDocs,
  getFirestore,
  limit,
  query,
  writeBatch,
} from 'firebase/firestore';

// ── Firebase ─────────────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey: 'AIzaSyDwChpwQr0kGezuX5m3pAoi89tQuKY6sqk',
  authDomain: 'pharmasign.firebaseapp.com',
  projectId: 'pharmasign',
  storageBucket: 'pharmasign.firebasestorage.app',
  messagingSenderId: '218522199151',
  appId: '1:218522199151:web:0c593b82351d583b1f999a',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ── Indices de colonnes (séparateur |) ───────────────────────────────────────
const F = {
  RPPS: 1, NOM: 7, PRENOM: 8,
  CODE_PROF: 9, CODE_SPCL: 15, LIBELLE_SPCL: 16,
  MODE_EX: 17, NOM_ETAB: 24,
  NUM_VOIE: 28, TYPE_VOIE: 31, NOM_VOIE: 32,
  CODE_POSTAL: 35, CODE_INSEE: 36, VILLE: 37,
  TEL: 40,
} as const;

// ── Helpers ──────────────────────────────────────────────────────────────────
function titleCase(s: string): string {
  return s.toLowerCase().replace(/(^|[\s\-'\/])[a-zàâäéèêëîïôöùûüç]/g, c => c.toUpperCase());
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') { inQ = !inQ; }
    else if (c === ',' && !inQ) { result.push(current.trim()); current = ''; }
    else { current += c; }
  }
  result.push(current.trim());
  return result;
}

// ── Types ────────────────────────────────────────────────────────────────────
type ProCategory = 'doctor' | 'specialist' | 'pharmacy';

type ProRecord = {
  rpps: string;
  name: string;
  address: string;
  category: ProCategory;
  specialite: string;
  phone: string;
  codePostal: string;
};

// ── 1. Lecture & filtrage du CSV RPPS ────────────────────────────────────────
function parseRPPS(): ProRecord[] {
  const csvPath = resolve(process.cwd(), 'data/pros_sante_nice.csv');
  console.log(`  Lecture : ${csvPath}`);

  const raw = readFileSync(csvPath, 'utf16le').replace(/^﻿/, '');
  const lines = raw.split(/\r?\n/).filter(Boolean);

  const records: ProRecord[] = [];

  for (const line of lines) {
    const f = line.split('|').map(v => v.trim());
    if (f.length < 40) continue;

    const codeProf  = f[F.CODE_PROF];
    const codeINSEE = f[F.CODE_INSEE];
    const modeEx    = f[F.MODE_EX];
    const nomVoie   = f[F.NOM_VOIE];

    // Filtres : Nice, libéraux, médecins ou pharmaciens, adresse renseignée
    if (!['10', '21'].includes(codeProf)) continue;
    if (codeINSEE !== '06088') continue;
    if (modeEx !== 'L') continue;
    if (!nomVoie) continue;

    const codeSpcl = f[F.CODE_SPCL];

    let category: ProCategory;
    let specialite = '';

    if (codeProf === '21') {
      category = 'pharmacy';
    } else if (!codeSpcl || codeSpcl === 'SM53') {
      category = 'doctor';
    } else {
      category = 'specialist';
      specialite = titleCase(f[F.LIBELLE_SPCL]);
    }

    const nom    = f[F.NOM];
    const prenom = f[F.PRENOM];
    const etab   = f[F.NOM_ETAB];

    const name =
      category === 'pharmacy'
        ? (etab ? titleCase(etab) : `Pharmacie ${titleCase(nom)}`)
        : `Dr. ${titleCase(prenom)} ${titleCase(nom)}`;

    const typeVoie = f[F.TYPE_VOIE];
    const numVoie  = f[F.NUM_VOIE];
    const street   = [numVoie, typeVoie, nomVoie].filter(Boolean).join(' ');
    const cp       = f[F.CODE_POSTAL];
    const ville    = titleCase(f[F.VILLE]);
    const address  = `${street}, ${cp} ${ville}`.trim();

    records.push({
      rpps: f[F.RPPS],
      name,
      address,
      category,
      specialite,
      phone: f[F.TEL],
      codePostal: cp,
    });
  }

  return records;
}

// ── 2. Géocodage via api-adresse.data.gouv.fr (batch) ───────────────────────
async function geocodeBatch(
  records: ProRecord[],
): Promise<Map<string, { lat: number; lng: number } | null>> {

  const header = 'id,q,postcode';
  const rows = records.map(
    r => `${r.rpps},"${r.address.replace(/"/g, '')}",${r.codePostal}`,
  );
  const csv = [header, ...rows].join('\n');

  const fd = new FormData();
  fd.append('data', new Blob([csv], { type: 'text/csv' }), 'addresses.csv');

  const res = await fetch('https://api-adresse.data.gouv.fr/search/csv/', {
    method: 'POST',
    body: fd,
  });

  if (!res.ok) throw new Error(`API Géocodage : HTTP ${res.status}`);

  const resultCsv = await res.text();
  const resultLines = resultCsv.split('\n');

  const headerCols = parseCsvLine(resultLines[0]);
  const latIdx   = headerCols.indexOf('latitude');
  const lngIdx   = headerCols.indexOf('longitude');
  const scoreIdx = headerCols.indexOf('result_score');

  const coordsMap = new Map<string, { lat: number; lng: number } | null>();

  for (const line of resultLines.slice(1)) {
    if (!line.trim()) continue;
    const parts = parseCsvLine(line);
    const id    = parts[0];
    const score = parseFloat(parts[scoreIdx] ?? '0');
    const lat   = parseFloat(parts[latIdx] ?? '');
    const lng   = parseFloat(parts[lngIdx] ?? '');

    coordsMap.set(
      id,
      score >= 0.4 && !isNaN(lat) && !isNaN(lng) ? { lat, lng } : null,
    );
  }

  return coordsMap;
}

// ── 3. Import Firestore (batches de 400) ─────────────────────────────────────
async function importToFirestore(
  records: ProRecord[],
  coords: Map<string, { lat: number; lng: number } | null>,
): Promise<{ imported: number; skipped: number }> {

  let imported = 0;
  let skipped  = 0;
  const BATCH_SIZE = 400;

  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = writeBatch(db);
    const chunk = records.slice(i, i + BATCH_SIZE);

    for (const rec of chunk) {
      const coord = coords.get(rec.rpps);
      if (!coord) { skipped++; continue; }

      const ref = doc(collection(db, 'healthProfessionals'), rec.rpps);
      batch.set(ref, {
        rpps:      rec.rpps,
        name:      rec.name,
        address:   rec.address,
        category:  rec.category,
        specialite: rec.specialite,
        latitude:  coord.lat,
        longitude: coord.lng,
        phone:     rec.phone,
        hours:     '',
      });
      imported++;
    }

    await batch.commit();
    const done = Math.min(i + BATCH_SIZE, records.length);
    console.log(`  Batch ${Math.floor(i / BATCH_SIZE) + 1} — ${done}/${records.length} traités`);
  }

  return { imported, skipped };
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n🏥  Import RPPS — Professionnels de santé de Nice\n');
  console.log('⚠  Assurez-vous que les règles Firestore autorisent les écritures.\n');

  // Vérification : collection déjà remplie ?
  const existing = await getDocs(query(collection(db, 'healthProfessionals'), limit(1)));
  if (!existing.empty) {
    console.log('⚠  La collection "healthProfessionals" contient déjà des données.');
    console.log('   Supprimez-les dans la console Firebase avant de réimporter.\n');
    process.exit(0);
  }

  // Étape 1 : parsing
  console.log('1. Lecture et filtrage du CSV RPPS…');
  const records = parseRPPS();
  const nbDoc = records.filter(r => r.category === 'doctor').length;
  const nbSpe = records.filter(r => r.category === 'specialist').length;
  const nbPha = records.filter(r => r.category === 'pharmacy').length;
  console.log(`   ✓ ${records.length} libéraux à Nice :`);
  console.log(`     ${nbDoc} médecins généralistes | ${nbSpe} spécialistes | ${nbPha} pharmaciens\n`);

  // Étape 2 : géocodage
  console.log('2. Géocodage via api-adresse.data.gouv.fr (batch)…');
  const coords = await geocodeBatch(records);
  const nbGeocoded = [...coords.values()].filter(Boolean).length;
  console.log(`   ✓ ${nbGeocoded}/${records.length} adresses géocodées\n`);

  // Étape 3 : import
  console.log('3. Import dans Firestore…');
  const { imported, skipped } = await importToFirestore(records, coords);

  console.log('\n✅  Import terminé !');
  console.log(`   📥 ${imported} professionnels importés`);
  console.log(`   ⏭  ${skipped} ignorés (adresse non géocodée)\n`);

  process.exit(0);
}

main().catch(err => {
  console.error('\n❌  Erreur :', err.message ?? err);
  process.exit(1);
});
