import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Colors, FontSize, Radius, Spacing } from '@/constants/theme';

/* ─── Types ────────────────────────────────────────────────── */

type ServiceCategory = 'urgences' | 'sante' | 'administratif' | 'social' | 'education';

type Service = {
  id: string;
  name: string;
  description: string;
  category: ServiceCategory;
  phone: string | null;
  website: string | null;
  address: string | null;
  coordinates: { lat: number; lng: number } | null;
  badge?: string;
};

/* ─── Données ───────────────────────────────────────────────── */

const SERVICES: Service[] = [
  /* ── Urgences ── */
  {
    id: 'urg-114',
    name: 'Urgences 114',
    description:
      'Numéro d\'urgence national dédié aux sourds et malentendants. Accessible par SMS, tchat ou visiophone 24h/24.',
    category: 'urgences',
    phone: '114',
    website: 'https://www.urgences-114.fr',
    address: null,
    coordinates: null,
    badge: '🆘 Gratuit 24h/24',
  },
  {
    id: 'urg-samu',
    name: 'SAMU – 15',
    description:
      'Service d\'Aide Médicale Urgente. Urgence médicale grave. Préférez le 114 par SMS si vous êtes sourd.',
    category: 'urgences',
    phone: '15',
    website: null,
    address: null,
    coordinates: null,
  },
  {
    id: 'urg-pompiers',
    name: 'Pompiers – 18',
    description:
      'Secours d\'urgence (incendie, accident, danger immédiat). SMS au 114 pour une alternative accessible.',
    category: 'urgences',
    phone: '18',
    website: null,
    address: null,
    coordinates: null,
  },
  {
    id: 'urg-police',
    name: 'Police – 17',
    description:
      'Police Nationale. En cas de danger ou d\'urgence. SMS au 114 disponible pour les sourds.',
    category: 'urgences',
    phone: '17',
    website: null,
    address: null,
    coordinates: null,
  },

  /* ── Santé ── */
  {
    id: 'sante-chu-pasteur',
    name: 'CHU de Nice – Hôpital Pasteur',
    description:
      'Centre Hospitalier Universitaire. Urgences médicales 24h/24. Accueil et signalétique adaptés. Interprètes LSF sur demande via PharmaSign.',
    category: 'sante',
    phone: '04 92 03 77 77',
    website: 'https://www.chu-nice.fr',
    address: '4 Avenue Reine Victoria, 06003 Nice',
    coordinates: { lat: 43.7197, lng: 7.2598 },
  },
  {
    id: 'sante-chu-archet',
    name: 'CHU de Nice – Hôpital de l\'Archet',
    description:
      'Maternité, pédiatrie, neurologie, psychiatrie. Consultations spécialisées. Boucle magnétique disponible à l\'accueil.',
    category: 'sante',
    phone: '04 92 03 60 60',
    website: 'https://www.chu-nice.fr',
    address: '151 Route Saint-Antoine de Ginestière, 06200 Nice',
    coordinates: { lat: 43.6856, lng: 7.2231 },
  },
  {
    id: 'sante-chu-cimiez',
    name: 'CHU de Nice – Hôpital de Cimiez',
    description:
      'Gériatrie, rééducation, soins de suite. Environnement calme adapté aux consultations longues.',
    category: 'sante',
    phone: '04 92 03 06 00',
    website: 'https://www.chu-nice.fr',
    address: '4 Avenue Reine Victoria, 06003 Nice',
    coordinates: { lat: 43.7197, lng: 7.2598 },
  },

  /* ── Administratif ── */
  {
    id: 'admin-mdph',
    name: 'MDPH 06 – Maison des Personnes Handicapées',
    description:
      'Reconnaissance du handicap auditif, AAH, RQTH, carte mobilité inclusion, PCH. Accueil sur rendez-vous avec interprète sur demande.',
    category: 'administratif',
    phone: '04 97 13 33 00',
    website: 'https://www.mdph06.fr',
    address: '33 Rue Smolett, 06357 Nice Cedex 4',
    coordinates: { lat: 43.7032, lng: 7.2741 },
    badge: '🏛️ Indispensable',
  },
  {
    id: 'admin-caf',
    name: 'CAF Alpes-Maritimes',
    description:
      'Caisse d\'Allocations Familiales. Aides au logement, allocations, RSA. Démarches accessibles en ligne via caf.fr.',
    category: 'administratif',
    phone: '3230',
    website: 'https://www.caf.fr',
    address: '51 Rue Gubernatis, 06000 Nice',
    coordinates: { lat: 43.7047, lng: 7.2711 },
  },
  {
    id: 'admin-cpam',
    name: 'CPAM – Assurance Maladie 06',
    description:
      'Caisse Primaire d\'Assurance Maladie. Remboursements, carte Vitale, CMUC, ALD. Messagerie Ameli accessible.',
    category: 'administratif',
    phone: '3646',
    website: 'https://www.ameli.fr',
    address: '48 Avenue du Ray, 06000 Nice',
    coordinates: { lat: 43.7158, lng: 7.2626 },
  },

  /* ── Social / Associations ── */
  {
    id: 'social-urapeda',
    name: 'URAPEDA PACA',
    description:
      'Union Régionale des Associations de Parents d\'Enfants et adultes Déficients Auditifs PACA. Accompagnement, formations LSF, aide aux familles, réseau de professionnels.',
    category: 'social',
    phone: '04 91 11 41 65',
    website: 'https://www.urapeda-paca.org',
    address: '49 Impasse Glandeves, 13004 Marseille',
    coordinates: { lat: 43.3041, lng: 5.3949 },
    badge: 'Région PACA',
  },
  {
    id: 'social-ardds',
    name: 'ARDDS – Devenir Sourd',
    description:
      'Association de Réadaptation et de Défense des Devenus Sourds. Groupes de paroles, soutien psychologique, aide administrative pour les personnes devenant sourdes.',
    category: 'social',
    phone: null,
    website: 'https://www.ardds.org',
    address: 'Nice – Alpes-Maritimes (antenne locale)',
    coordinates: null,
  },
  {
    id: 'social-bucodes',
    name: 'BUCODES SurdiFrance',
    description:
      'Bureau de coordination des associations de sourds. Droits, accessibilité, représentation des sourds et malentendants en France.',
    category: 'social',
    phone: null,
    website: 'https://www.bucodes-surdifrance.org',
    address: null,
    coordinates: null,
  },

  /* ── Éducation ── */
  {
    id: 'edu-ssefis',
    name: 'SSEFIS – Soutien Scolaire',
    description:
      'Service de Soutien à l\'Éducation Familiale et à l\'Intégration Scolaire pour enfants sourds. Accompagnement en milieu ordinaire, LSF et LPC.',
    category: 'education',
    phone: null,
    website: 'https://www.education.gouv.fr',
    address: 'Nice – Alpes-Maritimes (renseignements via MDPH 06)',
    coordinates: null,
  },
  {
    id: 'edu-uca',
    name: 'Université Côte d\'Azur – LSF',
    description:
      'Cours de Langue des Signes Française pour entendants et malentendants. Formation continue et LANSAD ouverts à tous.',
    category: 'education',
    phone: '04 89 15 00 00',
    website: 'https://univ-cotedazur.fr',
    address: '28 Avenue Valrose, 06108 Nice',
    coordinates: { lat: 43.7255, lng: 7.2700 },
  },
  {
    id: 'edu-inja',
    name: 'INJA – Institut National',
    description:
      'Institut National de Jeunes Sourds et Aveugles. Ressources pédagogiques, formations LSF, documentation nationale.',
    category: 'education',
    phone: null,
    website: 'https://www.injs-paris.fr',
    address: 'Ressources nationales en ligne',
    coordinates: null,
  },
];

