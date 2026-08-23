import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { FontSize, Radius, Spacing } from '@/constants/theme';
import type { ColorTokens } from '@/constants/design';
import { useThemeColor } from '@/hooks/use-theme-color';
import { HEALTH_PROFESSIONALS } from '@/data/healthProfessionals';
import { useHealthProfessionalsSearch } from '@/hooks/useHealthProfessionals';
import { useCreateAppointment } from '@/hooks/useAppointments';
import { getDoctolibUrl } from '@/utils/doctolib';
import { useAccessibility } from '@/context/AccessibilityContext';

/* ─── Locale française ─────────────────────────────────── */
LocaleConfig.locales['fr'] = {
  monthNames: ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'],
  monthNamesShort: ['Janv.','Févr.','Mars','Avr.','Mai','Juin','Juil.','Août','Sept.','Oct.','Nov.','Déc.'],
  dayNames: ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'],
  dayNamesShort: ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'],
  today: "Aujourd'hui",
};
LocaleConfig.defaultLocale = 'fr';

/* ─── Catégories ─────────────────────────────────────────── */
type CategoryId = 'generaliste' | 'urgences' | 'specialiste' | 'pharmacie';

const CATEGORIES: { id: CategoryId; label: string; emoji: string }[] = [
  { id: 'generaliste', label: 'Médecin généraliste', emoji: '🩺' },
  { id: 'urgences',    label: 'Urgences',             emoji: '🚨' },
  { id: 'specialiste', label: 'Spécialiste',          emoji: '👨‍⚕️' },
  { id: 'pharmacie',   label: 'Pharmacie',            emoji: '💊' },
];

/* ─── Créneaux horaires ──────────────────────────────────── */
const TIME_SLOTS: string[] = [];
for (let h = 8; h <= 19; h++) {
  TIME_SLOTS.push(`${String(h).padStart(2, '0')}:00`);
  if (h < 19) TIME_SLOTS.push(`${String(h).padStart(2, '0')}:30`);
}

/* ─── Type interne Provider (vue formulaire) ─────────────── */
type Provider = {
  id: string;
  name: string;
  address: string;
  type: CategoryId;
  specialite?: string;
  latitude?: number;
  longitude?: number;
};

const CATEGORY_EMOJI: Record<CategoryId, string> = {
  generaliste: '🩺',
  urgences: '🚨',
  specialiste: '👨‍⚕️',
  pharmacie: '💊',
};

const TODAY = new Date().toISOString().split('T')[0];

