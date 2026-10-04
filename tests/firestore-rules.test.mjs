// Scénarios des règles Firestore de PharmaSign, exécutés sur l'émulateur local.
// Les requêtes reprennent celles du code de l'appli (hooks/*.ts).
// Usage : npm run test:rules   (nécessite Java 21+)
// Autre fichier de règles : RULES=chemin/vers/regles npm run test:rules
// Windows, si l'émulateur échoue sur « Unable to establish loopback connection » :
//   JAVA_TOOL_OPTIONS="-Djdk.net.unixdomain.tmpdir=C:\jt" (dossier existant, chemin court)
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const rulesPath = process.env.RULES ?? fileURLToPath(new URL('../firestore.rules', import.meta.url));
import { assertFails, assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing';
import {
  addDoc, arrayUnion, collection, collectionGroup, deleteDoc, doc, getDoc, getDocs,
  limit, orderBy, query, serverTimestamp, setDoc, updateDoc, where, writeBatch,
} from 'firebase/firestore';

const env = await initializeTestEnvironment({
  projectId: 'demo-pharmasign',
  firestore: { rules: readFileSync(rulesPath, 'utf8'), host: '127.0.0.1', port: 8080 },
});

const pendingAppt = {
  patientId: 'sourd1', patientName: 'Patient', type: 'generaliste', date: '2099-01-01', time: '10:00',
  location: 'Cabinet', address: '1 rue X', coordinates: { lat: 43.7, lng: 7.26 },
  status: 'pending', interpreterId: null, interpreterName: null, declinedBy: ['interp2'],
};

async function seed() {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    const users = {
      sourd1: { name: 'S', role: 'sourd', phone: '0600' },
      sourd2: { name: 'S2', role: 'sourd' },
      interp1: { name: 'I1', role: 'interprete', phone: '0611' },
      interp2: { name: 'I2', role: 'interprete' },
      app1: { name: 'A', role: 'apprenti', brevetValidated: true },
      app2: { name: 'A2', role: 'apprenti', brevetValidated: false },
      admin1: { name: 'Ad', role: 'admin' },
    };
    for (const [id, u] of Object.entries(users)) await setDoc(doc(db, 'users', id), u);
    await setDoc(doc(db, 'appointments', 'pend1'), pendingAppt);
    await setDoc(doc(db, 'appointments', 'acc1'), {
      ...pendingAppt, status: 'accepted', interpreterId: 'interp1', interpreterName: 'I1', createdAt: new Date(),
    });
    await setDoc(doc(db, 'appointments', 'other1'), { ...pendingAppt, patientId: 'sourd2', status: 'accepted', interpreterId: 'interp1' });
    await setDoc(doc(db, 'appointments', 'past1'), { ...pendingAppt, date: '2020-01-01', status: 'accepted', interpreterId: 'interp1', interpreterName: 'I1' });
    await setDoc(doc(db, 'messages', 'acc1', 'chatMessages', 'm1'), {
      senderId: 'interp1', recipientId: 'sourd1', text: 'Bonjour', read: false, appointmentId: 'acc1', createdAt: new Date(),
    });
    await setDoc(doc(db, 'reviews', 'r0'), { appointmentId: 'other1', patientId: 'sourd2', interpreterId: 'interp1', rating: 4 });
  });
}

const as = (uid) => env.authenticatedContext(uid).firestore();
const results = [];
async function check(name, expect, fn) {
  await seed();
  try {
    await (expect === 'ALLOW' ? assertSucceeds(fn()) : assertFails(fn()));
    results.push(['OK  ', expect, name]);
  } catch (e) {
    results.push(['FAIL', expect, `${name}  → ${String(e.message).split('\n')[0]}`]);
  }
}

const newUser = (role) => ({ name: 'N', email: 'n@x.fr', role, brevetSubmitted: false, brevetValidated: false, createdAt: serverTimestamp() });

