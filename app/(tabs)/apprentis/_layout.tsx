import { Stack } from 'expo-router';

const BRAND = '#0F766E';

export default function ApprentisLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: BRAND },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '700' },
        headerBackTitle: 'Retour',
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="index"      options={{ title: 'Mon parcours' }} />
      <Stack.Screen name="ressources" options={{ title: 'Ressources vidéo LSF' }} />
      <Stack.Screen name="formation"  options={{ title: 'Réserver une formation' }} />
      <Stack.Screen name="brevet"     options={{ title: 'Mon brevet LSF' }} />
    </Stack>
  );
}
