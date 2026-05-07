import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { collection, doc, getDocs, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { Role } from '@/context/AuthContext';
import { Colors, FontSize, Radius, Spacing } from '@/constants/theme';

type AdminTab = 'brevets' | 'utilisateurs' | 'stats';

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
  createdAt?: any;
};

const ROLE_CONFIG: Record<Role, { label: string; color: string; bg: string }> = {
  sourd:      { label: 'Sourd',       color: '#1D4ED8', bg: '#DBEAFE' },
  interprete: { label: 'Interprète',  color: '#065F46', bg: '#D1FAE5' },
  apprenti:   { label: 'Apprenti',    color: '#92400E', bg: '#FEF3C7' },
  admin:      { label: 'Admin',       color: '#991B1B', bg: '#FEE2E2' },
};

const ROLES: Role[] = ['sourd', 'interprete', 'apprenti', 'admin'];

async function validateBrevet(userId: string) {
  await updateDoc(doc(db, 'users', userId), {
    brevetValidated: true,
    brevetRefused: false,
    brevetRefusalReason: '',
  });
}

async function refuseBrevet(userId: string, reason: string) {
  await updateDoc(doc(db, 'users', userId), {
    brevetRefused: true,
    brevetValidated: false,
    brevetRefusalReason: reason,
  });
}

async function changeUserRole(userId: string, role: Role) {
  await updateDoc(doc(db, 'users', userId), { role });
}

