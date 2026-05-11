import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

const BRAND      = '#0F766E';
const BRAND_DARK = '#0B5F58';
const BRAND_TINT = '#E8F4F2';
const INK        = '#0F1B2D';
const INK_2      = '#475569';
const INK_3      = '#94A3B8';
const BORDER     = '#E5EAF0';
const BG         = '#F6F8FA';

/* ── Types ───────────────────────────────────────────────── */
type DictCategory = 'corps' | 'symptomes' | 'medicaments' | 'specialites' | 'actes';

type DictEntry = {
  id: string;
  word: string;
  category: DictCategory;
  definition: string;
  youtubeUrl: string;
};

/* ── Catégories ──────────────────────────────────────────── */
const CAT_CONFIG: Record<DictCategory, { label: string; emoji: string; color: string; bg: string }> = {
  corps:       { label: 'Corps humain',   emoji: '🫀', color: '#DC2626', bg: '#FEF2F2' },
  symptomes:   { label: 'Symptômes',      emoji: '🤒', color: '#EA580C', bg: '#FFF7ED' },
  medicaments: { label: 'Médicaments',    emoji: '💊', color: '#16A34A', bg: '#F0FDF4' },
  specialites: { label: 'Spécialités',    emoji: '👨‍⚕️', color: '#2563EB', bg: '#EFF6FF' },
  actes:       { label: 'Actes médicaux', emoji: '🩺', color: '#7C3AED', bg: '#F5F3FF' },
};

const CAT_ORDER: DictCategory[] = ['corps', 'symptomes', 'medicaments', 'specialites', 'actes'];

