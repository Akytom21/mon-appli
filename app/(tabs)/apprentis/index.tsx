import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { useFormations } from '@/hooks/useFormations';
import { useApprentisProgress } from '@/hooks/useApprentisProgress';

/* ── Design tokens ───────────────────────────────────────── */
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
const GOLD       = '#F59E0B';

export default function ApprentisHome() {
  const { user, logout, upgradeToInterprete } = useAuth();
  const { formations, loading: formationsLoading } = useFormations();
  const { etapes, done, progress } = useApprentisProgress();
  const [upgrading, setUpgrading] = useState(false);

  const handleUpgrade = async () => {
    setUpgrading(true);
    await upgradeToInterprete();
    router.replace('/(tabs)');
  };

  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Voulez-vous vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnexion',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/(auth)/login');
          },
        },
      ],
    );
  };

  const firstName = user?.name?.split(' ')[0] ?? '';
  const previewSessions = formations.slice(0, 3);

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header teal ────────────────────────────────── */}
        <View style={s.header}>
          <View style={s.deco1} />
          <View style={s.deco2} />

          {/* Top bar */}
          <View style={s.topBar}>
            <View style={s.logoRow}>
              <Image
                source={require('@/assets/images/logo.png')}
                style={s.logoImg}
                resizeMode="contain"
              />
              <Text style={s.logoText}>PharmaSign</Text>
            </View>
            <View style={s.topBarActions}>
              <TouchableOpacity style={s.iconBtn} accessibilityLabel="Notifications">
                <Feather name="bell" size={18} color="#fff" />
                <View style={s.notifDot} />
              </TouchableOpacity>
              <TouchableOpacity
                style={s.iconBtn}
                onPress={() => router.push('/(tabs)/profil')}
                accessibilityLabel="Mon profil"
                accessibilityRole="button"
              >
                <Feather name="user" size={18} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity
                style={s.iconBtn}
                onPress={handleLogout}
                accessibilityLabel="Déconnexion"
                accessibilityRole="button"
              >
                <Feather name="log-out" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Greeting */}
          <View style={s.greeting}>
            <Text style={s.greetingLabel}>APPRENTI(E)</Text>
            <Text style={s.greetingName}>Bonjour, {firstName} 📚</Text>
            <Text style={s.greetingSub}>Parcours interprète LSF médical</Text>
          </View>

          {/* Progress box */}
          <View style={s.progressBox}>
            <View style={s.progressTopRow}>
              <Text style={s.progressLabel}>Progression du parcours</Text>
              <Text style={s.progressPct}>{Math.round(progress * 100)}%</Text>
            </View>
            <View style={s.progressBarTrack}>
              <View style={[s.progressBarFill, { width: `${progress * 100}%` as any }]} />
            </View>
            <Text style={s.progressSub}>{done}/{etapes.length} étapes complétées</Text>
          </View>
        </View>

        {/* ── Body ───────────────────────────────────────── */}
        <View style={s.body}>

          {/* Brevet status card */}
          {user?.brevetValidated ? (
            <TouchableOpacity
              style={s.upgradeCard}
              onPress={handleUpgrade}
              disabled={upgrading}
              activeOpacity={0.85}
              accessibilityRole="button"
            >
              <View style={s.upgradeCardLeft}>
                <Text style={s.upgradeCardEmoji}>🌟</Text>
                <View>
                  <Text style={s.upgradeCardTitle}>Brevet validé !</Text>
                  <Text style={s.upgradeCardSub}>
                    {upgrading ? 'Mise à jour en cours…' : 'Devenir Interprète agréé'}
                  </Text>
                </View>
              </View>
              {!upgrading && <Feather name="chevron-right" size={22} color={GOLD} />}
            </TouchableOpacity>
          ) : user?.brevetSubmitted ? (
            <View style={s.pendingCard}>
              <View style={s.pendingIconWrap}>
                <Text style={{ fontSize: 22 }}>⏳</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.pendingCardTitle}>Brevet en cours de validation</Text>
                <Text style={s.pendingCardSub}>
                  Dossier examiné par le jury. Résultat sous 5-10 jours ouvrés.
                </Text>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={s.brevetCard}
              onPress={() => router.push('/(tabs)/apprentis/brevet')}
              activeOpacity={0.85}
              accessibilityRole="button"
            >
              <View style={s.brevetCardIcon}>
                <Feather name="award" size={22} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.brevetCardTitle}>Soumettre mon brevet LSF</Text>
                <Text style={s.brevetCardSub}>Évoluer vers le statut Interprète agréé</Text>
              </View>
              <Feather name="chevron-right" size={18} color={INK_3} />
            </TouchableOpacity>
          )}

          {/* Quick actions grid */}
          <View style={s.actionsGrid}>
            <TouchableOpacity
              style={s.actionCard}
              onPress={() => router.push('/(tabs)/apprentis/formation')}
              activeOpacity={0.85}
              accessibilityRole="button"
            >
              <View style={[s.actionIcon, { backgroundColor: BRAND_TINT }]}>
                <Feather name="book-open" size={22} color={BRAND} />
              </View>
              <Text style={s.actionTitle}>Mes formations</Text>
              <Text style={s.actionSub}>Sessions disponibles</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={s.actionCard}
              onPress={() => router.push('/(tabs)/apprentis/ressources')}
              activeOpacity={0.85}
              accessibilityRole="button"
            >
              <View style={[s.actionIcon, { backgroundColor: '#FEF2F2' }]}>
                <Feather name="play-circle" size={22} color="#DC2626" />
              </View>
              <Text style={s.actionTitle}>Ressources vidéo</Text>
              <Text style={s.actionSub}>Vidéos LSF</Text>
            </TouchableOpacity>
          </View>

          {/* Étapes card */}
          <View style={s.etapesCard}>
            <View style={s.etapesCardHeader}>
              <Text style={s.sectionTitle}>Étapes du parcours</Text>
              <View style={s.countBadge}>
                <Text style={s.countBadgeText}>{done}/{etapes.length}</Text>
              </View>
            </View>
            {etapes.map((etape, i) => (
              <View key={etape.id}>
                {i > 0 && <View style={s.etapeDivider} />}
                <View style={s.etapeRow}>
                  <View style={[s.etapeCircle, etape.done && s.etapeCircleDone]}>
                    {etape.done ? (
                      <Feather name="check" size={12} color="#fff" />
                    ) : (
                      <Text style={s.etapeNum}>{etape.id}</Text>
                    )}
                  </View>
                  <Text style={[s.etapeLabel, etape.done && s.etapeLabelDone]}>
                    {etape.label}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* Sessions preview */}
          <View>
            <View style={s.sectionRow}>
              <Text style={s.sectionTitle}>Sessions disponibles</Text>
              <TouchableOpacity
                onPress={() => router.push('/(tabs)/apprentis/formation')}
                accessibilityRole="button"
              >
                <Text style={s.voirTout}>Voir tout →</Text>
              </TouchableOpacity>
            </View>

            {formationsLoading ? (
              <ActivityIndicator color={BRAND} style={{ marginTop: 12 }} />
            ) : previewSessions.length === 0 ? (
              <View style={s.emptyCard}>
                <Feather name="calendar" size={24} color={INK_3} />
                <Text style={s.emptyText}>Aucune session disponible pour l'instant</Text>
              </View>
            ) : (
              previewSessions.map((session) => (
                <TouchableOpacity
                  key={session.id}
                  style={s.sessionCard}
                  onPress={() => router.push('/(tabs)/apprentis/formation')}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                >
                  <View style={s.sessionCardBody}>
                    <Text style={s.sessionCardTitle} numberOfLines={1}>{session.titre}</Text>
                    <Text style={s.sessionCardMeta}>{session.formateur}</Text>
                    <Text style={s.sessionCardMeta}>{session.date} · {session.heure}</Text>
                  </View>
                  <View style={s.sessionCardRight}>
                    <View style={[
                      s.placesPill,
                      {
                        backgroundColor: session.places <= 0
                          ? '#FEE2E2'
                          : session.places <= 2 ? AMBER_BG : BRAND_TINT,
                      },
                    ]}>
                      <Text style={[
                        s.placesPillText,
                        {
                          color: session.places <= 0
                            ? '#DC2626'
                            : session.places <= 2 ? AMBER : BRAND,
                        },
                      ]}>
                        {session.places <= 0 ? 'Complet' : `${session.places} pl.`}
                      </Text>
                    </View>
                    <Feather name="chevron-right" size={16} color={INK_3} />
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BRAND },
  scroll: { flex: 1, backgroundColor: BG },
  scrollContent: { paddingBottom: 40 },

  /* Header */
  header: {
    backgroundColor: BRAND,
    paddingTop: 16,
    paddingHorizontal: 24,
    overflow: 'hidden',
    position: 'relative',
  },
  deco1: {
    position: 'absolute', top: -60, right: -40,
    width: 220, height: 220, borderRadius: 110,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  deco2: {
    position: 'absolute', top: 30, right: 50,
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },

  topBar: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', zIndex: 1,
  },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoImg: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  logoText: { fontSize: 18, fontWeight: '700', color: '#fff', letterSpacing: -0.2 },
  topBarActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center', justifyContent: 'center', position: 'relative',
  },
  notifDot: {
    position: 'absolute', top: 9, right: 9,
    width: 7, height: 7, borderRadius: 3.5,
    backgroundColor: '#FCD34D', borderWidth: 1.5, borderColor: BRAND,
  },

  greeting: { marginTop: 24, paddingBottom: 20, zIndex: 1, gap: 3 },
  greetingLabel: {
    fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.65)',
    letterSpacing: 1.8, textTransform: 'uppercase',
  },
  greetingName: {
    fontSize: 28, fontWeight: '700', color: '#fff',
    letterSpacing: -0.5, marginTop: 4, lineHeight: 32,
  },
  greetingSub: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },

  progressBox: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 14, padding: 14, gap: 8, marginBottom: 20, zIndex: 1,
  },
  progressTopRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  progressLabel: { fontSize: 13, color: '#fff', fontWeight: '600' },
  progressPct: { fontSize: 15, color: '#fff', fontWeight: '800' },
  progressBarTrack: {
    height: 6, backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 3, overflow: 'hidden',
  },
  progressBarFill: { height: '100%', backgroundColor: '#fff', borderRadius: 3 },
  progressSub: { fontSize: 12, color: 'rgba(255,255,255,0.75)' },

  /* Body */
  body: {
    paddingHorizontal: 20, paddingTop: 20, gap: 16,
    backgroundColor: BG, marginTop: -16,
    zIndex: 1, position: 'relative',
  },

  /* Upgrade card (gold) */
  upgradeCard: {
    backgroundColor: BRAND_DARK,
    borderRadius: 16, padding: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 2, borderColor: GOLD,
    shadowColor: GOLD, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 12, elevation: 5,
  },
  upgradeCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  upgradeCardEmoji: { fontSize: 28 },
  upgradeCardTitle: { fontSize: 15, fontWeight: '800', color: GOLD },
  upgradeCardSub: { fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 2 },

  /* Pending card */
  pendingCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16,
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderWidth: 1.5, borderColor: '#FDE68A',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  pendingIconWrap: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: AMBER_BG,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  pendingCardTitle: { fontSize: 14.5, fontWeight: '700', color: AMBER },
  pendingCardSub: { fontSize: 12.5, color: INK_2, marginTop: 2, lineHeight: 17 },

  /* Brevet CTA card */
  brevetCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16,
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderWidth: 1, borderColor: BORDER,
    shadowColor: BRAND, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12, shadowRadius: 16, elevation: 4,
  },
  brevetCardIcon: {
    width: 46, height: 46, borderRadius: 13,
    backgroundColor: BRAND,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  brevetCardTitle: { fontSize: 15, fontWeight: '700', color: INK, letterSpacing: -0.2 },
  brevetCardSub: { fontSize: 13, color: INK_2, marginTop: 2 },

  /* Actions grid */
  actionsGrid: { flexDirection: 'row', gap: 12 },
  actionCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 16, gap: 8,
    borderWidth: 1, borderColor: BORDER,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  actionIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  actionTitle: { fontSize: 14, fontWeight: '700', color: INK, letterSpacing: -0.2 },
  actionSub: { fontSize: 12, color: INK_3 },

  /* Étapes card */
  etapesCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: BORDER,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  etapesCardHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 14,
  },
  sectionTitle: { fontSize: 15.5, fontWeight: '700', color: INK, letterSpacing: -0.2 },
  countBadge: { backgroundColor: BRAND_TINT, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  countBadgeText: { fontSize: 12, fontWeight: '700', color: BRAND },
  etapeDivider: { height: 1, backgroundColor: BORDER, marginVertical: 10 },
  etapeRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  etapeCircle: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: BORDER,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  etapeCircleDone: { backgroundColor: BRAND },
  etapeNum: { fontSize: 12, fontWeight: '700', color: INK_3 },
  etapeLabel: { fontSize: 14, color: INK_2, flex: 1 },
  etapeLabelDone: { color: INK_3, textDecorationLine: 'line-through' },

  /* Sessions preview */
  sectionRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 12,
  },
  voirTout: { fontSize: 13, color: BRAND, fontWeight: '600' },
  sessionCard: {
    backgroundColor: '#fff', borderRadius: 14, padding: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1, borderColor: BORDER, marginBottom: 8,
    borderLeftWidth: 3, borderLeftColor: BRAND,
  },
  sessionCardBody: { flex: 1, gap: 3, marginRight: 12 },
  sessionCardTitle: { fontSize: 14, fontWeight: '700', color: INK, letterSpacing: -0.2 },
  sessionCardMeta: { fontSize: 12.5, color: INK_2 },
  sessionCardRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  placesPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  placesPillText: { fontSize: 11.5, fontWeight: '700' },

  /* Empty */
  emptyCard: {
    backgroundColor: '#fff', borderRadius: 14, padding: 24,
    alignItems: 'center', gap: 10,
    borderWidth: 1, borderColor: BORDER,
  },
  emptyText: { fontSize: 13.5, color: INK_3, textAlign: 'center' },
});
