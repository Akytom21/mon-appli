import { Stack } from 'expo-router';
import { Colors } from '@/constants/theme';

export default function ApprentisLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: Colors.apprentis },
        headerTintColor: Colors.white,
        headerTitleStyle: { fontWeight: '700' },
        headerBackTitle: 'Retour',
      }}
    >
      <Stack.Screen name="index" options={{ title: '📚 Apprentis Interprètes' }} />
      <Stack.Screen name="formation" options={{ title: 'Réserver une formation' }} />
      <Stack.Screen name="brevet" options={{ title: 'Soumettre mon brevet LSF' }} />
    </Stack>
  );
}
