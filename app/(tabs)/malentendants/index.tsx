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
import { INTERPRETES_NICE, NICE_CENTER, type Interprete } from '@/data/mockData';

let MapView: any, Marker: any, Callout: any;
if (Platform.OS !== 'web') {
  const maps = require('react-native-maps');
  MapView = maps.default;
  Marker = maps.Marker;
  Callout = maps.Callout;
}

export default function MalentendantsHome() {
  const { user } = useAuth();
  const [selected, setSelected] = useState<Interprete | null>(null);
  const prenom = user?.name?.split(' ')[0] ?? '';

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Bonjour {prenom} 🤟</Text>
        <Text style={styles.headerSub}>Interprètes LSF disponibles à Nice</Text>
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
            {INTERPRETES_NICE.map((interp) => (
              <Marker
                key={interp.id}
                coordinate={{ latitude: interp.latitude, longitude: interp.longitude }}
                pinColor={interp.available ? '#0077CC' : '#9CA3AF'}
                onPress={() => setSelected(interp)}
              >
                <Callout tooltip>
                  <View style={styles.callout}>
                    <Text style={styles.calloutName}>{interp.name}</Text>
                    <Text style={styles.calloutSpec}>{interp.specialite}</Text>
                    <Text style={styles.calloutMeta}>
                      ⭐ {interp.note} · {interp.distance}
                    </Text>
                    <View style={[styles.calloutBadge, { backgroundColor: interp.available ? Colors.interpretesLight : '#F3F4F6' }]}>
                      <Text style={[styles.calloutBadgeText, { color: interp.available ? Colors.interpretes : Colors.textSecondary }]}>
                        {interp.available ? '● Disponible' : '● Occupé'}
                      </Text>
                    </View>
                  </View>
                </Callout>
              </Marker>
            ))}
          </MapView>
        ) : (
          <View style={styles.mapFallback}>
            <Text style={styles.mapFallbackEmoji}>🗺️</Text>
            <Text style={styles.mapFallbackText}>Carte disponible sur mobile</Text>
            <Text style={styles.mapFallbackSub}>Centre-ville de Nice · 5 interprètes</Text>
          </View>
        )}

        {/* Map legend */}
        <View style={styles.mapLegend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: Colors.malentendants }]} />
            <Text style={styles.legendText}>Disponible</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#9CA3AF' }]} />
            <Text style={styles.legendText}>Occupé</Text>
          </View>
        </View>
      </View>

      {/* Scrollable content below map */}
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Selected interpreter card */}
        {selected && (
          <View style={styles.selectedCard}>
            <View style={styles.selectedAvatar}>
              <Text style={styles.selectedAvatarText}>
                {selected.name.split(' ').map((n: string) => n[0]).join('')}
              </Text>
            </View>
            <View style={styles.selectedInfo}>
              <Text style={styles.selectedName}>{selected.name}</Text>
              <Text style={styles.selectedSpec}>{selected.specialite}</Text>
              <Text style={styles.selectedMeta}>⭐ {selected.note} · {selected.distance}</Text>
            </View>
            {selected.available && (
              <TouchableOpacity
                style={styles.selectedRdvBtn}
                onPress={() => router.push('/(tabs)/malentendants/rendez-vous')}
                accessibilityRole="button"
              >
                <Text style={styles.selectedRdvText}>RDV</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Main action */}
        <TouchableOpacity
          style={styles.rdvButton}
          onPress={() => router.push('/(tabs)/malentendants/rendez-vous')}
          activeOpacity={0.85}
          accessibilityRole="button"
        >
          <Text style={styles.rdvButtonText}>📅  Prendre un rendez-vous</Text>
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
            <Text style={styles.statValue}>{INTERPRETES_NICE.filter(i => i.available).length}</Text>
            <Text style={styles.statLabel}>Disponibles</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>⭐</Text>
            <Text style={styles.statValue}>4.8</Text>
            <Text style={styles.statLabel}>Note moy.</Text>
          </View>
        </View>

        {/* Interpreter list */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tous les interprètes à Nice</Text>
          {INTERPRETES_NICE.map((interp) => (
            <TouchableOpacity
              key={interp.id}
              style={[styles.interpCard, selected?.id === interp.id && styles.interpCardSelected]}
              onPress={() => setSelected(interp)}
              activeOpacity={0.8}
              accessibilityRole="button"
            >
              <View style={styles.interpAvatar}>
                <Text style={styles.interpAvatarText}>
                  {interp.name.split(' ').map((n) => n[0]).join('')}
                </Text>
              </View>
              <View style={styles.interpInfo}>
                <Text style={styles.interpName}>{interp.name}</Text>
                <Text style={styles.interpSpec}>{interp.specialite}</Text>
                <Text style={styles.interpMeta}>📍 {interp.distance} · ⭐ {interp.note}</Text>
              </View>
              <View style={[styles.dispoBadge, { backgroundColor: interp.available ? Colors.interpretesLight : '#F3F4F6' }]}>
                <Text style={[styles.dispoText, { color: interp.available ? Colors.interpretes : Colors.textSecondary }]}>
                  {interp.available ? 'Dispo.' : 'Occupé'}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.malentendants },

  header: {
    backgroundColor: Colors.malentendants,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  headerTitle: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.white },
  headerSub: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.85)', marginTop: 2 },

  mapWrapper: { height: 240, position: 'relative' },
  mapFallback: {
    flex: 1,
    backgroundColor: '#D4E8F7',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  mapFallbackEmoji: { fontSize: 40 },
  mapFallbackText: { fontSize: FontSize.md, fontWeight: '700', color: Colors.malentendantsDark },
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
  calloutName: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
  calloutSpec: { fontSize: FontSize.sm, color: Colors.textSecondary },
  calloutMeta: { fontSize: FontSize.xs, color: Colors.textSecondary },
  calloutBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.full,
    marginTop: 4,
  },
  calloutBadgeText: { fontSize: FontSize.xs, fontWeight: '600' },

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
    borderColor: Colors.malentendants,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  selectedAvatar: {
    width: 48,
    height: 48,
    borderRadius: Radius.full,
    backgroundColor: Colors.malentendantsLight,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  selectedAvatarText: { fontSize: FontSize.md, fontWeight: '700', color: Colors.malentendants },
  selectedInfo: { flex: 1, gap: 2 },
  selectedName: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
  selectedSpec: { fontSize: FontSize.sm, color: Colors.textSecondary },
  selectedMeta: { fontSize: FontSize.xs, color: Colors.textSecondary },
  selectedRdvBtn: {
    backgroundColor: Colors.malentendants,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    flexShrink: 0,
  },
  selectedRdvText: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.white },

  rdvButton: {
    backgroundColor: Colors.malentendants,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    shadowColor: Colors.malentendants,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  rdvButtonText: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.white },

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
  statValue: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.malentendants },
  statLabel: { fontSize: FontSize.xs, color: Colors.textSecondary, textAlign: 'center' },

  section: { gap: Spacing.sm },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary },
  interpCard: {
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
  interpCardSelected: { borderColor: Colors.malentendants, backgroundColor: Colors.malentendantsLight },
  interpAvatar: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    backgroundColor: Colors.malentendantsLight,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  interpAvatarText: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.malentendants },
  interpInfo: { flex: 1, gap: 2 },
  interpName: { fontSize: FontSize.md, fontWeight: '600', color: Colors.textPrimary },
  interpSpec: { fontSize: FontSize.sm, color: Colors.textSecondary },
  interpMeta: { fontSize: FontSize.xs, color: Colors.textSecondary },
  dispoBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.full,
    flexShrink: 0,
  },
  dispoText: { fontSize: FontSize.xs, fontWeight: '600' },
});
