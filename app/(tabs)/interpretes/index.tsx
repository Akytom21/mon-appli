import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { Colors, FontSize, Radius, Spacing } from '@/constants/theme';
import { NICE_CENTER } from '@/data/mockData';
import { useAppointments, type Appointment, type AppointmentType } from '@/hooks/useAppointments';

let MapView: any, Marker: any, Callout: any;
if (Platform.OS !== 'web') {
  const maps = require('react-native-maps');
  MapView = maps.default;
  Marker = maps.Marker;
  Callout = maps.Callout;
}

const TYPE_INFO: Record<AppointmentType, { label: string; icon: string }> = {
  generaliste: { label: 'Médecin généraliste', icon: '🩺' },
  urgences: { label: 'Urgences', icon: '🚨' },
  specialiste: { label: 'Spécialiste', icon: '👨‍⚕️' },
  pharmacie: { label: 'Pharmacie', icon: '💊' },
};

export default function InterpretesHome() {
  const { user } = useAuth();
  const { pending, acceptMission } = useAppointments();
  const [selected, setSelected] = useState<Appointment | null>(null);
  const prenom = user?.name?.split(' ')[0] ?? '';

  // Désélectionne si la demande n'est plus disponible (acceptée par quelqu'un d'autre)
  useEffect(() => {
    if (selected && !pending.find((a) => a.id === selected.id)) {
      setSelected(null);
    }
  }, [pending]);

  const handleAccept = async (id: string) => {
    await acceptMission(id);
    setSelected(null);
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Bonjour {prenom} 👐</Text>
        <Text style={styles.headerSub}>Demandes de RDV à Nice et alentours</Text>
      </View>

      {/* Map */}
      <View style={styles.mapWrapper}>
        {Platform.OS !== 'web' ? (
          <MapView
            style={StyleSheet.absoluteFillObject}
            initialRegion={NICE_CENTER}
            showsUserLocation
            showsMyLocationButton
          >
            {pending.map((appt) => (
              <Marker
                key={appt.id}
                coordinate={{ latitude: appt.coordinates.lat, longitude: appt.coordinates.lng }}
                pinColor={appt.type === 'urgences' ? '#EF4444' : '#2A9D8F'}
                onPress={() => setSelected(appt)}
              >
                <Callout tooltip>
                  <View style={styles.callout}>
                    {appt.type === 'urgences' && (
                      <View style={styles.calloutUrgent}>
                        <Text style={styles.calloutUrgentText}>🚨 URGENT</Text>
                      </View>
                    )}
                    <Text style={styles.calloutBesoin}>
                      {TYPE_INFO[appt.type].icon} {TYPE_INFO[appt.type].label}
                    </Text>
                    <Text style={styles.calloutMeta}>
                      🕐 {appt.time} — {appt.date}
                    </Text>
                    <Text style={styles.calloutMeta}>👤 {appt.patientName}</Text>
                  </View>
                </Callout>
              </Marker>
            ))}
          </MapView>
        ) : (
          <View style={styles.mapFallback}>
            <Text style={styles.mapFallbackEmoji}>🗺️</Text>
            <Text style={styles.mapFallbackText}>Carte disponible sur mobile</Text>
            <Text style={styles.mapFallbackSub}>
              {pending.length} demande{pending.length !== 1 ? 's' : ''} en attente à Nice
            </Text>
          </View>
        )}

        {/* Map legend */}
        <View style={styles.mapLegend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: Colors.malentendants }]} />
            <Text style={styles.legendText}>Standard</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: Colors.error }]} />
            <Text style={styles.legendText}>Urgent</Text>
          </View>
        </View>
      </View>

      {/* Scrollable content */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Selected request card */}
        {selected && (
          <View style={[styles.selectedCard, selected.type === 'urgences' && { borderColor: Colors.error }]}>
            <View style={styles.selectedLeft}>
              {selected.type === 'urgences' && (
                <View style={styles.urgentBadge}>
                  <Text style={styles.urgentText}>🚨 URGENT</Text>
                </View>
              )}
              <Text style={styles.selectedBesoin}>
                {TYPE_INFO[selected.type].icon} {TYPE_INFO[selected.type].label}
              </Text>
              <Text style={styles.selectedPatient}>👤 {selected.patientName}</Text>
              <Text style={styles.selectedMeta}>🕐 {selected.time} — {selected.date}</Text>
              <Text style={styles.selectedMeta} numberOfLines={1}>📍 {selected.location}</Text>
            </View>
            <View style={styles.selectedActions}>
              <TouchableOpacity
                style={styles.acceptBtn}
                onPress={() => handleAccept(selected.id)}
                accessibilityRole="button"
              >
                <Text style={styles.acceptBtnText}>✓ Accepter</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Quick actions */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => router.push('/(tabs)/interpretes/planning')}
            activeOpacity={0.8}
            accessibilityRole="button"
          >
            <Text style={styles.actionEmoji}>📅</Text>
            <Text style={styles.actionLabel}>Mon planning</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => router.push('/(tabs)/interpretes/missions')}
            activeOpacity={0.8}
            accessibilityRole="button"
          >
            <View style={styles.actionIconWrap}>
              <Text style={styles.actionEmoji}>🎯</Text>
              {pending.length > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{pending.length}</Text>
                </View>
              )}
            </View>
            <Text style={styles.actionLabel}>Toutes les missions</Text>
          </TouchableOpacity>
        </View>

        {/* Requests list */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Demandes en attente</Text>
          <Text style={styles.sectionSub}>
            {pending.length} demande{pending.length !== 1 ? 's' : ''} dans votre zone
          </Text>

          {pending.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🎉</Text>
              <Text style={styles.emptyTitle}>Aucune demande en attente</Text>
              <Text style={styles.emptySub}>Revenez plus tard pour voir de nouvelles demandes.</Text>
            </View>
          ) : (
            pending.map((appt) => {
              const info = TYPE_INFO[appt.type];
              const isUrgent = appt.type === 'urgences';
              return (
                <TouchableOpacity
                  key={appt.id}
                  style={[
                    styles.demandeCard,
                    selected?.id === appt.id && styles.demandeCardSelected,
                    isUrgent && styles.demandeCardUrgent,
                  ]}
                  onPress={() => setSelected(appt)}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                >
                  <View style={styles.demandeLeft}>
                    {isUrgent && (
                      <View style={styles.urgentBadge}>
                        <Text style={styles.urgentText}>🚨 URGENT</Text>
                      </View>
                    )}
                    <Text style={styles.demandeBesoin}>
                      {info.icon} {info.label}
                    </Text>
                    <Text style={styles.demandePatient}>{appt.patientName}</Text>
                    <Text style={styles.demandeMeta}>🕐 {appt.time} — {appt.date}</Text>
                    <Text style={styles.demandeMeta} numberOfLines={1}>📍 {appt.location}</Text>
                  </View>
                  <View style={styles.demandeRight}>
                    <TouchableOpacity
                      style={styles.voirBtn}
                      onPress={() => router.push('/(tabs)/interpretes/missions')}
                      accessibilityRole="button"
                    >
                      <Text style={styles.voirBtnText}>Voir</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.accepterBtn}
                      onPress={() => handleAccept(appt.id)}
                      accessibilityRole="button"
                    >
                      <Text style={styles.accepterBtnText}>Accepter</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.interpretes },

  header: {
    backgroundColor: Colors.interpretes,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  headerTitle: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.white },
  headerSub: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.85)', marginTop: 2 },

  mapWrapper: { height: 240, position: 'relative' },
  mapFallback: {
    flex: 1,
    backgroundColor: '#C8E6E3',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  mapFallbackEmoji: { fontSize: 40 },
  mapFallbackText: { fontSize: FontSize.md, fontWeight: '700', color: Colors.interpretesDark },
  mapFallbackSub: { fontSize: FontSize.sm, color: Colors.textSecondary },
  mapLegend: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: Radius.md,
    padding: Spacing.sm,
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: FontSize.xs, color: Colors.textPrimary },

  callout: {
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    padding: Spacing.md,
    minWidth: 160,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    gap: 4,
  },
  calloutUrgent: {
    backgroundColor: '#FEE2E2',
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  calloutUrgentText: { fontSize: FontSize.xs, fontWeight: '700', color: Colors.error },
  calloutBesoin: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
  calloutMeta: { fontSize: FontSize.xs, color: Colors.textSecondary },

  scroll: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { padding: Spacing.lg, paddingBottom: Spacing.xxl, gap: Spacing.md },

  selectedCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    borderWidth: 2,
    borderColor: Colors.interpretes,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  selectedLeft: { flex: 1, gap: 3 },
  selectedBesoin: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
  selectedPatient: { fontSize: FontSize.sm, color: Colors.textSecondary },
  selectedMeta: { fontSize: FontSize.sm, color: Colors.textSecondary },
  selectedActions: { flexShrink: 0 },
  acceptBtn: {
    backgroundColor: Colors.interpretes,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  acceptBtnText: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.white },

  actionRow: { flexDirection: 'row', gap: Spacing.sm },
  actionBtn: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    padding: Spacing.md,
    alignItems: 'center',
    gap: Spacing.xs,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  actionIconWrap: { position: 'relative', alignItems: 'center' },
  actionEmoji: { fontSize: 26 },
  badge: {
    position: 'absolute',
    top: -6,
    right: -10,
    backgroundColor: Colors.error,
    borderRadius: Radius.full,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: { fontSize: 10, fontWeight: '800', color: Colors.white },
  actionLabel: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.interpretes,
    textAlign: 'center',
  },

  section: { gap: Spacing.sm },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary },
  sectionSub: { fontSize: FontSize.sm, color: Colors.textSecondary },

  emptyState: { alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.xl },
  emptyIcon: { fontSize: 44 },
  emptyTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
  emptySub: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center' },

  demandeCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    borderWidth: 2,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  demandeCardSelected: { borderColor: Colors.interpretes },
  demandeCardUrgent: { borderColor: Colors.error + '60' },
  demandeLeft: { flex: 1, gap: 3 },
  urgentBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.full,
    marginBottom: 2,
  },
  urgentText: { fontSize: FontSize.xs, fontWeight: '700', color: Colors.error },
  demandeBesoin: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
  demandePatient: { fontSize: FontSize.sm, color: Colors.textSecondary },
  demandeMeta: { fontSize: FontSize.xs, color: Colors.textSecondary },
  demandeRight: { flexShrink: 0, gap: Spacing.xs },
  voirBtn: {
    borderWidth: 2,
    borderColor: Colors.interpretes,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    alignItems: 'center',
  },
  voirBtnText: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.interpretes },
  accepterBtn: {
    backgroundColor: Colors.interpretes,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    alignItems: 'center',
  },
  accepterBtnText: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.white },
});
