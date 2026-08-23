import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SkeletonRDVCard } from '@/components/ui/Skeleton';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import {
  usePatientAppointments,
  type Appointment,
  type AppointmentType,
} from '@/hooks/useAppointments';
import { usePatientReviews, type Review } from '@/hooks/useReviews';
import { useUnreadMessages } from '@/hooks/useUnreadMessages';

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

/* ── Local types ─────────────────────────────────────────── */
type Tab             = 'upcoming' | 'pending' | 'history';
type HistTypeFilter  = 'all' | AppointmentType;
type HistStatFilter  = 'all' | 'accepted' | 'declined' | 'expired';
type HistSortOrder   = 'recent' | 'oldest';

/* ── Status config (upcoming/pending cards) ──────────────── */
const STATUS_CFG: Record<string, {
  label: string; color: string; tint: string; dark: string; border: string;
}> = {
  pending:   { label: 'En attente',    color: '#B45309', tint: '#FEF3C7', dark: '#92400E', border: '#FCD34D' },
  accepted:  { label: 'Confirmé',      color: '#059669', tint: '#D1FADF', dark: '#065F46', border: '#A7F3D0' },
  declined:  { label: 'Non attribué',  color: '#DC2626', tint: '#FEE7E7', dark: '#991B1B', border: '#FECACA' },
  cancelled: { label: 'Annulé',        color: '#94A3B8', tint: '#F1F5F9', dark: '#475569', border: BORDER   },
};

/* ── History badge config ────────────────────────────────── */
const HIST_BADGE = {
  accepted:  { label: 'Effectué', color: '#059669', bg: '#ECFDF5', dot: '#059669' },
  declined:  { label: 'Refusé',   color: '#DC2626', bg: '#FEF2F2', dot: '#DC2626' },
  expired:   { label: 'Expiré',   color: INK_3,     bg: BG,        dot: INK_3     },
  cancelled: { label: 'Annulé',   color: '#94A3B8', bg: '#F8FAFC', dot: '#94A3B8' },
};

/* ── Type labels (for export — no JSX) ──────────────────── */
const TYPE_LABELS: Record<AppointmentType, string> = {
  generaliste: 'Médecin généraliste',
  urgences:    'Urgences',
  specialiste: 'Spécialiste',
  pharmacie:   'Pharmacie',
};

/* ── Type config (JSX icons) ─────────────────────────────── */
const TYPE_CFG: Record<AppointmentType, { label: string; icon: React.ReactNode }> = {
  generaliste: { label: TYPE_LABELS.generaliste, icon: <MaterialCommunityIcons name="stethoscope"   size={18} color={BRAND} /> },
  urgences:    { label: TYPE_LABELS.urgences,    icon: <Feather name="alert-triangle" size={18} color={BRAND} /> },
  specialiste: { label: TYPE_LABELS.specialiste, icon: <Feather name="user"           size={18} color={BRAND} /> },
  pharmacie:   { label: TYPE_LABELS.pharmacie,   icon: <MaterialCommunityIcons name="pill"          size={18} color={BRAND} /> },
};

/* ── Filter options ──────────────────────────────────────── */
const TYPE_FILTER_OPTS: Array<{ key: HistTypeFilter; label: string }> = [
  { key: 'all',         label: 'Tous'        },
  { key: 'generaliste', label: 'Généraliste' },
  { key: 'urgences',    label: 'Urgences'    },
  { key: 'specialiste', label: 'Spécialiste' },
  { key: 'pharmacie',   label: 'Pharmacie'   },
];

const STAT_FILTER_OPTS: Array<{ key: HistStatFilter; label: string }> = [
  { key: 'all',      label: 'Tous'      },
  { key: 'accepted', label: 'Effectués' },
  { key: 'declined', label: 'Refusés'   },
  { key: 'expired',  label: 'Expirés'   },
];

/* ── Helpers ─────────────────────────────────────────────── */
function formatDateChip(dateStr: string): string {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr + 'T12:00:00').toLocaleDateString('fr-FR', {
      weekday: 'short', day: 'numeric', month: 'short',
    });
  } catch { return dateStr; }
}

function getInitials(name: string): string {
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}

function getHistKey(appt: Appointment): keyof typeof HIST_BADGE {
  if (appt.status === 'accepted')  return 'accepted';
  if (appt.status === 'declined')  return 'declined';
  if (appt.status === 'cancelled') return 'cancelled';
  return 'expired';
}

/* ── StarDisplay ─────────────────────────────────────────── */
const StarDisplay = memo(function StarDisplay({ rating, size = 15 }: { rating: number; size?: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Text key={i} style={{ fontSize: size, color: i <= rating ? '#F59E0B' : '#CBD5E1' }}>★</Text>
      ))}
    </View>
  );
});

