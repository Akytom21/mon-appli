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
import { Feather } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';

const BRAND     = '#0F766E';
const BRAND_DARK = '#0B5F58';
const BRAND_TINT = '#E8F4F2';
const INK       = '#0F1B2D';
const INK_2     = '#475569';
const INK_3     = '#94A3B8';
const BORDER    = '#E5EAF0';
const BG        = '#F6F8FA';

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [loading, setLoading]   = useState(false);

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
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header teal */}
          <View style={styles.header}>
            <View style={styles.headerDeco1} />
            <View style={styles.headerDeco2} />
            <View style={styles.logoRow}>
              <Image
                source={require('@/assets/images/logo.png')}
                style={styles.logoImg}
                resizeMode="contain"
                accessibilityLabel="Logo PharmaSign"
              />
              <View style={styles.logoText}>
                <Text style={styles.appName}>PharmaSign</Text>
                <Text style={styles.tagline}>L'accès aux soins, en langue des signes</Text>
              </View>
            </View>
          </View>

          {/* Card blanc qui remonte sur le header */}
          <View style={styles.card}>
            <View style={styles.cardTitleRow}>
              <Text style={styles.cardTitle}>Connexion</Text>
              <Text style={styles.cardSub}>Bon retour parmi nous.</Text>
            </View>

            {error && (
              <View style={styles.errorBox}>
                <Feather name="alert-circle" size={15} color="#DC2626" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Champ email */}
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

            {/* Champ mot de passe */}
            <View style={styles.field}>
              <Text style={styles.label}>Mot de passe</Text>
              <View style={styles.inputRow}>
                <Feather name="lock" size={17} color={INK_3} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  placeholderTextColor={INK_3}
                  secureTextEntry={!showPwd}
                  accessibilityLabel="Mot de passe"
                />
                <TouchableOpacity
                  onPress={() => setShowPwd((v) => !v)}
                  style={styles.eyeBtn}
                  accessibilityLabel={showPwd ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                >
                  <Feather name={showPwd ? 'eye-off' : 'eye'} size={17} color={INK_3} />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity style={styles.forgotRow} accessibilityRole="button">
              <Text style={styles.forgotText}>Mot de passe oublié ?</Text>
            </TouchableOpacity>

            {/* Bouton principal */}
            <TouchableOpacity
              style={[styles.primaryBtn, loading && { opacity: 0.7 }]}
              onPress={handleLogin}
              disabled={loading}
              accessibilityRole="button"
            >
              <Text style={styles.primaryBtnText}>
                {loading ? 'Connexion…' : 'Se connecter'}
              </Text>
              {!loading && <Feather name="arrow-right" size={18} color="#fff" />}
            </TouchableOpacity>

            {/* Séparateur */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OU</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Bouton créer un compte */}
            <TouchableOpacity
              style={styles.outlineBtn}
              onPress={() => router.push('/(auth)/register')}
              accessibilityRole="button"
            >
              <Text style={styles.outlineBtnText}>Créer un compte</Text>
              <Feather name="arrow-right" size={16} color={BRAND} />
            </TouchableOpacity>

            {/* Bandeau confidentialité */}
            <View style={styles.privacyBanner}>
              <View style={styles.privacyIcon}>
                <Feather name="check" size={13} color="#fff" />
              </View>
              <Text style={styles.privacyText}>
                Confidentialité médicale · Données chiffrées
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: BRAND,
  },
  scrollContent: {
    flexGrow: 1,
    backgroundColor: BG,
  },

  /* Header */
  header: {
    backgroundColor: BRAND,
    paddingTop: 20,
    paddingBottom: 52,
    paddingHorizontal: 24,
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
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
  headerDeco2: {
    position: 'absolute',
    top: 40,
    right: 60,
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  logoRow: {
    alignItems: 'center',
    gap: 14,
    zIndex: 1,
    paddingTop: 8,
  },
  logoImg: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  logoText: {
    alignItems: 'center',
    gap: 4,
  },
  appName: {
    fontSize: 26,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 13.5,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    lineHeight: 18,
  },

  /* Card */
  card: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -20,
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 32,
    gap: 18,
    flex: 1,
    shadowColor: '#0F1B2D',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 8,
  },
  cardTitleRow: { gap: 4 },
  cardTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: INK,
    letterSpacing: -0.5,
  },
  cardSub: {
    fontSize: 13.5,
    color: INK_2,
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
  eyeBtn: {
    padding: 4,
    flexShrink: 0,
  },

  forgotRow: { alignItems: 'flex-end', marginTop: -4 },
  forgotText: { fontSize: 13, color: BRAND, fontWeight: '600' },

  /* Primary button */
  primaryBtn: {
    backgroundColor: BRAND,
    borderRadius: 14,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: BRAND,
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

  /* Divider */
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: BORDER },
  dividerText: { fontSize: 12, color: INK_3, fontWeight: '500' },

  /* Outline button */
  outlineBtn: {
    borderWidth: 1.5,
    borderColor: BORDER,
    backgroundColor: '#fff',
    borderRadius: 14,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  outlineBtnText: {
    fontSize: 14.5,
    fontWeight: '600',
    color: INK,
  },

  /* Privacy banner */
  privacyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: BRAND_TINT,
    borderRadius: 12,
    padding: 12,
    paddingHorizontal: 14,
  },
  privacyIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: BRAND,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  privacyText: {
    fontSize: 12.5,
    color: BRAND_DARK,
    fontWeight: '500',
    lineHeight: 17,
    flex: 1,
  },
});
