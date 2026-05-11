import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

/* ── Design tokens ─────────────────────────────────────── */
const BRAND      = '#0F766E';
const BRAND_DARK = '#0B5F58';
const BRAND_TINT = '#E8F4F2';
const INK        = '#0F1B2D';
const INK_2      = '#475569';
const INK_3      = '#94A3B8';
const BORDER     = '#E5EAF0';
const BG         = '#F6F8FA';

/* ── Types ─────────────────────────────────────────────── */
type FalcCategory = 'rdv' | 'medecin' | 'medicaments' | 'urgences' | 'droits';

const CAT_ORDER: FalcCategory[] = ['rdv', 'medecin', 'medicaments', 'urgences', 'droits'];

const CAT_CONFIG: Record<FalcCategory, { label: string; emoji: string; color: string; bg: string }> = {
  rdv:         { label: 'Avant le RDV',      emoji: '📅', color: '#2563EB', bg: '#EFF6FF' },
  medecin:     { label: 'Chez le médecin',   emoji: '🩺', color: '#0F766E', bg: '#E8F4F2' },
  medicaments: { label: 'Médicaments',       emoji: '💊', color: '#16A34A', bg: '#F0FDF4' },
  urgences:    { label: 'Urgences',          emoji: '🚨', color: '#DC2626', bg: '#FEF2F2' },
  droits:      { label: 'Droits du patient', emoji: '⚖️', color: '#7C3AED', bg: '#F5F3FF' },
};

type FalcFiche = {
  id: string;
  category: FalcCategory;
  icon: string;
  title: string;
  bullets: string[];
  tip?: string;
};

