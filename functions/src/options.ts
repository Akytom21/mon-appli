/* Options communes à toutes les fonctions. Importé en premier par chaque
   module qui déclare des fonctions : les options sont lues à la déclaration. */
import { setGlobalOptions } from 'firebase-functions/v2';

// Base Firestore en eur3 → fonctions en europe-west1. maxInstances plafonne les coûts.
setGlobalOptions({ region: 'europe-west1', maxInstances: 5 });
