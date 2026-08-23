/**
 * Retourne les tokens de couleur de la palette active (clair/sombre),
 * résolue depuis la préférence utilisateur (AccessibilityContext) et,
 * en mode 'auto', le thème système.
 */

import { useMemo } from 'react';
import { Palettes, type ColorTokens } from '@/constants/design';
import { useAccessibility } from '@/context/AccessibilityContext';

export function useThemeColor(): ColorTokens {
  const { isDark } = useAccessibility();
  return useMemo(() => Palettes[isDark ? 'dark' : 'light'], [isDark]);
}