/* ─── Config catégories ─────────────────────────────────────── */

const CATEGORIES: {
  id: ServiceCategory | 'all';
  label: string;
  emoji: string;
  color: string;
}[] = [
  { id: 'all',           label: 'Tous',          emoji: '🔍', color: '#0F766E' },
  { id: 'urgences',      label: 'Urgences',      emoji: '🆘', color: '#DC2626' },
  { id: 'sante',         label: 'Santé',         emoji: '🏥', color: '#2563EB' },
  { id: 'administratif', label: 'Administratif', emoji: '🏛️', color: '#7C3AED' },
  { id: 'social',        label: 'Social',        emoji: '🤝', color: '#D97706' },
  { id: 'education',     label: 'Éducation',     emoji: '🎓', color: '#059669' },
];

const CAT_COLOR: Record<ServiceCategory, string> = {
  urgences:      '#DC2626',
  sante:         '#2563EB',
  administratif: '#7C3AED',
  social:        '#D97706',
  education:     '#059669',
};

const CAT_LABEL: Record<ServiceCategory, string> = {
  urgences:      'Urgences',
  sante:         'Santé',
  administratif: 'Administratif',
  social:        'Social / Asso.',
  education:     'Éducation',
};

/* ─── Helpers ───────────────────────────────────────────────── */