/* ─── Composant ──────────────────────────────────────────── */
export default function RendezVousScreen() {
  const { professionals, loading: profLoading } = useHealthProfessionalsSearch();
  const createAppointment = useCreateAppointment();
  const a11y = useAccessibility();
  const colors = useThemeColor();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [selectedCategory, setSelectedCategory] = useState<CategoryId | null>(null);
  const [searchQuery, setSearchQuery]           = useState('');
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [selectedDate, setSelectedDate]         = useState('');
  const [selectedTime, setSelectedTime]         = useState('');
  const [submitting, setSubmitting]             = useState(false);

  /* Mapping Firestore → Provider */
  const allProviders = useMemo<Provider[]>(() => {
    const firestoreProviders: Provider[] = professionals
      .filter((p) => p.category !== 'hospital')
      .map((p) => ({
        id: p.id,
        name: p.name,
        address: p.address,
        type: p.category === 'doctor'     ? 'generaliste'
            : p.category === 'specialist' ? 'specialiste'
            : 'pharmacie',
        specialite: p.specialite || undefined,
        latitude: p.latitude,
        longitude: p.longitude,
      }));

    const hospitals: Provider[] = HEALTH_PROFESSIONALS
      .filter((p) => p.category === 'hospital')
      .map((p) => ({
        id: p.id,
        name: p.name,
        address: p.address,
        type: 'urgences' as CategoryId,
        latitude: p.latitude,
        longitude: p.longitude,
      }));

    return [...hospitals, ...firestoreProviders];
  }, [professionals]);

  /* Suggestions filtrées */
  const suggestions = useMemo<Provider[]>(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q || selectedProvider) return [];
    return allProviders.filter((p) => {
      const matchType = !selectedCategory || p.type === selectedCategory;
      const matchText =
        p.name.toLowerCase().includes(q) ||
        p.address.toLowerCase().includes(q) ||
        (p.specialite?.toLowerCase().includes(q) ?? false);
      return matchType && matchText;
    }).slice(0, 6);
  }, [searchQuery, selectedCategory, selectedProvider, allProviders]);

  const handleSelectCategory = (id: CategoryId) => {
    setSelectedCategory(id);
    if (selectedProvider && selectedProvider.type !== id) {
      setSelectedProvider(null);
      setSearchQuery('');
    }
  };

  const handleSelectProvider = (p: Provider) => {
    setSelectedProvider(p);
    setSearchQuery(p.name);
  };

  const handleClearProvider = () => {
    setSelectedProvider(null);
    setSearchQuery('');
  };

  const markedDates = selectedDate
    ? { [selectedDate]: { selected: true, selectedColor: colors.BRAND, selectedTextColor: '#fff' } }
    : {};

  const canSubmit = selectedCategory && selectedProvider && selectedDate && selectedTime;

  const handleSubmit = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    try {
      await createAppointment({
        professionalName: selectedProvider!.name,
        professionalAddress: selectedProvider!.address,
        professionalType: selectedCategory!,
        date: selectedDate,
        time: selectedTime,
        coordinates: selectedProvider!.latitude
          ? { lat: selectedProvider!.latitude!, lng: selectedProvider!.longitude! }
          : undefined,
      });

      router.push({
        pathname: '/(tabs)/malentendants/confirmation',
        params: {
          type: selectedCategory!,
          professionalName: selectedProvider!.name,
          address: selectedProvider!.address,
          date: selectedDate,
          time: selectedTime,
        },
      });
    } catch {
      Alert.alert('Erreur', 'Impossible de créer le rendez-vous. Vérifiez votre connexion.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Lien vers historique */}
          <TouchableOpacity
            style={styles.myRdvLink}
            onPress={() => router.push('/(tabs)/malentendants/mes-rdv')}
            accessibilityRole="button"
          >
            <Text style={styles.myRdvLinkText}>📋 Voir mes rendez-vous</Text>
            <Text style={styles.myRdvLinkArrow}>›</Text>
          </TouchableOpacity>

          {/* Intro */}
          <View style={styles.intro}>
            <Text style={styles.introText}>
              Renseignez votre besoin et nous trouverons l'interprète LSF disponible le plus proche de votre rendez-vous.
            </Text>
          </View>

          {/* ── 1. Catégorie ── */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { fontSize: a11y.scale(FontSize.lg) }]}>Type de rendez-vous</Text>
            <View style={styles.categoryGrid}>
              {CATEGORIES.map((cat) => {
                const active = selectedCategory === cat.id;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.categoryCard,
                      active && styles.categoryCardActive,
                      {
                        borderWidth: a11y.hcBorder(2),
                        backgroundColor: a11y.hcBg(active ? colors.BRAND_TINT : colors.SURFACE),
                      },
                    ]}
                    onPress={() => handleSelectCategory(cat.id)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={cat.label}
                    accessibilityHint="Double-tapez pour sélectionner ce type de rendez-vous"
                  >
                    <Text
                      style={[styles.categoryEmoji, { fontSize: a11y.scale(36) }]}
                      accessible={false}
                    >
                      {cat.emoji}
                    </Text>
                    <Text style={[
                      styles.categoryLabel,
                      active && styles.categoryLabelActive,
                      {
                        fontSize: a11y.scale(FontSize.sm),
                        color: a11y.hcFg(active ? colors.BRAND : colors.INK_2),
                      },
                    ]}>
                      {cat.label}
                    </Text>
                    {active && (
                      <View style={styles.categoryCheck} accessible={false}>
                        <Text style={styles.categoryCheckText}>✓</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* ── 2. Lieu / Professionnel ── */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { fontSize: a11y.scale(FontSize.lg) }]}>Lieu du rendez-vous</Text>
            <Text style={styles.sectionSub}>
              {selectedCategory
                ? `Rechercher parmi les ${CATEGORIES.find(c => c.id === selectedCategory)?.label.toLowerCase()}s de Nice`
                : 'Tapez un nom ou une adresse à Nice'}
            </Text>

            <View style={styles.searchRow}>
              <TextInput
                style={[styles.searchInput, selectedProvider && styles.searchInputFilled]}
                value={searchQuery}
                onChangeText={(t) => {
                  setSearchQuery(t);
                  if (selectedProvider) setSelectedProvider(null);
                }}
                placeholder={profLoading ? 'Chargement des professionnels…' : 'Ex : Dr. Lefèvre, Pharmacie Masséna…'}
                placeholderTextColor={colors.INK_2}
                autoCorrect={false}
                editable={!profLoading}
                accessibilityLabel="Rechercher un professionnel de santé"
              />
              {profLoading
                ? <ActivityIndicator style={styles.clearBtn} color={colors.BRAND} size="small" />
                : searchQuery.length > 0 && (
                    <TouchableOpacity style={styles.clearBtn} onPress={handleClearProvider} accessibilityLabel="Effacer">
                      <Text style={styles.clearBtnText}>✕</Text>
                    </TouchableOpacity>
                  )
              }
            </View>

            {suggestions.length > 0 && (
              <View style={styles.suggestions}>
                {suggestions.map((p, idx) => (
                  <TouchableOpacity
                    key={p.id}
                    style={[styles.suggestion, idx < suggestions.length - 1 && styles.suggestionBorder]}
                    onPress={() => handleSelectProvider(p)}
                    accessibilityRole="button"
                  >
                    <Text style={styles.suggestionEmoji}>{CATEGORY_EMOJI[p.type]}</Text>
                    <View style={styles.suggestionText}>
                      <Text style={styles.suggestionName}>
                        {p.name}
                        {p.specialite ? (
                          <Text style={styles.suggestionSpecialite}> · {p.specialite}</Text>
                        ) : null}
                      </Text>
                      <Text style={styles.suggestionAddress} numberOfLines={1}>
                        📍 {p.address}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {searchQuery.length > 1 && !selectedProvider && suggestions.length === 0 && (
              <View style={styles.noResult}>
                <Text style={styles.noResultText}>
                  Aucun résultat pour « {searchQuery} »
                  {selectedCategory ? ` dans les ${CATEGORIES.find(c => c.id === selectedCategory)?.label.toLowerCase()}s` : ''}
                </Text>
              </View>
            )}

            {selectedProvider && (
              <>
                <View style={styles.selectedCard}>
                  <Text style={styles.selectedEmoji}>{CATEGORY_EMOJI[selectedProvider.type]}</Text>
                  <View style={styles.selectedInfo}>
                    <Text style={styles.selectedName}>
                      {selectedProvider.name}
                      {selectedProvider.specialite ? ` — ${selectedProvider.specialite}` : ''}
                    </Text>
                    <Text style={styles.selectedAddress}>📍 {selectedProvider.address}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.selectedClear}
                    onPress={handleClearProvider}
                    accessibilityLabel="Changer de professionnel"
                  >
                    <Text style={styles.selectedClearText}>✕</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.doctolibBlock}>
                  <TouchableOpacity
                    style={styles.doctolibBtn}
                    onPress={() => Linking.openURL(
                      getDoctolibUrl(selectedProvider.name, selectedProvider.type, selectedProvider.specialite)
                    )}
                    accessibilityRole="button"
                    accessibilityLabel="Prendre rendez-vous sur Doctolib"
                  >
                    <View style={styles.doctolibLogo}>
                      <Text style={styles.doctolibLogoText}>D</Text>
                    </View>
                    <Text style={styles.doctolibBtnText}>Prendre RDV sur Doctolib 🔗</Text>
                  </TouchableOpacity>
                  <Text style={styles.doctolibHint}>
                    Vous serez redirigé vers Doctolib pour finaliser votre rendez-vous médical
                  </Text>
                </View>
              </>
            )}
          </View>

          {/* ── 3. Calendrier ── */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { fontSize: a11y.scale(FontSize.lg) }]}>Date du rendez-vous</Text>
            {selectedDate ? (
              <Text style={styles.sectionSub}>
                Sélectionné : {new Date(selectedDate + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </Text>
            ) : (
              <Text style={styles.sectionSub}>Appuyez sur un jour pour le sélectionner</Text>
            )}
            <View style={styles.calendarWrapper}>
              <Calendar
                onDayPress={(day: { dateString: string }) => setSelectedDate(day.dateString)}
                markedDates={markedDates}
                minDate={TODAY}
                theme={{
                  backgroundColor: colors.SURFACE,
                  calendarBackground: colors.SURFACE,
                  selectedDayBackgroundColor: colors.BRAND,
                  selectedDayTextColor: '#fff',
                  todayTextColor: colors.BRAND,
                  todayBackgroundColor: colors.BRAND_TINT,
                  dayTextColor: colors.INK_1,
                  textDisabledColor: colors.BORDER,
                  arrowColor: colors.BRAND,
                  monthTextColor: colors.INK_1,
                  textDayFontWeight: '500',
                  textMonthFontWeight: '700',
                  textDayHeaderFontWeight: '600',
                  textDayFontSize: FontSize.sm,
                  textMonthFontSize: FontSize.md,
                  textDayHeaderFontSize: FontSize.xs,
                }}
              />
            </View>
          </View>

          {/* ── 4. Heure ── */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { fontSize: a11y.scale(FontSize.lg) }]}>Heure du rendez-vous</Text>
            <Text style={styles.sectionSub}>
              {selectedTime ? `Sélectionné : ${selectedTime}` : 'Créneaux disponibles (toutes les 30 min)'}
            </Text>
            <View style={styles.timeGrid}>
              {TIME_SLOTS.map((slot) => {
                const active = selectedTime === slot;
                return (
                  <TouchableOpacity
                    key={slot}
                    style={[styles.timeSlot, active && styles.timeSlotActive]}
                    onPress={() => setSelectedTime(slot)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={`Créneau ${slot}`}
                    accessibilityHint="Double-tapez pour sélectionner ce créneau"
                  >
                    <Text style={[styles.timeSlotText, active && styles.timeSlotTextActive, { fontSize: a11y.scale(FontSize.sm) }]}>
                      {slot}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* ── Récapitulatif ── */}
          {(selectedCategory || selectedProvider || selectedDate || selectedTime) && (
            <View style={styles.recap}>
              <Text style={styles.recapTitle}>📋 Récapitulatif</Text>
              {selectedCategory && (
                <Text style={styles.recapLine}>
                  {CATEGORY_EMOJI[selectedCategory]}  {CATEGORIES.find(c => c.id === selectedCategory)?.label}
                </Text>
              )}
              {selectedProvider && (
                <Text style={styles.recapLine}>📍  {selectedProvider.name} — {selectedProvider.address}</Text>
              )}
              {selectedDate && (
                <Text style={styles.recapLine}>
                  📅  {new Date(selectedDate + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                </Text>
              )}
              {selectedTime && (
                <Text style={styles.recapLine}>🕐  {selectedTime}</Text>
              )}
            </View>
          )}

          {/* ── Bouton submit ── */}
          <TouchableOpacity
            style={[styles.submitBtn, (!canSubmit || submitting) && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={!canSubmit || submitting}
            accessibilityRole="button"
            accessibilityLabel="Confirmer la demande de rendez-vous"
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={[styles.submitText, { fontSize: a11y.scale(FontSize.lg) }]}>
                {canSubmit ? '✓  Confirmer la demande' : 'Complétez tous les champs'}
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* ─── Styles ─────────────────────────────────────────────── */
function createStyles(colors: ColorTokens) {
  return StyleSheet.create({
  safe:    { flex: 1, backgroundColor: colors.BRAND },
  scroll:  { flex: 1, backgroundColor: colors.BG },
  content: { padding: Spacing.lg, paddingBottom: Spacing.xxl, gap: Spacing.xl },

  myRdvLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.BRAND_TINT,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: colors.BRAND,
  },
  myRdvLinkText: { fontSize: FontSize.sm, fontWeight: '600', color: colors.BRAND_DARK },
  myRdvLinkArrow: { fontSize: FontSize.lg, color: colors.BRAND, fontWeight: '700' },

  intro: {
    backgroundColor: colors.BRAND_TINT,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.BRAND,
  },
  introText: { fontSize: FontSize.sm, color: colors.BRAND_DARK, lineHeight: 20 },

  section: { gap: Spacing.sm },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: '700', color: colors.INK_1 },
  sectionSub:   { fontSize: FontSize.sm, color: colors.INK_2, marginTop: -4 },

  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  categoryCard: {
    width: '47.5%',
    backgroundColor: colors.SURFACE,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    gap: Spacing.xs,
    borderWidth: 2,
    borderColor: colors.BORDER,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryCardActive: {
    borderColor: colors.BRAND,
    backgroundColor: colors.BRAND_TINT,
    shadowOpacity: 0.1,
    elevation: 4,
  },
  categoryEmoji: { fontSize: 36, marginBottom: 2 },
  categoryLabel: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: colors.INK_2,
    textAlign: 'center',
    lineHeight: 18,
  },
  categoryLabelActive: { color: colors.BRAND },
  categoryCheck: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.BRAND,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryCheckText: { fontSize: 11, fontWeight: '800', color: '#fff' },

  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.SURFACE,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: colors.BORDER,
    overflow: 'hidden',
  },
  searchInput: {
    flex: 1,
    padding: Spacing.md,
    fontSize: FontSize.md,
    color: colors.INK_1,
  },
  searchInputFilled: { color: colors.BRAND_DARK },
  clearBtn: {
    padding: Spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearBtnText: { fontSize: FontSize.md, color: colors.INK_2, fontWeight: '600' },

  suggestions: {
    backgroundColor: colors.SURFACE,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: colors.BRAND,
    overflow: 'hidden',
    shadowColor: colors.BRAND,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  suggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  suggestionBorder: { borderBottomWidth: 1, borderBottomColor: colors.BORDER },
  suggestionEmoji: { fontSize: 20, flexShrink: 0 },
  suggestionText: { flex: 1 },
  suggestionName: { fontSize: FontSize.sm, fontWeight: '700', color: colors.INK_1 },
  suggestionSpecialite: { fontSize: FontSize.sm, fontWeight: '400', color: colors.INK_2 },
  suggestionAddress: { fontSize: FontSize.xs, color: colors.INK_2, marginTop: 2 },

  noResult: {
    backgroundColor: '#FEF3C7',
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.WARNING,
  },
  noResultText: { fontSize: FontSize.sm, color: '#92400E' },

  selectedCard: {
    backgroundColor: colors.BRAND_TINT,
    borderRadius: Radius.md,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    borderWidth: 2,
    borderColor: colors.BRAND,
  },
  selectedEmoji:   { fontSize: 24, flexShrink: 0 },
  selectedInfo:    { flex: 1, gap: 2 },
  selectedName:    { fontSize: FontSize.sm, fontWeight: '700', color: colors.INK_1 },
  selectedAddress: { fontSize: FontSize.xs, color: colors.INK_2 },
  selectedClear: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: colors.BORDER,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  selectedClearText: { fontSize: FontSize.sm, color: colors.INK_2, fontWeight: '700' },

  calendarWrapper: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: colors.BORDER,
    backgroundColor: colors.SURFACE,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },

  timeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  timeSlot: {
    width: '22%',
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: colors.BORDER,
    backgroundColor: colors.SURFACE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeSlotActive: {
    borderColor: colors.BRAND,
    backgroundColor: colors.BRAND,
    shadowColor: colors.BRAND,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  timeSlotText:       { fontSize: FontSize.sm, color: colors.INK_2, fontWeight: '500' },
  timeSlotTextActive: { color: '#fff', fontWeight: '700' },

  recap: {
    backgroundColor: colors.BRAND_TINT,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.xs,
    borderWidth: 2,
    borderColor: colors.BRAND,
  },
  recapTitle: { fontSize: FontSize.md, fontWeight: '700', color: colors.BRAND_DARK, marginBottom: 4 },
  recapLine:  { fontSize: FontSize.sm, color: colors.BRAND_DARK, lineHeight: 22 },

  submitBtn: {
    backgroundColor: colors.BRAND,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    shadowColor: colors.BRAND,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  submitBtnDisabled: {
    backgroundColor: colors.INK_2,
    shadowOpacity: 0,
    elevation: 0,
    opacity: 0.5,
  },
  submitText: { fontSize: FontSize.lg, fontWeight: '700', color: '#fff' },

  doctolibBlock: { gap: Spacing.xs },
  doctolibBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#00B5BA',
    borderRadius: Radius.md,
    paddingVertical: 14,
    paddingHorizontal: Spacing.md,
    shadowColor: '#00B5BA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  doctolibLogo: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  doctolibLogoText: { fontSize: 13, fontWeight: '800', color: '#00B5BA' },
  doctolibBtnText: { fontSize: FontSize.md, fontWeight: '700', color: '#fff' },
  doctolibHint: {
    fontSize: FontSize.xs,
    color: colors.INK_2,
    textAlign: 'center',
    lineHeight: 17,
    paddingHorizontal: Spacing.sm,
  },
  });
}
