import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { SkeletonMissionCard } from '@/components/ui/Skeleton';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Colors, FontSize, Radius, Spacing } from '@/constants/theme';
import { useAppointments, type Appointment, type AppointmentType } from '@/hooks/useAppointments';
import { useUnreadMessages } from '@/hooks/useUnreadMessages';

type Tab = 'disponibles' | 'missions' | 'historique';
type DateFilter = 'today' | 'week' | 'month';

const TYPE_INFO: Record<AppointmentType, { label: string; icon: string }> = {
  generaliste: { label: 'Médecin généraliste', icon: '🩺' },
  urgences:    { label: 'Urgences',            icon: '🚨' },
  specialiste: { label: 'Spécialiste',         icon: '👨‍⚕️' },
  pharmacie:   { label: 'Pharmacie',           icon: '💊' },
};

const TYPE_OPTIONS: AppointmentType[] = ['generaliste', 'urgences', 'specialiste', 'pharmacie'];
const DISTANCE_OPTIONS = [5, 10, 20, 50] as const;
const DATE_OPTIONS: { id: DateFilter; label: string }[] = [
  { id: 'today', label: "Aujourd'hui" },
  { id: 'week',  label: 'Cette semaine' },
  { id: 'month', label: 'Ce mois' },
];

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

function matchesDateFilter(dateStr: string, filter: DateFilter): boolean {
  const d = new Date(dateStr);
  const now = new Date();
  if (filter === 'today') {
    return d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate();
  }
  if (filter === 'week') {
    const end = new Date(now);
    end.setDate(now.getDate() + 7);
    return d >= now && d <= end;
  }
  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
}

/* ─── Filter bottom sheet ────────────────────────────────── */

type FilterSheetProps = {
  pendingTypes: Set<AppointmentType>;
  pendingDistance: number | null;
  pendingDate: DateFilter | null;
  pendingUrgentOnly: boolean;
  onToggleType: (t: AppointmentType) => void;
  onSetDistance: (d: number | null) => void;
  onSetDate: (d: DateFilter | null) => void;
  onSetUrgentOnly: (v: boolean) => void;
  onReset: () => void;
  onApply: () => void;
  onClose: () => void;
};

