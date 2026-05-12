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
  apiKey:            process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain:        process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
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