// ── Inscription / profil (AuthContext, profil.tsx, admin/index.tsx) ──
await check('inscription sourd', 'ALLOW', () => setDoc(doc(as('new1'), 'users', 'new1'), newUser('sourd')));
await check('inscription interprète', 'ALLOW', () => setDoc(doc(as('new1'), 'users', 'new1'), newUser('interprete')));
await check('inscription apprenti', 'ALLOW', () => setDoc(doc(as('new1'), 'users', 'new1'), newUser('apprenti')));
await check('inscription en admin', 'DENY', () => setDoc(doc(as('new1'), 'users', 'new1'), newUser('admin')));
await check('inscription brevet pré-validé', 'DENY', () => setDoc(doc(as('new1'), 'users', 'new1'), { ...newUser('apprenti'), brevetValidated: true }));
await check("créer le profil d'un autre", 'DENY', () => setDoc(doc(as('new1'), 'users', 'zzz'), newUser('sourd')));
await check('lire son profil', 'ALLOW', () => getDoc(doc(as('sourd1'), 'users', 'sourd1')));
await check("lire le profil d'un autre", 'DENY', () => getDoc(doc(as('sourd1'), 'users', 'interp1')));
await check('compléter son profil', 'ALLOW', () => updateDoc(doc(as('sourd1'), 'users', 'sourd1'), { phone: '0699', prefCommun: 'LSF' }));
await check('interprète règle son tarif', 'ALLOW', () => updateDoc(doc(as('interp1'), 'users', 'interp1'), { hourlyRate: 45, disponible: true }));
await check('enregistrer son jeton push', 'ALLOW', () => updateDoc(doc(as('interp1'), 'users', 'interp1'), { expoPushToken: 'ExponentPushToken[x]' }));
await check("écrire le jeton push d'un autre", 'DENY', () => updateDoc(doc(as('sourd1'), 'users', 'interp1'), { expoPushToken: 'ExponentPushToken[x]' }));
await check('apprenti soumet son brevet', 'ALLOW', () => updateDoc(doc(as('app2'), 'users', 'app2'), { brevetSubmitted: true, brevetLevel: 'B2' }));
await check('changer son propre rôle', 'DENY', () => updateDoc(doc(as('sourd1'), 'users', 'sourd1'), { role: 'admin' }));
await check('valider son propre brevet', 'DENY', () => updateDoc(doc(as('app2'), 'users', 'app2'), { brevetValidated: true }));
await check('apprenti validé → interprète', 'ALLOW', () => updateDoc(doc(as('app1'), 'users', 'app1'), { role: 'interprete' }));
await check('apprenti validé → admin', 'DENY', () => updateDoc(doc(as('app1'), 'users', 'app1'), { role: 'admin' }));
await check('apprenti non validé → interprète', 'DENY', () => updateDoc(doc(as('app2'), 'users', 'app2'), { role: 'interprete' }));
await check('admin valide un brevet', 'ALLOW', () => updateDoc(doc(as('admin1'), 'users', 'app2'), { brevetValidated: true, brevetRefused: false, brevetRefusalReason: '' }));
await check('admin change un rôle', 'ALLOW', () => updateDoc(doc(as('admin1'), 'users', 'sourd1'), { role: 'interprete' }));
await check('admin liste les utilisateurs', 'ALLOW', () => getDocs(collection(as('admin1'), 'users')));
await check('non-admin liste les utilisateurs', 'DENY', () => getDocs(collection(as('sourd1'), 'users')));
await check("modifier la note d'un autre", 'DENY', () => updateDoc(doc(as('sourd1'), 'users', 'interp1'), { averageRating: 5, reviewCount: 99 }));
await check('supprimer son compte', 'ALLOW', () => deleteDoc(doc(as('sourd1'), 'users', 'sourd1')));
await check("supprimer le compte d'un autre", 'DENY', () => deleteDoc(doc(as('sourd1'), 'users', 'interp1')));

