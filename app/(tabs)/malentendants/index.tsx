import { router } from 'expo-router';
import * as Location from 'expo-location';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { Colors, FontSize, Radius, Spacing } from '@/constants/theme';
import { INTERPRETES_NICE, NICE_CENTER, type Interprete } from '@/data/mockData';
import {
  CATEGORY_CONFIG,
  type HealthCategory,
  type HealthProfessional,
} from '@/data/healthProfessionals';
import { useHealthProfessionals } from '@/hooks/useHealthProfessionals';

let MapView: any, Marker: any;
if (Platform.OS !== 'web') {
  const maps = require('react-native-maps');
  MapView = maps.default;
  Marker = maps.Marker;
}

/* ─── Filter config (interprète + 4 catégories santé) ───────── */

type FilterId = 'interprete' | HealthCategory;

const FILTER_CONFIG: { id: FilterId; label: string; emoji: string; color: string }[] = [
  { id: 'interprete', label: 'Interprètes', emoji: '👐', color: Colors.primary },
  { id: 'hospital',   label: 'Hôpitaux',    emoji: '🏥', color: '#DC2626' },
  { id: 'pharmacy',   label: 'Pharmacies',  emoji: '💊', color: '#16A34A' },
  { id: 'doctor',     label: 'Médecins',    emoji: '🩺', color: '#2563EB' },
  { id: 'specialist', label: 'Spécialistes', emoji: '👨‍⚕️', color: '#EA580C' },
];

/* ─── Selected-item union ───────────────────────────────────── */

type SelectedItem =
  | { type: 'interprete'; data: Interprete }
  | { type: 'health'; data: HealthProfessional };

/* ─── Helpers ───────────────────────────────────────────────── */

const STATUS_COLOR: Record<Interprete['status'], string> = {
  available: Colors.primary,
  'en-route': Colors.warning,
  busy: Colors.error,
};

const STATUS_LABEL: Record<Interprete['status'], string> = {
  available: '● Disponible',
  'en-route': '● En déplacement',
  busy: '● Occupé',
};

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
}

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

/* ─── Clustering (interprètes seulement) ────────────────────── */

type Cluster = {
  id: string;
  latitude: number;
  longitude: number;
  interpretes: Interprete[];
};

function computeClusters(interpretes: Interprete[], latDelta: number): Cluster[] {
  const radius = latDelta * 0.28;
  const clusters: Cluster[] = [];
  const assigned = new Set<string>();

  for (const interp of interpretes) {
    if (assigned.has(interp.id)) continue;
    const group: Interprete[] = [interp];
    assigned.add(interp.id);

    for (const other of interpretes) {
      if (assigned.has(other.id)) continue;
      if (
        Math.hypot(other.latitude - interp.latitude, other.longitude - interp.longitude) < radius
      ) {
        group.push(other);
        assigned.add(other.id);
      }
    }

    clusters.push({
      id: interp.id,
      latitude: group.reduce((s, i) => s + i.latitude, 0) / group.length,
      longitude: group.reduce((s, i) => s + i.longitude, 0) / group.length,
      interpretes: group,
    });
  }
  return clusters;
}

/* ─── Pulsing user dot ──────────────────────────────────────── */

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

/* ─── Interpreter marker ────────────────────────────────────── */

function InterpreteMarkerView({ interp }: { interp: Interprete }) {
  const color = STATUS_COLOR[interp.status];
  return (
    <View style={[styles.markerOuter, { borderColor: color }]}>
      <View style={[styles.markerInner, { backgroundColor: color }]}>
        <Text style={styles.markerInitials}>{getInitials(interp.name)}</Text>
      </View>
    </View>
  );
}

/* ─── Cluster marker ────────────────────────────────────────── */

function ClusterMarkerView({ count }: { count: number }) {
  return (
    <View style={styles.cluster}>
      <Text style={styles.clusterText}>{count}</Text>
    </View>
  );
}

/* ─── Health professional marker ────────────────────────────── */

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

/* ─── Filter pill ───────────────────────────────────────────── */

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

/* ─── Detail bottom sheet ───────────────────────────────────── */

const SHEET_HEIGHT = 340;

