import { router } from 'expo-router';
import * as Location from 'expo-location';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { Colors, FontSize, Radius, Spacing } from '@/constants/theme';
import {
  CATEGORY_CONFIG,
  type HealthCategory,
  type HealthProfessional,
} from '@/data/healthProfessionals';
import { useHealthProfessionals } from '@/hooks/useHealthProfessionals';
import { usePatientAppointments } from '@/hooks/useAppointments';

let MapView: any, Marker: any;
if (Platform.OS !== 'web') {
  const maps = require('react-native-maps');
  MapView = maps.default;
  Marker = maps.Marker;
}

const NICE_CENTER = {
  latitude: 43.7102,
  longitude: 7.262,
  latitudeDelta: 0.07,
  longitudeDelta: 0.07,
};

/* ─── Filter config ──────────────────────────────────────── */

const FILTER_CONFIG: { id: HealthCategory; label: string; emoji: string; color: string }[] = [
  { id: 'hospital',   label: 'Hôpitaux',     emoji: '🏥', color: '#DC2626' },
  { id: 'pharmacy',   label: 'Pharmacies',   emoji: '💊', color: '#16A34A' },
  { id: 'doctor',     label: 'Médecins',     emoji: '🩺', color: '#2563EB' },
  { id: 'specialist', label: 'Spécialistes', emoji: '👨‍⚕️', color: '#EA580C' },
];

const SECTION_LABELS: Record<HealthCategory, string> = {
  hospital:   'Hôpitaux & Urgences',
  pharmacy:   'Pharmacies',
  doctor:     'Médecins généralistes',
  specialist: 'Spécialistes',
};

/* ─── Helpers ────────────────────────────────────────────── */

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
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

/* ─── Pulsing user dot ───────────────────────────────────── */

function UserLocationDot() {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 600, useNativeDriver: true }),
      ]),
    ).start();
  }, [pulse]);

  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 2.4] });
  const opacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] });

  return (
    <View style={styles.userDotWrapper}>
      <Animated.View style={[styles.userDotRing, { transform: [{ scale }], opacity }]} />
      <View style={styles.userDot} />
    </View>
  );
}

/* ─── Health professional marker ─────────────────────────── */

function HealthMarkerView({ category }: { category: HealthCategory }) {
  const cfg = CATEGORY_CONFIG[category];
  return (
    <View style={[styles.healthMarkerOuter, { borderColor: cfg.color }]}>
      <View style={[styles.healthMarkerInner, { backgroundColor: cfg.color }]}>
        <Text style={styles.healthMarkerEmoji}>{cfg.emoji}</Text>
      </View>
    </View>
  );
}

/* ─── Filter pill ────────────────────────────────────────── */

