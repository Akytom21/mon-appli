# Configuration des variables d'environnement — PharmaSign

## Vue d'ensemble

PharmaSign utilise deux catégories de variables d'environnement :

| Préfixe | Portée | Chargement |
|---|---|---|
| `GOOGLE_MAPS_API_KEY` | Build natif uniquement (AndroidManifest) | `app.config.js` au moment du build |
| `EXPO_PUBLIC_FIREBASE_*` | Bundle JS (accessible côté client) | Expo bundler au démarrage |

> **Règle EXPO_PUBLIC_** : toute variable préfixée `EXPO_PUBLIC_` est incluse dans
> le bundle JavaScript et visible par n'importe qui qui décompile l'APK.
> La sécurité Firebase repose sur les **Security Rules**, pas sur le secret de ces clés.

---

## 1. Développement local

```bash
# 1. Copiez le modèle
cp .env.example .env

# 2. Renseignez vos clés dans .env (jamais commité)
```

Expo CLI charge automatiquement `.env` puis `.env.local` (si présent) au démarrage.
Relancez `expo start` après toute modification du fichier `.env`.

### Variables requises

| Variable | Description | Où la trouver |
|---|---|---|
| `GOOGLE_MAPS_API_KEY` | Maps SDK for Android | [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Maps SDK for Android |
| `EXPO_PUBLIC_FIREBASE_API_KEY` | Clé API Firebase | Firebase Console → ⚙ Paramètres du projet → Vos applications |
| `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN` | Domaine Auth Firebase | idem |
| `EXPO_PUBLIC_FIREBASE_PROJECT_ID` | ID du projet Firebase | idem |
| `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET` | Bucket Storage | idem |
| `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Sender ID FCM | idem |
| `EXPO_PUBLIC_FIREBASE_APP_ID` | App ID Firebase | idem |

---

## 2. EAS Build (CI/CD cloud)

Les builds EAS ne lisent **pas** le fichier `.env` local. Il faut déclarer les secrets
de deux façons complémentaires :

### 2a. Secrets EAS (recommandé pour les valeurs vraiment sensibles)

```bash
# Créez chaque secret (une seule fois, stocké côté Expo)
eas secret:create --scope project --name GOOGLE_MAPS_API_KEY      --value "AIza..."
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_API_KEY --value "AIza..."
# … répétez pour chaque variable
```

Les secrets EAS sont automatiquement injectés comme variables d'environnement
lors du build. Vérifiez-les sur [expo.dev](https://expo.dev) → votre projet → Secrets.

### 2b. Bloc `env` dans eas.json (variables non-secrètes)

Pour des valeurs non sensibles (ex. `EXPO_PUBLIC_FIREBASE_PROJECT_ID`),
vous pouvez les déclarer directement dans `eas.json` :

```json
{
  "build": {
    "production": {
      "env": {
        "EXPO_PUBLIC_FIREBASE_PROJECT_ID": "pharmasign",
        "EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN": "pharmasign.firebaseapp.com"
      }
    }
  }
}
```

> **Ne jamais mettre `GOOGLE_MAPS_API_KEY` en clair dans `eas.json`** — ce fichier
> est commité dans git. Utilisez les secrets EAS pour cette clé.

---

## 3. Sécurité Google Maps

La clé `GOOGLE_MAPS_API_KEY` est injectée dans `AndroidManifest.xml` au build.
Pour limiter son usage abusif :

1. **Restrictions d'application** : dans Google Cloud Console → Credentials,
   limitez la clé au `package name` `com.tomcaucigh.pharmasign` +
   empreinte SHA-1 de votre keystore.
2. **Restrictions d'API** : autorisez uniquement *Maps SDK for Android*.

---

## 4. Fichiers et conventions

```
.env              ← vos vraies clés locales     (gitignored)
.env.local        ← surcharges locales           (gitignored)
.env.example      ← modèle sans valeurs          (commité ✓)
app.config.js     ← injecte GOOGLE_MAPS_API_KEY dans le build natif
config/firebase.ts← lit EXPO_PUBLIC_FIREBASE_* via process.env
```

---

## 5. Vérification rapide

```bash
# Vérifie que les variables sont bien chargées au démarrage
npx expo start --clear

# Pour un build EAS, listez les secrets configurés
eas secret:list
```
