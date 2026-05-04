import { router } from 'expo-router';
import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors, FontSize, Radius, Spacing } from '@/constants/theme';
import {
  usePatientAppointments,
  type Appointment,
  type AppointmentStatus,
  type AppointmentType,
} from '@/hooks/useAppointments';

const TODAY = new Date().toISOString().split('T')[0];

const TYPE_INFO: Record<AppointmentType, { label: string; icon: string }> = {
  generaliste: { label: 'Médecin généraliste', icon: '🩺' },
  urgences:    { label: 'Urgences',             icon: '🚨' },
  specialiste: { label: 'Spécialiste',          icon: '👨‍⚕️' },
  pharmacie:   { label: 'Pharmacie',            icon: '💊' },
};

const STATUS_CONFIG: Record<AppointmentStatus, { label: string; textColor: string; bg: string; dot: string }> = {
  pending:  { label: 'En attente',  textColor: '#92400E', bg: '#FFF7ED', dot: '🟠' },
  accepted: { label: 'Accepté',     textColor: '#065F46', bg: '#ECFDF5', dot: '🟢' },
  declined: { label: 'Non attribué', textColor: '#991B1B', bg: '#FEF2F2', dot: '🔴' },
};

function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr + 'T12:00:00').toLocaleDateString('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long',
    });
  } catch {
    return dateStr;
  }
}

export default function MesRdvScreen() {
  const { appointments, loading } = usePatientAppointments();

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.malentendants} />
        <Text style={styles.loadingText}>Chargement de vos rendez-vous…</Text>
      </View>
    );
  }

  const upcoming = appointments
    .filter((a) => a.date >= TODAY)
    .sort((a, b) => (a.date === b.date ? a.time.localeCompare(b.time) : a.date.localeCompare(b.date)));

  const past = appointments
    .filter((a) => a.date < TODAY)
    .sort((a, b) => (a.date === b.date ? b.time.localeCompare(a.time) : b.date.localeCompare(a.date)));

  if (appointments.length === 0) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.emptyFull}>
          <Text style={styles.emptyIcon}>📅</Text>
          <Text style={styles.emptyTitle}>Aucun rendez-vous</Text>
          <Text style={styles.emptySub}>
            Vos demandes de rendez-vous apparaîtront ici avec leur statut en temps réel.
          </Text>
          <TouchableOpacity
            style={styles.emptyBtn}
            onPress={() => router.push('/(tabs)/malentendants/rendez-vous')}
            accessibilityRole="button"
          >
            <Text style={styles.emptyBtnText}>Prendre un rendez-vous</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Section : À venir ── */}
        <SectionBlock
          title="Prochains rendez-vous"
          count={upcoming.length}
          accent={Colors.malentendants}
          emptyIcon="🗓"
          emptyText="Aucun rendez-vous à venir"
        >
          {upcoming.map((appt) => (
            <RdvCard key={appt.id} appt={appt} />
          ))}
        </SectionBlock>

        {/* ── Section : Historique ── */}
        <SectionBlock
          title="Historique"
          count={past.length}
          accent={Colors.textSecondary}
          emptyIcon="📋"
          emptyText="Aucun rendez-vous passé"
        >
          {past.map((appt) => (
            <RdvCard key={appt.id} appt={appt} dimmed />
          ))}
        </SectionBlock>

        {/* Bouton nouveau RDV */}
        <TouchableOpacity
          style={styles.newRdvBtn}
          onPress={() => router.push('/(tabs)/malentendants/rendez-vous')}
          accessibilityRole="button"
        >
          <Text style={styles.newRdvBtnText}>+ Prendre un nouveau rendez-vous</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ── Section wrapper ─────────────────────────────────────── */

function SectionBlock({
  title,
  count,
  accent,
  emptyIcon,
  emptyText,
  children,
}: {
  title: string;
  count: number;
  accent: string;
  emptyIcon: string;
  emptyText: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.section}>
      {/* Header */}
      <View style={styles.sectionHeader}>
        <View style={[styles.sectionAccentBar, { backgroundColor: accent }]} />
        <Text style={styles.sectionTitle}>{title}</Text>
        <View style={[styles.sectionCountBadge, { backgroundColor: accent + '18' }]}>
          <Text style={[styles.sectionCountText, { color: accent }]}>{count}</Text>
        </View>
      </View>

      {count === 0 ? (
        <View style={styles.sectionEmpty}>
          <Text style={styles.sectionEmptyIcon}>{emptyIcon}</Text>
          <Text style={styles.sectionEmptyText}>{emptyText}</Text>
        </View>
      ) : (
        <View style={styles.cardList}>{children}</View>
      )}
    </View>
  );
}

/* ── RDV Card ────────────────────────────────────────────── */

