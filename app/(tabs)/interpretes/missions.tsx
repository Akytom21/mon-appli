import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { Colors, FontSize, Radius, Spacing } from '@/constants/theme';
import { useAppointments, type Appointment, type AppointmentType } from '@/hooks/useAppointments';

type Tab = 'disponibles' | 'missions' | 'historique';

const TYPE_INFO: Record<AppointmentType, { label: string; icon: string }> = {
  generaliste: { label: 'Médecin généraliste', icon: '🩺' },
  urgences: { label: 'Urgences', icon: '🚨' },
  specialiste: { label: 'Spécialiste', icon: '👨‍⚕️' },
  pharmacie: { label: 'Pharmacie', icon: '💊' },
};

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDate(dateStr: string): string {
  const [, m, d] = dateStr.split('-');
  const months = [
    'jan.', 'fév.', 'mars', 'avr.', 'mai', 'juin',
    'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.',
  ];
  return `${parseInt(d)} ${months[parseInt(m) - 1]}`;
}

export default function MissionsScreen() {
  const { pending, myMissions, history, loading, acceptMission, declineMission } =
    useAppointments();
  const [activeTab, setActiveTab] = useState<Tab>('disponibles');
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [accepting, setAccepting] = useState<string | null>(null);
  const acceptAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (Platform.OS === 'web') return;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const loc = await Location.getCurrentPositionAsync({});
      setUserCoords({ lat: loc.coords.latitude, lng: loc.coords.longitude });
    })();
  }, []);

  const handleAccept = (id: string) => {
    setAccepting(id);
    acceptAnim.setValue(0);
    Animated.sequence([
      Animated.timing(acceptAnim, { toValue: 1, duration: 280, useNativeDriver: true }),
      Animated.delay(750),
      Animated.timing(acceptAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start(() => {
      acceptMission(id);
      setAccepting(null);
    });
  };

  const getDistanceLabel = (coords: { lat: number; lng: number }): string => {
    if (!userCoords) return '';
    const km = haversineKm(userCoords.lat, userCoords.lng, coords.lat, coords.lng);
    return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
  };

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: 'disponibles', label: 'Disponibles', count: pending.length },
    { id: 'missions', label: 'Mes missions', count: myMissions.length },
    { id: 'historique', label: 'Historique', count: history.length },
  ];

  const currentList =
    activeTab === 'disponibles'
      ? pending
      : activeTab === 'missions'
      ? myMissions
      : history;

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Chargement des missions…</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Barre d'onglets */}
      <View style={styles.tabBar}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, isActive && styles.tabActive]}
              onPress={() => setActiveTab(tab.id)}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
            >
              <View style={styles.tabInner}>
                <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                  {tab.label}
                </Text>
                {tab.count > 0 && (
                  <View
                    style={[
                      styles.tabBadge,
                      isActive ? styles.tabBadgeActive : styles.tabBadgeInactive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.tabBadgeText,
                        isActive ? styles.tabBadgeTextActive : styles.tabBadgeTextInactive,
                      ]}
                    >
                      {tab.count}
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      <FlatList
        data={currentList}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <AppointmentCard
            appt={item}
            tab={activeTab}
            distance={getDistanceLabel(item.coordinates)}
            isAccepting={accepting === item.id}
            acceptAnim={acceptAnim}
            onAccept={() => handleAccept(item.id)}
            onDecline={() => declineMission(item.id)}
          />
        )}
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>
              {activeTab === 'disponibles' ? '🎉' : activeTab === 'missions' ? '📅' : '📋'}
            </Text>
            <Text style={styles.emptyTitle}>
              {activeTab === 'disponibles'
                ? 'Aucune demande disponible'
                : activeTab === 'missions'
                ? 'Aucune mission en cours'
                : 'Aucun historique'}
            </Text>
            <Text style={styles.emptySub}>
              {activeTab === 'disponibles'
                ? 'Revenez plus tard pour voir de nouvelles demandes.'
                : activeTab === 'missions'
                ? "Acceptez des demandes dans l'onglet Disponibles."
                : 'Vos missions passées apparaîtront ici.'}
            </Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

type CardProps = {
  appt: Appointment;
  tab: Tab;
  distance: string;
  isAccepting: boolean;
  acceptAnim: Animated.Value;
  onAccept: () => void;
  onDecline: () => void;
};

