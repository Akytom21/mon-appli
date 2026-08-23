import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { BarChart, LineChart, PieChart } from 'react-native-chart-kit';
import {
  Timestamp,
  collection,
  doc,
  getDocs,
  onSnapshot,
  updateDoc,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { type Role, useAuth } from '@/context/AuthContext';
import { FontSize, Radius, Spacing } from '@/constants/theme';
import type { ColorTokens } from '@/constants/design';
import { useThemeColor } from '@/hooks/use-theme-color';
import { type Appointment } from '@/hooks/useAppointments';
import { type Review } from '@/hooks/useReviews';

/* ── Types ──────────────────────────────────────────────────── */
type AdminTab = 'dashboard' | 'brevets' | 'utilisateurs' | 'stats';

type BrevetUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  brevetSubmitted: boolean;
  brevetValidated: boolean;
  brevetRefused?: boolean;
  brevetRefusalReason?: string;
  brevetLevel?: string;
  brevetOrganisme?: string;
  brevetNumero?: string;
  brevetAnnee?: string;
  certificateUrl?: string;
  createdAt?: Timestamp;
};

/* ── Constants ──────────────────────────────────────────────── */
const SCREEN_W   = Math.round(Dimensions.get('window').width);
const CHART_W    = SCREEN_W - 40;
const TODAY      = new Date().toISOString().split('T')[0];
const CUR_MONTH  = TODAY.slice(0, 7);
const DAY_SHORT  = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

function hexToRgba(hex: string, opacity: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

function getChartConfig(colors: ColorTokens) {
  return {
    backgroundColor: colors.SURFACE,
    backgroundGradientFrom: colors.SURFACE,
    backgroundGradientTo: colors.SURFACE,
    decimalPlaces: 0,
    color: (opacity = 1) => hexToRgba(colors.BRAND, opacity),
    labelColor: (opacity = 1) => hexToRgba(colors.INK_2, opacity),
    propsForDots: { r: '5', strokeWidth: '2', stroke: colors.BRAND_DARK },
    propsForBackgroundLines: { stroke: colors.BORDER, strokeWidth: 1 },
  };
}

const ROLE_CONFIG: Record<Role, { label: string; color: string; bg: string }> = {
  sourd:      { label: 'Sourd',      color: '#1D4ED8', bg: '#DBEAFE' },
  interprete: { label: 'Interprète', color: '#065F46', bg: '#D1FAE5' },
  apprenti:   { label: 'Apprenti',   color: '#92400E', bg: '#FEF3C7' },
  admin:      { label: 'Admin',      color: '#991B1B', bg: '#FEE2E2' },
};

const ROLES: Role[] = ['sourd', 'interprete', 'apprenti', 'admin'];

const TYPE_LABELS: Record<string, string> = {
  generaliste: 'Généraliste',
  urgences:    'Urgences',
  specialiste: 'Spécialiste',
  pharmacie:   'Pharmacie',
};

/* ── Firestore helpers ──────────────────────────────────────── */
async function validateBrevet(userId: string) {
  await updateDoc(doc(db, 'users', userId), {
    brevetValidated: true, brevetRefused: false, brevetRefusalReason: '',
  });
}

async function refuseBrevet(userId: string, reason: string) {
  await updateDoc(doc(db, 'users', userId), {
    brevetRefused: true, brevetValidated: false, brevetRefusalReason: reason,
  });
}

async function changeUserRole(userId: string, role: Role) {
  await updateDoc(doc(db, 'users', userId), { role });
}

/* ── CSV helpers ────────────────────────────────────────────── */
function buildUsersCSV(users: BrevetUser[]): string {
  const header = 'Nom,Email,Rôle,Date inscription,Statut brevet';
  const rows = users.map((u) => {
    const date   = u.createdAt
      ? new Date(u.createdAt.toMillis()).toLocaleDateString('fr-FR')
      : '-';
    const brevet = u.brevetValidated
      ? 'Validé'
      : u.brevetRefused
      ? 'Refusé'
      : u.brevetSubmitted
      ? 'En attente'
      : 'Aucun';
    return `"${u.name}","${u.email}","${u.role}","${date}","${brevet}"`;
  });
  return [header, ...rows].join('\n');
}

function buildAppointmentsCSV(appointments: Appointment[]): string {
  const header = 'Date,Heure,Type,Statut,Patient,Interprète';
  const rows = appointments.map((a) =>
    `"${a.date}","${a.time}","${TYPE_LABELS[a.type] ?? a.type}","${a.status}","${a.patientName}","${a.interpreterName ?? '-'}"`,
  );
  return [header, ...rows].join('\n');
}

async function shareCSV(csv: string, title: string) {
  try {
    await Share.share({ message: csv, title });
  } catch {}
}

/* ── Chart data helpers ─────────────────────────────────────── */
function getLast7DaysDates(): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });
}

