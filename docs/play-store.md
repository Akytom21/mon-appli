# PharmaSign — Fiche Play Store

## Informations générales

| Champ | Valeur |
|---|---|
| **Titre** | PharmaSign — Interprétariat LSF Santé |
| **Catégorie** | Médical |
| **Public cible** | 16+ |
| **Package** | com.tomcaucigh.pharmasign |
| **Politique de confidentialité** | https://pharmasign.app/privacy (à héberger) |

---

## Description courte (80 caractères max)

```
Interprète LSF à la demande pour vos rendez-vous médicaux à Nice.
```
_(65 caractères)_

---

## Description longue

PharmaSign met en relation les personnes sourdes et malentendantes avec des interprètes en Langue des Signes Française (LSF) pour leurs rendez-vous médicaux dans la région de Nice.

**Pour les patients sourds et malentendants**
- Demandez un interprète LSF en quelques secondes pour un rendez-vous chez le médecin généraliste, spécialiste, aux urgences ou en pharmacie
- Suivez l'état de votre demande en temps réel
- Communiquez directement avec votre interprète via la messagerie intégrée
- Consultez l'historique de vos rendez-vous

**Pour les interprètes LSF**
- Recevez les demandes de mission géolocalisées autour de Nice sur une carte interactive
- Acceptez les missions d'un simple tap
- Gérez votre planning et votre disponibilité
- Consultez vos statistiques : missions réalisées, note moyenne, taux d'acceptation

**Accessibilité au cœur de l'application**
- Interface entièrement compatible TalkBack (lecteur d'écran Android)
- Taille de texte réglable (de Normal à Très grand)
- Mode contraste élevé pour une meilleure lisibilité
- Pictogrammes LSF intégrés pour faciliter la navigation

**Sécurité et confidentialité**
- Authentification sécurisée (email / Google)
- Données hébergées en Europe (Firebase / Google Cloud)
- Conforme RGPD — vos données ne sont jamais revendues

PharmaSign est développé en partenariat avec des professionnels de santé et des interprètes LSF diplômés de la région PACA.

---

## Screenshots à préparer (6 minimum requis)

Format recommandé : **1080 × 1920 px** (portrait, ratio 9:16)
Outil : appareil physique ou émulateur Android 14, `npx expo start` puis captures d'écran.

| # | Écran | Rôle dans l'app | Ce qu'on doit voir |
|---|---|---|---|
| 1 | Écran de connexion | `/login` | Logo PharmaSign, boutons "Connexion" et "Créer un compte", fond vert-bleu |
| 2 | Accueil patient | `/(tabs)/index` | Carte avec marqueurs, bouton "Demander un interprète", prochains RDV |
| 3 | Demande de RDV | Formulaire de création | Sélection du type (généraliste, urgences…), date/heure, adresse |
| 4 | Accueil interprète | `/(tabs)/interpretes` | Carte interactive, demandes en attente, stats (missions ce mois, note, taux) |
| 5 | Messagerie | `/(tabs)/chat` | Fil de conversation sourd ↔ interprète, bulles, badge non lu |
| 6 | Profil & Accessibilité | `/(tabs)/profil` | Taille de texte, contraste élevé, toggle TalkBack, photo de profil |
| 7 _(bonus)_ | Planning interprète | `/(tabs)/interpretes/planning` | Calendrier mensuel avec missions colorées |
| 8 _(bonus)_ | Avis patient | Section avis après mission | Étoiles, commentaire, confirmation envoi |

### Textes de légende suggérés pour chaque screenshot

1. "Connexion simple et sécurisée"
2. "Vos rendez-vous médicaux, traduits en LSF"
3. "Réservez un interprète en moins d'une minute"
4. "Interprètes : missions en temps réel sur la carte"
5. "Messagerie directe sourd — interprète"
6. "Application 100 % accessible TalkBack"

---

## Commandes de build

### Pré-requis
```bash
npm install -g eas-cli
eas login          # compte Expo (expo.dev)
eas build:configure
```

### Build APK de test (preview)
```bash
eas build --platform android --profile preview
```

### Build AAB production (Play Store)
```bash
eas build --platform android --profile production
```

### Soumettre au Play Store (après configuration du service account)
```bash
eas submit --platform android --profile production
```

---

## Checklist avant soumission

- [ ] Compte Google Play Developer créé (25 $ one-time)
- [ ] Fiche store remplie (titre, descriptions, screenshots, icône 512×512)
- [ ] Politique de confidentialité hébergée et URL renseignée
- [ ] `google-service-account.json` généré depuis Google Play Console (pour `eas submit`)
- [ ] Build AAB testé sur au moins un appareil physique Android
- [ ] Vérification des permissions dans Google Play Console (justification requise pour CAMERA, LOCATION)
- [ ] Questionnaire de contenu complété (médical → peut nécessiter une déclaration)
- [ ] Test de la version release sur Firebase App Distribution avant soumission