function AppointmentCard({
  appt,
  tab,
  distance,
  isAccepting,
  acceptAnim,
  onAccept,
  onDecline,
}: CardProps) {
  const info = TYPE_INFO[appt.type];
  const isUrgent = appt.type === 'urgences';

  return (
    <View style={[styles.card, isUrgent && styles.cardUrgent]}>
      {/* Overlay de confirmation d'acceptation */}
      {isAccepting && (
        <Animated.View style={[styles.acceptOverlay, { opacity: acceptAnim }]}>
          <Text style={styles.acceptOverlayText}>✓ Mission acceptée !</Text>
        </Animated.View>
      )}

      {/* En-tête : type + badge urgent + distance */}
      <View style={styles.cardHeader}>
        <View style={styles.typeRow}>
          <Text style={styles.typeIcon}>{info.icon}</Text>
          <Text style={[styles.typeLabel, isUrgent && styles.typeLabelUrgent]}>
            {info.label}
          </Text>
          {isUrgent && (
            <View style={styles.urgentBadge}>
              <Text style={styles.urgentText}>URGENT</Text>
            </View>
          )}
        </View>
        {!!distance && <Text style={styles.distanceLabel}>📍 {distance}</Text>}
      </View>

      {/* Patient */}
      <Text style={styles.patientName}>👤 {appt.patientName}</Text>

      {/* Date + heure */}
      <View style={styles.metaRow}>
        <Text style={styles.metaItem}>🗓 {formatDate(appt.date)}</Text>
        <Text style={styles.metaItem}>🕐 {appt.time}</Text>
      </View>

      {/* Lieu */}
      <View style={styles.locationBox}>
        <Text style={styles.locationName} numberOfLines={1}>
          {appt.location}
        </Text>
        <Text style={styles.locationAddress} numberOfLines={1}>
          {appt.address}
        </Text>
      </View>

      {/* Actions ou statut */}
      {tab === 'disponibles' ? (
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.declineBtn}
            onPress={onDecline}
            accessibilityRole="button"
          >
            <Text style={styles.declineBtnText}>✗  Refuser</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.acceptBtn}
            onPress={onAccept}
            accessibilityRole="button"
          >
            <Text style={styles.acceptBtnText}>✓  Accepter</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View
          style={[
            styles.statusChip,
            appt.status === 'accepted' ? styles.statusAccepted : styles.statusDeclined,
          ]}
        >
          <Text style={styles.statusChipText}>
            {appt.status === 'accepted' ? '✓ Acceptée' : '✗ Refusée'}
          </Text>
        </View>
      )}
    </View>
  );
}

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

  /* Tab bar */
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingHorizontal: Spacing.sm,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderBottomWidth: 2.5,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: Colors.primary },
  tabInner: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  tabText: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textSecondary },
  tabTextActive: { color: Colors.primary },
  tabBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  tabBadgeActive: { backgroundColor: Colors.primary },
  tabBadgeInactive: { backgroundColor: Colors.border },
  tabBadgeText: { fontSize: 10, fontWeight: '800' },
  tabBadgeTextActive: { color: Colors.white },
  tabBadgeTextInactive: { color: Colors.textSecondary },

  /* List */
  listContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
    gap: Spacing.md,
  },

  /* Empty state */
  emptyState: {
    paddingVertical: Spacing.xxl,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary },
  emptySub: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: Spacing.lg,
  },

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
    overflow: 'hidden',
  },
  cardUrgent: {
    borderColor: Colors.error + '80',
    borderWidth: 2,
  },

  /* Accept overlay */
  acceptOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.primary + 'EC',
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  acceptOverlayText: {
    fontSize: FontSize.xl,
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: 0.5,
  },

  /* Card content */
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    flex: 1,
    flexWrap: 'wrap',
  },
  typeIcon: { fontSize: 18 },
  typeLabel: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
  typeLabelUrgent: { color: Colors.error },
  urgentBadge: {
    backgroundColor: '#FEE2E2',
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  urgentText: { fontSize: FontSize.xs, fontWeight: '800', color: Colors.error, letterSpacing: 0.5 },
  distanceLabel: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: '500' },

  patientName: { fontSize: FontSize.md, fontWeight: '600', color: Colors.textPrimary },

  metaRow: { flexDirection: 'row', gap: Spacing.md },
  metaItem: { fontSize: FontSize.sm, color: Colors.textSecondary },

  locationBox: { gap: 2 },
  locationName: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textPrimary },
  locationAddress: { fontSize: FontSize.xs, color: Colors.textSecondary },

  /* Action buttons */
  actions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.xs },
  declineBtn: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.error,
  },
  declineBtnText: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.error },
  acceptBtn: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    alignItems: 'center',
    backgroundColor: Colors.primary,
  },
  acceptBtnText: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.white },

  /* Status chip */
  statusChip: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    marginTop: Spacing.xs,
  },
  statusAccepted: { backgroundColor: Colors.primaryLight },
  statusDeclined: { backgroundColor: '#FEE2E2' },
  statusChipText: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.textPrimary },
});