function getLast7DaysLabels(): string[] {
  return getLast7DaysDates().map((dt) => DAY_SHORT[new Date(dt + 'T12:00:00').getDay()]);
}

function getLast7DaysCounts(appointments: Appointment[]): number[] {
  const dates = getLast7DaysDates();
  return dates.map((dt) => appointments.filter((a) => a.date === dt).length);
}

/* ── KpiCard ────────────────────────────────────────────────── */
function KpiCard({
  label, value, icon, color, sub,
}: {
  label: string; value: number | string; icon: string; color: string; sub?: string;
}) {
  const colors = useThemeColor();
  const kpi = useMemo(() => createKpiStyles(colors), [colors]);
  return (
    <View style={[kpi.card, { borderTopColor: color }]}>
      <View style={[kpi.iconWrap, { backgroundColor: color + '1A' }]}>
        <Feather name={icon as never} size={16} color={color} />
      </View>
      <Text style={[kpi.value, { color }]}>{value}</Text>
      <Text style={kpi.label}>{label}</Text>
      {!!sub && <Text style={kpi.sub}>{sub}</Text>}
    </View>
  );
}

function createKpiStyles(colors: ColorTokens) {
  return StyleSheet.create({
    card: {
      flex: 1, minWidth: '45%',
      backgroundColor: colors.SURFACE,
      borderRadius: Radius.md, padding: Spacing.md,
      borderWidth: 1, borderColor: colors.BORDER, borderTopWidth: 3,
      gap: 3,
      shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
    },
    iconWrap: {
      width: 34, height: 34, borderRadius: 10,
      alignItems: 'center', justifyContent: 'center', marginBottom: 4,
    },
    value: { fontSize: FontSize.xxl, fontWeight: '800', letterSpacing: -0.5 },
    label: { fontSize: FontSize.sm, color: colors.INK_2, fontWeight: '500' },
    sub:   { fontSize: 11, color: colors.INK_2 },
  });
}

/* ── ChartCard wrapper ──────────────────────────────────────── */
function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  const colors = useThemeColor();
  const cc = useMemo(() => createCcStyles(colors), [colors]);
  return (
    <View style={cc.card}>
      <Text style={cc.title}>{title}</Text>
      {children}
    </View>
  );
}

function createCcStyles(colors: ColorTokens) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.SURFACE, borderRadius: Radius.md,
      padding: Spacing.md, borderWidth: 1, borderColor: colors.BORDER,
      shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05, shadowRadius: 6, elevation: 2, gap: 12,
    },
    title: { fontSize: FontSize.md, fontWeight: '700', color: colors.INK_1 },
  });
}