/* ── ReviewModal ─────────────────────────────────────────── */
function ReviewModal({
  appt, onClose, onSubmit, submitting,
}: {
  appt: Appointment | null;
  onClose: () => void;
  onSubmit: (rating: number, comment: string) => void;
  submitting: boolean;
}) {
  const [rating, setRating]   = useState(0);
  const [comment, setComment] = useState('');
  const reset = () => { setRating(0); setComment(''); };
  const handleClose  = () => { reset(); onClose(); };
  const handleSubmit = () => {
    if (rating === 0) { Alert.alert('Note manquante', 'Veuillez sélectionner une note avant de valider.'); return; }
    onSubmit(rating, comment); reset();
  };
  if (!appt) return null;
  return (
    <Modal visible transparent animationType="fade" onRequestClose={handleClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={mSt.overlay}>
        <View style={mSt.card}>
          <View style={mSt.header}>
            <Text style={mSt.title}>Noter l'interprète</Text>
            <TouchableOpacity onPress={handleClose}><Feather name="x" size={20} color={INK_2} /></TouchableOpacity>
          </View>
          <View style={mSt.interpRow}>
            <View style={mSt.interpAvatar}>
              <Text style={mSt.interpInitials}>
                {(appt.interpreterName ?? 'I').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}
              </Text>
            </View>
            <View>
              <Text style={mSt.interpLabel}>Votre interprète</Text>
              <Text style={mSt.interpName}>{appt.interpreterName ?? 'Interprète assigné'}</Text>
            </View>
          </View>
          <Text style={mSt.starsLabel}>Votre note</Text>
          <View style={mSt.starsRow}>
            {[1,2,3,4,5].map((i) => (
              <TouchableOpacity key={i} onPress={() => setRating(i)} accessibilityLabel={`${i} étoile${i>1?'s':''}`}>
                <Text style={[mSt.star, { color: i <= rating ? '#F59E0B' : '#CBD5E1' }]}>★</Text>
              </TouchableOpacity>
            ))}
          </View>
          {rating > 0 && (
            <Text style={mSt.ratingHint}>
              {['','Très insuffisant','Insuffisant','Correct','Bien','Excellent !'][rating]}
            </Text>
          )}
          <Text style={mSt.commentLabel}>Commentaire <Text style={{ color: INK_3 }}>(optionnel)</Text></Text>
          <TextInput
            style={mSt.commentInput} value={comment} onChangeText={setComment}
            placeholder="Ponctualité, qualité de l'interprétation…" placeholderTextColor={INK_3}
            multiline numberOfLines={3} maxLength={300}
          />
          <View style={mSt.actions}>
            <TouchableOpacity style={mSt.btnCancel} onPress={handleClose}>
              <Text style={mSt.btnCancelText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[mSt.btnSubmit, (rating === 0 || submitting) && mSt.btnDisabled]}
              onPress={handleSubmit} disabled={rating === 0 || submitting}
            >
              <Text style={mSt.btnSubmitText}>{submitting ? 'Envoi…' : 'Envoyer ✓'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const mSt = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(15,27,45,0.6)', justifyContent: 'flex-end' },
  card: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 36, gap: 14 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 18, fontWeight: '700', color: INK, letterSpacing: -0.3 },
  interpRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  interpAvatar: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#059669', alignItems: 'center', justifyContent: 'center' },
  interpInitials: { fontSize: 15, fontWeight: '700', color: '#fff' },
  interpLabel: { fontSize: 11, fontWeight: '600', color: INK_3, textTransform: 'uppercase', letterSpacing: 0.8 },
  interpName: { fontSize: 15, fontWeight: '700', color: INK },
  starsLabel: { fontSize: 13.5, fontWeight: '600', color: INK },
  starsRow: { flexDirection: 'row', gap: 10, justifyContent: 'center' },
  star: { fontSize: 44 },
  ratingHint: { textAlign: 'center', fontSize: 13, fontWeight: '600', color: '#F59E0B' },
  commentLabel: { fontSize: 13.5, fontWeight: '600', color: INK },
  commentInput: { borderWidth: 1.5, borderColor: BORDER, borderRadius: 12, padding: 12, fontSize: 14, color: INK, minHeight: 80, textAlignVertical: 'top' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  btnCancel: { flex: 1, borderWidth: 1.5, borderColor: BORDER, borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
  btnCancelText: { fontSize: 14, fontWeight: '600', color: INK_2 },
  btnSubmit: { flex: 1, backgroundColor: BRAND, borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
  btnDisabled: { backgroundColor: INK_3 },
  btnSubmitText: { fontSize: 14, fontWeight: '700', color: '#fff' },
});

/* ── StatusPill ──────────────────────────────────────────── */
const StatusPill = memo(function StatusPill({ status }: { status: string }) {
  const s = STATUS_CFG[status] ?? STATUS_CFG.pending;
  return (
    <View style={[pSt.pill, { backgroundColor: s.tint }]}>
      <View style={[pSt.dot, { backgroundColor: s.color }]} />
      <Text style={[pSt.label, { color: s.dark }]}>{s.label}</Text>
    </View>
  );
});
const pSt = StyleSheet.create({
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  dot: { width: 7, height: 7, borderRadius: 3.5 },
  label: { fontSize: 11.5, fontWeight: '700', letterSpacing: 0.1 },
});

/* ── RdvCard — onglets À venir & En attente ──────────────── */
const RdvCard = memo(function RdvCard({
  appt, onCancel, onReschedule, onMessage, unreadCount,
}: {
  appt: Appointment;
  onCancel?: () => void;
  onReschedule?: () => void;
  onMessage?: () => void;
  unreadCount?: number;
}) {
  const typeCfg  = TYPE_CFG[appt.type] ?? TYPE_CFG.generaliste;
  const statusCfg = STATUS_CFG[appt.status] ?? STATUS_CFG.pending;
  const isAccepted = appt.status === 'accepted';
  const isPending  = appt.status === 'pending';
  const isDeclined = appt.status === 'declined';

  const [interpreterPhone, setInterpreterPhone] = useState<string | null>(null);
  const [phoneLoaded, setPhoneLoaded]           = useState(false);

  useEffect(() => {
    if (!isAccepted || !appt.interpreterId) { setPhoneLoaded(true); return; }
    getDoc(doc(db, 'users', appt.interpreterId))
      .then((snap) => { setInterpreterPhone(snap.data()?.phone ?? null); setPhoneLoaded(true); })
      .catch(() => setPhoneLoaded(true));
  }, [appt.interpreterId, isAccepted]);

  return (
    <View style={[cSt.card, { borderColor: statusCfg.border }, isAccepted && cSt.cardAccepted]}>
      <View style={cSt.topRow}>
        <View style={cSt.typeIconBox}>{typeCfg.icon}</View>
        <View style={cSt.typeMeta}>
          <Text style={cSt.typeLabel}>{typeCfg.label.toUpperCase()}</Text>
          <Text style={cSt.locationName} numberOfLines={1}>{appt.location}</Text>
        </View>
        <StatusPill status={appt.status} />
      </View>
      <View style={cSt.chipsRow}>
        <View style={cSt.chip}><Feather name="calendar" size={13} color={INK_2} /><Text style={cSt.chipText}>{formatDateChip(appt.date)}</Text></View>
        <View style={cSt.chip}><Feather name="clock"    size={13} color={INK_2} /><Text style={cSt.chipText}>{appt.time}</Text></View>
      </View>
      <View style={cSt.addressRow}>
        <Feather name="map-pin" size={13} color={INK_3} style={{ marginTop: 1 }} />
        <Text style={cSt.addressText} numberOfLines={1}>{appt.address}</Text>
      </View>
      {isAccepted && (
        <View style={cSt.acceptedBanner}>
          <View style={cSt.acceptedAvatar}><Text style={cSt.acceptedAvatarText}>{getInitials(appt.interpreterName ?? 'I')}</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={cSt.acceptedLabel}>Interprète confirmé</Text>
            <Text style={cSt.acceptedName} numberOfLines={1}>{appt.interpreterName ?? 'Interprète assigné'}</Text>
          </View>
          <TouchableOpacity
            style={[cSt.actionBtn, phoneLoaded && !interpreterPhone && { opacity: 0.4 }]}
            onPress={() => {
              if (!interpreterPhone) {
                Alert.alert('Numéro non disponible', "Ce numéro n'est pas renseigné par l'interprète.");
                return;
              }
              Linking.openURL(`tel:${interpreterPhone}`).catch(() => Alert.alert('Erreur', "Impossible de lancer l'appel."));
            }}
            accessibilityLabel={interpreterPhone ? "Appeler l'interprète" : 'Numéro non disponible'}
          >
            <Feather name="phone" size={14} color="#065F46" />
          </TouchableOpacity>
          <TouchableOpacity
            style={cSt.actionBtn}
            onPress={onMessage}
            accessibilityLabel={unreadCount ? `Messagerie — ${unreadCount} message${unreadCount > 1 ? 's' : ''} non lu${unreadCount > 1 ? 's' : ''}` : 'Envoyer un message'}
          >
            <Feather name="message-circle" size={14} color="#065F46" />
            {!!unreadCount && (
              <View style={cSt.msgBadge}>
                <Text style={cSt.msgBadgeTxt}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      )}
      {isAccepted && (
        <View style={cSt.paymentNote}>
          <Feather name="credit-card" size={12} color={INK_3} />
          <Text style={cSt.paymentNoteText}>
            {appt.interpreterHourlyRate
              ? `💳 Tarif : ${appt.interpreterHourlyRate}€/h · Paiement à convenir avec l'interprète`
              : "💳 Paiement à convenir avec l'interprète"}
          </Text>
        </View>
      )}
      {isPending && (
        <View style={cSt.pendingBanner}>
          <MaterialCommunityIcons name="timer-sand" size={14} color="#B45309" />
          <Text style={cSt.pendingText}>Demande envoyée à plusieurs interprètes · Réponse sous 2h</Text>
        </View>
      )}
      {isPending && onCancel && (
        <TouchableOpacity style={cSt.cancelBtn} onPress={onCancel} accessibilityRole="button">
          <Feather name="x-circle" size={13} color="#DC2626" />
          <Text style={cSt.cancelBtnText}>Annuler ce rendez-vous</Text>
        </TouchableOpacity>
      )}
      {isDeclined && (
        <View style={cSt.declinedBanner}>
          <Feather name="info" size={14} color="#DC2626" />
          <View style={{ flex: 1, gap: 3 }}>
            <Text style={cSt.declinedText}>Aucun interprète disponible</Text>
            <TouchableOpacity onPress={onReschedule} accessibilityRole="button">
              <Text style={cSt.rescheduleTxt}>Reprogrammer →</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
});

const cSt = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, padding: 14, gap: 10, shadowColor: '#0F1B2D', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 2, elevation: 1 },
  cardAccepted: { shadowColor: '#059669', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.18, shadowRadius: 12, elevation: 3 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  typeIconBox: { width: 36, height: 36, borderRadius: 10, backgroundColor: BRAND_TINT, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  typeMeta: { flex: 1, minWidth: 0 },
  typeLabel: { fontSize: 10.5, fontWeight: '600', color: INK_3, letterSpacing: 0.8 },
  locationName: { fontSize: 14.5, fontWeight: '700', color: INK, letterSpacing: -0.2, lineHeight: 18, marginTop: 1 },
  chipsRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, backgroundColor: BG, borderWidth: 1, borderColor: BORDER },
  chipText: { fontSize: 12.5, fontWeight: '600', color: INK, textTransform: 'capitalize' },
  addressRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  addressText: { fontSize: 12, color: INK_2, lineHeight: 17, flex: 1 },
  acceptedBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, paddingHorizontal: 12, backgroundColor: '#ECFDF5', borderWidth: 1, borderColor: '#A7F3D0', borderRadius: 12 },
  acceptedAvatar: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#059669', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  acceptedAvatarText: { fontSize: 11, fontWeight: '700', color: '#fff', letterSpacing: 0.3 },
  acceptedLabel: { fontSize: 10.5, fontWeight: '700', color: '#065F46', textTransform: 'uppercase', letterSpacing: 0.8 },
  acceptedName: { fontSize: 13.5, fontWeight: '700', color: '#065F46' },
  actionBtn: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  pendingBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 8, paddingHorizontal: 12, backgroundColor: '#FFFBEB', borderWidth: 1, borderColor: '#FDE68A', borderRadius: 10 },
  pendingText: { fontSize: 12, color: '#92400E', lineHeight: 17, flex: 1 },
  declinedBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 8, paddingHorizontal: 12, backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA', borderRadius: 10 },
  declinedText: { fontSize: 12, color: '#991B1B', lineHeight: 17 },
  rescheduleTxt: { fontSize: 12, fontWeight: '700', color: '#991B1B', textDecorationLine: 'underline' },
  cancelBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 9, borderRadius: 10, borderWidth: 1.5, borderColor: '#FECACA', backgroundColor: '#FFF5F5' },
  cancelBtnText: { fontSize: 12.5, fontWeight: '600', color: '#DC2626' },
  msgBadge: { position: 'absolute', top: -5, right: -5, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: '#DC2626', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3, borderWidth: 1.5, borderColor: '#ECFDF5' },
  msgBadgeTxt: { fontSize: 9, fontWeight: '800', color: '#fff' },
  paymentNote: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 2 },
  paymentNoteText: { fontSize: 11.5, color: INK_3, flex: 1 },
});

/* ── HistoryCard ─────────────────────────────────────────── */
const HistoryCard = memo(function HistoryCard({
  appt, review, onRate,
}: { appt: Appointment; review?: Review; onRate?: () => void }) {
  const typeCfg = TYPE_CFG[appt.type] ?? TYPE_CFG.generaliste;
  const badge   = HIST_BADGE[getHistKey(appt)];
  return (
    <View style={hSt.card}>
      <View style={hSt.topRow}>
        <View style={hSt.typeIcon}>{typeCfg.icon}</View>
        <View style={hSt.typeMeta}>
          <Text style={hSt.typeLabel}>{typeCfg.label.toUpperCase()}</Text>
          <Text style={hSt.locationName} numberOfLines={1}>{appt.location}</Text>
        </View>
        <View style={[hSt.statusBadge, { backgroundColor: badge.bg }]}>
          <View style={[hSt.statusDot, { backgroundColor: badge.dot }]} />
          <Text style={[hSt.statusText, { color: badge.color }]}>{badge.label}</Text>
        </View>
      </View>
      <View style={hSt.chipsRow}>
        <View style={hSt.chip}><Feather name="calendar" size={12} color={INK_2} /><Text style={hSt.chipText}>{formatDateChip(appt.date)}</Text></View>
        <View style={hSt.chip}><Feather name="clock"    size={12} color={INK_2} /><Text style={hSt.chipText}>{appt.time}</Text></View>
      </View>
      <View style={hSt.addressRow}>
        <Feather name="map-pin" size={12} color={INK_3} style={{ marginTop: 1 }} />
        <Text style={hSt.addressText} numberOfLines={1}>{appt.address}</Text>
      </View>
      {appt.status === 'accepted' && appt.interpreterName && (
        <View style={hSt.interpRow}>
          <View style={hSt.interpAvatar}><Text style={hSt.interpInitials}>{getInitials(appt.interpreterName)}</Text></View>
          <Text style={hSt.interpName} numberOfLines={1}>{appt.interpreterName}</Text>
        </View>
      )}
      {review ? (
        <View style={hSt.ratingRow}>
          <StarDisplay rating={review.rating} size={14} />
          {review.comment ? <Text style={hSt.ratingComment} numberOfLines={1}>"{review.comment}"</Text> : null}
        </View>
      ) : onRate ? (
        <TouchableOpacity style={hSt.rateBtn} onPress={onRate} accessibilityRole="button">
          <Text style={hSt.rateBtnText}>⭐ Noter l'interprète</Text>
          <Feather name="chevron-right" size={13} color={BRAND} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
});

const hSt = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: BORDER, padding: 14, gap: 9, shadowColor: '#0F1B2D', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 2, elevation: 1 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  typeIcon: { width: 34, height: 34, borderRadius: 9, backgroundColor: BRAND_TINT, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  typeMeta: { flex: 1, minWidth: 0 },
  typeLabel: { fontSize: 10, fontWeight: '600', color: INK_3, letterSpacing: 0.8 },
  locationName: { fontSize: 14, fontWeight: '700', color: INK, letterSpacing: -0.2, marginTop: 1 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, flexShrink: 0 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11.5, fontWeight: '700' },
  chipsRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 8, backgroundColor: BG, borderWidth: 1, borderColor: BORDER },
  chipText: { fontSize: 12, fontWeight: '600', color: INK, textTransform: 'capitalize' },
  addressRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  addressText: { fontSize: 12, color: INK_2, lineHeight: 17, flex: 1 },
  interpRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  interpAvatar: { width: 26, height: 26, borderRadius: 8, backgroundColor: '#059669', alignItems: 'center', justifyContent: 'center' },
  interpInitials: { fontSize: 10, fontWeight: '700', color: '#fff' },
  interpName: { fontSize: 13, fontWeight: '600', color: '#065F46', flex: 1 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap', paddingVertical: 6, paddingHorizontal: 10, backgroundColor: '#FFFBEB', borderRadius: 9, borderWidth: 1, borderColor: '#FDE68A' },
  ratingComment: { fontSize: 11.5, color: '#92400E', fontStyle: 'italic', flex: 1 },
  rateBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 9, paddingHorizontal: 12, backgroundColor: BRAND_TINT, borderRadius: 9, borderWidth: 1.5, borderColor: BRAND + '40' },
  rateBtnText: { fontSize: 12.5, fontWeight: '700', color: BRAND },
});

/* ── StatsSection ────────────────────────────────────────── */
function StatsSection({ completedCount, avgRating, favoriteInterp }: {
  completedCount: number; avgRating: number | null; favoriteInterp: string | null;
}) {
  return (
    <View style={stSt.row}>
      <View style={stSt.card}>
        <View style={[stSt.icon, { backgroundColor: '#ECFDF5' }]}><Feather name="check-circle" size={18} color="#059669" /></View>
        <Text style={stSt.value}>{completedCount}</Text>
        <Text style={stSt.label}>Effectués</Text>
      </View>
      <View style={stSt.card}>
        <View style={[stSt.icon, { backgroundColor: '#FFFBEB' }]}><Feather name="star" size={18} color="#F59E0B" /></View>
        <Text style={stSt.value}>{avgRating != null ? avgRating.toFixed(1) : '—'}</Text>
        <Text style={stSt.label}>Note moy.</Text>
      </View>
      <View style={[stSt.card, { flex: 1.5 }]}>
        <View style={[stSt.icon, { backgroundColor: BRAND_TINT }]}><Feather name="heart" size={18} color={BRAND} /></View>
        <Text style={[stSt.value, { fontSize: 13, marginTop: 2 }]} numberOfLines={1}>{favoriteInterp ?? '—'}</Text>
        <Text style={stSt.label}>Interp. favori</Text>
      </View>
    </View>
  );
}

const stSt = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  card: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 12, alignItems: 'center', gap: 4, borderWidth: 1, borderColor: BORDER, shadowColor: '#0F1B2D', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 2, elevation: 1 },
  icon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  value: { fontSize: 20, fontWeight: '800', color: INK, letterSpacing: -0.5 },
  label: { fontSize: 10.5, color: INK_3, fontWeight: '500', textAlign: 'center' },
});

/* ── HistoryFilters ──────────────────────────────────────── */
function HistoryFilters({
  typeFilter, statFilter, sortOrder,
  onTypeChange, onStatChange, onSortChange, onExport,
}: {
  typeFilter: HistTypeFilter; statFilter: HistStatFilter; sortOrder: HistSortOrder;
  onTypeChange: (v: HistTypeFilter) => void; onStatChange: (v: HistStatFilter) => void;
  onSortChange: (v: HistSortOrder) => void; onExport: () => void;
}) {
  return (
    <View style={ffSt.wrap}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={ffSt.chipRow}>
        {TYPE_FILTER_OPTS.map((opt) => (
          <TouchableOpacity key={opt.key} style={[ffSt.chip, typeFilter === opt.key && ffSt.chipOn]} onPress={() => onTypeChange(opt.key)}>
            <Text style={[ffSt.chipTxt, typeFilter === opt.key && ffSt.chipTxtOn]}>{opt.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <View style={ffSt.row2}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }} contentContainerStyle={{ gap: 6, paddingRight: 8 }}>
          {STAT_FILTER_OPTS.map((opt) => (
            <TouchableOpacity key={opt.key} style={[ffSt.chip2, statFilter === opt.key && ffSt.chip2On]} onPress={() => onStatChange(opt.key)}>
              <Text style={[ffSt.chip2Txt, statFilter === opt.key && ffSt.chip2TxtOn]}>{opt.label}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={ffSt.sortBtn} onPress={() => onSortChange(sortOrder === 'recent' ? 'oldest' : 'recent')}>
            <Feather name={sortOrder === 'recent' ? 'arrow-down' : 'arrow-up'} size={12} color={INK_2} />
            <Text style={ffSt.sortTxt}>{sortOrder === 'recent' ? 'Plus récent' : 'Plus ancien'}</Text>
          </TouchableOpacity>
        </ScrollView>
        <TouchableOpacity style={ffSt.exportBtn} onPress={onExport}>
          <Feather name="share" size={14} color={BRAND} />
          <Text style={ffSt.exportTxt}>Exporter</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const ffSt = StyleSheet.create({
  wrap: { gap: 8, marginBottom: 12 },
  chipRow: { gap: 6, paddingBottom: 2 },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, borderWidth: 1.5, borderColor: BORDER, backgroundColor: '#fff' },
  chipOn: { backgroundColor: BRAND, borderColor: BRAND },
  chipTxt: { fontSize: 12.5, fontWeight: '600', color: INK_2 },
  chipTxtOn: { color: '#fff' },
  row2: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  chip2: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: BORDER, backgroundColor: BG },
  chip2On: { backgroundColor: BRAND_TINT, borderColor: BRAND },
  chip2Txt: { fontSize: 12, fontWeight: '600', color: INK_2 },
  chip2TxtOn: { color: BRAND },
  sortBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: BORDER, backgroundColor: BG },
  sortTxt: { fontSize: 12, fontWeight: '600', color: INK_2 },
  exportBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10, backgroundColor: BRAND_TINT, borderWidth: 1.5, borderColor: BRAND + '30', flexShrink: 0 },
  exportTxt: { fontSize: 12.5, fontWeight: '700', color: BRAND },
});

/* ── Main screen ─────────────────────────────────────────── */
export default function MesRdvScreen() {
  const { appointments, loading, hasMore, loadingMore, loadMore, cancelAppointment } = usePatientAppointments();
  const { reviews, submitting, submitReview } = usePatientReviews();
  const unreadMap = useUnreadMessages();
  const [tab, setTab]                   = useState<Tab>('upcoming');
  const [reviewTarget, setReviewTarget] = useState<Appointment | null>(null);
  const [histType, setHistType]         = useState<HistTypeFilter>('all');
  const [histStat, setHistStat]         = useState<HistStatFilter>('all');
  const [histSort, setHistSort]         = useState<HistSortOrder>('recent');
  const [refreshing, setRefreshing]     = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // onSnapshot est déjà temps-réel — on attend brièvement pour le feedback visuel
    await new Promise<void>((r) => setTimeout(r, 800));
    setRefreshing(false);
  }, []);

  /* lists */
  const upcoming = useMemo(
    () => appointments
      .filter((a) => a.date >= TODAY && (a.status === 'pending' || a.status === 'accepted'))
      .sort((a, b) => a.date === b.date ? a.time.localeCompare(b.time) : a.date.localeCompare(b.date)),
    [appointments],
  );
  const pendingList = useMemo(
    () => appointments
      .filter((a) => a.status === 'pending')
      .sort((a, b) => a.date.localeCompare(b.date)),
    [appointments],
  );
  const history = useMemo(
    () => appointments
      .filter((a) => a.date < TODAY || a.status === 'cancelled')
      .sort((a, b) => b.date === a.date ? b.time.localeCompare(a.time) : b.date.localeCompare(a.date)),
    [appointments],
  );

  /* stats */
  const completedAppts = useMemo(() => history.filter((a) => a.status === 'accepted'), [history]);
  const avgRating = useMemo(() => {
    if (!reviews.length) return null;
    return reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
  }, [reviews]);
  const favoriteInterp = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const a of completedAppts) {
      if (a.interpreterName) counts[a.interpreterName] = (counts[a.interpreterName] ?? 0) + 1;
    }
    const entries = Object.entries(counts);
    if (!entries.length) return null;
    return entries.reduce((best, cur) => cur[1] > best[1] ? cur : best)[0];
  }, [completedAppts]);

  /* filtered history */
  const filteredHistory = useMemo(() => {
    let list = history;
    if (histType !== 'all') list = list.filter((a) => a.type === histType);
    if      (histStat === 'accepted') list = list.filter((a) => a.status === 'accepted');
    else if (histStat === 'declined') list = list.filter((a) => a.status === 'declined');
    else if (histStat === 'expired')  list = list.filter((a) => a.status === 'pending');
    return histSort === 'oldest' ? [...list].reverse() : list;
  }, [history, histType, histStat, histSort]);

  /* export */
  const handleExport = useCallback(async () => {
    if (!history.length) {
      Alert.alert('Aucun historique', 'Vous n\'avez pas encore de rendez-vous passés à exporter.');
      return;
    }
    const lines = history.map((a) => {
      const s = a.status === 'accepted' ? 'Effectué' : a.status === 'declined' ? 'Refusé' : 'Expiré';
      return `• ${formatDateChip(a.date)} à ${a.time} — ${a.location} (${TYPE_LABELS[a.type] ?? a.type}) — ${s}`;
    });
    const message = [
      '📋 Mon historique RDV PharmaSign',
      `Exporté le ${new Date().toLocaleDateString('fr-FR')}`,
      '',
      ...lines,
      '',
      `Total : ${completedAppts.length} RDV effectué(s)`,
    ].join('\n');
    try { await Share.share({ message, title: 'Mon historique RDV PharmaSign' }); } catch { /* cancelled */ }
  }, [history, completedAppts]);

  /* review callbacks */
  const handleCloseReview  = useCallback(() => setReviewTarget(null), []);
  const handleSubmitReview = useCallback(async (rating: number, comment: string) => {
    if (!reviewTarget?.interpreterId) return;
    await submitReview(reviewTarget.id, reviewTarget.interpreterId, rating, comment);
    setReviewTarget(null);
  }, [reviewTarget, submitReview]);

  const handleCancel = useCallback((appt: Appointment) => {
    Alert.alert(
      'Annuler ce rendez-vous',
      `Voulez-vous vraiment annuler votre RDV du ${formatDateChip(appt.date)} à ${appt.time} ?`,
      [
        { text: 'Non', style: 'cancel' },
        { text: 'Oui, annuler', style: 'destructive', onPress: () => cancelAppointment(appt.id) },
      ],
    );
  }, [cancelAppointment]);

  const TABS: Array<{ id: Tab; label: string; count: number; amber?: boolean }> = [
    { id: 'upcoming', label: 'À venir',    count: upcoming.length    },
    { id: 'pending',  label: 'En attente', count: pendingList.length, amber: true },
    { id: 'history',  label: 'Historique', count: history.length     },
  ];

  if (loading) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={[s.header, { paddingBottom: 16 }]}>
          <View style={s.headerDeco1} /><View style={s.headerDeco2} />
          <View style={s.headerTopRow}>
            <TouchableOpacity style={s.backBtn} onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Retour">
              <Feather name="chevron-left" size={18} color="#fff" />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={s.headerSupra}>Mon dossier</Text>
              <Text style={s.headerTitle}>Mes rendez-vous</Text>
            </View>
          </View>
        </View>
        <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }} showsVerticalScrollIndicator={false}>
          {[...Array(4)].map((_, i) => <SkeletonRDVCard key={i} />)}
        </ScrollView>
      </SafeAreaView>
    );
  }

  const activeList = tab === 'upcoming' ? upcoming : pendingList;

  return (
    <SafeAreaView style={s.safe}>

      {/* ── Header ─────────────────────────────── */}
      <View style={s.header}>
        <View style={s.headerDeco1} /><View style={s.headerDeco2} />
        <View style={s.headerTopRow}>
          <TouchableOpacity style={s.backBtn} onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Retour">
            <Feather name="chevron-left" size={18} color="#fff" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={s.headerSupra}>Mon dossier</Text>
            <Text style={s.headerTitle}>Mes rendez-vous</Text>
          </View>
        </View>
        <View style={s.miniStatsRow}>
          {[
            { icon: <Feather name="check-circle" size={14} color="#fff" />, value: completedAppts.length.toString(), label: 'Effectués' },
            { icon: <MaterialCommunityIcons name="timer-sand" size={14} color="#fff" />, value: pendingList.length.toString(), label: 'En attente' },
            { icon: <Feather name="star" size={14} color="#fff" />, value: avgRating != null ? avgRating.toFixed(1) : '—', label: 'Note moy.' },
          ].map((item, i) => (
            <View key={i} style={s.miniStat}>
              <View style={s.miniStatIcon}>{item.icon}</View>
              <View><Text style={s.miniStatValue}>{item.value}</Text><Text style={s.miniStatLabel}>{item.label}</Text></View>
            </View>
          ))}
        </View>
      </View>

      {/* ── Tabs ───────────────────────────────── */}
      <View style={s.tabsBar}>
        <View style={s.tabsTrack}>
          {TABS.map((t) => {
            const active = tab === t.id;
            return (
              <TouchableOpacity
                key={t.id}
                style={[s.tabBtn, active && s.tabBtnActive]}
                onPress={() => setTab(t.id)}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
              >
                <Text style={[s.tabLabel, active && s.tabLabelActive]}>{t.label}</Text>
                {t.count > 0 && (
                  <View style={[
                    s.tabBadge,
                    active && s.tabBadgeActive,
                    t.amber && !active && { backgroundColor: '#FEF3C7' },
                  ]}>
                    <Text style={[
                      s.tabBadgeTxt,
                      active && s.tabBadgeTxtActive,
                      t.amber && !active && { color: '#B45309' },
                    ]}>{t.count}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* ── Content ────────────────────────────── */}
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={BRAND} colors={[BRAND]} />
        }
      >

        {tab === 'history' ? (
          history.length === 0 ? (
            <EmptyState onPress={() => router.push('/(tabs)/malentendants/rendez-vous')} />
          ) : (
            <>
              <StatsSection completedCount={completedAppts.length} avgRating={avgRating} favoriteInterp={favoriteInterp} />
              <HistoryFilters
                typeFilter={histType} statFilter={histStat} sortOrder={histSort}
                onTypeChange={setHistType} onStatChange={setHistStat} onSortChange={setHistSort}
                onExport={handleExport}
              />
              {filteredHistory.length === 0 ? (
                <View style={s.filterEmpty}>
                  <Feather name="search" size={32} color={INK_3} />
                  <Text style={s.filterEmptyTxt}>Aucun RDV avec ces filtres</Text>
                </View>
              ) : (
                <View style={s.cardList}>
                  {filteredHistory.map((a) => {
                    const review   = reviews.find((r) => r.appointmentId === a.id);
                    const canRate  = a.status === 'accepted' && !!a.interpreterId && !review;
                    return (
                      <HistoryCard key={a.id} appt={a} review={review} onRate={canRate ? () => setReviewTarget(a) : undefined} />
                    );
                  })}
                </View>
              )}
            </>
          )
        ) : (
          activeList.length === 0 ? (
            <EmptyState onPress={() => router.push('/(tabs)/malentendants/rendez-vous')} />
          ) : (
            <View style={s.cardList}>
              {activeList.map((a) => (
                <RdvCard
                  key={a.id}
                  appt={a}
                  onCancel={a.status === 'pending' ? () => handleCancel(a) : undefined}
                  onReschedule={() => router.push('/(tabs)/malentendants/rendez-vous')}
                  onMessage={a.status === 'accepted' && a.interpreterId
                    ? () => router.push(`/(tabs)/messagerie/${a.id}?recipientId=${encodeURIComponent(a.interpreterId!)}&name=${encodeURIComponent(a.interpreterName ?? 'Interprète')}`)
                    : undefined}
                  unreadCount={unreadMap.get(a.id)}
                />
              ))}
            </View>
          )
        )}
        {hasMore && (
          <TouchableOpacity style={s.loadMoreBtn} onPress={loadMore} disabled={loadingMore}>
            {loadingMore
              ? <ActivityIndicator color={BRAND} size="small" />
              : <Text style={s.loadMoreTxt}>Charger plus de RDV</Text>
            }
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* ── FAB ────────────────────────────────── */}
      <TouchableOpacity
        style={s.fab}
        onPress={() => router.push('/(tabs)/malentendants/rendez-vous')}
        accessibilityRole="button"
        accessibilityLabel="Nouveau rendez-vous"
      >
        <Feather name="plus" size={18} color="#fff" />
        <Text style={s.fabText}>Nouveau RDV</Text>
      </TouchableOpacity>

      <ReviewModal appt={reviewTarget} onClose={handleCloseReview} submitting={submitting} onSubmit={handleSubmitReview} />
    </SafeAreaView>
  );
}

/* ── Empty state ─────────────────────────────────────────── */
const EmptyState = memo(function EmptyState({ onPress }: { onPress: () => void }) {
  return (
    <View style={s.emptyWrap}>
      <View style={s.emptyIconWrap}>
        <View style={s.emptyCalCard}>
          <View style={s.emptyCalHeader}>{[0,1,2].map((i) => <View key={i} style={s.emptyCalBar} />)}</View>
          <View style={s.emptyCalGrid}>{Array.from({ length: 12 }).map((_, i) => <View key={i} style={[s.emptyCalCell, i === 6 && { backgroundColor: BRAND }]} />)}</View>
        </View>
        <View style={s.emptyPlusBtn}><Feather name="plus" size={20} color={BRAND} /></View>
      </View>
      <Text style={s.emptyTitle}>Aucun rendez-vous pour l'instant</Text>
      <Text style={s.emptySub}>Vos demandes de RDV avec interprète apparaîtront ici, avec leur statut en temps réel.</Text>
      <TouchableOpacity style={s.emptyBtn} onPress={onPress} accessibilityRole="button">
        <Feather name="plus" size={16} color="#fff" />
        <Text style={s.emptyBtnText}>Prendre un premier RDV</Text>
      </TouchableOpacity>
      <View style={s.emptyFooter}>
        <Feather name="check" size={13} color={BRAND} />
        <Text style={s.emptyFooterTxt}>Service gratuit · Réponse sous 2h en moyenne</Text>
      </View>
    </View>
  );
});

/* ── Styles ──────────────────────────────────────────────── */
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, backgroundColor: BG },
  loadingText: { fontSize: 14, color: INK_2 },

  /* Header */
  header: { backgroundColor: BRAND, paddingTop: 14, paddingBottom: 16, paddingHorizontal: 20, overflow: 'hidden', position: 'relative', gap: 14 },
  headerDeco1: { position: 'absolute', top: -50, right: -40, width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.06)' },
  headerDeco2: { position: 'absolute', top: 20, right: 60, width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.04)' },
  headerTopRow: { flexDirection: 'row', alignItems: 'center', gap: 12, zIndex: 1 },
  backBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center' },
  headerSupra: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.78)', textTransform: 'uppercase', letterSpacing: 1.2 },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#fff', letterSpacing: -0.5, lineHeight: 26, marginTop: 2 },
  miniStatsRow: { flexDirection: 'row', gap: 8, zIndex: 1 },
  miniStat: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, paddingHorizontal: 12, backgroundColor: 'rgba(255,255,255,0.14)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)', borderRadius: 12 },
  miniStatIcon: { width: 30, height: 30, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  miniStatValue: { fontSize: 18, fontWeight: '700', color: '#fff', lineHeight: 22 },
  miniStatLabel: { fontSize: 11, color: 'rgba(255,255,255,0.8)', marginTop: 3 },

  /* Tabs */
  tabsBar: { padding: 12, paddingHorizontal: 20, backgroundColor: BG, borderBottomWidth: 1, borderBottomColor: BORDER },
  tabsTrack: { flexDirection: 'row', gap: 4, padding: 5, backgroundColor: BG, borderRadius: 14, borderWidth: 1, borderColor: BORDER },
  tabBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 9, paddingHorizontal: 8, borderRadius: 10 },
  tabBtnActive: { backgroundColor: '#fff', shadowColor: '#0F1B2D', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3, elevation: 2 },
  tabLabel: { fontSize: 12.5, fontWeight: '600', color: INK_2, letterSpacing: -0.1 },
  tabLabelActive: { color: INK },
  tabBadge: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: 999, backgroundColor: BORDER },
  tabBadgeActive: { backgroundColor: BRAND_TINT },
  tabBadgeTxt: { fontSize: 11, fontWeight: '700', color: INK_3 },
  tabBadgeTxtActive: { color: BRAND },

  /* Content */
  scroll: { flex: 1 },
  scrollContent: { padding: 14, paddingHorizontal: 20, paddingBottom: 100 },
  cardList: { gap: 10 },
  filterEmpty: { alignItems: 'center', gap: 10, paddingVertical: 40 },
  filterEmptyTxt: { fontSize: 14, color: INK_3, fontWeight: '500' },

  /* FAB */
  fab: { position: 'absolute', bottom: 20, right: 20, flexDirection: 'row', alignItems: 'center', gap: 8, height: 52, paddingHorizontal: 18, borderRadius: 999, backgroundColor: BRAND, shadowColor: BRAND, shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.45, shadowRadius: 20, elevation: 8 },
  fabText: { fontSize: 14, fontWeight: '700', color: '#fff', letterSpacing: -0.1 },

  /* Empty state */
  emptyWrap: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 24, gap: 8 },
  emptyIconWrap: { width: 120, height: 120, marginBottom: 14, position: 'relative', alignItems: 'center', justifyContent: 'center' },
  emptyCalCard: { position: 'absolute', top: 14, left: 14, right: 14, bottom: 14, backgroundColor: '#fff', borderRadius: 18, borderWidth: 1.5, borderColor: BORDER, overflow: 'hidden', shadowColor: BRAND, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.18, shadowRadius: 16, elevation: 4 },
  emptyCalHeader: { height: 22, backgroundColor: BRAND, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingHorizontal: 8 },
  emptyCalBar: { width: 4, height: 8, backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: 2 },
  emptyCalGrid: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', padding: 6, gap: 3 },
  emptyCalCell: { width: '22%', aspectRatio: 1, backgroundColor: BG, borderRadius: 3 },
  emptyPlusBtn: { position: 'absolute', top: 4, right: 0, width: 38, height: 38, borderRadius: 19, backgroundColor: '#fff', borderWidth: 2, borderColor: BRAND, alignItems: 'center', justifyContent: 'center', shadowColor: BRAND, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 3 },
  emptyTitle: { fontSize: 19, fontWeight: '700', color: INK, letterSpacing: -0.4, textAlign: 'center' },
  emptySub: { fontSize: 13.5, color: INK_2, lineHeight: 20, textAlign: 'center', maxWidth: 280 },
  emptyBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: BRAND, borderRadius: 14, paddingHorizontal: 24, paddingVertical: 14, marginTop: 8, shadowColor: BRAND, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 16, elevation: 5 },
  emptyBtnText: { fontSize: 14, fontWeight: '700', color: '#fff', letterSpacing: -0.1 },
  emptyFooter: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16 },
  emptyFooterTxt: { fontSize: 12, color: INK_3 },
  loadMoreBtn: { alignItems: 'center', justifyContent: 'center', height: 48, borderRadius: 12, backgroundColor: '#fff', borderWidth: 1.5, borderColor: BORDER, marginTop: 8 },
  loadMoreTxt: { fontSize: 13.5, fontWeight: '600', color: BRAND },
});
