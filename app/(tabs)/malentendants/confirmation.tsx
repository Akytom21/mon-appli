import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef } from 'react';
import {
  Animated,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors, FontSize, Radius, Spacing } from '@/constants/theme';

type CategoryId = 'generaliste' | 'urgences' | 'specialiste' | 'pharmacie';

const CATEGORY_INFO: Record<CategoryId, { label: string; emoji: string }> = {
  generaliste: { label: 'Médecin généraliste', emoji: '🩺' },
  urgences:    { label: 'Urgences',             emoji: '🚨' },
  specialiste: { label: 'Spécialiste',          emoji: '👨‍⚕️' },
  pharmacie:   { label: 'Pharmacie',            emoji: '💊' },
};

function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr + 'T12:00:00').toLocaleDateString('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export default function ConfirmationScreen() {
  const params = useLocalSearchParams<{
    type: string;
    professionalName: string;
    address: string;
    date: string;
    time: string;
  }>();

  const category = (params.type as CategoryId) || 'generaliste';
  const info = CATEGORY_INFO[category] ?? CATEGORY_INFO.generaliste;

  /* ── Animations d'entrée ── */
  const iconScale  = useRef(new Animated.Value(0)).current;
  const iconOpacity = useRef(new Animated.Value(0)).current;
  const contentY   = useRef(new Animated.Value(30)).current;
  const contentOp  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(iconScale, {
          toValue: 1,
          friction: 5,
          tension: 120,
          useNativeDriver: true,
        }),
        Animated.timing(iconOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(contentY, {
          toValue: 0,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(contentOp, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Icône animée */}
        <Animated.View
          style={[
            styles.iconCircle,
            { opacity: iconOpacity, transform: [{ scale: iconScale }] },
          ]}
        >
          <Text style={styles.iconText}>✅</Text>
        </Animated.View>

        {/* Titre + sous-titre */}
        <Animated.View
          style={[
            styles.header,
            { opacity: contentOp, transform: [{ translateY: contentY }] },
          ]}
        >
          <Text style={styles.title}>Demande envoyée !</Text>
          <Text style={styles.subtitle}>
            Votre demande de rendez-vous avec un interprète LSF a bien été transmise. Un interprète disponible va l'accepter prochainement.
          </Text>
        </Animated.View>

        {/* Carte récapitulatif */}
        <Animated.View
          style={[
            styles.card,
            { opacity: contentOp, transform: [{ translateY: contentY }] },
          ]}
        >
          <Text style={styles.cardTitle}>📋 Récapitulatif</Text>

          <View style={styles.row}>
            <Text style={styles.rowLabel}>Type de soin</Text>
            <Text style={styles.rowValue}>
              {info.emoji}  {info.label}
            </Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.row}>
            <Text style={styles.rowLabel}>Professionnel</Text>
            <Text style={styles.rowValue} numberOfLines={2}>
              {params.professionalName || '—'}
            </Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.row}>
            <Text style={styles.rowLabel}>Adresse</Text>
            <Text style={styles.rowValue} numberOfLines={2}>
              📍 {params.address || '—'}
            </Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.row}>
            <Text style={styles.rowLabel}>Date</Text>
            <Text style={styles.rowValue}>{formatDate(params.date ?? '')}</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.row}>
            <Text style={styles.rowLabel}>Heure</Text>
            <Text style={styles.rowValue}>🕐 {params.time || '—'}</Text>
          </View>
        </Animated.View>

        {/* Statut en attente */}
        <Animated.View
          style={[
            styles.statusBox,
            { opacity: contentOp, transform: [{ translateY: contentY }] },
          ]}
        >
          <Text style={styles.statusDot}>🟠</Text>
          <View style={styles.statusTextWrap}>
            <Text style={styles.statusTitle}>En attente d'un interprète</Text>
            <Text style={styles.statusSub}>
              Suivez l'évolution de votre demande dans « Mes rendez-vous ».
            </Text>
          </View>
        </Animated.View>

        {/* Actions */}
        <Animated.View
          style={[
            styles.actions,
            { opacity: contentOp, transform: [{ translateY: contentY }] },
          ]}
        >
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => router.replace('/(tabs)/malentendants/mes-rdv')}
            accessibilityRole="button"
          >
            <Text style={styles.primaryBtnText}>📋  Voir mes rendez-vous</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => router.replace('/(tabs)/malentendants')}
            accessibilityRole="button"
          >
            <Text style={styles.secondaryBtnText}>Retour à l'espace</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
    alignItems: 'center',
    gap: Spacing.lg,
  },

  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: Radius.full,
    backgroundColor: Colors.malentendantsLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.lg,
    shadowColor: Colors.malentendants,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  iconText: { fontSize: 52 },

  header: { alignItems: 'center', gap: Spacing.sm, width: '100%' },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: '800',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: Spacing.sm,
  },

  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    width: '100%',
    gap: Spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  rowLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    flex: 1,
  },
  rowValue: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textPrimary,
    flex: 2,
    textAlign: 'right',
  },
  divider: { height: 1, backgroundColor: Colors.border },

  statusBox: {
    flexDirection: 'row',
    gap: Spacing.md,
    backgroundColor: '#FFF7ED',
    borderRadius: Radius.md,
    padding: Spacing.md,
    width: '100%',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  statusDot: { fontSize: 20, flexShrink: 0, marginTop: 1 },
  statusTextWrap: { flex: 1, gap: 3 },
  statusTitle: { fontSize: FontSize.sm, fontWeight: '700', color: '#92400E' },
  statusSub: { fontSize: FontSize.xs, color: '#B45309', lineHeight: 18 },

  actions: { width: '100%', gap: Spacing.sm },
  primaryBtn: {
    backgroundColor: Colors.malentendants,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    shadowColor: Colors.malentendants,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  primaryBtnText: { fontSize: FontSize.md, fontWeight: '700', color: Colors.white },
  secondaryBtn: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  secondaryBtnText: { fontSize: FontSize.md, color: Colors.textSecondary },
});
