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
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth, User } from '@/context/AuthContext';
import { Colors, FontSize, Radius, Spacing } from '@/constants/theme';
import { usePatientAppointments } from '@/hooks/useAppointments';

/* ── Design tokens (design system PharmaSign) ────────────── */
const BRAND      = '#0F766E';
const BRAND_DARK = '#0B5F58';
const BRAND_TINT = '#E8F4F2';
const INK        = '#0F1B2D';
const INK_2      = '#475569';
const INK_3      = '#94A3B8';
const BORDER     = '#E5EAF0';
const BG         = '#F6F8FA';
const AMBER      = '#B45309';
const AMBER_BG   = '#FEF3C7';

/* ── Sourd Home (redesign fidèle à home-sourd.jsx) ────────── */
function SourdHome({ user, onLogout }: { user: User; onLogout: () => void }) {
  const { appointments } = usePatientAppointments();
  const pendingCount = appointments.filter((a) => a.status === 'pending').length;

  return (
    <SafeAreaView style={styles.sourdSafe}>
      <ScrollView
        style={styles.sourdScroll}
        contentContainerStyle={styles.sourdScrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header teal ─────────────────────────── */}
        <View style={styles.sourdHeader}>
          <View style={styles.headerDeco1} />
          <View style={styles.headerDeco2} />

          {/* Top bar : logo + icônes */}
          <View style={styles.headerTopBar}>
            <View style={styles.headerLogoRow}>
              <Image
                source={require('@/assets/images/logo.png')}
                style={styles.headerLogoImg}
                resizeMode="contain"
                accessibilityLabel="Logo PharmaSign"
              />
              <Text style={styles.headerLogoText}>PharmaSign</Text>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.headerActionBtn} accessibilityLabel="Notifications">
                <Feather name="bell" size={18} color="#fff" />
                <View style={styles.notifDot} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.headerActionBtn}
                onPress={onLogout}
                accessibilityRole="button"
                accessibilityLabel="Déconnexion"
              >
                <Feather name="log-out" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Salutation */}
          <View style={styles.greetingBlock}>
            <Text style={styles.greetingLabel}>Bonjour</Text>
            <Text style={styles.greetingName}>
              {(() => {
                const parts = user.name.split(' ');
                return parts[1] ? `${parts[0]} ${parts[1][0]}.` : parts[0];
              })()}
            </Text>
            <Text style={styles.greetingSub}>
              Trouvez un interprète LSF pour vos rendez-vous médicaux à Nice.
            </Text>
          </View>
        </View>

        {/* ── Body ───────────────────────────────── */}
        <View style={styles.body}>

          {/* Action principale : Trouver un interprète */}
          <TouchableOpacity
            style={styles.mainActionCard}
            onPress={() => router.push('/(tabs)/malentendants')}
            activeOpacity={0.85}
            accessibilityRole="button"
          >
            <View style={styles.mainActionIcon}>
              <Feather name="map-pin" size={24} color="#fff" />
            </View>
            <View style={styles.mainActionText}>
              <Text style={styles.mainActionTitle}>Trouver un interprète</Text>
              <Text style={styles.mainActionSub}>Carte · disponibilités · prise de RDV</Text>
            </View>
            <Feather name="chevron-right" size={18} color={INK_3} />
          </TouchableOpacity>

          {/* Mes rendez-vous */}
          <TouchableOpacity
            style={styles.rdvBtn}
            onPress={() => router.push('/(tabs)/malentendants/mes-rdv')}
            activeOpacity={0.85}
            accessibilityRole="button"
          >
            <View style={styles.rdvBtnIcon}>
              <Feather name="calendar" size={20} color={BRAND} />
            </View>
            <View style={styles.rdvBtnText}>
              <View style={styles.rdvBtnTitleRow}>
                <Text style={styles.rdvBtnTitle}>Mes rendez-vous</Text>
                {pendingCount > 0 && (
                  <View style={styles.pendingPill}>
                    <Text style={styles.pendingPillText}>{pendingCount} en attente</Text>
                  </View>
                )}
              </View>
              <Text style={styles.rdvBtnSub}>
                {appointments.length === 0
                  ? 'Aucune demande en cours'
                  : pendingCount > 0
                  ? `Demande envoyée à ${pendingCount} interprètes proches`
                  : `${appointments.length} rendez-vous`}
              </Text>
            </View>
            <Feather name="chevron-right" size={18} color={INK_3} />
          </TouchableOpacity>

          {/* 3 stat tiles */}
          <View style={styles.statsRow}>
            <StatTile
              icon={<Feather name="zap" size={18} color={BRAND} />}
              value="< 2h"
              label="Délai moyen"
            />
            <StatTile
              icon={<MaterialCommunityIcons name="hand-wave" size={18} color={BRAND} />}
              value="3"
              label="Dispo. à Nice"
            />
            <StatTile
              icon={<Feather name="star" size={18} color={BRAND} />}
              value="4,8"
              label="Note moyenne"
            />
          </View>

          {/* Comment ça marche */}
          <View style={styles.howCard}>
            <View style={styles.howHeader}>
              <Text style={styles.howTitle}>Comment ça marche</Text>
              <Text style={styles.howCount}>3 étapes</Text>
            </View>
            <View style={styles.stepDivider} />
            <StepRow n="1" title="Localisez sur la carte"
              desc="Visualisez les interprètes LSF disponibles autour de vous à Nice." />
            <View style={styles.stepDivider} />
            <StepRow n="2" title="Choisissez votre besoin"
              desc="Type de RDV médical, date et créneau qui vous conviennent." />
            <View style={styles.stepDivider} />
            <StepRow n="3" title="Confirmation rapide"
              desc="Un interprète accepte votre demande et vous accompagne au RDV." />
          </View>

          {/* Bandeau réassurance */}
          <View style={styles.reassuranceBanner}>
            <View style={styles.reassuranceIcon}>
              <Feather name="check" size={14} color="#fff" />
            </View>
            <Text style={styles.reassuranceText}>
              Service gratuit · Interprètes LSF agréés · Confidentialité médicale
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatTile({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <View style={styles.statTile}>
      <View style={styles.statTileIcon}>{icon}</View>
      <Text style={styles.statTileValue}>{value}</Text>
      <Text style={styles.statTileLabel}>{label}</Text>
    </View>
  );
}