function FilterPill({
  label,
  emoji,
  color,
  active,
  onPress,
}: {
  label: string;
  emoji: string;
  color: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.filterPill,
        { borderColor: color },
        active ? { backgroundColor: color } : { backgroundColor: Colors.white },
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
    >
      <Text style={styles.filterPillEmoji}>{emoji}</Text>
      <Text style={[styles.filterPillText, { color: active ? Colors.white : color }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

/* ─── Detail bottom sheet ────────────────────────────────── */

const SHEET_HEIGHT = 300;

function DetailSheet({
  item,
  distanceKm,
  onClose,
}: {
  item: HealthProfessional;
  distanceKm: number | null;
  onClose: () => void;
}) {
  const slideY = useRef(new Animated.Value(SHEET_HEIGHT)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideY, { toValue: 0, useNativeDriver: true, bounciness: 4 }),
      Animated.timing(backdropOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
  }, []);

  const close = () => {
    Animated.parallel([
      Animated.timing(slideY, { toValue: SHEET_HEIGHT, duration: 220, useNativeDriver: true }),
      Animated.timing(backdropOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(onClose);
  };

  const cfg = CATEGORY_CONFIG[item.category];
  const dist = distanceKm !== null ? `${distanceKm.toFixed(1)} km` : null;

  return (
    <>
      <TouchableWithoutFeedback onPress={close}>
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]} />
      </TouchableWithoutFeedback>

      <Animated.View style={[styles.sheet, { transform: [{ translateY: slideY }] }]}>
        <View style={styles.sheetHandle} />

        <View style={styles.sheetBody}>
          <View style={styles.sheetHeader}>
            <View style={[styles.sheetAvatar, { backgroundColor: cfg.color + '20', borderColor: cfg.color }]}>
              <Text style={[styles.sheetAvatarContent, { color: cfg.color }]}>{cfg.emoji}</Text>
            </View>
            <View style={styles.sheetNameBlock}>
              <Text style={styles.sheetName} numberOfLines={2}>{item.name}</Text>
              <Text style={styles.sheetSubtitle}>{cfg.label}</Text>
            </View>
            <TouchableOpacity onPress={close} style={styles.closeBtn} accessibilityLabel="Fermer">
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.healthInfo}>
            <View style={styles.healthInfoRow}>
              <Text style={styles.healthInfoIcon}>📍</Text>
              <Text style={styles.healthInfoText}>{item.address}</Text>
            </View>
            <View style={styles.healthInfoRow}>
              <Text style={styles.healthInfoIcon}>📞</Text>
              <Text style={styles.healthInfoText}>{item.phone}</Text>
            </View>
            <View style={styles.healthInfoRow}>
              <Text style={styles.healthInfoIcon}>🕐</Text>
              <Text style={styles.healthInfoText}>{item.hours}</Text>
            </View>
            {dist && (
              <View style={styles.healthInfoRow}>
                <Text style={styles.healthInfoIcon}>📏</Text>
                <Text style={[styles.healthInfoText, { color: cfg.color, fontWeight: '600' }]}>
                  {dist} de votre position
                </Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={[styles.rdvBtn, { backgroundColor: cfg.color }]}
            onPress={() => router.push('/(tabs)/malentendants/rendez-vous')}
            accessibilityRole="button"
          >
            <Text style={styles.rdvBtnText}>📅  Prendre rendez-vous</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </>
  );
}

/* ─── Main screen ────────────────────────────────────────── */

export default function MalentendantsHome() {
  const { user } = useAuth();
  const prenom = user?.name?.split(' ')[0] ?? '';
  const { professionals, loading: profLoading } = useHealthProfessionals();
  const { appointments: myRdv } = usePatientAppointments();
  const pendingRdvCount = myRdv.filter((a) => a.status === 'pending').length;

  const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationError, setLocationError] = useState(false);
  const [selectedItem, setSelectedItem] = useState<HealthProfessional | null>(null);
  const [activeFilters, setActiveFilters] = useState<Set<HealthCategory>>(
    () => new Set<HealthCategory>(['hospital', 'pharmacy', 'doctor', 'specialist']),
  );
  const [markerTracking, setMarkerTracking] = useState(true);
  const mapRef = useRef<any>(null);

  useEffect(() => {
    if (!profLoading && professionals.length > 0) {
      setMarkerTracking(true);
      const t = setTimeout(() => setMarkerTracking(false), 800);
      return () => clearTimeout(t);
    }
  }, [profLoading, professionals.length]);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { setLocationError(true); return; }
      try {
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        const coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
        setUserCoords(coords);
        mapRef.current?.animateToRegion(
          { ...coords, latitudeDelta: 0.04, longitudeDelta: 0.04 },
          800,
        );
      } catch {
        setLocationError(true);
      }
    })();
  }, []);

  const toggleFilter = (id: HealthCategory) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const visibleHealth = professionals.filter(
    (h) => activeFilters.has(h.category) && !isNaN(h.latitude) && !isNaN(h.longitude),
  );

  const distanceKm =
    selectedItem && userCoords
      ? haversineKm(
          userCoords.latitude,
          userCoords.longitude,
          selectedItem.latitude,
          selectedItem.longitude,
        )
      : null;

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Bonjour {prenom} 🤟</Text>
        <Text style={styles.headerSub}>Carte de Nice — professionnels de santé</Text>
        {locationError && (
          <Text style={styles.locationError}>⚠ Localisation non disponible</Text>
        )}
      </View>

      {/* Filter bar */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterBar}
        contentContainerStyle={styles.filterBarContent}
      >
        {FILTER_CONFIG.map((f) => (
          <FilterPill
            key={f.id}
            label={f.label}
            emoji={f.emoji}
            color={f.color}
            active={activeFilters.has(f.id)}
            onPress={() => toggleFilter(f.id)}
          />
        ))}
      </ScrollView>

      {/* Map */}
      <View style={styles.mapWrapper}>
        {Platform.OS !== 'web' ? (
          <MapView
            ref={mapRef}
            style={StyleSheet.absoluteFillObject}
            initialRegion={NICE_CENTER}
            showsMyLocationButton={false}
          >
            {userCoords && (
              <Marker
                coordinate={userCoords}
                anchor={{ x: 0.5, y: 0.5 }}
                tracksViewChanges={false}
              >
                <UserLocationDot />
              </Marker>
            )}

            {visibleHealth.map((prof) => (
              <Marker
                key={prof.id}
                coordinate={{ latitude: prof.latitude, longitude: prof.longitude }}
                onPress={() => setSelectedItem(prof)}
                tracksViewChanges={markerTracking}
                anchor={{ x: 0.5, y: 0.5 }}
              >
                <HealthMarkerView category={prof.category} />
              </Marker>
            ))}
          </MapView>
        ) : (
          <View style={styles.mapFallback}>
            <Text style={styles.mapFallbackEmoji}>🗺️</Text>
            <Text style={styles.mapFallbackText}>Carte disponible sur mobile</Text>
            <Text style={styles.mapFallbackSub}>{professionals.length} établissements</Text>
          </View>
        )}

        {userCoords && (
          <TouchableOpacity
            style={styles.centerBtn}
            onPress={() =>
              mapRef.current?.animateToRegion(
                { ...userCoords, latitudeDelta: 0.04, longitudeDelta: 0.04 },
                600,
              )
            }
            accessibilityLabel="Recentrer sur ma position"
          >
            <Text style={styles.centerBtnText}>◎</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* List */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity
          style={styles.rdvMainBtn}
          onPress={() => router.push('/(tabs)/malentendants/rendez-vous')}
          activeOpacity={0.85}
          accessibilityRole="button"
        >
          <Text style={styles.rdvMainBtnText}>📅  Prendre un rendez-vous</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.rdvSecondBtn}
          onPress={() => router.push('/(tabs)/malentendants/mes-rdv')}
          activeOpacity={0.85}
          accessibilityRole="button"
        >
          <Text style={styles.rdvSecondBtnText}>📋  Mes rendez-vous</Text>
          {pendingRdvCount > 0 && (
            <View style={styles.rdvBadge}>
              <Text style={styles.rdvBadgeText}>{pendingRdvCount}</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>⚡</Text>
            <Text style={styles.statValue}>{'< 2h'}</Text>
            <Text style={styles.statLabel}>Délai moyen</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>🏥</Text>
            <Text style={styles.statValue}>
              {professionals.filter((h) => h.category === 'hospital').length}
            </Text>
            <Text style={styles.statLabel}>Hôpitaux</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>💊</Text>
            <Text style={styles.statValue}>
              {professionals.filter((h) => h.category === 'pharmacy').length}
            </Text>
            <Text style={styles.statLabel}>Pharmacies</Text>
          </View>
        </View>

        {/* Loading */}
        {profLoading && (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={Colors.primary} />
            <Text style={styles.loadingText}>Chargement des professionnels…</Text>
          </View>
        )}

        {/* Empty state */}
        {!profLoading && professionals.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🏥</Text>
            <Text style={styles.emptyTitle}>Aucun professionnel disponible</Text>
            <Text style={styles.emptySub}>
              Les professionnels de santé de votre zone apparaîtront ici.
            </Text>
          </View>
        )}

        {/* Health professionals list grouped by category */}
        {(['hospital', 'pharmacy', 'doctor', 'specialist'] as HealthCategory[])
          .filter((cat) => activeFilters.has(cat))
          .map((cat) => {
            const cfg = CATEGORY_CONFIG[cat];
            const items = professionals.filter((h) => h.category === cat);
            if (items.length === 0) return null;
            return (
              <View key={cat} style={styles.section}>
                <Text style={styles.sectionTitle}>
                  {cfg.emoji} {SECTION_LABELS[cat]}
                </Text>
                {items.map((prof) => {
                  const dist = userCoords
                    ? `${haversineKm(
                        userCoords.latitude,
                        userCoords.longitude,
                        prof.latitude,
                        prof.longitude,
                      ).toFixed(1)} km`
                    : '';
                  return (
                    <TouchableOpacity
                      key={prof.id}
                      style={styles.listCard}
                      onPress={() => setSelectedItem(prof)}
                      activeOpacity={0.8}
                      accessibilityRole="button"
                    >
                      <View
                        style={[
                          styles.listAvatarSquare,
                          { backgroundColor: cfg.color + '18', borderColor: cfg.color },
                        ]}
                      >
                        <Text style={styles.listAvatarEmoji}>{cfg.emoji}</Text>
                      </View>
                      <View style={styles.listInfo}>
                        <Text style={styles.listName}>{prof.name}</Text>
                        <Text style={styles.listSub}>{prof.hours}</Text>
                        {dist !== '' && (
                          <Text style={styles.listMeta}>📍 {dist} · 📞 {prof.phone}</Text>
                        )}
                      </View>
                      <View style={[styles.badge, { backgroundColor: cfg.color + '18' }]}>
                        <Text style={[styles.badgeText, { color: cfg.color }]}>Voir</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            );
          })}
      </ScrollView>

      {selectedItem && (
        <DetailSheet
          key={selectedItem.id}
          item={selectedItem}
          distanceKm={distanceKm}
          onClose={() => setSelectedItem(null)}
        />
      )}
    </SafeAreaView>
  );
}

/* ─── Styles ─────────────────────────────────────────────── */
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.primary },

  header: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.sm,
  },
  headerTitle: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.white },
  headerSub: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  locationError: { fontSize: FontSize.xs, color: 'rgba(255,220,100,0.9)', marginTop: 4 },

  filterBar: { backgroundColor: Colors.primary, flexGrow: 0 },
  filterBarContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    gap: Spacing.sm,
    flexDirection: 'row',
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1.5,
  },
  filterPillEmoji: { fontSize: 14 },
  filterPillText: { fontSize: FontSize.xs, fontWeight: '700' },

  mapWrapper: { height: 240, position: 'relative' },
  mapFallback: {
    flex: 1,
    backgroundColor: '#C8E6E3',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  mapFallbackEmoji: { fontSize: 40 },
  mapFallbackText: { fontSize: FontSize.md, fontWeight: '700', color: Colors.primaryDark },
  mapFallbackSub: { fontSize: FontSize.sm, color: Colors.textSecondary },

  userDotWrapper: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
  userDotRing: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#3B82F6',
  },
  userDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#3B82F6',
    borderWidth: 2.5,
    borderColor: Colors.white,
  },

  healthMarkerOuter: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2.5,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  healthMarkerInner: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  healthMarkerEmoji: { fontSize: 15 },

  centerBtn: {
    position: 'absolute',
    bottom: Spacing.sm,
    right: Spacing.sm,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  centerBtnText: { fontSize: 20, color: Colors.primary },

  scroll: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { padding: Spacing.lg, paddingBottom: Spacing.xxl, gap: Spacing.md },

  rdvMainBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  rdvMainBtnText: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.white },

  rdvSecondBtn: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    borderWidth: 2,
    borderColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  rdvSecondBtnText: { fontSize: FontSize.md, fontWeight: '700', color: Colors.primary },
  rdvBadge: {
    backgroundColor: Colors.warning,
    borderRadius: Radius.full,
    minWidth: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  rdvBadgeText: { fontSize: 11, fontWeight: '800', color: Colors.white },

  statsRow: { flexDirection: 'row', gap: Spacing.sm },
  statCard: {
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
  statEmoji: { fontSize: 20 },
  statValue: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.primary },
  statLabel: { fontSize: FontSize.xs, color: Colors.textSecondary, textAlign: 'center' },

  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    justifyContent: 'center',
  },
  loadingText: { fontSize: FontSize.sm, color: Colors.textSecondary },

  emptyState: {
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.xxl,
  },
  emptyIcon: { fontSize: 44 },
  emptyTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
  emptySub: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: Spacing.lg,
  },

  section: { gap: Spacing.sm },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary },

  listCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  listAvatarSquare: {
    width: 46,
    height: 46,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    flexShrink: 0,
  },
  listAvatarEmoji: { fontSize: 22 },
  listInfo: { flex: 1, gap: 2 },
  listName: { fontSize: FontSize.md, fontWeight: '600', color: Colors.textPrimary },
  listSub: { fontSize: FontSize.sm, color: Colors.textSecondary },
  listMeta: { fontSize: FontSize.xs, color: Colors.textSecondary },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.full,
    flexShrink: 0,
  },
  badgeText: { fontSize: FontSize.xs, fontWeight: '700' },

  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
    zIndex: 10,
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SHEET_HEIGHT,
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    zIndex: 11,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 20,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 4,
  },
  sheetBody: { padding: Spacing.lg, gap: Spacing.md },

  sheetHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  sheetAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    flexShrink: 0,
  },
  sheetAvatarContent: { fontSize: FontSize.lg, fontWeight: '800' },
  sheetNameBlock: { flex: 1, gap: 2 },
  sheetName: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
    lineHeight: 22,
  },
  sheetSubtitle: { fontSize: FontSize.sm, color: Colors.textSecondary },

  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  closeBtnText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: '700' },

  healthInfo: { gap: 6 },
  healthInfoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  healthInfoIcon: { fontSize: 14, width: 20, textAlign: 'center', marginTop: 1 },
  healthInfoText: { flex: 1, fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 20 },

  rdvBtn: {
    borderRadius: Radius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  rdvBtnText: { fontSize: FontSize.md, fontWeight: '700', color: Colors.white },
});
