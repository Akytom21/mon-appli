import { router } from 'expo-router';
import { useState } from 'react';
import {
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

const NIVEAUX = ['Niveau A1', 'Niveau A2', 'Niveau B1', 'Niveau B2 (Brevet officiel)', 'Niveau C1'];
const ORGANISMES = [
  'SERAC (Société Européenne pour les Recherches en LSF)',
  'SURDIFRANCE',
  'ASFORED',
  'INJA (Institut National de Jeunes Aveugles)',
  'Autre organisme agréé',
];

export default function BrevetScreen() {
  const { user, submitBrevet } = useAuth();
  const [niveau, setNiveau] = useState<string | null>(null);
  const [organisme, setOrganisme] = useState<string | null>(null);
  const [annee, setAnnee] = useState('');
  const [numero, setNumero] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (user?.brevetSubmitted || submitted) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <Text style={styles.successEmoji}>🎓</Text>
          </View>
          <Text style={styles.successTitle}>Dossier soumis !</Text>
          <Text style={styles.successText}>
            Votre brevet LSF a été transmis au jury d'agrément PharmaSign. Vous serez notifié(e) de la décision dans un délai de 5 à 10 jours ouvrés.
          </Text>
          <View style={styles.successCard}>
            <Text style={styles.successCardTitle}>Ce qui se passe ensuite</Text>
            <View style={styles.successStep}>
              <Text style={styles.successStepNum}>1</Text>
              <Text style={styles.successStepText}>Vérification de l'authenticité du brevet</Text>
            </View>
            <View style={styles.successStep}>
              <Text style={styles.successStepNum}>2</Text>
              <Text style={styles.successStepText}>Entretien avec un jury (si brevet B2 ou supérieur)</Text>
            </View>
            <View style={styles.successStep}>
              <Text style={styles.successStepNum}>3</Text>
              <Text style={styles.successStepText}>Basculement de votre compte vers le statut Interprète agréé</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.retourBtn}
            onPress={() => router.replace('/(tabs)/apprentis')}
            accessibilityRole="button"
          >
            <Text style={styles.retourBtnText}>Retour à mon espace</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const canSubmit = niveau && organisme && annee.length === 4 && numero.trim().length > 3;

  const handleSubmit = () => {
    submitBrevet();
    setSubmitted(true);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        <View style={styles.intro}>
          <Text style={styles.introTitle}>🎓 Soumettre votre brevet LSF</Text>
          <Text style={styles.introText}>
            Pour évoluer vers le statut d'interprète agréé PharmaSign, soumettez votre brevet LSF reconnu. Un jury validera votre dossier manuellement.
          </Text>
        </View>

        {/* Niveau */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Niveau de brevet</Text>
          {NIVEAUX.map((n) => (
            <TouchableOpacity
              key={n}
              style={[styles.optionRow, niveau === n && styles.optionRowSelected]}
              onPress={() => setNiveau(n)}
              accessibilityRole="radio"
              accessibilityState={{ selected: niveau === n }}
            >
              <View style={[styles.radioCircle, niveau === n && { borderColor: Colors.apprentis }]}>
                {niveau === n && <View style={styles.radioDot} />}
              </View>
              <Text style={[styles.optionText, niveau === n && { color: Colors.apprentis, fontWeight: '700' }]}>
                {n}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Organisme */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Organisme certificateur</Text>
          {ORGANISMES.map((o) => (
            <TouchableOpacity
              key={o}
              style={[styles.optionRow, organisme === o && styles.optionRowSelected]}
              onPress={() => setOrganisme(o)}
              accessibilityRole="radio"
              accessibilityState={{ selected: organisme === o }}
            >
              <View style={[styles.radioCircle, organisme === o && { borderColor: Colors.apprentis }]}>
                {organisme === o && <View style={styles.radioDot} />}
              </View>
              <Text style={[styles.optionText, organisme === o && { color: Colors.apprentis, fontWeight: '700' }]}>
                {o}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Année et numéro */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations du brevet</Text>
          <View style={styles.field}>
            <Text style={styles.label}>Année d'obtention</Text>
            <TextInput
              style={styles.input}
              value={annee}
              onChangeText={setAnnee}
              placeholder="ex : 2024"
              placeholderTextColor={Colors.textSecondary}
              keyboardType="numeric"
              maxLength={4}
              accessibilityLabel="Année d'obtention du brevet"
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Numéro de certificat</Text>
            <TextInput
              style={styles.input}
              value={numero}
              onChangeText={setNumero}
              placeholder="ex : LSF-2024-XXXX"
              placeholderTextColor={Colors.textSecondary}
              autoCapitalize="characters"
              accessibilityLabel="Numéro de certificat"
            />
          </View>
        </View>

        {/* Notice */}
        <View style={styles.notice}>
          <Text style={styles.noticeText}>
            📎 Dans une version finale, vous pourriez joindre une photo ou scan de votre brevet. Pour cette démonstration, les informations saisies suffisent.
          </Text>
        </View>

        {/* Required level info */}
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>ℹ️ Niveau requis</Text>
          <Text style={styles.infoText}>
            Un brevet de niveau <Text style={{ fontWeight: '700' }}>B2 minimum</Text> est requis pour devenir interprète LSF agréé PharmaSign. Les niveaux inférieurs seront examinés au cas par cas.
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.submitBtn, !canSubmit && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={!canSubmit}
          accessibilityRole="button"
        >
          <Text style={styles.submitBtnText}>
            {canSubmit ? '🎓  Soumettre mon dossier' : 'Remplissez tous les champs'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.apprentis },
  scroll: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.lg, paddingBottom: Spacing.xxl, gap: Spacing.lg },

  intro: {
    backgroundColor: Colors.apprentisLight,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: Colors.apprentis,
    gap: Spacing.xs,
  },
  introTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.apprentisDark },
  introText: { fontSize: FontSize.sm, color: Colors.apprentisDark, lineHeight: 20 },

  section: { gap: Spacing.sm },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary },

  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  optionRowSelected: { borderColor: Colors.apprentis, backgroundColor: Colors.apprentisLight },
  radioCircle: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 2, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.apprentis },
  optionText: { fontSize: FontSize.sm, color: Colors.textPrimary, flex: 1 },

  field: { gap: Spacing.xs },
  label: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textPrimary },
  input: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    backgroundColor: Colors.white,
  },

  notice: {
    backgroundColor: '#FEF3C7',
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: Colors.warning,
  },
  noticeText: { fontSize: FontSize.sm, color: '#92400E', lineHeight: 20 },

  infoBox: {
    backgroundColor: Colors.primaryLight,
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: Spacing.xs,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  infoTitle: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.primaryDark },
  infoText: { fontSize: FontSize.sm, color: Colors.primaryDark, lineHeight: 20 },

  submitBtn: {
    backgroundColor: Colors.apprentis,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    shadowColor: Colors.apprentis,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  submitBtnDisabled: { backgroundColor: Colors.textSecondary, shadowOpacity: 0, elevation: 0, opacity: 0.5 },
  submitBtnText: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.white },

  successContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.lg,
  },
  successIcon: {
    width: 96, height: 96, borderRadius: Radius.full,
    backgroundColor: Colors.apprentisLight,
    alignItems: 'center', justifyContent: 'center',
  },
  successEmoji: { fontSize: 48 },
  successTitle: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.textPrimary, textAlign: 'center' },
  successText: { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  successCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    width: '100%',
    gap: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: Colors.apprentis,
  },
  successCardTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
  successStep: { flexDirection: 'row', gap: Spacing.md, alignItems: 'flex-start' },
  successStepNum: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: Colors.apprentis,
    textAlign: 'center',
    lineHeight: 24,
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.white,
    flexShrink: 0,
  },
  successStepText: { flex: 1, fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 20 },
  retourBtn: {
    backgroundColor: Colors.apprentis,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    width: '100%',
  },
  retourBtnText: { fontSize: FontSize.md, fontWeight: '700', color: Colors.white },
});