function openMaps(address: string, coords: { lat: number; lng: number } | null) {
  const query = encodeURIComponent(address);
  if (coords && Platform.OS !== 'web') {
    Linking.openURL(
      `https://www.google.com/maps/dir/?api=1&destination=${coords.lat},${coords.lng}`,
    );
  } else {
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
  }
}

/* ─── Service card ──────────────────────────────────────────── */

function ServiceCard({ service }: { service: Service }) {
  const color = CAT_COLOR[service.category];
  const catLabel = CAT_LABEL[service.category];

  return (
    <View style={[card.wrap, { borderLeftColor: color }]}>
      {/* Header */}
      <View style={card.header}>
        <View style={[card.catTag, { backgroundColor: color + '18' }]}>
          <Text style={[card.catTagText, { color }]}>{catLabel}</Text>
        </View>
        {service.badge && (
          <View style={card.badge}>
            <Text style={card.badgeText}>{service.badge}</Text>
          </View>
        )}
      </View>

      <Text style={card.name}>{service.name}</Text>
      <Text style={card.desc}>{service.description}</Text>

      {service.address && (
        <View style={card.addressRow}>
          <Feather name="map-pin" size={12} color="#6B7280" />
          <Text style={card.addressText}>{service.address}</Text>
        </View>
      )}

      {/* Actions */}
      <View style={card.actions}>
        {service.phone && (
          <TouchableOpacity
            style={[card.actionBtn, { backgroundColor: color + '15', borderColor: color + '40' }]}
            onPress={() => Linking.openURL(`tel:${service.phone}`)}
            accessibilityRole="button"
            accessibilityLabel={`Appeler ${service.name}`}
          >
            <Feather name="phone" size={13} color={color} />
            <Text style={[card.actionBtnText, { color }]}>{service.phone}</Text>
          </TouchableOpacity>
        )}

        {service.website && (
          <TouchableOpacity
            style={[card.actionBtn, { backgroundColor: '#F3F4F6', borderColor: '#E5E7EB' }]}
            onPress={() => Linking.openURL(service.website!)}
            accessibilityRole="button"
            accessibilityLabel={`Site web de ${service.name}`}
          >
            <Feather name="globe" size={13} color="#374151" />
            <Text style={[card.actionBtnText, { color: '#374151' }]}>Site web</Text>
          </TouchableOpacity>
        )}

        {service.address && (
          <TouchableOpacity
            style={[card.actionBtn, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}
            onPress={() => openMaps(service.address!, service.coordinates)}
            accessibilityRole="button"
            accessibilityLabel={`Itinéraire vers ${service.name}`}
          >
            <Feather name="navigation" size={13} color="#2563EB" />
            <Text style={[card.actionBtnText, { color: '#2563EB' }]}>Itinéraire</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

/* ─── Main screen ───────────────────────────────────────────── */

export default function AnnuaireScreen() {
  const [search, setSearch]           = useState('');
  const [activeCategory, setCategory] = useState<ServiceCategory | 'all'>('all');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return SERVICES.filter((s) => {
      if (activeCategory !== 'all' && s.category !== activeCategory) return false;
      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        (s.address ?? '').toLowerCase().includes(q)
      );
    });
  }, [search, activeCategory]);

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          accessibilityLabel="Retour"
          accessibilityRole="button"
        >
          <Feather name="arrow-left" size={20} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>📍 Annuaire LSF Nice</Text>
          <Text style={styles.headerSub}>Services accessibles aux sourds — PACA</Text>
        </View>
      </View>

      {/* Search bar */}
      <View style={styles.searchWrap}>
        <Feather name="search" size={16} color="#6B7280" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher un service…"
          placeholderTextColor="#9CA3AF"
          value={search}
          onChangeText={setSearch}
          clearButtonMode="while-editing"
          accessibilityLabel="Rechercher un service"
          returnKeyType="search"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')} accessibilityLabel="Effacer">
            <Feather name="x-circle" size={16} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>

      {/* Category filter pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.pills}
        contentContainerStyle={styles.pillsContent}
      >
        {CATEGORIES.map((cat) => {
          const active = activeCategory === cat.id;
          return (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.pill,
                { borderColor: cat.color },
                active ? { backgroundColor: cat.color } : { backgroundColor: '#fff' },
              ]}
              onPress={() => setCategory(cat.id as ServiceCategory | 'all')}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
            >
              <Text style={styles.pillEmoji}>{cat.emoji}</Text>
              <Text style={[styles.pillLabel, { color: active ? '#fff' : cat.color }]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Result count */}
      <View style={styles.countBar}>
        <Text style={styles.countText}>
          <Text style={styles.countNum}>{filtered.length}</Text>
          {` service${filtered.length !== 1 ? 's' : ''} trouvé${filtered.length !== 1 ? 's' : ''}`}
        </Text>
      </View>

      {/* Services list */}
      <ScrollView
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyTitle}>Aucun résultat</Text>
            <Text style={styles.emptySub}>Essayez un autre mot-clé ou catégorie.</Text>
          </View>
        ) : (
          filtered.map((s) => <ServiceCard key={s.id} service={s} />)
        )}

        {/* Info footer */}
        <View style={styles.footer}>
          <Feather name="info" size={13} color="#6B7280" />
          <Text style={styles.footerText}>
            Ces informations sont données à titre indicatif. Vérifiez les horaires et disponibilités avant de vous déplacer.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ─── Card styles ───────────────────────────────────────────── */