// ── RDV (useAppointments.ts, transcription.tsx) ──
await check('patient crée un RDV', 'ALLOW', () => addDoc(collection(as('sourd1'), 'appointments'), { ...pendingAppt, declinedBy: [], createdAt: serverTimestamp() }));
await check('patient crée un RDV de 1 h 30', 'ALLOW', () => addDoc(collection(as('sourd1'), 'appointments'), { ...pendingAppt, durationMin: 90 }));
await check('durée absurde (1000 min)', 'DENY', () => addDoc(collection(as('sourd1'), 'appointments'), { ...pendingAppt, durationMin: 1000 }));
await check('durée en texte', 'DENY', () => addDoc(collection(as('sourd1'), 'appointments'), { ...pendingAppt, durationMin: '90' }));
await check('patient se choisit un interprète', 'DENY', () => addDoc(collection(as('sourd1'), 'appointments'), { ...pendingAppt, interpreterId: 'interp1' }));
await check('patient crée un RDV pour un autre', 'DENY', () => addDoc(collection(as('sourd1'), 'appointments'), { ...pendingAppt, patientId: 'sourd2' }));
await check('patient liste ses RDV', 'ALLOW', () => getDocs(query(collection(as('sourd1'), 'appointments'), where('patientId', '==', 'sourd1'), orderBy('createdAt', 'desc'), limit(50))));
await check('patient lit le RDV d\'un autre', 'DENY', () => getDoc(doc(as('sourd2'), 'appointments', 'acc1')));
await check('patient annule', 'ALLOW', () => updateDoc(doc(as('sourd1'), 'appointments', 'pend1'), { status: 'cancelled' }));
await check('patient se met "accepted"', 'DENY', () => updateDoc(doc(as('sourd1'), 'appointments', 'pend1'), { status: 'accepted' }));
await check('interprète liste les demandes en attente', 'ALLOW', () => getDocs(query(collection(as('interp1'), 'appointments'), where('status', '==', 'pending'), limit(50))));
await check('sourd liste les demandes en attente', 'DENY', () => getDocs(query(collection(as('sourd2'), 'appointments'), where('status', '==', 'pending'), limit(50))));
await check('interprète liste ses missions', 'ALLOW', () => getDocs(query(collection(as('interp1'), 'appointments'), where('interpreterId', '==', 'interp1'))));
await check('interprète liste ses missions acceptées', 'ALLOW', () => getDocs(query(collection(as('interp1'), 'appointments'), where('interpreterId', '==', 'interp1'), where('status', '==', 'accepted'))));
await check('interprète liste ses refus (taux)', 'ALLOW', () => getDocs(query(collection(as('interp2'), 'appointments'), where('declinedBy', 'array-contains', 'interp2'))));
await check('interprète liste les refus d\'un autre', 'DENY', () => getDocs(query(collection(as('interp1'), 'appointments'), where('declinedBy', 'array-contains', 'interp2'))));
await check('interprète accepte', 'ALLOW', () => updateDoc(doc(as('interp1'), 'appointments', 'pend1'), { status: 'accepted', interpreterId: 'interp1', interpreterName: 'I1', interpreterHourlyRate: 45, interpreterPhone: '0611' }));
await check("interprète accepte au nom d'un autre", 'DENY', () => updateDoc(doc(as('interp1'), 'appointments', 'pend1'), { status: 'accepted', interpreterId: 'interp2' }));
await check("interprète modifie l'adresse", 'DENY', () => updateDoc(doc(as('interp1'), 'appointments', 'pend1'), { address: 'ailleurs' }));
await check('interprète reprend une mission déjà acceptée', 'DENY', () => updateDoc(doc(as('interp2'), 'appointments', 'acc1'), { status: 'accepted', interpreterId: 'interp2' }));
await check('interprète refuse (arrayUnion)', 'ALLOW', () => updateDoc(doc(as('interp1'), 'appointments', 'pend1'), { declinedBy: arrayUnion('interp1') }));
await check('interprète efface les refus des autres', 'DENY', () => updateDoc(doc(as('interp1'), 'appointments', 'pend1'), { declinedBy: ['interp1'] }));
await check("interprète refuse au nom d'un autre", 'DENY', () => updateDoc(doc(as('interp1'), 'appointments', 'pend1'), { declinedBy: arrayUnion('sourd1') }));
const withdraw = { status: 'pending', interpreterId: null, interpreterName: null, interpreterHourlyRate: null, interpreterPhone: null };
await check('interprète se désiste', 'ALLOW', () => updateDoc(doc(as('interp1'), 'appointments', 'acc1'), { ...withdraw, declinedBy: arrayUnion('interp1') }));
await check("se désister de la mission d'un autre", 'DENY', () => updateDoc(doc(as('interp2'), 'appointments', 'acc1'), { ...withdraw, declinedBy: arrayUnion('interp2') }));
await check("se désister d'un RDV passé", 'DENY', () => updateDoc(doc(as('interp1'), 'appointments', 'past1'), { ...withdraw, declinedBy: arrayUnion('interp1') }));
await check('se désister en gardant son nom', 'DENY', () => updateDoc(doc(as('interp1'), 'appointments', 'acc1'), { ...withdraw, interpreterName: 'I1', declinedBy: arrayUnion('interp1') }));
await check('se désister sans se retirer de la liste', 'DENY', () => updateDoc(doc(as('interp1'), 'appointments', 'acc1'), withdraw));
await check('se désister en changeant l\'adresse', 'DENY', () => updateDoc(doc(as('interp1'), 'appointments', 'acc1'), { ...withdraw, address: 'ailleurs', declinedBy: arrayUnion('interp1') }));
await check('patient sauve la transcription', 'ALLOW', () => updateDoc(doc(as('sourd1'), 'appointments', 'acc1'), { transcription: 'txt', transcriptionUpdatedAt: serverTimestamp() }));
await check('admin supprime un RDV', 'ALLOW', () => deleteDoc(doc(as('admin1'), 'appointments', 'acc1')));

