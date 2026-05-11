import { Stack } from 'expo-router';
import { Colors } from '@/constants/theme';

export default function InterpretesLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: Colors.interpretes },
        headerTintColor: Colors.white,
        headerTitleStyle: { fontWeight: '700' },
        headerBackTitle: 'Retour',
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" options={{ title: '👐 Espace Interprètes' }} />
      <Stack.Screen name="planning" options={{ title: 'Mon planning' }} />
      <Stack.Screen name="missions" options={{ title: 'Missions disponibles' }} />
    </Stack>
  );
}
