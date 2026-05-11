import { router } from 'expo-router';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { Feather } from '@expo/vector-icons';

/* ── Tokens ────────────────────────────────────────────── */
const RED       = '#DC2626';
const RED_DARK  = '#B91C1C';
const RED_LIGHT = '#FEF2F2';
const RED_TINT  = '#FCA5A5';
const INK       = '#0F1B2D';
const INK_2     = '#475569';
const INK_3     = '#94A3B8';
const BG        = '#F6F8FA';
const BORDER    = '#E5EAF0';

/* ── Bouton SOS pulsant ────────────────────────────────── */
const PulsingSOSButton = memo(function PulsingSOSButton({
  onPress,
}: {
  onPress: () => void;
}) {
  const pulse1 = useRef(new Animated.Value(0)).current;
  const pulse2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop1 = Animated.loop(
      Animated.timing(pulse1, { toValue: 1, duration: 1800, useNativeDriver: true }),
    );
    const loop2 = Animated.loop(
      Animated.sequence([
        Animated.delay(600),
        Animated.timing(pulse2, { toValue: 1, duration: 1800, useNativeDriver: true }),
        Animated.timing(pulse2, { toValue: 0, duration: 0, useNativeDriver: true }),
        Animated.delay(0),
      ]),
    );
    loop1.start();
    loop2.start();
    return () => {
      loop1.stop();
      loop2.stop();
    };
  }, [pulse1, pulse2]);

  const makeRingStyle = (anim: Animated.Value) => ({
    transform: [{
      scale: anim.interpolate({ inputRange: [0, 1], outputRange: [1, 2.6] }),
    }],
    opacity: anim.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0.55, 0.2, 0] }),
  });

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.88}
      accessibilityRole="button"
      accessibilityLabel="SMS au 114 — service national d'urgence pour personnes sourdes"
      style={s.sosCenter}
    >
      <View style={s.pulseWrapper}>
        <Animated.View style={[s.pulseRing, makeRingStyle(pulse1)]} />
        <Animated.View style={[s.pulseRing, makeRingStyle(pulse2)]} />
        <View style={s.sosCircle}>
          <Text style={s.sosNum}>114</Text>
          <Text style={s.sosCircleLabel}>Urgences sourds</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
});

/* ── Bouton d'appel ────────────────────────────────────── */
const CallButton = memo(function CallButton({
  number, label, emoji, color, bg,
}: {
  number: string; label: string; emoji: string; color: string; bg: string;
}) {
  const handleCall = useCallback(async () => {
    try {
      await Linking.openURL(`tel:${number}`);
    } catch {
      Alert.alert(
        'Appel impossible',
        `Composez le ${number} depuis votre téléphone.`,
        [{ text: 'OK' }],
      );
    }
  }, [number]);

  return (
    <TouchableOpacity
      style={[s.callBtn, { backgroundColor: bg, borderColor: color + '50' }]}
      onPress={handleCall}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={`Appeler le ${number} — ${label}`}
    >
      <Text style={s.callBtnEmoji}>{emoji}</Text>
      <Text style={[s.callBtnNumber, { color }]}>{number}</Text>
      <Text style={[s.callBtnLabel, { color: color + 'CC' }]}>{label}</Text>
    </TouchableOpacity>
  );
});

