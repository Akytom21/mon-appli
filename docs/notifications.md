# Notifications dans PharmaSign

## Etat actuel — Expo Go (SDK 54)

Les **notifications locales** (`scheduleNotificationAsync`) fonctionnent dans Expo Go et sont utilisées pour toutes les alertes in-app :

| Rôle | Déclencheur | Notification |
|------|-------------|--------------|
| Sourd | RDV accepté par un interprète | "RDV confirmé ✅" |
| Sourd | RDV refusé | "RDV non attribué" |
| Interprète | Nouvelle demande en attente | "Nouvelle demande de RDV" |
| Interprète | Demande urgente | "🚨 Urgence à proximité !" |
| Apprenti | Brevet validé | "Brevet LSF validé ! 🏆" |
| Apprenti | Brevet refusé | "Brevet LSF non retenu" |

Les notifications push distantes (APNs / FCM) **ne fonctionnent plus dans Expo Go depuis SDK 53**. Le code correspondant a été retiré (`getExpoPushTokenAsync`, stockage du token dans Firestore).

---

## Activer les notifications push distantes

Les notifications push permettent d'alerter l'utilisateur même quand l'app est fermée.  
Elles nécessitent un **development build** (binary natif signé) et non Expo Go.

### 1. Configurer EAS Build

```bash
npm install -g eas-cli
eas login
eas build:configure
```

Cela crée `eas.json` à la racine du projet.

### 2. Configurer les credentials

**Android (FCM)**

Ajouter dans `app.json` :

```json
{
  "expo": {
    "android": {
      "googleServicesFile": "./google-services.json"
    }
  },
  "plugins": [
    [
      "expo-notifications",
      {
        "icon": "./assets/notification-icon.png",
        "color": "#2A9D8F"
      }
    ]
  ]
}
```

Télécharger `google-services.json` depuis la Firebase Console > Paramètres du projet > Android.

**iOS (APNs)**

EAS gère les certificats APNs automatiquement lors du build si vous êtes connecté à votre compte Apple Developer.

### 3. Réactiver le code push dans `hooks/useNotifications.ts`

Remplacer le commentaire par :

```ts
try {
  const token = (await Notifications.getExpoPushTokenAsync({
    projectId: Constants.expoConfig?.extra?.eas?.projectId,
  })).data;
  await updateDoc(doc(db, 'users', user.id), { expoPushToken: token });
} catch {
  // Token optionnel — les notifications locales fonctionnent sans
}
```

Ajouter les imports manquants :

```ts
import Constants from 'expo-constants';
import { doc, updateDoc } from 'firebase/firestore';
```

### 4. Créer le development build

```bash
# Android
eas build --profile development --platform android

# iOS (nécessite un compte Apple Developer)
eas build --profile development --platform ios
```

Installer le `.apk` / `.ipa` généré sur l'appareil.  
Le build contient le client Expo Dev (remplace Expo Go) avec support complet des notifications push.

### 5. Envoyer des notifications push depuis le backend

Une fois les tokens stockés dans Firestore, une Cloud Function peut envoyer des notifications via l'API Expo Push :

```ts
// functions/src/sendPushNotification.ts
import { Expo } from 'expo-server-sdk';

const expo = new Expo();

export async function notify(expoPushToken: string, title: string, body: string) {
  if (!Expo.isExpoPushToken(expoPushToken)) return;
  await expo.sendPushNotificationsAsync([{
    to: expoPushToken,
    title,
    body,
    sound: 'default',
  }]);
}
```

---

## Ressources

- [Expo Notifications docs](https://docs.expo.dev/push-notifications/overview/)
- [EAS Build docs](https://docs.expo.dev/build/introduction/)
- [Expo Push API](https://docs.expo.dev/push-notifications/sending-notifications/)
- [Firebase Cloud Functions](https://firebase.google.com/docs/functions)
