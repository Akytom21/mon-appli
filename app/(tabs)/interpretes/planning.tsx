import { router } from 'expo-router';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors, FontSize, Radius, Spacing } from '@/constants/theme';

const JOURS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const TODAY = 3;

const RDV = [
  {
    id: '1',
    heure: '09h00',
    patient: 'Patient M.',
    besoin: 'Consultation générale',
    lieu: 'Cabinet Dr. Moreau, Paris 11e',
    statut: 'confirmé',
  },
  {
    id: '2',
    heure: '11h30',
    patient: 'Patient K.',
    besoin: 'Ophtalmologie',
    lieu: 'Clinique Saint-Louis, Paris 10e',
    statut: 'confirmé',
  },
  {
    id: '3',
    heure: '14h00',
    patient: 'Patient R.',
    besoin: 'Psychiatrie',
    lieu: 'Centre médical République',
    statut: 'en attente',
  },
];

const STATUT_COLOR: Record<string, string> = {
  confirmé: Colors.interpretes,
  'en attente': Colors.warning,
};

export default function PlanningScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Weekly calendar */}
        <View style={styles.calendar}>
          <Text style={styles.calendarMonth}>Mai 2026</Text>
          <View style={styles.daysRow}>
            {JOURS.map((jour, index) => (
              <TouchableOpacity
                key={jour}
                style={[styles.dayItem, index === TODAY && styles.dayItemActive]}
                accessibilityRole="button"
                accessibilityState={{ selected: index === TODAY }}
              >
                <Text style={[styles.dayName, index === TODAY && styles.dayNameActive]}>
                  {jour}
                </Text>
                <Text style={[styles.dayNum, index === TODAY && styles.dayNumActive]}>
                  {index + 1}
                </Text>
                {index === TODAY && <View style={styles.dayDot} />}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Appointments for today */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Aujourd'hui — 3 missions</Text>
            <View style={styles.todayBadge}>
              <Text style={styles.todayBadgeText}>Jeudi 3 mai</Text>
            </View>
          </View>

          {RDV.map((rdv) => (
            <View key={rdv.id} style={styles.rdvCard}>
              <View style={styles.rdvTime}>
                <Text style={styles.rdvHeure}>{rdv.heure}</Text>
                <View style={[styles.rdvLine, { backgroundColor: STATUT_COLOR[rdv.statut] }]} />
              </View>
              <View style={styles.rdvBody}>
                <View style={styles.rdvTop}>
                  <Text style={styles.rdvBesoin}>{rdv.besoin}</Text>
                  <View
                    style={[
                      styles.statutBadge,
                      { backgroundColor: STATUT_COLOR[rdv.statut] + '22' },
                    ]}
                  >
                    <Text style={[styles.statutText, { color: STATUT_COLOR[rdv.statut] }]}>
                      {rdv.statut}
                    </Text>
                  </View>
                </View>
                <Text style={styles.rdvPatient}>👤 {rdv.patient}</Text>
                <Text style={styles.rdvLieu}>📍 {rdv.lieu}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Summary */}
        <View style={styles.summary}>
          <Text style={styles.summaryTitle}>Résumé de la semaine</Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>5</Text>
              <Text style={styles.summaryLabel}>Missions confirmées</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>2</Text>
              <Text style={styles.summaryLabel}>En attente</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>14h</Text>
              <Text style={styles.summaryLabel}>Durée totale</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.missionBtn}
          onPress={() => router.push('/(tabs)/interpretes/missions')}
          accessibilityRole="button"
        >
          <Text style={styles.missionBtnText}>🎯  Voir les missions disponibles</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.interpretes },
  scroll: { flex: 1, backgroundColor: Colors.background },
  content: { paddingBottom: Spacing.xxl },

  calendar: {
    backgroundColor: Colors.white,
    padding: Spacing.lg,
    paddingTop: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  calendarMonth: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayItem: {
    alignItems: 'center',
    padding: Spacing.sm,
    borderRadius: Radius.md,
    flex: 1,
  },
  dayItemActive: { backgroundColor: Colors.interpretes },
  dayName: { fontSize: FontSize.xs, color: Colors.textSecondary, marginBottom: 4 },
  dayNameActive: { color: Colors.white },
  dayNum: { fontSize: FontSize.md, fontWeight: '600', color: Colors.textPrimary },
  dayNumActive: { color: Colors.white },
  dayDot: {
    width: 4,
    height: 4,
    borderRadius: Radius.full,
    backgroundColor: Colors.white,
    marginTop: 3,
  },

  section: { padding: Spacing.lg },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  todayBadge: {
    backgroundColor: Colors.interpretesLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  todayBadgeText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.interpretes,
  },

  rdvCard: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  rdvTime: {
    alignItems: 'center',
    width: 52,
    flexShrink: 0,
  },
  rdvHeure: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  rdvLine: {
    flex: 1,
    width: 2,
    borderRadius: 1,
    minHeight: 40,
  },
  rdvBody: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: Spacing.xs,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  rdvTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  rdvBesoin: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary, flex: 1 },
  statutBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.full,
    flexShrink: 0,
  },
  statutText: { fontSize: FontSize.xs, fontWeight: '600' },
  rdvPatient: { fontSize: FontSize.sm, color: Colors.textSecondary },
  rdvLieu: { fontSize: FontSize.sm, color: Colors.textSecondary },

  summary: {
    margin: Spacing.lg,
    marginTop: 0,
    backgroundColor: Colors.interpretesLight,
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  summaryTitle: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.interpretesDark,
    marginBottom: Spacing.md,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-around' },
  summaryItem: { alignItems: 'center' },
  summaryValue: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.interpretes },
  summaryLabel: {
    fontSize: FontSize.xs,
    color: Colors.interpretesDark,
    textAlign: 'center',
    marginTop: 2,
  },

  missionBtn: {
    margin: Spacing.lg,
    marginTop: 0,
    backgroundColor: Colors.interpretes,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    alignItems: 'center',
  },
  missionBtnText: { fontSize: FontSize.md, fontWeight: '700', color: Colors.white },
});