const card = StyleSheet.create({
  wrap: {
    backgroundColor: '#fff',
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: Spacing.sm,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  catTag: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  catTagText: { fontSize: 11, fontWeight: '700' },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.full,
    backgroundColor: '#FEF3C7',
  },
  badgeText: { fontSize: 11, fontWeight: '600', color: '#92400E' },
  name: { fontSize: FontSize.md, fontWeight: '700', color: '#111827', lineHeight: 22 },
  desc: { fontSize: FontSize.sm, color: '#4B5563', lineHeight: 20 },
  addressRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 5, marginTop: 2 },
  addressText: { fontSize: 12, color: '#6B7280', flex: 1, lineHeight: 17 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: 2 },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  actionBtnText: { fontSize: 12, fontWeight: '600' },
});

/* ─── Screen styles ─────────────────────────────────────────── */

const BRAND = '#0F766E';

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: BRAND,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  headerTitle: { fontSize: FontSize.lg, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.82)', marginTop: 1 },

  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Platform.OS === 'ios' ? 10 : 0,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    gap: Spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: { flexShrink: 0 },
  searchInput: { flex: 1, fontSize: FontSize.md, color: '#111827', paddingVertical: 0 },

  pills: { flexGrow: 0 },
  pillsContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
    gap: Spacing.sm,
    flexDirection: 'row',
  },
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: Radius.full, borderWidth: 1.5,
  },
  pillEmoji: { fontSize: 13 },
  pillLabel: { fontSize: FontSize.xs, fontWeight: '700' },

  countBar: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  countText: { fontSize: FontSize.xs, color: '#6B7280' },
  countNum: { fontWeight: '800', color: BRAND },

  list: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
    gap: Spacing.md,
  },

  empty: { alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.xxl },
  emptyIcon: { fontSize: 44 },
  emptyTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
  emptySub: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center' },

  footer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
    padding: Spacing.md,
    backgroundColor: '#F9FAFB',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  footerText: {
    flex: 1, fontSize: 11, color: '#6B7280', lineHeight: 16,
  },
});
