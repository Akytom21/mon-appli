import { Image, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';

const BRAND      = '#0F766E';
const BRAND_DARK = '#0B5F58';
const BRAND_TINT = '#E8F4F2';
const INK        = '#0F1B2D';
const INK_2      = '#475569';
const INK_3      = '#94A3B8';
const BORDER     = '#E5EAF0';
const BG         = '#F6F8FA';

export default function AboutScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      {/* Header teal */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          accessibilityLabel="Retour"
          accessibilityRole="button"
        >
          <Feather name="chevron-left" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>À propos</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero : logo + nom + version */}
        <View style={styles.hero}>
          <View style={styles.logoWrap}>
            <Image
              source={require('@/assets/images/logo.png')}
              style={styles.logo}
              resizeMode="contain"
              accessibilityLabel="Logo PharmaSign"
            />
          </View>
          <Text style={styles.appName}>PharmaSign</Text>
          <Text style={styles.tagline}>L'accès aux soins, en langue des signes</Text>
          <View style={styles.versionBadge}>
            <Text style={styles.versionText}>Version 1.0.0</Text>
          </View>
        </View>

        {/* Créateur */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Créateur</Text>
          <View style={styles.infoRow}>
            <View style={styles.iconWrap}>
              <Feather name="user" size={16} color={BRAND} />
            </View>
            <View style={styles.infoText}>
              <Text style={styles.infoName}>Tom Caucigh</Text>
              <Text style={styles.infoSub}>Étudiant en pharmacie</Text>
              <Text style={styles.infoSub}>Université Côte d'Azur · Nice</Text>
            </View>
          </View>
        </View>

        {/* Contact */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Contact</Text>
          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => Linking.openURL('mailto:tom.caucigh@gmail.com')}
            accessibilityRole="link"
            accessibilityLabel="Envoyer un email à tom.caucigh@gmail.com"
          >
            <View style={styles.iconWrap}>
              <Feather name="mail" size={16} color={BRAND} />
            </View>
            <Text style={styles.actionText}>tom.caucigh@gmail.com</Text>
            <Feather name="external-link" size={14} color={INK_3} />
          </TouchableOpacity>
        </View>

        {/* Développement */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Développement</Text>
          <View style={styles.infoRow}>
            <View style={styles.iconWrap}>
              <Feather name="cpu" size={16} color={BRAND} />
            </View>
            <View style={styles.infoText}>
              <Text style={styles.infoName}>Développé avec l'aide de Claude</Text>
              <Text style={styles.infoSub}>Anthropic</Text>
            </View>
          </View>
        </View>

        {/* Politique de confidentialité */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Légal</Text>
          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => router.push('/(auth)/privacy')}
            accessibilityRole="button"
            accessibilityLabel="Politique de confidentialité"
          >
            <View style={styles.iconWrap}>
              <Feather name="shield" size={16} color={BRAND} />
            </View>
            <Text style={styles.actionText}>Politique de confidentialité</Text>
            <Feather name="chevron-right" size={14} color={INK_3} />
          </TouchableOpacity>
        </View>

        {/* Mentions légales */}
        <View style={styles.legalCard}>
          <Feather name="alert-circle" size={15} color={BRAND_DARK} />
          <Text style={styles.legalText}>
            Application à usage éducatif — Ne remplace pas un avis médical professionnel.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BRAND },

  /* Header */
  header: {
    backgroundColor: BRAND,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 8,
  },
  backBtn: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: {
    flex: 1, textAlign: 'center',
    fontSize: 18, fontWeight: '700', color: '#fff', letterSpacing: -0.3,
  },

  scroll: { flex: 1, backgroundColor: BG },
  content: { padding: 20, paddingBottom: 48, gap: 14 },

  /* Hero */
  hero: {
    alignItems: 'center',
    paddingVertical: 28,
    gap: 6,
  },
  logoWrap: {
    width: 80, height: 80, borderRadius: 20,
    backgroundColor: BRAND,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: BRAND,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
    marginBottom: 4,
  },
  logo: { width: 52, height: 52, borderRadius: 10 },
  appName: {
    fontSize: 26, fontWeight: '800', color: INK, letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 13.5, color: INK_2, textAlign: 'center', lineHeight: 19,
  },
  versionBadge: {
    backgroundColor: BRAND_TINT,
    paddingHorizontal: 12, paddingVertical: 4,
    borderRadius: 999, marginTop: 4,
    borderWidth: 1, borderColor: '#A7D4D0',
  },
  versionText: { fontSize: 12, fontWeight: '600', color: BRAND },

  /* Card */
  card: {
    backgroundColor: '#fff',
    borderRadius: 16, padding: 16, gap: 12,
    borderWidth: 1, borderColor: BORDER,
    shadowColor: '#0F1B2D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 11, fontWeight: '700', color: INK_3,
    letterSpacing: 0.8, textTransform: 'uppercase',
  },

  /* Info row */
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  iconWrap: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: BRAND_TINT,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  infoText: { flex: 1, gap: 2 },
  infoName: { fontSize: 15, fontWeight: '700', color: INK },
  infoSub:  { fontSize: 13, color: INK_2 },

  /* Action row */
  actionRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  actionText: { flex: 1, fontSize: 14, color: BRAND, fontWeight: '500' },

  /* Legal */
  legalCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: BRAND_TINT,
    borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: '#A7D4D0',
  },
  legalText: {
    flex: 1, fontSize: 13, color: BRAND_DARK,
    lineHeight: 19, fontWeight: '500',
  },
});
