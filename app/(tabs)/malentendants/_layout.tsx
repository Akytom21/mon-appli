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
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="index"        options={{ title: '🤟 Espace Malentendants' }} />
      <Stack.Screen name="rendez-vous"  options={{ title: 'Prendre un rendez-vous' }} />
      <Stack.Screen name="confirmation" options={{ title: 'Confirmation', headerBackVisible: false }} />
      <Stack.Screen name="mes-rdv"      options={{ title: 'Mes rendez-vous' }} />
      <Stack.Screen name="dictionnaire" options={{ title: 'Dictionnaire LSF', headerShown: false }} />
      <Stack.Screen name="annuaire"     options={{ title: 'Annuaire LSF Nice', headerShown: false }} />
      <Stack.Screen name="sos"          options={{ title: 'SOS Urgences', headerShown: false, animation: 'slide_from_bottom' }} />
      <Stack.Screen name="falc"         options={{ title: 'Fiches Santé FALC', headerShown: false }} />
    </Stack>
  );
}
