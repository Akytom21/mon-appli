import { View, type ViewProps } from 'react-native';

import { useAccessibility } from '@/context/AccessibilityContext';
import { useThemeColor } from '@/hooks/use-theme-color';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
};

export function ThemedView({ style, lightColor, darkColor, ...otherProps }: ThemedViewProps) {
  const colors = useThemeColor();
  const { isDark } = useAccessibility();
  const backgroundColor = (isDark ? darkColor : lightColor) ?? colors.BG;

  return <View style={[{ backgroundColor }, style]} {...otherProps} />;
}
