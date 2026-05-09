import { router } from 'expo-router';
import * as Location from 'expo-location';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { Colors, FontSize, Radius, Spacing } from '@/constants/theme';
import {
  CATEGORY_CONFIG,
  type HealthCategory,
  type HealthProfessional,
} from '@/data/healthProfessionals';
import { useHealthProfessionals, useHealthProfessionalsSearch } from '@/hooks/useHealthProfessionals';
import { usePatientAppointments } from '@/hooks/useAppointments';
import { getDoctolibUrl } from '@/utils/doctolib';

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

const RADIUS_OPTIONS = [2, 5, 10, 20] as const;

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

function isOpenNow(hours: string): boolean {
  const now = new Date();
  const mins = now.getHours() * 60 + now.getMinutes();
  const m = hours.match(/(\d{1,2})[h:H](\d{2})\s*[-–]\s*(\d{1,2})[h:H](\d{2})/);
  if (!m) return true;
  const open  = parseInt(m[1]) * 60 + parseInt(m[2]);
  const close = parseInt(m[3]) * 60 + parseInt(m[4]);
  return mins >= open && mins < close;
}

/* ─── Pulsing user dot ───────────────────────────────────── */

const UserLocationDot = memo(function UserLocationDot() {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 600, useNativeDriver: true }),
      ]),
    ).start();
  }, [pulse]);

  const scale   = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 2.4] });
  const opacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] });

  return (
    <View style={styles.userDotWrapper}>
      <Animated.View style={[styles.userDotRing, { transform: [{ scale }], opacity }]} />
      <View style={styles.userDot} />
    </View>
  );
});

/* ─── Health professional marker ─────────────────────────── */

const HealthMarkerView = memo(function HealthMarkerView({
  category, showDoctolib,
}: {
  category: HealthCategory;
  showDoctolib?: boolean;
}) {
  const cfg = CATEGORY_CONFIG[category];
  return (
    <View style={styles.markerWrapper}>
      <View style={[styles.healthMarkerOuter, { borderColor: cfg.color }]}>
        <View style={[styles.healthMarkerInner, { backgroundColor: cfg.color }]}>
          <Text style={styles.healthMarkerEmoji}>{cfg.emoji}</Text>
        </View>
      </View>
      {showDoctolib && (
        <View style={styles.doctolibMarkerBadge}>
          <Text style={styles.doctolibMarkerText}>D</Text>
        </View>
      )}
    </View>
  );
});

/* ─── Filter pill ────────────────────────────────────────── */

