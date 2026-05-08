import { router } from 'expo-router';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth, storage } from '@/config/firebase';
import { useAuth } from '@/context/AuthContext';

/* ── Design tokens ──────────────────────────────────────── */
const BRAND      = '#0F766E';
const BRAND_DARK = '#0B5F58';
const BRAND_TINT = '#E8F4F2';
const INK        = '#0F1B2D';
const INK_2      = '#475569';
const INK_3      = '#94A3B8';
const BORDER     = '#E5EAF0';
const BG         = '#F6F8FA';
const ERROR      = '#DC2626';
const ERROR_TINT = '#FEF2F2';

const NIVEAUX_LSF  = ['Débutant', 'Intermédiaire', 'Avancé', 'Expert'];
const PREFS_COMMUN = ['LSF exclusif', 'LSF + lecture labiale', 'Écriture + LSF', 'Toutes méthodes'];

export default function ProfilScreen() {
  const { user, updateProfile, logout } = useAuth();

  const [name,       setName]       = useState(user?.name ?? '');
  const [phone,      setPhone]      = useState(user?.phone ?? '');
  const [avatarUri,  setAvatarUri]  = useState<string | null>(user?.avatarUrl ?? null);
  /* Interprète */
  const [zoneKm,    setZoneKm]    = useState(String(user?.zoneKm ?? 20));
  const [languages, setLanguages] = useState(user?.languages?.join(', ') ?? 'LSF, Français');
  const [disponible, setDisponible] = useState(user?.disponible ?? true);
  /* Apprenti */
  const [niveauLSF, setNiveauLSF] = useState(user?.niveauLSF ?? 'Débutant');
  /* Sourd */
  const [prefCommun, setPrefCommun] = useState(user?.prefCommun ?? 'LSF exclusif');

  const [saving,         setSaving]         = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const toastOpacity = useRef(new Animated.Value(0)).current;

  function showToast() {
    toastOpacity.setValue(0);
    Animated.sequence([
      Animated.timing(toastOpacity, { toValue: 1, duration: 280, useNativeDriver: true }),
      Animated.delay(2000),
      Animated.timing(toastOpacity, { toValue: 0, duration: 280, useNativeDriver: true }),
    ]).start();
  }

  const initials = (user?.name ?? '?')
    .split(' ')
    .map((w) => w[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const roleLabel =
    user?.role === 'sourd'      ? 'Personne sourde'
    : user?.role === 'interprete' ? 'Interprète LSF'
    : user?.role === 'apprenti'   ? 'Apprenti interprète'
    : 'Administrateur';

  /* ── Photo ──────────────────────────────────────────────── */
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission refusée', "Autorisez l'accès à la galerie dans les réglages.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (result.canceled || !result.assets[0]) return;
    const uri = result.assets[0].uri;
    setAvatarUri(uri);
    await uploadAvatar(uri);
  };

  const uploadAvatar = async (uri: string) => {
    if (!user) return;
    setUploadingPhoto(true);
    console.log('[profil] uploadAvatar start — uri:', uri.slice(0, 60));
    try {
      console.log('[profil] fetch blob...');
      const response = await fetch(uri);
      const blob = await response.blob();
      console.log('[profil] blob OK — size:', blob.size, 'type:', blob.type);
      const path = `avatars/${user.id}/profile.jpg`;
      console.log('[profil] uploading to Storage path:', path);
      const sRef = storageRef(storage, path);
      await uploadBytes(sRef, blob);
      console.log('[profil] uploadBytes OK — getting download URL...');
      const url = await getDownloadURL(sRef);
      console.log('[profil] getDownloadURL OK — url:', url.slice(0, 70));
      await updateProfile({ avatarUrl: url });
      setAvatarUri(url);
      console.log('[profil] uploadAvatar ✓ done');
    } catch (e) {
      console.error('[profil] uploadAvatar ERROR:', e);
      Alert.alert('Erreur upload', `Impossible d'envoyer la photo.\n${String(e)}`);
    } finally {
      setUploadingPhoto(false);
    }
  };

  /* ── Sauvegarde ─────────────────────────────────────────── */
  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Champ requis', 'Le prénom/nom ne peut pas être vide.');
      return;
    }
    setSaving(true);
    try {
      const updates: Record<string, unknown> = {
        name: name.trim(),
        phone: phone.trim(),
      };
      if (user?.role === 'interprete') {
        updates.zoneKm     = parseInt(zoneKm, 10) || 20;
        updates.languages  = languages.split(',').map((l) => l.trim()).filter(Boolean);
        updates.disponible = disponible;
      }
      if (user?.role === 'apprenti') updates.niveauLSF  = niveauLSF;
      if (user?.role === 'sourd')     updates.prefCommun = prefCommun;

      await updateProfile(updates);
      showToast();
    } catch {
      Alert.alert('Erreur', 'Impossible de sauvegarder le profil.');
    } finally {
      setSaving(false);
    }
  };

  /* ── Mot de passe ───────────────────────────────────────── */
  const handlePasswordReset = () => {
    if (!user?.email) return;
    Alert.alert(
      'Changer mon mot de passe',
      `Un email de réinitialisation sera envoyé à ${user.email}`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Envoyer',
          onPress: async () => {
            try {
              await sendPasswordResetEmail(auth, user.email);
              Alert.alert('Email envoyé ✓', 'Vérifiez votre boîte mail.');
            } catch {
              Alert.alert('Erreur', "Impossible d'envoyer l'email.");
            }
          },
        },
      ],
    );
  };

  /* ── Déconnexion ────────────────────────────────────────── */
  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Voulez-vous vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnexion',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/(auth)/login');
          },
        },
      ],
    );
  };

  /* ── Render ─────────────────────────────────────────────── */
  return (
    <SafeAreaView style={styles.safe}>
      {/* ── Zone teal (header + avatar) ──── */}
      <View style={styles.topArea}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} accessibilityRole="button">
            <Feather name="chevron-left" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Mon profil</Text>
          <View style={{ width: 44 }} />
        </View>

        <View style={styles.avatarArea}>
          <TouchableOpacity style={styles.avatarWrap} onPress={pickImage} activeOpacity={0.85}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatarImg} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitials}>{initials}</Text>
              </View>
            )}
            <View style={styles.cameraBtn}>
              {uploadingPhoto
                ? <ActivityIndicator size="small" color="#fff" />
                : <Feather name="camera" size={12} color="#fff" />
              }
            </View>
          </TouchableOpacity>
          <Text style={styles.avatarName}>{user?.name}</Text>
          <View style={styles.rolePill}>
            <Text style={styles.rolePillText}>{roleLabel}</Text>
          </View>
          <TouchableOpacity onPress={pickImage}>
            <Text style={styles.changePhotoText}>Modifier la photo</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Contenu scrollable ───────────── */}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Informations personnelles */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Informations personnelles</Text>

            <View style={styles.field}>
              <Text style={styles.label}>Prénom et nom</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Jean Dupont"
                placeholderTextColor={INK_3}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>
                Email{'  '}
                <Text style={styles.labelNote}>(non modifiable)</Text>
              </Text>
              <TextInput
                style={[styles.input, styles.inputDisabled]}
                value={user?.email ?? ''}
                editable={false}
              />
            </View>

            <View style={[styles.field, { marginBottom: 0 }]}>
              <Text style={styles.label}>Téléphone</Text>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="+33 6 12 34 56 78"
                placeholderTextColor={INK_3}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          {/* Paramètres interprète */}
          {user?.role === 'interprete' && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Paramètres interprète</Text>

              <View style={styles.field}>
                <Text style={styles.label}>Zone d'intervention (km)</Text>
                <TextInput
                  style={styles.input}
                  value={zoneKm}
                  onChangeText={setZoneKm}
                  placeholder="20"
                  placeholderTextColor={INK_3}
                  keyboardType="number-pad"
                  maxLength={3}
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Langues maîtrisées</Text>
                <TextInput
                  style={styles.input}
                  value={languages}
                  onChangeText={setLanguages}
                  placeholder="LSF, Français, Anglais"
                  placeholderTextColor={INK_3}
                  autoCapitalize="words"
                />
                <Text style={styles.fieldHint}>Séparées par des virgules</Text>
              </View>

              <View style={[styles.field, styles.fieldRow, { marginBottom: 0 }]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Disponible pour missions</Text>
                  <Text style={styles.fieldHint}>
                    {disponible ? 'Visible des patients' : 'Masqué des demandes'}
                  </Text>
                </View>
                <Switch
                  value={disponible}
                  onValueChange={setDisponible}
                  trackColor={{ false: BORDER, true: BRAND + '80' }}
                  thumbColor={disponible ? BRAND : INK_3}
                />
              </View>
            </View>
          )}

          {/* Niveau LSF — apprenti */}
          {user?.role === 'apprenti' && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Niveau LSF actuel</Text>
              <View style={styles.niveauGrid}>
                {NIVEAUX_LSF.map((n) => (
                  <TouchableOpacity
                    key={n}
                    style={[styles.niveauChip, niveauLSF === n && styles.niveauChipActive]}
                    onPress={() => setNiveauLSF(n)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: niveauLSF === n }}
                  >
                    <Text style={[styles.niveauChipText, niveauLSF === n && styles.niveauChipTextActive]}>
                      {n}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Préférences — sourd */}
          {user?.role === 'sourd' && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Préférences de communication</Text>
              {PREFS_COMMUN.map((p) => (
                <TouchableOpacity
                  key={p}
                  style={styles.prefRow}
                  onPress={() => setPrefCommun(p)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: prefCommun === p }}
                >
                  <View style={[styles.radio, prefCommun === p && styles.radioSelected]}>
                    {prefCommun === p && <View style={styles.radioDot} />}
                  </View>
                  <Text style={styles.prefLabel}>{p}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Enregistrer */}
          <TouchableOpacity
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={saving}
            accessibilityRole="button"
          >
            {saving
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.saveBtnText}>Enregistrer ✓</Text>
            }
          </TouchableOpacity>

          {/* Sécurité */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Sécurité</Text>
            <TouchableOpacity style={styles.actionRow} onPress={handlePasswordReset} accessibilityRole="button">
              <View style={styles.actionIcon}>
                <Feather name="lock" size={16} color={BRAND} />
              </View>
              <Text style={styles.actionText}>Changer mon mot de passe</Text>
              <Feather name="chevron-right" size={16} color={INK_3} />
            </TouchableOpacity>
          </View>

          {/* Application */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Application</Text>
            <TouchableOpacity
              style={styles.actionRow}
              onPress={() => router.push('/(tabs)/a-propos')}
              accessibilityRole="button"
            >
              <View style={styles.actionIcon}>
                <Feather name="info" size={16} color={BRAND} />
              </View>
              <Text style={styles.actionText}>À propos de PharmaSign</Text>
              <Feather name="chevron-right" size={16} color={INK_3} />
            </TouchableOpacity>
          </View>

          {/* Compte */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Compte</Text>
            <TouchableOpacity style={styles.actionRow} onPress={handleLogout} accessibilityRole="button">
              <View style={[styles.actionIcon, { backgroundColor: ERROR_TINT }]}>
                <Feather name="log-out" size={16} color={ERROR} />
              </View>
              <Text style={[styles.actionText, { color: ERROR }]}>Se déconnecter</Text>
              <Feather name="chevron-right" size={16} color={ERROR + '80'} />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Toast */}
      <Animated.View style={[styles.toast, { opacity: toastOpacity }]} pointerEvents="none">
        <Feather name="check-circle" size={15} color="#fff" />
        <Text style={styles.toastText}>Profil mis à jour ✓</Text>
      </Animated.View>
    </SafeAreaView>
  );
}

/* ── Styles ─────────────────────────────────────────────── */
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BRAND },

  topArea: { backgroundColor: BRAND, paddingBottom: 20 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 8,
  },
  backBtn: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: {
    flex: 1, textAlign: 'center',
    fontSize: 18, fontWeight: '700', color: '#fff', letterSpacing: -0.3,
  },

  avatarArea: { alignItems: 'center', gap: 6 },
  avatarWrap: {
    width: 88, height: 88, borderRadius: 44,
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.55)',
  },
  avatarImg: { width: '100%', height: '100%', borderRadius: 44 },
  avatarPlaceholder: {
    width: '100%', height: '100%', borderRadius: 44,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarInitials: { fontSize: 30, fontWeight: '800', color: '#fff' },
  cameraBtn: {
    position: 'absolute', bottom: 0, right: 0,
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: BRAND_DARK,
    borderWidth: 2, borderColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarName: { fontSize: 17, fontWeight: '700', color: '#fff', letterSpacing: -0.2, marginTop: 2 },
  rolePill: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999,
  },
  rolePillText: { fontSize: 12, fontWeight: '600', color: '#fff', letterSpacing: 0.2 },
  changePhotoText: { fontSize: 12, color: 'rgba(255,255,255,0.75)', textDecorationLine: 'underline' },

  scroll: { flex: 1, backgroundColor: BG },
  content: { padding: 16, paddingBottom: 48, gap: 12 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 16, padding: 16, gap: 12,
    borderWidth: 1, borderColor: BORDER,
    shadowColor: INK,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  cardTitle: {
    fontSize: 11, fontWeight: '700', color: INK_3,
    textTransform: 'uppercase', letterSpacing: 1,
  },

  field: { gap: 5, marginBottom: 4 },
  fieldRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  label: { fontSize: 13, fontWeight: '600', color: INK_2 },
  labelNote: { fontSize: 12, fontWeight: '400', color: INK_3 },
  input: {
    borderWidth: 1.5, borderColor: BORDER, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 11,
    fontSize: 15, color: INK,
  },
  inputDisabled: { backgroundColor: BG, color: INK_3 },
  fieldHint: { fontSize: 11, color: INK_3, marginTop: 1 },

  niveauGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  niveauChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999,
    borderWidth: 1.5, borderColor: BORDER, backgroundColor: BG,
  },
  niveauChipActive: { borderColor: BRAND, backgroundColor: BRAND_TINT },
  niveauChipText: { fontSize: 13, fontWeight: '600', color: INK_2 },
  niveauChipTextActive: { color: BRAND },

  prefRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 6 },
  radio: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 2, borderColor: BORDER,
    alignItems: 'center', justifyContent: 'center',
  },
  radioSelected: { borderColor: BRAND },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: BRAND },
  prefLabel: { fontSize: 14, color: INK, fontWeight: '500' },

  saveBtn: {
    backgroundColor: BRAND, borderRadius: 14, padding: 15,
    alignItems: 'center',
    shadowColor: BRAND,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 5,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },

  actionRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 2,
  },
  actionIcon: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: BRAND_TINT,
    alignItems: 'center', justifyContent: 'center',
  },
  actionText: { flex: 1, fontSize: 14, fontWeight: '600', color: INK },

  toast: {
    position: 'absolute',
    bottom: 36,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#059669',
    paddingHorizontal: 20, paddingVertical: 12,
    borderRadius: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 8, elevation: 8,
  },
  toastText: { fontSize: 14, fontWeight: '700', color: '#fff' },
});
