import { Redirect, Stack } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { Colors } from '@/constants/theme';
import { ActivityIndicator, View } from 'react-native';

export default function AdminLayout() {
  const { user, initializing } = useAuth();

  console.log('[AdminLayout] initializing =', initializing, '| role =', user?.role ?? '(null)');

  if (initializing) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.primary }}>
        <ActivityIndicator size="large" color={Colors.white} />
      </View>
    );
  }

  if (!user || user.role !== 'admin') {
    console.log('[AdminLayout] ⛔ role non-admin, redirect vers login');
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
    </Stack>
  );
}