function RoleBadge({ role }: { role: Role }) {
  const cfg = ROLE_CONFIG[role];
  return (
    <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
      <Text style={[styles.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
}

function RefusalModal({
  visible,
  userName,
  onCancel,
  onConfirm,
}: {
  visible: boolean;
  userName: string;
  onCancel: () => void;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (visible) setReason('');
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Refuser le brevet</Text>
          <Text style={styles.modalSubtitle}>Apprenti : {userName}</Text>
          <Text style={styles.modalLabel}>Raison du refus (optionnel)</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Ex : Document illisible, brevet expiré…"
            placeholderTextColor={Colors.textSecondary}
            value={reason}
            onChangeText={setReason}
            multiline
            numberOfLines={3}
          />
          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.btnCancel} onPress={onCancel}>
              <Text style={styles.btnCancelText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnDanger} onPress={() => onConfirm(reason)}>
              <Text style={styles.btnWhiteText}>Confirmer le refus</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function RoleModal({
  visible,
  user,
  onCancel,
  onConfirm,
}: {
  visible: boolean;
  user: BrevetUser | null;
  onCancel: () => void;
  onConfirm: (role: Role) => void;
}) {
  if (!user) return null;
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Changer le rôle</Text>
          <Text style={styles.modalSubtitle}>{user.name}</Text>
          {ROLES.map((r) => {
            const cfg = ROLE_CONFIG[r];
            const active = r === user.role;
            return (
              <TouchableOpacity
                key={r}
                style={[styles.roleOption, active && { borderColor: cfg.color, borderWidth: 2 }]}
                onPress={() => onConfirm(r)}
              >
                <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
                  <Text style={[styles.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
                </View>
                {active && <Text style={[styles.activeCheck, { color: cfg.color }]}>✓ Actuel</Text>}
              </TouchableOpacity>
            );
          })}
          <TouchableOpacity style={[styles.btnCancel, { marginTop: Spacing.sm }]} onPress={onCancel}>
            <Text style={styles.btnCancelText}>Annuler</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

export default function AdminScreen() {
  const [tab, setTab] = useState<AdminTab>('brevets');
  const [users, setUsers] = useState<BrevetUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [appointmentCount, setAppointmentCount] = useState(0);

  const [refusalTarget, setRefusalTarget] = useState<BrevetUser | null>(null);
  const [roleTarget, setRoleTarget] = useState<BrevetUser | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'users'), (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() } as BrevetUser));
      setUsers(data);
      setLoading(false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (tab !== 'stats') return;
    getDocs(collection(db, 'appointments')).then((snap) => {
      setAppointmentCount(snap.size);
    });
  }, [tab]);

  const pendingBrevets = users.filter(
    (u) => u.brevetSubmitted && !u.brevetValidated && !u.brevetRefused,
  );

  const handleValidate = (u: BrevetUser) => {
    Alert.alert(
      'Valider le brevet',
      `Valider le brevet de ${u.name} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Valider ✓',
          onPress: async () => {
            try {
              await validateBrevet(u.id);
            } catch {
              Alert.alert('Erreur', 'Impossible de valider le brevet.');
            }
          },
        },
      ],
    );
  };

  const handleRefuse = (u: BrevetUser) => setRefusalTarget(u);

  const handleRoleChange = (u: BrevetUser) => setRoleTarget(u);

  const confirmRefusal = async (reason: string) => {
    if (!refusalTarget) return;
    try {
      await refuseBrevet(refusalTarget.id, reason);
    } catch {
      Alert.alert('Erreur', 'Impossible de refuser le brevet.');
    }
    setRefusalTarget(null);
  };

  const confirmRoleChange = async (role: Role) => {
    if (!roleTarget) return;
    try {
      await changeUserRole(roleTarget.id, role);
    } catch {
      Alert.alert('Erreur', 'Impossible de changer le rôle.');
    }
    setRoleTarget(null);
  };

  const renderBrevetCard = ({ item: u }: { item: BrevetUser }) => (
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
          {u.brevetNumero && <Text style={styles.brevetDetail}>N° : {u.brevetNumero}</Text>}
          {u.brevetAnnee && <Text style={styles.brevetDetail}>Année : {u.brevetAnnee}</Text>}
        </View>
      )}
      <View style={styles.cardActions}>
        <TouchableOpacity style={styles.btnSuccess} onPress={() => handleValidate(u)}>
          <Text style={styles.btnWhiteText}>Valider ✓</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnDanger} onPress={() => handleRefuse(u)}>
          <Text style={styles.btnWhiteText}>Refuser ✗</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderUserCard = ({ item: u }: { item: BrevetUser }) => {
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
                u.brevetValidated ? { color: '#065F46' } : u.brevetRefused ? { color: '#991B1B' } : { color: '#92400E' },
              ]}>
                {brevetStatus}
              </Text>
            )}
          </View>
          <TouchableOpacity onPress={() => handleRoleChange(u)}>
            <RoleBadge role={u.role} />
            <Text style={styles.changeRoleHint}>Changer →</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const statsData = {
    total: users.length,
    sourds: users.filter((u) => u.role === 'sourd').length,
    interpretes: users.filter((u) => u.role === 'interprete').length,
    apprentis: users.filter((u) => u.role === 'apprenti').length,
    admins: users.filter((u) => u.role === 'admin').length,
    brevetsPending: pendingBrevets.length,
    brevetsValidated: users.filter((u) => u.brevetValidated).length,
    brevetsRefused: users.filter((u) => u.brevetRefused).length,
    rdvTotal: appointmentCount,
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Administration</Text>
          <Text style={styles.headerSubtitle}>PharmaSign</Text>
        </View>
        {pendingBrevets.length > 0 && (
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeText}>{pendingBrevets.length}</Text>
          </View>
        )}
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {([
          { id: 'brevets', label: 'Brevets', count: pendingBrevets.length },
          { id: 'utilisateurs', label: 'Utilisateurs' },
          { id: 'stats', label: 'Statistiques' },
        ] as { id: AdminTab; label: string; count?: number }[]).map(({ id, label, count }) => (
          <TouchableOpacity
            key={id}
            style={[styles.tab, tab === id && styles.tabActive]}
            onPress={() => setTab(id)}
          >
            <Text style={[styles.tabText, tab === id && styles.tabTextActive]}>
              {label}
              {count ? ` (${count})` : ''}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
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
        users.length === 0 ? (
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
        )
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          <Text style={styles.sectionTitle}>Utilisateurs</Text>
          <View style={styles.statsGrid}>
            <StatBox label="Total" value={statsData.total} color={Colors.primary} />
            <StatBox label="Sourds" value={statsData.sourds} color="#1D4ED8" />
            <StatBox label="Interprètes" value={statsData.interpretes} color="#065F46" />
            <StatBox label="Apprentis" value={statsData.apprentis} color="#92400E" />
          </View>
          <Text style={[styles.sectionTitle, { marginTop: Spacing.lg }]}>Brevets LSF</Text>
          <View style={styles.statsGrid}>
            <StatBox label="En attente" value={statsData.brevetsPending} color="#92400E" />
            <StatBox label="Validés" value={statsData.brevetsValidated} color="#065F46" />
            <StatBox label="Refusés" value={statsData.brevetsRefused} color="#991B1B" />
          </View>
          <Text style={[styles.sectionTitle, { marginTop: Spacing.lg }]}>Rendez-vous</Text>
          <View style={styles.statsGrid}>
            <StatBox label="Total RDV" value={statsData.rdvTotal} color={Colors.primary} />
          </View>
        </ScrollView>
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

function StatBox({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={[styles.statBox, { borderLeftColor: color }]}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  header: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: { color: Colors.white, fontSize: FontSize.xl, fontWeight: '700' },
  headerSubtitle: { color: 'rgba(255,255,255,0.8)', fontSize: FontSize.sm },
  headerBadge: {
    backgroundColor: '#EF4444',
    borderRadius: Radius.full,
    minWidth: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xs,
  },
  headerBadgeText: { color: Colors.white, fontWeight: '700', fontSize: FontSize.sm },

  tabs: {
    flexDirection: 'row',
    backgroundColor: Colors.primaryLight,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.sm + 2,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
  },
  tabText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: '500' },
  tabTextActive: { color: Colors.primary, fontWeight: '700' },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
  list: { padding: Spacing.md, gap: Spacing.sm },

  emptyIcon: { fontSize: 48, marginBottom: Spacing.sm },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.xs },
  emptyText: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center' },

  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardName: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
  cardEmail: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },

  brevetInfo: {
    marginTop: Spacing.sm,
    backgroundColor: Colors.primaryLight,
    borderRadius: Radius.sm,
    padding: Spacing.sm,
    gap: 2,
  },
  brevetDetail: { fontSize: FontSize.sm, color: Colors.textPrimary },
  brevetStatus: { fontSize: FontSize.xs, fontWeight: '600', marginTop: 4 },

  cardActions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md },
  btnSuccess: {
    flex: 1,
    backgroundColor: '#16A34A',
    borderRadius: Radius.sm,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  btnDanger: {
    flex: 1,
    backgroundColor: '#DC2626',
    borderRadius: Radius.sm,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  btnWhiteText: { color: Colors.white, fontWeight: '700', fontSize: FontSize.sm },

  changeRoleHint: { fontSize: 10, color: Colors.textSecondary, textAlign: 'center', marginTop: 2 },

  badge: { borderRadius: Radius.full, paddingHorizontal: Spacing.sm, paddingVertical: 3, alignSelf: 'flex-start' },
  badgeText: { fontSize: FontSize.xs, fontWeight: '700' },

  sectionTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.sm },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  statBox: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    borderLeftWidth: 4,
  },
  statValue: { fontSize: FontSize.xxl, fontWeight: '800' },
  statLabel: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: Spacing.md,
  },
  modalCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
  },
  modalTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.xs },
  modalSubtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: Spacing.md },
  modalLabel: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textPrimary, marginBottom: Spacing.xs },
  textInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.sm,
    padding: Spacing.sm,
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: Spacing.md,
  },
  modalActions: { flexDirection: 'row', gap: Spacing.sm },
  btnCancel: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.sm,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  btnCancelText: { color: Colors.textSecondary, fontWeight: '600', fontSize: FontSize.sm },
  roleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.sm,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.xs,
  },
  activeCheck: { fontSize: FontSize.sm, fontWeight: '700' },
});
