import { router } from 'expo-router';
import {
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth, User } from '@/context/AuthContext';
import { Colors, FontSize, Radius, Spacing } from '@/constants/theme';

/* ── Sourd home ─────────────────────────────────────────── */
function SourdHome({ user }: { user: User }) {
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: Colors.malentendants }]}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.header, { backgroundColor: Colors.malentendants }]}>
          <Text style={styles.headerGreeting}>Bonjour, {user.name.split(' ')[0]} 🤟</Text>
          <Text style={styles.headerSub}>Trouvez un interprète LSF pour vos soins à Nice</Text>
        </View>

        <View style={styles.body}>
          <TouchableOpacity
            style={[styles.mainAction, { backgroundColor: Colors.malentendants }]}
            onPress={() => router.push('/(tabs)/malentendants')}
            activeOpacity={0.85}
            accessibilityRole="button"
          >
            <Text style={styles.mainActionEmoji}>🗺️</Text>
            <View style={styles.mainActionText}>
              <Text style={styles.mainActionTitle}>Trouver un interprète</Text>
              <Text style={styles.mainActionSub}>Carte · Disponibilités · Prise de RDV</Text>
            </View>
            <Text style={styles.mainActionArrow}>›</Text>
          </TouchableOpacity>

          <View style={styles.infoRow}>
            <View style={styles.infoCard}>
              <Text style={styles.infoEmoji}>⚡</Text>
              <Text style={[styles.infoValue, { color: Colors.malentendants }]}>{'< 2h'}</Text>
              <Text style={styles.infoLabel}>Délai moyen</Text>
            </View>
            <View style={styles.infoCard}>
              <Text style={styles.infoEmoji}>👐</Text>
              <Text style={[styles.infoValue, { color: Colors.malentendants }]}>3</Text>
              <Text style={styles.infoLabel}>Dispo. à Nice</Text>
            </View>
            <View style={styles.infoCard}>
              <Text style={styles.infoEmoji}>⭐</Text>
              <Text style={[styles.infoValue, { color: Colors.malentendants }]}>4.8</Text>
              <Text style={styles.infoLabel}>Note moyenne</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Comment ça marche ?</Text>
            {[
              { n: '1', t: 'Localisez les interprètes disponibles sur la carte de Nice' },
              { n: '2', t: 'Choisissez votre type de besoin médical et un créneau' },
              { n: '3', t: 'Un interprète accepte votre demande et vous accompagne' },
            ].map((step) => (
              <View key={step.n} style={styles.stepRow}>
                <View style={[styles.stepNum, { backgroundColor: Colors.malentendants }]}>
                  <Text style={styles.stepNumText}>{step.n}</Text>
                </View>
                <Text style={styles.stepText}>{step.t}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ── Interprète home ─────────────────────────────────────── */
function InterpretesHome({ user }: { user: User }) {
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: Colors.interpretes }]}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.header, { backgroundColor: Colors.interpretes }]}>
          <Text style={styles.headerGreeting}>Bonjour, {user.name.split(' ')[0]} 👐</Text>
          <Text style={styles.headerSub}>Interprète LSF agréé(e) — Zone de Nice</Text>
          <View style={styles.statsRow}>
            {[
              { v: '12', l: 'Missions ce mois' },
              { v: '4.9', l: 'Note moyenne' },
              { v: '98%', l: 'Acceptations' },
            ].map((s) => (
              <View key={s.l} style={styles.statItem}>
                <Text style={styles.statValue}>{s.v}</Text>
                <Text style={styles.statLabel}>{s.l}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.body}>
          <View style={styles.actionGrid}>
            <TouchableOpacity
              style={[styles.gridAction, { borderColor: Colors.interpretes }]}
              onPress={() => router.push('/(tabs)/interpretes')}
              activeOpacity={0.8}
              accessibilityRole="button"
            >
              <Text style={styles.gridActionEmoji}>🗺️</Text>
              <Text style={[styles.gridActionTitle, { color: Colors.interpretes }]}>Demandes proches</Text>
              <Text style={styles.gridActionSub}>Carte de Nice</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.gridAction, { borderColor: Colors.interpretes }]}
              onPress={() => router.push('/(tabs)/interpretes/planning')}
              activeOpacity={0.8}
              accessibilityRole="button"
            >
              <Text style={styles.gridActionEmoji}>📅</Text>
              <Text style={[styles.gridActionTitle, { color: Colors.interpretes }]}>Mon planning</Text>
              <Text style={styles.gridActionSub}>Semaine en cours</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.gridAction, { borderColor: Colors.interpretes }]}
              onPress={() => router.push('/(tabs)/interpretes/missions')}
              activeOpacity={0.8}
              accessibilityRole="button"
            >
              <Text style={styles.gridActionEmoji}>🎯</Text>
              <Text style={[styles.gridActionTitle, { color: Colors.interpretes }]}>Missions</Text>
              <Text style={styles.gridActionSub}>Accepter / Refuser</Text>
            </TouchableOpacity>
            <View style={[styles.gridAction, styles.gridActionInfo]}>
              <Text style={styles.gridActionEmoji}>🔔</Text>
              <Text style={[styles.gridActionTitle, { color: Colors.textSecondary }]}>Notifications</Text>
              <Text style={styles.gridActionSub}>2 nouvelles</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ── Apprenti home ───────────────────────────────────────── */
