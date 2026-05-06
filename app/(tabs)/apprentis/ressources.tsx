import { useState } from 'react';
import {
  Dimensions,
  Image,
  Linking,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
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
  category: 'medical' | 'basics';
  description: string;
};

const VIDEOS: Video[] = [
  {
    id: 'v1',
    youtubeId: 'qFb1R_DSch8',
    title: 'Le corps humain en LSF',
    channel: 'LSF apprentissage',
    duration: '~10 min',
    category: 'medical',
    description:
      'Découvrez le vocabulaire des parties du corps humain en Langue des Signes Française. Indispensable pour les consultations médicales.',
  },
  {
    id: 'v2',
    youtubeId: 'K_Sf7pQo0L0',
    title: 'Santé & médicaments en LSF',
    channel: 'Apprendre la LSF',
    duration: '~8 min',
    category: 'medical',
    description:
      'Vocabulaire de la santé, des médicaments et de la sécurité en LSF. Leçon structurée avec exercices.',
  },
  {
    id: 'v3',
    youtubeId: 'VkzBsU_4J7Y',
    title: 'Décrire sa douleur en LSF',
    channel: 'Lexique LSF',
    duration: '~5 min',
    category: 'medical',
    description:
      "Apprenez à signer « avoir mal », « douleur », localiser et qualifier une douleur. Essentiel pour les consultations.",
  },
  {
    id: 'v4',
    youtubeId: 'iiAhJYJKRyw',
    title: 'Urgences médicales en LSF',
    channel: 'Lexique LSF',
    duration: '~6 min',
    category: 'medical',
    description:
      'Signes clés pour les situations d\'urgence : appeler les secours, décrire une urgence vitale, rassurer un patient.',
  },
  {
    id: 'v5',
    youtubeId: 'SN6uaYn9VDA',
    title: "L'alphabet LSF (dactylologie)",
    channel: 'Signes & Vous',
    duration: '~7 min',
    category: 'basics',
    description:
      "Maîtrisez l'alphabet LSF lettre par lettre. La dactylologie vous permettra d'épeler tous les termes médicaux.",
  },
  {
    id: 'v6',
    youtubeId: 'uRFBFQSISlg',
    title: 'Les chiffres en LSF (1 à 20)',
    channel: 'LSF apprentissage',
    duration: '~6 min',
    category: 'basics',
    description:
      'Les chiffres de 1 à 20 en LSF. Indispensable pour communiquer les dosages, dates de rendez-vous et numéros de chambre.',
  },
  {
    id: 'v7',
    youtubeId: 'pQO0oCFLeiA',
    title: 'Se présenter en LSF',
    channel: 'Apprendre la LSF',
    duration: '~8 min',
    category: 'basics',
    description:
      "Bonjour, je m'appelle, je suis interprète LSF… Apprenez à vous présenter en consultation. Base de toute communication.",
  },
];

const TOTAL = VIDEOS.length;

function getLevelInfo(count: number): { label: string; color: string; next: string | null } {
  if (count === 0) return { label: 'Débutant',      color: INK_3,     next: '1 vidéo pour débuter' };
  if (count <= 2)  return { label: 'Débutant',      color: INK_3,     next: `${3 - count} vidéo(s) pour Intermédiaire` };
  if (count <= 4)  return { label: 'Intermédiaire', color: AMBER,     next: `${5 - count} vidéo(s) pour Avancé` };
  if (count <= 6)  return { label: 'Avancé',        color: BRAND,     next: count < TOTAL ? `${TOTAL - count} vidéo(s) pour Expert` : null };
  return              { label: 'Expert',        color: '#7C3AED', next: null };
}

/* ── Category badge ──────────────────────────────────────── */
function CategoryBadge({ category }: { category: Video['category'] }) {
  const isMedical = category === 'medical';
  return (
    <View style={[badgeStyles.pill, { backgroundColor: isMedical ? '#FEF2F2' : BRAND_TINT }]}>
      <Text style={[badgeStyles.text, { color: isMedical ? '#DC2626' : BRAND }]}>
        {isMedical ? 'Médical' : 'Bases LSF'}
      </Text>
    </View>
  );
}
const badgeStyles = StyleSheet.create({
  pill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  text: { fontSize: 11, fontWeight: '700', letterSpacing: 0.2 },
});

/* ── Video card ──────────────────────────────────────────── */
function VideoCard({
  video,
  watched,
  onPress,
}: {
  video: Video;
  watched: boolean;
  onPress: () => void;
}) {
  const thumbUri = `https://img.youtube.com/vi/${video.youtubeId}/hqdefault.jpg`;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.thumbWrap}>
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
}

/* ── Main screen ─────────────────────────────────────────── */
export default function RessourcesScreen() {
  const { isWatched, watchedCount, markWatched } = useVideoProgress();
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);

  const levelInfo    = getLevelInfo(watchedCount);
  const progressPct  = Math.round((watchedCount / TOTAL) * 100);
  const firstUnwatched = VIDEOS.find((v) => !isWatched(v.id));
  const medicalVideos  = VIDEOS.filter((v) => v.category === 'medical');
  const basicVideos    = VIDEOS.filter((v) => v.category === 'basics');

  const openModal  = (video: Video) => setSelectedVideo(video);
  const closeModal = () => setSelectedVideo(null);

  const openYouTube = async (youtubeId: string) => {
    const url = `https://www.youtube.com/watch?v=${youtubeId}`;
    const supported = await Linking.canOpenURL(url);
    if (supported) await Linking.openURL(url);
  };

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
              onPress={() => openModal(firstUnwatched)}
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
                onPress={() => openModal(v)}
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
                onPress={() => openModal(v)}
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
