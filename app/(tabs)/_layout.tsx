import { Redirect, Stack } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { Colors } from '@/constants/theme';

export default function TabsLayout() {
  const { user, initializing } = useAuth();

  if (initializing) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.primary }}>
        <ActivityIndicator size="large" color={Colors.white} />
      </View>
    );
  }

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
