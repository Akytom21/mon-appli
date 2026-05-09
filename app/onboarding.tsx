import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type ViewToken,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: W } = Dimensions.get('window');
const BRAND       = '#0F766E';
const BRAND_DARK  = '#0B5F58';
const STORAGE_KEY = '@pharmasign_onboarding_done';

/* ── Data ────────────────────────────────────────────────────── */
type SlideData = {
  key:      string;
  useLogo?: boolean;
  emoji?:   string;
  badge:    string;
  title:    string;
  subtitle: string;
};

const SLIDES: SlideData[] = [
  {
    key:      'welcome',
    useLogo:  true,
    badge:    '💊',
    title:    'Bienvenue sur\nPharmaSign',
    subtitle: "L'accès aux soins de santé en langue des signes française",
  },
  {
    key:      'deaf',
    emoji:    '👐',
    badge:    '📍',
    title:    'Trouvez un interprète',
    subtitle: 'Prenez rendez-vous avec un interprète LSF agréé près de chez vous en quelques secondes',
  },
  {
    key:      'interpreter',
    emoji:    '📅',
    badge:    '✅',
    title:    'Gérez vos missions',
    subtitle: "Acceptez des missions, gérez votre planning et aidez les personnes malentendantes",
  },
  {
    key:      'apprentice',
    emoji:    '📚',
    badge:    '🎓',
    title:    'Devenez interprète agréé',
    subtitle: 'Formez-vous, passez votre brevet LSF et rejoignez le réseau PharmaSign',
  },
];

/* ── Helpers ─────────────────────────────────────────────────── */
async function completeOnboarding() {
  try { await AsyncStorage.setItem(STORAGE_KEY, 'true'); } catch { /* silent */ }
  router.replace('/(auth)/login');
}

/* ── SlideItem ───────────────────────────────────────────────── */
function SlideItem({ slide }: { slide: SlideData }) {
  return (
    <View style={[st.slide, { width: W }]}>
      {/* Decorative circles — purement décoratives */}
      <View style={st.deco1} />
      <View style={st.deco2} />
      <View style={st.deco3} />

      {/* Illustration */}
      <View style={st.illustBox}>
        {slide.useLogo ? (
          <Image
            source={require('@/assets/images/logo.png')}
            style={st.logoImg}
            resizeMode="contain"
            accessible={false}
          />
        ) : (
          <Text style={st.mainEmoji} accessible={false}>{slide.emoji}</Text>
        )}
        <View style={st.badgeWrap}>
          <Text style={st.badgeEmoji} accessible={false}>{slide.badge}</Text>
        </View>
      </View>

      {/* Text */}
      <View style={st.textBlock}>
        <Text style={st.title}>{slide.title}</Text>
        <Text style={st.subtitle}>{slide.subtitle}</Text>
      </View>
    </View>
  );
}