/* ── Base de données (36 termes) ─────────────────────────── */
// Les liens ouvrent une recherche YouTube Elix LSF — à remplacer par des
// IDs vidéo directs depuis la chaîne Elix (@ElixLSF) si disponibles.
const DICT: DictEntry[] = [
  // Corps humain
  {
    id: 'tete', word: 'Tête', category: 'corps',
    definition: 'Partie supérieure du corps, siège du cerveau et des organes des sens.',
    youtubeUrl: 'https://www.youtube.com/results?search_query=elix+lsf+tête',
  },
  {
    id: 'bras', word: 'Bras', category: 'corps',
    definition: 'Membre supérieur reliant l\'épaule à la main.',
    youtubeUrl: 'https://www.youtube.com/results?search_query=elix+lsf+bras',
  },
  {
    id: 'jambe', word: 'Jambe', category: 'corps',
    definition: 'Membre inférieur situé entre le genou et la cheville.',
    youtubeUrl: 'https://www.youtube.com/results?search_query=elix+lsf+jambe',
  },
  {
    id: 'ventre', word: 'Ventre', category: 'corps',
    definition: 'Partie antérieure du tronc contenant les organes digestifs.',
    youtubeUrl: 'https://www.youtube.com/results?search_query=elix+lsf+ventre+abdomen',
  },
  {
    id: 'coeur', word: 'Cœur', category: 'corps',
    definition: 'Organe musculaire qui assure la circulation du sang dans le corps.',
    youtubeUrl: 'https://www.youtube.com/results?search_query=elix+lsf+coeur',
  },
  {
    id: 'poumon', word: 'Poumon', category: 'corps',
    definition: 'Organe de la respiration situé dans la cage thoracique.',
    youtubeUrl: 'https://www.youtube.com/results?search_query=elix+lsf+poumon',
  },
  {
    id: 'dos', word: 'Dos', category: 'corps',
    definition: 'Face postérieure du tronc, de la nuque jusqu\'aux fesses.',
    youtubeUrl: 'https://www.youtube.com/results?search_query=elix+lsf+dos',
  },
  {
    id: 'main', word: 'Main', category: 'corps',
    definition: 'Extrémité du membre supérieur comportant cinq doigts.',
    youtubeUrl: 'https://www.youtube.com/results?search_query=elix+lsf+main',
  },
  // Symptômes
  {
    id: 'douleur', word: 'Douleur', category: 'symptomes',
    definition: 'Sensation désagréable signalant une atteinte corporelle ou émotionnelle.',
    youtubeUrl: 'https://www.youtube.com/results?search_query=elix+lsf+douleur',
  },
  {
    id: 'fievre', word: 'Fièvre', category: 'symptomes',
    definition: 'Élévation anormale de la température corporelle au-dessus de 37,5 °C.',
    youtubeUrl: 'https://www.youtube.com/results?search_query=elix+lsf+fièvre+température',
  },
  {
    id: 'nausee', word: 'Nausée', category: 'symptomes',
    definition: 'Envie de vomir accompagnée d\'un malaise et d\'un inconfort gastrique.',
    youtubeUrl: 'https://www.youtube.com/results?search_query=elix+lsf+nausée',
  },
  {
    id: 'vertige', word: 'Vertige', category: 'symptomes',
    definition: 'Sensation de rotation ou de déséquilibre sans mouvement réel.',
    youtubeUrl: 'https://www.youtube.com/results?search_query=elix+lsf+vertige',
  },
  {
    id: 'fatigue', word: 'Fatigue', category: 'symptomes',
    definition: 'État d\'épuisement physique ou mental réduisant la capacité à agir.',
    youtubeUrl: 'https://www.youtube.com/results?search_query=elix+lsf+fatigue',
  },
  {
    id: 'allergie', word: 'Allergie', category: 'symptomes',
    definition: 'Réaction anormale du système immunitaire à une substance étrangère.',
    youtubeUrl: 'https://www.youtube.com/results?search_query=elix+lsf+allergie',
  },
  {
    id: 'toux', word: 'Toux', category: 'symptomes',
    definition: 'Expulsion brusque d\'air des voies respiratoires, souvent reflexe.',
    youtubeUrl: 'https://www.youtube.com/results?search_query=elix+lsf+toux',
  },
  {
    id: 'saignement', word: 'Saignement', category: 'symptomes',
    definition: 'Écoulement de sang hors des vaisseaux sanguins.',
    youtubeUrl: 'https://www.youtube.com/results?search_query=elix+lsf+saignement+sang',
  },
  // Médicaments
  {
    id: 'comprimes', word: 'Comprimé', category: 'medicaments',
    definition: 'Forme médicamenteuse solide destinée à être avalée ou dissoute.',
    youtubeUrl: 'https://www.youtube.com/results?search_query=elix+lsf+comprimé+médicament',
  },
  {
    id: 'sirop', word: 'Sirop', category: 'medicaments',
    definition: 'Médicament liquide sucré à prendre en doses mesurées à la cuillère.',
    youtubeUrl: 'https://www.youtube.com/results?search_query=elix+lsf+sirop',
  },
  {
    id: 'injection', word: 'Injection', category: 'medicaments',
    definition: 'Introduction d\'un liquide médicamenteux dans l\'organisme par piqûre.',
    youtubeUrl: 'https://www.youtube.com/results?search_query=elix+lsf+injection+piqûre',
  },
  {
    id: 'ordonnance', word: 'Ordonnance', category: 'medicaments',
    definition: 'Document rédigé par le médecin prescrivant un traitement médicamenteux.',
    youtubeUrl: 'https://www.youtube.com/results?search_query=elix+lsf+ordonnance',
  },
  {
    id: 'pharmacie', word: 'Pharmacie', category: 'medicaments',
    definition: 'Établissement où sont délivrés les médicaments sur ou sans ordonnance.',
    youtubeUrl: 'https://www.youtube.com/results?search_query=elix+lsf+pharmacie',
  },
  {
    id: 'antibiotique', word: 'Antibiotique', category: 'medicaments',
    definition: 'Médicament qui détruit ou inhibe la croissance des bactéries.',
    youtubeUrl: 'https://www.youtube.com/results?search_query=elix+lsf+antibiotique',
  },
  // Spécialités
  {
    id: 'medecin', word: 'Médecin', category: 'specialites',
    definition: 'Professionnel de santé qui diagnostique, traite et prévient les maladies.',
    youtubeUrl: 'https://www.youtube.com/results?search_query=elix+lsf+médecin+docteur',
  },
  {
    id: 'cardiologue', word: 'Cardiologue', category: 'specialites',
    definition: 'Médecin spécialiste des maladies du cœur et des vaisseaux sanguins.',
    youtubeUrl: 'https://www.youtube.com/results?search_query=elix+lsf+cardiologue',
  },
  {
    id: 'dermatologue', word: 'Dermatologue', category: 'specialites',
    definition: 'Médecin spécialiste des maladies de la peau, des cheveux et des ongles.',
    youtubeUrl: 'https://www.youtube.com/results?search_query=elix+lsf+dermatologue+peau',
  },
  {
    id: 'urgences', word: 'Urgences', category: 'specialites',
    definition: 'Service hospitalier accueillant les patients en situation d\'urgence vitale.',
    youtubeUrl: 'https://www.youtube.com/results?search_query=elix+lsf+urgences+hôpital',
  },
  {
    id: 'chirurgien', word: 'Chirurgien', category: 'specialites',
    definition: 'Médecin spécialisé dans les interventions chirurgicales manuelles.',
    youtubeUrl: 'https://www.youtube.com/results?search_query=elix+lsf+chirurgien',
  },
  {
    id: 'ophtalmo', word: 'Ophtalmologue', category: 'specialites',
    definition: 'Médecin spécialiste des maladies des yeux et de la vision.',
    youtubeUrl: 'https://www.youtube.com/results?search_query=elix+lsf+ophtalmologue+yeux',
  },
  // Actes médicaux
  {
    id: 'consultation', word: 'Consultation', category: 'actes',
    definition: 'Rencontre entre un patient et un médecin pour examen ou bilan de santé.',
    youtubeUrl: 'https://www.youtube.com/results?search_query=elix+lsf+consultation',
  },
  {
    id: 'radiologie', word: 'Radiographie', category: 'actes',
    definition: 'Examen d\'imagerie utilisant les rayons X pour visualiser l\'intérieur du corps.',
    youtubeUrl: 'https://www.youtube.com/results?search_query=elix+lsf+radiographie+radio',
  },
  {
    id: 'prisedesang', word: 'Prise de sang', category: 'actes',
    definition: 'Prélèvement de sang veineux envoyé en laboratoire pour analyse.',
    youtubeUrl: 'https://www.youtube.com/results?search_query=elix+lsf+prise+de+sang',
  },
  {
    id: 'operation', word: 'Opération', category: 'actes',
    definition: 'Intervention chirurgicale pratiquée sous anesthésie par un chirurgien.',
    youtubeUrl: 'https://www.youtube.com/results?search_query=elix+lsf+opération+chirurgie',
  },
  {
    id: 'vaccin', word: 'Vaccin', category: 'actes',
    definition: 'Injection qui protège contre une maladie en stimulant l\'immunité.',
    youtubeUrl: 'https://www.youtube.com/results?search_query=elix+lsf+vaccin+vaccination',
  },
  {
    id: 'scanner', word: 'Scanner / IRM', category: 'actes',
    definition: 'Examen d\'imagerie médicale en coupes permettant de visualiser les organes.',
    youtubeUrl: 'https://www.youtube.com/results?search_query=elix+lsf+scanner+IRM',
  },
  {
    id: 'echographie', word: 'Échographie', category: 'actes',
    definition: 'Examen utilisant les ultrasons pour visualiser les organes internes.',
    youtubeUrl: 'https://www.youtube.com/results?search_query=elix+lsf+échographie',
  },
  {
    id: 'hospitalisation', word: 'Hospitalisation', category: 'actes',
    definition: 'Séjour dans un établissement de soins pour traitement ou surveillance.',
    youtubeUrl: 'https://www.youtube.com/results?search_query=elix+lsf+hospitalisation+hôpital',
  },
];

