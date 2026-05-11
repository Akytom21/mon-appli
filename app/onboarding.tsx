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
import Svg, {
  Circle,
  Ellipse,
  G,
  Line,
  Path,
  Polygon,
  Rect,
} from 'react-native-svg';

const { width: W } = Dimensions.get('window');
const STORAGE_KEY = '@pharmasign_onboarding_done';

/* ── Couleurs par slide ──────────────────────────────────── */
const SLIDE_BG = ['#064E45', '#0F766E', '#1A8A7E', '#2BA99A'];

/* ── Types ───────────────────────────────────────────────── */
type SlideData = {
  key: string;
  useLogo?: boolean;
  badge: string;
  title: string;
  subtitle: string;
};

const SLIDES: SlideData[] = [
  {
    key: 'welcome',
    useLogo: true,
    badge: '💊',
    title: 'Bienvenue sur\nPharmaSign',
    subtitle: "L'accès aux soins de santé en langue des signes française",
  },
  {
    key: 'deaf',
    badge: '📍',
    title: 'Trouvez un interprète',
    subtitle: 'Prenez rendez-vous avec un interprète LSF agréé près de chez vous en quelques secondes',
  },
  {
    key: 'interpreter',
    badge: '✅',
    title: 'Gérez vos missions',
    subtitle: "Acceptez des missions, gérez votre planning et aidez les personnes malentendantes",
  },
  {
    key: 'apprentice',
    badge: '🎓',
    title: 'Devenez interprète agréé',
    subtitle: 'Formez-vous, passez votre brevet LSF et rejoignez le réseau PharmaSign',
  },
];

/* ── Illustrations SVG ───────────────────────────────────── */

// Slide 1: Croix médicale + mains LSF + onde sonore barrée
function IllustWelcome() {
  return (
    <Svg width={120} height={120} viewBox="0 0 120 120">
      {/* Cercle de fond */}
      <Circle cx="60" cy="60" r="56" fill="rgba(255,255,255,0.1)" />
      {/* Croix médicale */}
      <Rect x="50" y="20" width="20" height="80" rx="6" fill="rgba(255,255,255,0.85)" />
      <Rect x="20" y="50" width="80" height="20" rx="6" fill="rgba(255,255,255,0.85)" />
      {/* Petite onde sonore barrée (coin bas-droit) */}
      <G transform="translate(76, 76) scale(0.65)">
        <Path d="M4 8 Q10 5 10 12 Q10 19 4 16" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2.5" strokeLinecap="round" />
        <Path d="M0 4 L16 20" stroke="#FF6B6B" strokeWidth="2.5" strokeLinecap="round" />
      </G>
      {/* Petite main LSF (coin haut-gauche) */}
      <G transform="translate(10, 10) scale(0.55)">
        <Ellipse cx="12" cy="22" rx="10" ry="8" fill="rgba(255,255,255,0.6)" />
        <Rect x="7" y="10" width="5" height="14" rx="2.5" fill="rgba(255,255,255,0.75)" />
        <Rect x="14" y="8" width="5" height="16" rx="2.5" fill="rgba(255,255,255,0.75)" />
        <Rect x="21" y="10" width="5" height="14" rx="2.5" fill="rgba(255,255,255,0.75)" />
      </G>
    </Svg>
  );
}

