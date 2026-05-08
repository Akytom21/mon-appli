import { Platform } from 'react-native';
import { initializeApp } from 'firebase/app';
import {
  browserLocalPersistence,
  getReactNativePersistence,
  initializeAuth,
} from 'firebase/auth';
import {
  CACHE_SIZE_UNLIMITED,
  initializeFirestore,
  memoryLocalCache,
  persistentLocalCache,
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyDwChpwQr0kGezuX5m3pAoi89tQuKY6sqk",
  authDomain: "pharmasign.firebaseapp.com",
  projectId: "pharmasign",
  storageBucket: "pharmasign.firebasestorage.app",
  messagingSenderId: "218522199151",
  appId: "1:218522199151:web:0c593b82351d583b1f999a",
};

const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
  persistence: Platform.OS === 'web'
    ? browserLocalPersistence
    : getReactNativePersistence(AsyncStorage),
});

// Web : cache persistant IndexedDB (hors-ligne partiel)
// Mobile : cache mémoire (IndexedDB non disponible dans React Native)
export const db = initializeFirestore(app, {
  localCache: Platform.OS === 'web'
    ? persistentLocalCache({ cacheSizeBytes: CACHE_SIZE_UNLIMITED })
    : memoryLocalCache(),
  ignoreUndefinedProperties: true,
});

export const storage = getStorage(app);
