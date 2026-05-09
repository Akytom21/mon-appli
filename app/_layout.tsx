import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '@/context/AuthContext';
import { AccessibilityProvider } from '@/context/AccessibilityContext';
import SplashOverlay from '@/components/SplashOverlay';

export const unstable_settings = {
  anchor: '(tabs)',
};

/* Vérifie AsyncStorage au premier mount — redirige vers l'onboarding si jamais vu */
function OnboardingGate() {
  useEffect(() => {
    AsyncStorage.getItem('@pharmasign_onboarding_done')
      .then((done) => { if (!done) router.replace('/onboarding'); })
      .catch(() => {});
  }, []);
  return null;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AccessibilityProvider>
        <AuthProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="onboarding" />
          </Stack>
          <StatusBar style="light" />
          {/* Vérifie si l'onboarding doit être affiché (avant que le splash fade) */}
          <OnboardingGate />
          {/* Splash animé — se superpose sur tout jusqu'à résolution de l'auth */}
          <SplashOverlay />
        </AuthProvider>
      </AccessibilityProvider>
    </SafeAreaProvider>
  );
}