function RdvCard({ appt, dimmed = false }: { appt: Appointment; dimmed?: boolean }) {
  const typeInfo = TYPE_INFO[appt.type] ?? { label: appt.type, icon: '🏥' };
  const statusCfg = STATUS_CONFIG[appt.status] ?? STATUS_CONFIG.pending;
  const isAccepted = appt.status === 'accepted';

  return (
    <View style={[styles.card, dimmed && styles.cardDimmed, isAccepted && styles.cardAccepted]}>
      {/* En-tête : type + badge statut */}
      <View style={styles.cardHeader}>
        <View style={styles.typeRow}>
          <Text style={styles.typeIcon}>{typeInfo.icon}</Text>
          <Text style={[styles.typeLabel, dimmed && styles.typeLabelDimmed]}>
            {typeInfo.label}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusCfg.bg }]}>
          <Text style={styles.statusDot}>{statusCfg.dot}</Text>
          <Text style={[styles.statusLabel, { color: statusCfg.textColor }]}>
            {statusCfg.label}
          </Text>
        </View>
      </View>

      {/* Date + heure */}
      <View style={styles.dateRow}>
        <View style={styles.dateItem}>
          <Text style={styles.dateIcon}>📅</Text>
          <Text style={[styles.dateText, dimmed && styles.dateTextDimmed]}>
            {formatDate(appt.date)}
          </Text>
        </View>
        <View style={styles.dateItem}>
          <Text style={styles.dateIcon}>🕐</Text>
          <Text style={[styles.dateText, dimmed && styles.dateTextDimmed]}>{appt.time}</Text>
        </View>
      </View>

      {/* Professionnel */}
      <View style={styles.locationRow}>
        <Text style={styles.locationIcon}>📍</Text>
        <View style={styles.locationText}>
          <Text style={[styles.locationName, dimmed && styles.locationNameDimmed]} numberOfLines={1}>
            {appt.location}
          </Text>
          <Text style={styles.locationAddress} numberOfLines={1}>{appt.address}</Text>
        </View>
      </View>

      {/* Interprète assigné */}
      {isAccepted && (
        <View style={styles.interpreterBox}>
          <Text style={styles.interpreterIcon}>👐</Text>
          <View>
            <Text style={styles.interpreterLabel}>Interprète assigné</Text>
            <Text style={styles.interpreterName}>
              {appt.interpreterName ?? 'Interprète confirmé'}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

/* ── Styles ──────────────────────────────────────────────── */
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.background,
  },
  loadingText: { fontSize: FontSize.sm, color: Colors.textSecondary },

  scrollContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
    gap: Spacing.xl,
  },

  /* Section */
  section: { gap: Spacing.md },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  sectionAccentBar: {
    width: 4,
    height: 20,
    borderRadius: 2,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
    flex: 1,
  },
  sectionCountBadge: {
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    minWidth: 28,
    alignItems: 'center',
  },
  sectionCountText: {
    fontSize: FontSize.xs,
    fontWeight: '800',
  },
  sectionEmpty: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    backgroundColor: Colors.background,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  sectionEmptyIcon: { fontSize: 20 },
  sectionEmptyText: { fontSize: FontSize.sm, color: Colors.textSecondary },

  cardList: { gap: Spacing.sm },

  /* Card */
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
    borderWidth: 1.5,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },
  cardDimmed: {
    opacity: 0.75,
    shadowOpacity: 0.03,
    elevation: 1,
  },
  cardAccepted: {
    borderColor: '#6EE7B7',
    borderWidth: 2,
    shadowColor: '#059669',
    shadowOpacity: 0.1,
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    flex: 1,
  },
  typeIcon: { fontSize: 17 },
  typeLabel: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
  typeLabelDimmed: { color: Colors.textSecondary },

  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    flexShrink: 0,
  },
  statusDot: { fontSize: 10 },
  statusLabel: { fontSize: FontSize.xs, fontWeight: '700' },

  dateRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  dateItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dateIcon: { fontSize: 13 },
  dateText: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textPrimary },
  dateTextDimmed: { color: Colors.textSecondary, fontWeight: '500' },

  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  locationIcon: { fontSize: 14, marginTop: 2 },
  locationText: { flex: 1 },
  locationName: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  locationNameDimmed: { color: Colors.textSecondary },
  locationAddress: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 1 },

  interpreterBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: '#ECFDF5',
    borderRadius: Radius.md,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: '#6EE7B7',
    marginTop: Spacing.xs,
  },
  interpreterIcon: { fontSize: 20 },
  interpreterLabel: { fontSize: FontSize.xs, color: '#065F46', fontWeight: '600' },
  interpreterName: { fontSize: FontSize.sm, fontWeight: '700', color: '#065F46' },

  /* Empty full-screen state */
  emptyFull: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  emptyIcon: { fontSize: 56 },
  emptyTitle: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.textPrimary },
  emptySub: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyBtn: {
    backgroundColor: Colors.malentendants,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    marginTop: Spacing.sm,
  },
  emptyBtnText: { fontSize: FontSize.md, fontWeight: '700', color: Colors.white },

  newRdvBtn: {
    backgroundColor: Colors.malentendants,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    shadowColor: Colors.malentendants,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  newRdvBtnText: { fontSize: FontSize.md, fontWeight: '700', color: Colors.white },
});
