import { createContext, ReactNode, useContext, useState } from 'react';

export type Role = 'sourd' | 'interprete' | 'apprenti';

export type User = {
  id: string;
  email: string;
  name: string;
  role: Role;
  brevetSubmitted: boolean;
  brevetValidated: boolean;
};

type AuthContextType = {
  user: User | null;
  login: (email: string, password: string) => string | null;
  register: (name: string, email: string, password: string, role: Role) => string | null;
  logout: () => void;
  submitBrevet: () => void;
};

type StoredUser = { id: string; email: string; password: string; name: string; role: Role };

const DEMO_USERS: StoredUser[] = [
  { id: '1', email: 'sourd@demo.fr', password: 'demo', name: 'Alex Martin', role: 'sourd' },
  { id: '2', email: 'interprete@demo.fr', password: 'demo', name: 'Marie Dupont', role: 'interprete' },
  { id: '3', email: 'apprenti@demo.fr', password: 'demo', name: 'Lucas Bernard', role: 'apprenti' },
];

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [stored, setStored] = useState<StoredUser[]>(DEMO_USERS);

  const login = (email: string, password: string): string | null => {
    const found = stored.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );
    if (!found) return 'Email ou mot de passe incorrect.';
    setUser({ id: found.id, email: found.email, name: found.name, role: found.role, brevetSubmitted: false, brevetValidated: false });
    return null;
  };

  const register = (name: string, email: string, password: string, role: Role): string | null => {
    if (stored.find((u) => u.email.toLowerCase() === email.toLowerCase())) {
      return 'Cet email est déjà utilisé.';
    }
    if (password.length < 6) return 'Mot de passe trop court (6 caractères minimum).';
    if (!name.trim()) return 'Veuillez saisir votre nom.';
    const id = String(Date.now());
    const newUser: StoredUser = { id, email, password, name: name.trim(), role };
    setStored((prev) => [...prev, newUser]);
    setUser({ id, email, name: name.trim(), role, brevetSubmitted: false, brevetValidated: false });
    return null;
  };

  const logout = () => setUser(null);

  const submitBrevet = () =>
    setUser((prev) => (prev ? { ...prev, brevetSubmitted: true } : null));

  return (
    <AuthContext.Provider value={{ user, login, register, logout, submitBrevet }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
