import { router } from 'expo-router';
import { useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { Colors, FontSize, Radius, Spacing } from '@/constants/theme';

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError(null);
    setLoading(true);
    const err = await login(email.trim(), password);
    setLoading(false);
    if (err) {
      setError(err);
    } else {
      router.replace('/(tabs)');
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo */}
          <View style={styles.logoArea}>
            <Image
              source={require('@/assets/images/logo.png')}
              style={styles.logo}
              resizeMode="contain"
              accessibilityLabel="Logo PharmaSign"
            />
            <Text style={styles.appName}>PharmaSign</Text>
            <Text style={styles.tagline}>L'accès aux soins pour tous</Text>
          </View>

          {/* Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Connexion</Text>

            {error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>⚠️  {error}</Text>
              </View>
            )}

            <View style={styles.field}>
              <Text style={styles.label}>Adresse email</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="exemple@email.fr"
                placeholderTextColor={Colors.textSecondary}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                accessibilityLabel="Adresse email"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Mot de passe</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor={Colors.textSecondary}
                secureTextEntry
                accessibilityLabel="Mot de passe"
              />
            </View>

            <TouchableOpacity
              style={[styles.loginBtn, loading && { opacity: 0.7 }]}
              onPress={handleLogin}
              disabled={loading}
              accessibilityRole="button"
            >
              <Text style={styles.loginBtnText}>
                {loading ? 'Connexion…' : 'Se connecter'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.registerLink}
              onPress={() => router.push('/(auth)/register')}
              accessibilityRole="button"
            >
              <Text style={styles.registerLinkText}>
                Pas encore de compte ?{' '}
                <Text style={styles.registerLinkBold}>Créer un compte →</Text>
              </Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.primary },
  content: {
    flexGrow: 1,
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
    gap: Spacing.lg,
    justifyContent: 'center',
  },

  logoArea: { alignItems: 'center', gap: Spacing.sm },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  appName: {
    fontSize: FontSize.xxxl,
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: 1,
  },
  tagline: {
    fontSize: FontSize.sm,
    color: 'rgba(255,255,255,0.8)',
    fontStyle: 'italic',
  },

  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    gap: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  cardTitle: {
    fontSize: FontSize.xl,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },

  errorBox: {
    backgroundColor: '#FEE2E2',
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: Colors.error,
  },
  errorText: { fontSize: FontSize.sm, color: Colors.error },

  field: { gap: Spacing.xs },
  label: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textPrimary },
  input: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    backgroundColor: Colors.background,
  },

  loginBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  loginBtnText: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.white },

  registerLink: { alignItems: 'center', padding: Spacing.sm },
  registerLinkText: { fontSize: FontSize.sm, color: Colors.textSecondary },
  registerLinkBold: { fontWeight: '700', color: Colors.primary },

});