// Slide 2: Trois silhouettes — sourd, interprète (mains levées), médecin
function IllustDeaf() {
  return (
    <Svg width={130} height={115} viewBox="0 0 130 115">
      {/* Patient sourd (gauche) */}
      <Circle cx="22" cy="26" r="13" fill="rgba(255,255,255,0.75)" />
      <Path d="M8 52 Q22 42 36 52 L36 80 Q22 76 8 80 Z" fill="rgba(255,255,255,0.6)" />
      {/* Oreille barrée */}
      <Circle cx="33" cy="21" r="5" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="1.5" />
      <Line x1="30" y1="18" x2="36" y2="24" stroke="#FF6B6B" strokeWidth="2" strokeLinecap="round" />
      <Line x1="36" y1="18" x2="30" y2="24" stroke="#FF6B6B" strokeWidth="2" strokeLinecap="round" />

      {/* Interprète (centre, plus grand) */}
      <Circle cx="65" cy="22" r="16" fill="rgba(255,255,255,0.92)" />
      <Path d="M44 50 Q65 38 86 50 L86 84 Q65 78 44 84 Z" fill="rgba(255,255,255,0.8)" />
      {/* Mains levées */}
      <Circle cx="46" cy="66" r="7" fill="rgba(255,255,255,0.85)" />
      <Circle cx="84" cy="60" r="7" fill="rgba(255,255,255,0.85)" />
      {/* Badge LSF */}
      <Rect x="53" y="88" width="24" height="11" rx="5.5" fill="rgba(255,255,255,0.35)" />
      <Line x1="57" y1="93" x2="73" y2="93" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" strokeLinecap="round" />

      {/* Médecin (droite) */}
      <Circle cx="108" cy="26" r="13" fill="rgba(255,255,255,0.75)" />
      <Path d="M94 52 Q108 42 122 52 L122 80 Q108 76 94 80 Z" fill="rgba(255,255,255,0.6)" />
      {/* Stéthoscope */}
      <Circle cx="108" cy="56" r="4" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="1.5" />
      <Path d="M112 56 Q119 56 119 64" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="1.5" />

      {/* Flèches de connexion */}
      <Path d="M39 60 L48 60" stroke="rgba(255,255,255,0.45)" strokeWidth="1.5" strokeDasharray="3 2" />
      <Polygon points="50,58 54,60 50,62" fill="rgba(255,255,255,0.45)" />
      <Path d="M82 60 L91 60" stroke="rgba(255,255,255,0.45)" strokeWidth="1.5" strokeDasharray="3 2" />
      <Polygon points="93,58 97,60 93,62" fill="rgba(255,255,255,0.45)" />
    </Svg>
  );
}

// Slide 3: Calendrier avec case cochée + épingle de localisation
function IllustCalendar() {
  return (
    <Svg width={120} height={120} viewBox="0 0 120 120">
      {/* Corps calendrier */}
      <Rect x="12" y="22" width="78" height="76" rx="10" fill="rgba(255,255,255,0.85)" />
      {/* En-tête */}
      <Rect x="12" y="22" width="78" height="22" rx="10" fill="rgba(255,255,255,0.2)" />
      <Rect x="12" y="34" width="78" height="10" fill="rgba(255,255,255,0.2)" />
      {/* Crochets calendrier */}
      <Rect x="28" y="14" width="8" height="16" rx="4" fill="rgba(255,255,255,0.7)" />
      <Rect x="66" y="14" width="8" height="16" rx="4" fill="rgba(255,255,255,0.7)" />
      {/* Grille de jours (petits carrés) */}
      {[0, 1, 2, 3].map((row) =>
        [0, 1, 2, 3].map((col) => (
          <Rect
            key={`${row}-${col}`}
            x={22 + col * 18}
            y={52 + row * 11}
            width={12}
            height={8}
            rx={3}
            fill="rgba(255,255,255,0.22)"
          />
        )),
      )}
      {/* Grande case cochée */}
      <Rect x="66" y="52" width="20" height="20" rx="5" fill="rgba(255,255,255,0.88)" />
      <Path d="M70 62 L74 67 L83 57" stroke="#0F766E" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      {/* Épingle de localisation */}
      <G transform="translate(84, 58)">
        <Circle cx="14" cy="12" r="12" fill="rgba(255,255,255,0.8)" />
        <Circle cx="14" cy="10" r="5" fill="rgba(15,118,110,0.7)" />
        <Path d="M14 15 L14 24" stroke="rgba(255,255,255,0.8)" strokeWidth="2.5" strokeLinecap="round" />
      </G>
    </Svg>
  );
}

// Slide 4: Diplôme + flèche progression + étoile
function IllustDiploma() {
  return (
    <Svg width={120} height={120} viewBox="0 0 120 120">
      {/* Corps diplôme */}
      <Rect x="10" y="28" width="80" height="60" rx="8" fill="rgba(255,255,255,0.85)" />
      {/* Lignes de texte */}
      <Rect x="20" y="42" width="60" height="5" rx="2.5" fill="rgba(15,118,110,0.35)" />
      <Rect x="20" y="52" width="50" height="4" rx="2" fill="rgba(15,118,110,0.25)" />
      <Rect x="20" y="61" width="55" height="4" rx="2" fill="rgba(15,118,110,0.25)" />
      <Rect x="20" y="70" width="42" height="4" rx="2" fill="rgba(15,118,110,0.20)" />
      {/* Ruban/sceau */}
      <Circle cx="65" cy="82" r="10" fill="rgba(15,118,110,0.6)" />
      <Circle cx="65" cy="82" r="7" fill="rgba(255,255,255,0.3)" />
      <Path d="M62 82 L64 85 L70 79" stroke="rgba(255,255,255,0.9)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      {/* Flèche montante */}
      <G transform="translate(82, 20)">
        <Path d="M14 42 L14 10" stroke="rgba(255,255,255,0.8)" strokeWidth="3.5" strokeLinecap="round" />
        <Polygon points="14,4 8,14 20,14" fill="rgba(255,255,255,0.8)" />
      </G>
      {/* Étoile */}
      <G transform="translate(90, 54)">
        <Path
          d="M12 2 L14.4 9.2 L22 9.2 L15.8 13.8 L18.2 21 L12 16.4 L5.8 21 L8.2 13.8 L2 9.2 L9.6 9.2 Z"
          fill="rgba(255,255,255,0.72)"
          scale="0.85"
        />
      </G>
    </Svg>
  );
}

