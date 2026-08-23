import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SkeletonFormationCard } from '@/components/ui/Skeleton';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { collection, doc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useAuth } from '@/context/AuthContext';
import { useFormations, type Formation } from '@/hooks/useFormations';
import { useThemeColor } from '@/hooks/use-theme-color';
import type { ColorTokens } from '@/constants/design';

/* ── Accents hors palette de thème (niveaux) ─────────────── */
const AMBER      = '#B45309';
const AMBER_BG   = '#FEF3C7';

function getNiveauColor(colors: ColorTokens): Record<string, { text: string; bg: string }> {
  return {
    Débutant:      { text: '#065F46', bg: '#D1FAE5' },
    Intermédiaire: { text: AMBER,     bg: AMBER_BG  },
    Avancé:        { text: colors.BRAND, bg: colors.BRAND_TINT },
    Expert:        { text: '#6D28D9', bg: '#EDE9FE'  },
  };
}

export default function FormationScreen() {
  const { user } = useAuth();
  const { formations, loading, reload } = useFormations();
  const colors = useThemeColor();
  const s = useMemo(() => createStyles(colors), [colors]);
  const NIVEAU_COLOR = useMemo(() => getNiveauColor(colors), [colors]);
  const [selected, setSelected]           = useState<string | null>(null);
  const [confirming, setConfirming]       = useState(false);
  const [confirmed, setConfirmed]         = useState(false);
  const [confirmedSession, setConfirmedSession] = useState<Formation | null>(null);
  const [refreshing, setRefreshing]       = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    reload();
    await new Promise<void>((r) => setTimeout(r, 900));
    setRefreshing(false);
  }, [reload]);

  const handleConfirm = async () => {
    if (!selected || !user) return;
    setConfirming(true);
    try {
      const formation = formations.find((f) => f.id === selected)!;
      const formationRef = doc(db, 'formations', selected);
      await runTransaction(db, async (tx) => {
        const snap = await tx.get(formationRef);
        if (!snap.exists()) throw new Error('introuvable');
        const places = snap.data().places as number;
        if (places <= 0) throw new Error('complet');
        const resRef = doc(collection(db, 'reservations'));
        tx.set(resRef, {
          userId: user.id,
          formationId: selected,
          status: 'confirmed',
          createdAt: serverTimestamp(),
        });
        tx.update(formationRef, { places: places - 1 });
      });
      setConfirmedSession(formation);
      setConfirmed(true);
    } catch (err: unknown) {
      Alert.alert(
        'Réservation impossible',
        err instanceof Error && err.message === 'complet'
          ? 'Cette session est complète.'
          : 'Une erreur est survenue. Veuillez réessayer.',
      );
    } finally {
      setConfirming(false);
    }
  };

  /* ── Écran de confirmation ─────────────────────────────── */
  if (confirmed && confirmedSession) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.successContainer}>
          <View style={s.successBadge}>
            <Feather name="check-circle" size={52} color={colors.BRAND} />
          </View>
          <Text style={s.successTitle}>Formation réservée !</Text>
          <Text style={s.successSubtitle}>Votre place est confirmée pour :</Text>
          <View style={s.successCard}>
            <Text style={s.successSession}>{confirmedSession.titre}</Text>
            {([
              { icon: 'calendar', label: confirmedSession.date },
              { icon: 'clock',    label: confirmedSession.heure },
              { icon: 'map-pin',  label: confirmedSession.lieu },
              { icon: 'user',     label: confirmedSession.formateur },
            ] as { icon: React.ComponentProps<typeof Feather>['name']; label: string }[]).map(
              ({ icon, label }) => (
                <View key={icon} style={s.successMetaRow}>
                  <Feather name={icon} size={14} color={colors.BRAND} />
                  <Text style={s.successMetaText}>{label}</Text>
                </View>
              ),
            )}
          </View>
          <Text style={s.successNote}>
            Vous recevrez une confirmation et les instructions par notification.
          </Text>
          <TouchableOpacity
            style={s.retourBtn}
            onPress={() => { setConfirmed(false); setSelected(null); }}
            accessibilityRole="button"
          >
            <Text style={s.retourBtnText}>Réserver une autre session</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  /* ── Liste des formations ──────────────────────────────── */
  return (
    <SafeAreaView style={s.safe}>

      {/* Header */}
      <View style={s.header}>
        <View style={s.headerRow}>
          <TouchableOpacity
            style={s.backBtn}
            onPress={() => router.back()}
            accessibilityLabel="Retour"
            accessibilityRole="button"
          >
            <Feather name="chevron-left" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Formations LSF</Text>
          <View style={{ flex: 1 }} />
          {!loading && (
            <View style={s.headerBadge}>
              <Text style={s.headerBadgeText}>{formations.length} sessions</Text>
            </View>
          )}
        </View>
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.BRAND} colors={[colors.BRAND]} />
        }
      >
        {/* Info banner */}
        <View style={s.infoBanner}>
          <Feather name="info" size={15} color={colors.BRAND} />
          <Text style={s.infoBannerText}>
            Toutes les formations sont gratuites et reconnues pour l'obtention de l'agrément LSF médical.
          </Text>
        </View>

        {loading ? (
          <View style={{ gap: 12 }}>
            {[...Array(3)].map((_, i) => <SkeletonFormationCard key={i} />)}
          </View>
        ) : formations.length === 0 ? (
          <View style={s.emptyWrap}>
            <Feather name="calendar" size={48} color={colors.INK_3} />
            <Text style={s.emptyTitle}>Aucune formation disponible pour le moment.</Text>
            <Text style={s.emptySub}>Revenez bientôt !</Text>
          </View>
        ) : (
          <View style={s.sessions}>
            {formations.map((session) => {
              const isSelected = selected === session.id;
              const isFull = session.places <= 0;
              const niveau = NIVEAU_COLOR[session.niveau] ?? { text: colors.BRAND, bg: colors.BRAND_TINT };
              return (
                <TouchableOpacity
                  key={session.id}
                  style={[
                    s.sessionCard,
                    isSelected && s.sessionCardSelected,
                    isFull && s.sessionCardFull,
                  ]}
                  onPress={() => !isFull && setSelected(session.id)}
                  disabled={isFull}
                  activeOpacity={0.8}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isSelected, disabled: isFull }}
                >
                  {/* Titre + sélection */}
                  <View style={s.cardTopRow}>
                    <Text style={s.cardTitle} numberOfLines={2}>{session.titre}</Text>
                    {isSelected && (
                      <View style={s.selectedCheck}>
                        <Feather name="check" size={14} color="#fff" />
                      </View>
                    )}
                  </View>

                  {/* Niveau */}
                  <View style={[s.niveauBadge, { backgroundColor: niveau.bg }]}>
                    <Text style={[s.niveauText, { color: niveau.text }]}>{session.niveau}</Text>
                  </View>

                  {/* Description */}
                  <Text style={s.cardDesc} numberOfLines={2}>{session.description}</Text>

                  {/* Méta */}
                  <View style={s.metaGrid}>
                    {([
                      { icon: 'user',     text: session.formateur },
                      { icon: 'calendar', text: `${session.date} · ${session.heure}` },
                      { icon: 'map-pin',  text: session.lieu },
                      { icon: 'tag',      text: session.prix },
                    ] as { icon: React.ComponentProps<typeof Feather>['name']; text: string }[]).map(
                      ({ icon, text }) => (
                        <View key={icon} style={s.metaRow}>
                          <Feather name={icon} size={13} color={colors.INK_3} />
                          <Text style={s.metaText}>{text}</Text>
                        </View>
                      ),
                    )}
                  </View>

                  {/* Places */}
                  <View
                    style={[
                      s.placesBadge,
                      {
                        backgroundColor: isFull
                          ? '#FEE2E2'
                          : session.places <= 2 ? AMBER_BG : colors.BRAND_TINT,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        s.placesText,
                        {
                          color: isFull
                            ? '#DC2626'
                            : session.places <= 2 ? AMBER : colors.BRAND,
                        },
                      ]}
                    >
                      {isFull
                        ? '● Complet'
                        : `● ${session.places} place${session.places > 1 ? 's' : ''} restante${session.places > 1 ? 's' : ''}`}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Bouton de confirmation */}
        {!loading && formations.length > 0 && (
        <TouchableOpacity
          style={[s.confirmBtn, (!selected || confirming) && s.confirmBtnDisabled]}
          onPress={handleConfirm}
          disabled={!selected || confirming}
          accessibilityRole="button"
        >
          {confirming ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Feather
                name={selected ? 'check-circle' : 'circle'}
                size={18}
                color="#fff"
              />
              <Text style={s.confirmBtnText}>
                {selected ? 'Confirmer la réservation' : 'Sélectionnez une session'}
              </Text>
            </>
          )}
        </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(colors: ColorTokens) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.BRAND },
    scroll: { flex: 1, backgroundColor: colors.BG },
    content: { padding: 20, paddingBottom: 40, gap: 16 },

    /* Header */
    header: { backgroundColor: colors.BRAND, paddingHorizontal: 16, paddingVertical: 14 },
    headerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    backBtn: {
      width: 36, height: 36, borderRadius: 10,
      backgroundColor: 'rgba(255,255,255,0.18)',
      alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    },
    headerTitle: { fontSize: 17, fontWeight: '700', color: '#fff', letterSpacing: -0.3 },
    headerBadge: {
      backgroundColor: 'rgba(255,255,255,0.2)',
      paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999,
    },
    headerBadgeText: { fontSize: 12, fontWeight: '600', color: '#fff' },

    /* Info banner */
    infoBanner: {
      flexDirection: 'row', gap: 10, alignItems: 'flex-start',
      backgroundColor: colors.BRAND_TINT, borderRadius: 12, padding: 14,
      borderWidth: 1, borderColor: '#A7D4D0',
    },
    infoBannerText: { flex: 1, fontSize: 13.5, color: colors.BRAND_DARK, lineHeight: 19 },

    sessions: { gap: 12 },

    emptyWrap: {
      alignItems: 'center', justifyContent: 'center',
      gap: 10, paddingVertical: 48, paddingHorizontal: 24,
    },
    emptyTitle: {
      fontSize: 16, fontWeight: '700', color: colors.INK_1, textAlign: 'center', marginTop: 8,
    },
    emptySub: {
      fontSize: 13.5, color: colors.INK_2, textAlign: 'center', lineHeight: 20,
    },

    /* Session card */
    sessionCard: {
      backgroundColor: colors.SURFACE,
      borderRadius: 16, padding: 16, gap: 10,
      borderWidth: 2, borderColor: colors.BORDER,
      shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
    },
    sessionCardSelected: { borderColor: colors.BRAND, backgroundColor: colors.BRAND_TINT },
    sessionCardFull: { opacity: 0.55 },

    cardTopRow: {
      flexDirection: 'row', alignItems: 'flex-start',
      justifyContent: 'space-between', gap: 10,
    },
    cardTitle: { fontSize: 15.5, fontWeight: '700', color: colors.INK_1, letterSpacing: -0.3, flex: 1 },
    selectedCheck: {
      width: 26, height: 26, borderRadius: 13,
      backgroundColor: colors.BRAND, alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    },
    niveauBadge: {
      alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999,
    },
    niveauText: { fontSize: 12, fontWeight: '700' },
    cardDesc: { fontSize: 13.5, color: colors.INK_2, lineHeight: 19 },

    metaGrid: { gap: 5 },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    metaText: { fontSize: 13.5, color: colors.INK_2 },

    placesBadge: {
      alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999,
    },
    placesText: { fontSize: 12.5, fontWeight: '700' },

    /* Confirm button */
    confirmBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
      backgroundColor: colors.BRAND, borderRadius: 16, padding: 16,
      shadowColor: colors.BRAND, shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.3, shadowRadius: 12, elevation: 5,
      minHeight: 56,
    },
    confirmBtnDisabled: {
      backgroundColor: colors.INK_3, shadowOpacity: 0, elevation: 0, opacity: 0.7,
    },
    confirmBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },

    /* Success screen */
    successContainer: {
      flex: 1, backgroundColor: colors.BG, padding: 24,
      alignItems: 'center', justifyContent: 'center', gap: 16,
    },
    successBadge: {
      width: 100, height: 100, borderRadius: 50,
      backgroundColor: colors.BRAND_TINT, alignItems: 'center', justifyContent: 'center',
    },
    successTitle: {
      fontSize: 26, fontWeight: '800', color: colors.INK_1,
      letterSpacing: -0.5, textAlign: 'center',
    },
    successSubtitle: { fontSize: 15, color: colors.INK_2 },
    successCard: {
      backgroundColor: colors.SURFACE, borderRadius: 16, padding: 20,
      width: '100%', gap: 10,
      borderWidth: 1, borderColor: colors.BORDER,
      borderLeftWidth: 4, borderLeftColor: colors.BRAND,
      shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
    },
    successSession: {
      fontSize: 16, fontWeight: '700', color: colors.INK_1,
      marginBottom: 4, letterSpacing: -0.2,
    },
    successMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    successMetaText: { fontSize: 14, color: colors.INK_2 },
    successNote: {
      fontSize: 13.5, color: colors.INK_3, textAlign: 'center',
      lineHeight: 19, paddingHorizontal: 8,
    },
    retourBtn: {
      backgroundColor: colors.BRAND, borderRadius: 14, padding: 16,
      alignItems: 'center', width: '100%',
    },
    retourBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  });
}