function ApprentisHome({ user }: { user: User }) {
  const progress = 2 / 5;
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: Colors.apprentis }]}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.header, { backgroundColor: Colors.apprentis }]}>
          <Text style={styles.headerGreeting}>Bonjour, {user.name.split(' ')[0]} 📚</Text>
          <Text style={styles.headerSub}>Apprenti(e) interprète LSF médical</Text>
          <View style={styles.progressBox}>
            <View style={styles.progressHeaderRow}>
              <Text style={styles.progressLabel}>Progression</Text>
              <Text style={styles.progressPct}>{Math.round(progress * 100)}%</Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress * 100}%` as any }]} />
            </View>
            <Text style={styles.progressSub}>2/5 étapes complétées</Text>
          </View>
        </View>

        <View style={styles.body}>
          <TouchableOpacity
            style={[styles.mainAction, { backgroundColor: Colors.apprentis }]}
            onPress={() => router.push('/(tabs)/apprentis')}
            activeOpacity={0.85}
            accessibilityRole="button"
          >
            <Text style={styles.mainActionEmoji}>📅</Text>
            <View style={styles.mainActionText}>
              <Text style={styles.mainActionTitle}>Mes formations</Text>
              <Text style={styles.mainActionSub}>Réserver des sessions LSF médicales</Text>
            </View>
            <Text style={styles.mainActionArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.mainAction, { backgroundColor: Colors.apprentisDark }]}
            onPress={() => router.push('/(tabs)/apprentis/brevet')}
            activeOpacity={0.85}
            accessibilityRole="button"
          >
            <Text style={styles.mainActionEmoji}>🎓</Text>
            <View style={styles.mainActionText}>
              <Text style={styles.mainActionTitle}>
                {user.brevetSubmitted ? 'Brevet en cours de validation' : 'Soumettre mon brevet LSF'}
              </Text>
              <Text style={styles.mainActionSub}>
                {user.brevetSubmitted
                  ? '⏳ Votre dossier est examiné par un jury'
                  : 'Évoluez vers le statut Interprète agréé'}
              </Text>
            </View>
            <Text style={styles.mainActionArrow}>›</Text>
          </TouchableOpacity>

          <View style={[styles.infoBox, { backgroundColor: Colors.apprentisLight, borderColor: Colors.apprentis }]}>
            <Text style={styles.infoBoxTitle}>🔄 Évolution de statut</Text>
            <Text style={styles.infoBoxText}>
              Après validation de votre brevet LSF par le jury, votre compte sera basculé vers le statut <Text style={{ fontWeight: '700', color: Colors.interpretes }}>Interprète agréé</Text>.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ── Root component ──────────────────────────────────────── */
export default function HomeScreen() {
  const { user, logout } = useAuth();

  if (!user) return null;

  const handleLogout = () => {
    logout();
    router.replace('/(auth)/login');
  };

  const roleColor =
    user.role === 'sourd' ? Colors.malentendants
    : user.role === 'interprete' ? Colors.interpretes
    : Colors.apprentis;

  return (
    <View style={{ flex: 1 }}>
      {/* Top bar */}
      <View style={[styles.topBar, { backgroundColor: roleColor }]}>
        <Image
          source={require('@/assets/images/logo.png')}
          style={styles.topBarLogo}
          resizeMode="contain"
          accessibilityLabel="Logo PharmaSign"
        />
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn} accessibilityRole="button">
          <Text style={styles.logoutText}>Déconnexion</Text>
        </TouchableOpacity>
      </View>

      {user.role === 'sourd' && <SourdHome user={user} />}
      {user.role === 'interprete' && <InterpretesHome user={user} />}
      {user.role === 'apprenti' && <ApprentisHome user={user} />}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { flex: 1, backgroundColor: Colors.background },
  content: { paddingBottom: Spacing.xxl },

  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: 52,
    paddingBottom: Spacing.sm,
  },
  topBarLogo: { width: 120, height: 120 },
  logoutBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
  },
  logoutText: { fontSize: FontSize.sm, color: Colors.white, fontWeight: '600' },

  header: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xl,
    gap: Spacing.sm,
  },
  headerGreeting: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.white },
  headerSub: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.85)', lineHeight: 20 },

  statsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: Radius.md,
    padding: Spacing.md,
    justifyContent: 'space-around',
    marginTop: Spacing.sm,
  },
  statItem: { alignItems: 'center', flex: 1 },
  statValue: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.white },
  statLabel: { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.8)', textAlign: 'center', marginTop: 2 },

  progressBox: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  progressHeaderRow: { flexDirection: 'row', justifyContent: 'space-between' },
  progressLabel: { fontSize: FontSize.sm, color: Colors.white, fontWeight: '600' },
  progressPct: { fontSize: FontSize.sm, color: Colors.white, fontWeight: '800' },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: Colors.white, borderRadius: Radius.full },
  progressSub: { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.8)' },

  body: { padding: Spacing.lg, gap: Spacing.md },

  mainAction: {
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 5,
  },
  mainActionEmoji: { fontSize: 32, flexShrink: 0 },
  mainActionText: { flex: 1, gap: 3 },
  mainActionTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.white },
  mainActionSub: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.85)' },
  mainActionArrow: { fontSize: 28, color: Colors.white, flexShrink: 0, lineHeight: 32 },

  infoRow: { flexDirection: 'row', gap: Spacing.sm },
  infoCard: {
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
  infoEmoji: { fontSize: 20 },
  infoValue: { fontSize: FontSize.xl, fontWeight: '800' },
  infoLabel: { fontSize: FontSize.xs, color: Colors.textSecondary, textAlign: 'center' },

  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  gridAction: {
    width: '47%',
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: Spacing.xs,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  gridActionInfo: { borderColor: Colors.border },
  gridActionEmoji: { fontSize: 26 },
  gridActionTitle: { fontSize: FontSize.sm, fontWeight: '700' },
  gridActionSub: { fontSize: FontSize.xs, color: Colors.textSecondary },

  section: { gap: Spacing.sm },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary },
  stepRow: { flexDirection: 'row', gap: Spacing.md, alignItems: 'flex-start' },
  stepNum: {
    width: 28,
    height: 28,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 2,
  },
  stepNumText: { fontSize: FontSize.sm, fontWeight: '800', color: Colors.white },
  stepText: { flex: 1, fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 20 },

  infoBox: {
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: Spacing.xs,
    borderLeftWidth: 4,
  },
  infoBoxTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
  infoBoxText: { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 20 },
});
