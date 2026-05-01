import { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors, FontSize, Radius, Spacing } from '@/constants/theme';

type Mission = {
  id: string;
  besoin: string;
  patient: string;
  lieu: string;
  distance: string;
  heure: string;
  date: string;
  duree: string;
  urgence: boolean;
  statut: 'disponible' | 'acceptée' | 'refusée';
};

const MISSIONS_INIT: Mission[] = [
  {
    id: '1',
    besoin: 'Consultation générale',
    patient: 'Patient A.',
    lieu: 'Cabinet Dr. Petit, Paris 12e',
    distance: '0.5 km',
    heure: '10h30',
    date: "Aujourd'hui",
    duree: '1h',
    urgence: false,
    statut: 'disponible',
  },
  {
    id: '2',
    besoin: 'Psychiatrie',
    patient: 'Patient B.',
    lieu: 'Centre médical Nation',
    distance: '1.1 km',
    heure: '11h00',
    date: "Aujourd'hui",
    duree: '1h30',
    urgence: true,
    statut: 'disponible',
  },
  {
    id: '3',
    besoin: 'Spécialiste — Cardiologie',
    patient: 'Patient C.',
    lieu: 'Hôpital Saint-Antoine, Paris 12e',
    distance: '2.3 km',
    heure: '14h00',
    date: 'Demain',
    duree: '2h',
    urgence: false,
    statut: 'disponible',
  },
  {
    id: '4',
    besoin: 'Ophtalmologie',
    patient: 'Patient D.',
    lieu: 'Clinique des Quinze-Vingts',
    distance: '3.0 km',
    heure: '09h00',
    date: 'Demain',
    duree: '45 min',
    urgence: false,
    statut: 'disponible',
  },
];

export default function MissionsScreen() {
  const [missions, setMissions] = useState<Mission[]>(MISSIONS_INIT);

  const handleAction = (id: string, action: 'acceptée' | 'refusée') => {
    setMissions((prev) =>
      prev.map((m) => (m.id === id ? { ...m, statut: action } : m))
    );
  };

  const disponibles = missions.filter((m) => m.statut === 'disponible');
  const traitees = missions.filter((m) => m.statut !== 'disponible');

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats bar */}
        <View style={styles.statsBar}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{disponibles.length}</Text>
            <Text style={styles.statLabel}>En attente</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>
              {missions.filter((m) => m.statut === 'acceptée').length}
            </Text>
            <Text style={styles.statLabel}>Acceptées</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>
              {missions.filter((m) => m.statut === 'refusée').length}
            </Text>
            <Text style={styles.statLabel}>Refusées</Text>
          </View>
        </View>

        {/* Available missions */}
        {disponibles.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Missions disponibles</Text>
            {disponibles.map((mission) => (
              <View key={mission.id} style={styles.missionCard}>
                {mission.urgence && (
                  <View style={styles.urgenceBar}>
                    <Text style={styles.urgenceText}>🚨 MISSION URGENTE</Text>
                  </View>
                )}
                <View style={styles.missionTop}>
                  <Text style={styles.missionBesoin}>{mission.besoin}</Text>
                  <Text style={styles.missionPatient}>👤 {mission.patient}</Text>
                </View>
                <View style={styles.missionMeta}>
                  <Text style={styles.metaItem}>📍 {mission.lieu}</Text>
                  <Text style={styles.metaItem}>
                    📏 {mission.distance} · 📅 {mission.date} à {mission.heure} · ⏱ {mission.duree}
                  </Text>
                </View>
                <View style={styles.missionActions}>
                  <TouchableOpacity
                    style={styles.refuserBtn}
                    onPress={() => handleAction(mission.id, 'refusée')}
                    accessibilityRole="button"
                    accessibilityLabel="Refuser cette mission"
                  >
                    <Text style={styles.refuserText}>Refuser</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.accepterBtn}
                    onPress={() => handleAction(mission.id, 'acceptée')}
                    accessibilityRole="button"
                    accessibilityLabel="Accepter cette mission"
                  >
                    <Text style={styles.accepterText}>✓  Accepter</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Processed missions */}
        {traitees.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Missions traitées</Text>
            {traitees.map((mission) => (
              <View key={mission.id} style={styles.traiteeCard}>
                <View style={styles.traiteeInfo}>
                  <Text style={styles.traiteeBesoin}>{mission.besoin}</Text>
                  <Text style={styles.traiteeDate}>
                    {mission.date} à {mission.heure}
                  </Text>
                </View>
                <View
                  style={[
                    styles.traiteeStatut,
                    {
                      backgroundColor:
                        mission.statut === 'acceptée' ? Colors.interpretesLight : '#FEE2E2',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.traiteeStatutText,
                      {
                        color: mission.statut === 'acceptée' ? Colors.interpretes : Colors.error,
                      },
                    ]}
                  >
                    {mission.statut === 'acceptée' ? '✓ Acceptée' : '✗ Refusée'}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {disponibles.length === 0 && traitees.length === missions.length && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🎉</Text>
            <Text style={styles.emptyTitle}>Toutes les missions traitées !</Text>
            <Text style={styles.emptyText}>Revenez plus tard pour de nouvelles demandes.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.interpretes },
  scroll: { flex: 1, backgroundColor: Colors.background },
  content: { paddingBottom: Spacing.xxl },

  statsBar: {
    flexDirection: 'row',
    backgroundColor: Colors.interpretes,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.lg,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  stat: { alignItems: 'center' },
  statValue: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.white },
  statLabel: { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  statDivider: { width: 1, height: 36, backgroundColor: 'rgba(255,255,255,0.3)' },

  section: { padding: Spacing.lg, gap: Spacing.sm },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },

  missionCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  urgenceBar: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  urgenceText: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.error },
  missionTop: {
    padding: Spacing.md,
    paddingBottom: Spacing.xs,
    gap: 3,
  },
  missionBesoin: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
  missionPatient: { fontSize: FontSize.sm, color: Colors.textSecondary },
  missionMeta: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    gap: 3,
  },
  metaItem: { fontSize: FontSize.sm, color: Colors.textSecondary },
  missionActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  refuserBtn: {
    flex: 1,
    padding: Spacing.md,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: Colors.border,
  },
  refuserText: { fontSize: FontSize.md, fontWeight: '600', color: Colors.textSecondary },
  accepterBtn: {
    flex: 2,
    padding: Spacing.md,
    alignItems: 'center',
    backgroundColor: Colors.interpretes,
  },
  accepterText: { fontSize: FontSize.md, fontWeight: '700', color: Colors.white },

  traiteeCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    padding: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  traiteeInfo: { gap: 2, flex: 1 },
  traiteeBesoin: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textPrimary },
  traiteeDate: { fontSize: FontSize.xs, color: Colors.textSecondary },
  traiteeStatut: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.full,
    flexShrink: 0,
  },
  traiteeStatutText: { fontSize: FontSize.xs, fontWeight: '700' },

  emptyState: {
    padding: Spacing.xxl,
    alignItems: 'center',
    gap: Spacing.md,
  },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.textPrimary },
  emptyText: { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: 'center' },
});
