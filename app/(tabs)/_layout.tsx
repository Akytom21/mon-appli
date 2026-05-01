import { Redirect, Stack } from 'expo-router';
import { useAuth } from '@/context/AuthContext';

export default function TabsLayout() {
  const { user } = useAuth();

  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="malentendants" />
      <Stack.Screen name="interpretes" />
      <Stack.Screen name="apprentis" />
    </Stack>
  );
}