const ILLUSTRATIONS: Record<string, React.ComponentType> = {
  welcome:     IllustWelcome,
  deaf:        IllustDeaf,
  interpreter: IllustCalendar,
  apprentice:  IllustDiploma,
};

/* ── Helpers ─────────────────────────────────────────────── */
async function completeOnboarding() {
  try { await AsyncStorage.setItem(STORAGE_KEY, 'true'); } catch { /* silent */ }
  router.replace('/(auth)/login');
}

/* ── SlideItem ───────────────────────────────────────────── */
function SlideItem({
  slide,
  index,
  scrollX,
}: {
  slide: SlideData;
  index: number;
  scrollX: Animated.Value;
}) {
  const inputRange = [(index - 1) * W, index * W, (index + 1) * W];

  const scale = scrollX.interpolate({
    inputRange,
    outputRange: [0.86, 1, 0.86],
    extrapolate: 'clamp',
  });
  const opacity = scrollX.interpolate({
    inputRange,
    outputRange: [0.35, 1, 0.35],
    extrapolate: 'clamp',
  });

  const IllustComponent = ILLUSTRATIONS[slide.key];

  return (
    <View style={[st.slide, { width: W }]}>
      {/* Cercles décoratifs de fond */}
      <View style={st.deco1} />
      <View style={st.deco2} />
      <View style={st.deco3} />

      <Animated.View style={[st.slideContent, { transform: [{ scale }], opacity }]}>
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
            <IllustComponent />
          )}
          <View style={st.badgeWrap}>
            <Text style={st.badgeEmoji} accessible={false}>{slide.badge}</Text>
          </View>
        </View>

        {/* Texte */}
        <View style={st.textBlock}>
          <Text style={st.title}>{slide.title}</Text>
          <Text style={st.subtitle}>{slide.subtitle}</Text>
        </View>
      </Animated.View>
    </View>
  );
}

/* ── Écran principal ─────────────────────────────────────── */
export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef  = useRef<FlatList<SlideData>>(null);
  const scrollX  = useRef(new Animated.Value(0)).current;

  const isLast = activeIndex === SLIDES.length - 1;

  /* Couleur de fond animée entre les slides */
  const bgColor = scrollX.interpolate({
    inputRange: SLIDES.map((_, i) => i * W),
    outputRange: SLIDE_BG,
    extrapolate: 'clamp',
  });

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
    <Animated.View style={[st.root, { backgroundColor: bgColor }]}>
      {/* Bouton Passer */}
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

      {/* Slides */}
      <FlatList
        ref={listRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        keyExtractor={(item) => item.key}
        renderItem={({ item, index }) => (
          <SlideItem slide={item} index={index} scrollX={scrollX} />
        )}
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

      {/* Barre inférieure */}
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
    </Animated.View>
  );
}

/* ── Styles ──────────────────────────────────────────────── */
const st = StyleSheet.create({
  root: { flex: 1 },

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

  slide: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    gap: 44,
  },

  slideContent: {
    alignItems: 'center',
    gap: 44,
    width: '100%',
  },

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
  badgeWrap: {
    position: 'absolute', bottom: -14, right: -14,
    width: 52, height: 52, borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.25)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.25)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 6, elevation: 4,
  },
  badgeEmoji: { fontSize: 24 },

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

  bottomBar: {
    paddingHorizontal: 20, paddingTop: 20,
    gap: 18,
    backgroundColor: 'rgba(0,0,0,0.2)',
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
    color: '#0F766E', letterSpacing: -0.3,
  },
});
