const fs = require('fs');
const { expo } = require('./app.json');

/**
 * app.config.js étend app.json pour injecter les valeurs sensibles
 * depuis les variables d'environnement (lues par Expo CLI depuis .env).
 *
 * Build local  : copiez .env.example → .env et renseignez vos clés.
 * EAS Cloud    : eas secret:create --name GOOGLE_MAPS_API_KEY --value "AIza..."
 *                (voir docs/setup.md pour le détail complet)
 *
 * google-services.json (notifications push Android, non versionné) :
 *   local : fichier à la racine du projet
 *   EAS   : variable d'environnement de type fichier GOOGLE_SERVICES_JSON
 *           (voir docs/notifications.md)
 */
const googleServicesFile =
  process.env.GOOGLE_SERVICES_JSON ??
  (fs.existsSync('./google-services.json') ? './google-services.json' : undefined);

module.exports = {
  expo: {
    ...expo,
    android: {
      ...expo.android,
      ...(googleServicesFile ? { googleServicesFile } : {}),
      config: {
        googleMaps: {
          apiKey: process.env.GOOGLE_MAPS_API_KEY,
        },
      },
    },
  },
};
