import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { useFormations } from '@/hooks/useFormations';
import { useApprentisProgress } from '@/hooks/useApprentisProgress';
import { Colors, FontSize, Radius, Spacing } from '@/constants/theme';

const NIVEAU_COLOR: Record<string, string> = {
  Débutant: '#10B981',
  Intermédiaire: Colors.warning,
  Avancé: Colors.malentendants,
  Expert: Colors.error,
};

export default function ApprentisHome() {
  const { user, upgradeToInterprete } = useAuth();
  const { formations, loading: formationsLoading } = useFormations();
  const { etapes, done, progress } = useApprentisProgress();
  const [upgrading, setUpgrading] = useState(false);

  const handleUpgrade = async () => {
    setUpgrading(true);
    await upgradeToInterprete();
    router.replace('/(tabs)');
  };

  // Show at most 3 sessions on the home screen
  const previewSessions = formations.slice(0, 3);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Banner */}
        <View style={styles.banner}>
          <Text style={styles.bannerTitle}>Mon parcours 📚</Text>
          <Text style={styles.bannerSub}>
            Devenez interprète LSF agréé(e) en milieu médical
          </Text>
          <View style={styles.progressBox}>
            <View style={styles.progressRow}>
              <Text style={styles.progressLabel}>Progression</Text>
              <Text style={styles.progressPct}>{Math.round(progress * 100)}%</Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress * 100}%` as any }]} />
            </View>
            <Text style={styles.progressSub}>
              {done}/{etapes.length} étapes complétées
            </Text>
          </View>
        </View>

        {/* Brevet / upgrade section */}
        {user?.brevetValidated ? (
          <TouchableOpacity
            style={styles.upgradeBtn}
            onPress={handleUpgrade}
            disabled={upgrading}
            activeOpacity={0.85}
            accessibilityRole="button"
          >
            <Text style={styles.upgradeBtnEmoji}>🌟</Text>
            <View style={styles.upgradeBtnText}>
              <Text style={styles.upgradeBtnTitle}>Brevet validé !</Text>
              <Text style={styles.upgradeBtnSub}>
                {upgrading ? 'Mise à jour en cours...' : 'Devenir Interprète agréé →'}
              </Text>
            </View>
            {!upgrading && <Text style={styles.upgradeBtnArrow}>›</Text>}
          </TouchableOpacity>
        ) : user?.brevetSubmitted ? (
          <View style={styles.brevetPending}>
            <Text style={styles.brevetPendingEmoji}>⏳</Text>
            <View style={styles.brevetPendingText}>
              <Text style={styles.brevetPendingTitle}>Brevet en cours de validation</Text>
              <Text style={styles.brevetPendingSub}>
                Votre dossier est examiné par le jury. Vous serez notifié(e) du résultat.
              </Text>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.brevetBtn}
            onPress={() => router.push('/(tabs)/apprentis/brevet')}
            activeOpacity={0.85}
            accessibilityRole="button"
          >
            <Text style={styles.brevetBtnEmoji}>🎓</Text>
            <View style={styles.brevetBtnText}>
              <Text style={styles.brevetBtnTitle}>Soumettre mon brevet LSF</Text>
              <Text style={styles.brevetBtnSub}>Évoluer vers le statut Interprète agréé</Text>
            </View>
            <Text style={styles.brevetBtnArrow}>›</Text>
          </TouchableOpacity>
        )}

        {/* Étapes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Étapes du parcours</Text>
          {etapes.map((etape) => (
            <View key={etape.id} style={styles.etapeRow}>
              <View
                style={[
                  styles.etapeCheck,
                  { backgroundColor: etape.done ? Colors.apprentis : Colors.border },
                ]}
              >
                <Text style={styles.etapeCheckText}>{etape.done ? '✓' : etape.id}</Text>
              </View>
              <Text style={[styles.etapeLabel, etape.done && styles.etapeDone]}>
                {etape.label}
              </Text>
            </View>
          ))}
        </View>

        {/* Sessions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Sessions disponibles</Text>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/apprentis/formation')}
              accessibilityRole="button"
            >
              <Text style={styles.voirTout}>Voir tout →</Text>
            </TouchableOpacity>
          </View>

          {formationsLoading ? (
            <ActivityIndicator color={Colors.apprentis} style={{ marginTop: Spacing.md }} />
          ) : (
            previewSessions.map((session) => {
              const niveauColor = NIVEAU_COLOR[session.niveau] ?? Colors.apprentis;
              return (
                <TouchableOpacity
                  key={session.id}
                  style={styles.sessionCard}
                  onPress={() => router.push('/(tabs)/apprentis/formation')}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                >
                  <View style={styles.sessionTop}>
                    <Text style={styles.sessionTitre}>{session.titre}</Text>
                    <View
                      style={[
                        styles.niveauBadge,
                        { backgroundColor: niveauColor + '22' },
                      ]}
                    >
                      <Text style={[styles.niveauText, { color: niveauColor }]}>
                        {session.niveau}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.sessionMeta}>👤 {session.formateur}</Text>
                  <Text style={styles.sessionMeta}>
                    📅 {session.date} · {session.heure}
                  </Text>
                  <Text style={styles.sessionMeta}>📍 {session.lieu}</Text>
                  <View style={styles.sessionBottom}>
                    <View
                      style={[
                        styles.placesBadge,
                        {
                          backgroundColor:
                            session.places <= 2 ? '#FEE2E2' : Colors.apprentisLight,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.placesText,
                          {
                            color:
                              session.places <= 2 ? Colors.error : Colors.apprentis,
                          },
                        ]}
                      >
                        {session.places <= 0
                          ? 'Complet'
                          : `${session.places} place${session.places > 1 ? 's' : ''} restante${session.places > 1 ? 's' : ''}`}
                      </Text>
                    </View>
                    <Text style={styles.reserverLink}>Réserver →</Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.apprentis },
  scroll: { flex: 1, backgroundColor: Colors.background },
  content: { paddingBottom: Spacing.xxl },

  banner: {
    backgroundColor: Colors.apprentis,
    padding: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xl,
    gap: Spacing.sm,
  },
  bannerTitle: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.white },
  bannerSub: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.85)', lineHeight: 20 },
  progressBox: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between' },
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

  upgradeBtn: {
    margin: Spacing.lg,
    backgroundColor: '#1A6B60',
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  upgradeBtnEmoji: { fontSize: 30, flexShrink: 0 },
  upgradeBtnText: { flex: 1, gap: 3 },
  upgradeBtnTitle: { fontSize: FontSize.md, fontWeight: '800', color: '#FFD700' },
  upgradeBtnSub: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.9)' },
  upgradeBtnArrow: { fontSize: 28, color: '#FFD700', flexShrink: 0, lineHeight: 32 },

  brevetBtn: {
    margin: Spacing.lg,
    backgroundColor: Colors.apprentisDark,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    shadowColor: Colors.apprentis,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  brevetBtnEmoji: { fontSize: 30, flexShrink: 0 },
  brevetBtnText: { flex: 1, gap: 3 },
  brevetBtnTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.white },
  brevetBtnSub: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.85)' },
  brevetBtnArrow: { fontSize: 28, color: Colors.white, flexShrink: 0, lineHeight: 32 },

  brevetPending: {
    margin: Spacing.lg,
    backgroundColor: Colors.apprentisLight,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    borderWidth: 2,
    borderColor: Colors.apprentis,
  },
  brevetPendingEmoji: { fontSize: 28, flexShrink: 0 },
  brevetPendingText: { flex: 1, gap: 4 },
  brevetPendingTitle: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.apprentisDark,
  },
  brevetPendingSub: {
    fontSize: FontSize.sm,
    color: Colors.apprentisDark,
    lineHeight: 20,
  },

  section: { padding: Spacing.lg, gap: Spacing.sm, paddingTop: 0 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  voirTout: { fontSize: FontSize.sm, color: Colors.apprentis, fontWeight: '600' },

  etapeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  etapeCheck: {
    width: 28,
    height: 28,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  etapeCheckText: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.white },
  etapeLabel: { fontSize: FontSize.md, color: Colors.textPrimary },
  etapeDone: { textDecorationLine: 'line-through', color: Colors.textSecondary },

  sessionCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.xs,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: Colors.apprentis,
  },
  sessionTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  sessionTitre: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.textPrimary,
    flex: 1,
  },
  niveauBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.full,
    flexShrink: 0,
  },
  niveauText: { fontSize: FontSize.xs, fontWeight: '700' },
  sessionMeta: { fontSize: FontSize.sm, color: Colors.textSecondary },
  sessionBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  placesBadge: { paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: Radius.full },
  placesText: { fontSize: FontSize.xs, fontWeight: '600' },
  reserverLink: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.apprentis },
});
