import { router } from 'expo-router';
import { memo, useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import {
  usePatientAppointments,
  type Appointment,
  type AppointmentStatus,
  type AppointmentType,
} from '@/hooks/useAppointments';
import { usePatientReviews, type Review } from '@/hooks/useReviews';

/* ── Design tokens ───────────────────────────────────────── */
const BRAND      = '#0F766E';
const BRAND_DARK = '#0B5F58';
const BRAND_TINT = '#E8F4F2';
const INK        = '#0F1B2D';
const INK_2      = '#475569';
const INK_3      = '#94A3B8';
const BORDER     = '#E5EAF0';
const BG         = '#F6F8FA';

const TODAY = new Date().toISOString().split('T')[0];

/* ── Status config ───────────────────────────────────────── */
const STATUS_CFG: Record<string, {
  label: string; color: string; tint: string; dark: string; border: string;
}> = {
  pending: {
    label: 'En attente', color: '#B45309', tint: '#FEF3C7',
    dark: '#92400E', border: '#FCD34D',
  },
  accepted: {
    label: 'Confirmé', color: '#059669', tint: '#D1FADF',
    dark: '#065F46', border: '#A7F3D0',
  },
  declined: {
    label: 'Non attribué', color: '#DC2626', tint: '#FEE7E7',
    dark: '#991B1B', border: '#FECACA',
  },
  cancelled: {
    label: 'Annulé', color: '#94A3B8', tint: '#F1F5F9',
    dark: '#475569', border: BORDER,
  },
};

/* ── Type config ─────────────────────────────────────────── */
const TYPE_CFG: Record<AppointmentType, { label: string; icon: React.ReactNode }> = {
  generaliste: {
    label: 'Médecin généraliste',
    icon: <MaterialCommunityIcons name="stethoscope" size={18} color={BRAND} />,
  },
  urgences: {
    label: 'Urgences',
    icon: <Feather name="alert-triangle" size={18} color={BRAND} />,
  },
  specialiste: {
    label: 'Spécialiste',
    icon: <Feather name="user" size={18} color={BRAND} />,
  },
  pharmacie: {
    label: 'Pharmacie',
    icon: <MaterialCommunityIcons name="pill" size={18} color={BRAND} />,
  },
};

/* ── Helpers ─────────────────────────────────────────────── */
function formatDateChip(dateStr: string): string {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr + 'T12:00:00').toLocaleDateString('fr-FR', {
      weekday: 'short', day: 'numeric', month: 'short',
    });
  } catch {
    return dateStr;
  }
}

function getInitials(name: string): string {
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}

/* ── Étoiles ─────────────────────────────────────────────── */
const StarDisplay = memo(function StarDisplay({ rating, size = 15 }: { rating: number; size?: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Text key={i} style={{ fontSize: size, color: i <= rating ? '#F59E0B' : '#CBD5E1' }}>
          ★
        </Text>
      ))}
    </View>
  );
});

