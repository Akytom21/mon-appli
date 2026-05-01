import { Stack } from 'expo-router';
import { Colors } from '@/constants/theme';

export default function MalentendantsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: Colors.malentendants },
        headerTintColor: Colors.white,
        headerTitleStyle: { fontWeight: '700' },
        headerBackTitle: 'Retour',
      }}
    >
      <Stack.Screen name="index" options={{ title: '🤟 Espace Malentendants' }} />
      <Stack.Screen name="rendez-vous" options={{ title: 'Prendre un rendez-vous' }} />
      <Stack.Screen name="confirmation" options={{ title: 'Confirmation', headerBackVisible: false }} />
    </Stack>
  );
}
