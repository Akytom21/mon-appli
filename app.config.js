// app.config.js — Expo lit ce fichier EN PRIORITÉ sur app.json.
// app.json reste la source de vérité pour toute la config statique ;
// ici on ajoute uniquement ce qui dépend de variables d'environnement.
//
// Clé Google Maps :
//   • Build local   → .env.local  (jamais commité)
//   • EAS Cloud     → eas secret:create --name GOOGLE_MAPS_API_KEY --value "AIza..."

module.exports = ({ config }) => ({
  ...config,
  android: {
    ...config.android,
    config: {
      googleMaps: {
        // Variable d'environnement prioritaire (EAS secret ou .env.local) ;
        // sinon, la clé définie dans app.json est utilisée telle quelle.
        apiKey:
          process.env.GOOGLE_MAPS_API_KEY ||
          config.android?.config?.googleMaps?.apiKey,
      },
    },
  },
});
