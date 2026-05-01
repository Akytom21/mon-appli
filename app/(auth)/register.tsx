import { router } from 'expo-router';
import { useState } from 'react';
import {
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
import { useAuth, Role } from '@/context/AuthContext';
import { Colors, FontSize, Radius, Spacing } from '@/constants/theme';

type RoleOption = {
  id: Role;
  emoji: string;
  title: string;
  subtitle: string;
  color: string;
  lightColor: string;
};

const ROLES: RoleOption[] = [
  {
    id: 'sourd',
    emoji: '🦻',
    title: 'Malentendant / Sourd',
    subtitle: 'Je cherche un interprète LSF pour mes soins',
    color: Colors.malentendants,
    lightColor: Colors.malentendantsLight,
  },
  {
    id: 'interprete',
    emoji: '👐',
    title: 'Interprète LSF agréé',
    subtitle: 'Je propose mes services d\'interprétation médicale',
    color: Colors.interpretes,
    lightColor: Colors.interpretesLight,
  },
  {
    id: 'apprenti',
    emoji: '📚',
    title: 'Apprenti interprète',
    subtitle: 'Je me forme pour devenir interprète LSF médical',
    color: Colors.apprentis,
    lightColor: Colors.apprentisLight,
  },
];

export default function RegisterScreen() {
  const { register } = useAuth();
  const [role, setRole] = useState<Role | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRegister = () => {
    if (!role) { setError('Veuillez choisir votre rôle.'); return; }
    setError(null);
    setLoading(true);
    const err = register(name, email.trim(), password, role);
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
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.appName}>🤲 PharmaSign</Text>
            <Text style={styles.title}>Créer un compte</Text>
          </View>

          {/* Role selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Je suis…</Text>
            <View style={styles.roleList}>
              {ROLES.map((r) => {
                const selected = role === r.id;
                return (
                  <TouchableOpacity
                    key={r.id}
                    style={[
                      styles.roleCard,
                      selected && { borderColor: r.color, backgroundColor: r.lightColor },
                    ]}
                    onPress={() => { setRole(r.id); setError(null); }}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                  >
                    <View style={[styles.roleIconBox, { backgroundColor: selected ? r.color : Colors.border }]}>
                      <Text style={styles.roleEmoji}>{r.emoji}</Text>
                    </View>
                    <View style={styles.roleText}>
                      <Text style={[styles.roleTitle, selected && { color: r.color }]}>
                        {r.title}
                      </Text>
                      <Text style={styles.roleSubtitle}>{r.subtitle}</Text>
                    </View>
                    <View style={[styles.radioCircle, selected && { borderColor: r.color }]}>
                      {selected && <View style={[styles.radioDot, { backgroundColor: r.color }]} />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Form */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Mes informations</Text>

            {error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>⚠️  {error}</Text>
              </View>
            )}

            <View style={styles.field}>
              <Text style={styles.label}>Prénom et nom</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Jean Dupont"
                placeholderTextColor={Colors.textSecondary}
                autoCapitalize="words"
                accessibilityLabel="Prénom et nom"
              />
            </View>

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
                placeholder="6 caractères minimum"
                placeholderTextColor={Colors.textSecondary}
                secureTextEntry
                accessibilityLabel="Mot de passe"
              />
            </View>

            {role === 'apprenti' && (
              <View style={styles.apprentiNote}>
                <Text style={styles.apprentiNoteText}>
                  📋 En tant qu'apprenti, vous pourrez soumettre votre brevet LSF depuis l'application pour évoluer vers le statut d'interprète agréé après validation manuelle.
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.registerBtn, loading && { opacity: 0.7 }]}
              onPress={handleRegister}
              disabled={loading}
              accessibilityRole="button"
            >
              <Text style={styles.registerBtnText}>
                {loading ? 'Création…' : 'Créer mon compte'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.loginLink}
              onPress={() => router.back()}
              accessibilityRole="button"
            >
              <Text style={styles.loginLinkText}>
                J'ai déjà un compte →{' '}
                <Text style={styles.loginLinkBold}>Se connecter</Text>
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
  },

  header: { alignItems: 'center', paddingTop: Spacing.md, gap: Spacing.xs },
  appName: { fontSize: FontSize.lg, fontWeight: '700', color: 'rgba(255,255,255,0.85)' },
  title: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.white },

  section: { gap: Spacing.sm },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: Spacing.xs,
  },
  roleList: { gap: Spacing.sm },
  roleCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  roleIconBox: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  roleEmoji: { fontSize: 24 },
  roleText: { flex: 1, gap: 2 },
  roleTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
  roleSubtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 18 },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  radioDot: { width: 10, height: 10, borderRadius: 5 },

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
  cardTitle: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.textPrimary },

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

  apprentiNote: {
    backgroundColor: Colors.apprentisLight,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: Colors.apprentis,
  },
  apprentiNoteText: {
    fontSize: FontSize.sm,
    color: Colors.apprentisDark,
    lineHeight: 20,
  },

  registerBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  registerBtnText: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.white },

  loginLink: { alignItems: 'center', padding: Spacing.sm },
  loginLinkText: { fontSize: FontSize.sm, color: Colors.textSecondary },
  loginLinkBold: { fontWeight: '700', color: Colors.primary },
});
