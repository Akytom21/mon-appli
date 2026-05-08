import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Easing,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { getDownloadURL, ref as storageRef, uploadBytesResumable } from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';
import { db, storage } from '@/config/firebase';
import { useAuth } from '@/context/AuthContext';

/* ── Design tokens ───────────────────────────────────────── */
const BRAND      = '#0F766E';
const BRAND_DARK = '#0B5F58';
const BRAND_TINT = '#E8F4F2';
const INK        = '#0F1B2D';
const INK_2      = '#475569';
const INK_3      = '#94A3B8';
const BORDER     = '#E5EAF0';
const BG         = '#F6F8FA';
const AMBER      = '#B45309';
const AMBER_BG   = '#FEF3C7';
const GOLD       = '#F59E0B';

/* ── Data ────────────────────────────────────────────────── */
const NIVEAUX = [
  'Niveau A1',
  'Niveau A2',
  'Niveau B1',
  'Niveau B2 (Brevet officiel)',
  'Niveau C1',
];
const ORGANISMES = [
  'SERAC (Société Européenne pour les Recherches en LSF)',
  'SURDIFRANCE',
  'ASFORED',
  'INJA (Institut National de Jeunes Aveugles)',
  'Autre organisme agréé',
];

/* ── Helpers ─────────────────────────────────────────────── */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / 1024 / 1024).toFixed(1)} Mo`;
}

/* ── Stepper ─────────────────────────────────────────────── */
function Stepper({ step1, step2, step3, step4 }: { step1: boolean; step2: boolean; step3: boolean; step4: boolean }) {
  const steps = [
    { n: 1, label: 'Niveau',    done: step1 },
    { n: 2, label: 'Organisme', done: step2 },
    { n: 3, label: 'Infos',     done: step3 },
    { n: 4, label: 'Certificat',done: step4 },
  ];
  return (
    <View style={st.row}>
      {steps.map((step, i) => (
        <View key={step.n} style={st.stepWrap}>
          {i > 0 && <View style={[st.line, steps[i - 1].done && st.lineDone]} />}
          <View style={[st.dot, step.done && st.dotDone]}>
            {step.done
              ? <Feather name="check" size={12} color="#fff" />
              : <Text style={st.dotNum}>{step.n}</Text>}
          </View>
          <Text style={[st.label, step.done && st.labelDone]}>{step.label}</Text>
        </View>
      ))}
    </View>
  );
}
const st = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center', paddingHorizontal: 24, paddingBottom: 20, gap: 0 },
  stepWrap: { alignItems: 'center', gap: 6, flex: 1, position: 'relative' },
  line: {
    position: 'absolute', top: 14, right: '50%', left: '-50%',
    height: 2, backgroundColor: 'rgba(255,255,255,0.3)',
  },
  lineDone: { backgroundColor: '#fff' },
  dot: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)',
  },
  dotDone: { backgroundColor: '#fff', borderColor: '#fff' },
  dotNum: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.8)' },
  label: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.7)', textAlign: 'center' },
  labelDone: { color: '#fff', fontWeight: '700' },
});

/* ── Écran en attente ────────────────────────────────────── */
function PendingScreen() {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.12, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1,    duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    ).start();
  }, []);

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.pendingHeader}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.replace('/(tabs)/apprentis')} accessibilityRole="button">
          <Feather name="chevron-left" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Mon Brevet LSF</Text>
      </View>
      <View style={s.statusContainer}>
        <Animated.View style={[s.statusIconWrap, s.statusIconPending, { transform: [{ scale: pulse }] }]}>
          <Text style={{ fontSize: 44 }}>⏳</Text>
        </Animated.View>
        <Text style={s.statusTitle}>En cours de validation</Text>
        <Text style={s.statusText}>
          Votre dossier est examiné par le jury d'agrément PharmaSign. Vous serez notifié(e) du résultat dans un délai de 5 à 10 jours ouvrés.
        </Text>
        <View style={s.stepsCard}>
          <Text style={s.stepsCardTitle}>Étapes en cours</Text>
          {[
            "Vérification de l'authenticité du brevet",
            'Entretien avec un jury (si brevet B2 ou supérieur)',
            'Décision et notification par email',
          ].map((step, i) => (
            <View key={i} style={s.stepRow}>
              <View style={[s.stepNum, i === 0 && s.stepNumActive]}>
                <Text style={s.stepNumText}>{i + 1}</Text>
              </View>
              <Text style={s.stepText}>{step}</Text>
            </View>
          ))}
        </View>
        <TouchableOpacity
          style={s.retourBtn}
          onPress={() => router.replace('/(tabs)/apprentis')}
          accessibilityRole="button"
        >
          <Text style={s.retourBtnText}>Retour à mon espace</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

/* ── Écran brevet validé ─────────────────────────────────── */
function ValidatedScreen() {
  const { upgradeToInterprete } = useAuth();
  const scale = useRef(new Animated.Value(0.6)).current;
  const [upgrading, setUpgrading] = useState(false);

  useEffect(() => {
    Animated.spring(scale, { toValue: 1, friction: 6, tension: 80, useNativeDriver: true }).start();
  }, []);

  const handleUpgrade = async () => {
    setUpgrading(true);
    await upgradeToInterprete();
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.pendingHeader}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.replace('/(tabs)/apprentis')} accessibilityRole="button">
          <Feather name="chevron-left" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Mon Brevet LSF</Text>
      </View>
      <View style={s.statusContainer}>
        <Animated.View style={[s.statusIconWrap, s.statusIconValidated, { transform: [{ scale }] }]}>
          <Text style={{ fontSize: 44 }}>🏆</Text>
        </Animated.View>
        <Text style={s.statusTitle}>Brevet validé !</Text>
        <Text style={s.statusText}>
          Félicitations ! Le jury a validé votre brevet LSF. Vous pouvez désormais devenir Interprète agréé PharmaSign.
        </Text>
        <View style={[s.stepsCard, s.stepsCardSuccess]}>
          <Text style={[s.stepsCardTitle, { color: BRAND_DARK }]}>Ce que vous obtenez</Text>
          {[
            "Accès aux missions d'interprétation médicale",
            'Badge Interprète agréé sur votre profil',
            'Rémunération pour chaque mission réalisée',
          ].map((item, i) => (
            <View key={i} style={s.stepRow}>
              <View style={[s.stepNum, s.stepNumSuccess]}>
                <Feather name="check" size={12} color="#fff" />
              </View>
              <Text style={s.stepText}>{item}</Text>
            </View>
          ))}
        </View>
        <TouchableOpacity
          style={[s.upgradeBtn, upgrading && { opacity: 0.7 }]}
          onPress={handleUpgrade}
          disabled={upgrading}
          accessibilityRole="button"
        >
          <Text style={s.upgradeBtnText}>
            {upgrading ? 'Mise à jour…' : '🌟  Devenir Interprète agréé'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.replace('/(tabs)/apprentis')} accessibilityRole="button">
          <Text style={s.laterLink}>Plus tard</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

/* ── Formulaire principal ────────────────────────────────── */
export default function BrevetScreen() {
  const { user, submitBrevet } = useAuth();
  const [niveau, setNiveau] = useState<string | null>(null);
  const [organisme, setOrganisme] = useState<string | null>(null);
  const [annee, setAnnee] = useState('');
  const [numero, setNumero] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const [certAsset, setCertAsset] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [certUrl, setCertUrl] = useState<string | null>(null);
  const [showCertError, setShowCertError] = useState(false);

  if (user?.brevetValidated) return <ValidatedScreen />;
  if (user?.brevetSubmitted || submitted) return <PendingScreen />;

  const otherFieldsReady =
    !!niveau && !!organisme && annee.length === 4 && numero.trim().length > 3 && !uploading;
  const canSubmit = otherFieldsReady && !!certUrl;

  const pickCertificate = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/jpeg', 'image/png'],
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets[0]) return;
      const asset = result.assets[0];
      setCertAsset(asset);
      setCertUrl(null);
      setShowCertError(false);
      setUploadProgress(0);
      uploadCertificate(asset);
    } catch {
      Alert.alert('Erreur', "Impossible d'ouvrir le sélecteur de fichiers.");
    }
  };

  const uploadCertificate = async (asset: DocumentPicker.DocumentPickerAsset) => {
    if (!user) return;
    setUploading(true);
    try {
      const response = await fetch(asset.uri);
      const blob = await response.blob();
      const filename = `${Date.now()}_${asset.name}`;
      const fileRef = storageRef(storage, `certificates/${user.id}/${filename}`);
      const task = uploadBytesResumable(fileRef, blob);
      task.on(
        'state_changed',
        (snap) => setUploadProgress(snap.bytesTransferred / snap.totalBytes),
        () => {
          setUploading(false);
          Alert.alert('Erreur', "L'upload a échoué. Vérifiez votre connexion.");
        },
        async () => {
          const url = await getDownloadURL(task.snapshot.ref);
          setCertUrl(url);
          setUploading(false);
          setUploadProgress(1);
        },
      );
    } catch {
      setUploading(false);
      Alert.alert('Erreur', "Impossible d'envoyer le fichier.");
    }
  };

  const handleSubmit = async () => {
    if (!certUrl) {
      setShowCertError(true);
      return;
    }
    setShowCertError(false);
    await submitBrevet({ niveau: niveau!, organisme: organisme!, annee, numero });
    await updateDoc(doc(db, 'users', user!.id), { certificateUrl: certUrl });
    setSubmitted(true);
  };

  return (
    <SafeAreaView style={s.safe}>

      {/* Header teal */}
      <View style={s.formHeader}>
        <View style={s.formHeaderDeco1} />
        <View style={s.formHeaderDeco2} />
        <View style={s.headerRow}>
          <TouchableOpacity style={s.backBtn} onPress={() => router.back()} accessibilityRole="button">
            <Feather name="chevron-left" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 8 }}>
            <Text style={s.headerTitle}>Mon Brevet LSF</Text>
            <Text style={s.headerSub}>Soumission pour agrément PharmaSign</Text>
          </View>
        </View>

        {/* Stepper */}
        <Stepper
          step1={!!niveau}
          step2={!!organisme}
          step3={annee.length === 4 && numero.trim().length > 3}
          step4={!!certUrl}
        />
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Info card */}
        <View style={s.infoBanner}>
          <Feather name="info" size={15} color={BRAND} />
          <Text style={s.infoBannerText}>
            Pour évoluer vers le statut Interprète agréé, soumettez votre brevet LSF reconnu. Un jury validera votre dossier manuellement.
          </Text>
        </View>

        {/* Section 1 : Niveau */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <View style={s.sectionBadge}><Text style={s.sectionBadgeText}>1</Text></View>
            <Text style={s.sectionTitle}>Niveau de brevet</Text>
          </View>
          <View style={s.optionList}>
            {NIVEAUX.map((n) => (
              <TouchableOpacity
                key={n}
                style={[s.optionRow, niveau === n && s.optionRowSelected]}
                onPress={() => setNiveau(n)}
                accessibilityRole="radio"
                accessibilityState={{ selected: niveau === n }}
              >
                <View style={[s.radio, niveau === n && s.radioSelected]}>
                  {niveau === n && <View style={s.radioDot} />}
                </View>
                <Text style={[s.optionText, niveau === n && s.optionTextSelected]}>{n}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Section 2 : Organisme */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <View style={s.sectionBadge}><Text style={s.sectionBadgeText}>2</Text></View>
            <Text style={s.sectionTitle}>Organisme certificateur</Text>
          </View>
          <View style={s.optionList}>
            {ORGANISMES.map((o) => (
              <TouchableOpacity
                key={o}
                style={[s.optionRow, organisme === o && s.optionRowSelected]}
                onPress={() => setOrganisme(o)}
                accessibilityRole="radio"
                accessibilityState={{ selected: organisme === o }}
              >
                <View style={[s.radio, organisme === o && s.radioSelected]}>
                  {organisme === o && <View style={s.radioDot} />}
                </View>
                <Text style={[s.optionText, organisme === o && s.optionTextSelected]}>{o}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Section 3 : Informations */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <View style={s.sectionBadge}><Text style={s.sectionBadgeText}>3</Text></View>
            <Text style={s.sectionTitle}>Informations du brevet</Text>
          </View>
          <View style={s.fields}>
            <View style={s.field}>
              <Text style={s.label}>Année d'obtention</Text>
              <View style={s.inputWrap}>
                <Feather name="calendar" size={16} color={INK_3} style={s.inputIcon} />
                <TextInput
                  style={s.input}
                  value={annee}
                  onChangeText={setAnnee}
                  placeholder="ex : 2024"
                  placeholderTextColor={INK_3}
                  keyboardType="numeric"
                  maxLength={4}
                  accessibilityLabel="Année d'obtention du brevet"
                />
              </View>
            </View>
            <View style={s.field}>
              <Text style={s.label}>Numéro de certificat</Text>
              <View style={s.inputWrap}>
                <Feather name="hash" size={16} color={INK_3} style={s.inputIcon} />
                <TextInput
                  style={s.input}
                  value={numero}
                  onChangeText={setNumero}
                  placeholder="ex : LSF-2024-XXXX"
                  placeholderTextColor={INK_3}
                  autoCapitalize="characters"
                  accessibilityLabel="Numéro de certificat"
                />
              </View>
            </View>
          </View>
        </View>

        {/* Section 4 : Certificat */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <View style={s.sectionBadge}><Text style={s.sectionBadgeText}>4</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={s.sectionTitle}>Certificat LSF</Text>
              <Text style={s.sectionSub}>PDF, JPG ou PNG · obligatoire</Text>
            </View>
          </View>

          {!certAsset ? (
            /* Zone de dépôt vide */
            <TouchableOpacity
              style={s.dropZone}
              onPress={pickCertificate}
              accessibilityRole="button"
              accessibilityLabel="Choisir un fichier certificat"
            >
              <View style={s.dropZoneIcon}>
                <Feather name="paperclip" size={26} color={BRAND} />
              </View>
              <Text style={s.dropZoneTitle}>
                Joindre mon certificat <Text style={{ color: '#EF4444' }}>*</Text>
              </Text>
              <Text style={s.dropZoneSub}>Appuyez pour choisir un fichier depuis votre téléphone</Text>
            </TouchableOpacity>
          ) : (
            /* Fichier sélectionné */
            <View style={s.fileCard}>
              <View style={s.fileIconWrap}>
                <Feather
                  name={certAsset.mimeType === 'application/pdf' ? 'file-text' : 'image'}
                  size={22}
                  color={BRAND}
                />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={s.fileName} numberOfLines={1}>{certAsset.name}</Text>
                <Text style={s.fileMeta}>
                  {certAsset.size ? formatFileSize(certAsset.size) : '—'}
                  {certUrl ? '  ·  ✓ Envoyé' : uploading ? `  ·  ${Math.round(uploadProgress * 100)} %` : ''}
                </Text>
                {/* Barre de progression */}
                {uploading && (
                  <View style={s.progressTrack}>
                    <View style={[s.progressFill, { width: `${Math.round(uploadProgress * 100)}%` }]} />
                  </View>
                )}
                {certUrl && (
                  <View style={s.uploadedBadge}>
                    <Feather name="check-circle" size={12} color={BRAND} />
                    <Text style={s.uploadedText}>Fichier envoyé avec succès</Text>
                  </View>
                )}
              </View>
              {!uploading && (
                <TouchableOpacity
                  style={s.removeBtn}
                  onPress={() => { setCertAsset(null); setCertUrl(null); setUploadProgress(0); }}
                  accessibilityRole="button"
                  accessibilityLabel="Supprimer le fichier"
                >
                  <Feather name="x" size={16} color={INK_3} />
                </TouchableOpacity>
              )}
            </View>
          )}
          {showCertError && (
            <View style={s.certError}>
              <Feather name="alert-circle" size={14} color={AMBER} />
              <Text style={s.certErrorText}>
                Veuillez joindre votre certificat LSF avant de soumettre
              </Text>
            </View>
          )}
        </View>

        {/* Info niveau B2 */}
        <View style={s.infoBox}>
          <View style={s.infoBoxHeader}>
            <Feather name="info" size={14} color={BRAND} />
            <Text style={s.infoBoxTitle}>Niveau requis</Text>
          </View>
          <Text style={s.infoBoxText}>
            Un brevet de niveau{' '}
            <Text style={{ fontWeight: '700', color: BRAND }}>B2 minimum</Text>
            {' '}est requis pour devenir interprète LSF agréé PharmaSign. Les niveaux inférieurs seront examinés au cas par cas.
          </Text>
        </View>

        {/* Bouton soumettre */}
        <TouchableOpacity
          style={[s.submitBtn, !canSubmit && s.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={!otherFieldsReady}
          accessibilityRole="button"
        >
          <Feather
            name={uploading ? 'upload-cloud' : canSubmit ? 'send' : 'lock'}
            size={18}
            color="#fff"
          />
          <Text style={s.submitBtnText}>
            {uploading
              ? `Upload en cours… ${Math.round(uploadProgress * 100)} %`
              : canSubmit
              ? 'Soumettre mon dossier'
              : 'Remplissez tous les champs'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BRAND },
  scroll: { flex: 1, backgroundColor: BG },
  content: { padding: 20, paddingBottom: 40, gap: 20 },

  /* Form header */
  formHeader: {
    backgroundColor: BRAND, paddingTop: 16, overflow: 'hidden', position: 'relative',
  },
  formHeaderDeco1: {
    position: 'absolute', top: -50, right: -30,
    width: 160, height: 160, borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  formHeaderDeco2: {
    position: 'absolute', top: 20, right: 60,
    width: 70, height: 70, borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 16, zIndex: 1 },
  backBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#fff', letterSpacing: -0.3 },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 2 },

  /* Pending/validated header (simpler) */
  pendingHeader: {
    backgroundColor: BRAND,
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14, gap: 10,
  },

  /* Info banner */
  infoBanner: {
    flexDirection: 'row', gap: 10, alignItems: 'flex-start',
    backgroundColor: BRAND_TINT, borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: '#A7D4D0',
  },
  infoBannerText: { flex: 1, fontSize: 13.5, color: BRAND_DARK, lineHeight: 19 },

  /* Sections */
  section: { gap: 12 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sectionBadge: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: BRAND, alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  sectionBadgeText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: INK, letterSpacing: -0.3 },

  optionList: { gap: 8 },
  optionRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#fff', borderRadius: 12, padding: 14,
    borderWidth: 1.5, borderColor: BORDER,
  },
  optionRowSelected: { borderColor: BRAND, backgroundColor: BRAND_TINT },
  radio: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 2, borderColor: BORDER,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  radioSelected: { borderColor: BRAND },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: BRAND },
  optionText: { fontSize: 14, color: INK_2, flex: 1, lineHeight: 19 },
  optionTextSelected: { color: BRAND, fontWeight: '600' },

  /* Fields */
  fields: { gap: 12 },
  field: { gap: 6 },
  label: { fontSize: 13.5, fontWeight: '600', color: INK, marginLeft: 2 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 12,
    borderWidth: 1.5, borderColor: BORDER, overflow: 'hidden',
  },
  inputIcon: { paddingLeft: 14 },
  input: {
    flex: 1, paddingHorizontal: 12, paddingVertical: 14,
    fontSize: 15, color: INK,
  },

  /* Section sub-label */
  sectionSub: { fontSize: 11.5, color: INK_3, marginTop: 1 },

  /* Drop zone */
  dropZone: {
    borderWidth: 1.5, borderColor: BRAND, borderStyle: 'dashed',
    borderRadius: 14, padding: 22, alignItems: 'center', gap: 8,
    backgroundColor: BRAND_TINT,
  },
  dropZoneIcon: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: '#A7D4D0',
    shadowColor: BRAND, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12, shadowRadius: 6, elevation: 2,
  },
  dropZoneTitle: { fontSize: 15, fontWeight: '700', color: BRAND },
  dropZoneSub: { fontSize: 12.5, color: INK_2, textAlign: 'center', lineHeight: 17 },

  /* File card */
  fileCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    backgroundColor: '#fff', borderRadius: 14, padding: 14,
    borderWidth: 1.5, borderColor: BRAND,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  fileIconWrap: {
    width: 42, height: 42, borderRadius: 10,
    backgroundColor: BRAND_TINT, alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  fileName: { fontSize: 14, fontWeight: '600', color: INK },
  fileMeta: { fontSize: 12, color: INK_3 },
  progressTrack: {
    height: 4, borderRadius: 2, backgroundColor: BORDER,
    overflow: 'hidden', marginTop: 4,
  },
  progressFill: {
    height: 4, borderRadius: 2, backgroundColor: BRAND,
  },
  uploadedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2,
  },
  uploadedText: { fontSize: 11.5, fontWeight: '600', color: BRAND },
  removeBtn: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: BG, alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },

  /* Cert error */
  certError: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: AMBER_BG, borderRadius: 10, padding: 12,
    borderWidth: 1, borderColor: '#FCD34D',
  },
  certErrorText: { flex: 1, fontSize: 13, color: AMBER, lineHeight: 18, fontWeight: '600' },

  /* Info box */
  infoBox: {
    backgroundColor: BRAND_TINT, borderRadius: 12, padding: 14,
    gap: 8, borderLeftWidth: 3, borderLeftColor: BRAND,
  },
  infoBoxHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoBoxTitle: { fontSize: 14, fontWeight: '700', color: BRAND_DARK },
  infoBoxText: { fontSize: 13.5, color: BRAND_DARK, lineHeight: 19 },

  /* Submit button */
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: BRAND, borderRadius: 16, padding: 16,
    shadowColor: BRAND, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 5,
  },
  submitBtnDisabled: { backgroundColor: '#94A3B8', shadowOpacity: 0, elevation: 0 },
  submitBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },

  /* Status screens shared */
  statusContainer: {
    flex: 1, backgroundColor: BG, padding: 24,
    alignItems: 'center', justifyContent: 'center', gap: 18,
  },
  statusIconWrap: {
    width: 100, height: 100, borderRadius: 50,
    alignItems: 'center', justifyContent: 'center',
  },
  statusIconPending: { backgroundColor: AMBER_BG },
  statusIconValidated: { backgroundColor: BRAND_TINT },
  statusTitle: {
    fontSize: 26, fontWeight: '800', color: INK,
    letterSpacing: -0.5, textAlign: 'center',
  },
  statusText: {
    fontSize: 15, color: INK_2, textAlign: 'center',
    lineHeight: 22, paddingHorizontal: 8,
  },
  stepsCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 20,
    width: '100%', gap: 14,
    borderWidth: 1, borderColor: BORDER,
    borderLeftWidth: 4, borderLeftColor: GOLD,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
  },
  stepsCardSuccess: { borderLeftColor: BRAND },
  stepsCardTitle: { fontSize: 15, fontWeight: '700', color: INK, letterSpacing: -0.2 },
  stepRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  stepNum: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: BORDER, alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  stepNumActive: { backgroundColor: BRAND },
  stepNumSuccess: { backgroundColor: BRAND },
  stepNumText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  stepText: { flex: 1, fontSize: 14, color: INK_2, lineHeight: 20 },

  upgradeBtn: {
    backgroundColor: BRAND_DARK, borderRadius: 16, padding: 16,
    alignItems: 'center', width: '100%',
    flexDirection: 'row', justifyContent: 'center', gap: 8,
    borderWidth: 2, borderColor: GOLD,
    shadowColor: GOLD, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 12, elevation: 5,
  },
  upgradeBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  laterLink: {
    fontSize: 14, color: INK_3,
    textDecorationLine: 'underline', marginTop: -8,
  },

  retourBtn: {
    backgroundColor: BRAND, borderRadius: 14, padding: 16,
    alignItems: 'center', width: '100%',
  },
  retourBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