/* ── Écran SOS ─────────────────────────────────────────── */
export default function SOSScreen() {
  const [loadingGPS, setLoadingGPS] = useState(false);

  const sendSMS114 = useCallback(async () => {
    setLoadingGPS(true);
    let locationText = '';

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        const lat = loc.coords.latitude.toFixed(5);
        const lon = loc.coords.longitude.toFixed(5);
        locationText = ` - Position GPS: https://maps.google.com/?q=${lat},${lon}`;
      }
    } catch {
      // Continue without GPS
    } finally {
      setLoadingGPS(false);
    }

    const body = `URGENCE - J'ai besoin d'aide${locationText}`;
    const smsUrl =
      Platform.OS === 'ios'
        ? `sms:114&body=${encodeURIComponent(body)}`
        : `sms:114?body=${encodeURIComponent(body)}`;

    try {
      await Linking.openURL(smsUrl);
    } catch {
      Alert.alert(
        'SMS indisponible',
        'Impossible d\'ouvrir l\'application SMS.\n\nEnvoyez manuellement un SMS au 114 avec votre adresse.',
        [{ text: 'OK' }],
      );
    }
  }, []);

  return (
    <SafeAreaView style={s.safe}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity
          style={s.backBtn}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Retour"
        >
          <Feather name="chevron-left" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>SOS Urgences</Text>
        <View style={s.headerBadge}>
          <Text style={s.headerBadgeText}>24h/24</Text>
        </View>
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Section 114 */}
        <View style={s.section114}>
          <Text style={s.section114Title}>Numéro d'urgence pour personnes sourdes</Text>

          <PulsingSOSButton onPress={sendSMS114} />

          <Text style={s.section114Desc}>
            Le 114 est le numéro national d'urgence pour les personnes sourdes et malentendantes.
            Disponible 7j/7, 24h/24.
          </Text>

          {/* Bouton SMS principal */}
          <TouchableOpacity
            style={s.smsBtn}
            onPress={sendSMS114}
            activeOpacity={0.85}
            disabled={loadingGPS}
            accessibilityRole="button"
            accessibilityLabel="Envoyer un SMS au 114 avec ma position GPS"
          >
            {loadingGPS ? (
              <>
                <ActivityIndicator color="#fff" size="small" />
                <Text style={s.smsBtnText}>Localisation en cours…</Text>
              </>
            ) : (
              <>
                <Feather name="map-pin" size={18} color="#fff" />
                <Text style={s.smsBtnText}>Envoyer SMS au 114 avec ma position</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={s.smsInfo}>
            <Feather name="info" size={13} color={RED} />
            <Text style={s.smsInfoText}>
              Votre position GPS sera automatiquement ajoutée au message.
            </Text>
          </View>
        </View>

        {/* Appels d'urgence */}
        <View style={s.callSection}>
          <Text style={s.callSectionTitle}>Appels d'urgence</Text>
          <View style={s.callGrid}>
            <CallButton
              number="15"
              label="SAMU"
              emoji="🚑"
              color={RED}
              bg={RED_LIGHT}
            />
            <CallButton
              number="18"
              label="Pompiers"
              emoji="🚒"
              color="#EA580C"
              bg="#FFF7ED"
            />
            <CallButton
              number="17"
              label="Police"
              emoji="👮"
              color="#2563EB"
              bg="#EFF6FF"
            />
          </View>
          <Text style={s.callNote}>
            Appuyez pour composer directement depuis votre téléphone.
          </Text>
        </View>

        {/* Comment utiliser le 114 */}
        <View style={s.howCard}>
          <Text style={s.howTitle}>📱  Comment utiliser le 114</Text>
          <View style={s.howSteps}>
            {[
              { num: '1', text: 'Appuyez sur "Envoyer SMS au 114" ci-dessus' },
              { num: '2', text: 'Le message est pré-rempli avec votre position GPS' },
              { num: '3', text: 'Envoyez le SMS — les secours vous localisent' },
              { num: '4', text: 'Restez disponible pour les SMS de réponse' },
              { num: '5', text: 'L\'appli 114 permet aussi la vidéo en LSF' },
            ].map((step) => (
              <View key={step.num} style={s.howStep}>
                <View style={s.howStepNum}>
                  <Text style={s.howStepNumText}>{step.num}</Text>
                </View>
                <Text style={s.howStepText}>{step.text}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Info numéros */}
        <View style={s.infoCard}>
          <Feather name="phone-call" size={16} color={RED} />
          <View style={{ flex: 1 }}>
            <Text style={s.infoCardTitle}>Numéros d'urgence européens</Text>
            <Text style={s.infoCardText}>
              En Europe, le <Text style={s.bold}>112</Text> est le numéro unique depuis n'importe quel téléphone, même sans carte SIM.
            </Text>
          </View>
        </View>

        {/* Disclaimer */}
        <View style={s.disclaimer}>
          <Text style={s.disclaimerText}>
            ⚠️  Cette application facilite l'accès aux secours mais ne remplace pas les services officiels.
            En cas d'urgence, utilisez toujours les canaux officiels (114, 15, 18, 17).
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ── Styles ────────────────────────────────────────────── */
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: RED },

  header: {
    backgroundColor: RED,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 14,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { flex: 1, fontSize: 20, fontWeight: '800', color: '#fff', letterSpacing: -0.4 },
  headerBadge: {
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4,
  },
  headerBadgeText: { fontSize: 12, fontWeight: '700', color: '#fff' },

  scroll: { flex: 1, backgroundColor: BG },
  scrollContent: { padding: 16, paddingBottom: 48, gap: 16 },

  /* Section 114 */
  section114: {
    backgroundColor: '#fff', borderRadius: 20, padding: 20, gap: 16,
    alignItems: 'center',
    borderWidth: 1, borderColor: RED_TINT,
    shadowColor: RED, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 12, elevation: 4,
  },
  section114Title: {
    fontSize: 14, fontWeight: '700', color: INK_2,
    textAlign: 'center', letterSpacing: 0.2,
  },

  sosCenter: { alignItems: 'center', justifyContent: 'center', height: 120 },
  pulseWrapper: { alignItems: 'center', justifyContent: 'center', width: 120, height: 120 },
  pulseRing: {
    position: 'absolute',
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: RED,
  },
  sosCircle: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: RED,
    alignItems: 'center', justifyContent: 'center', gap: 0,
    shadowColor: RED, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45, shadowRadius: 14, elevation: 8,
  },
  sosNum: { fontSize: 30, fontWeight: '900', color: '#fff', letterSpacing: -1 },
  sosCircleLabel: { fontSize: 9, fontWeight: '700', color: 'rgba(255,255,255,0.85)', letterSpacing: 0.5 },

  section114Desc: {
    fontSize: 13, color: INK_2, textAlign: 'center', lineHeight: 19,
    paddingHorizontal: 4,
  },

  smsBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: RED, borderRadius: 14, padding: 14,
    width: '100%', justifyContent: 'center',
    shadowColor: RED, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 10, elevation: 5,
  },
  smsBtnText: { fontSize: 15, fontWeight: '800', color: '#fff' },

  smsInfo: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    backgroundColor: RED_LIGHT, borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 8, width: '100%',
  },
  smsInfoText: { flex: 1, fontSize: 12.5, color: RED_DARK, lineHeight: 18 },

  /* Appels */
  callSection: { gap: 10 },
  callSectionTitle: { fontSize: 16, fontWeight: '800', color: INK, paddingHorizontal: 4 },
  callGrid: { flexDirection: 'row', gap: 10 },
  callBtn: {
    flex: 1, borderRadius: 16, padding: 14,
    alignItems: 'center', gap: 4,
    borderWidth: 1.5,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  callBtnEmoji: { fontSize: 28 },
  callBtnNumber: { fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },
  callBtnLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.3 },
  callNote: { fontSize: 12, color: INK_3, textAlign: 'center', paddingHorizontal: 4 },

  /* Comment utiliser */
  howCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16, gap: 12,
    borderWidth: 1, borderColor: BORDER,
  },
  howTitle: { fontSize: 15, fontWeight: '800', color: INK },
  howSteps: { gap: 10 },
  howStep: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  howStepNum: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: RED, alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  howStepNumText: { fontSize: 12, fontWeight: '800', color: '#fff' },
  howStepText: { flex: 1, fontSize: 14, color: INK_2, lineHeight: 20, paddingTop: 2 },

  /* Info card */
  infoCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    backgroundColor: RED_LIGHT, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: RED_TINT,
  },
  infoCardTitle: { fontSize: 13.5, fontWeight: '700', color: INK, marginBottom: 3 },
  infoCardText: { fontSize: 13, color: INK_2, lineHeight: 19 },
  bold: { fontWeight: '700', color: INK },

  /* Disclaimer */
  disclaimer: {
    backgroundColor: '#FFF3CD', borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: '#F59E0B50',
  },
  disclaimerText: { fontSize: 12, color: '#92400E', lineHeight: 18, textAlign: 'center' },
});
