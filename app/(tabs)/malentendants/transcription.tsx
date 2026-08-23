import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/config/firebase';

const BG     = '#0D1117';
const BG2    = '#161B22';
const CARD   = '#1C2333';
const RED    = '#EF4444';
const GREEN  = '#22C55E';
const WHITE  = '#F8FAFC';
const GRAY   = '#8B9DB5';
const BORDER = '#2A3441';
const MIC    = 80;

type Line = { id: string; text: string; ts: number };

export default function TranscriptionScreen() {
  const { appointmentId } = useLocalSearchParams<{ appointmentId?: string }>();

  const [listening, setListening] = useState(false);
  const [interim, setInterim]     = useState('');
  const [history, setHistory]     = useState<Line[]>([]);
  const [saving, setSaving]       = useState(false);
  const scrollRef   = useRef<ScrollView>(null);
  const interimRef  = useRef('');
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => { isMountedRef.current = false; };
  }, []);

  /* ── Pulsing rings ─────────────────────────────────── */
  const ring1 = useRef(new Animated.Value(0)).current;
  const ring2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!listening) {
      ring1.setValue(0);
      ring2.setValue(0);
      return;
    }
    const loop1 = Animated.loop(
      Animated.timing(ring1, { toValue: 1, duration: 1100, easing: Easing.out(Easing.ease), useNativeDriver: true }),
    );
    const loop2 = Animated.loop(
      Animated.sequence([
        Animated.delay(550),
        Animated.timing(ring2, { toValue: 1, duration: 1100, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      ]),
    );
    loop1.start();
    loop2.start();
    return () => { loop1.stop(); loop2.stop(); };
  }, [listening, ring1, ring2]);

  const rScale1 = ring1.interpolate({ inputRange: [0, 1], outputRange: [1, 3.0] });
  const rOpac1  = ring1.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0.55, 0.2, 0] });
  const rScale2 = ring2.interpolate({ inputRange: [0, 1], outputRange: [1, 2.4] });
  const rOpac2  = ring2.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0.4, 0.15, 0] });

  /* ── Speech events ─────────────────────────────────── */
  useSpeechRecognitionEvent('result', (event) => {
    if (!isMountedRef.current) return;
    const transcript = event.results[0]?.transcript ?? '';
    if (!event.isFinal) {
      setInterim(transcript);
      interimRef.current = transcript;
      return;
    }
    const text = transcript.trim();
    if (text) {
      setHistory((h) => [...h, { id: `${Date.now()}-${Math.random()}`, text, ts: Date.now() }]);
    }
    setInterim('');
    interimRef.current = '';
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
  });

  useSpeechRecognitionEvent('start', () => { if (isMountedRef.current) setListening(true); });

  useSpeechRecognitionEvent('end', () => {
    if (!isMountedRef.current) return;
    setListening(false);
    const leftover = interimRef.current.trim();
    if (leftover) {
      setHistory((h) => [...h, { id: `${Date.now()}-end`, text: leftover, ts: Date.now() }]);
      setInterim('');
      interimRef.current = '';
    }
  });

  useSpeechRecognitionEvent('error', (e) => {
    if (!isMountedRef.current) return;
    setListening(false);
    if (e.error !== 'aborted' && e.error !== 'no-speech') {
      Alert.alert('Erreur micro', 'La reconnaissance vocale a échoué. Réessayez.');
    }
  });

  /* ── Controls ──────────────────────────────────────── */
  const startListening = useCallback(async () => {
    const { granted } = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!granted) {
      Alert.alert('Permission requise', 'Autorisez l\'accès au microphone et à la reconnaissance vocale dans les Réglages.');
      return;
    }
    ExpoSpeechRecognitionModule.start({
      lang: 'fr-FR',
      interimResults: true,
      continuous: true,
      requiresOnDeviceRecognition: false,
    });
  }, []);

  const stopListening = useCallback(() => {
    ExpoSpeechRecognitionModule.stop();
  }, []);

  const toggle = useCallback(() => {
    if (listening) stopListening(); else startListening();
  }, [listening, startListening, stopListening]);

  const fullText = [
    ...history.map((l) => l.text),
    ...(interim.trim() ? [interim.trim()] : []),
  ].join('\n\n');

  const handleCopy = useCallback(async () => {
    if (!fullText.trim()) return;
    await Clipboard.setStringAsync(fullText);
    Alert.alert('Copié !', 'La transcription est dans le presse-papiers.');
  }, [fullText]);

  const handleShare = useCallback(() => {
    if (!fullText.trim()) return;
    Share.share({ message: fullText, title: 'Transcription RDV — PharmaSign' });
  }, [fullText]);

  const handleClear = useCallback(() => {
    Alert.alert('Effacer la transcription', 'Cette action est irréversible.', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Effacer',
        style: 'destructive',
        onPress: () => { setHistory([]); setInterim(''); interimRef.current = ''; },
      },
    ]);
  }, []);

  const handleSave = useCallback(async () => {
    if (!appointmentId || !fullText.trim()) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'appointments', appointmentId), {
        transcription: fullText,
        transcriptionUpdatedAt: serverTimestamp(),
      });
      Alert.alert('Sauvegardé ✓', 'Transcription enregistrée dans votre rendez-vous.');
    } catch {
      Alert.alert('Erreur', 'Impossible de sauvegarder. Vérifiez votre connexion.');
    } finally {
      setSaving(false);
    }
  }, [appointmentId, fullText]);

  const hasContent = history.length > 0 || interim.trim().length > 0;

  return (
    <SafeAreaView style={s.safe}>

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity
          style={s.backBtn}
          onPress={() => { if (listening) stopListening(); router.back(); }}
          accessibilityRole="button"
          accessibilityLabel="Retour"
        >
          <Feather name="chevron-left" size={22} color={WHITE} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>Transcription vocale</Text>
          <Text style={s.headerSub}>Mode RDV · Français</Text>
        </View>
        {listening && (
          <View style={s.liveChip}>
            <View style={s.liveDot} />
            <Text style={s.liveText}>ACTIF</Text>
          </View>
        )}
      </View>

      {/* Info banner */}
      <View style={s.infoBanner}>
        <Feather name="info" size={14} color="#7FB3CC" />
        <Text style={s.infoBannerText}>
          Montrez cet écran à votre médecin pour qu'il parle dans le micro
        </Text>
      </View>

      {/* Transcript area */}
      <ScrollView
        ref={scrollRef}
        style={s.scroll}
        contentContainerStyle={[s.scrollContent, !hasContent && s.scrollCenter]}
        showsVerticalScrollIndicator={false}
      >
        {!hasContent ? (
          <View style={s.emptyState}>
            <Text style={s.emptyIcon}>🎙️</Text>
            <Text style={s.emptyTitle}>Prêt à transcrire</Text>
            <Text style={s.emptySub}>
              Appuyez sur le micro{'\n'}et parlez clairement en français
            </Text>
          </View>
        ) : (
          <>
            {history.map((line) => (
              <View key={line.id} style={s.line}>
                <Text style={s.lineText}>{line.text}</Text>
                <Text style={s.lineTime}>
                  {new Date(line.ts).toLocaleTimeString('fr-FR', {
                    hour: '2-digit', minute: '2-digit', second: '2-digit',
                  })}
                </Text>
              </View>
            ))}
            {interim.trim().length > 0 && (
              <View style={[s.line, s.interimLine]}>
                <Text style={s.interimText}>{interim}</Text>
                <View style={s.interimBadge}>
                  <ActivityIndicator
                    size="small" color={RED}
                    style={{ transform: [{ scale: 0.7 }] }}
                  />
                  <Text style={s.interimLabel}>En cours…</Text>
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Mic button */}
      <View style={s.micSection}>
        <View style={s.micWrap}>
          <Animated.View style={[s.ring, { transform: [{ scale: rScale1 }], opacity: rOpac1 }]} />
          <Animated.View style={[s.ring, { transform: [{ scale: rScale2 }], opacity: rOpac2 }]} />
          <TouchableOpacity
            style={[s.micBtn, listening && s.micBtnOn]}
            onPress={toggle}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={listening ? 'Arrêter la reconnaissance vocale' : 'Démarrer la reconnaissance vocale'}
            accessibilityState={{ selected: listening }}
          >
            <Feather name={listening ? 'mic' : 'mic-off'} size={38} color={WHITE} />
          </TouchableOpacity>
        </View>
        <Text style={s.micHint}>
          {listening ? '● Appuyez pour arrêter' : 'Appuyez pour parler'}
        </Text>
      </View>

      {/* Action bar */}
      <View style={s.actions}>
        <TouchableOpacity
          style={[s.actionBtn, !hasContent && s.dim]}
          onPress={handleClear}
          disabled={!hasContent}
          accessibilityRole="button"
        >
          <Feather name="trash-2" size={15} color={hasContent ? '#F87171' : GRAY} />
          <Text style={[s.actionLabel, { color: hasContent ? '#F87171' : GRAY }]}>Effacer</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[s.actionBtn, !hasContent && s.dim]}
          onPress={handleCopy}
          disabled={!hasContent}
          accessibilityRole="button"
        >
          <Feather name="copy" size={15} color={hasContent ? WHITE : GRAY} />
          <Text style={[s.actionLabel, { color: hasContent ? WHITE : GRAY }]}>Copier</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[s.actionBtn, !hasContent && s.dim]}
          onPress={handleShare}
          disabled={!hasContent}
          accessibilityRole="button"
        >
          <Feather name="share" size={15} color={hasContent ? WHITE : GRAY} />
          <Text style={[s.actionLabel, { color: hasContent ? WHITE : GRAY }]}>Partager</Text>
        </TouchableOpacity>

        {appointmentId ? (
          <TouchableOpacity
            style={[s.actionBtn, s.saveBtn, (!hasContent || saving) && s.dim]}
            onPress={handleSave}
            disabled={!hasContent || saving}
            accessibilityRole="button"
          >
            {saving
              ? <ActivityIndicator size="small" color={GREEN} style={{ transform: [{ scale: 0.75 }] }} />
              : <Feather name="save" size={15} color={GREEN} />
            }
            <Text style={[s.actionLabel, { color: GREEN }]}>Sauvegarder</Text>
          </TouchableOpacity>
        ) : null}
      </View>

    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },

  /* Header */
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: BG2,
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: BORDER,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 16, fontWeight: '700', color: WHITE, letterSpacing: -0.3 },
  headerSub:   { fontSize: 12, color: GRAY, marginTop: 1 },
  liveChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(239,68,68,0.12)',
    borderWidth: 1, borderColor: 'rgba(239,68,68,0.5)',
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999,
  },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: RED },
  liveText: { fontSize: 10, fontWeight: '800', color: RED, letterSpacing: 0.8 },

  /* Info */
  infoBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#111827',
    borderBottomWidth: 1, borderBottomColor: BORDER,
    paddingHorizontal: 16, paddingVertical: 11,
  },
  infoBannerText: { flex: 1, fontSize: 13, color: '#A0B4C8', lineHeight: 18 },

  /* Transcript */
  scroll: { flex: 1 },
  scrollContent: { padding: 20, gap: 12, paddingBottom: 24 },
  scrollCenter:  { flexGrow: 1 },

  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
  emptyIcon:  { fontSize: 56, marginBottom: 4 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: WHITE, textAlign: 'center' },
  emptySub:   { fontSize: 15, color: GRAY, textAlign: 'center', lineHeight: 22 },

  line: {
    backgroundColor: CARD, borderRadius: 16, padding: 18,
    borderWidth: 1, borderColor: BORDER, gap: 8,
  },
  lineText: { fontSize: 24, color: WHITE, lineHeight: 34, fontWeight: '500', letterSpacing: -0.3 },
  lineTime: { fontSize: 11, color: GRAY },

  interimLine: {
    borderColor: 'rgba(239,68,68,0.3)',
    backgroundColor: 'rgba(239,68,68,0.05)',
  },
  interimText:  { fontSize: 24, color: '#FCA5A5', lineHeight: 34, fontWeight: '500', letterSpacing: -0.3 },
  interimBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  interimLabel: { fontSize: 11, color: '#F87171' },

  /* Mic */
  micSection: { alignItems: 'center', paddingTop: 24, paddingBottom: 20, gap: 14 },
  micWrap: { width: MIC, height: MIC, alignItems: 'center', justifyContent: 'center' },
  ring: {
    position: 'absolute',
    width: MIC, height: MIC, borderRadius: MIC / 2,
    backgroundColor: RED,
  },
  micBtn: {
    width: MIC, height: MIC, borderRadius: MIC / 2,
    backgroundColor: '#2D3748',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4, shadowRadius: 14, elevation: 10,
    zIndex: 1,
  },
  micBtnOn: {
    backgroundColor: RED,
    shadowColor: RED, shadowOpacity: 0.55,
  },
  micHint: { fontSize: 13.5, color: GRAY, fontWeight: '600' },

  /* Actions */
  actions: {
    flexDirection: 'row', gap: 8,
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: BG2, borderTopWidth: 1, borderTopColor: BORDER,
  },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5,
    backgroundColor: CARD, borderRadius: 12, paddingVertical: 11,
    borderWidth: 1, borderColor: BORDER,
  },
  saveBtn: {
    borderColor: 'rgba(34,197,94,0.3)',
    backgroundColor: 'rgba(34,197,94,0.08)',
  },
  dim: { opacity: 0.35 },
  actionLabel: { fontSize: 12, fontWeight: '700', color: WHITE },
});
