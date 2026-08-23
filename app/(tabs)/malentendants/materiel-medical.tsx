import { router, useLocalSearchParams } from 'expo-router';
import * as Location from 'expo-location';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { addDoc, collection, getDocs, query, serverTimestamp, where } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useAuth } from '@/context/AuthContext';
import { FontSize, Radius, Spacing } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';
import type { ColorTokens } from '@/constants/design';
import {
  EQUIPMENT_CATEGORIES,
  type HealthProfessional,
  type MedicalEquipmentCategory,
} from '@/data/healthProfessionals';

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

/* ─── Custom hook ────────────────────────────────────────── */

function useEquippedPharmacies() {
  const [pharmacies, setPharmacies] = useState<HealthProfessional[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDocs(
      query(
        collection(db, 'healthProfessionals'),
        where('category', '==', 'pharmacy'),
        where('medicalEquipment.hasEquipment', '==', true),
      ),
    )
      .then((snap) => {
        setPharmacies(
          snap.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              ...data,
              latitude: Number(data.latitude),
              longitude: Number(data.longitude),
            } as HealthProfessional;
          }),
        );
        setLoading(false);
      })
      .catch(() => {
        setPharmacies([]);
        setLoading(false);
      });
  }, []);

  return { pharmacies, loading };
}

/* ─── Report modal ───────────────────────────────────────── */

const ReportModal = memo(function ReportModal({
  pharmacyId,
  pharmacyName,
  onClose,
}: {
  pharmacyId: string;
  pharmacyName: string;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const colors = useThemeColor();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [selected, setSelected] = useState<Set<MedicalEquipmentCategory>>(new Set());
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const toggle = useCallback((cat: MedicalEquipmentCategory) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }, []);

  const submit = useCallback(async () => {
    if (!user || selected.size === 0) return;
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'equipmentReports'), {
        pharmacyId,
        pharmacyName,
        userId: user.id,
        categories: [...selected],
        reportedAt: serverTimestamp(),
      });
      setSubmitted(true);
    } catch {
      Alert.alert('Erreur', "Impossible d'envoyer le signalement. Veuillez réessayer.");
    } finally {
      setSubmitting(false);
    }
  }, [user, pharmacyId, pharmacyName, selected]);

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />

          {submitted ? (
            <View style={styles.successBlock}>
              <Text style={styles.successEmoji}>🎉</Text>
              <Text style={styles.successTitle}>Merci pour votre contribution !</Text>
              <Text style={styles.successSub}>
                Votre signalement pour{' '}
                <Text style={styles.successName}>{pharmacyName}</Text>
                {' '}a bien été enregistré.
              </Text>
              <TouchableOpacity style={styles.successBtn} onPress={onClose}>
                <Text style={styles.successBtnText}>Fermer</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={styles.modalTitle}>📢 Signaler du matériel médical</Text>
              <Text style={styles.modalSub}>{pharmacyName}</Text>
              <Text style={styles.modalHint}>
                Sélectionnez le matériel disponible dans cette pharmacie :
              </Text>

              <View style={styles.catGrid}>
                {EQUIPMENT_CATEGORIES.map((cat) => {
                  const active = selected.has(cat.id);
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      style={[styles.catChip, active && styles.catChipActive]}
                      onPress={() => toggle(cat.id)}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: active }}
                    >
                      <Text style={styles.catChipEmoji}>{cat.emoji}</Text>
                      <Text style={[styles.catChipLabel, active && styles.catChipLabelActive]}>
                        {cat.label}
                      </Text>
                      {active && <Text style={styles.catChipCheck}>✓</Text>}
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TouchableOpacity
                style={[styles.submitBtn, selected.size === 0 && styles.submitBtnDisabled]}
                onPress={submit}
                disabled={submitting || selected.size === 0}
                accessibilityRole="button"
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitBtnText}>
                    {selected.size === 0 ? 'Sélectionnez au moins un type' : 'Envoyer le signalement'}
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                <Text style={styles.cancelBtnText}>Annuler</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
});

/* ─── Pharmacy card ──────────────────────────────────────── */

