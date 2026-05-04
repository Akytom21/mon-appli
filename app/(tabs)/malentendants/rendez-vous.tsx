import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
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
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { Colors, FontSize, Radius, Spacing } from '@/constants/theme';
import { HEALTH_PROFESSIONALS } from '@/data/healthProfessionals';
import { useHealthProfessionalsSearch } from '@/hooks/useHealthProfessionals';

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

  const [selectedCategory, setSelectedCategory] = useState<CategoryId | null>(null);
  const [searchQuery, setSearchQuery]           = useState('');
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [selectedDate, setSelectedDate]         = useState('');
  const [selectedTime, setSelectedTime]         = useState('');

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
      }));

    const hospitals: Provider[] = HEALTH_PROFESSIONALS
      .filter((p) => p.category === 'hospital')
      .map((p) => ({ id: p.id, name: p.name, address: p.address, type: 'urgences' as CategoryId }));

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
    // Reset provider if it doesn't match the new category
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
    ? { [selectedDate]: { selected: true, selectedColor: Colors.malentendants, selectedTextColor: Colors.white } }
    : {};

  const canSubmit = selectedCategory && selectedProvider && selectedDate && selectedTime;

  const handleSubmit = () => {
    if (canSubmit) router.push('/(tabs)/malentendants/confirmation');
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
          {/* Intro */}
          <View style={styles.intro}>
            <Text style={styles.introText}>
              Renseignez votre besoin et nous trouverons l'interprète LSF disponible le plus proche de votre rendez-vous.
            </Text>
          </View>

          {/* ── 1. Catégorie ── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Type de rendez-vous</Text>
            <View style={styles.categoryGrid}>
              {CATEGORIES.map((cat) => {
                const active = selectedCategory === cat.id;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[styles.categoryCard, active && styles.categoryCardActive]}
                    onPress={() => handleSelectCategory(cat.id)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: active }}
                  >
                    <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
                    <Text style={[styles.categoryLabel, active && styles.categoryLabelActive]}>
                      {cat.label}
                    </Text>
                    {active && (
                      <View style={styles.categoryCheck}>
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
            <Text style={styles.sectionTitle}>Lieu du rendez-vous</Text>
            <Text style={styles.sectionSub}>
              {selectedCategory
                ? `Rechercher parmi les ${CATEGORIES.find(c => c.id === selectedCategory)?.label.toLowerCase()}s de Nice`
                : 'Tapez un nom ou une adresse à Nice'}
            </Text>

            {/* Input with clear / loading */}
            <View style={styles.searchRow}>
              <TextInput
                style={[styles.searchInput, selectedProvider && styles.searchInputFilled]}
                value={searchQuery}
                onChangeText={(t) => {
                  setSearchQuery(t);
                  if (selectedProvider) setSelectedProvider(null);
                }}
                placeholder={profLoading ? 'Chargement des professionnels…' : 'Ex : Dr. Lefèvre, Pharmacie Masséna…'}
                placeholderTextColor={Colors.textSecondary}
                autoCorrect={false}
                editable={!profLoading}
                accessibilityLabel="Rechercher un professionnel de santé"
              />
              {profLoading
                ? <ActivityIndicator style={styles.clearBtn} color={Colors.malentendants} size="small" />
                : searchQuery.length > 0 && (
                    <TouchableOpacity style={styles.clearBtn} onPress={handleClearProvider} accessibilityLabel="Effacer">
                      <Text style={styles.clearBtnText}>✕</Text>
                    </TouchableOpacity>
                  )
              }
            </View>

            {/* Suggestions dropdown */}
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

            {/* No results */}
            {searchQuery.length > 1 && !selectedProvider && suggestions.length === 0 && (
              <View style={styles.noResult}>
                <Text style={styles.noResultText}>
                  Aucun résultat pour « {searchQuery} »
                  {selectedCategory ? ` dans les ${CATEGORIES.find(c => c.id === selectedCategory)?.label.toLowerCase()}s` : ''}
                </Text>
              </View>
            )}

            {/* Selected provider card */}
            {selectedProvider && (
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
            )}
          </View>

          {/* ── 3. Calendrier ── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Date du rendez-vous</Text>
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
                  backgroundColor: Colors.white,
                  calendarBackground: Colors.white,
                  selectedDayBackgroundColor: Colors.malentendants,
                  selectedDayTextColor: Colors.white,
                  todayTextColor: Colors.malentendants,
                  todayBackgroundColor: Colors.malentendantsLight,
                  dayTextColor: Colors.textPrimary,
                  textDisabledColor: Colors.border,
                  arrowColor: Colors.malentendants,
                  monthTextColor: Colors.textPrimary,
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
            <Text style={styles.sectionTitle}>Heure du rendez-vous</Text>
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
                  >
                    <Text style={[styles.timeSlotText, active && styles.timeSlotTextActive]}>
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
            style={[styles.submitBtn, !canSubmit && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={!canSubmit}
            accessibilityRole="button"
            accessibilityLabel="Confirmer la demande de rendez-vous"
          >
            <Text style={styles.submitText}>
              {canSubmit ? '✓  Confirmer la demande' : 'Complétez tous les champs'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* ─── Styles ─────────────────────────────────────────────── */
const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: Colors.malentendants },
  scroll:  { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.lg, paddingBottom: Spacing.xxl, gap: Spacing.xl },

  intro: {
    backgroundColor: Colors.malentendantsLight,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: Colors.malentendants,
  },
  introText: { fontSize: FontSize.sm, color: Colors.malentendantsDark, lineHeight: 20 },

  /* Section */
  section: { gap: Spacing.sm },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary },
  sectionSub:   { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: -4 },

  /* ── Catégories ── */
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  categoryCard: {
    width: '47.5%',
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    gap: Spacing.xs,
    borderWidth: 2,
    borderColor: Colors.border,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryCardActive: {
    borderColor: Colors.malentendants,
    backgroundColor: Colors.malentendantsLight,
    shadowOpacity: 0.1,
    elevation: 4,
  },
  categoryEmoji: { fontSize: 36, marginBottom: 2 },
  categoryLabel: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  categoryLabelActive: { color: Colors.malentendants },
  categoryCheck: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.malentendants,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryCheckText: { fontSize: 11, fontWeight: '800', color: Colors.white },

  /* ── Recherche lieu ── */
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  searchInput: {
    flex: 1,
    padding: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
  },
  searchInputFilled: { color: Colors.malentendantsDark },
  clearBtn: {
    padding: Spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearBtnText: { fontSize: FontSize.md, color: Colors.textSecondary, fontWeight: '600' },

  suggestions: {
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.malentendants,
    overflow: 'hidden',
    shadowColor: Colors.malentendants,
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
  suggestionBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  suggestionEmoji: { fontSize: 20, flexShrink: 0 },
  suggestionText: { flex: 1 },
  suggestionName: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.textPrimary },
  suggestionSpecialite: { fontSize: FontSize.sm, fontWeight: '400', color: Colors.textSecondary },
  suggestionAddress: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },

  noResult: {
    backgroundColor: '#FEF3C7',
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: Colors.warning,
  },
  noResultText: { fontSize: FontSize.sm, color: '#92400E' },

  selectedCard: {
    backgroundColor: Colors.interpretesLight,
    borderRadius: Radius.md,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    borderWidth: 2,
    borderColor: Colors.interpretes,
  },
  selectedEmoji:   { fontSize: 24, flexShrink: 0 },
  selectedInfo:    { flex: 1, gap: 2 },
  selectedName:    { fontSize: FontSize.sm, fontWeight: '700', color: Colors.textPrimary },
  selectedAddress: { fontSize: FontSize.xs, color: Colors.textSecondary },
  selectedClear: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  selectedClearText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: '700' },

  /* ── Calendrier ── */
  calendarWrapper: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },

  /* ── Créneaux horaires ── */
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  timeSlot: {
    width: '22%',
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeSlotActive: {
    borderColor: Colors.malentendants,
    backgroundColor: Colors.malentendants,
    shadowColor: Colors.malentendants,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  timeSlotText:       { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: '500' },
  timeSlotTextActive: { color: Colors.white, fontWeight: '700' },

  /* ── Récapitulatif ── */
  recap: {
    backgroundColor: Colors.malentendantsLight,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.xs,
    borderWidth: 2,
    borderColor: Colors.malentendants,
  },
  recapTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.malentendantsDark, marginBottom: 4 },
  recapLine:  { fontSize: FontSize.sm, color: Colors.malentendantsDark, lineHeight: 22 },

  /* ── Submit ── */
  submitBtn: {
    backgroundColor: Colors.malentendants,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    shadowColor: Colors.malentendants,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  submitBtnDisabled: {
    backgroundColor: Colors.textSecondary,
    shadowOpacity: 0,
    elevation: 0,
    opacity: 0.5,
  },
  submitText: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.white },
});
