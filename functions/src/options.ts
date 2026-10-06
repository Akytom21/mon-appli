/* Initialisation commune. Importé en premier par chaque module qui déclare
   des fonctions : les options sont lues à la déclaration, et l'appli Admin
   doit exister avant tout getFirestore(). */
import { initializeApp } from 'firebase-admin/app';
import { setGlobalOptions } from 'firebase-functions/v2';

initializeApp();

// Base Firestore en eur3 → fonctions en europe-west1. maxInstances plafonne les coûts.
setGlobalOptions({ region: 'europe-west1', maxInstances: 5 });