/* ── Main screen ─────────────────────────────────────────────── */
export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef  = useRef<FlatList<SlideData>>(null);
  const scrollX  = useRef(new Animated.Value(0)).current;

  const isLast = activeIndex === SLIDES.length - 1;

  const goNext = useCallback(() => {
    if (!isLast) {
      listRef.current?.scrollToIndex({ index: activeIndex + 1, animated: true });
    } else {
      completeOnboarding();
    }
  }, [activeIndex, isLast]);

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const idx = viewableItems[0]?.index;
      if (idx != null) setActiveIndex(idx);
    },
    [],
  );

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 });

  return (
    <View style={st.root}>
      {/* ── Bouton Passer ──────────────────────── */}
      {!isLast && (
        <TouchableOpacity
          style={[st.skipBtn, { top: insets.top + 10 }]}
          onPress={completeOnboarding}
          accessibilityRole="button"
          accessibilityLabel="Passer l'introduction"
          accessibilityHint="Double-tapez pour accéder directement à la connexion"
        >
          <Text style={st.skipText}>Passer</Text>
        </TouchableOpacity>
      )}

      {/* ── Slides ─────────────────────────────── */}
      <FlatList
        ref={listRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        keyExtractor={(item) => item.key}
        renderItem={({ item }) => <SlideItem slide={item} />}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false },
        )}
        scrollEventThrottle={16}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig.current}
        style={st.list}
        accessibilityLabel="Présentation de PharmaSign"
      />

      {/* ── Barre inférieure ────────────────────── */}
      <View style={[st.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>

        {/* Dots de pagination */}
        <View
          style={st.dotsRow}
          accessibilityLabel={`Étape ${activeIndex + 1} sur ${SLIDES.length}`}
        >
          {SLIDES.map((_, i) => {
            const range: [number, number, number] = [(i - 1) * W, i * W, (i + 1) * W];
            const dotW = scrollX.interpolate({
              inputRange: range, outputRange: [8, 28, 8], extrapolate: 'clamp',
            });
            const dotO = scrollX.interpolate({
              inputRange: range, outputRange: [0.3, 1, 0.3], extrapolate: 'clamp',
            });
            return (
              <Animated.View
                key={i}
                style={[st.dot, { width: dotW, opacity: dotO }]}
                accessible={false}
              />
            );
          })}
        </View>

        {/* CTA */}
        <TouchableOpacity
          style={st.ctaBtn}
          onPress={goNext}
          activeOpacity={0.88}
          accessibilityRole="button"
          accessibilityLabel={isLast ? 'Commencer à utiliser PharmaSign' : 'Afficher le slide suivant'}
        >
          <Text style={st.ctaBtnText}>
            {isLast ? 'Commencer ✓' : 'Suivant →'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

/* ── Styles ──────────────────────────────────────────────────── */
const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: BRAND },

  /* Bouton Passer */
  skipBtn: {
    position: 'absolute',
    right: 20,
    zIndex: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  skipText: { fontSize: 13.5, fontWeight: '600', color: '#fff', letterSpacing: 0.1 },

  list: { flex: 1 },

  /* Slide */
  slide: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    gap: 44,
  },

  /* Cercles décoratifs */
  deco1: {
    position: 'absolute',
    width: 340, height: 340, borderRadius: 170,
    backgroundColor: 'rgba(255,255,255,0.07)',
    top: -120, right: -80,
  },
  deco2: {
    position: 'absolute',
    width: 220, height: 220, borderRadius: 110,
    backgroundColor: 'rgba(255,255,255,0.05)',
    bottom: 40, left: -70,
  },
  deco3: {
    position: 'absolute',
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: 'rgba(255,255,255,0.08)',
    top: 110, left: 22,
  },

  /* Illustration */
  illustBox: {
    width: 190, height: 190, borderRadius: 52,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.24)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.22, shadowRadius: 24, elevation: 10,
  },
  logoImg: { width: 112, height: 112, borderRadius: 28 },
  mainEmoji: { fontSize: 88 },
  badgeWrap: {
    position: 'absolute', bottom: -14, right: -14,
    width: 52, height: 52, borderRadius: 18,
    backgroundColor: BRAND_DARK,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: BRAND,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 6, elevation: 4,
  },
  badgeEmoji: { fontSize: 24 },

  /* Texte */
  textBlock: { paddingHorizontal: 36, alignItems: 'center', gap: 14 },
  title: {
    fontSize: 30, fontWeight: '800',
    color: '#fff', textAlign: 'center',
    letterSpacing: -0.6, lineHeight: 36,
  },
  subtitle: {
    fontSize: 15.5, fontWeight: '400',
    color: 'rgba(255,255,255,0.82)',
    textAlign: 'center', lineHeight: 23, maxWidth: 310,
  },

  /* Barre inférieure */
  bottomBar: {
    paddingHorizontal: 20, paddingTop: 20,
    gap: 18,
    backgroundColor: BRAND_DARK,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center', alignItems: 'center',
    gap: 7, paddingVertical: 4,
  },
  dot: { height: 8, borderRadius: 4, backgroundColor: '#fff' },
  ctaBtn: {
    backgroundColor: '#fff',
    borderRadius: 16, paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18, shadowRadius: 12, elevation: 6,
  },
  ctaBtnText: {
    fontSize: 16.5, fontWeight: '700',
    color: BRAND, letterSpacing: -0.3,
  },
});