const FilterPill = memo(function FilterPill({
  id, label, emoji, color, active, onToggle,
}: {
  id: HealthCategory; label: string; emoji: string;
  color: string; active: boolean; onToggle: (id: HealthCategory) => void;
}) {
  const handlePress = useCallback(() => onToggle(id), [onToggle, id]);
  return (
    <TouchableOpacity
      style={[
        styles.filterPill,
        { borderColor: color },
        active ? { backgroundColor: color } : { backgroundColor: Colors.white },
      ]}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
    >
      <Text style={styles.filterPillEmoji}>{emoji}</Text>
      <Text style={[styles.filterPillText, { color: active ? Colors.white : color }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
});

/* ─── Detail bottom sheet ────────────────────────────────── */

const SHEET_HEIGHT = 320;

function DetailSheet({
  item, distanceKm, onClose,
}: {
  item: HealthProfessional; distanceKm: number | null; onClose: () => void;
}) {
  const slideY         = useRef(new Animated.Value(SHEET_HEIGHT)).current;
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

  const cfg  = CATEGORY_CONFIG[item.category];
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

          <View style={styles.sheetActions}>
            <TouchableOpacity
              style={styles.doctolibSheetBtn}
              onPress={() => Linking.openURL(getDoctolibUrl(item.name, item.category, item.specialite))}
              accessibilityRole="button"
              accessibilityLabel="Prendre rendez-vous sur Doctolib"
            >
              <View style={styles.doctolibSheetLogo}>
                <Text style={styles.doctolibSheetLogoText}>D</Text>
              </View>
              <Text style={styles.doctolibSheetBtnText}>Doctolib 🔗</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.rdvBtn, { backgroundColor: cfg.color, flex: 1 }]}
              onPress={() => router.push('/(tabs)/malentendants/rendez-vous')}
              accessibilityRole="button"
            >
              <Text style={styles.rdvBtnText}>📅  Prendre RDV</Text>
            </TouchableOpacity>
          </View>
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
  const { professionals: allProfessionals } = useHealthProfessionalsSearch();
  const { appointments: myRdv } = usePatientAppointments();
  const pendingRdvCount = myRdv.filter((a) => a.status === 'pending').length;

  const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationError, setLocationError] = useState(false);
  const [selectedItem, setSelectedItem] = useState<HealthProfessional | null>(null);
  const [activeFilters, setActiveFilters] = useState<Set<HealthCategory>>(
    () => new Set<HealthCategory>(['hospital', 'pharmacy', 'doctor', 'specialist']),
  );
  const [markerTracking, setMarkerTracking] = useState(true);

  // Advanced filters
  const [searchRadius, setSearchRadius] = useState<typeof RADIUS_OPTIONS[number]>(10);
  const [availableNow, setAvailableNow] = useState(false);
  const [sortBy, setSortBy] = useState<'distance' | 'type'>('distance');

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
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
        setUserCoords(coords);
        mapRef.current?.animateToRegion({ ...coords, latitudeDelta: 0.04, longitudeDelta: 0.04 }, 800);
      } catch {
        setLocationError(true);
      }
    })();
  }, []);

  const toggleFilter = useCallback((id: HealthCategory) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  // Marqueurs carte uniquement : filtrés par rayon
  const mapHealth = useMemo(() => {
    let list = professionals.filter(
      (h) => activeFilters.has(h.category) && !isNaN(h.latitude) && !isNaN(h.longitude),
    );
    if (userCoords) {
      list = list.filter(
        (h) => haversineKm(userCoords.latitude, userCoords.longitude, h.latitude, h.longitude) <= searchRadius,
      );
    }
    if (availableNow) {
      list = list.filter((h) => isOpenNow(h.hours));
    }
    return list;
  }, [professionals, activeFilters, userCoords, searchRadius, availableNow]);

  // Liste et compteur : catégorie + disponibilité, SANS limite de rayon
  const visibleHealth = useMemo(() => {
    let list = professionals.filter(
      (h) => activeFilters.has(h.category) && !isNaN(h.latitude) && !isNaN(h.longitude),
    );
    if (availableNow) {
      list = list.filter((h) => isOpenNow(h.hours));
    }
    if (sortBy === 'distance' && userCoords) {
      list = [...list].sort(
        (a, b) =>
          haversineKm(userCoords.latitude, userCoords.longitude, a.latitude, a.longitude) -
          haversineKm(userCoords.latitude, userCoords.longitude, b.latitude, b.longitude),
      );
    } else if (sortBy === 'type') {
      const order: HealthCategory[] = ['hospital', 'pharmacy', 'doctor', 'specialist'];
      list = [...list].sort((a, b) => order.indexOf(a.category) - order.indexOf(b.category));
    }
    return list;
  }, [professionals, activeFilters, userCoords, availableNow, sortBy]);

  // Total RPPS dans le rayon sélectionné (tous les professionnels, pas seulement les marqueurs)
  const totalInRadius = useMemo(() => {
    if (!userCoords || allProfessionals.length === 0) return allProfessionals.length;
    return allProfessionals.filter(
      (h) => haversineKm(userCoords.latitude, userCoords.longitude, h.latitude, h.longitude) <= searchRadius,
    ).length;
  }, [allProfessionals, userCoords, searchRadius]);

  const distanceKm = useMemo(
    () =>
      selectedItem && userCoords
        ? haversineKm(userCoords.latitude, userCoords.longitude, selectedItem.latitude, selectedItem.longitude)
        : null,
    [selectedItem, userCoords],
  );

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Bonjour {prenom} 🤟</Text>
            <Text style={styles.headerSub}>Carte de Nice — professionnels de santé</Text>
          </View>
          <TouchableOpacity
            style={styles.headerProfileBtn}
            onPress={() => router.push('/(tabs)/profil')}
            accessibilityLabel="Mon profil"
            accessibilityRole="button"
          >
            <Feather name="user" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
        {locationError && (
          <Text style={styles.locationError}>⚠ Localisation non disponible</Text>
        )}
      </View>

      {/* Category filter pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterBar}
        contentContainerStyle={styles.filterBarContent}
      >
        {FILTER_CONFIG.map((f) => (
          <FilterPill
            key={f.id} id={f.id} label={f.label} emoji={f.emoji}
            color={f.color} active={activeFilters.has(f.id)} onToggle={toggleFilter}
          />
        ))}
      </ScrollView>

      {/* Advanced filter row: radius · available · sort */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.advBar}
        contentContainerStyle={styles.advBarContent}
      >
        {RADIUS_OPTIONS.map((r) => {
          const active = searchRadius === r;
          return (
            <TouchableOpacity
              key={r}
              style={[styles.advPill, active && styles.advPillActive]}
              onPress={() => setSearchRadius(r)}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
            >
              <Text style={[styles.advPillText, active && styles.advPillTextActive]}>{r} km</Text>
            </TouchableOpacity>
          );
        })}

        <View style={styles.advDivider} />

        <TouchableOpacity
          style={[styles.advPill, availableNow && styles.advPillActive]}
          onPress={() => setAvailableNow((v) => !v)}
          accessibilityRole="switch"
          accessibilityState={{ checked: availableNow }}
        >
          <Text style={styles.advPillEmoji}>{availableNow ? '🟢' : '⚪'}</Text>
          <Text style={[styles.advPillText, availableNow && styles.advPillTextActive]}>
            Disponible
          </Text>
        </TouchableOpacity>

        <View style={styles.advDivider} />

        <TouchableOpacity
          style={[styles.advPill, sortBy === 'distance' && styles.advPillActive]}
          onPress={() => setSortBy('distance')}
          accessibilityRole="radio"
          accessibilityState={{ selected: sortBy === 'distance' }}
        >
          <Text style={[styles.advPillText, sortBy === 'distance' && styles.advPillTextActive]}>
            📏 Distance
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.advPill, sortBy === 'type' && styles.advPillActive]}
          onPress={() => setSortBy('type')}
          accessibilityRole="radio"
          accessibilityState={{ selected: sortBy === 'type' }}
        >
          <Text style={[styles.advPillText, sortBy === 'type' && styles.advPillTextActive]}>
            🏷 Type
          </Text>
        </TouchableOpacity>
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
              <Marker coordinate={userCoords} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges={false}>
                <UserLocationDot />
              </Marker>
            )}

            {mapHealth.map((prof) => (
              <Marker
                key={prof.id}
                coordinate={{ latitude: prof.latitude, longitude: prof.longitude }}
                onPress={() => setSelectedItem(prof)}
                tracksViewChanges={markerTracking}
                anchor={{ x: 0.5, y: 0.5 }}
              >
                <HealthMarkerView category={prof.category} showDoctolib />
              </Marker>
            ))}
          </MapView>
        ) : (
          <View style={styles.mapFallback}>
            <Text style={styles.mapFallbackEmoji}>🗺️</Text>
            <Text style={styles.mapFallbackText}>Carte disponible sur mobile</Text>
            <Text style={styles.mapFallbackSub}>{mapHealth.length} établissements dans le rayon</Text>
          </View>
        )}

        {userCoords && (
          <TouchableOpacity
            style={styles.centerBtn}
            onPress={() =>
              mapRef.current?.animateToRegion(
                { ...userCoords, latitudeDelta: 0.04, longitudeDelta: 0.04 }, 600,
              )
            }
            accessibilityLabel="Recentrer sur ma position"
          >
            <Text style={styles.centerBtnText}>◎</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Bandeau informatif : total RPPS dans le rayon */}
      <View style={styles.radiusBanner} accessibilityRole="text">
        <Feather name="info" size={13} color={Colors.primary} />
        <Text style={styles.radiusBannerText}>
          <Text style={styles.radiusBannerCount}>{totalInRadius}</Text>
          {` professionnel${totalInRadius !== 1 ? 's' : ''} de santé dans un rayon de `}
          <Text style={styles.radiusBannerCount}>{searchRadius} km</Text>
        </Text>
      </View>

      {/* Bannière : accès aux 2 350 professionnels via le formulaire */}
      <TouchableOpacity
        style={styles.searchBanner}
        onPress={() => router.push('/(tabs)/malentendants/rendez-vous')}
        activeOpacity={0.82}
        accessibilityRole="button"
        accessibilityLabel="Rechercher parmi 2 350 professionnels dans le formulaire de RDV"
      >
        <Feather name="search" size={14} color={Colors.primary} />
        <Text style={styles.searchBannerText}>
          Recherchez parmi{' '}
          <Text style={styles.searchBannerBold}>2 350 professionnels</Text>
          {' '}dans le formulaire de RDV
        </Text>
        <Feather name="chevron-right" size={14} color={Colors.primary} />
      </TouchableOpacity>

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

        {profLoading && (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={Colors.primary} />
            <Text style={styles.loadingText}>Chargement des professionnels…</Text>
          </View>
        )}

        {!profLoading && professionals.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🏥</Text>
            <Text style={styles.emptyTitle}>Aucun professionnel disponible</Text>
            <Text style={styles.emptySub}>
              Les professionnels de santé de votre zone apparaîtront ici.
            </Text>
          </View>
        )}

        {!profLoading && professionals.length > 0 && visibleHealth.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyTitle}>Aucun résultat</Text>
            <Text style={styles.emptySub}>
              Augmentez le rayon ou désactivez les filtres.
            </Text>
          </View>
        )}

        {/* Health professionals list grouped by category */}
        {(['hospital', 'pharmacy', 'doctor', 'specialist'] as HealthCategory[])
          .filter((cat) => activeFilters.has(cat))
          .map((cat) => {
            const cfg = CATEGORY_CONFIG[cat];
            const items = visibleHealth.filter((h) => h.category === cat);
            if (items.length === 0) return null;
            return (
              <View key={cat} style={styles.section}>
                <Text style={styles.sectionTitle}>
                  {cfg.emoji} {SECTION_LABELS[cat]}
                  <Text style={styles.sectionCount}> ({items.length})</Text>
                </Text>
                {items.map((prof) => {
                  const dist = userCoords
                    ? `${haversineKm(
                        userCoords.latitude, userCoords.longitude,
                        prof.latitude, prof.longitude,
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
                      <View style={[styles.listAvatarSquare, { backgroundColor: cfg.color + '18', borderColor: cfg.color }]}>
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
    gap: 4,
  },
  headerTopRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  headerTitle: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.white },
  headerSub: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  headerProfileBtn: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  locationError: { fontSize: FontSize.xs, color: 'rgba(255,220,100,0.9)', marginTop: 4 },

  /* Category filter pills */
  filterBar: { backgroundColor: Colors.primary, flexGrow: 0 },
  filterBarContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
    gap: Spacing.sm,
    flexDirection: 'row',
  },
  filterPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: Radius.full, borderWidth: 1.5,
  },
  filterPillEmoji: { fontSize: 14 },
  filterPillText: { fontSize: FontSize.xs, fontWeight: '700' },

  /* Advanced filter bar */
  advBar: { backgroundColor: Colors.primaryDark, flexGrow: 0 },
  advBarContent: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  advPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
  },
  advPillActive: {
    backgroundColor: Colors.white,
    borderColor: Colors.white,
  },
  advPillText: { fontSize: FontSize.xs, fontWeight: '700', color: 'rgba(255,255,255,0.9)' },
  advPillTextActive: { color: Colors.primaryDark },
  advPillEmoji: { fontSize: 11 },
  advDivider: {
    width: 1, height: 18,
    backgroundColor: 'rgba(255,255,255,0.25)',
    marginHorizontal: 2,
  },

  /* Map */
  mapWrapper: { height: 240, position: 'relative' },
  mapFallback: {
    flex: 1, backgroundColor: '#C8E6E3',
    alignItems: 'center', justifyContent: 'center', gap: Spacing.xs,
  },
  mapFallbackEmoji: { fontSize: 40 },
  mapFallbackText: { fontSize: FontSize.md, fontWeight: '700', color: Colors.primaryDark },
  mapFallbackSub: { fontSize: FontSize.sm, color: Colors.textSecondary },

  markerWrapper: { alignItems: 'center' },
  doctolibMarkerBadge: {
    marginTop: 2, backgroundColor: '#00B5BA',
    borderRadius: 3, paddingHorizontal: 4, paddingVertical: 1,
  },
  doctolibMarkerText: { fontSize: 7, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },

  userDotWrapper: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
  userDotRing: {
    position: 'absolute', width: 24, height: 24,
    borderRadius: 12, backgroundColor: '#3B82F6',
  },
  userDot: {
    width: 14, height: 14, borderRadius: 7,
    backgroundColor: '#3B82F6', borderWidth: 2.5, borderColor: Colors.white,
  },

  healthMarkerOuter: {
    width: 40, height: 40, borderRadius: 20, borderWidth: 2.5,
    backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2, shadowRadius: 3, elevation: 4,
  },
  healthMarkerInner: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  healthMarkerEmoji: { fontSize: 15 },

  centerBtn: {
    position: 'absolute', bottom: Spacing.sm, right: Spacing.sm,
    width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.white,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2, shadowRadius: 4, elevation: 4,
  },
  centerBtnText: { fontSize: 20, color: Colors.primary },

  scroll: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { padding: Spacing.lg, paddingBottom: Spacing.xxl, gap: Spacing.md },

  rdvMainBtn: {
    backgroundColor: Colors.primary, borderRadius: Radius.lg,
    padding: Spacing.md, alignItems: 'center',
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 5,
  },
  rdvMainBtnText: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.white },

  rdvSecondBtn: {
    backgroundColor: Colors.white, borderRadius: Radius.lg,
    padding: Spacing.md, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: Spacing.sm,
    borderWidth: 2, borderColor: Colors.primary,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 6, elevation: 2,
  },
  rdvSecondBtnText: { fontSize: FontSize.md, fontWeight: '700', color: Colors.primary },
  rdvBadge: {
    backgroundColor: Colors.warning, borderRadius: Radius.full,
    minWidth: 22, height: 22, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5,
  },
  rdvBadgeText: { fontSize: 11, fontWeight: '800', color: Colors.white },

  statsRow: { flexDirection: 'row', gap: Spacing.sm },
  statCard: {
    flex: 1, backgroundColor: Colors.white, borderRadius: Radius.md,
    padding: Spacing.md, alignItems: 'center', gap: Spacing.xs,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  statEmoji: { fontSize: 20 },
  statValue: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.primary },
  statLabel: { fontSize: FontSize.xs, color: Colors.textSecondary, textAlign: 'center' },

  loadingRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    paddingVertical: Spacing.md, justifyContent: 'center',
  },
  loadingText: { fontSize: FontSize.sm, color: Colors.textSecondary },

  emptyState: { alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.xxl },
  emptyIcon: { fontSize: 44 },
  emptyTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
  emptySub: {
    fontSize: FontSize.sm, color: Colors.textSecondary,
    textAlign: 'center', paddingHorizontal: Spacing.lg,
  },

  section: { gap: Spacing.sm },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary },
  sectionCount: { fontSize: FontSize.sm, fontWeight: '500', color: Colors.textSecondary },

  listCard: {
    backgroundColor: Colors.white, borderRadius: Radius.md,
    padding: Spacing.md, flexDirection: 'row', alignItems: 'center',
    gap: Spacing.md, borderWidth: 1.5, borderColor: Colors.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  listAvatarSquare: {
    width: 46, height: 46, borderRadius: Radius.md,
    alignItems: 'center', justifyContent: 'center', borderWidth: 2, flexShrink: 0,
  },
  listAvatarEmoji: { fontSize: 22 },
  listInfo: { flex: 1, gap: 2 },
  listName: { fontSize: FontSize.md, fontWeight: '600', color: Colors.textPrimary },
  listSub: { fontSize: FontSize.sm, color: Colors.textSecondary },
  listMeta: { fontSize: FontSize.xs, color: Colors.textSecondary },
  badge: { paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: Radius.full, flexShrink: 0 },
  badgeText: { fontSize: FontSize.xs, fontWeight: '700' },

  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)', zIndex: 10,
  },
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    height: SHEET_HEIGHT, backgroundColor: Colors.white,
    borderTopLeftRadius: 24, borderTopRightRadius: 24, zIndex: 11,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15, shadowRadius: 16, elevation: 20,
  },
  sheetHandle: {
    width: 40, height: 4, backgroundColor: Colors.border,
    borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 4,
  },
  sheetBody: { padding: Spacing.lg, gap: Spacing.md },

  sheetHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  sheetAvatar: {
    width: 56, height: 56, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center', borderWidth: 2.5, flexShrink: 0,
  },
  sheetAvatarContent: { fontSize: FontSize.lg, fontWeight: '800' },
  sheetNameBlock: { flex: 1, gap: 2 },
  sheetName: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary, lineHeight: 22 },
  sheetSubtitle: { fontSize: FontSize.sm, color: Colors.textSecondary },

  closeBtn: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.border,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  closeBtnText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: '700' },

  healthInfo: { gap: 6 },
  healthInfoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  healthInfoIcon: { fontSize: 14, width: 20, textAlign: 'center', marginTop: 1 },
  healthInfoText: { flex: 1, fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 20 },

  sheetActions: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'stretch' },
  doctolibSheetBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    backgroundColor: '#00B5BA', borderRadius: Radius.lg,
    paddingVertical: Spacing.md, paddingHorizontal: Spacing.md,
    shadowColor: '#00B5BA', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 8, elevation: 4,
  },
  doctolibSheetLogo: {
    width: 22, height: 22, borderRadius: 5, backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
  },
  doctolibSheetLogoText: { fontSize: 12, fontWeight: '800', color: '#00B5BA' },
  doctolibSheetBtnText: { fontSize: FontSize.sm, fontWeight: '700', color: '#fff' },
  rdvBtn: {
    borderRadius: Radius.lg, padding: Spacing.md,
    alignItems: 'center', justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 4,
  },
  rdvBtnText: { fontSize: FontSize.md, fontWeight: '700', color: Colors.white },

  radiusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 9,
    backgroundColor: Colors.primaryLight,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  radiusBannerText: {
    flex: 1,
    fontSize: FontSize.xs,
    color: Colors.primaryDark,
    lineHeight: 17,
  },
  radiusBannerCount: {
    fontWeight: '800',
    color: Colors.primary,
  },

  searchBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 10,
    backgroundColor: Colors.primaryLight,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  searchBannerText: {
    flex: 1,
    fontSize: FontSize.xs,
    color: Colors.primaryDark,
    lineHeight: 17,
  },
  searchBannerBold: {
    fontWeight: '700',
    color: Colors.primary,
  },
});
