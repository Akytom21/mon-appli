/* ── Design tokens centralisés — couleur, espacement, typo ──
   Source unique pour tous les écrans. Deux palettes (light/dark)
   partageant la même structure de clés ; les écrans lisent la
   palette active via useThemeColor() plutôt que de hardcoder
   des couleurs. */

export type ThemeMode = 'light' | 'dark';

export interface ColorTokens {
  BRAND: string;
  BRAND_DARK: string;
  BRAND_TINT: string;
  BG: string;
  SURFACE: string;
  SURFACE_ALT: string;
  INK_1: string;
  INK_2: string;
  INK_3: string;
  BORDER: string;
  SUCCESS: string;
  WARNING: string;
  ERROR: string;
  ERROR_TINT: string;
}

const light: ColorTokens = {
  BRAND:       '#0F766E',
  BRAND_DARK:  '#0B5F58',
  BRAND_TINT:  '#E8F4F2',
  BG:          '#F6F8FA',
  SURFACE:     '#FFFFFF',
  SURFACE_ALT: '#F1F5F9',
  INK_1:       '#0F1B2D',
  INK_2:       '#475569',
  INK_3:       '#94A3B8',
  BORDER:      '#E5EAF0',
  SUCCESS:     '#059669',
  WARNING:     '#D97706',
  ERROR:       '#DC2626',
  ERROR_TINT:  '#FEF2F2',
};

const dark: ColorTokens = {
  BRAND:       '#14B8A6',
  BRAND_DARK:  '#0D9488',
  BRAND_TINT:  '#134E4A',
  BG:          '#0F172A',
  SURFACE:     '#1E293B',
  SURFACE_ALT: '#273449',
  INK_1:       '#F8FAFC',
  INK_2:       '#94A3B8',
  INK_3:       '#64748B',
  BORDER:      '#334155',
  SUCCESS:     '#10B981',
  WARNING:     '#F59E0B',
  ERROR:       '#F87171',
  ERROR_TINT:  '#3F1D1D',
};

export const Palettes: Record<ThemeMode, ColorTokens> = { light, dark };

export const Spacing = {
  xs:  4,
  sm:  8,
  md:  16,
  lg:  24,
  xl:  32,
  xxl: 48,
};

export const Radius = {
  sm:   8,
  md:   12,
  lg:   16,
  xl:   24,
  full: 999,
};

export const FontSize = {
  xs:   12,
  sm:   14,
  md:   16,
  lg:   18,
  xl:   22,
  xxl:  28,
  xxxl: 36,
};
