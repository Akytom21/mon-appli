import { memo, useCallback, useMemo, useState } from 'react';
import {
  Dimensions,
  Image,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useVideoProgress } from '@/hooks/useVideoProgress';

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
const AMBER_TINT = '#FEF3C7';

const { width: SCREEN_W } = Dimensions.get('window');
const THUMB_H = Math.round(SCREEN_W * (9 / 16));

/* ── Data ────────────────────────────────────────────────── */
type Video = {
  id: string;
  youtubeId: string;
  title: string;
  channel: string;
  duration: string;
  category: 'medical' | 'basics' | 'professional';
  description: string;
};

const VIDEOS: Video[] = [
  /* ── Vocabulaire médical LSF ─────────────────────────────── */
  {
    id: 'v1',
    youtubeId: 'rmGPHSGpmXQ',
    title: 'Les personnels médicaux en LSF',
    channel: 'maelanguedessignes.com',
    duration: '~8 min',
    category: 'medical',
    description:
      'Vocabulaire des professions médicales : médecin, infirmier, pédiatre, chirurgien… Indispensable pour orienter un patient en consultation.',
  },
  {
    id: 'v2',
    youtubeId: 'i9zvSita0Qs',
    title: '75 signes sur le thème médical',
    channel: 'AD Signes',
    duration: '~12 min',
    category: 'medical',
    description:
      'Cours complet de 75 signes LSF autour du médical : symptômes, examens, traitement, hospitalisation. Avec sous-titres.',
  },
  {
    id: 'v3',
    youtubeId: 'DwzSea3TOoU',
    title: 'Signes médicaux essentiels à connaître',
    channel: 'Langue des Signes / LSF',
    duration: '~7 min',
    category: 'medical',
    description:
      'Les signes médicaux de base pour sauver des vies : urgence, douleur, allergie, médicament, opération. Vocabulaire prioritaire.',
  },
  {
    id: 'v4',
    youtubeId: 'K_Sf7pQo0L0',
    title: 'Santé, sécurité et médicaments en LSF',
    channel: 'Apprendre la LSF',
    duration: '~10 min',
    category: 'medical',
    description:
      'Vocabulaire LSF de la santé et de la sécurité : médicaments, danger, premiers secours. Série pédagogique structurée.',
  },
  {
    id: 'v5',
    youtubeId: 'XClNbWky3Fo',
    title: 'Vocabulaire Santé et Médecine (2)',
    channel: 'Apprendre la LSF',
    duration: '~8 min',
    category: 'medical',
    description:
      'Suite du cours vocabulaire santé : hôpital, cabinet médical, ordonnance, consultation spécialisée. Série complète en LSF.',
  },

  /* ── Bases LSF ───────────────────────────────────────────── */
  {
    id: 'v6',
    youtubeId: 'QF-qooXEY_o',
    title: "L'alphabet LSF — la dactylologie",
    channel: 'Langue des Signes TV',
    duration: '~9 min',
    category: 'basics',
    description:
      "Maîtrisez l'alphabet LSF lettre par lettre. La dactylologie permet d'épeler les noms, termes médicaux et adresses.",
  },
  {
    id: 'v7',
    youtubeId: 'iXDmwxzrdVo',
    title: 'Les nombres en LSF',
    channel: 'LSF Point par Point',
    duration: '~6 min',
    category: 'basics',
    description:
      'Les chiffres et nombres en LSF. Essentiel pour les dosages, dates de rendez-vous, numéros de chambre et codes postaux.',
  },
  {
    id: 'v8',
    youtubeId: 'defJsB_CJmo',
    title: 'Salutations en LSF',
    channel: 'Fais moi signe',
    duration: '~7 min',
    category: 'basics',
    description:
      'Bonjour, bonsoir, ça va, au revoir, merci… Les salutations de base en LSF pour débuter toute interaction avec un patient sourd.',
  },
  {
    id: 'v9',
    youtubeId: '4osXMXPoRvc',
    title: 'Se présenter en LSF',
    channel: 'Apprendre la LSF',
    duration: '~8 min',
    category: 'basics',
    description:
      "Je m'appelle, je suis interprète, je parle LSF… Apprenez à vous présenter clairement en consultation. Base de toute communication.",
  },
  {
    id: 'v10',
    youtubeId: 'rz3jw0_XXoc',
    title: '300 mots du quotidien en LSF',
    channel: 'Apprendre la LSF',
    duration: '~20 min',
    category: 'basics',
    description:
      'Les essentiels de la vie quotidienne en LSF : famille, maison, travail, courses, transports. Référence complète pour débutants.',
  },

  /* ── LSF Professionnelle ─────────────────────────────────── */
  {
    id: 'v11',
    youtubeId: 'wBFkBa28KNI',
    title: 'Regards croisés sur la LSF',
    channel: 'IVT Paris',
    duration: '~15 min',
    category: 'professional',
    description:
      "Soirée de l'International Visual Theatre : linguistes, interprètes et sourds échangent sur la pratique professionnelle de la LSF en milieu médical.",
  },
  {
    id: 'v12',
    youtubeId: 'IheJzumKIBs',
    title: 'IVT Paris — présentation',
    channel: 'IVT Paris',
    duration: '~3 min',
    category: 'professional',
    description:
      "L'International Visual Theatre forme des interprètes LSF depuis 40 ans. Présentation de la structure de référence pour la formation professionnelle.",
  },
  {
    id: 'v13',
    youtubeId: 'Vem9eDdTGN4',
    title: 'Présentation de Média\'Pi ! (en LSF)',
    channel: "Mediapi Infos LSF",
    duration: '~4 min',
    category: 'professional',
    description:
      "Média'Pi ! est le premier média numérique en LSF. Cette vidéo présente leur mission : informer la communauté sourde, en LSF, sur l'actualité.",
  },
];

