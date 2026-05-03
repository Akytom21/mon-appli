import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDwChpwQr0kGezuX5m3pAoi89tQuKY6sqk",
  authDomain: "pharmasign.firebaseapp.com",
  projectId: "pharmasign",
  storageBucket: "pharmasign.firebasestorage.app",
  messagingSenderId: "218522199151",
  appId: "1:218522199151:web:0c593b82351d583b1f999a",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