/* ── Modal de notation ───────────────────────────────────── */
function ReviewModal({
  appt,
  onClose,
  onSubmit,
  submitting,
}: {
  appt: Appointment | null;
  onClose: () => void;
  onSubmit: (rating: number, comment: string) => void;
  submitting: boolean;
}) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  const reset = () => { setRating(0); setComment(''); };

  const handleClose = () => { reset(); onClose(); };
  const handleSubmit = () => {
    if (rating === 0) {
      Alert.alert('Note manquante', 'Veuillez sélectionner une note avant de valider.');
      return;
    }
    onSubmit(rating, comment);
    reset();
  };

  if (!appt) return null;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={modalSt.overlay}
      >
        <View style={modalSt.card}>
          <View style={modalSt.header}>
            <Text style={modalSt.title}>Noter l'interprète</Text>
            <TouchableOpacity onPress={handleClose} accessibilityRole="button">
              <Feather name="x" size={20} color={INK_2} />
            </TouchableOpacity>
          </View>

          <View style={modalSt.interpreterRow}>
            <View style={modalSt.interpreterAvatar}>
              <Text style={modalSt.interpreterInitials}>
                {(appt.interpreterName ?? 'I').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}
              </Text>
            </View>
            <View>
              <Text style={modalSt.interpreterLabel}>Votre interprète</Text>
              <Text style={modalSt.interpreterName}>{appt.interpreterName ?? 'Interprète assigné'}</Text>
            </View>
          </View>

          <Text style={modalSt.starsLabel}>Votre note</Text>
          <View style={modalSt.starsRow}>
            {[1, 2, 3, 4, 5].map((i) => (
              <TouchableOpacity key={i} onPress={() => setRating(i)} accessibilityRole="button" accessibilityLabel={`${i} étoile${i > 1 ? 's' : ''}`}>
                <Text style={[modalSt.star, { color: i <= rating ? '#F59E0B' : '#CBD5E1' }]}>★</Text>
              </TouchableOpacity>
            ))}
          </View>
          {rating > 0 && (
            <Text style={modalSt.ratingHint}>
              {['', 'Très insuffisant', 'Insuffisant', 'Correct', 'Bien', 'Excellent !'][rating]}
            </Text>
          )}

          <Text style={modalSt.commentLabel}>Commentaire <Text style={{ color: INK_3 }}>(optionnel)</Text></Text>
          <TextInput
            style={modalSt.commentInput}
            value={comment}
            onChangeText={setComment}
            placeholder="Ponctualité, qualité de l'interprétation…"
            placeholderTextColor={INK_3}
            multiline
            numberOfLines={3}
            maxLength={300}
          />

          <View style={modalSt.actions}>
            <TouchableOpacity style={modalSt.btnCancel} onPress={handleClose}>
              <Text style={modalSt.btnCancelText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[modalSt.btnSubmit, (rating === 0 || submitting) && modalSt.btnDisabled]}
              onPress={handleSubmit}
              disabled={rating === 0 || submitting}
            >
              <Text style={modalSt.btnSubmitText}>{submitting ? 'Envoi…' : 'Envoyer ✓'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const modalSt = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15,27,45,0.6)',
    justifyContent: 'flex-end',
  },
  card: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 36,
    gap: 14,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 18, fontWeight: '700', color: INK, letterSpacing: -0.3 },
  interpreterRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  interpreterAvatar: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: '#059669', alignItems: 'center', justifyContent: 'center',
  },
  interpreterInitials: { fontSize: 15, fontWeight: '700', color: '#fff' },
  interpreterLabel: { fontSize: 11, fontWeight: '600', color: INK_3, textTransform: 'uppercase', letterSpacing: 0.8 },
  interpreterName: { fontSize: 15, fontWeight: '700', color: INK },
  starsLabel: { fontSize: 13.5, fontWeight: '600', color: INK },
  starsRow: { flexDirection: 'row', gap: 10, justifyContent: 'center' },
  star: { fontSize: 44 },
  ratingHint: { textAlign: 'center', fontSize: 13, fontWeight: '600', color: '#F59E0B' },
  commentLabel: { fontSize: 13.5, fontWeight: '600', color: INK },
  commentInput: {
    borderWidth: 1.5, borderColor: BORDER, borderRadius: 12, padding: 12,
    fontSize: 14, color: INK, minHeight: 80, textAlignVertical: 'top',
  },
  actions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  btnCancel: {
    flex: 1, borderWidth: 1.5, borderColor: BORDER, borderRadius: 12,
    paddingVertical: 13, alignItems: 'center',
  },
  btnCancelText: { fontSize: 14, fontWeight: '600', color: INK_2 },
  btnSubmit: {
    flex: 1, backgroundColor: BRAND, borderRadius: 12,
    paddingVertical: 13, alignItems: 'center',
  },
  btnDisabled: { backgroundColor: INK_3 },
  btnSubmitText: { fontSize: 14, fontWeight: '700', color: '#fff' },
});

/* ── Status pill ─────────────────────────────────────────── */
const StatusPill = memo(function StatusPill({ status }: { status: string }) {
  const s = STATUS_CFG[status] ?? STATUS_CFG.pending;
  return (
    <View style={[pillStyles.pill, { backgroundColor: s.tint }]}>
      <View style={[pillStyles.dot, { backgroundColor: s.color }]} />
      <Text style={[pillStyles.label, { color: s.dark }]}>{s.label}</Text>
    </View>
  );
});
const pillStyles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  dot: { width: 7, height: 7, borderRadius: 3.5 },
  label: { fontSize: 11.5, fontWeight: '700', letterSpacing: 0.1 },
});