/* ── RoleBadge ──────────────────────────────────────────────── */
function RoleBadge({ role }: { role: Role }) {
  const cfg = ROLE_CONFIG[role];
  return (
    <View style={[badgeStyles.badge, { backgroundColor: cfg.bg }]}>
      <Text style={[badgeStyles.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
}

/* Styles sans dépendance de thème — la couleur vient de ROLE_CONFIG. */
const badgeStyles = StyleSheet.create({
  badge:     { borderRadius: Radius.full, paddingHorizontal: Spacing.sm, paddingVertical: 3, alignSelf: 'flex-start' },
  badgeText: { fontSize: FontSize.xs, fontWeight: '700' },
});

/* ── RefusalModal ───────────────────────────────────────────── */
function RefusalModal({
  visible, userName, onCancel, onConfirm,
}: {
  visible: boolean; userName: string; onCancel: () => void; onConfirm: (reason: string) => void;
}) {
  const colors = useThemeColor();
  const mStyles = useMemo(() => createModalStyles(colors), [colors]);
  const [reason, setReason] = useState('');
  useEffect(() => { if (visible) setReason(''); }, [visible]);
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={mStyles.modalOverlay}
      >
        <View style={mStyles.modalCard}>
          <Text style={mStyles.modalTitle}>Refuser le brevet</Text>
          <Text style={mStyles.modalSubtitle}>Apprenti : {userName}</Text>
          <Text style={mStyles.modalLabel}>Raison du refus (optionnel)</Text>
          <TextInput
            style={mStyles.textInput}
            placeholder="Ex : Document illisible, brevet expiré…"
            placeholderTextColor={colors.INK_2}
            value={reason}
            onChangeText={setReason}
            multiline
            numberOfLines={3}
          />
          <View style={mStyles.modalActions}>
            <TouchableOpacity style={mStyles.btnCancel} onPress={onCancel}>
              <Text style={mStyles.btnCancelText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity style={mStyles.btnDanger} onPress={() => onConfirm(reason)}>
              <Text style={mStyles.btnWhiteText}>Confirmer le refus</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

/* ── RoleModal ──────────────────────────────────────────────── */
function RoleModal({
  visible, user, onCancel, onConfirm,
}: {
  visible: boolean; user: BrevetUser | null; onCancel: () => void; onConfirm: (role: Role) => void;
}) {
  const colors = useThemeColor();
  const mStyles = useMemo(() => createModalStyles(colors), [colors]);
  if (!user) return null;
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={mStyles.modalOverlay}>
        <View style={mStyles.modalCard}>
          <Text style={mStyles.modalTitle}>Changer le rôle</Text>
          <Text style={mStyles.modalSubtitle}>{user.name}</Text>
          {ROLES.map((r) => {
            const cfg = ROLE_CONFIG[r];
            const active = r === user.role;
            return (
              <TouchableOpacity
                key={r}
                style={[mStyles.roleOption, active && { borderColor: cfg.color, borderWidth: 2 }]}
                onPress={() => onConfirm(r)}
              >
                <View style={[badgeStyles.badge, { backgroundColor: cfg.bg }]}>
                  <Text style={[badgeStyles.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
                </View>
                {active && <Text style={[mStyles.activeCheck, { color: cfg.color }]}>✓ Actuel</Text>}
              </TouchableOpacity>
            );
          })}
          <TouchableOpacity
            style={[mStyles.btnCancel, { marginTop: Spacing.sm }]}
            onPress={onCancel}
          >
            <Text style={mStyles.btnCancelText}>Annuler</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function createModalStyles(colors: ColorTokens) {
  return StyleSheet.create({
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: Spacing.md },
    modalCard:    { backgroundColor: colors.SURFACE, borderRadius: Radius.lg, padding: Spacing.lg },
    modalTitle:   { fontSize: FontSize.lg, fontWeight: '700', color: colors.INK_1, marginBottom: Spacing.xs },
    modalSubtitle:{ fontSize: FontSize.sm, color: colors.INK_2, marginBottom: Spacing.md },
    modalLabel:   { fontSize: FontSize.sm, fontWeight: '600', color: colors.INK_1, marginBottom: Spacing.xs },
    textInput: {
      borderWidth: 1, borderColor: colors.BORDER, borderRadius: Radius.sm,
      padding: Spacing.sm, fontSize: FontSize.sm, color: colors.INK_1,
      minHeight: 80, textAlignVertical: 'top', marginBottom: Spacing.md,
    },
    modalActions: { flexDirection: 'row', gap: Spacing.sm },
    btnCancel:    { flex: 1, borderWidth: 1, borderColor: colors.BORDER, borderRadius: Radius.sm, paddingVertical: Spacing.sm, alignItems: 'center' },
    btnCancelText:{ color: colors.INK_2, fontWeight: '600', fontSize: FontSize.sm },
    btnDanger:    { flex: 1, backgroundColor: colors.ERROR, borderRadius: Radius.sm, paddingVertical: Spacing.sm, alignItems: 'center' },
    btnWhiteText: { color: '#fff', fontWeight: '700', fontSize: FontSize.sm },
    roleOption: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      padding: Spacing.sm, borderRadius: Radius.sm,
      borderWidth: 1, borderColor: colors.BORDER, marginBottom: Spacing.xs,
    },
    activeCheck: { fontSize: FontSize.sm, fontWeight: '700' },
  });
}

/* ── AdminScreen ────────────────────────────────────────────── */
export default function AdminScreen() {
  const { logout } = useAuth();
  const colors = useThemeColor();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const chartCfg = useMemo(() => getChartConfig(colors), [colors]);
  const [tab, setTab]               = useState<AdminTab>('dashboard');
  const [users, setUsers]           = useState<BrevetUser[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [reviews, setReviews]       = useState<Review[]>([]);
  const [loading, setLoading]       = useState(true);
  const [loadingAppts, setLoadingAppts] = useState(true);
  const [refusalTarget, setRefusalTarget] = useState<BrevetUser | null>(null);
  const [roleTarget, setRoleTarget]   = useState<BrevetUser | null>(null);

  /* ── Users real-time ── */
  useEffect(() => {
    return onSnapshot(collection(db, 'users'), (snap) => {
      setUsers(snap.docs.map((d) => ({ id: d.id, ...d.data() } as BrevetUser)));
      setLoading(false);
    });
  }, []);

  /* ── Appointments + reviews one-shot (for charts & stats) ── */
  const fetchAppointments = useCallback(async () => {
    setLoadingAppts(true);
    try {
      const [apptSnap, reviewSnap] = await Promise.all([
        getDocs(collection(db, 'appointments')),
        getDocs(collection(db, 'reviews')),
      ]);
      setAppointments(apptSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Appointment)));
      setReviews(reviewSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Review)));
    } catch {}
    setLoadingAppts(false);
  }, []);

  useEffect(() => { fetchAppointments(); }, [fetchAppointments]);

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAppointments();
    setRefreshing(false);
  }, [fetchAppointments]);

  /* ── Derived data ── */
  const pendingBrevets = users.filter(
    (u) => u.brevetSubmitted && !u.brevetValidated && !u.brevetRefused,
  );

  const rdvThisMonth   = appointments.filter((a) => a.date.startsWith(CUR_MONTH)).length;
  const accepted       = appointments.filter((a) => a.status === 'accepted').length;
  const declined       = appointments.filter((a) => a.status === 'declined').length;
  const acceptRate     = (accepted + declined) > 0
    ? `${Math.round((accepted / (accepted + declined)) * 100)}%`
    : '—';

  /* Line chart */
  const line7 = getLast7DaysCounts(appointments);
  const line7Labels = getLast7DaysLabels();
  // react-native-chart-kit crashes with all-zero data, add tiny epsilon
  const line7Safe = line7.every((v) => v === 0) ? line7.map(() => 0.01) : line7;

  /* Bar chart — RDV par type */
  const typeKeys: Array<'generaliste' | 'urgences' | 'specialiste' | 'pharmacie'> =
    ['generaliste', 'urgences', 'specialiste', 'pharmacie'];
  const barData  = typeKeys.map((k) => appointments.filter((a) => a.type === k).length);
  const barSafe  = barData.every((v) => v === 0) ? barData.map(() => 0.01) : barData;

  /* Pie chart — répartition rôles */
  const roleCounts = {
    sourd:      users.filter((u) => u.role === 'sourd').length,
    interprete: users.filter((u) => u.role === 'interprete').length,
    apprenti:   users.filter((u) => u.role === 'apprenti').length,
  };
  const totalRoles = roleCounts.sourd + roleCounts.interprete + roleCounts.apprenti;
  const pieData = [
    { name: 'Sourds',      population: Math.max(roleCounts.sourd, 0.01),      color: '#1D4ED8', legendFontColor: colors.INK_2, legendFontSize: 12 },
    { name: 'Interprètes', population: Math.max(roleCounts.interprete, 0.01), color: '#059669', legendFontColor: colors.INK_2, legendFontSize: 12 },
    { name: 'Apprentis',   population: Math.max(roleCounts.apprenti, 0.01),   color: '#D97706', legendFontColor: colors.INK_2, legendFontSize: 12 },
  ];

  /* ── Handlers ── */
  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Voulez-vous vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Déconnexion', style: 'destructive', onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
        }},
      ],
    );
  };

  const handleValidate = useCallback((u: BrevetUser) => {
    Alert.alert('Valider le brevet', `Valider le brevet de ${u.name} ?`, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Valider ✓', onPress: async () => {
        try { await validateBrevet(u.id); }
        catch { Alert.alert('Erreur', 'Impossible de valider le brevet.'); }
      }},
    ]);
  }, []);

  const confirmRefusal = async (reason: string) => {
    if (!refusalTarget) return;
    try { await refuseBrevet(refusalTarget.id, reason); }
    catch { Alert.alert('Erreur', 'Impossible de refuser le brevet.'); }
    setRefusalTarget(null);
  };

  const confirmRoleChange = async (role: Role) => {
    if (!roleTarget) return;
    try { await changeUserRole(roleTarget.id, role); }
    catch { Alert.alert('Erreur', 'Impossible de changer le rôle.'); }
    setRoleTarget(null);
  };

  /* ── Render cards ── */
  const renderBrevetCard = useCallback(({ item: u }: { item: BrevetUser }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.cardName}>{u.name}</Text>
          <Text style={styles.cardEmail}>{u.email}</Text>
        </View>
        <RoleBadge role={u.role} />
      </View>
      {u.brevetLevel && (
        <View style={styles.brevetInfo}>
          <Text style={styles.brevetDetail}>Niveau : {u.brevetLevel}</Text>
          {u.brevetOrganisme && <Text style={styles.brevetDetail}>Organisme : {u.brevetOrganisme}</Text>}
          {u.brevetNumero    && <Text style={styles.brevetDetail}>N° : {u.brevetNumero}</Text>}
          {u.brevetAnnee     && <Text style={styles.brevetDetail}>Année : {u.brevetAnnee}</Text>}
        </View>
      )}
      {u.certificateUrl && (
        <TouchableOpacity
          style={styles.certBtn}
          onPress={() => Linking.openURL(u.certificateUrl!)}
        >
          <Feather name="paperclip" size={14} color={colors.BRAND} />
          <Text style={styles.certBtnText}>Voir le certificat</Text>
          <Feather name="external-link" size={13} color={colors.BRAND} />
        </TouchableOpacity>
      )}
      <View style={styles.cardActions}>
        <TouchableOpacity style={styles.btnSuccess} onPress={() => handleValidate(u)}>
          <Text style={styles.btnWhiteText}>Valider ✓</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnDanger} onPress={() => setRefusalTarget(u)}>
          <Text style={styles.btnWhiteText}>Refuser ✗</Text>
        </TouchableOpacity>
      </View>
    </View>
  ), [handleValidate, styles, colors]);

  const renderUserCard = useCallback(({ item: u }: { item: BrevetUser }) => {
    const brevetStatus = u.brevetValidated
      ? '✓ Brevet validé'
      : u.brevetRefused
      ? '✗ Brevet refusé'
      : u.brevetSubmitted
      ? '⏳ En attente'
      : null;
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1, marginRight: Spacing.sm }}>
            <Text style={styles.cardName}>{u.name}</Text>
            <Text style={styles.cardEmail}>{u.email}</Text>
            {brevetStatus && (
              <Text style={[
                styles.brevetStatus,
                u.brevetValidated ? { color: '#065F46' }
                  : u.brevetRefused ? { color: '#991B1B' }
                  : { color: '#92400E' },
              ]}>
                {brevetStatus}
              </Text>
            )}
          </View>
          <TouchableOpacity onPress={() => setRoleTarget(u)}>
            <RoleBadge role={u.role} />
            <Text style={styles.changeRoleHint}>Changer →</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }, [styles]);

  /* ── Dashboard tab ── */
  const renderDashboard = () => (
    <ScrollView
      contentContainerStyle={styles.dashContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0F766E" colors={['#0F766E']} />
      }
    >
      {/* KPI row */}
      <View style={styles.kpiRow}>
        <KpiCard
          label="Utilisateurs"
          value={users.length}
          icon="users"
          color="#1D4ED8"
        />
        <KpiCard
          label="RDV ce mois"
          value={rdvThisMonth}
          icon="calendar"
          color={colors.BRAND}
        />
      </View>
      <View style={styles.kpiRow}>
        <KpiCard
          label="Taux acceptation"
          value={acceptRate}
          icon="check-circle"
          color="#059669"
          sub={`${accepted} acceptés / ${accepted + declined} traités`}
        />
        <KpiCard
          label="Brevets en attente"
          value={pendingBrevets.length}
          icon="award"
          color="#D97706"
        />
      </View>

      {/* Refresh + Export RDV */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={styles.refreshBtn}
          onPress={fetchAppointments}
          disabled={loadingAppts}
        >
          {loadingAppts
            ? <ActivityIndicator size="small" color={colors.BRAND} />
            : <Feather name="refresh-cw" size={14} color={colors.BRAND} />
          }
          <Text style={styles.refreshBtnText}>
            {loadingAppts ? 'Chargement…' : 'Actualiser'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.exportBtn}
          onPress={() => shareCSV(buildAppointmentsCSV(appointments), 'RDV_PharmaSign.csv')}
        >
          <Feather name="download" size={14} color="#fff" />
          <Text style={styles.exportBtnText}>Exporter RDV</Text>
        </TouchableOpacity>
      </View>

      {loadingAppts ? (
        <View style={styles.chartLoading}>
          <ActivityIndicator size="large" color={colors.BRAND} />
          <Text style={styles.chartLoadingTxt}>Chargement des données…</Text>
        </View>
      ) : (
        <>
          {/* Line chart — RDV 7 jours */}
          <ChartCard title={`RDV des 7 derniers jours (total : ${appointments.length})`}>
            <LineChart
              data={{
                labels: line7Labels,
                datasets: [{ data: line7Safe, strokeWidth: 2.5 }],
              }}
              width={CHART_W - 32}
              height={180}
              chartConfig={chartCfg}
              bezier
              fromZero
              style={styles.chart}
              withInnerLines
              withOuterLines={false}
              withVerticalLabels
              withHorizontalLabels
            />
          </ChartCard>

          {/* Bar chart — RDV par type */}
          <ChartCard title="RDV par type de consultation">
            <BarChart
              data={{
                labels: ['Géné.', 'Urg.', 'Spec.', 'Pharm.'],
                datasets: [{ data: barSafe }],
              }}
              width={CHART_W - 32}
              height={180}
              chartConfig={{
                ...chartCfg,
                color: (opacity = 1) => `rgba(15, 118, 110, ${opacity})`,
                barPercentage: 0.65,
              }}
              fromZero
              showBarTops={false}
              style={styles.chart}
              yAxisLabel=""
              yAxisSuffix=""
            />
          </ChartCard>

          {/* Pie chart — répartition rôles */}
          <ChartCard title={`Répartition des rôles (${totalRoles} membres)`}>
            {totalRoles === 0 ? (
              <View style={styles.chartEmpty}>
                <Text style={styles.chartEmptyTxt}>Aucun utilisateur enregistré</Text>
              </View>
            ) : (
              <PieChart
                data={pieData}
                width={CHART_W - 32}
                height={180}
                chartConfig={chartCfg}
                accessor="population"
                backgroundColor="transparent"
                paddingLeft="10"
                style={styles.chart}
                hasLegend
              />
            )}
          </ChartCard>
        </>
      )}
    </ScrollView>
  );

  /* ── Stats tab ── */
  const renderStats = () => {
    const statsData = {
      total: users.length,
      sourds: users.filter((u) => u.role === 'sourd').length,
      interpretes: users.filter((u) => u.role === 'interprete').length,
      apprentis: users.filter((u) => u.role === 'apprenti').length,
      brevetsPending: pendingBrevets.length,
      brevetsValidated: users.filter((u) => u.brevetValidated).length,
      brevetsRefused: users.filter((u) => u.brevetRefused).length,
      rdvTotal: appointments.length,
    };

    const globalAvg = reviews.length > 0
      ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
      : '—';

    const topInterp = (() => {
      if (!reviews.length) return '—';
      const avgByInterp: Record<string, { sum: number; count: number }> = {};
      for (const r of reviews) {
        if (!avgByInterp[r.interpreterId]) avgByInterp[r.interpreterId] = { sum: 0, count: 0 };
        avgByInterp[r.interpreterId].sum   += r.rating;
        avgByInterp[r.interpreterId].count += 1;
      }
      const best = Object.entries(avgByInterp)
        .map(([id, v]) => ({ id, avg: v.sum / v.count }))
        .sort((a, b) => b.avg - a.avg)[0];
      if (!best) return '—';
      const found = users.find((u) => u.id === best.id);
      return found ? `${found.name.split(' ')[0]} — ${best.avg.toFixed(1)}★` : best.avg.toFixed(1) + '★';
    })();

    return (
      <ScrollView contentContainerStyle={styles.list}>
        <Text style={styles.sectionTitle}>Utilisateurs</Text>
        <View style={styles.statsGrid}>
          <StatBox label="Total"       value={statsData.total}       color={colors.BRAND} />
          <StatBox label="Sourds"      value={statsData.sourds}      color="#1D4ED8" />
          <StatBox label="Interprètes" value={statsData.interpretes} color="#065F46" />
          <StatBox label="Apprentis"   value={statsData.apprentis}   color="#92400E" />
        </View>
        <Text style={[styles.sectionTitle, { marginTop: Spacing.lg }]}>Brevets LSF</Text>
        <View style={styles.statsGrid}>
          <StatBox label="En attente" value={statsData.brevetsPending}   color="#92400E" />
          <StatBox label="Validés"    value={statsData.brevetsValidated} color="#065F46" />
          <StatBox label="Refusés"    value={statsData.brevetsRefused}   color="#991B1B" />
        </View>
        <Text style={[styles.sectionTitle, { marginTop: Spacing.lg }]}>Rendez-vous</Text>
        <View style={styles.statsGrid}>
          <StatBox label="Total RDV"   value={statsData.rdvTotal}    color={colors.BRAND} />
          <StatBox label="Acceptés"    value={accepted}              color="#059669" />
          <StatBox label="Ce mois"     value={rdvThisMonth}          color="#1D4ED8" />
        </View>
        <Text style={[styles.sectionTitle, { marginTop: Spacing.lg }]}>Avis interprètes</Text>
        <View style={styles.statsGrid}>
          <StatBox label="Total avis"      value={reviews.length} color="#F59E0B" />
          <StatBox label="Note moy. glob." value={globalAvg}      color="#F59E0B" />
        </View>
        {reviews.length > 0 && (
          <View style={styles.topInterpCard}>
            <Text style={styles.topInterpLabel}>Meilleur interprète</Text>
            <Text style={styles.topInterpValue}>{topInterp}</Text>
          </View>
        )}
      </ScrollView>
    );
  };

  /* ── Main render ── */
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Administration</Text>
          <Text style={styles.headerSubtitle}>PharmaSign</Text>
        </View>
        <View style={styles.headerRight}>
          {pendingBrevets.length > 0 && (
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>{pendingBrevets.length}</Text>
            </View>
          )}
          <TouchableOpacity
            onPress={handleLogout}
            style={styles.logoutBtn}
            accessibilityLabel="Déconnexion"
          >
            <Feather name="log-out" size={20} color={"#fff"} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabsScroll}
        contentContainerStyle={styles.tabsContent}
      >
        {([
          { id: 'dashboard',    label: 'Dashboard'    },
          { id: 'brevets',      label: 'Brevets',       count: pendingBrevets.length },
          { id: 'utilisateurs', label: 'Utilisateurs'  },
          { id: 'stats',        label: 'Statistiques'  },
        ] as { id: AdminTab; label: string; count?: number }[]).map(({ id, label, count }) => (
          <TouchableOpacity
            key={id}
            style={[styles.tab, tab === id && styles.tabActive]}
            onPress={() => setTab(id)}
          >
            <Text style={[styles.tabText, tab === id && styles.tabTextActive]}>
              {label}
            </Text>
            {!!count && (
              <View style={styles.tabBadge}>
                <Text style={styles.tabBadgeText}>{count}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Content */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.BRAND} />
        </View>
      ) : tab === 'dashboard' ? (
        renderDashboard()
      ) : tab === 'brevets' ? (
        pendingBrevets.length === 0 ? (
          <View style={styles.center}>
            <Text style={styles.emptyIcon}>✅</Text>
            <Text style={styles.emptyTitle}>Aucun brevet en attente</Text>
            <Text style={styles.emptyText}>Tous les brevets ont été traités.</Text>
          </View>
        ) : (
          <FlatList
            data={pendingBrevets}
            keyExtractor={(u) => u.id}
            renderItem={renderBrevetCard}
            contentContainerStyle={styles.list}
          />
        )
      ) : tab === 'utilisateurs' ? (
        <View style={{ flex: 1 }}>
          <View style={styles.listHeader}>
            <Text style={styles.listHeaderTxt}>{users.length} utilisateur{users.length !== 1 ? 's' : ''}</Text>
            <TouchableOpacity
              style={styles.exportBtn}
              onPress={() => shareCSV(buildUsersCSV(users), 'Utilisateurs_PharmaSign.csv')}
            >
              <Feather name="download" size={14} color="#fff" />
              <Text style={styles.exportBtnText}>Exporter CSV</Text>
            </TouchableOpacity>
          </View>
          {users.length === 0 ? (
            <View style={styles.center}>
              <Text style={styles.emptyTitle}>Aucun utilisateur</Text>
            </View>
          ) : (
            <FlatList
              data={users}
              keyExtractor={(u) => u.id}
              renderItem={renderUserCard}
              contentContainerStyle={styles.list}
            />
          )}
        </View>
      ) : (
        renderStats()
      )}

      <RefusalModal
        visible={!!refusalTarget}
        userName={refusalTarget?.name ?? ''}
        onCancel={() => setRefusalTarget(null)}
        onConfirm={confirmRefusal}
      />
      <RoleModal
        visible={!!roleTarget}
        user={roleTarget}
        onCancel={() => setRoleTarget(null)}
        onConfirm={confirmRoleChange}
      />
    </SafeAreaView>
  );
}