const PharmacyCard = memo(function PharmacyCard({
  pharmacy,
  distKm,
  onReport,
}: {
  pharmacy: HealthProfessional;
  distKm: number | null;
  onReport: () => void;
}) {
  const colors = useThemeColor();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const cats = pharmacy.medicalEquipment?.categories ?? [];

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardAvatar}>
          <Text style={styles.cardAvatarText}>⚕️</Text>
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardName}>{pharmacy.name}</Text>
          <Text style={styles.cardAddress}>{pharmacy.address}</Text>
          {distKm !== null && (
            <Text style={styles.cardDist}>📏 {distKm.toFixed(1)} km · 🕐 {pharmacy.hours}</Text>
          )}
        </View>
      </View>

      {cats.length > 0 && (
        <View style={styles.catRow}>
          {cats.map((c) => {
            const cfg = EQUIPMENT_CATEGORIES.find((e) => e.id === c);
            return cfg ? (
              <View key={c} style={styles.catPill}>
                <Text style={styles.catPillText}>{cfg.emoji} {cfg.label}</Text>
              </View>
            ) : null;
          })}
        </View>
      )}

      <View style={styles.cardActions}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() =>
            Linking.openURL(
              `https://maps.google.com/?q=${pharmacy.latitude},${pharmacy.longitude}`,
            ).catch(() => {})
          }
          accessibilityRole="button"
          accessibilityLabel={`Itinéraire vers ${pharmacy.name}`}
        >
          <Feather name="map-pin" size={14} color="#2563EB" />
          <Text style={[styles.actionBtnText, { color: '#2563EB' }]}>Itinéraire</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() =>
            Linking.openURL(`tel:${pharmacy.phone}`).catch(() =>
              Alert.alert('Erreur', "Impossible de lancer l'appel."),
            )
          }
          accessibilityRole="button"
          accessibilityLabel={`Appeler ${pharmacy.name}`}
        >
          <Feather name="phone" size={14} color="#16A34A" />
          <Text style={[styles.actionBtnText, { color: '#16A34A' }]}>Appeler</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, styles.actionBtnReport]}
          onPress={onReport}
          accessibilityRole="button"
          accessibilityLabel={`Signaler du matériel dans ${pharmacy.name}`}
        >
          <Feather name="flag" size={14} color="#713F12" />
          <Text style={[styles.actionBtnText, { color: '#713F12' }]}>Signaler</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
});

/* ─── Main screen ────────────────────────────────────────── */

export default function MaterielMedical() {
  const colors = useThemeColor();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const params = useLocalSearchParams<{ reportId?: string; reportName?: string }>();

  const { pharmacies, loading } = useEquippedPharmacies();
  const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [activeFilter, setActiveFilter] = useState<MedicalEquipmentCategory | null>(null);
  const [reportTarget, setReportTarget] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      try {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setUserCoords({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
      } catch {}
    })();
  }, []);

  useEffect(() => {
    if (params.reportId && params.reportName) {
      setReportTarget({ id: params.reportId, name: params.reportName });
    }
  }, [params.reportId, params.reportName]);

  const filtered = useMemo(() => {
    let list = pharmacies;
    if (activeFilter) {
      list = list.filter((p) => p.medicalEquipment?.categories.includes(activeFilter));
    }
    if (userCoords) {
      list = [...list].sort(
        (a, b) =>
          haversineKm(userCoords.latitude, userCoords.longitude, a.latitude, a.longitude) -
          haversineKm(userCoords.latitude, userCoords.longitude, b.latitude, b.longitude),
      );
    }
    return list;
  }, [pharmacies, activeFilter, userCoords]);

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Retour"
        >
          <Feather name="arrow-left" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>⚕️ Matériel médical</Text>
          <Text style={styles.headerSub}>Pharmacies équipées de Nice</Text>
        </View>
      </View>

      {/* Category filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterBar}
        contentContainerStyle={styles.filterBarContent}
      >
        <TouchableOpacity
          style={[styles.filterPill, activeFilter === null && styles.filterPillActive]}
          onPress={() => setActiveFilter(null)}
          accessibilityRole="radio"
          accessibilityState={{ selected: activeFilter === null }}
        >
          <Text style={[styles.filterPillText, activeFilter === null && styles.filterPillTextActive]}>
            Tous
          </Text>
        </TouchableOpacity>
        {EQUIPMENT_CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[styles.filterPill, activeFilter === cat.id && styles.filterPillActive]}
            onPress={() => setActiveFilter(activeFilter === cat.id ? null : cat.id)}
            accessibilityRole="radio"
            accessibilityState={{ selected: activeFilter === cat.id }}
          >
            <Text style={styles.filterPillEmoji}>{cat.emoji}</Text>
            <Text style={[styles.filterPillText, activeFilter === cat.id && styles.filterPillTextActive]}>
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Results count */}
      {!loading && (
        <View style={styles.countBanner}>
          <Text style={styles.countText}>
            <Text style={styles.countNum}>{filtered.length}</Text>
            {` pharmacie${filtered.length !== 1 ? 's' : ''} équipée${filtered.length !== 1 ? 's' : ''}`}
            {activeFilter ? ` · filtre : ${EQUIPMENT_CATEGORIES.find((c) => c.id === activeFilter)?.label}` : ''}
          </Text>
        </View>
      )}

      {/* List */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {loading && (
          <View style={styles.loadingRow}>
            <ActivityIndicator color="#059669" />
            <Text style={styles.loadingText}>Chargement des pharmacies…</Text>
          </View>
        )}

        {!loading && filtered.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🔍</Text>
            <Text style={styles.emptyTitle}>Aucune pharmacie trouvée</Text>
            <Text style={styles.emptySub}>
              {activeFilter
                ? 'Essayez un autre type de matériel ou signalez du matériel via les fiches pharmacie.'
                : "Aucune pharmacie équipée n'est encore enregistrée. Soyez le premier à en signaler !"}
            </Text>
          </View>
        )}

        {filtered.map((p) => (
          <PharmacyCard
            key={p.id}
            pharmacy={p}
            distKm={
              userCoords
                ? haversineKm(userCoords.latitude, userCoords.longitude, p.latitude, p.longitude)
                : null
            }
            onReport={() => setReportTarget({ id: p.id, name: p.name })}
          />
        ))}
      </ScrollView>

      {/* Report modal */}
      {reportTarget && (
        <ReportModal
          pharmacyId={reportTarget.id}
          pharmacyName={reportTarget.name}
          onClose={() => setReportTarget(null)}
        />
      )}
    </SafeAreaView>
  );
}

