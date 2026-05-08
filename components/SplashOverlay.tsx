import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Image, StyleSheet } from 'react-native';
import { useAuth } from '@/context/AuthContext';

const BRAND = '#0F766E';
const MIN_DISPLAY_MS = 2000;
const EXIT_MS = 380;

export default function SplashOverlay() {
  const { initializing } = useAuth();
  const [visible, setVisible] = useState(true);

  const scale          = useRef(new Animated.Value(0.5)).current;
  const logoOpacity    = useRef(new Animated.Value(0)).current;
  const textOpacity    = useRef(new Animated.Value(0)).current;
  const overlayOpacity = useRef(new Animated.Value(1)).current;
  const mountTime      = useRef(Date.now());

  // ── Entry animations ──────────────────────────────────────
  useEffect(() => {
    Animated.parallel([
      Animated.timing(scale, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    // Texte décalé de 350ms
    Animated.timing(textOpacity, {
      toValue: 1,
      duration: 600,
      delay: 350,
      useNativeDriver: true,
    }).start();
  }, []);

  // ── Exit : attend que auth soit résolu ET que 2s soient écoulées ──
  useEffect(() => {
    if (initializing) return;

    const elapsed   = Date.now() - mountTime.current;
    const remaining = Math.max(0, MIN_DISPLAY_MS - elapsed);

    const timer = setTimeout(() => {
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: EXIT_MS,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }).start(() => setVisible(false));
    }, remaining);

    return () => clearTimeout(timer);
  }, [initializing]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
      {/* Logo : scale + fade in */}
      <Animated.View
        style={{ transform: [{ scale }], opacity: logoOpacity }}
      >
        <Image
          source={require('@/assets/images/logo.png')}
          style={styles.logo}
          resizeMode="contain"
          accessibilityLabel="Logo PharmaSign"
        />
      </Animated.View>

      {/* Nom de l'app : fade in décalé */}
      <Animated.Text style={[styles.appName, { opacity: textOpacity }]}>
        PharmaSign
      </Animated.Text>
      <Animated.Text style={[styles.tagline, { opacity: textOpacity }]}>
        L'accès aux soins, en langue des signes
      </Animated.Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: BRAND,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  logo: {
    width: 96,
    height: 96,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.18)',
    marginBottom: 20,
  },
  appName: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 13.5,
    color: 'rgba(255,255,255,0.82)',
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 40,
    lineHeight: 19,
  },
});
