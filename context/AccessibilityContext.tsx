import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

export type TextSize = 'normal' | 'large' | 'xlarge';

const SCALE_FACTOR: Record<TextSize, number> = {
  normal: 1,
  large:  1.2,
  xlarge: 1.4,
};

const STORAGE_KEY = '@pharmasign_a11y';

interface A11ySettings {
  textSize:     TextSize;
  highContrast: boolean;
  reduceMotion: boolean;
}

interface A11yContextValue extends A11ySettings {
  setTextSize:     (s: TextSize) => void;
  setHighContrast: (v: boolean)  => void;
  setReduceMotion: (v: boolean)  => void;
  /** Multiplie n par le facteur de taille actif (arrondi à l'entier). */
  scale:    (n: number) => number;
  /** Retourne '#FFFFFF' en mode contraste élevé, sinon la valeur par défaut. */
  hcBg:     (def: string) => string;
  /** Retourne '#000000' en mode contraste élevé, sinon la valeur par défaut. */
  hcFg:     (def: string) => string;
  /** Ajoute 1 à l'épaisseur de bordure en mode contraste élevé. */
  hcBorder: (def: number) => number;
}

const DEFAULT: A11ySettings = {
  textSize:     'normal',
  highContrast: false,
  reduceMotion: false,
};

const AccessibilityContext = createContext<A11yContextValue>({
  ...DEFAULT,
  setTextSize:     () => {},
  setHighContrast: () => {},
  setReduceMotion: () => {},
  scale:    (n) => n,
  hcBg:     (d) => d,
  hcFg:     (d) => d,
  hcBorder: (d) => d,
});

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<A11ySettings>(DEFAULT);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => { if (raw) setSettings({ ...DEFAULT, ...(JSON.parse(raw) as Partial<A11ySettings>) }); })
      .catch(() => {});
  }, []);

  const persist = useCallback((patch: Partial<A11ySettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const setTextSize     = useCallback((s: TextSize) => persist({ textSize: s }),     [persist]);
  const setHighContrast = useCallback((v: boolean)  => persist({ highContrast: v }), [persist]);
  const setReduceMotion = useCallback((v: boolean)  => persist({ reduceMotion: v }), [persist]);

  const { textSize, highContrast } = settings;

  const scale    = useCallback((n: number) => Math.round(n * SCALE_FACTOR[textSize]),   [textSize]);
  const hcBg     = useCallback((d: string) => highContrast ? '#FFFFFF' : d, [highContrast]);
  const hcFg     = useCallback((d: string) => highContrast ? '#000000' : d, [highContrast]);
  const hcBorder = useCallback((d: number) => highContrast ? d + 1       : d, [highContrast]);

  return (
    <AccessibilityContext.Provider value={{
      ...settings,
      setTextSize, setHighContrast, setReduceMotion,
      scale, hcBg, hcFg, hcBorder,
    }}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  return useContext(AccessibilityContext);
}
