import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { FirebaseError } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/config/firebase';

export type Role = 'sourd' | 'interprete' | 'apprenti' | 'admin';

export type User = {
  id: string;
  email: string;
  name: string;
  role: Role;
  brevetSubmitted: boolean;
  brevetValidated: boolean;
  brevetRefused?: boolean;
  brevetLevel?: string;
  brevetOrganisme?: string;
  brevetNumero?: string;
  brevetAnnee?: string;
};

type AuthContextType = {
  user: User | null;
  initializing: boolean;
  login: (email: string, password: string) => Promise<string | null>;
  register: (name: string, email: string, password: string, role: Role) => Promise<string | null>;
  logout: () => Promise<void>;
  submitBrevet: (data: { niveau: string; organisme: string; annee: string; numero: string }) => Promise<void>;
  upgradeToInterprete: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

function translateFirebaseError(error: FirebaseError): string {
  switch (error.code) {
    case 'auth/email-already-in-use':
      return 'Cet email est déjà utilisé.';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Email ou mot de passe incorrect.';
    case 'auth/invalid-email':
      return 'Adresse email invalide.';
    case 'auth/weak-password':
      return 'Mot de passe trop court (6 caractères minimum).';
    case 'auth/too-many-requests':
      return 'Trop de tentatives. Veuillez réessayer dans quelques minutes.';
    case 'auth/network-request-failed':
      return 'Erreur réseau. Vérifiez votre connexion internet.';
    case 'auth/operation-not-allowed':
      return 'Cette méthode de connexion n\'est pas activée.';
    default:
      return 'Une erreur inattendue s\'est produite. Veuillez réessayer.';
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const docSnap = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (docSnap.exists()) {
          const data = docSnap.data();
          setUser({
            id: firebaseUser.uid,
            email: firebaseUser.email ?? '',
            name: data.name,
            role: data.role,
            brevetSubmitted: data.brevetSubmitted ?? false,
            brevetValidated: data.brevetValidated ?? false,
            brevetRefused: data.brevetRefused,
            brevetLevel: data.brevetLevel,
            brevetOrganisme: data.brevetOrganisme,
            brevetNumero: data.brevetNumero,
            brevetAnnee: data.brevetAnnee,
          });
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setInitializing(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, password: string): Promise<string | null> => {
    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      const docSnap = await getDoc(doc(db, 'users', credential.user.uid));
      if (!docSnap.exists()) return 'Profil introuvable. Contactez le support.';
      const data = docSnap.data();
      setUser({
        id: credential.user.uid,
        email: credential.user.email ?? '',
        name: data.name,
        role: data.role,
        brevetSubmitted: data.brevetSubmitted ?? false,
        brevetValidated: data.brevetValidated ?? false,
        brevetRefused: data.brevetRefused,
        brevetLevel: data.brevetLevel,
        brevetOrganisme: data.brevetOrganisme,
        brevetNumero: data.brevetNumero,
        brevetAnnee: data.brevetAnnee,
      });
      return null;
    } catch (err) {
      if (err instanceof FirebaseError) return translateFirebaseError(err);
      return 'Une erreur inattendue s\'est produite.';
    }
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    role: Role
  ): Promise<string | null> => {
    if (!name.trim()) return 'Veuillez saisir votre nom.';
    if (password.length < 6) return 'Mot de passe trop court (6 caractères minimum).';
    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      const profile = {
        name: name.trim(),
        email,
        role,
        brevetSubmitted: false,
        brevetValidated: false,
        createdAt: serverTimestamp(),
      };
      await setDoc(doc(db, 'users', credential.user.uid), profile);
      setUser({
        id: credential.user.uid,
        email,
        name: name.trim(),
        role,
        brevetSubmitted: false,
        brevetValidated: false,
      });
      return null;
    } catch (err) {
      if (err instanceof FirebaseError) return translateFirebaseError(err);
      return 'Une erreur inattendue s\'est produite.';
    }
  };

  const logout = async (): Promise<void> => {
    await signOut(auth);
    setUser(null);
  };

  const submitBrevet = async (data: {
    niveau: string;
    organisme: string;
    annee: string;
    numero: string;
  }): Promise<void> => {
    if (!user) return;
    await updateDoc(doc(db, 'users', user.id), {
      brevetSubmitted: true,
      brevetLevel: data.niveau,
      brevetOrganisme: data.organisme,
      brevetAnnee: data.annee,
      brevetNumero: data.numero,
    });
    setUser((prev) =>
      prev ? {
        ...prev,
        brevetSubmitted: true,
        brevetLevel: data.niveau,
        brevetOrganisme: data.organisme,
        brevetAnnee: data.annee,
        brevetNumero: data.numero,
      } : null,
    );
  };

  const upgradeToInterprete = async (): Promise<void> => {
    if (!user) return;
    await updateDoc(doc(db, 'users', user.id), { role: 'interprete' });
    setUser((prev) => (prev ? { ...prev, role: 'interprete' } : null));
  };

  return (
    <AuthContext.Provider value={{ user, initializing, login, register, logout, submitBrevet, upgradeToInterprete }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