const FilterSheet = memo(function FilterSheet({
  pendingTypes, pendingDistance, pendingDate, pendingUrgentOnly,
  onToggleType, onSetDistance, onSetDate, onSetUrgentOnly,
  onReset, onApply, onClose,
}: FilterSheetProps) {
  const slideY = useRef(new Animated.Value(420)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideY, { toValue: 0, useNativeDriver: true, bounciness: 3, speed: 14 }),
      Animated.timing(backdropOpacity, { toValue: 1, duration: 220, useNativeDriver: true }),
    ]).start();
  }, []);

  const close = useCallback(() => {
    Animated.parallel([
      Animated.timing(slideY, { toValue: 420, duration: 210, useNativeDriver: true }),
      Animated.timing(backdropOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(onClose);
  }, [slideY, backdropOpacity, onClose]);

  const handleApply = useCallback(() => {
    Animated.parallel([
      Animated.timing(slideY, { toValue: 420, duration: 210, useNativeDriver: true }),
      Animated.timing(backdropOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(onApply);
  }, [slideY, backdropOpacity, onApply]);

  return (
    <>
      <TouchableWithoutFeedback onPress={close}>
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]} />
      </TouchableWithoutFeedback>

      <Animated.View style={[styles.filterSheet, { transform: [{ translateY: slideY }] }]}>
        <View style={styles.filterHandle} />

        <View style={styles.filterTitleRow}>
          <Text style={styles.filterTitle}>Filtres</Text>
          <TouchableOpacity onPress={close} style={styles.filterCloseBtn} accessibilityLabel="Fermer">
            <Feather name="x" size={18} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.filterScrollContent}>
          {/* Type de RDV */}
          <Text style={styles.filterSectionLabel}>Type de RDV</Text>
          <View style={styles.filterChipsWrap}>
            {TYPE_OPTIONS.map((type) => {
              const active = pendingTypes.has(type);
              return (
                <TouchableOpacity
                  key={type}
                  style={[styles.filterChip, active && styles.filterChipActive]}
                  onPress={() => onToggleType(type)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: active }}
                >
                  <Text style={styles.filterChipIcon}>{TYPE_INFO[type].icon}</Text>
                  <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                    {TYPE_INFO[type].label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Distance maximum */}
          <Text style={styles.filterSectionLabel}>Distance maximum</Text>
          <View style={styles.filterOptionsRow}>
            {DISTANCE_OPTIONS.map((d) => {
              const active = pendingDistance === d;
              return (
                <TouchableOpacity
                  key={d}
                  style={[styles.filterOption, active && styles.filterOptionActive]}
                  onPress={() => onSetDistance(active ? null : d)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: active }}
                >
                  <Text style={[styles.filterOptionText, active && styles.filterOptionTextActive]}>
                    {d} km
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Date */}
          <Text style={styles.filterSectionLabel}>Date</Text>
          <View style={styles.filterOptionsRow}>
            {DATE_OPTIONS.map(({ id, label }) => {
              const active = pendingDate === id;
              return (
                <TouchableOpacity
                  key={id}
                  style={[styles.filterOption, active && styles.filterOptionActive, styles.filterOptionFlex]}
                  onPress={() => onSetDate(active ? null : id)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: active }}
                >
                  <Text style={[styles.filterOptionText, active && styles.filterOptionTextActive]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Urgences uniquement */}
          <View style={styles.filterToggleRow}>
            <View style={styles.filterToggleLabelRow}>
              <Text style={styles.filterToggleEmoji}>🚨</Text>
              <Text style={styles.filterToggleText}>Urgences uniquement</Text>
            </View>
            <Switch
              value={pendingUrgentOnly}
              onValueChange={onSetUrgentOnly}
              trackColor={{ false: Colors.border, true: Colors.primary }}
              thumbColor={Colors.white}
              ios_backgroundColor={Colors.border}
            />
          </View>
        </ScrollView>

        {/* Actions */}
        <View style={styles.filterActions}>
          <TouchableOpacity style={styles.resetBtn} onPress={onReset} accessibilityRole="button">
            <Text style={styles.resetBtnText}>Réinitialiser</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.applyBtn} onPress={handleApply} accessibilityRole="button">
            <Text style={styles.applyBtnText}>Appliquer</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </>
  );
});

/* ─── Main screen ────────────────────────────────────────── */

export default function MissionsScreen() {
  const { pending, myMissions, history, loading, acceptMission, declineMission } =
    useAppointments();
  const unreadMap = useUnreadMessages();
  const [activeTab, setActiveTab] = useState<Tab>('disponibles');
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [accepting, setAccepting] = useState<string | null>(null);
  const acceptAnim = useRef(new Animated.Value(0)).current;
  const searchAnim = useRef(new Animated.Value(0)).current;
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await new Promise<void>((r) => setTimeout(r, 800));
    setRefreshing(false);
  }, []);

  // Search
  const [searchQuery, setSearchQuery] = useState('');

  // Applied filters (persist during session)
  const [filterTypes, setFilterTypes] = useState<Set<AppointmentType>>(new Set());
  const [filterDistance, setFilterDistance] = useState<number | null>(null);
  const [filterDate, setFilterDate] = useState<DateFilter | null>(null);
  const [filterUrgentOnly, setFilterUrgentOnly] = useState(false);

  // Pending filters (inside the sheet before applying)
  const [showFilters, setShowFilters] = useState(false);
  const [pendingTypes, setPendingTypes] = useState<Set<AppointmentType>>(new Set());
  const [pendingDistance, setPendingDistance] = useState<number | null>(null);
  const [pendingDate, setPendingDate] = useState<DateFilter | null>(null);
  const [pendingUrgentOnly, setPendingUrgentOnly] = useState(false);

  useEffect(() => {
    Animated.spring(searchAnim, {
      toValue: 1, useNativeDriver: true, delay: 120, tension: 55, friction: 9,
    }).start();
  }, [searchAnim]);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const loc = await Location.getCurrentPositionAsync({});
      setUserCoords({ lat: loc.coords.latitude, lng: loc.coords.longitude });
    })();
  }, []);

  const handleAccept = useCallback((id: string) => {
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
  }, [acceptAnim, acceptMission]);

  const getDistanceLabel = useCallback((coords: { lat: number; lng: number }): string => {
    if (!userCoords) return '';
    const km = haversineKm(userCoords.lat, userCoords.lng, coords.lat, coords.lng);
    return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
  }, [userCoords]);

  const openFilters = useCallback(() => {
    setPendingTypes(new Set(filterTypes));
    setPendingDistance(filterDistance);
    setPendingDate(filterDate);
    setPendingUrgentOnly(filterUrgentOnly);
    setShowFilters(true);
  }, [filterTypes, filterDistance, filterDate, filterUrgentOnly]);

  const applyFilters = useCallback(() => {
    setFilterTypes(new Set(pendingTypes));
    setFilterDistance(pendingDistance);
    setFilterDate(pendingDate);
    setFilterUrgentOnly(pendingUrgentOnly);
    setShowFilters(false);
  }, [pendingTypes, pendingDistance, pendingDate, pendingUrgentOnly]);

  const resetPending = useCallback(() => {
    setPendingTypes(new Set());
    setPendingDistance(null);
    setPendingDate(null);
    setPendingUrgentOnly(false);
  }, []);

  const clearAllFilters = useCallback(() => {
    setFilterTypes(new Set());
    setFilterDistance(null);
    setFilterDate(null);
    setFilterUrgentOnly(false);
    setSearchQuery('');
  }, []);

  const togglePendingType = useCallback((type: AppointmentType) => {
    setPendingTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type); else next.add(type);
      return next;
    });
  }, []);

  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (filterTypes.size > 0) n++;
    if (filterDistance !== null) n++;
    if (filterDate !== null) n++;
    if (filterUrgentOnly) n++;
    return n;
  }, [filterTypes.size, filterDistance, filterDate, filterUrgentOnly]);

  const tabs = useMemo(() => [
    { id: 'disponibles' as Tab, label: 'Disponibles', count: pending.length },
    { id: 'missions'    as Tab, label: 'Mes missions', count: myMissions.length },
    { id: 'historique'  as Tab, label: 'Historique',   count: history.length },
  ], [pending.length, myMissions.length, history.length]);

  const rawList = useMemo(() =>
    activeTab === 'disponibles' ? pending
    : activeTab === 'missions'  ? myMissions
    : history,
    [activeTab, pending, myMissions, history],
  );

  const filteredList = useMemo(() => {
    let list = rawList;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((a) =>
        a.patientName.toLowerCase().includes(q) ||
        TYPE_INFO[a.type].label.toLowerCase().includes(q) ||
        a.location.toLowerCase().includes(q) ||
        a.address.toLowerCase().includes(q),
      );
    }
    if (filterTypes.size > 0) {
      list = list.filter((a) => filterTypes.has(a.type));
    }
    if (filterDistance !== null && userCoords) {
      list = list.filter((a) => {
        const km = haversineKm(userCoords.lat, userCoords.lng, a.coordinates.lat, a.coordinates.lng);
        return km <= filterDistance;
      });
    }
    if (filterDate !== null) {
      list = list.filter((a) => matchesDateFilter(a.date, filterDate));
    }
    if (filterUrgentOnly) {
      list = list.filter((a) => a.type === 'urgences');
    }
    return list;
  }, [rawList, searchQuery, filterTypes, filterDistance, filterDate, filterUrgentOnly, userCoords]);

  const hasActiveSearch = searchQuery.trim() !== '' || activeFilterCount > 0;

  // Callbacks déclarés AVANT tout return conditionnel (règles des hooks)
  const renderMissionItem = useCallback(
    ({ item }: { item: Appointment }) => (
      <AppointmentCard
        appt={item}
        tab={activeTab}
        distance={getDistanceLabel(item.coordinates)}
        isAccepting={accepting === item.id}
        acceptAnim={acceptAnim}
        onAccept={handleAccept}
        onDecline={declineMission}
        onMessage={activeTab === 'missions' && item.status === 'accepted' && item.patientId
          ? () => router.push(`/(tabs)/messagerie/${item.id}?recipientId=${encodeURIComponent(item.patientId)}&name=${encodeURIComponent(item.patientName)}`)
          : undefined}
        unreadCount={unreadMap.get(item.id)}
      />
    ),
    [activeTab, accepting, acceptAnim, getDistanceLabel, handleAccept, declineMission, unreadMap],
  );

  const renderEmpty = useCallback(
    () => (
      <View style={styles.emptyState}>
        <Text style={styles.emptyIcon}>
          {hasActiveSearch
            ? '🔍'
            : activeTab === 'disponibles' ? '🎉' : activeTab === 'missions' ? '📅' : '📋'}
        </Text>
        <Text style={styles.emptyTitle}>
          {hasActiveSearch
            ? 'Aucun résultat'
            : activeTab === 'disponibles'
            ? 'Aucune demande disponible'
            : activeTab === 'missions'
            ? 'Aucune mission en cours'
            : 'Aucun historique'}
        </Text>
        <Text style={styles.emptySub}>
          {hasActiveSearch
            ? 'Modifiez votre recherche ou vos filtres.'
            : activeTab === 'disponibles'
            ? 'Revenez plus tard pour voir de nouvelles demandes.'
            : activeTab === 'missions'
            ? "Acceptez des demandes dans l'onglet Disponibles."
            : 'Vos missions passées apparaîtront ici.'}
        </Text>
      </View>
    ),
    [activeTab, hasActiveSearch],
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.tabBar} />
        <FlatList
          data={[1, 2, 3, 4]}
          keyExtractor={(i) => String(i)}
          contentContainerStyle={styles.listContent}
          renderItem={() => <SkeletonMissionCard />}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        />
      </SafeAreaView>
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
                  <View style={[styles.tabBadge, isActive ? styles.tabBadgeActive : styles.tabBadgeInactive]}>
                    <Text style={[styles.tabBadgeText, isActive ? styles.tabBadgeTextActive : styles.tabBadgeTextInactive]}>
                      {tab.count}
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Barre de recherche + bouton filtres */}
      <Animated.View
        style={[
          styles.searchRow,
          {
            opacity: searchAnim,
            transform: [{ translateY: searchAnim.interpolate({ inputRange: [0, 1], outputRange: [-10, 0] }) }],
          },
        ]}
      >
        <View style={styles.searchBar}>
          <Feather name="search" size={17} color={Colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Patient, type, lieu, adresse…"
            placeholderTextColor={Colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Feather name="x" size={15} color={Colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={[styles.filterBtn, activeFilterCount > 0 && styles.filterBtnActive]}
          onPress={openFilters}
          accessibilityRole="button"
          accessibilityLabel={`Filtres${activeFilterCount > 0 ? `, ${activeFilterCount} actif${activeFilterCount > 1 ? 's' : ''}` : ''}`}
        >
          <Feather name="sliders" size={17} color={activeFilterCount > 0 ? Colors.white : Colors.textPrimary} />
          {activeFilterCount > 0 && (
            <View style={styles.filterBtnBadge}>
              <Text style={styles.filterBtnBadgeText}>{activeFilterCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>

      {/* Barre résultats */}
      {hasActiveSearch && (
        <View style={styles.resultsBar}>
          <Text style={styles.resultsText}>
            {filteredList.length} résultat{filteredList.length !== 1 ? 's' : ''}
          </Text>
          <TouchableOpacity onPress={clearAllFilters} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.resultsClear}>Tout effacer</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={filteredList}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} colors={[Colors.primary]} />
        }
        showsVerticalScrollIndicator={false}
        removeClippedSubviews
        initialNumToRender={10}
        maxToRenderPerBatch={5}
        windowSize={5}
        renderItem={renderMissionItem}
        ListEmptyComponent={renderEmpty}
      />

      {/* Filter bottom sheet */}
      {showFilters && (
        <FilterSheet
          pendingTypes={pendingTypes}
          pendingDistance={pendingDistance}
          pendingDate={pendingDate}
          pendingUrgentOnly={pendingUrgentOnly}
          onToggleType={togglePendingType}
          onSetDistance={setPendingDistance}
          onSetDate={setPendingDate}
          onSetUrgentOnly={setPendingUrgentOnly}
          onReset={resetPending}
          onApply={applyFilters}
          onClose={() => setShowFilters(false)}
        />
      )}
    </SafeAreaView>
  );
}

/* ─── AppointmentCard ────────────────────────────────────── */

type CardProps = {
  appt: Appointment;
  tab: Tab;
  distance: string;
  isAccepting: boolean;
  acceptAnim: Animated.Value;
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
  onMessage?: () => void;
  unreadCount?: number;
};

const AppointmentCard = memo(function AppointmentCard({
  appt, tab, distance, isAccepting, acceptAnim, onAccept, onDecline, onMessage, unreadCount,
}: CardProps) {
  const info = TYPE_INFO[appt.type];
  const isUrgent = appt.type === 'urgences';
  const handleAcceptThis  = useCallback(() => onAccept(appt.id),  [onAccept, appt.id]);
  const handleDeclineThis = useCallback(() => onDecline(appt.id), [onDecline, appt.id]);

  return (
    <View style={[styles.card, isUrgent && styles.cardUrgent]}>
      {isAccepting && (
        <Animated.View style={[styles.acceptOverlay, { opacity: acceptAnim }]}>
          <Text style={styles.acceptOverlayText}>✓ Mission acceptée !</Text>
        </Animated.View>
      )}

      <View style={styles.cardHeader}>
        <View style={styles.typeRow}>
          <Text style={styles.typeIcon}>{info.icon}</Text>
          <Text style={[styles.typeLabel, isUrgent && styles.typeLabelUrgent]}>{info.label}</Text>
          {isUrgent && (
            <View style={styles.urgentBadge}>
              <Text style={styles.urgentText}>URGENT</Text>
            </View>
          )}
        </View>
        {!!distance && <Text style={styles.distanceLabel}>📍 {distance}</Text>}
      </View>

      <Text style={styles.patientName}>👤 {appt.patientName}</Text>

      <View style={styles.metaRow}>
        <Text style={styles.metaItem}>🗓 {formatDate(appt.date)}</Text>
        <Text style={styles.metaItem}>🕐 {appt.time}</Text>
      </View>

      <View style={styles.locationBox}>
        <Text style={styles.locationName} numberOfLines={1}>{appt.location}</Text>
        <Text style={styles.locationAddress} numberOfLines={1}>{appt.address}</Text>
      </View>

      {tab === 'disponibles' ? (
        <View style={styles.actions}>
          <TouchableOpacity style={styles.declineBtn} onPress={handleDeclineThis} accessibilityRole="button">
            <Text style={styles.declineBtnText}>✗  Refuser</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.acceptBtn} onPress={handleAcceptThis} accessibilityRole="button">
            <Text style={styles.acceptBtnText}>✓  Accepter</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.statusRow}>
          <View style={[styles.statusChip, appt.status === 'accepted' ? styles.statusAccepted : styles.statusDeclined]}>
            <Text style={styles.statusChipText}>
              {appt.status === 'accepted' ? '✓ Acceptée' : '✗ Refusée'}
            </Text>
          </View>
          {tab === 'missions' && appt.status === 'accepted' && onMessage && (
            <TouchableOpacity
              style={styles.chatBtn}
              onPress={onMessage}
              accessibilityRole="button"
              accessibilityLabel={unreadCount ? `Contacter le patient — ${unreadCount} message${unreadCount > 1 ? 's' : ''} non lu${unreadCount > 1 ? 's' : ''}` : 'Contacter le patient'}
            >
              <Feather name="message-circle" size={15} color={Colors.white} />
              <Text style={styles.chatBtnText}>Contacter</Text>
              {!!unreadCount && (
                <View style={styles.chatBtnBadge}>
                  <Text style={styles.chatBtnBadgeTxt}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
});

/* ─── Styles ─────────────────────────────────────────────── */
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  centered: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    gap: Spacing.md, backgroundColor: Colors.background,
  },
  loadingText: { fontSize: FontSize.sm, color: Colors.textSecondary },

  /* Tab bar */
  tabBar: {
    flexDirection: 'row', backgroundColor: Colors.white,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
    paddingHorizontal: Spacing.sm,
  },
  tab: {
    flex: 1, paddingVertical: Spacing.md, alignItems: 'center',
    borderBottomWidth: 2.5, borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: Colors.primary },
  tabInner: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  tabText: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textSecondary },
  tabTextActive: { color: Colors.primary },
  tabBadge: {
    minWidth: 18, height: 18, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4,
  },
  tabBadgeActive: { backgroundColor: Colors.primary },
  tabBadgeInactive: { backgroundColor: Colors.border },
  tabBadgeText: { fontSize: 10, fontWeight: '800' },
  tabBadgeTextActive: { color: Colors.white },
  tabBadgeTextInactive: { color: Colors.textSecondary },

  /* Search row */
  searchRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    gap: Spacing.sm, backgroundColor: Colors.white,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  searchBar: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.primaryLight, borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md, paddingVertical: 9,
    gap: Spacing.sm, borderWidth: 1, borderColor: Colors.border,
  },
  searchInput: {
    flex: 1, fontSize: FontSize.sm, color: Colors.textPrimary,
    padding: 0, margin: 0,
  },
  filterBtn: {
    width: 42, height: 42, borderRadius: Radius.md,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: Colors.border,
    backgroundColor: Colors.white, position: 'relative',
  },
  filterBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterBtnBadge: {
    position: 'absolute', top: -4, right: -4,
    minWidth: 16, height: 16, borderRadius: 8,
    backgroundColor: Colors.warning,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5, borderColor: Colors.white,
  },
  filterBtnBadgeText: { fontSize: 9, fontWeight: '800', color: Colors.white },

  /* Results bar */
  resultsBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingVertical: 6,
    backgroundColor: Colors.primaryLight, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  resultsText: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: '500' },
  resultsClear: { fontSize: FontSize.xs, color: Colors.primary, fontWeight: '700' },

  /* List */
  listContent: { padding: Spacing.md, paddingBottom: Spacing.xxl, gap: Spacing.md },

  /* Empty state */
  emptyState: { paddingVertical: Spacing.xxl, alignItems: 'center', gap: Spacing.sm },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary },
  emptySub: {
    fontSize: FontSize.sm, color: Colors.textSecondary,
    textAlign: 'center', paddingHorizontal: Spacing.lg,
  },

  /* Card */
  card: {
    backgroundColor: Colors.white, borderRadius: Radius.lg,
    padding: Spacing.md, gap: Spacing.sm,
    borderWidth: 1.5, borderColor: Colors.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 2, overflow: 'hidden',
  },
  cardUrgent: { borderColor: Colors.error + '80', borderWidth: 2 },

  acceptOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.primary + 'EC',
    borderRadius: Radius.lg, alignItems: 'center',
    justifyContent: 'center', zIndex: 10,
  },
  acceptOverlayText: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.white, letterSpacing: 0.5 },

  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  typeRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, flex: 1, flexWrap: 'wrap' },
  typeIcon: { fontSize: 18 },
  typeLabel: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
  typeLabelUrgent: { color: Colors.error },
  urgentBadge: { backgroundColor: '#FEE2E2', borderRadius: Radius.full, paddingHorizontal: Spacing.sm, paddingVertical: 2 },
  urgentText: { fontSize: FontSize.xs, fontWeight: '800', color: Colors.error, letterSpacing: 0.5 },
  distanceLabel: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: '500' },

  patientName: { fontSize: FontSize.md, fontWeight: '600', color: Colors.textPrimary },
  metaRow: { flexDirection: 'row', gap: Spacing.md },
  metaItem: { fontSize: FontSize.sm, color: Colors.textSecondary },
  locationBox: { gap: 2 },
  locationName: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textPrimary },
  locationAddress: { fontSize: FontSize.xs, color: Colors.textSecondary },

  actions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.xs },
  declineBtn: {
    flex: 1, paddingVertical: Spacing.sm, borderRadius: Radius.md,
    alignItems: 'center', borderWidth: 1.5, borderColor: Colors.error,
  },
  declineBtnText: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.error },
  acceptBtn: {
    flex: 1, paddingVertical: Spacing.sm, borderRadius: Radius.md,
    alignItems: 'center', backgroundColor: Colors.primary,
  },
  acceptBtnText: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.white },

  statusRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flexWrap: 'wrap', marginTop: Spacing.xs },
  statusChip: { alignSelf: 'flex-start', paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: Radius.full },
  statusAccepted: { backgroundColor: Colors.primaryLight },
  statusDeclined: { backgroundColor: '#FEE2E2' },
  statusChipText: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.textPrimary },
  chatBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: Radius.full, backgroundColor: Colors.primary, position: 'relative' },
  chatBtnText: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.white },
  chatBtnBadge: { position: 'absolute', top: -5, right: -5, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: '#DC2626', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3, borderWidth: 1.5, borderColor: Colors.white },
  chatBtnBadgeTxt: { fontSize: 9, fontWeight: '800', color: Colors.white },

  /* Filter sheet overlay */
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.38)',
    zIndex: 20,
  },
  filterSheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    maxHeight: '85%',
    zIndex: 21,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15, shadowRadius: 16, elevation: 24,
  },
  filterHandle: {
    width: 40, height: 4, backgroundColor: Colors.border,
    borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 4,
  },
  filterTitleRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  filterTitle: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.textPrimary },
  filterCloseBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  filterScrollContent: { padding: Spacing.lg, gap: Spacing.md, paddingBottom: Spacing.sm },
  filterSectionLabel: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  filterChipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  filterChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderRadius: Radius.full, borderWidth: 1.5, borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  filterChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterChipIcon: { fontSize: 15 },
  filterChipText: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textPrimary },
  filterChipTextActive: { color: Colors.white },
  filterOptionsRow: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' },
  filterOption: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderRadius: Radius.full, borderWidth: 1.5, borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  filterOptionFlex: { flex: 1, alignItems: 'center' },
  filterOptionActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterOptionText: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textPrimary },
  filterOptionTextActive: { color: Colors.white },
  filterToggleRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    borderTopWidth: 1, borderTopColor: Colors.border,
    marginTop: Spacing.xs,
  },
  filterToggleLabelRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  filterToggleEmoji: { fontSize: 18 },
  filterToggleText: { fontSize: FontSize.md, fontWeight: '600', color: Colors.textPrimary },
  filterActions: {
    flexDirection: 'row', gap: Spacing.sm,
    padding: Spacing.lg, borderTopWidth: 1, borderTopColor: Colors.border,
  },
  resetBtn: {
    flex: 1, paddingVertical: Spacing.md, borderRadius: Radius.lg,
    alignItems: 'center', borderWidth: 1.5, borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  resetBtnText: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textSecondary },
  applyBtn: {
    flex: 2, paddingVertical: Spacing.md, borderRadius: Radius.lg,
    alignItems: 'center', backgroundColor: Colors.primary,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 5,
  },
  applyBtnText: { fontSize: FontSize.md, fontWeight: '700', color: Colors.white },
});
