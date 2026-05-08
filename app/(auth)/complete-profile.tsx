import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { storage } from '@/config/firebase';
import { useAuth } from '@/context/AuthContext';

const BRAND      = '#0F766E';
const BRAND_DARK = '#0B5F58';
const BRAND_TINT = '#E8F4F2';
const INK        = '#0F1B2D';
const INK_2      = '#475569';
const INK_3      = '#94A3B8';
const BORDER     = '#E5EAF0';
const BG         = '#F6F8FA';

const NIVEAUX_LSF  = ['Débutant', 'Intermédiaire', 'Avancé', 'Expert'];
const PREFS_COMMUN = ['LSF exclusif', 'LSF + lecture labiale', 'Écriture + LSF', 'Toutes méthodes'];

export default function CompleteProfileScreen() {
  const { user, updateProfile } = useAuth();

  const [phone,          setPhone]          = useState('');
  const [avatarUri,      setAvatarUri]      = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [zoneKm,         setZoneKm]         = useState('20');
  const [disponible,     setDisponible]     = useState(true);
  const [niveauLSF,      setNiveauLSF]      = useState('Débutant');
  const [prefCommun,     setPrefCommun]     = useState('LSF exclusif');
  const [saving,         setSaving]         = useState(false);

  useEffect(() => {
    if (!user) router.replace('/(auth)/login');
  }, [user]);

  if (!user) return null;

  const initials = user.name
    .split(' ')
    .map((w) => w[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const roleLabel =
    user.role === 'sourd'      ? 'Malentendant / Sourd'
    : user.role === 'interprete' ? 'Interprète LSF'
    : user.role === 'apprenti'   ? 'Apprenti interprète'
    : 'Administrateur';

  /* ── Photo ──────────────────────────────────────────── */
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
    setUploadingPhoto(true);
    console.log('[complete-profile] upload start — uri:', uri.slice(0, 60));
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      console.log('[complete-profile] blob OK — size:', blob.size, 'type:', blob.type);
      const sRef = storageRef(storage, `avatars/${user.id}/profile.jpg`);
      await uploadBytes(sRef, blob);
      console.log('[complete-profile] uploadBytes OK');
      const url = await getDownloadURL(sRef);
      console.log('[complete-profile] URL OK:', url.slice(0, 60));
      await updateProfile({ avatarUrl: url });
      setAvatarUri(url);
    } catch (e) {
      console.error('[complete-profile] upload ERROR:', e);
      Alert.alert('Photo non enregistrée', "Vous pourrez l'ajouter depuis votre profil plus tard.");
    } finally {
      setUploadingPhoto(false);
    }
  };

  /* ── Navigation ─────────────────────────────────────── */
  const navigateToApp = () => router.replace('/(tabs)');

  /* ── Sauvegarde ─────────────────────────────────────── */
  const handleFinish = async () => {
    setSaving(true);
    try {
      const updates: Record<string, unknown> = {};
      if (phone.trim()) updates.phone = phone.trim();
      if (user.role === 'interprete') {
        updates.zoneKm     = parseInt(zoneKm, 10) || 20;
        updates.disponible = disponible;
      }
      if (user.role === 'apprenti') updates.niveauLSF  = niveauLSF;
      if (user.role === 'sourd')    updates.prefCommun = prefCommun;

      if (Object.keys(updates).length > 0) {
        await updateProfile(updates);
        console.log('[complete-profile] profile saved:', updates);
      }
    } catch (e) {
      console.error('[complete-profile] save error:', e);
    } finally {
      setSaving(false);
      navigateToApp();
    }
  };

  /* ── Render ─────────────────────────────────────────── */
  return (
    <SafeAreaView style={styles.safe}>
      {/* ── Zone teal (header + avatar) ── */}
      <View style={styles.topArea}>
        <View style={styles.headerDeco} />

        {/* Barre de navigation */}
        <View style={styles.navBar}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} accessibilityRole="button">
            <Feather name="chevron-left" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={styles.stepPill}>
            <Text style={styles.stepPillText}>Étape 2 · Finalisation</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        {/* Titre */}
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Finalisez votre profil</Text>
          <Text style={styles.headerSub}>
            Ces informations sont optionnelles — vous pourrez les modifier à tout moment.
          </Text>
        </View>

        {/* Avatar + nom */}
        <View style={styles.avatarRow}>
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
                : <Feather name="camera" size={13} color="#fff" />
              }
            </View>
          </TouchableOpacity>

          <View style={styles.avatarMeta}>
            <Text style={styles.avatarName}>{user.name}</Text>
            <View style={styles.rolePill}>
              <Text style={styles.rolePillText}>{roleLabel}</Text>
            </View>
            <TouchableOpacity onPress={pickImage} accessibilityRole="button">
              <Text style={styles.photoLink}>
                {avatarUri ? 'Changer la photo' : 'Ajouter une photo'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* ── Champs scrollables ── */}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >

          {/* Contact (tous) */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Contact</Text>
            <View style={styles.field}>
              <Text style={styles.label}>
                Téléphone{'  '}
                <Text style={styles.labelOpt}>(optionnel)</Text>
              </Text>
              <View style={styles.inputRow}>
                <Feather name="phone" size={16} color={INK_3} style={{ flexShrink: 0 }} />
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
          </View>

          {/* Interprète */}
          {user.role === 'interprete' && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Paramètres interprète</Text>

              <View style={styles.field}>
                <Text style={styles.label}>Zone d'intervention (km)</Text>
                <View style={styles.inputRow}>
                  <Feather name="map-pin" size={16} color={INK_3} style={{ flexShrink: 0 }} />
                  <TextInput
                    style={styles.input}
                    value={zoneKm}
                    onChangeText={setZoneKm}
                    placeholder="20"
                    placeholderTextColor={INK_3}
                    keyboardType="number-pad"
                    maxLength={3}
                  />
                  <Text style={styles.inputSuffix}>km</Text>
                </View>
              </View>

              <View style={styles.switchRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Disponible pour missions</Text>
                  <Text style={styles.fieldHint}>
                    {disponible ? 'Visible dans les recherches patients' : 'Masqué des demandes'}
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

          {/* Apprenti */}
          {user.role === 'apprenti' && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Niveau LSF actuel</Text>
              <View style={styles.chipGrid}>
                {NIVEAUX_LSF.map((n) => (
                  <TouchableOpacity
                    key={n}
                    style={[styles.chip, niveauLSF === n && styles.chipActive]}
                    onPress={() => setNiveauLSF(n)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: niveauLSF === n }}
                  >
                    <Text style={[styles.chipText, niveauLSF === n && styles.chipTextActive]}>
                      {n}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Sourd */}
          {user.role === 'sourd' && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Préférences de communication</Text>
              {PREFS_COMMUN.map((p) => (
                <TouchableOpacity
                  key={p}
                  style={styles.radioRow}
                  onPress={() => setPrefCommun(p)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: prefCommun === p }}
                >
                  <View style={[styles.radio, prefCommun === p && styles.radioOn]}>
                    {prefCommun === p && <View style={styles.radioDot} />}
                  </View>
                  <Text style={styles.radioLabel}>{p}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Bouton Terminer */}
          <TouchableOpacity
            style={[styles.primaryBtn, saving && { opacity: 0.65 }]}
            onPress={handleFinish}
            disabled={saving}
            accessibilityRole="button"
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.primaryBtnText}>Terminer</Text>
                <Feather name="check" size={18} color="#fff" />
              </>
            )}
          </TouchableOpacity>

          {/* Bouton Passer */}
          <TouchableOpacity
            style={styles.skipBtn}
            onPress={navigateToApp}
            disabled={saving}
            accessibilityRole="button"
          >
            <Text style={styles.skipBtnText}>Passer pour l'instant</Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BRAND },

  topArea: {
    backgroundColor: BRAND,
    paddingBottom: 24,
    overflow: 'hidden',
    position: 'relative',
  },
  headerDeco: {
    position: 'absolute',
    top: -60, right: -40,
    width: 220, height: 220, borderRadius: 110,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },

  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
    zIndex: 1,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  stepPill: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
  },
  stepPillText: { fontSize: 12, fontWeight: '600', color: '#fff' },

  headerContent: {
    paddingHorizontal: 20, marginTop: 10, gap: 4, zIndex: 1,
  },
  headerTitle: {
    fontSize: 22, fontWeight: '800', color: '#fff', letterSpacing: -0.5,
  },
  headerSub: {
    fontSize: 13, color: 'rgba(255,255,255,0.8)', lineHeight: 18,
  },

  avatarRow: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    paddingHorizontal: 20, marginTop: 18, zIndex: 1,
  },
  avatarWrap: {
    width: 76, height: 76, borderRadius: 38,
    borderWidth: 2.5, borderColor: 'rgba(255,255,255,0.5)',
    flexShrink: 0,
  },
  avatarImg: { width: '100%', height: '100%', borderRadius: 38 },
  avatarPlaceholder: {
    width: '100%', height: '100%', borderRadius: 38,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarInitials: { fontSize: 26, fontWeight: '800', color: '#fff' },
  cameraBtn: {
    position: 'absolute', bottom: 0, right: 0,
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: BRAND_DARK,
    borderWidth: 2, borderColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarMeta: { flex: 1, gap: 6 },
  avatarName: { fontSize: 16, fontWeight: '700', color: '#fff', letterSpacing: -0.2 },
  rolePill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999,
  },
  rolePillText: { fontSize: 11.5, fontWeight: '600', color: '#fff' },
  photoLink: {
    fontSize: 12, color: 'rgba(255,255,255,0.72)', textDecorationLine: 'underline',
  },

  scroll: { flex: 1, backgroundColor: BG },
  content: { padding: 16, paddingBottom: 40, gap: 12 },

  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16, gap: 12,
    borderWidth: 1, borderColor: BORDER,
    shadowColor: INK, shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  cardTitle: {
    fontSize: 11, fontWeight: '700', color: INK_3,
    textTransform: 'uppercase', letterSpacing: 1,
  },

  field: { gap: 6 },
  label: { fontSize: 13, fontWeight: '600', color: INK_2 },
  labelOpt: { fontSize: 12, fontWeight: '400', color: INK_3 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: BG,
    borderWidth: 1.5, borderColor: BORDER, borderRadius: 12,
    height: 48, paddingHorizontal: 14, gap: 10,
  },
  input: { flex: 1, fontSize: 15, color: INK },
  inputSuffix: { fontSize: 13, color: INK_3, fontWeight: '500' },
  fieldHint: { fontSize: 11, color: INK_3, marginTop: 1 },

  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },

  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999,
    borderWidth: 1.5, borderColor: BORDER, backgroundColor: BG,
  },
  chipActive: { borderColor: BRAND, backgroundColor: BRAND_TINT },
  chipText: { fontSize: 13, fontWeight: '600', color: INK_2 },
  chipTextActive: { color: BRAND },

  radioRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 6,
  },
  radio: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 2, borderColor: BORDER,
    alignItems: 'center', justifyContent: 'center',
  },
  radioOn: { borderColor: BRAND },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: BRAND },
  radioLabel: { fontSize: 14, color: INK, fontWeight: '500' },

  primaryBtn: {
    backgroundColor: BRAND, borderRadius: 14, height: 52,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    shadowColor: BRAND, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 5,
  },
  primaryBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },

  skipBtn: { alignItems: 'center', paddingVertical: 14 },
  skipBtnText: { fontSize: 14, color: INK_3, fontWeight: '500' },
});
