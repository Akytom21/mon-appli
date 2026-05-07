import { router } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth, Role } from '@/context/AuthContext';

const BRAND      = '#0F766E';
const BRAND_DARK = '#0B5F58';
const INK        = '#0F1B2D';
const INK_2      = '#475569';
const INK_3      = '#94A3B8';
const BORDER     = '#E5EAF0';
const BG         = '#F6F8FA';

const ROLE_COLORS: Record<string, { c: string; tint: string }> = {
  sourd:      { c: '#0F766E', tint: '#E8F4F2' },
  interprete: { c: '#1D4ED8', tint: '#E6EDFD' },
  apprenti:   { c: '#B45309', tint: '#FEF3C7' },
};

type RoleOption = {
  id: Role;
  title: string;
  sub: string;
  icon: React.ReactNode;
};

function EarIcon({ color }: { color: string }) {
  return <MaterialCommunityIcons name="ear-hearing" size={20} color={color} />;
}
function HandsIcon({ color }: { color: string }) {
  return <MaterialCommunityIcons name="hand-wave" size={20} color={color} />;
}
function BookIcon({ color }: { color: string }) {
  return <Feather name="book-open" size={20} color={color} />;
}

export default function RegisterScreen() {
  const { register } = useAuth();
  const [role, setRole]         = useState<Role>('sourd');
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [loading, setLoading]   = useState(false);

  const accent = ROLE_COLORS[role];

  const handleRegister = async () => {
    setError(null);
    setLoading(true);
    const err = await register(name, email.trim(), password, role);
    setLoading(false);
    if (err) {
      setError(err);
    } else {
      router.replace('/(tabs)');
    }
  };

  const ROLES: RoleOption[] = [
    {
      id: 'sourd',
      title: 'Malentendant / Sourd',
      sub: 'Je cherche un interprète LSF',
      icon: <EarIcon color={role === 'sourd' ? '#fff' : INK_2} />,
    },
    {
      id: 'interprete',
      title: 'Interprète LSF agréé',
      sub: 'Je propose mes services',
      icon: <HandsIcon color={role === 'interprete' ? '#fff' : INK_2} />,
    },
    {
      id: 'apprenti',
      title: 'Apprenti interprète',
      sub: 'Je me forme en LSF médical',
      icon: <BookIcon color={role === 'apprenti' ? '#fff' : INK_2} />,
    },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header teal */}
          <View style={styles.header}>
            <View style={styles.headerDeco1} />
            <View style={styles.topRow}>
              <TouchableOpacity
                style={styles.backBtn}
                onPress={() => router.back()}
                accessibilityRole="button"
                accessibilityLabel="Retour"
              >
                <Feather name="arrow-left" size={18} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.appNameSmall}>PharmaSign</Text>
            </View>
            <View style={styles.headerTitles}>
              <Text style={styles.headerTitle}>Créer un compte</Text>
              <Text style={styles.headerSub}>Quelques minutes suffisent.</Text>
            </View>
          </View>

          {/* Body */}
          <View style={styles.body}>
            {/* Rôle */}
            <View style={styles.sectionBlock}>
              <View style={styles.sectionLabelRow}>
                <Text style={styles.sectionLabel}>Je suis…</Text>
                <Text style={styles.stepHint}>Étape 1/2</Text>
              </View>
              <View style={styles.roleList}>
                {ROLES.map((r) => {
                  const selected = role === r.id;
                  const ac = ROLE_COLORS[r.id];
                  return (
                    <TouchableOpacity
                      key={r.id}
                      style={[
                        styles.roleCard,
                        selected && { borderColor: ac.c, backgroundColor: ac.tint },
                      ]}
                      onPress={() => { setRole(r.id); setError(null); }}
                      accessibilityRole="radio"
                      accessibilityState={{ selected }}
                    >
                      <View
                        style={[
                          styles.roleIconBox,
                          { backgroundColor: selected ? ac.c : '#F1F5F9' },
                        ]}
                      >
                        {r.icon}
                      </View>
                      <View style={styles.roleTextCol}>
                        <Text
                          style={[
                            styles.roleTitle,
                            { color: selected ? ac.c : INK },
                          ]}
                        >
                          {r.title}
                        </Text>
                        <Text style={styles.roleSub}>{r.sub}</Text>
                      </View>
                      <View
                        style={[
                          styles.radioCircle,
                          { borderColor: selected ? ac.c : BORDER },
                          selected && { backgroundColor: ac.c },
                        ]}
                      >
                        {selected && (
                          <Feather name="check" size={11} color="#fff" />
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Formulaire */}
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionLabel}>Mes informations</Text>

              {error && (
                <View style={styles.errorBox}>
                  <Feather name="alert-circle" size={15} color="#DC2626" />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              <View style={styles.field}>
                <Text style={styles.label}>Prénom et nom</Text>
                <View style={styles.inputRow}>
                  <Feather name="user" size={17} color={INK_3} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={name}
                    onChangeText={setName}
                    placeholder="Jean Dupont"
                    placeholderTextColor={INK_3}
                    autoCapitalize="words"
                    accessibilityLabel="Prénom et nom"
                  />
                </View>
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Adresse email</Text>
                <View style={styles.inputRow}>
                  <Feather name="mail" size={17} color={INK_3} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="exemple@email.fr"
                    placeholderTextColor={INK_3}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    accessibilityLabel="Adresse email"
                  />
                </View>
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Mot de passe</Text>
                <View style={styles.inputRow}>
                  <Feather name="lock" size={17} color={INK_3} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="6 caractères minimum"
                    placeholderTextColor={INK_3}
                    secureTextEntry={!showPwd}
                    accessibilityLabel="Mot de passe"
                  />
                  <TouchableOpacity
                    onPress={() => setShowPwd((v) => !v)}
                    style={styles.eyeBtn}
                    accessibilityLabel={showPwd ? 'Masquer' : 'Afficher'}
                  >
                    <Feather name={showPwd ? 'eye-off' : 'eye'} size={17} color={INK_3} />
                  </TouchableOpacity>
                </View>
              </View>

              {role === 'apprenti' && (
                <View style={styles.apprentiNote}>
                  <View style={styles.apprentiNoteIcon}>
                    <Feather name="book-open" size={12} color="#fff" />
                  </View>
                  <Text style={styles.apprentiNoteText}>
                    Vous pourrez soumettre votre brevet LSF depuis l'app pour évoluer vers le statut{' '}
                    <Text style={{ fontWeight: '700' }}>Interprète agréé</Text>.
                  </Text>
                </View>
              )}
            </View>

            {/* Bouton créer */}
            <TouchableOpacity
              style={[
                styles.primaryBtn,
                { backgroundColor: accent.c, shadowColor: accent.c },
                loading && { opacity: 0.7 },
              ]}
              onPress={handleRegister}
              disabled={loading}
              accessibilityRole="button"
            >
              <Text style={styles.primaryBtnText}>
                {loading ? 'Création…' : 'Créer mon compte'}
              </Text>
              {!loading && <Feather name="arrow-right" size={18} color="#fff" />}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.loginLink}
              onPress={() => router.back()}
              accessibilityRole="button"
            >
              <Text style={styles.loginLinkText}>
                J'ai déjà un compte ·{' '}
                <Text style={[styles.loginLinkBold, { color: BRAND }]}>Se connecter</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BRAND },
  scrollContent: { flexGrow: 1, backgroundColor: BG },

  /* Header */
  header: {
    backgroundColor: BRAND,
    paddingTop: 14,
    paddingBottom: 32,
    paddingHorizontal: 20,
    overflow: 'hidden',
    position: 'relative',
    gap: 18,
  },
  headerDeco1: {
    position: 'absolute',
    top: -50,
    right: -30,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    zIndex: 1,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  appNameSmall: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -0.2,
  },
  headerTitles: {
    zIndex: 1,
    gap: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.5,
  },
  headerSub: {
    fontSize: 13.5,
    color: 'rgba(255,255,255,0.82)',
  },

  /* Body */
  body: {
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 32,
    gap: 22,
  },

  sectionBlock: { gap: 10 },
  sectionLabelRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: INK,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  stepHint: {
    fontSize: 11.5,
    color: INK_3,
    fontWeight: '500',
  },

  /* Role cards */
  roleList: { gap: 8 },
  roleCard: {
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: BORDER,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  roleIconBox: {
    width: 40,
    height: 40,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  roleTextCol: { flex: 1, gap: 2 },
  roleTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  roleSub: {
    fontSize: 12.5,
    color: INK_2,
    lineHeight: 17,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  /* Error */
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEE2E2',
    borderRadius: 10,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#DC2626',
  },
  errorText: { fontSize: 13, color: '#DC2626', flex: 1 },

  /* Field */
  field: { gap: 6 },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: INK,
    letterSpacing: 0.1,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: BORDER,
    borderRadius: 12,
    height: 48,
    paddingHorizontal: 14,
    gap: 10,
  },
  inputIcon: { flexShrink: 0 },
  input: {
    flex: 1,
    fontSize: 15,
    color: INK,
    height: '100%',
  },
  eyeBtn: { padding: 4, flexShrink: 0 },

  /* Apprenti note */
  apprentiNote: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 12,
    paddingHorizontal: 14,
    marginTop: 4,
  },
  apprentiNoteIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#B45309',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  apprentiNoteText: {
    fontSize: 12.5,
    color: '#78350F',
    lineHeight: 18,
    flex: 1,
  },

  /* Primary button */
  primaryBtn: {
    borderRadius: 14,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 6,
  },
  primaryBtnText: {
    fontSize: 15.5,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.2,
  },

  loginLink: { alignItems: 'center', padding: 8 },
  loginLinkText: { fontSize: 13.5, color: INK_2 },
  loginLinkBold: { fontWeight: '700' },
});