/* ── Contenu FALC ──────────────────────────────────────── */
const FICHES: FalcFiche[] = [
  // Avant le RDV
  {
    id: 'rdv-docs', category: 'rdv', icon: '📋',
    title: 'Les documents à apporter',
    bullets: [
      '🪪  Votre carte Vitale',
      '📄  Votre carte de mutuelle',
      '📝  Vos anciennes ordonnances',
      '💊  La liste de vos médicaments',
      '📊  Vos anciens résultats d\'examen',
    ],
    tip: 'Mettez tout dans une pochette avant le rendez-vous.',
  },
  {
    id: 'rdv-prep', category: 'rdv', icon: '✍️',
    title: 'Se préparer à expliquer',
    bullets: [
      '📝  Écrivez vos symptômes avant le RDV',
      '📅  Notez depuis quand vous êtes malade',
      '❓  Préparez vos questions à l\'avance',
      '📱  Vous pouvez écrire sur votre téléphone',
      '👤  Vous pouvez venir avec quelqu\'un',
    ],
    tip: 'Écrire avant aide à ne rien oublier.',
  },
  {
    id: 'rdv-interprete', category: 'rdv', icon: '🤟',
    title: 'Demander un interprète LSF',
    bullets: [
      '📞  Appelez le cabinet à l\'avance',
      '✉️  Envoyez un email pour demander',
      '⏰  Demandez au moins 15 jours avant',
      '💶  L\'interprète peut être remboursé',
      '📱  PharmaSign peut vous mettre en relation',
    ],
    tip: 'Vous avez le droit d\'avoir un interprète LSF.',
  },
  // Chez le médecin
  {
    id: 'medecin-douleur', category: 'medecin', icon: '😣',
    title: 'Décrire votre douleur',
    bullets: [
      '👆  Montrez où vous avez mal avec votre doigt',
      '🔢  De 1 à 10 : 1 = peu, 10 = très fort',
      '⏰  Dites depuis combien de temps',
      '🔁  Dites si c\'est constant ou par moments',
      '🔥  Dites si ça brûle, serre ou pique',
    ],
    tip: 'Vous pouvez dessiner où vous avez mal sur un schéma du corps.',
  },
  {
    id: 'medecin-questions', category: 'medecin', icon: '❓',
    title: 'Questions à poser au médecin',
    bullets: [
      '❓  "Qu\'est-ce que j\'ai exactement ?"',
      '💊  "Pourquoi prenez-vous ce médicament ?"',
      '⚠️  "Y a-t-il des effets secondaires ?"',
      '📅  "Quand dois-je revenir ?"',
      '🏥  "Faut-il aller à l\'hôpital ?"',
    ],
    tip: 'N\'hésitez pas à redemander si vous n\'avez pas compris.',
  },
  {
    id: 'medecin-comprendre', category: 'medecin', icon: '🧠',
    title: 'Si vous ne comprenez pas',
    bullets: [
      '✋  Faites signe que vous n\'avez pas compris',
      '📝  Demandez au médecin d\'écrire',
      '📱  Utilisez un traducteur sur votre téléphone',
      '🔄  Demandez de répéter plus lentement',
      '👥  Demandez un interprète LSF la prochaine fois',
    ],
    tip: 'Votre médecin doit s\'assurer que vous avez compris.',
  },
  // Médicaments
  {
    id: 'med-ordonnance', category: 'medicaments', icon: '📄',
    title: 'Lire votre ordonnance',
    bullets: [
      '💊  Le nom du médicament est écrit en gros',
      '🔢  La dose est notée (ex : 1 comprimé)',
      '🌅  Le moment est noté (ex : matin, soir)',
      '📅  La durée est notée (ex : 7 jours)',
      '📸  Prenez une photo de l\'ordonnance',
    ],
    tip: 'Demandez au pharmacien d\'expliquer si c\'est difficile.',
  },
  {
    id: 'med-prise', category: 'medicaments', icon: '⏰',
    title: 'Prendre ses médicaments',
    bullets: [
      '⏰  Prenez à la même heure chaque jour',
      '🔔  Mettez une alarme sur votre téléphone',
      '💧  Avalez avec un grand verre d\'eau',
      '❌  Ne doublez pas la dose si vous oubliez',
      '✅  Finissez le traitement même si vous allez mieux',
    ],
    tip: 'Un pilulier hebdomadaire aide à ne pas oublier.',
  },
  {
    id: 'med-effets', category: 'medicaments', icon: '⚠️',
    title: 'Effets secondaires',
    bullets: [
      '🔴  Appelez le médecin si grande rougeur',
      '😮‍💨  Appelez si difficultés à respirer',
      '🤢  Consultez si vomissements répétés',
      '💫  Consultez si vertiges forts',
      '📞  En cas de doute : appelez le 15',
    ],
    tip: 'Lisez la notice dans la boîte du médicament.',
  },
  // Urgences
  {
    id: 'urgence-15', category: 'urgences', icon: '🚑',
    title: 'Quand appeler le 15 (SAMU)',
    bullets: [
      '💔  Forte douleur dans la poitrine',
      '🧠  Maux de tête très forts et soudains',
      '😵  Perte de connaissance',
      '🩸  Saignement abondant',
      '🌡️  Fièvre très élevée — plus de 40°C',
    ],
    tip: 'Le 15 est gratuit et disponible 24h/24.',
  },
  {
    id: 'urgence-114', category: 'urgences', icon: '📱',
    title: 'Le 114 : urgences pour sourds',
    bullets: [
      '📱  Envoyez un SMS au 114',
      '✍️  Écrivez "URGENCE" et votre adresse',
      '📍  Envoyez votre position GPS',
      '⌚  Les secours arrivent rapidement',
      '💬  Restez disponible pour les SMS de réponse',
    ],
    tip: 'Le 114 fonctionne aussi en vidéo LSF via l\'application 114.',
  },
  {
    id: 'urgence-gestes', category: 'urgences', icon: '🩹',
    title: 'Gestes de premiers secours',
    bullets: [
      '🫁  Ne respire plus → massez le cœur (30 fois)',
      '😴  Inconscient mais respire → couchez sur le côté',
      '🩸  Saignement → appuyez fort avec un tissu propre',
      '🔥  Brûlure → eau froide pendant 15 minutes',
      '☎️  Appelez le 15 ou le 114 rapidement',
    ],
    tip: 'Formez-vous au PSC1 (premiers secours) — Croix-Rouge.',
  },
  // Droits du patient sourd
  {
    id: 'droits-interprete', category: 'droits', icon: '⚖️',
    title: 'Votre droit à l\'interprète',
    bullets: [
      '✅  Vous avez le droit à un interprète LSF',
      '📖  Loi du 11 février 2005 sur l\'accessibilité',
      '💶  Les soins peuvent être pris en charge',
      '📞  Contactez votre MDPH pour de l\'aide',
      '📱  PharmaSign vous met en relation avec des interprètes',
    ],
    tip: 'Renseignez-vous auprès de l\'ANPDA ou de l\'UNAPEDA.',
  },
  {
    id: 'droits-mdph', category: 'droits', icon: '🏛️',
    title: 'La MDPH',
    bullets: [
      '🏛️  MDPH = Maison Départementale des Personnes Handicapées',
      '🪪  Demandez la carte mobilité inclusion (CMI)',
      '💶  Aide financière pour soins et équipements',
      '📞  Contactez la MDPH de votre département',
      '🌐  mdph.fr pour toutes les démarches en ligne',
    ],
    tip: 'La demande peut se faire en ligne sur mdph.fr.',
  },
  {
    id: 'droits-aah', category: 'droits', icon: '💶',
    title: 'L\'AAH : aide financière mensuelle',
    bullets: [
      '💶  L\'AAH est une allocation mensuelle',
      '✅  Les personnes sourdes peuvent y avoir droit',
      '📋  Demandez via la MDPH',
      '💰  Jusqu\'à 971 € par mois (montant 2024)',
      '📅  Réévaluée tous les 1 à 5 ans',
    ],
    tip: 'Faites votre demande tôt : les délais peuvent être longs.',
  },
];