/* ─── Styles ─────────────────────────────────────────────── */

function createStyles(colors: ColorTokens) {
  const BRAND_EQUIP = '#059669';
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: BRAND_EQUIP },

    header: {
      backgroundColor: BRAND_EQUIP,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.sm,
      paddingBottom: Spacing.md,
      gap: Spacing.md,
    },
    backBtn: {
      width: 36, height: 36, borderRadius: 10,
      backgroundColor: 'rgba(255,255,255,0.2)',
      alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    },
    headerText: { flex: 1 },
    headerTitle: { fontSize: FontSize.xl, fontWeight: '800', color: '#fff' },
    headerSub: { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.85)', marginTop: 2 },

    filterBar: { backgroundColor: BRAND_EQUIP, flexGrow: 0 },
    filterBarContent: {
      paddingHorizontal: Spacing.lg,
      paddingBottom: Spacing.sm,
      gap: Spacing.sm,
      flexDirection: 'row',
    },
    filterPill: {
      flexDirection: 'row', alignItems: 'center', gap: 5,
      paddingHorizontal: 12, paddingVertical: 6,
      borderRadius: Radius.full,
      backgroundColor: 'rgba(255,255,255,0.18)',
      borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.35)',
    },
    filterPillActive: { backgroundColor: '#fff', borderColor: '#fff' },
    filterPillEmoji: { fontSize: 13 },
    filterPillText: { fontSize: FontSize.xs, fontWeight: '700', color: 'rgba(255,255,255,0.9)' },
    filterPillTextActive: { color: BRAND_EQUIP },

    countBanner: {
      backgroundColor: colors.BRAND_TINT,
      paddingHorizontal: Spacing.lg, paddingVertical: 8,
      borderBottomWidth: 1, borderBottomColor: colors.BORDER,
    },
    countText: { fontSize: FontSize.xs, color: colors.INK_2 },
    countNum: { fontWeight: '800', color: BRAND_EQUIP },

    scroll: { flex: 1, backgroundColor: colors.BG },
    scrollContent: { padding: Spacing.lg, paddingBottom: Spacing.xxl, gap: Spacing.md },

    loadingRow: {
      flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
      paddingVertical: Spacing.xl, justifyContent: 'center',
    },
    loadingText: { fontSize: FontSize.sm, color: colors.INK_2 },

    emptyState: { alignItems: 'center', paddingVertical: Spacing.xxl, gap: Spacing.sm },
    emptyEmoji: { fontSize: 44 },
    emptyTitle: { fontSize: FontSize.md, fontWeight: '700', color: colors.INK_1 },
    emptySub: { fontSize: FontSize.sm, color: colors.INK_2, textAlign: 'center', paddingHorizontal: Spacing.lg },

    card: {
      backgroundColor: colors.SURFACE, borderRadius: Radius.lg,
      padding: Spacing.md, gap: Spacing.sm,
      borderWidth: 1.5, borderColor: colors.BORDER,
      shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
    },
    cardHeader: { flexDirection: 'row', gap: Spacing.sm },
    cardAvatar: {
      width: 46, height: 46, borderRadius: Radius.md,
      backgroundColor: '#DCFCE7', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    },
    cardAvatarText: { fontSize: 22 },
    cardInfo: { flex: 1, gap: 2 },
    cardName: { fontSize: FontSize.md, fontWeight: '700', color: colors.INK_1 },
    cardAddress: { fontSize: FontSize.xs, color: colors.INK_2 },
    cardDist: { fontSize: FontSize.xs, color: colors.INK_2, marginTop: 2 },

    catRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
    catPill: {
      backgroundColor: '#DCFCE7', borderRadius: Radius.full,
      paddingHorizontal: Spacing.sm, paddingVertical: 3,
    },
    catPillText: { fontSize: FontSize.xs, color: '#166534', fontWeight: '600' },

    cardActions: { flexDirection: 'row', gap: Spacing.sm, marginTop: 2 },
    actionBtn: {
      flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5,
      paddingVertical: 8, borderRadius: Radius.md,
      backgroundColor: colors.BG, borderWidth: 1.5, borderColor: colors.BORDER,
    },
    actionBtnReport: { backgroundColor: '#FEF9C3', borderColor: '#FDE047' },
    actionBtnText: { fontSize: FontSize.xs, fontWeight: '700' },

    // ── Report modal ──────────────────────────────────────────
    modalOverlay: {
      flex: 1, backgroundColor: 'rgba(0,0,0,0.45)',
      justifyContent: 'flex-end',
    },
    modalSheet: {
      backgroundColor: colors.SURFACE,
      borderTopLeftRadius: 24, borderTopRightRadius: 24,
      padding: Spacing.lg, paddingBottom: Spacing.xxl,
      gap: Spacing.md,
    },
    modalHandle: {
      width: 40, height: 4, backgroundColor: colors.BORDER,
      borderRadius: 2, alignSelf: 'center', marginBottom: Spacing.sm,
    },
    modalTitle: { fontSize: FontSize.lg, fontWeight: '800', color: colors.INK_1 },
    modalSub: { fontSize: FontSize.sm, fontWeight: '600', color: BRAND_EQUIP, marginTop: -8 },
    modalHint: { fontSize: FontSize.sm, color: colors.INK_2 },

    catGrid: { gap: Spacing.sm },
    catChip: {
      flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
      padding: Spacing.sm, borderRadius: Radius.md,
      borderWidth: 1.5, borderColor: colors.BORDER,
      backgroundColor: colors.BG,
    },
    catChipActive: { borderColor: BRAND_EQUIP, backgroundColor: '#DCFCE7' },
    catChipEmoji: { fontSize: 20, width: 28, textAlign: 'center' },
    catChipLabel: { flex: 1, fontSize: FontSize.sm, fontWeight: '600', color: colors.INK_1 },
    catChipLabelActive: { color: '#166534' },
    catChipCheck: { fontSize: 16, color: BRAND_EQUIP, fontWeight: '800' },

    submitBtn: {
      backgroundColor: BRAND_EQUIP, borderRadius: Radius.lg,
      paddingVertical: Spacing.md, alignItems: 'center',
      shadowColor: BRAND_EQUIP, shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
    },
    submitBtnDisabled: { backgroundColor: colors.BORDER, shadowOpacity: 0 },
    submitBtnText: { fontSize: FontSize.md, fontWeight: '700', color: '#fff' },

    cancelBtn: { alignItems: 'center', paddingVertical: Spacing.sm },
    cancelBtnText: { fontSize: FontSize.sm, color: colors.INK_2, fontWeight: '600' },

    successBlock: { alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.lg },
    successEmoji: { fontSize: 52 },
    successTitle: { fontSize: FontSize.xl, fontWeight: '800', color: colors.INK_1, textAlign: 'center' },
    successSub: { fontSize: FontSize.sm, color: colors.INK_2, textAlign: 'center', lineHeight: 22 },
    successName: { fontWeight: '700', color: BRAND_EQUIP },
    successBtn: {
      backgroundColor: BRAND_EQUIP, borderRadius: Radius.lg,
      paddingVertical: Spacing.md, paddingHorizontal: Spacing.xxl,
      marginTop: Spacing.sm,
    },
    successBtnText: { fontSize: FontSize.md, fontWeight: '700', color: '#fff' },
  });
}
