# Guide Admin — Firebase PharmaSign

## 1. Créer le compte admin de démo

### Via la console Firebase (méthode recommandée)

1. Ouvrir [console.firebase.google.com](https://console.firebase.google.com) → projet **pharmasign**
2. **Authentication → Users → Add user**
   - Email : `admin@pharmasign.fr`
   - Password : `Admin2024!`
   - Copier l'UID généré (ex : `xyz123abc456`)

3. **Firestore Database → Collection `users` → Add document**
   - Document ID : *(l'UID copié ci-dessus)*
   - Champs :

| Champ | Type | Valeur |
|---|---|---|
| `name` | string | `Admin PharmaSign` |
| `email` | string | `admin@pharmasign.fr` |
| `role` | string | `admin` |
| `brevetSubmitted` | boolean | `false` |
| `brevetValidated` | boolean | `false` |
| `createdAt` | timestamp | *(now)* |

---

## 2. Valider un brevet LSF directement via Firestore

### Depuis la console Firebase

1. **Firestore → Collection `users`**
2. Trouver le document de l'apprenti (filtrer par `email` ou `name`)
3. Modifier les champs suivants :

| Champ | Valeur |
|---|---|
| `brevetValidated` | `true` |
| `brevetSubmitted` | `true` (doit être présent) |

L'apprenti verra la validation lors de sa prochaine connexion.

### Refuser un brevet

| Champ | Valeur |
|---|---|
| `brevetRefused` | `true` |
| `brevetRefusalReason` | `"Raison du refus ici"` |

---

## 3. Changer le rôle d'un utilisateur

Dans le document `users/{uid}`, modifier le champ :

| Champ | Valeurs possibles |
|---|---|
| `role` | `sourd` · `interprete` · `apprenti` · `admin` |

---

## 4. Structure du document `users/{uid}`

```json
{
  "name": "Prénom Nom",
  "email": "user@example.com",
  "role": "apprenti",
  "brevetSubmitted": true,
  "brevetValidated": false,
  "brevetRefused": false,
  "brevetRefusalReason": "",
  "brevetLevel": "Niveau B2 (Brevet officiel)",
  "brevetOrganisme": "SERAC",
  "brevetNumero": "LSF-2024-0123",
  "brevetAnnee": "2024",
  "createdAt": "Timestamp"
}
```

---

## 5. Script de création admin (Node.js)

Créer `scripts/createAdmin.js` et l'exécuter avec `node scripts/createAdmin.js` :

```js
// npm install firebase (si nécessaire)
const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, doc, setDoc, serverTimestamp } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyDwChpwQr0kGezuX5m3pAoi89tQuKY6sqk",
  authDomain: "pharmasign.firebaseapp.com",
  projectId: "pharmasign",
  storageBucket: "pharmasign.firebasestorage.app",
  messagingSenderId: "218522199151",
  appId: "1:218522199151:web:0c593b82351d583b1f999a",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function createAdmin() {
  const { user } = await createUserWithEmailAndPassword(
    auth,
    'admin@pharmasign.fr',
    'Admin2024!'
  );
  await setDoc(doc(db, 'users', user.uid), {
    name: 'Admin PharmaSign',
    email: 'admin@pharmasign.fr',
    role: 'admin',
    brevetSubmitted: false,
    brevetValidated: false,
    createdAt: serverTimestamp(),
  });
  console.log('Admin créé avec succès. UID:', user.uid);
  process.exit(0);
}

createAdmin().catch(console.error);
```

---

## 6. Règles de sécurité Firestore recommandées

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Seuls les admins peuvent lire tous les users
    match /users/{uid} {
      allow read: if request.auth.uid == uid
        || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
      allow write: if request.auth.uid == uid
        || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    // Appointments : interprètes et patients peuvent lire/écrire selon logique métier
    match /appointments/{id} {
      allow read, write: if request.auth != null;
    }

    // Formations : lecture pour tous les authentifiés, écriture admin seul
    match /formations/{id} {
      allow read: if request.auth != null;
      allow write: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```
