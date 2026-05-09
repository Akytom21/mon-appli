import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '@/context/AuthContext';
import { AccessibilityProvider } from '@/context/AccessibilityContext';
import SplashOverlay from '@/components/SplashOverlay';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AccessibilityProvider>
        <AuthProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="(auth)" />
          </Stack>
          <StatusBar style="light" />
          {/* Splash animé — se superpose sur tout jusqu'à résolution de l'auth */}
          <SplashOverlay />
        </AuthProvider>
      </AccessibilityProvider>
    </SafeAreaProvider>
  );
}
