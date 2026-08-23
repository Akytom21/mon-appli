export const Colors = {
  primary: '#2A9D8F',
  primaryDark: '#1F7A70',
  primaryLight: '#E9F5F4',
  white: '#FFFFFF',
  background: '#FFFFFF',
  textPrimary: '#2D3748',
  textSecondary: '#6B7280',
  border: '#C8E6E3',

  malentendants: '#2A9D8F',
  malentendantsLight: '#E9F5F4',
  malentendantsDark: '#1F7A70',

  interpretes: '#2A9D8F',
  interpretesLight: '#E9F5F4',
  interpretesDark: '#1F7A70',

  apprentis: '#2A9D8F',
  apprentisLight: '#E9F5F4',
  apprentisDark: '#1F7A70',

  success: '#2A9D8F',
  warning: '#F59E0B',
  error: '#EF4444',

  light: {
    text: '#2D3748',
    background: '#FFFFFF',
    icon: '#6B7280',
    tint: '#2A9D8F',
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    icon: '#9BA1A6',
    tint: '#2A9D8F',
  },
};

/* Espacement/typo centralisés dans constants/design.ts — réexportés ici
   pour ne pas casser les écrans qui les importent depuis constants/theme. */
export { Spacing, Radius, FontSize } from './design';
