# Création et configuration de la clé API Google Maps

La carte (`react-native-maps`) fonctionne dans Expo Go sans clé car Expo injecte
la sienne. Dans un build natif (APK / AAB), il faut une clé liée à ton package.

---

## Étape 1 — Créer la clé sur Google Cloud Console

1. Ouvre **https://console.cloud.google.com**
2. Sélectionne (ou crée) le projet lié à PharmaSign
3. Menu ☰ → **API et services** → **Identifiants**
4. Clic **+ CRÉER DES IDENTIFIANTS** → **Clé API**
5. La clé est créée (format `AIzaSy…`) — note-la, tu en auras besoin

---

## Étape 2 — Activer "Maps SDK for Android"

1. Menu ☰ → **API et services** → **Bibliothèque**
2. Recherche **"Maps SDK for Android"**
3. Clic sur le résultat → **Activer**

---

## Étape 3 — Restreindre la clé (obligatoire en production)

1. Retourne dans **Identifiants** → clique sur ta clé
2. Section **Restrictions de l'application** → sélectionne **Applications Android**
3. Clic **+ Ajouter** et renseigne :
   - **Nom du package** : `com.tomcaucigh.pharmasign`
   - **Empreinte SHA-1** : (voir section ci-dessous pour l'obtenir)
4. **Enregistrer**

### Obtenir l'empreinte SHA-1 du keystore EAS

```bash
# Si tu as déjà buildé avec EAS, télécharge le keystore depuis expo.dev
# Puis extrait l'empreinte :
keytool -list -v -keystore ./pharmasign.jks -alias pharmasign
```

Ou directement depuis EAS :
```bash
eas credentials --platform android
# → "Download keystore" puis utilise keytool ci-dessus
```

> Pour les tests en debug, le SHA-1 est celui du keystore de debug Android local :
> `~/.android/debug.keystore` (mot de passe : `android`)

---

## Étape 4 — Configurer la clé localement (builds locaux)

Le fichier `.env.local` est déjà créé et ignoré par git.
Remplace simplement la valeur :

```bash
# .env.local
GOOGLE_MAPS_API_KEY=AIzaSy_VOTRE_VRAIE_CLE_ICI
```

Puis relance le build :
```bash
eas build --platform android --profile preview
```

---

## Étape 5 — Configurer la clé pour EAS Cloud (builds CI)

```bash
eas secret:create --name GOOGLE_MAPS_API_KEY --value "AIzaSy_VOTRE_VRAIE_CLE_ICI"
```

EAS injecte automatiquement ce secret comme variable d'environnement lors du build.
`app.config.js` la lit via `process.env.GOOGLE_MAPS_API_KEY`.

Vérifier les secrets existants :
```bash
eas secret:list
```

---

## Comment ça fonctionne dans le code

```
app.json          → config statique (package, versionCode, permissions…)
app.config.js     → étend app.json + injecte GOOGLE_MAPS_API_KEY
.env.local        → clé pour builds locaux (gitignored)
EAS secret        → clé pour builds cloud
```

`app.config.js` reçoit le contenu de `app.json` via le paramètre `{ config }`
et ajoute `android.config.googleMaps.apiKey`. Expo injecte ensuite cette valeur
dans le `AndroidManifest.xml` natif généré lors du build.

---

## Vérification — la carte s'affiche-t-elle ?

1. Build preview APK : `eas build --platform android --profile preview`
2. Installe l'APK sur un vrai appareil (pas un émulateur sans Google Play Services)
3. Ouvre l'écran interprète — la carte doit afficher les tuiles de fond
4. Si la carte est grise avec "For development purposes only" → la clé est bien lue
   mais pas encore restreinte (normal en dev)
5. Si la carte est complètement blanche → vérifie les logs :

```bash
adb logcat | grep -i "maps\|google"
# Cherche : "API key not valid" ou "Maps SDK is not authorized"
```

---

## Quotas et facturation

- Google Maps SDK for Android : **28 000 chargements/mois gratuits**
- Au-delà : ~0,007 $/chargement
- Pour une app médicale de niche (Nice), le quota gratuit est largement suffisant
- Active les alertes de facturation sur console.cloud.google.com pour être prévenu