/* ── Composant fiche ───────────────────────────────────── */
function FicheCard({ fiche }: { fiche: FalcFiche }) {
  const cfg = CAT_CONFIG[fiche.category];

  const handleShare = async () => {
    const lines = [
      `${fiche.icon}  ${fiche.title}`,
      `Catégorie : ${cfg.emoji} ${cfg.label}`,
      '',
      ...fiche.bullets.map((b) => b.replace(/^\S+\s{2}/, '• ')),
      ...(fiche.tip ? ['', `💡 Astuce : ${fiche.tip}`] : []),
      '',
      '— PharmaSign, l\'app santé pour les personnes sourdes',
    ];
    try {
      await Share.share({ message: lines.join('\n'), title: fiche.title });
    } catch {
      // user cancelled
    }
  };

  return (
    <View style={s.card}>
      {/* Titre */}
      <View style={s.cardHeader}>
        <View style={[s.cardIconBox, { backgroundColor: cfg.bg, borderColor: cfg.color + '40' }]}>
          <Text style={s.cardIconText}>{fiche.icon}</Text>
        </View>
        <Text style={s.cardTitle}>{fiche.title}</Text>
      </View>

      {/* Bullets */}
      <View style={s.bullets}>
        {fiche.bullets.map((line, i) => (
          <Text key={i} style={s.bullet}>{line}</Text>
        ))}
      </View>

      {/* Astuce */}
      {fiche.tip && (
        <View style={[s.tipBox, { backgroundColor: cfg.bg, borderColor: cfg.color + '30' }]}>
          <Text style={s.tipIcon}>💡</Text>
          <Text style={[s.tipText, { color: cfg.color }]}>{fiche.tip}</Text>
        </View>
      )}

      {/* Partager */}
      <TouchableOpacity
        style={[s.shareBtn, { borderColor: cfg.color + '40', backgroundColor: cfg.bg }]}
        onPress={handleShare}
        accessibilityRole="button"
        accessibilityLabel={`Partager la fiche ${fiche.title}`}
      >
        <Feather name="share-2" size={14} color={cfg.color} />
        <Text style={[s.shareBtnText, { color: cfg.color }]}>Partager cette fiche</Text>
      </TouchableOpacity>
    </View>
  );
}

