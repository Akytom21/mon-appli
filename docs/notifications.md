# Notifications dans PharmaSign

## Fonctionnement

| Rôle | Événement | Envoi |
|------|-----------|-------|
| Interprète | Nouvelle demande de RDV (titre d'alerte + priorité haute si urgence) | Push — `notifyNewRequest` |
| Sourd | RDV accepté par un interprète | Push — `notifyStatusChange` |
| Interprète | Patient annule une mission acceptée | Push — `notifyStatusChange` |
| Sourd + interprètes | Interprète se désiste : patient prévenu, demande relancée (« Demande à reprendre ») aux autres interprètes | Push — `notifyStatusChange` |
| Sourd + interprète | Rappel la veille (2 h à 24 h avant) et moins d'une heure avant un RDV accepté | Push — `sendReminders` (toutes les 15 min, rappels envoyés notés dans `reminders/{apptId}`) |
| Tous | Nouveau message dans le chat | Push — `notifyChatMessage` |
| Apprenti | Brevet validé / refusé | Locale (appli ouverte) |

- **Push** : envoyées par les Cloud Functions de `functions/` via le service Expo Push, même appli fermée. Au clic, l'appli s'ouvre sur l'écran concerné (`data.url`).
- **Confidentialité** : les notifications ne contiennent ni le texte des messages ni le nom du patient (elles transitent par Expo/Google/Apple et s'affichent écran verrouillé).
- **Jeton** : `hooks/useNotifications.ts` enregistre le jeton Expo dans `users/{uid}.expoPushToken` ; il est effacé à la déconnexion, et par les fonctions si l'appareil est désinscrit.
- **Expo Go** (Android, SDK 53+) n'a pas de push distant : sans jeton, l'appli retombe sur les notifications locales (appli ouverte uniquement), comme avant.

## Mise en place (une seule fois)

### 1. Firebase : appli Android + `google-services.json`

Console Firebase → Paramètres du projet → **Ajouter une application** → Android, package `com.tomcaucigh.pharmasign`. Télécharger `google-services.json` et le placer à la racine du projet (non versionné).

Pour les builds EAS, l'envoyer comme variable de type fichier :

```bash
eas env:create --name GOOGLE_SERVICES_JSON --type file --value ./google-services.json --visibility secret --environment preview --environment production
```

### 2. Expo : clé FCM V1

Expo envoie les push Android via Firebase Cloud Messaging. Lui donner la clé du compte de service Firebase (`service-account.json`) :

```bash
eas credentials --platform android
```

→ profil `preview` → *Google Service Account* → *Manage your Google Service Account Key for Push Notifications (FCM V1)* → *Upload a new service account key* → `service-account.json`.

### 3. Déployer les Cloud Functions

Forfait Blaze requis. Les tests (`npm --prefix functions test`) tournent automatiquement avant chaque déploiement.

```bash
npx firebase-tools@latest deploy --only functions --project pharmasign
```

Au premier déploiement, accepter la politique de nettoyage des images (évite des frais de stockage).

### 4. Construire et installer l'appli

```bash
eas build --profile preview --platform android
```

Installer l'APK généré sur le téléphone, se connecter, accepter les notifications.

## Vérifier

- Jeton enregistré : champ `expoPushToken` dans `users/{uid}` (console Firestore).
- Envois : `npx firebase-tools@latest functions:log --project pharmasign` → lignes « N/M notification(s) envoyée(s) ».
- Test manuel d'un jeton : https://expo.dev/notifications

## Développement

```bash
npm --prefix functions test   # tests unitaires (service Expo simulé, rappels, fuseau de Paris)
npm run test:rules            # règles Firestore, dont le jeton push
```
