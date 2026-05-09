import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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

const CONTACT_EMAIL = 'tom.caucigh@gmail.com';
const UPDATE_DATE   = 'Mai 2026';

type Section = { icon: string; title: string; content: string[] };

const SECTIONS: Section[] = [
  {
    icon: 'database',
    title: 'Données collectées',
    content: [
      `Identité : nom complet, adresse email, rôle dans l'application (sourd, interprète, apprenti).`,
      'Profil : photo de profil (optionnelle), numéro de téléphone (optionnel).',
      'Localisation GPS : utilisée uniquement pour trouver les interprètes disponibles à proximité. Non conservée en dehors des sessions actives.',
      'Historique des rendez-vous : date, heure, lieu, type de consultation, statut.',
      'Messages : échanges entre patients et interprètes, conservés pour la durée du rendez-vous concerné.',
      'Certificats LSF : niveau et informations de brevet pour les apprentis et interprètes.',
      'Données techniques : identifiant Firebase, horodatage des connexions.',
    ],
  },
  {
    icon: 'target',
    title: 'Utilisation des données',
    content: [
      'Mise en relation entre personnes sourdes ou malentendantes et interprètes LSF agréés.',
      'Gestion et suivi des rendez-vous médicaux avec interprétation en langue des signes française.',
      'Communication sécurisée entre patients et interprètes via la messagerie intégrée.',
      'Parcours de formation et de certification LSF pour les apprentis.',
      `Amélioration de l'application et détection des anomalies techniques.`,
      'Aucun profilage publicitaire ni analyse comportementale à des fins commerciales.',
    ],
  },
  {
    icon: 'server',
    title: 'Stockage et hébergement',
    content: [
      'Les données sont hébergées sur les serveurs Firebase (Google LLC), localisés en Europe (région europe-west).',
      'Firebase est conforme au RGPD et signataire des clauses contractuelles types de la Commission européenne.',
      'Les données sont chiffrées en transit (TLS 1.3) et au repos par les services Firebase.',
      `Aucune donnée n'est stockée localement sur l'appareil, à l'exception des préférences d'accessibilité (AsyncStorage, non sensibles).`,
    ],
  },
  {
    icon: 'share-2',
    title: 'Partage des données',
    content: [
      `Aucune donnée personnelle n'est vendue, louée ou cédée à des tiers à des fins commerciales.`,
      'Les données sont partagées uniquement entre les parties directement impliquées dans un rendez-vous (patient et interprète assigné).',
      `Partage technique limité avec Firebase (Google) en tant que sous-traitant technique, dans le cadre d'un accord de traitement des données conforme au RGPD.`,
      `En cas d'obligation légale, les données peuvent être communiquées aux autorités compétentes sur réquisition judiciaire.`,
    ],
  },
  {
    icon: 'clock',
    title: 'Durée de conservation',
    content: [
      'Compte actif : les données sont conservées aussi longtemps que le compte reste actif.',
      'Historique des rendez-vous : conservé 3 ans après le dernier rendez-vous.',
      'Messages de chat : conservés 1 an après la date du rendez-vous concerné.',
      'Suppression sur demande : toutes vos données sont supprimées dans un délai de 30 jours suivant votre demande de suppression de compte.',
      `Pour exercer votre droit à la suppression, contactez : ${CONTACT_EMAIL}`,
    ],
  },
  {
    icon: 'shield',
    title: 'Sécurité',
    content: [
      'Authentification sécurisée via Firebase Authentication (email + mot de passe chiffré).',
      `Règles de sécurité Firestore : chaque utilisateur ne peut accéder qu'aux données le concernant directement.`,
      `Chiffrement des communications (TLS) entre l'application et les serveurs.`,
      `Aucun mot de passe n'est stocké en clair — Firebase utilise des algorithmes de hachage robustes.`,
      'Réinitialisation du mot de passe uniquement par email vérifié.',
    ],
  },
  {
    icon: 'user-check',
    title: 'Vos droits RGPD',
    content: [
      `Droit d'accès : obtenir une copie de toutes vos données personnelles.`,
      'Droit de rectification : corriger des informations inexactes ou incomplètes.',
      `Droit à l'effacement (« droit à l'oubli ») : demander la suppression de vos données.`,
      'Droit à la portabilité : recevoir vos données dans un format structuré et lisible par machine.',
      `Droit d'opposition : vous opposer au traitement de vos données dans certaines circonstances.`,
      'Droit à la limitation du traitement : demander la suspension du traitement de vos données.',
      `Pour exercer ces droits, écrivez à : ${CONTACT_EMAIL}. Réponse sous 30 jours.`,
      'En cas de litige non résolu, vous pouvez saisir la CNIL (www.cnil.fr).',
    ],
  },
  {
    icon: 'users',
    title: 'Mineurs',
    content: [
      'PharmaSign est réservée aux personnes âgées de 16 ans et plus.',
      `Si vous avez moins de 16 ans, l'utilisation de l'application requiert le consentement d'un parent ou tuteur légal.`,
      'En créant un compte, vous certifiez avoir 16 ans ou plus, ou disposer du consentement parental requis.',
      `Si nous apprenons qu'un mineur de moins de 16 ans a créé un compte sans consentement parental, ce compte sera supprimé.`,
    ],
  },
  {
    icon: 'bell',
    title: 'Modifications de cette politique',
    content: [
      `Cette politique de confidentialité peut être mise à jour pour refléter l'évolution de l'application ou des obligations légales.`,
      `En cas de modification substantielle, vous serez informé par email à l'adresse associée à votre compte, avec un préavis de 15 jours.`,
      'La date de mise à jour est indiquée en haut de ce document.',
      `La poursuite de l'utilisation de l'application après notification vaut acceptation de la nouvelle politique.`,
    ],
  },
];

