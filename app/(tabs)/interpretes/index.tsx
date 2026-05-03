import { router } from 'expo-router';
import { useState } from 'react';
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
import { DEMANDES_NICE, NICE_CENTER, type DemandeRDV } from '@/data/mockData';
import { useAppointments } from '@/hooks/useAppointments';

let MapView: any, Marker: any, Callout: any;
if (Platform.OS !== 'web') {
  const maps = require('react-native-maps');
  MapView = maps.default;
  Marker = maps.Marker;
  Callout = maps.Callout;
}

export default function InterpretesHome() {
  const { user } = useAuth();
  const { pending } = useAppointments();
  const [selected, setSelected] = useState<DemandeRDV | null>(null);
  const prenom = user?.name?.split(' ')[0] ?? '';

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
            {DEMANDES_NICE.map((demande) => (
              <Marker
                key={demande.id}
                coordinate={{ latitude: demande.latitude, longitude: demande.longitude }}
                pinColor={demande.urgence ? '#EF4444' : '#2A9D8F'}
                onPress={() => setSelected(demande)}
              >
                <Callout tooltip>
                  <View style={styles.callout}>
                    {demande.urgence && (
                      <View style={styles.calloutUrgent}>
                        <Text style={styles.calloutUrgentText}>🚨 URGENT</Text>
                      </View>
                    )}
                    <Text style={styles.calloutBesoin}>{demande.besoin}</Text>
                    <Text style={styles.calloutMeta}>
                      🕐 {demande.heure} — {demande.date}
                    </Text>
                  </View>
                </Callout>
              </Marker>
            ))}
          </MapView>
        ) : (
          <View style={styles.mapFallback}>
            <Text style={styles.mapFallbackEmoji}>🗺️</Text>
            <Text style={styles.mapFallbackText}>Carte disponible sur mobile</Text>
            <Text style={styles.mapFallbackSub}>3 demandes en attente à Nice</Text>
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
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Selected request card */}
        {selected && (
          <View style={[styles.selectedCard, selected.urgence && { borderColor: Colors.error }]}>
            <View style={styles.selectedLeft}>
              {selected.urgence && (
                <View style={styles.urgentBadge}>
                  <Text style={styles.urgentText}>🚨 URGENT</Text>
                </View>
              )}
              <Text style={styles.selectedBesoin}>{selected.besoin}</Text>
              <Text style={styles.selectedMeta}>🕐 {selected.heure} — {selected.date}</Text>
            </View>
            <View style={styles.selectedActions}>
              <TouchableOpacity
                style={styles.acceptBtn}
                onPress={() => router.push('/(tabs)/interpretes/planning')}
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
          <Text style={styles.sectionSub}>{DEMANDES_NICE.length} demandes dans votre zone</Text>

          {DEMANDES_NICE.map((demande) => (
            <TouchableOpacity
              key={demande.id}
              style={[
                styles.demandeCard,
                selected?.id === demande.id && styles.demandeCardSelected,
                demande.urgence && styles.demandeCardUrgent,
              ]}
              onPress={() => setSelected(demande)}
              activeOpacity={0.8}
              accessibilityRole="button"
            >
              <View style={styles.demandeLeft}>
                {demande.urgence && (
                  <View style={styles.urgentBadge}>
                    <Text style={styles.urgentText}>🚨 URGENT</Text>
                  </View>
                )}
                <Text style={styles.demandeBesoin}>{demande.besoin}</Text>
                <Text style={styles.demandePatient}>{demande.patient}</Text>
                <Text style={styles.demandeMeta}>🕐 {demande.heure} — {demande.date}</Text>
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
                  onPress={() => router.push('/(tabs)/interpretes/planning')}
                  accessibilityRole="button"
                >
                  <Text style={styles.accepterBtnText}>Accepter</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
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
    minWidth: 150,
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
  actionLabel: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.interpretes, textAlign: 'center' },

  section: { gap: Spacing.sm },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary },
  sectionSub: { fontSize: FontSize.sm, color: Colors.textSecondary },

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