const TOTAL = VIDEOS.length;

function getLevelInfo(count: number): { label: string; color: string; next: string | null } {
  if (count === 0)  return { label: 'Débutant',      color: INK_3,     next: '1 vidéo pour débuter' };
  if (count <= 3)   return { label: 'Débutant',      color: INK_3,     next: `${4 - count} vidéo(s) pour Intermédiaire` };
  if (count <= 6)   return { label: 'Intermédiaire', color: AMBER,     next: `${7 - count} vidéo(s) pour Avancé` };
  if (count <= 10)  return { label: 'Avancé',        color: BRAND,     next: `${11 - count} vidéo(s) pour Expert` };
  return               { label: 'Expert',        color: '#7C3AED', next: null };
}

/* ── Category badge ──────────────────────────────────────── */
const CategoryBadge = memo(function CategoryBadge({ category }: { category: Video['category'] }) {
  const cfg = {
    medical:      { bg: '#FEF2F2', color: '#DC2626', label: 'Médical'   },
    basics:       { bg: BRAND_TINT, color: BRAND,    label: 'Bases LSF' },
    professional: { bg: '#F5F3FF', color: '#7C3AED', label: 'Pro LSF'   },
  }[category];
  return (
    <View style={[badgeStyles.pill, { backgroundColor: cfg.bg }]}>
      <Text style={[badgeStyles.text, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
});
const badgeStyles = StyleSheet.create({
  pill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  text: { fontSize: 11, fontWeight: '700', letterSpacing: 0.2 },
});

/* ── Video card ──────────────────────────────────────────── */
const VideoCard = memo(function VideoCard({
  video,
  watched,
  onPress,
}: {
  video: Video;
  watched: boolean;
  onPress: (video: Video) => void;
}) {
  const thumbUri = `https://img.youtube.com/vi/${video.youtubeId}/hqdefault.jpg`;
  const handlePress = useCallback(() => onPress(video), [onPress, video]);

  return (
    <TouchableOpacity style={styles.card} onPress={handlePress} activeOpacity={0.85}>
      <View style={[styles.thumbWrap, styles.thumbPlaceholder]}>
        <Image source={{ uri: thumbUri }} style={styles.thumb} resizeMode="cover" />
        <View style={styles.thumbOverlay}>
          <View style={styles.playBtn}>
            <Feather name="play" size={20} color="#fff" />
          </View>
        </View>
        {watched && (
          <View style={styles.watchedBadge}>
            <Feather name="check" size={11} color="#fff" />
            <Text style={styles.watchedBadgeText}>Vu</Text>
          </View>
        )}
        <View style={styles.durationBadge}>
          <Text style={styles.durationText}>{video.duration}</Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.cardTopRow}>
          <CategoryBadge category={video.category} />
          <Text style={styles.channelText}>{video.channel}</Text>
        </View>
        <Text style={styles.cardTitle} numberOfLines={2}>{video.title}</Text>
        <View style={styles.progressBarTrack}>
          <View style={[styles.progressBarFill, { width: watched ? '100%' : '0%' }]} />
        </View>
      </View>
    </TouchableOpacity>
  );
});

/* ── Main screen ─────────────────────────────────────────── */
export default function RessourcesScreen() {
  const { isWatched, watchedCount, markWatched } = useVideoProgress();
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);

  const levelInfo     = useMemo(() => getLevelInfo(watchedCount), [watchedCount]);
  const progressPct   = useMemo(() => Math.round((watchedCount / TOTAL) * 100), [watchedCount]);
  const firstUnwatched = useMemo(() => VIDEOS.find((v) => !isWatched(v.id)), [isWatched]);
  const medicalVideos       = useMemo(() => VIDEOS.filter((v) => v.category === 'medical'), []);
  const basicVideos         = useMemo(() => VIDEOS.filter((v) => v.category === 'basics'), []);
  const professionalVideos  = useMemo(() => VIDEOS.filter((v) => v.category === 'professional'), []);

  const openModal  = useCallback((video: Video) => setSelectedVideo(video), []);
  const closeModal = useCallback(() => setSelectedVideo(null), []);

  const openYouTube = useCallback(async (youtubeId: string) => {
    const url = `https://www.youtube.com/watch?v=${youtubeId}`;
    const supported = await Linking.canOpenURL(url);
    if (supported) await Linking.openURL(url);
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header progress ─────────────────── */}
        <View style={styles.progressHeader}>
          <View style={styles.progressHeaderDeco1} />
          <View style={styles.progressHeaderDeco2} />
          <View style={styles.progressHeaderContent}>
            {/* Back button row */}
            <View style={styles.backRow}>
              <TouchableOpacity
                style={styles.backBtn}
                onPress={() => router.back()}
                accessibilityLabel="Retour"
                accessibilityRole="button"
              >
                <Feather name="chevron-left" size={20} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.backTitle}>Ressources LSF</Text>
            </View>
            <View style={styles.levelRow}>
              <View style={[styles.levelBadge, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                <Feather name="award" size={14} color="#fff" />
                <Text style={styles.levelBadgeText}>{levelInfo.label}</Text>
              </View>
              <Text style={styles.progressHeaderPct}>{progressPct}%</Text>
            </View>
            <Text style={styles.progressHeaderTitle}>
              {watchedCount}/{TOTAL} vidéos regardées
            </Text>
            <View style={styles.progressBarLarge}>
              <View
                style={[
                  styles.progressBarLargeFill,
                  { width: `${progressPct}%` as any },
                ]}
              />
            </View>
            {levelInfo.next && (
              <Text style={styles.nextLevelHint}>{levelInfo.next}</Text>
            )}
          </View>
        </View>

        {/* ── Continuer ───────────────────────── */}
        {firstUnwatched && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Continuer</Text>
            <TouchableOpacity
              style={styles.continuerCard}
              onPress={() => openModal(firstUnwatched!)}
              activeOpacity={0.85}
            >
              <Image
                source={{
                  uri: `https://img.youtube.com/vi/${firstUnwatched.youtubeId}/hqdefault.jpg`,
                }}
                style={styles.continuerThumb}
                resizeMode="cover"
              />
              <View style={styles.continuerOverlay}>
                <View style={styles.continuerPlayBtn}>
                  <Feather name="play" size={22} color="#fff" />
                </View>
              </View>
              <View style={styles.continuerInfo}>
                <CategoryBadge category={firstUnwatched.category} />
                <Text style={styles.continuerTitle}>{firstUnwatched.title}</Text>
                <Text style={styles.continuerSub}>
                  {firstUnwatched.channel} · {firstUnwatched.duration}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Vocabulaire médical ──────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <View style={styles.sectionDot} />
            <Text style={styles.sectionTitle}>Vocabulaire médical LSF</Text>
            <View style={styles.sectionCount}>
              <Text style={styles.sectionCountText}>
                {medicalVideos.filter((v) => isWatched(v.id)).length}/{medicalVideos.length}
              </Text>
            </View>
          </View>
          <View style={styles.cardGrid}>
            {medicalVideos.map((v) => (
              <VideoCard
                key={v.id}
                video={v}
                watched={isWatched(v.id)}
                onPress={openModal}
              />
            ))}
          </View>
        </View>

        {/* ── Bases LSF ────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <View style={[styles.sectionDot, { backgroundColor: AMBER }]} />
            <Text style={styles.sectionTitle}>Tutoriels LSF de base</Text>
            <View style={styles.sectionCount}>
              <Text style={styles.sectionCountText}>
                {basicVideos.filter((v) => isWatched(v.id)).length}/{basicVideos.length}
              </Text>
            </View>
          </View>
          <View style={styles.cardGrid}>
            {basicVideos.map((v) => (
              <VideoCard
                key={v.id}
                video={v}
                watched={isWatched(v.id)}
                onPress={openModal}
              />
            ))}
          </View>
        </View>

        {/* ── LSF Professionnelle ──────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <View style={[styles.sectionDot, { backgroundColor: '#7C3AED' }]} />
            <Text style={styles.sectionTitle}>LSF Professionnelle</Text>
            <View style={[styles.sectionCount, { backgroundColor: '#F5F3FF' }]}>
              <Text style={[styles.sectionCountText, { color: '#7C3AED' }]}>
                {professionalVideos.filter((v) => isWatched(v.id)).length}/{professionalVideos.length}
              </Text>
            </View>
          </View>
          <View style={styles.cardGrid}>
            {professionalVideos.map((v) => (
              <VideoCard
                key={v.id}
                video={v}
                watched={isWatched(v.id)}
                onPress={openModal}
              />
            ))}
          </View>
        </View>

        {/* ── Info footer ──────────────────────── */}
        <View style={styles.infoFooter}>
          <Feather name="info" size={14} color={BRAND} />
          <Text style={styles.infoFooterText}>
            Les vidéos marquées comme vues contribuent à votre niveau et à la progression globale de votre parcours apprenti.
          </Text>
        </View>
      </ScrollView>

      {/* ── Modal fiche vidéo ───────────────────── */}
      <Modal
        visible={!!selectedVideo}
        animationType="slide"
        onRequestClose={closeModal}
        statusBarTranslucent
      >
        <SafeAreaView style={styles.modalSafe}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={closeModal}
              accessibilityRole="button"
              accessibilityLabel="Fermer"
            >
              <Feather name="x" size={20} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.modalHeaderTitle} numberOfLines={1}>
              {selectedVideo?.title}
            </Text>
            {selectedVideo && isWatched(selectedVideo.id) ? (
              <View style={styles.doneIndicator}>
                <Feather name="check-circle" size={16} color="#10B981" />
              </View>
            ) : (
              <View style={{ width: 32 }} />
            )}
          </View>

          {/* Thumbnail + bouton YouTube */}
          {selectedVideo && (
            <TouchableOpacity
              style={styles.modalThumbWrap}
              onPress={() => openYouTube(selectedVideo.youtubeId)}
              activeOpacity={0.88}
              accessibilityRole="button"
              accessibilityLabel="Regarder sur YouTube"
            >
              <Image
                source={{
                  uri: `https://img.youtube.com/vi/${selectedVideo.youtubeId}/hqdefault.jpg`,
                }}
                style={{ width: '100%', height: THUMB_H }}
                resizeMode="cover"
              />
              <View style={styles.modalThumbOverlay}>
                <View style={styles.youtubeBtn}>
                  <Feather name="youtube" size={22} color="#fff" />
                  <Text style={styles.youtubeBtnText}>Regarder sur YouTube</Text>
                </View>
              </View>
            </TouchableOpacity>
          )}

          {/* Corps */}
          {selectedVideo && (
            <ScrollView
              style={styles.modalBody}
              contentContainerStyle={styles.modalBodyContent}
            >
              <View style={styles.modalMeta}>
                <CategoryBadge category={selectedVideo.category} />
                <Text style={styles.modalDuration}>{selectedVideo.duration}</Text>
                <Text style={styles.modalChannel}>{selectedVideo.channel}</Text>
              </View>
              <Text style={styles.modalTitle}>{selectedVideo.title}</Text>
              <Text style={styles.modalDesc}>{selectedVideo.description}</Text>

              {/* Bouton ouvrir YouTube (dupliqué pour accessibilité dans le scroll) */}
              <TouchableOpacity
                style={styles.openYoutubeBtn}
                onPress={() => openYouTube(selectedVideo.youtubeId)}
                accessibilityRole="button"
              >
                <Feather name="external-link" size={17} color="#fff" />
                <Text style={styles.openYoutubeBtnText}>Ouvrir dans YouTube</Text>
              </TouchableOpacity>

              {/* Marquer comme vue */}
              {isWatched(selectedVideo.id) ? (
                <View style={styles.watchedConfirm}>
                  <Feather name="check-circle" size={18} color="#059669" />
                  <Text style={styles.watchedConfirmText}>
                    Vidéo complétée — contribue à votre progression
                  </Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.markDoneBtn}
                  onPress={() => markWatched(selectedVideo.id)}
                  accessibilityRole="button"
                >
                  <Feather name="check-circle" size={18} color="#fff" />
                  <Text style={styles.markDoneBtnText}>Marquer comme vue</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

/* ── Styles ──────────────────────────────────────────────── */
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  scrollContent: { paddingBottom: 40 },

  /* Progress header */
  progressHeader: {
    backgroundColor: BRAND,
    paddingBottom: 24,
    paddingHorizontal: 20,
    paddingTop: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  progressHeaderDeco1: {
    position: 'absolute', top: -50, right: -40,
    width: 180, height: 180, borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  progressHeaderDeco2: {
    position: 'absolute', top: 20, right: 50,
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  progressHeaderContent: { gap: 8, zIndex: 1 },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  backBtn: {
    width: 32, height: 32, borderRadius: 9,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  backTitle: { fontSize: 16, fontWeight: '700', color: '#fff', letterSpacing: -0.2 },
  levelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  levelBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999,
  },
  levelBadgeText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  progressHeaderPct: { fontSize: 18, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
  progressHeaderTitle: { fontSize: 13.5, color: 'rgba(255,255,255,0.85)' },
  progressBarLarge: {
    height: 6, backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 3, overflow: 'hidden',
  },
  progressBarLargeFill: { height: '100%', backgroundColor: '#fff', borderRadius: 3 },
  nextLevelHint: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 },

  /* Sections */
  section: { paddingHorizontal: 20, paddingTop: 20 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: BRAND },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: INK, letterSpacing: -0.3, flex: 1 },
  sectionCount: {
    backgroundColor: BRAND_TINT, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999,
  },
  sectionCountText: { fontSize: 11, fontWeight: '700', color: BRAND },
  cardGrid: { gap: 12 },

  /* Continuer card */
  continuerCard: {
    backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden',
    borderWidth: 1, borderColor: BORDER,
    shadowColor: BRAND, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12, shadowRadius: 12, elevation: 3,
  },
  continuerThumb: { width: '100%', height: 180 },
  continuerOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 180,
    backgroundColor: 'rgba(0,0,0,0.25)', alignItems: 'center', justifyContent: 'center',
  },
  continuerPlayBtn: {
    width: 52, height: 52, borderRadius: 26, backgroundColor: BRAND,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4, paddingLeft: 3,
  },
  continuerInfo: { padding: 14, gap: 4 },
  continuerTitle: { fontSize: 15.5, fontWeight: '700', color: INK, letterSpacing: -0.2, marginTop: 4 },
  continuerSub: { fontSize: 12.5, color: INK_2 },

  /* Video card */
  card: {
    backgroundColor: '#fff', borderRadius: 14, overflow: 'hidden',
    borderWidth: 1, borderColor: BORDER,
    shadowColor: '#0F1B2D', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  thumbWrap: { position: 'relative', height: 160 },
  thumbPlaceholder: { backgroundColor: '#CBD5E1' },
  thumb: { width: '100%', height: '100%' },
  thumbOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.2)', alignItems: 'center', justifyContent: 'center',
  },
  playBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(15,118,110,0.9)',
    alignItems: 'center', justifyContent: 'center', paddingLeft: 3,
  },
  watchedBadge: {
    position: 'absolute', top: 10, right: 10,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#059669', borderRadius: 999,
    paddingHorizontal: 8, paddingVertical: 4,
  },
  watchedBadgeText: { fontSize: 11, fontWeight: '700', color: '#fff' },
  durationBadge: {
    position: 'absolute', bottom: 10, right: 10,
    backgroundColor: 'rgba(0,0,0,0.65)', borderRadius: 6,
    paddingHorizontal: 7, paddingVertical: 3,
  },
  durationText: { fontSize: 11, color: '#fff', fontWeight: '600' },
  cardBody: { padding: 12, gap: 6 },
  cardTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  channelText: { fontSize: 11.5, color: INK_3, fontWeight: '500' },
  cardTitle: { fontSize: 14, fontWeight: '700', color: INK, letterSpacing: -0.2, lineHeight: 19 },
  progressBarTrack: {
    height: 3, backgroundColor: BORDER, borderRadius: 2, marginTop: 4, overflow: 'hidden',
  },
  progressBarFill: { height: '100%', backgroundColor: BRAND, borderRadius: 2 },

  /* Info footer */
  infoFooter: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    margin: 20, padding: 14, backgroundColor: BRAND_TINT, borderRadius: 12,
  },
  infoFooterText: { fontSize: 12.5, color: BRAND_DARK, lineHeight: 18, flex: 1 },

  /* Modal */
  modalSafe: { flex: 1, backgroundColor: '#000' },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#111',
  },
  modalCloseBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  modalHeaderTitle: {
    flex: 1, fontSize: 14.5, fontWeight: '600', color: '#fff', letterSpacing: -0.2,
  },
  doneIndicator: {
    width: 32, height: 32, alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },

  /* Thumbnail in modal */
  modalThumbWrap: { position: 'relative', backgroundColor: '#000' },
  modalThumbOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center',
  },
  youtubeBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#FF0000',
    paddingHorizontal: 20, paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 8, elevation: 6,
  },
  youtubeBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },

  /* Modal body */
  modalBody: { flex: 1, backgroundColor: BG },
  modalBodyContent: { padding: 20, gap: 12, paddingBottom: 40 },
  modalMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  modalDuration: { fontSize: 12.5, color: INK_3, fontWeight: '500' },
  modalChannel: { fontSize: 12.5, color: INK_3, fontWeight: '500' },
  modalTitle: { fontSize: 20, fontWeight: '800', color: INK, letterSpacing: -0.5 },
  modalDesc: { fontSize: 14, color: INK_2, lineHeight: 21 },

  openYoutubeBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#FF0000', borderRadius: 14, padding: 14,
    justifyContent: 'center',
    shadowColor: '#FF0000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  openYoutubeBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },

  markDoneBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: BRAND, borderRadius: 14, padding: 14,
    justifyContent: 'center',
    shadowColor: BRAND, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35, shadowRadius: 12, elevation: 5,
  },
  markDoneBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },

  watchedConfirm: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#ECFDF5', borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: '#A7F3D0',
  },
  watchedConfirmText: { fontSize: 14, color: '#065F46', fontWeight: '500', flex: 1 },
});