function DetailSheet({
  item,
  distanceKm,
  onClose,
}: {
  item: SelectedItem;
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

  const isInterp = item.type === 'interprete';
  const interp = isInterp ? (item.data as Interprete) : null;
  const prof = !isInterp ? (item.data as HealthProfessional) : null;

  const accentColor = isInterp
    ? STATUS_COLOR[interp!.status]
    : CATEGORY_CONFIG[prof!.category].color;

  const avatarContent = isInterp
    ? getInitials(interp!.name)
    : CATEGORY_CONFIG[prof!.category].emoji;

  const dist =
    distanceKm !== null
      ? `${distanceKm.toFixed(1)} km`
      : isInterp
      ? interp!.distance
      : null;

  return (
    <>
      <TouchableWithoutFeedback onPress={close}>
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]} />
      </TouchableWithoutFeedback>

      <Animated.View style={[styles.sheet, { transform: [{ translateY: slideY }] }]}>
        <View style={styles.sheetHandle} />

        <View style={styles.sheetBody}>
          {/* Header row */}
          <View style={styles.sheetHeader}>
            <View style={[styles.sheetAvatar, { backgroundColor: accentColor + '20', borderColor: accentColor }]}>
              <Text style={[styles.sheetAvatarContent, { color: accentColor }]}>
                {avatarContent}
              </Text>
            </View>
            <View style={styles.sheetNameBlock}>
              <Text style={styles.sheetName} numberOfLines={2}>
                {isInterp ? interp!.name : prof!.name}
              </Text>
              <Text style={styles.sheetSubtitle}>
                {isInterp ? interp!.specialite : CATEGORY_CONFIG[prof!.category].label}
              </Text>
            </View>
            <TouchableOpacity onPress={close} style={styles.closeBtn} accessibilityLabel="Fermer">
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          {isInterp ? (
            /* Interpreter badges */
            <View style={styles.badgesRow}>
              <View style={[styles.statusBadge, { backgroundColor: accentColor + '18' }]}>
                <Text style={[styles.statusBadgeText, { color: accentColor }]}>
                  {STATUS_LABEL[interp!.status]}
                </Text>
              </View>
              {dist && (
                <View style={styles.infoBadge}>
                  <Text style={styles.infoBadgeText}>📍 {dist}</Text>
                </View>
              )}
              <View style={styles.infoBadge}>
                <Text style={styles.infoBadgeText}>⭐ {interp!.note}</Text>
              </View>
            </View>
          ) : (
            /* Health professional info */
            <View style={styles.healthInfo}>
              <View style={styles.healthInfoRow}>
                <Text style={styles.healthInfoIcon}>📍</Text>
                <Text style={styles.healthInfoText}>{prof!.address}</Text>
              </View>
              <View style={styles.healthInfoRow}>
                <Text style={styles.healthInfoIcon}>📞</Text>
                <Text style={styles.healthInfoText}>{prof!.phone}</Text>
              </View>
              <View style={styles.healthInfoRow}>
                <Text style={styles.healthInfoIcon}>🕐</Text>
                <Text style={styles.healthInfoText}>{prof!.hours}</Text>
              </View>
              {dist && (
                <View style={styles.healthInfoRow}>
                  <Text style={styles.healthInfoIcon}>📏</Text>
                  <Text style={[styles.healthInfoText, { color: accentColor, fontWeight: '600' }]}>
                    {dist} de votre position
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* RDV button */}
          <TouchableOpacity
            style={[
              styles.rdvBtn,
              { backgroundColor: accentColor },
              isInterp && !interp!.available && styles.rdvBtnDisabled,
            ]}
            onPress={() => {
              if (!isInterp || interp!.available) {
                router.push('/(tabs)/malentendants/rendez-vous');
              }
            }}
            disabled={isInterp && !interp!.available}
            accessibilityRole="button"
          >
            <Text style={styles.rdvBtnText}>
              {isInterp && !interp!.available
                ? 'Non disponible actuellement'
                : '📅  Prendre rendez-vous'}
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </>
  );
}

/* ─── Main screen ───────────────────────────────────────────── */

export default function MalentendantsHome() {
  const { user } = useAuth();
  const prenom = user?.name?.split(' ')[0] ?? '';
  const { professionals, loading: profLoading } = useHealthProfessionals();

  useEffect(() => {
    console.log('[MalentendantsHome] MONTÉ');
    console.log('[MalentendantsHome] Marker importé:', typeof Marker);
  }, []);

  useEffect(() => {
    if (!profLoading && professionals.length > 0) {
      setMarkerTracking(true);
      const t = setTimeout(() => setMarkerTracking(false), 800);
      return () => clearTimeout(t);
    }
  }, [profLoading, professionals.length]);

  const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationError, setLocationError] = useState(false);
  const [mapRegion, setMapRegion] = useState(NICE_CENTER);
  const [selectedItem, setSelectedItem] = useState<SelectedItem | null>(null);
  const [activeFilters, setActiveFilters] = useState<Set<FilterId>>(
    () => new Set(['interprete', 'hospital', 'pharmacy', 'doctor', 'specialist'] as FilterId[]),
  );
  /* tracksViewChanges fix : démarre à true pour laisser les vues enfants se peindre,
     passe à false 800 ms après le chargement pour économiser les re-renders */
  const [markerTracking, setMarkerTracking] = useState(true);
  const mapRef = useRef<any>(null);

  /* Geolocation */
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

  const toggleFilter = (id: FilterId) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  /* Derived data */
  const visibleInterpreters = activeFilters.has('interprete') ? INTERPRETES_NICE : [];
  const clusters = computeClusters(visibleInterpreters, mapRegion.latitudeDelta);

  const visibleHealth = professionals.filter(
    (h) => activeFilters.has(h.category) && !isNaN(h.latitude) && !isNaN(h.longitude),
  );

  console.log(
    `[Carte] professionals=${professionals.length}` +
    ` visibleHealth=${visibleHealth.length}` +
    ` loading=${profLoading}` +
    ` markerTracking=${markerTracking}`,
  );
  if (visibleHealth.length > 0) {
    const sample = visibleHealth.slice(0, 3);
    console.log('[Carte] Coords échantillon:', sample.map(p =>
      `[${p.id}] lat=${p.latitude} lng=${p.longitude} cat=${p.category}`
    ));
  }

  const distanceKm =
    selectedItem && userCoords
      ? haversineKm(
          userCoords.latitude,
          userCoords.longitude,
          selectedItem.data.latitude,
          selectedItem.data.longitude,
        )
      : null;

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Bonjour {prenom} 🤟</Text>
        <Text style={styles.headerSub}>Carte de Nice — professionnels & interprètes LSF</Text>
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
            onRegionChangeComplete={(r: typeof NICE_CENTER) => setMapRegion(r)}
          >
            {/* User location dot */}
            {userCoords && (
              <Marker
                coordinate={userCoords}
                anchor={{ x: 0.5, y: 0.5 }}
                tracksViewChanges={false}
              >
                <UserLocationDot />
              </Marker>
            )}

            {/* Health professionals */}
            {visibleHealth.map((prof) => (
              <Marker
                key={prof.id}
                coordinate={{ latitude: prof.latitude, longitude: prof.longitude }}
                onPress={() => setSelectedItem({ type: 'health', data: prof })}
                tracksViewChanges={markerTracking}
                anchor={{ x: 0.5, y: 0.5 }}
              >
                <HealthMarkerView category={prof.category} />
              </Marker>
            ))}

            {/* Interpreter clusters / individual markers */}
            {clusters.map((cluster) =>
              cluster.interpretes.length === 1 ? (
                <Marker
                  key={cluster.id}
                  coordinate={{ latitude: cluster.latitude, longitude: cluster.longitude }}
                  onPress={() =>
                    setSelectedItem({ type: 'interprete', data: cluster.interpretes[0] })
                  }
                  tracksViewChanges={false}
                  anchor={{ x: 0.5, y: 0.5 }}
                >
                  <InterpreteMarkerView interp={cluster.interpretes[0]} />
                </Marker>
              ) : (
                <Marker
                  key={cluster.id}
                  coordinate={{ latitude: cluster.latitude, longitude: cluster.longitude }}
                  onPress={() => {
                    mapRef.current?.animateToRegion(
                      {
                        latitude: cluster.latitude,
                        longitude: cluster.longitude,
                        latitudeDelta: mapRegion.latitudeDelta * 0.4,
                        longitudeDelta: mapRegion.longitudeDelta * 0.4,
                      },
                      400,
                    );
                  }}
                  tracksViewChanges={false}
                  anchor={{ x: 0.5, y: 0.5 }}
                >
                  <ClusterMarkerView count={cluster.interpretes.length} />
                </Marker>
              ),
            )}
          </MapView>
        ) : (
          <View style={styles.mapFallback}>
            <Text style={styles.mapFallbackEmoji}>🗺️</Text>
            <Text style={styles.mapFallbackText}>Carte disponible sur mobile</Text>
            <Text style={styles.mapFallbackSub}>
              {professionals.length} établissements · {INTERPRETES_NICE.length} interprètes
            </Text>
          </View>
        )}

        {/* Re-center button */}
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
        {/* CTA */}
        <TouchableOpacity
          style={styles.rdvMainBtn}
          onPress={() => router.push('/(tabs)/malentendants/rendez-vous')}
          activeOpacity={0.85}
          accessibilityRole="button"
        >
          <Text style={styles.rdvMainBtnText}>📅  Prendre un rendez-vous</Text>
        </TouchableOpacity>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>⚡</Text>
            <Text style={styles.statValue}>{'< 2h'}</Text>
            <Text style={styles.statLabel}>Délai moyen</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>✅</Text>
            <Text style={styles.statValue}>
              {INTERPRETES_NICE.filter((i) => i.available).length}
            </Text>
            <Text style={styles.statLabel}>Interprètes dispo.</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>🏥</Text>
            <Text style={styles.statValue}>
              {professionals.filter((h) => h.category === 'hospital').length}
            </Text>
            <Text style={styles.statLabel}>Hôpitaux</Text>
          </View>
        </View>

        {/* Interpreter list */}
        {activeFilters.has('interprete') && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>👐 Interprètes LSF</Text>
            {INTERPRETES_NICE.map((interp) => {
              const color = STATUS_COLOR[interp.status];
              const dist = userCoords
                ? `${haversineKm(
                    userCoords.latitude,
                    userCoords.longitude,
                    interp.latitude,
                    interp.longitude,
                  ).toFixed(1)} km`
                : interp.distance;
              return (
                <TouchableOpacity
                  key={interp.id}
                  style={styles.listCard}
                  onPress={() => setSelectedItem({ type: 'interprete', data: interp })}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                >
                  <View
                    style={[
                      styles.listAvatar,
                      { backgroundColor: color + '18', borderColor: color },
                    ]}
                  >
                    <Text style={[styles.listAvatarText, { color }]}>
                      {getInitials(interp.name)}
                    </Text>
                  </View>
                  <View style={styles.listInfo}>
                    <Text style={styles.listName}>{interp.name}</Text>
                    <Text style={styles.listSub}>{interp.specialite}</Text>
                    <Text style={styles.listMeta}>📍 {dist} · ⭐ {interp.note}</Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: color + '18' }]}>
                    <Text style={[styles.badgeText, { color }]}>
                      {interp.status === 'available'
                        ? 'Dispo.'
                        : interp.status === 'en-route'
                        ? 'Route'
                        : 'Occupé'}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Health professionals list — grouped by visible category */}
        {profLoading && (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={Colors.primary} />
            <Text style={styles.loadingText}>Chargement des professionnels…</Text>
          </View>
        )}
        {(['hospital', 'pharmacy', 'doctor', 'specialist'] as HealthCategory[])
          .filter((cat) => activeFilters.has(cat))
          .map((cat) => {
            const cfg = CATEGORY_CONFIG[cat];
            const items = professionals.filter((h) => h.category === cat);
            return (
              <View key={cat} style={styles.section}>
                <Text style={styles.sectionTitle}>
                  {cfg.emoji} {cfg.label}s
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
                      onPress={() => setSelectedItem({ type: 'health', data: prof })}
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

      {/* Bottom sheet */}
      {selectedItem && (
        <DetailSheet
          key={selectedItem.data.id}
          item={selectedItem}
          distanceKm={distanceKm}
          onClose={() => setSelectedItem(null)}
        />
      )}
    </SafeAreaView>
  );
}

/* ─── Styles ─────────────────────────────────────────────────── */
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.primary },

  /* Header */
  header: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.sm,
  },
  headerTitle: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.white },
  headerSub: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  locationError: { fontSize: FontSize.xs, color: 'rgba(255,220,100,0.9)', marginTop: 4 },

  /* Filter bar */
  filterBar: {
    backgroundColor: Colors.primary,
    flexGrow: 0,
  },
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

  /* Map */
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

  /* User dot */
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

  /* Interpreter marker */
  markerOuter: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 3,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  markerInner: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerInitials: { fontSize: FontSize.xs, fontWeight: '800', color: Colors.white },

  /* Cluster */
  cluster: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: Colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  clusterText: { fontSize: FontSize.md, fontWeight: '800', color: Colors.white },

  /* Health marker */
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

  /* Re-center button */
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

  /* Scroll list */
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
  listAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    flexShrink: 0,
  },
  listAvatarText: { fontSize: FontSize.sm, fontWeight: '800' },
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

  /* Bottom sheet */
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
  sheetName: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary, lineHeight: 22 },
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

  /* Interpreter badges in sheet */
  badgesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  statusBadge: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: Radius.full },
  statusBadgeText: { fontSize: FontSize.sm, fontWeight: '700' },
  infoBadge: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
  },
  infoBadgeText: { fontSize: FontSize.sm, color: Colors.primaryDark, fontWeight: '600' },

  /* Health professional info in sheet */
  healthInfo: { gap: 6 },
  healthInfoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  healthInfoIcon: { fontSize: 14, width: 20, textAlign: 'center', marginTop: 1 },
  healthInfoText: { flex: 1, fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 20 },

  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    justifyContent: 'center',
  },
  loadingText: { fontSize: FontSize.sm, color: Colors.textSecondary },

  /* RDV button in sheet */
  rdvBtn: {
    borderRadius: Radius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  rdvBtnDisabled: {
    backgroundColor: Colors.textSecondary,
    shadowOpacity: 0,
    elevation: 0,
    opacity: 0.6,
  },
  rdvBtnText: { fontSize: FontSize.md, fontWeight: '700', color: Colors.white },
});