/* ── Écran principal ───────────────────────────────────── */
export default function FalcScreen() {
  const [activecat, setActivecat] = useState<FalcCategory | null>(null);

  const filtered = useMemo(
    () => (activecat ? FICHES.filter((f) => f.category === activecat) : FICHES),
    [activecat],
  );

  return (
    <SafeAreaView style={s.safe}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.headerRow}>
          <TouchableOpacity
            style={s.backBtn}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Retour"
          >
            <Feather name="chevron-left" size={20} color="#fff" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={s.headerSupra}>Langage simplifié</Text>
            <Text style={s.headerTitle}>Fiches Santé FALC</Text>
          </View>
          <View style={s.countBadge}>
            <Text style={s.countBadgeText}>{filtered.length} fiches</Text>
          </View>
        </View>
        <Text style={s.headerDesc}>
          Textes courts · Phrases simples · Facile à lire et à comprendre
        </Text>
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
          <Text style={[s.catPillText, activecat === null && s.catPillTextActive]}>Tout</Text>
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

      {/* Fiches */}
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {filtered.length === 0 && (
          <View style={s.empty}>
            <Text style={s.emptyIcon}>📭</Text>
            <Text style={s.emptyText}>Aucune fiche dans cette catégorie.</Text>
          </View>
        )}

        {filtered.map((fiche) => (
          <FicheCard key={fiche.id} fiche={fiche} />
        ))}

        <View style={s.footer}>
          <Text style={s.footerText}>
            FALC — Facile à Lire et à Comprendre{'\n'}
            Norme européenne d'accessibilité de l'information
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ── Styles ────────────────────────────────────────────── */
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BRAND },

  header: {
    backgroundColor: BRAND,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 14,
    gap: 8,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerSupra: {
    fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.75)',
    textTransform: 'uppercase', letterSpacing: 1,
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#fff', letterSpacing: -0.4, marginTop: 1 },
  countBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4,
  },
  countBadgeText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  headerDesc: { fontSize: 12.5, color: 'rgba(255,255,255,0.78)', letterSpacing: 0.1 },

  catBar: { backgroundColor: BRAND_DARK, flexGrow: 0 },
  catBarContent: {
    flexDirection: 'row', gap: 8,
    paddingHorizontal: 20, paddingVertical: 10,
  },
  catPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  catPillActive: { backgroundColor: '#fff', borderColor: '#fff' },
  catPillEmoji: { fontSize: 13 },
  catPillText: { fontSize: 12.5, fontWeight: '700', color: 'rgba(255,255,255,0.9)' },
  catPillTextActive: { color: BRAND_DARK },

  scroll: { flex: 1, backgroundColor: BG },
  scrollContent: { padding: 16, paddingBottom: 48, gap: 14 },

  empty: { alignItems: 'center', paddingVertical: 60, gap: 10 },
  emptyIcon: { fontSize: 44 },
  emptyText: { fontSize: 15, color: INK_3, textAlign: 'center' },

  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16, gap: 12,
    borderWidth: 1, borderColor: BORDER,
    shadowColor: INK, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardIconBox: {
    width: 50, height: 50, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, flexShrink: 0,
  },
  cardIconText: { fontSize: 26 },
  cardTitle: { flex: 1, fontSize: 17, fontWeight: '800', color: INK, lineHeight: 23 },

  bullets: { gap: 8, paddingLeft: 4 },
  bullet: { fontSize: 15, color: INK_2, lineHeight: 22 },

  tipBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    padding: 12, borderRadius: 10, borderWidth: 1,
  },
  tipIcon: { fontSize: 16, marginTop: 1 },
  tipText: { flex: 1, fontSize: 13.5, fontWeight: '600', lineHeight: 20 },

  shareBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 10, paddingHorizontal: 14,
    borderRadius: 10, borderWidth: 1.5,
    alignSelf: 'flex-start',
  },
  shareBtnText: { fontSize: 13, fontWeight: '700' },

  footer: { paddingVertical: 8, paddingHorizontal: 4, alignItems: 'center', gap: 4 },
  footerText: { fontSize: 11.5, color: INK_3, textAlign: 'center', lineHeight: 18 },
});
