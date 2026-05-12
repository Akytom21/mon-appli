const { expo } = require('./app.json');

/**
 * app.config.js étend app.json pour injecter les valeurs sensibles
 * depuis les variables d'environnement (lues par Expo CLI depuis .env).
 *
 * Build local  : copiez .env.example → .env et renseignez vos clés.
 * EAS Cloud    : eas secret:create --name GOOGLE_MAPS_API_KEY --value "AIza..."
 *                (voir docs/setup.md pour le détail complet)
 */
module.exports = {
  expo: {
    ...expo,
    android: {
      ...expo.android,
      config: {
        googleMaps: {
          apiKey: process.env.GOOGLE_MAPS_API_KEY,
        },
      },
    },
  },
};
