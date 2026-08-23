import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/config/firebase';
import { useAuth } from '@/context/AuthContext';
import { useThemeColor } from '@/hooks/use-theme-color';
import type { ColorTokens } from '@/constants/design';

export default function LoginScreen() {
  const { login } = useAuth();
  const colors = useThemeColor();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [loading, setLoading]   = useState(false);

  const [showForgot, setShowForgot]       = useState(false);
  const [forgotEmail, setForgotEmail]     = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError]     = useState<string | null>(null);
  const [forgotSuccess, setForgotSuccess] = useState(false);

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

  const closeForgot = () => {
    setShowForgot(false);
    setForgotEmail('');
    setForgotError(null);
    setForgotSuccess(false);
  };

  const handleForgotPassword = async () => {
    setForgotError(null);
    if (!forgotEmail.trim()) {
      setForgotError('Veuillez saisir votre adresse email.');
      return;
    }
    setForgotLoading(true);
    try {
      await sendPasswordResetEmail(auth, forgotEmail.trim());
      setForgotSuccess(true);
    } catch (e: unknown) {
      const code = (e as { code?: string })?.code;
      if (code === 'auth/invalid-email') {
        setForgotError('Adresse email invalide.');
      } else {
        setForgotError('Email ou mot de passe incorrect.');
      }
    } finally {
      setForgotLoading(false);
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
                <Feather name="alert-circle" size={15} color={colors.ERROR} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Champ email */}
            <View style={styles.field}>
              <Text style={styles.label}>Adresse email</Text>
              <View style={styles.inputRow}>
                <Feather name="mail" size={17} color={colors.INK_3} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="exemple@email.fr"
                  placeholderTextColor={colors.INK_3}
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
                <Feather name="lock" size={17} color={colors.INK_3} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  placeholderTextColor={colors.INK_3}
                  secureTextEntry={!showPwd}
                  accessibilityLabel="Mot de passe"
                />
                <TouchableOpacity
                  onPress={() => setShowPwd((v) => !v)}
                  style={styles.eyeBtn}
                  accessibilityLabel={showPwd ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                >
                  <Feather name={showPwd ? 'eye-off' : 'eye'} size={17} color={colors.INK_3} />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={styles.forgotRow}
              accessibilityRole="button"
              onPress={() => setShowForgot(true)}
            >
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
              <Feather name="arrow-right" size={16} color={colors.BRAND} />
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

            <View style={styles.footerRow}>
              <Text style={styles.copyright}>© Tom Caucigh</Text>
              <Text style={styles.footerSep}>·</Text>
              <TouchableOpacity
                onPress={() => router.push('/(auth)/privacy')}
                accessibilityRole="link"
                accessibilityLabel="Politique de confidentialité"
              >
                <Text style={styles.privacyLink}>Confidentialité</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Modal : mot de passe oublié ───────────────── */}
      <Modal
        visible={showForgot}
        transparent
        animationType="fade"
        onRequestClose={closeForgot}
      >
        <View style={styles.overlay}>
          <View style={styles.modalCard}>

            {/* Header teal */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Mot de passe oublié</Text>
              <TouchableOpacity
                onPress={closeForgot}
                style={styles.closeBtn}
                accessibilityLabel="Fermer"
              >
                <Feather name="x" size={20} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Corps */}
            <View style={styles.modalBody}>
              <Text style={styles.modalDesc}>
                Saisissez votre email pour recevoir un lien de réinitialisation.
              </Text>

              {forgotError && (
                <View style={styles.errorBox}>
                  <Feather name="alert-circle" size={15} color={colors.ERROR} />
                  <Text style={styles.errorText}>{forgotError}</Text>
                </View>
              )}

              {forgotSuccess ? (
                <>
                  <View style={styles.successBox}>
                    <Feather name="check-circle" size={15} color={colors.SUCCESS} />
                    <Text style={styles.successText}>
                      Un email de réinitialisation a été envoyé à {forgotEmail}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.outlineBtn}
                    onPress={closeForgot}
                    accessibilityRole="button"
                  >
                    <Text style={styles.outlineBtnText}>Fermer</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <View style={styles.field}>
                    <Text style={styles.label}>Adresse email</Text>
                    <View style={styles.inputRow}>
                      <Feather name="mail" size={17} color={colors.INK_3} style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        value={forgotEmail}
                        onChangeText={setForgotEmail}
                        placeholder="exemple@email.fr"
                        placeholderTextColor={colors.INK_3}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        accessibilityLabel="Email pour réinitialisation"
                        autoFocus
                      />
                    </View>
                  </View>

                  <TouchableOpacity
                    style={[styles.primaryBtn, forgotLoading && { opacity: 0.7 }]}
                    onPress={handleForgotPassword}
                    disabled={forgotLoading}
                    accessibilityRole="button"
                  >
                    {forgotLoading ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <>
                        <Text style={styles.primaryBtnText}>Envoyer le lien</Text>
                        <Feather name="send" size={16} color="#fff" />
                      </>
                    )}
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function createStyles(colors: ColorTokens) {
  return StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.BRAND,
  },
  scrollContent: {
    flexGrow: 1,
    backgroundColor: colors.BG,
  },

  /* Header */
  header: {
    backgroundColor: colors.BRAND,
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
    backgroundColor: colors.SURFACE,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -20,
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 32,
    gap: 18,
    flex: 1,
    shadowColor: colors.INK_1,
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 8,
  },
  cardTitleRow: { gap: 4 },
  cardTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.INK_1,
    letterSpacing: -0.5,
  },
  cardSub: {
    fontSize: 13.5,
    color: colors.INK_2,
  },

  /* Error */
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.ERROR_TINT,
    borderRadius: 10,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: colors.ERROR,
  },
  errorText: { fontSize: 13, color: colors.ERROR, flex: 1 },

  /* Field */
  field: { gap: 6 },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.INK_1,
    letterSpacing: 0.1,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.SURFACE,
    borderWidth: 1.5,
    borderColor: colors.BORDER,
    borderRadius: 12,
    height: 48,
    paddingHorizontal: 14,
    gap: 10,
  },
  inputIcon: { flexShrink: 0 },
  input: {
    flex: 1,
    fontSize: 15,
    color: colors.INK_1,
    height: '100%',
  },
  eyeBtn: {
    padding: 4,
    flexShrink: 0,
  },

  forgotRow: { alignItems: 'flex-end', marginTop: -4 },
  forgotText: { fontSize: 13, color: colors.BRAND, fontWeight: '600' },

  /* Primary button */
  primaryBtn: {
    backgroundColor: colors.BRAND,
    borderRadius: 14,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: colors.BRAND,
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
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.BORDER },
  dividerText: { fontSize: 12, color: colors.INK_3, fontWeight: '500' },

  /* Outline button */
  outlineBtn: {
    borderWidth: 1.5,
    borderColor: colors.BORDER,
    backgroundColor: colors.SURFACE,
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
    color: colors.INK_1,
  },

  /* Modal forgot password */
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 27, 45, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    backgroundColor: colors.SURFACE,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: colors.INK_1,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 32,
    elevation: 12,
  },
  modalHeader: {
    backgroundColor: colors.BRAND,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -0.2,
  },
  closeBtn: { padding: 4 },
  modalBody: {
    padding: 22,
    gap: 16,
  },
  modalDesc: {
    fontSize: 13.5,
    color: colors.INK_2,
    lineHeight: 19,
  },
  successBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: colors.SUCCESS + '22',
    borderRadius: 10,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: colors.SUCCESS,
  },
  successText: {
    fontSize: 13,
    color: colors.SUCCESS,
    flex: 1,
    lineHeight: 18,
  },

  /* Privacy banner */
  privacyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.BRAND_TINT,
    borderRadius: 12,
    padding: 12,
    paddingHorizontal: 14,
  },
  privacyIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.BRAND,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  privacyText: {
    fontSize: 12.5,
    color: colors.BRAND_DARK,
    fontWeight: '500',
    lineHeight: 17,
    flex: 1,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  copyright: {
    fontSize: 12,
    color: colors.INK_3,
  },
  footerSep: {
    fontSize: 12,
    color: colors.BORDER,
  },
  privacyLink: {
    fontSize: 12,
    color: colors.BRAND,
    fontWeight: '600',
  },
  });
}