function Section({ section }: { section: Section }) {
  return (
    <View style={st.card}>
      <View style={st.cardHeader}>
        <View style={st.cardIconWrap}>
          <Feather name={section.icon as never} size={16} color={BRAND} />
        </View>
        <Text style={st.cardTitle}>{section.title}</Text>
      </View>
      {section.content.map((line, i) => (
        <View key={i} style={st.bullet}>
          <View style={st.bulletDot} />
          <Text style={st.bulletText}>{line}</Text>
        </View>
      ))}
    </View>
  );
}

export default function PrivacyScreen() {
  return (
    <SafeAreaView style={st.safe}>
      {/* Header teal */}
      <View style={st.header}>
        <TouchableOpacity
          style={st.backBtn}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Retour"
        >
          <Feather name="chevron-left" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={st.headerCenter}>
          <Text style={st.headerTitle}>Politique de confidentialité</Text>
          <Text style={st.headerSub}>Mise à jour : {UPDATE_DATE}</Text>
        </View>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        style={st.scroll}
        contentContainerStyle={st.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Intro */}
        <View style={st.introCard}>
          <View style={st.introIconWrap}>
            <Feather name="lock" size={22} color={BRAND} />
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={st.introTitle}>Protection de vos données</Text>
            <Text style={st.introText}>
              PharmaSign s'engage à protéger la vie privée de ses utilisateurs, en particulier
              ceux partageant des données médicales sensibles. Cette politique décrit quelles
              données nous collectons, pourquoi, et comment vous pouvez les contrôler.
            </Text>
          </View>
        </View>

        {/* Responsable du traitement */}
        <View style={st.responsibleCard}>
          <Text style={st.responsibleLabel}>Responsable du traitement</Text>
          <Text style={st.responsibleName}>Tom Caucigh</Text>
          <Text style={st.responsibleSub}>
            Étudiant en pharmacie · Université Côte d'Azur · Nice
          </Text>
          <TouchableOpacity
            style={st.emailRow}
            onPress={() => Linking.openURL(`mailto:${CONTACT_EMAIL}`)}
            accessibilityRole="link"
            accessibilityLabel={`Envoyer un email à ${CONTACT_EMAIL}`}
          >
            <Feather name="mail" size={14} color={BRAND} />
            <Text style={st.emailText}>{CONTACT_EMAIL}</Text>
            <Feather name="external-link" size={12} color={INK_3} />
          </TouchableOpacity>
        </View>

        {/* Sections */}
        {SECTIONS.map((s) => (
          <Section key={s.title} section={s} />
        ))}

        {/* Footer CNIL */}
        <View style={st.footerCard}>
          <Feather name="info" size={15} color={BRAND_DARK} />
          <Text style={st.footerText}>
            Application à usage éducatif — Ne remplace pas un avis médical professionnel.
            Conforme au Règlement Général sur la Protection des Données (RGPD — UE 2016/679).
          </Text>
        </View>

        <Text style={st.lastUpdate}>Dernière mise à jour : {UPDATE_DATE}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
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
  headerCenter: { flex: 1, alignItems: 'center', gap: 2 },
  headerTitle: {
    fontSize: 17, fontWeight: '700', color: '#fff', letterSpacing: -0.3, textAlign: 'center',
  },
  headerSub: { fontSize: 11.5, color: 'rgba(255,255,255,0.72)' },

  scroll: { flex: 1, backgroundColor: BG },
  content: { padding: 16, paddingBottom: 48, gap: 12 },

  /* Intro card */
  introCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 14,
    backgroundColor: BRAND_TINT,
    borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: '#A7D4D0',
    marginBottom: 4,
  },
  introIconWrap: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
    shadowColor: BRAND, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15, shadowRadius: 6, elevation: 3,
  },
  introTitle: { fontSize: 15, fontWeight: '700', color: BRAND_DARK },
  introText: { fontSize: 13, color: BRAND_DARK, lineHeight: 19 },

  /* Responsible card */
  responsibleCard: {
    backgroundColor: '#fff',
    borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: BORDER,
    gap: 4,
    shadowColor: '#0F1B2D', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  responsibleLabel: {
    fontSize: 10.5, fontWeight: '700', color: INK_3,
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4,
  },
  responsibleName: { fontSize: 16, fontWeight: '700', color: INK },
  responsibleSub:  { fontSize: 13, color: INK_2 },
  emailRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginTop: 8, paddingTop: 10,
    borderTopWidth: 1, borderTopColor: BORDER,
  },
  emailText: { flex: 1, fontSize: 13.5, color: BRAND, fontWeight: '500' },

  /* Section card */
  card: {
    backgroundColor: '#fff',
    borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: BORDER,
    gap: 10,
    shadowColor: '#0F1B2D', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardIconWrap: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: BRAND_TINT,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: INK, flex: 1 },

  /* Bullet */
  bullet: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  bulletDot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: BRAND,
    marginTop: 7, flexShrink: 0,
  },
  bulletText: { flex: 1, fontSize: 13.5, color: INK_2, lineHeight: 20 },

  /* Footer */
  footerCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: BRAND_TINT,
    borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: '#A7D4D0',
    marginTop: 4,
  },
  footerText: {
    flex: 1, fontSize: 12.5, color: BRAND_DARK,
    lineHeight: 18, fontWeight: '500',
  },

  lastUpdate: {
    textAlign: 'center', fontSize: 11.5, color: INK_3, marginTop: 4,
  },
});