function StepRow({ n, title, desc }: { n: string; title: string; desc: string }) {
  return (
    <View style={styles.stepRow}>
      <View style={styles.stepNum}>
        <Text style={styles.stepNumText}>{n}</Text>
      </View>
      <View style={styles.stepText}>
        <Text style={styles.stepTitle}>{title}</Text>
        <Text style={styles.stepDesc}>{desc}</Text>
      </View>
    </View>
  );
}

/* ── Interprète home ─────────────────────────────────────── */
function InterpretesHome({ user, onLogout }: { user: User; onLogout: () => void }) {
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: Colors.interpretes }]}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.header, { backgroundColor: Colors.interpretes }]}>
          <View style={styles.topBarRow}>
            <Image source={require('@/assets/images/logo.png')} style={styles.topBarLogo} resizeMode="contain" />
            <TouchableOpacity onPress={onLogout} style={styles.logoutBtn} accessibilityRole="button">
              <Text style={styles.logoutText}>Déconnexion</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.headerGreeting}>Bonjour, {user.name.split(' ')[0]} 👐</Text>
          <Text style={styles.headerSub}>Interprète LSF agréé(e) — Zone de Nice</Text>
          <View style={styles.statsRowLegacy}>
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
            {[
              { emoji: '🗺️', title: 'Demandes proches', sub: 'Carte de Nice', route: '/(tabs)/interpretes' },
              { emoji: '📅', title: 'Mon planning', sub: 'Semaine en cours', route: '/(tabs)/interpretes/planning' },
              { emoji: '🎯', title: 'Missions', sub: 'Accepter / Refuser', route: '/(tabs)/interpretes/missions' },
            ].map((item) => (
              <TouchableOpacity
                key={item.title}
                style={[styles.gridAction, { borderColor: Colors.interpretes }]}
                onPress={() => router.push(item.route as any)}
                activeOpacity={0.8}
                accessibilityRole="button"
              >
                <Text style={styles.gridActionEmoji}>{item.emoji}</Text>
                <Text style={[styles.gridActionTitle, { color: Colors.interpretes }]}>{item.title}</Text>
                <Text style={styles.gridActionSub}>{item.sub}</Text>
              </TouchableOpacity>
            ))}
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
function ApprentisHome({ user, onLogout }: { user: User; onLogout: () => void }) {
  const progress = 2 / 5;
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: Colors.apprentis }]}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.header, { backgroundColor: Colors.apprentis }]}>
          <View style={styles.topBarRow}>
            <Image source={require('@/assets/images/logo.png')} style={styles.topBarLogo} resizeMode="contain" />
            <TouchableOpacity onPress={onLogout} style={styles.logoutBtn} accessibilityRole="button">
              <Text style={styles.logoutText}>Déconnexion</Text>
            </TouchableOpacity>
          </View>
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
            style={[styles.mainActionLegacy, { backgroundColor: Colors.apprentis }]}
            onPress={() => router.push('/(tabs)/apprentis')}
            activeOpacity={0.85}
            accessibilityRole="button"
          >
            <Text style={styles.mainActionEmoji}>📅</Text>
            <View style={styles.mainActionTextLegacy}>
              <Text style={styles.mainActionTitleLegacy}>Mes formations</Text>
              <Text style={styles.mainActionSubLegacy}>Réserver des sessions LSF médicales</Text>
            </View>
            <Text style={styles.mainActionArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.mainActionLegacy, { backgroundColor: Colors.apprentisDark }]}
            onPress={() => router.push('/(tabs)/apprentis/brevet')}
            activeOpacity={0.85}
            accessibilityRole="button"
          >
            <Text style={styles.mainActionEmoji}>🎓</Text>
            <View style={styles.mainActionTextLegacy}>
              <Text style={styles.mainActionTitleLegacy}>
                {user.brevetSubmitted ? 'Brevet en cours de validation' : 'Soumettre mon brevet LSF'}
              </Text>
              <Text style={styles.mainActionSubLegacy}>
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
              Après validation de votre brevet LSF par le jury, votre compte sera basculé vers le statut{' '}
              <Text style={{ fontWeight: '700', color: Colors.interpretes }}>Interprète agréé</Text>.
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

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  if (user.role === 'sourd')      return <SourdHome user={user} onLogout={handleLogout} />;
  if (user.role === 'interprete') return <InterpretesHome user={user} onLogout={handleLogout} />;
  return <ApprentisHome user={user} onLogout={handleLogout} />;
}

