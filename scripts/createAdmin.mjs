/**
 * Crée le compte admin de démo PharmaSign.
 * Usage : node scripts/createAdmin.mjs
 * Requiert Node.js 18+ (fetch natif).
 */

const API_KEY    = 'AIzaSyDwChpwQr0kGezuX5m3pAoi89tQuKY6sqk';
const PROJECT_ID = 'pharmasign';
const EMAIL      = 'admin@pharmasign.fr';
const PASSWORD   = 'Admin2024!';

// ── 1. Créer l'utilisateur Firebase Auth ──────────────────────────────────
async function createAuthUser() {
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: EMAIL, password: PASSWORD, returnSecureToken: true }),
    },
  );
  const data = await res.json();
  if (data.error) {
    if (data.error.message === 'EMAIL_EXISTS') {
      console.log('ℹ️  Le compte Auth existe déjà. Récupération du token...');
      return signIn();
    }
    throw new Error(`Auth error: ${data.error.message}`);
  }
  console.log(`✅ Compte Auth créé — UID : ${data.localId}`);
  return data;
}

async function signIn() {
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: EMAIL, password: PASSWORD, returnSecureToken: true }),
    },
  );
  const data = await res.json();
  if (data.error) throw new Error(`SignIn error: ${data.error.message}`);
  console.log(`✅ Connexion réussie — UID : ${data.localId}`);
  return data;
}

// ── 2. Créer/mettre à jour le document Firestore ─────────────────────────
async function upsertFirestoreDoc(uid, idToken) {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/users/${uid}`;
  const body = {
    fields: {
      name:             { stringValue: 'Administrateur PharmaSign' },
      email:            { stringValue: EMAIL },
      role:             { stringValue: 'admin' },
      brevetSubmitted:  { booleanValue: false },
      brevetValidated:  { booleanValue: false },
    },
  };
  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (data.error) throw new Error(`Firestore error: ${data.error.message}`);
  console.log(`✅ Document Firestore users/${uid} créé/mis à jour`);
}

// ── 3. Vérification ───────────────────────────────────────────────────────
async function verifyDoc(uid, idToken) {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/users/${uid}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${idToken}` } });
  const data = await res.json();
  if (data.error) throw new Error(`Verify error: ${data.error.message}`);
  const fields = data.fields;
  console.log('\n📋 Vérification du document :');
  console.log(`   name  : ${fields.name?.stringValue}`);
  console.log(`   email : ${fields.email?.stringValue}`);
  console.log(`   role  : ${fields.role?.stringValue}`);
}

// ── Main ──────────────────────────────────────────────────────────────────
(async () => {
  try {
    console.log('🚀 Création du compte admin PharmaSign...\n');
    const { localId: uid, idToken } = await createAuthUser();
    await upsertFirestoreDoc(uid, idToken);
    await verifyDoc(uid, idToken);
    console.log('\n🎉 Compte admin prêt !');
    console.log(`   Email    : ${EMAIL}`);
    console.log(`   Password : ${PASSWORD}`);
    console.log(`   UID      : ${uid}`);
  } catch (err) {
    console.error('\n❌ Erreur :', err.message);
    process.exit(1);
  }
})();