/* ── Composant principal ─────────────────────────────────── */
export default function DictionnaireScreen() {
  const [search, setSearch]     = useState('');
  const [activecat, setActivecat] = useState<DictCategory | null>(null);

  const filtered = useMemo(() => {
    let list = DICT;
    if (activecat)          list = list.filter((e) => e.category === activecat);
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(
        (e) => e.word.toLowerCase().includes(q) || e.definition.toLowerCase().includes(q),
      );
    }
    return list;
  }, [search, activecat]);

  const grouped = useMemo(() => {
    const map: Partial<Record<DictCategory, DictEntry[]>> = {};
    for (const entry of filtered) {
      (map[entry.category] ??= []).push(entry);
    }
    return map;
  }, [filtered]);

  const openSign = async (entry: DictEntry) => {
    // Extract search_query from stored URL to build the native deep-link
    const match = entry.youtubeUrl.match(/search_query=([^&]+)/);
    const query = match ? match[1] : encodeURIComponent(`${entry.word} LSF`);
    const nativeUrl = `vnd.youtube://results?search_query=${query}`;
    const webUrl = entry.youtubeUrl;

    try {
      // canOpenURL works for custom schemes (vnd.youtube://) but is unreliable
      // for https:// on Android 11+ — try native first, fall back to web
      const canOpenNative = await Linking.canOpenURL(nativeUrl);
      await Linking.openURL(canOpenNative ? nativeUrl : webUrl);
    } catch {
      try {
        await Linking.openURL(webUrl);
      } catch {
        Alert.alert(
          'Lien indisponible',
          `Impossible d'ouvrir YouTube pour « ${entry.word} ».\n\nVérifiez votre connexion internet ou recherchez manuellement : ${entry.word} LSF Elix`,
          [{ text: 'OK' }],
        );
      }
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.headerRow}>
          <TouchableOpacity style={s.backBtn} onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Retour">
            <Feather name="chevron-left" size={20} color="#fff" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={s.headerSupra}>LSF Médical</Text>
            <Text style={s.headerTitle}>Dictionnaire des signes</Text>
          </View>
          <View style={s.countBadge}>
            <Text style={s.countBadgeText}>{DICT.length} termes</Text>
          </View>
        </View>

        {/* Barre de recherche */}
        <View style={s.searchBar}>
          <Feather name="search" size={16} color={INK_3} />
          <TextInput
            style={s.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Rechercher un terme médical…"
            placeholderTextColor={INK_3}
            returnKeyType="search"
            clearButtonMode="while-editing"
            accessibilityLabel="Rechercher un terme"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} accessibilityLabel="Effacer la recherche">
              <Feather name="x-circle" size={16} color={INK_3} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filtres catégories */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={s.catBar}
        contentContainerStyle={s.catBarContent}
      >
        <TouchableOpacity
          style={[s.catPill, activecat === null && s.catPillActive]}
          onPress={() => setActivecat(null)}
        >
          <Text style={[s.catPillText, activecat === null && s.catPillTextActive]}>
            Tout
          </Text>
        </TouchableOpacity>
        {CAT_ORDER.map((cat) => {
          const cfg = CAT_CONFIG[cat];
          const on  = activecat === cat;
          return (
            <TouchableOpacity
              key={cat}
              style={[s.catPill, on && { backgroundColor: cfg.color, borderColor: cfg.color }]}
              onPress={() => setActivecat(on ? null : cat)}
            >
              <Text style={s.catPillEmoji}>{cfg.emoji}</Text>
              <Text style={[s.catPillText, on && { color: '#fff' }]}>{cfg.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Contenu */}
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {filtered.length === 0 && (
          <View style={s.emptyState}>
            <Text style={s.emptyIcon}>🔍</Text>
            <Text style={s.emptyTitle}>Aucun résultat</Text>
            <Text style={s.emptySub}>Essayez un autre mot-clé ou changez de catégorie.</Text>
          </View>
        )}

        {CAT_ORDER.map((cat) => {
          const entries = grouped[cat];
          if (!entries?.length) return null;
          const cfg = CAT_CONFIG[cat];
          return (
            <View key={cat} style={s.section}>
              <View style={[s.sectionHeader, { backgroundColor: cfg.bg, borderColor: cfg.color + '40' }]}>
                <Text style={s.sectionEmoji}>{cfg.emoji}</Text>
                <Text style={[s.sectionTitle, { color: cfg.color }]}>{cfg.label}</Text>
                <View style={[s.sectionCount, { backgroundColor: cfg.color + '20' }]}>
                  <Text style={[s.sectionCountText, { color: cfg.color }]}>{entries.length}</Text>
                </View>
              </View>

              {entries.map((entry) => (
                <View key={entry.id} style={s.entryCard}>
                  <View style={s.entryTop}>
                    <View style={[s.entryBadge, { backgroundColor: cfg.bg, borderColor: cfg.color + '30' }]}>
                      <Text style={[s.entryBadgeText, { color: cfg.color }]}>{cfg.emoji}</Text>
                    </View>
                    <Text style={s.entryWord}>{entry.word}</Text>
                  </View>
                  <Text style={s.entryDef}>{entry.definition}</Text>
                  <TouchableOpacity
                    style={s.signBtn}
                    onPress={() => openSign(entry)}
                    accessibilityRole="button"
                    accessibilityLabel={`Voir le signe LSF pour ${entry.word}`}
                  >
                    <Feather name="play-circle" size={15} color={BRAND} />
                    <Text style={s.signBtnText}>Voir le signe LSF</Text>
                    <Feather name="external-link" size={13} color={BRAND + '90'} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          );
        })}

        <View style={s.footer}>
          <Text style={s.footerText}>
            Les recherches s'ouvrent dans l'app YouTube (si installée) ou dans le navigateur.{'\n'}
            Chaîne de référence : Elix LSF · Connexion requise.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ── Styles ──────────────────────────────────────────────── */
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BRAND },

  header: {
    backgroundColor: BRAND,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 14,
    gap: 12,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerSupra: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.75)', textTransform: 'uppercase', letterSpacing: 1 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#fff', letterSpacing: -0.4, marginTop: 1 },
  countBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4,
  },
  countBadgeText: { fontSize: 12, fontWeight: '700', color: '#fff' },

  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#fff', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 10,
  },
  searchInput: { flex: 1, fontSize: 15, color: INK },

  catBar: { backgroundColor: BRAND_DARK, flexGrow: 0 },
  catBarContent: {
    flexDirection: 'row', gap: 8,
    paddingHorizontal: 20, paddingVertical: 10,
  },
  catPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.25)',
  },
  catPillActive: { backgroundColor: '#fff', borderColor: '#fff' },
  catPillEmoji: { fontSize: 13 },
  catPillText: { fontSize: 12.5, fontWeight: '700', color: 'rgba(255,255,255,0.9)' },
  catPillTextActive: { color: BRAND_DARK },

  scroll: { flex: 1, backgroundColor: BG },
  scrollContent: { padding: 16, paddingBottom: 48, gap: 20 },

  emptyState: { alignItems: 'center', paddingVertical: 60, gap: 8 },
  emptyIcon: { fontSize: 44 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: INK },
  emptySub: { fontSize: 14, color: INK_3, textAlign: 'center' },

  section: { gap: 10 },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 12, borderWidth: 1,
  },
  sectionEmoji: { fontSize: 18 },
  sectionTitle: { flex: 1, fontSize: 14, fontWeight: '700' },
  sectionCount: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  sectionCountText: { fontSize: 12, fontWeight: '700' },

  entryCard: {
    backgroundColor: '#fff', borderRadius: 14, padding: 14, gap: 8,
    borderWidth: 1, borderColor: BORDER,
    shadowColor: INK, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
  },
  entryTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  entryBadge: {
    width: 32, height: 32, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1,
  },
  entryBadgeText: { fontSize: 16 },
  entryWord: { fontSize: 17, fontWeight: '700', color: INK, flex: 1 },
  entryDef: { fontSize: 13.5, color: INK_2, lineHeight: 20 },
  signBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    paddingVertical: 9, paddingHorizontal: 12,
    backgroundColor: BRAND_TINT, borderRadius: 10,
    borderWidth: 1.5, borderColor: BRAND + '35',
    alignSelf: 'flex-start',
  },
  signBtnText: { fontSize: 13, fontWeight: '700', color: BRAND },

  footer: {
    paddingVertical: 8, paddingHorizontal: 4, alignItems: 'center',
  },
  footerText: { fontSize: 11.5, color: INK_3, textAlign: 'center', lineHeight: 17 },
});