/* ── StatBox ────────────────────────────────────────────────── */
function StatBox({ label, value, color }: { label: string; value: number | string; color: string }) {
  const colors = useThemeColor();
  const s = useMemo(() => createStatBoxStyles(colors), [colors]);
  return (
    <View style={[s.statBox, { borderLeftColor: color }]}>
      <Text style={[s.statValue, { color }]}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

function createStatBoxStyles(colors: ColorTokens) {
  return StyleSheet.create({
    statBox: {
      flex: 1, minWidth: '45%',
      backgroundColor: colors.SURFACE, borderRadius: Radius.md, padding: Spacing.md,
      borderWidth: 1, borderColor: colors.BORDER, borderLeftWidth: 4,
    },
    statValue: { fontSize: FontSize.xxl, fontWeight: '800' },
    statLabel: { fontSize: FontSize.sm, color: colors.INK_2, marginTop: 2 },
  });
}

/* ── Styles ─────────────────────────────────────────────────── */
function createStyles(colors: ColorTokens) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.BG },

    /* Header */
    header: {
      backgroundColor: colors.BRAND,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
    },
    headerTitle:    { color: '#fff', fontSize: FontSize.xl, fontWeight: '700' },
    headerSubtitle: { color: 'rgba(255,255,255,0.8)', fontSize: FontSize.sm },
    headerRight:    { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    logoutBtn: {
      width: 36, height: 36, borderRadius: Radius.sm,
      backgroundColor: 'rgba(255,255,255,0.18)',
      alignItems: 'center', justifyContent: 'center',
    },
    headerBadge: {
      backgroundColor: '#EF4444', borderRadius: Radius.full,
      minWidth: 28, height: 28,
      alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xs,
    },
    headerBadgeText: { color: '#fff', fontWeight: '700', fontSize: FontSize.sm },

    /* Tabs (scrollable) */
    tabsScroll:   { flexGrow: 0, backgroundColor: colors.BRAND_TINT, borderBottomWidth: 1, borderBottomColor: colors.BORDER },
    tabsContent:  { flexDirection: 'row', paddingHorizontal: 4 },
    tab: {
      flexDirection: 'row', alignItems: 'center', gap: 5,
      paddingVertical: Spacing.sm + 2, paddingHorizontal: Spacing.md,
    },
    tabActive:     { borderBottomWidth: 2, borderBottomColor: colors.BRAND },
    tabText:       { fontSize: FontSize.sm, color: colors.INK_2, fontWeight: '500' },
    tabTextActive: { color: colors.BRAND, fontWeight: '700' },
    tabBadge: {
      backgroundColor: '#EF4444', borderRadius: Radius.full,
      minWidth: 18, height: 18,
      alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4,
    },
    tabBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },

    center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
    list:   { padding: Spacing.md, gap: Spacing.sm, paddingBottom: Spacing.xxl },

    emptyIcon:  { fontSize: 48, marginBottom: Spacing.sm },
    emptyTitle: { fontSize: FontSize.lg, fontWeight: '700', color: colors.INK_1, marginBottom: Spacing.xs },
    emptyText:  { fontSize: FontSize.sm, color: colors.INK_2, textAlign: 'center' },

    /* Card (brevet / user) */
    card: {
      backgroundColor: colors.SURFACE, borderRadius: Radius.md,
      padding: Spacing.md,
      borderWidth: 1, borderColor: colors.BORDER,
      shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06, shadowRadius: 3, elevation: 2,
    },
    cardHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    cardName:    { fontSize: FontSize.md, fontWeight: '700', color: colors.INK_1 },
    cardEmail:   { fontSize: FontSize.xs, color: colors.INK_2, marginTop: 2 },
    brevetInfo:  { marginTop: Spacing.sm, backgroundColor: colors.BRAND_TINT, borderRadius: Radius.sm, padding: Spacing.sm, gap: 2 },
    brevetDetail:{ fontSize: FontSize.sm, color: colors.INK_1 },
    brevetStatus:{ fontSize: FontSize.xs, fontWeight: '600', marginTop: 4 },
    certBtn: {
      flexDirection: 'row', alignItems: 'center', gap: Spacing.xs,
      alignSelf: 'flex-start', backgroundColor: colors.BRAND_TINT,
      borderRadius: Radius.sm, paddingHorizontal: Spacing.sm, paddingVertical: 6,
      marginTop: Spacing.xs, borderWidth: 1, borderColor: colors.BRAND + '40',
    },
    certBtnText:    { fontSize: FontSize.sm, fontWeight: '600', color: colors.BRAND },
    cardActions:    { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md },
    changeRoleHint: { fontSize: 10, color: colors.INK_2, textAlign: 'center', marginTop: 2 },

    /* Buttons */
    btnSuccess:  { flex: 1, backgroundColor: colors.SUCCESS, borderRadius: Radius.sm, paddingVertical: Spacing.sm, alignItems: 'center' },
    btnDanger:   { flex: 1, backgroundColor: colors.ERROR, borderRadius: Radius.sm, paddingVertical: Spacing.sm, alignItems: 'center' },
    btnWhiteText:{ color: '#fff', fontWeight: '700', fontSize: FontSize.sm },

    /* Stats tab */
    sectionTitle: { fontSize: FontSize.lg, fontWeight: '700', color: colors.INK_1, marginBottom: Spacing.sm },
    statsGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
    topInterpCard: {
      backgroundColor: '#FFFBEB', borderRadius: Radius.md, padding: Spacing.md,
      borderWidth: 1, borderColor: '#FDE68A', marginTop: Spacing.sm,
    },
    topInterpLabel: { fontSize: FontSize.sm, fontWeight: '700', color: '#92400E', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 4 },
    topInterpValue: { fontSize: FontSize.lg, fontWeight: '800', color: '#B45309' },

    /* Dashboard */
    dashContent:  { padding: 20, gap: 14, paddingBottom: 48 },
    kpiRow:       { flexDirection: 'row', gap: 10 },
    actionRow:    { flexDirection: 'row', gap: 10, alignItems: 'center' },
    refreshBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      paddingHorizontal: 14, paddingVertical: 9, borderRadius: Radius.sm,
      borderWidth: 1.5, borderColor: colors.BORDER, backgroundColor: colors.SURFACE, flex: 1,
      justifyContent: 'center',
    },
    refreshBtnText: { fontSize: FontSize.sm, fontWeight: '600', color: colors.BRAND },
    chart: { borderRadius: 8, alignSelf: 'center' },
    chartLoading: { paddingVertical: 60, alignItems: 'center', gap: 12 },
    chartLoadingTxt: { fontSize: FontSize.sm, color: colors.INK_2 },
    chartEmpty: { paddingVertical: 30, alignItems: 'center' },
    chartEmptyTxt: { fontSize: FontSize.sm, color: colors.INK_2, fontStyle: 'italic' },

    /* Users list header */
    listHeader: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: Spacing.md, paddingVertical: 10,
      backgroundColor: colors.BRAND_TINT,
      borderBottomWidth: 1, borderBottomColor: colors.BORDER,
    },
    listHeaderTxt: { fontSize: FontSize.sm, color: colors.INK_2, fontWeight: '500' },

    /* Export button */
    exportBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      paddingHorizontal: 14, paddingVertical: 9, borderRadius: Radius.sm,
      backgroundColor: colors.BRAND,
      shadowColor: colors.BRAND, shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.3, shadowRadius: 6, elevation: 4,
    },
    exportBtnText: { fontSize: FontSize.sm, fontWeight: '700', color: '#fff' },
  });
}