// ── Messagerie (useChat.ts, useUnreadMessages.ts, useNotifications.ts) ──
await check('participant lit le fil', 'ALLOW', () => getDocs(query(collection(as('sourd1'), 'messages', 'acc1', 'chatMessages'), orderBy('createdAt', 'asc'))));
await check('inconnu lit le fil', 'DENY', () => getDocs(query(collection(as('sourd2'), 'messages', 'acc1', 'chatMessages'), orderBy('createdAt', 'asc'))));
await check('participant envoie un message', 'ALLOW', () => addDoc(collection(as('sourd1'), 'messages', 'acc1', 'chatMessages'), { senderId: 'sourd1', recipientId: 'interp1', text: 'Merci', read: false, appointmentId: 'acc1', createdAt: serverTimestamp() }));
await check("envoyer au nom d'un autre", 'DENY', () => addDoc(collection(as('sourd1'), 'messages', 'acc1', 'chatMessages'), { senderId: 'interp1', recipientId: 'sourd1', text: 'x', read: false }));
await check('badges non lus (collection group)', 'ALLOW', () => getDocs(query(collectionGroup(as('sourd1'), 'chatMessages'), where('recipientId', '==', 'sourd1'), where('read', '==', false))));
await check('collection group sur un autre destinataire', 'DENY', () => getDocs(query(collectionGroup(as('sourd2'), 'chatMessages'), where('recipientId', '==', 'sourd1'))));
await check('marquer comme lu', 'ALLOW', async () => {
  const db = as('sourd1');
  const snap = await getDocs(query(collection(db, 'messages', 'acc1', 'chatMessages'), where('recipientId', '==', 'sourd1'), where('read', '==', false)));
  const batch = writeBatch(db);
  snap.docs.forEach((d) => batch.update(d.ref, { read: true }));
  return batch.commit();
});

// ── Avis (useReviews.ts, useInterpreterStats.ts) ──
const review = { appointmentId: 'acc1', patientId: 'sourd1', interpreterId: 'interp1', rating: 5, comment: 'Top', createdAt: serverTimestamp() };
await check('patient vérifie le doublon', 'ALLOW', () => getDocs(query(collection(as('sourd1'), 'reviews'), where('appointmentId', '==', 'acc1'), where('patientId', '==', 'sourd1'))));
await check('patient note son interprète', 'ALLOW', () => addDoc(collection(as('sourd1'), 'reviews'), review));
await check('patient note un autre interprète', 'DENY', () => addDoc(collection(as('sourd1'), 'reviews'), { ...review, interpreterId: 'interp2' }));
await check("patient note le RDV d'un autre", 'DENY', () => addDoc(collection(as('sourd2'), 'reviews'), { ...review, patientId: 'sourd2' }));
await check('note hors limites', 'DENY', () => addDoc(collection(as('sourd1'), 'reviews'), { ...review, rating: 9 }));
await check('interprète lit ses avis (note moyenne)', 'ALLOW', () => getDocs(query(collection(as('interp1'), 'reviews'), where('interpreterId', '==', 'interp1'))));
await check('patient lit les avis des autres', 'DENY', () => getDocs(query(collection(as('sourd1'), 'reviews'), where('interpreterId', '==', 'interp1'))));

// ── Rappels (écrits uniquement par la Cloud Function sendReminders) ──
await check('client lit les rappels', 'DENY', () => getDoc(doc(as('sourd1'), 'reminders', 'acc1')));
await check('client écrit un rappel', 'DENY', () => setDoc(doc(as('sourd1'), 'reminders', 'acc1'), { sent: [] }));

await env.cleanup();
const fails = results.filter((r) => r[0] === 'FAIL').length;
for (const [s, e, n] of results) console.log(`${s} [${e}] ${n}`);
console.log(`\n${results.length - fails}/${results.length} scénarios conformes`);
process.exit(fails ? 1 : 0);