/* ── Styles ──────────────────────────────────────────────── */
const styles = StyleSheet.create({
  /* ── SourdHome ── */
  sourdSafe: {
    flex: 1,
    backgroundColor: BRAND,
  },
  sourdScroll: {
    flex: 1,
    backgroundColor: BG,
  },
  sourdScrollContent: {
    paddingBottom: 32,
  },

  sourdHeader: {
    backgroundColor: BRAND,
    paddingTop: 18,
    paddingHorizontal: 24,
    paddingBottom: 0,
    overflow: 'hidden',
    position: 'relative',
  },
  headerDeco1: {
    position: 'absolute',
    top: -60,
    right: -40,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  headerDeco2: {
    position: 'absolute',
    top: 30,
    right: 50,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  headerTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 1,
  },
  headerLogoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerLogoImg: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  headerLogoText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -0.2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerActionBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notifDot: {
    position: 'absolute',
    top: 9,
    right: 9,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#FCD34D',
    borderWidth: 1.5,
    borderColor: BRAND,
  },

  greetingBlock: {
    marginTop: 24,
    paddingBottom: 28,
    zIndex: 1,
    gap: 2,
  },
  greetingLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.78)',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  greetingName: {
    fontSize: 30,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -0.6,
    marginTop: 4,
    lineHeight: 34,
  },
  greetingSub: {
    fontSize: 14.5,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 6,
    lineHeight: 20,
  },

  body: {
    paddingHorizontal: 24,
    paddingTop: 20,
    marginTop: -16,
    gap: 20,
    backgroundColor: BG,
    zIndex: 1,
    position: 'relative',
  },

  /* Main action card */
  mainActionCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderColor: BORDER,
    shadowColor: BRAND,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 5,
  },
  mainActionIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: BRAND,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  mainActionText: { flex: 1 },
  mainActionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: INK,
    letterSpacing: -0.2,
  },
  mainActionSub: {
    fontSize: 13,
    color: INK_2,
    marginTop: 2,
    lineHeight: 17,
  },

  /* Mes RDV button */
  rdvBtn: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderColor: BORDER,
  },
  rdvBtnIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: BRAND_TINT,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  rdvBtnText: { flex: 1 },
  rdvBtnTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  rdvBtnTitle: {
    fontSize: 15.5,
    fontWeight: '700',
    color: INK,
    letterSpacing: -0.2,
  },
  pendingPill: {
    backgroundColor: AMBER_BG,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  pendingPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: AMBER,
    letterSpacing: 0.3,
  },
  rdvBtnSub: {
    fontSize: 13,
    color: INK_2,
    marginTop: 3,
    lineHeight: 17,
  },

  /* Stat tiles */
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statTile: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 16,
    gap: 4,
  },
  statTileIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: BRAND_TINT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statTileValue: {
    fontSize: 22,
    fontWeight: '700',
    color: INK,
    letterSpacing: -0.5,
    lineHeight: 26,
  },
  statTileLabel: {
    fontSize: 12,
    color: INK_3,
    fontWeight: '500',
  },

  /* How-it-works card */
  howCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 20,
  },
  howHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  howTitle: {
    fontSize: 15.5,
    fontWeight: '700',
    color: INK,
    letterSpacing: -0.2,
  },
  howCount: {
    fontSize: 12,
    color: INK_3,
    fontWeight: '500',
  },
  stepDivider: {
    height: 1,
    backgroundColor: BORDER,
  },
  stepRow: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'flex-start',
    paddingVertical: 14,
  },
  stepNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: BRAND_TINT,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  stepNumText: {
    fontSize: 13,
    fontWeight: '700',
    color: BRAND,
  },
  stepText: { flex: 1, paddingTop: 2 },
  stepTitle: {
    fontSize: 14.5,
    fontWeight: '600',
    color: INK,
    lineHeight: 19,
  },
  stepDesc: {
    fontSize: 13.5,
    color: INK_2,
    lineHeight: 18,
    marginTop: 2,
  },

  /* Reassurance */
  reassuranceBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: BRAND_TINT,
    borderRadius: 12,
    padding: 12,
    paddingHorizontal: 14,
  },
  reassuranceIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: BRAND,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  reassuranceText: {
    fontSize: 12.5,
    color: BRAND_DARK,
    fontWeight: '500',
    lineHeight: 17,
    flex: 1,
  },

  /* ── Legacy role screens (InterprèteHome, ApprentisHome) ── */
  safe: { flex: 1 },
  scroll: { flex: 1, backgroundColor: Colors.background },
  content: { paddingBottom: Spacing.xxl },

  header: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xl,
    gap: Spacing.sm,
  },
  topBarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  topBarLogo: { width: 80, height: 80 },
  logoutBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
  },
  logoutText: { fontSize: FontSize.sm, color: Colors.white, fontWeight: '600' },

  headerGreeting: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.white },
  headerSub: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.85)', lineHeight: 20 },

  statsRowLegacy: {
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

  mainActionLegacy: {
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
  mainActionTextLegacy: { flex: 1, gap: 3 },
  mainActionTitleLegacy: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.white },
  mainActionSubLegacy: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.85)' },
  mainActionArrow: { fontSize: 28, color: Colors.white, flexShrink: 0, lineHeight: 32 },

  infoBox: {
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: Spacing.xs,
    borderLeftWidth: 4,
  },
  infoBoxTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
  infoBoxText: { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 20 },
});