/* ── RDV Card ────────────────────────────────────────────── */
const RdvCard = memo(function RdvCard({
  appt,
  dimmed = false,
  review,
  onRate,
}: {
  appt: Appointment;
  dimmed?: boolean;
  review?: Review;
  onRate?: () => void;
}) {
  const typeCfg = TYPE_CFG[appt.type] ?? TYPE_CFG.generaliste;
  const statusCfg = STATUS_CFG[appt.status] ?? STATUS_CFG.pending;
  const isAccepted = appt.status === 'accepted';
  const isPending  = appt.status === 'pending';
  const isDeclined = appt.status === 'declined';

  return (
    <View
      style={[
        cardStyles.card,
        { borderColor: statusCfg.border },
        isAccepted && cardStyles.cardAccepted,
        dimmed && cardStyles.cardDimmed,
      ]}
    >
      {/* Top row : type + statut */}
      <View style={cardStyles.topRow}>
        <View style={cardStyles.typeIconBox}>{typeCfg.icon}</View>
        <View style={cardStyles.typeMeta}>
          <Text style={cardStyles.typeLabel}>{typeCfg.label.toUpperCase()}</Text>
          <Text style={cardStyles.locationName} numberOfLines={1}>
            {appt.location}
          </Text>
        </View>
        <StatusPill status={appt.status} />
      </View>

      {/* Chips date + heure */}
      <View style={cardStyles.chipsRow}>
        <View style={cardStyles.chip}>
          <Feather name="calendar" size={13} color={INK_2} />
          <Text style={cardStyles.chipText}>{formatDateChip(appt.date)}</Text>
        </View>
        <View style={cardStyles.chip}>
          <Feather name="clock" size={13} color={INK_2} />
          <Text style={cardStyles.chipText}>{appt.time}</Text>
        </View>
      </View>

      {/* Adresse */}
      <View style={cardStyles.addressRow}>
        <Feather name="map-pin" size={13} color={INK_3} style={{ marginTop: 1 }} />
        <Text style={cardStyles.addressText} numberOfLines={1}>
          {appt.address}
        </Text>
      </View>

      {/* Bandeau interprète accepté */}
      {isAccepted && (
        <View style={cardStyles.acceptedBanner}>
          <View style={cardStyles.acceptedAvatar}>
            <Text style={cardStyles.acceptedAvatarText}>
              {getInitials(appt.interpreterName ?? 'Interprète')}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={cardStyles.acceptedBannerLabel}>Interprète confirmé</Text>
            <Text style={cardStyles.acceptedBannerName} numberOfLines={1}>
              {appt.interpreterName ?? 'Interprète assigné'}
            </Text>
          </View>
          <TouchableOpacity style={cardStyles.acceptedActionBtn} accessibilityLabel="Appeler">
            <Feather name="phone" size={14} color="#065F46" />
          </TouchableOpacity>
          <TouchableOpacity style={cardStyles.acceptedActionBtn} accessibilityLabel="Message">
            <Feather name="message-circle" size={14} color="#065F46" />
          </TouchableOpacity>
        </View>
      )}

      {/* Bandeau en attente */}
      {isPending && (
        <View style={cardStyles.pendingBanner}>
          <MaterialCommunityIcons name="timer-sand" size={14} color="#B45309" />
          <Text style={cardStyles.pendingBannerText}>
            Demande envoyée à plusieurs interprètes · Réponse sous 2h
          </Text>
        </View>
      )}

      {/* Bandeau non attribué */}
      {isDeclined && (
        <View style={cardStyles.declinedBanner}>
          <Feather name="info" size={14} color="#DC2626" />
          <Text style={cardStyles.declinedBannerText}>
            Aucun interprète disponible ·{' '}
            <Text style={{ fontWeight: '700', textDecorationLine: 'underline' }}>Reprogrammer</Text>
          </Text>
        </View>
      )}

      {/* Notation — RDV passé accepté */}
      {onRate && !review && (
        <TouchableOpacity style={cardStyles.rateBtn} onPress={onRate} accessibilityRole="button">
          <Text style={cardStyles.rateBtnText}>⭐ Noter l'interprète</Text>
          <Feather name="chevron-right" size={14} color={BRAND} />
        </TouchableOpacity>
      )}
      {review && (
        <View style={cardStyles.ratingDisplay}>
          <StarDisplay rating={review.rating} />
          {review.comment ? (
            <Text style={cardStyles.ratingComment} numberOfLines={2}>"{review.comment}"</Text>
          ) : null}
        </View>
      )}
    </View>
  );
});

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 10,
    shadowColor: '#0F1B2D',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  cardAccepted: {
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 3,
  },
  cardDimmed: { opacity: 0.78 },

  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  typeIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: BRAND_TINT,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  typeMeta: { flex: 1, minWidth: 0 },
  typeLabel: {
    fontSize: 10.5,
    fontWeight: '600',
    color: INK_3,
    letterSpacing: 0.8,
  },
  locationName: {
    fontSize: 14.5,
    fontWeight: '700',
    color: INK,
    letterSpacing: -0.2,
    lineHeight: 18,
    marginTop: 1,
  },

  chipsRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: BG,
    borderWidth: 1,
    borderColor: BORDER,
  },
  chipText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: INK,
    textTransform: 'capitalize',
  },

  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  addressText: {
    fontSize: 12,
    color: INK_2,
    lineHeight: 17,
    flex: 1,
  },

  acceptedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    paddingHorizontal: 12,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 12,
  },
  acceptedAvatar: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  acceptedAvatarText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.3,
  },
  acceptedBannerLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#065F46',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  acceptedBannerName: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#065F46',
  },
  acceptedActionBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  pendingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 8,
    paddingHorizontal: 12,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 10,
  },
  pendingBannerText: {
    fontSize: 12,
    color: '#92400E',
    lineHeight: 17,
    flex: 1,
  },

  declinedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 8,
    paddingHorizontal: 12,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 10,
  },
  declinedBannerText: {
    fontSize: 12,
    color: '#991B1B',
    lineHeight: 17,
    flex: 1,
  },

  rateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: BRAND_TINT,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: BRAND + '40',
  },
  rateBtnText: { fontSize: 13, fontWeight: '700', color: BRAND },

  ratingDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#FFFBEB',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FDE68A',
    flexWrap: 'wrap',
  },
  ratingComment: {
    flex: 1,
    fontSize: 12,
    color: '#92400E',
    fontStyle: 'italic',
    lineHeight: 16,
  },
});

