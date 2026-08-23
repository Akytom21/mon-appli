import { Redirect, Stack } from 'expo-router';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';

export default function InterpretesLayout() {
  const { user } = useAuth();
  if (user?.role !== 'interprete') return <Redirect href="/(auth)/login" />;
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