/* ── Section header ──────────────────────────────────────── */
const SectionLabel = memo(function SectionLabel({ title, count, accent }: { title: string; count: number; accent: string }) {
  return (
    <View style={sectionStyles.row}>
      <Text style={sectionStyles.title}>{title}</Text>
      <View style={[sectionStyles.badge, { backgroundColor: accent === BRAND ? BRAND_TINT : BG }]}>
        <Text style={[sectionStyles.badgeText, { color: accent }]}>{count}</Text>
      </View>
    </View>
  );
});
const sectionStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  title: { fontSize: 15.5, fontWeight: '700', color: INK, letterSpacing: -0.2, flex: 1 },
  badge: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 999,
  },
  badgeText: { fontSize: 11, fontWeight: '700' },
});

/* ── Main screen ─────────────────────────────────────────── */
export default function MesRdvScreen() {
  const { appointments, loading } = usePatientAppointments();
  const { reviews, submitting, submitReview } = usePatientReviews();
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');
  const [reviewTarget, setReviewTarget] = useState<Appointment | null>(null);

  const upcoming = useMemo(
    () => appointments
      .filter((a) => a.date >= TODAY)
      .sort((a, b) => a.date === b.date ? a.time.localeCompare(b.time) : a.date.localeCompare(b.date)),
    [appointments],
  );

  const past = useMemo(
    () => appointments
      .filter((a) => a.date < TODAY)
      .sort((a, b) => a.date === b.date ? b.time.localeCompare(a.time) : b.date.localeCompare(a.date)),
    [appointments],
  );

  const pendingCount  = useMemo(() => appointments.filter((a) => a.status === 'pending').length, [appointments]);
  const acceptedCount = useMemo(() => appointments.filter((a) => a.status === 'accepted').length, [appointments]);
  const activeList    = tab === 'upcoming' ? upcoming : past;

  const handleCloseReview  = useCallback(() => setReviewTarget(null), []);
  const handleSubmitReview = useCallback(async (rating: number, comment: string) => {
    if (!reviewTarget?.interpreterId) return;
    await submitReview(reviewTarget.id, reviewTarget.interpreterId, rating, comment);
    setReviewTarget(null);
  }, [reviewTarget, submitReview]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={BRAND} />
        <Text style={styles.loadingText}>Chargement de vos rendez-vous…</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* ── Header teal ────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.headerDeco1} />
        <View style={styles.headerDeco2} />

        <View style={styles.headerTopRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Retour"
          >
            <Feather name="chevron-left" size={18} color="#fff" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerSupra}>Mon dossier</Text>
            <Text style={styles.headerTitle}>Mes rendez-vous</Text>
          </View>
          <TouchableOpacity style={styles.backBtn} accessibilityLabel="Filtres">
            <Feather name="filter" size={18} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Mini-stats */}
        <View style={styles.miniStatsRow}>
          <View style={styles.miniStat}>
            <View style={styles.miniStatIcon}>
              <MaterialCommunityIcons name="timer-sand" size={14} color="#fff" />
            </View>
            <View>
              <Text style={styles.miniStatValue}>{pendingCount}</Text>
              <Text style={styles.miniStatLabel}>En attente</Text>
            </View>
          </View>
          <View style={styles.miniStat}>
            <View style={styles.miniStatIcon}>
              <Feather name="check" size={14} color="#fff" />
            </View>
            <View>
              <Text style={styles.miniStatValue}>{acceptedCount}</Text>
              <Text style={styles.miniStatLabel}>Confirmés</Text>
            </View>
          </View>
        </View>
      </View>

      {/* ── Tabs ───────────────────────────────── */}
      <View style={styles.tabsBar}>
        <View style={styles.tabsTrack}>
          {[
            { id: 'upcoming' as const, label: 'Prochains',  count: upcoming.length },
            { id: 'past'     as const, label: 'Historique', count: past.length },
          ].map((t) => {
            const active = tab === t.id;
            return (
              <TouchableOpacity
                key={t.id}
                style={[styles.tabBtn, active && styles.tabBtnActive]}
                onPress={() => setTab(t.id)}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
              >
                <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
                  {t.label}
                </Text>
                <View style={[styles.tabCount, active && styles.tabCountActive]}>
                  <Text style={[styles.tabCountText, active && styles.tabCountTextActive]}>
                    {t.count}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* ── Liste ──────────────────────────────── */}
      <ScrollView
        style={styles.listScroll}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {activeList.length === 0 ? (
          <EmptyState onPress={() => router.push('/(tabs)/malentendants/rendez-vous')} />
        ) : (
          <>
            <SectionLabel
              title={tab === 'upcoming' ? 'À venir' : 'Historique'}
              count={activeList.length}
              accent={tab === 'upcoming' ? BRAND : INK_3}
            />
            <View style={styles.cardList}>
              {activeList.map((a) => {
                const review = reviews.find((r) => r.appointmentId === a.id);
                const isPastAccepted = tab === 'past' && a.status === 'accepted' && !!a.interpreterId;
                return (
                  <RdvCard
                    key={a.id}
                    appt={a}
                    dimmed={tab === 'past'}
                    review={review}
                    onRate={isPastAccepted && !review ? () => setReviewTarget(a) : undefined}
                  />
                );
              })}
            </View>
          </>
        )}
      </ScrollView>

      {/* ── FAB Nouveau RDV ─────────────────────── */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/(tabs)/malentendants/rendez-vous')}
        accessibilityRole="button"
        accessibilityLabel="Nouveau rendez-vous"
      >
        <Feather name="plus" size={18} color="#fff" />
        <Text style={styles.fabText}>Nouveau RDV</Text>
      </TouchableOpacity>

      <ReviewModal
        appt={reviewTarget}
        onClose={handleCloseReview}
        submitting={submitting}
        onSubmit={handleSubmitReview}
      />
    </SafeAreaView>
  );
}

/* ── Empty state ─────────────────────────────────────────── */
const EmptyState = memo(function EmptyState({ onPress }: { onPress: () => void }) {
  return (
    <View style={styles.emptyWrap}>
      <View style={styles.emptyIconWrap}>
        <View style={styles.emptyCalCard}>
          <View style={styles.emptyCalHeader}>
            {[0, 1, 2].map((i) => (
              <View key={i} style={styles.emptyCalBar} />
            ))}
          </View>
          <View style={styles.emptyCalGrid}>
            {Array.from({ length: 12 }).map((_, i) => (
              <View key={i} style={[styles.emptyCalCell, i === 6 && { backgroundColor: BRAND }]} />
            ))}
          </View>
        </View>
        <View style={styles.emptyPlusBtn}>
          <Feather name="plus" size={20} color={BRAND} />
        </View>
      </View>
      <Text style={styles.emptyTitle}>Aucun rendez-vous pour l'instant</Text>
      <Text style={styles.emptySub}>
        Vos demandes de RDV avec interprète apparaîtront ici, avec leur statut en temps réel.
      </Text>
      <TouchableOpacity style={styles.emptyBtn} onPress={onPress} accessibilityRole="button">
        <Feather name="plus" size={16} color="#fff" />
        <Text style={styles.emptyBtnText}>Prendre un premier RDV</Text>
      </TouchableOpacity>
      <View style={styles.emptyFooter}>
        <Feather name="check" size={13} color={BRAND} />
        <Text style={styles.emptyFooterText}>Service gratuit · Réponse sous 2h en moyenne</Text>
      </View>
    </View>
  );
});

/* ── Styles ──────────────────────────────────────────────── */
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    backgroundColor: BG,
  },
  loadingText: { fontSize: 14, color: INK_2 },

  /* Header */
  header: {
    backgroundColor: BRAND,
    paddingTop: 14,
    paddingBottom: 16,
    paddingHorizontal: 20,
    overflow: 'hidden',
    position: 'relative',
    gap: 14,
  },
  headerDeco1: {
    position: 'absolute',
    top: -50,
    right: -40,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  headerDeco2: {
    position: 'absolute',
    top: 20,
    right: 60,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    zIndex: 1,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSupra: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.78)',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -0.5,
    lineHeight: 26,
    marginTop: 2,
  },

  miniStatsRow: {
    flexDirection: 'row',
    gap: 8,
    zIndex: 1,
  },
  miniStat: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    borderRadius: 12,
  },
  miniStatIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniStatValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    lineHeight: 22,
  },
  miniStatLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 3,
  },

  /* Tabs */
  tabsBar: {
    padding: 12,
    paddingHorizontal: 20,
    backgroundColor: BG,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  tabsTrack: {
    flexDirection: 'row',
    gap: 4,
    padding: 6,
    backgroundColor: BG,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  tabBtnActive: {
    backgroundColor: '#fff',
    shadowColor: '#0F1B2D',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  tabLabel: {
    fontSize: 13.5,
    fontWeight: '600',
    color: INK_2,
    letterSpacing: -0.1,
  },
  tabLabelActive: { color: INK },
  tabCount: {
    paddingHorizontal: 7,
    paddingVertical: 1,
    borderRadius: 999,
    backgroundColor: BORDER,
  },
  tabCountActive: { backgroundColor: BRAND_TINT },
  tabCountText: { fontSize: 11, fontWeight: '700', color: INK_3 },
  tabCountTextActive: { color: BRAND },

  /* List */
  listScroll: { flex: 1 },
  listContent: {
    padding: 14,
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  cardList: { gap: 10 },

  /* FAB */
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 52,
    paddingHorizontal: 18,
    borderRadius: 999,
    backgroundColor: BRAND,
    shadowColor: BRAND,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 8,
  },
  fabText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -0.1,
  },

  /* Empty state */
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
    gap: 8,
  },
  emptyIconWrap: {
    width: 120,
    height: 120,
    marginBottom: 14,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCalCard: {
    position: 'absolute',
    top: 14,
    left: 14,
    right: 14,
    bottom: 14,
    backgroundColor: '#fff',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: BORDER,
    overflow: 'hidden',
    shadowColor: BRAND,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 4,
  },
  emptyCalHeader: {
    height: 22,
    backgroundColor: BRAND,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
  },
  emptyCalBar: {
    width: 4,
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: 2,
  },
  emptyCalGrid: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 6,
    gap: 3,
  },
  emptyCalCell: {
    width: '22%',
    aspectRatio: 1,
    backgroundColor: BG,
    borderRadius: 3,
  },
  emptyPlusBtn: {
    position: 'absolute',
    top: 4,
    right: 0,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: BRAND,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: BRAND,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  emptyTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: INK,
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  emptySub: {
    fontSize: 13.5,
    color: INK_2,
    lineHeight: 20,
    textAlign: 'center',
    maxWidth: 280,
  },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: BRAND,
    borderRadius: 14,
    paddingHorizontal: 24,
    paddingVertical: 14,
    marginTop: 8,
    shadowColor: BRAND,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 5,
  },
  emptyBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -0.1,
  },
  emptyFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
  },
  emptyFooterText: {
    fontSize: 12,
    color: INK_3,
  },
});
