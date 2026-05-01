import { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors, FontSize, Radius, Spacing } from '@/constants/theme';

type Session = {
  id: string;
  titre: string;
  niveau: string;
  formateur: string;
  date: string;
  heure: string;
  places: number;
  lieu: string;
  description: string;
  prix: string;
};

const SESSIONS: Session[] = [
  {
    id: '1',
    titre: 'Mises en situation clinique',
    niveau: 'Intermédiaire',
    formateur: 'Dr. Claire Lefèvre',
    date: 'Samedi 10 mai 2026',
    heure: '09h00 – 13h00',
    places: 3,
    lieu: 'Centre de formation LSF, Paris 9e',
    description:
      'Entraînement pratique avec des médecins partenaires. Simulations de consultations réelles en LSF avec retour personnalisé.',
    prix: 'Gratuit (formation agréée)',
  },
  {
    id: '2',
    titre: 'Vocabulaire médical avancé',
    niveau: 'Avancé',
    formateur: 'Antoine Garnier',
    date: 'Dimanche 11 mai 2026',
    heure: '14h00 – 18h00',
    places: 5,
    lieu: 'En visioconférence',
    description:
      'Approfondissement du vocabulaire médical en LSF : cardiologie, neurologie, psychiatrie. Exercices interactifs en groupe.',
    prix: 'Gratuit (formation agréée)',
  },
  {
    id: '3',
    titre: 'Urgences et soins intensifs',
    niveau: 'Expert',
    formateur: 'Sarah Nguyen',
    date: 'Samedi 17 mai 2026',
    heure: '09h00 – 17h00',
    places: 1,
    lieu: 'Hôpital de simulation, Paris 15e',
    description:
      'Formation intensive en environnement hospitalier simulé. Gestion des situations d\'urgence en LSF.',
    prix: 'Gratuit (formation agréée)',
  },
];

const NIVEAU_COLOR: Record<string, string> = {
  Intermédiaire: Colors.warning,
  Avancé: Colors.malentendants,
  Expert: Colors.error,
};

export default function FormationScreen() {
  const [selected, setSelected] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  if (confirmed) {
    const session = SESSIONS.find((s) => s.id === selected)!;
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <Text style={styles.successEmoji}>🎓</Text>
          </View>
          <Text style={styles.successTitle}>Formation réservée !</Text>
          <Text style={styles.successText}>
            Votre place est confirmée pour la session :
          </Text>
          <View style={styles.successCard}>
            <Text style={styles.successSession}>{session.titre}</Text>
            <Text style={styles.successMeta}>📅 {session.date}</Text>
            <Text style={styles.successMeta}>🕐 {session.heure}</Text>
            <Text style={styles.successMeta}>📍 {session.lieu}</Text>
            <Text style={styles.successMeta}>👤 {session.formateur}</Text>
          </View>
          <Text style={styles.successNote}>
            Vous recevrez une confirmation et les instructions de connexion par notification.
          </Text>
          <TouchableOpacity
            style={styles.retourBtn}
            onPress={() => setConfirmed(false)}
            accessibilityRole="button"
          >
            <Text style={styles.retourBtnText}>Réserver une autre session</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.intro}>
          <Text style={styles.introTitle}>Choisissez une session</Text>
          <Text style={styles.introText}>
            Toutes les formations sont gratuites et reconnues pour l'obtention de l'agrément LSF médical.
          </Text>
        </View>

        <View style={styles.sessions}>
          {SESSIONS.map((session) => {
            const isSelected = selected === session.id;
            const isFull = session.places === 0;
            return (
              <TouchableOpacity
                key={session.id}
                style={[
                  styles.sessionCard,
                  isSelected && styles.sessionCardSelected,
                  isFull && styles.sessionCardFull,
                ]}
                onPress={() => !isFull && setSelected(session.id)}
                disabled={isFull}
                activeOpacity={0.8}
                accessibilityRole="radio"
                accessibilityState={{ selected: isSelected, disabled: isFull }}
              >
                {/* Header */}
                <View style={styles.sessionHeader}>
                  <View style={styles.sessionTitleRow}>
                    <Text style={styles.sessionTitre}>{session.titre}</Text>
                    {isSelected && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <View
                    style={[
                      styles.niveauBadge,
                      { backgroundColor: (NIVEAU_COLOR[session.niveau] ?? Colors.apprentis) + '22' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.niveauText,
                        { color: NIVEAU_COLOR[session.niveau] ?? Colors.apprentis },
                      ]}
                    >
                      {session.niveau}
                    </Text>
                  </View>
                </View>

                {/* Description */}
                <Text style={styles.sessionDesc}>{session.description}</Text>

                {/* Meta */}
                <View style={styles.sessionMeta}>
                  <Text style={styles.metaItem}>👤 {session.formateur}</Text>
                  <Text style={styles.metaItem}>📅 {session.date} · {session.heure}</Text>
                  <Text style={styles.metaItem}>📍 {session.lieu}</Text>
                  <Text style={styles.metaItem}>💰 {session.prix}</Text>
                </View>

                {/* Places */}
                <View
                  style={[
                    styles.placesBadge,
                    {
                      backgroundColor:
                        session.places <= 2 ? '#FEE2E2' : Colors.apprentisLight,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.placesText,
                      {
                        color: session.places <= 2 ? Colors.error : Colors.apprentis,
                      },
                    ]}
                  >
                    {session.places} place{session.places > 1 ? 's' : ''} restante{session.places > 1 ? 's' : ''}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          style={[styles.confirmBtn, !selected && styles.confirmBtnDisabled]}
          onPress={() => selected && setConfirmed(true)}
          disabled={!selected}
          accessibilityRole="button"
        >
          <Text style={styles.confirmBtnText}>
            {selected ? '🎓  Confirmer la réservation' : 'Sélectionnez une session'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.apprentis },
  scroll: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.lg, paddingBottom: Spacing.xxl, gap: Spacing.lg },

  intro: {
    backgroundColor: Colors.apprentisLight,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: Colors.apprentis,
    gap: Spacing.xs,
  },
  introTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.apprentisDark },
  introText: { fontSize: FontSize.sm, color: Colors.apprentisDark, lineHeight: 20 },

  sessions: { gap: Spacing.md },
  sessionCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.md,
    borderWidth: 2,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  sessionCardSelected: {
    borderColor: Colors.apprentis,
    backgroundColor: Colors.apprentisLight,
  },
  sessionCardFull: { opacity: 0.5 },
  sessionHeader: { gap: Spacing.xs },
  sessionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sessionTitre: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.textPrimary,
    flex: 1,
  },
  checkmark: { fontSize: FontSize.xl, color: Colors.apprentis, fontWeight: '700' },
  niveauBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  niveauText: { fontSize: FontSize.xs, fontWeight: '700' },
  sessionDesc: { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 20 },
  sessionMeta: { gap: 3 },
  metaItem: { fontSize: FontSize.sm, color: Colors.textSecondary },
  placesBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  placesText: { fontSize: FontSize.xs, fontWeight: '600' },

  confirmBtn: {
    backgroundColor: Colors.apprentis,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  confirmBtnDisabled: { backgroundColor: Colors.textSecondary, opacity: 0.5 },
  confirmBtnText: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.white },

  successContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.lg,
  },
  successIcon: {
    width: 96,
    height: 96,
    borderRadius: Radius.full,
    backgroundColor: Colors.apprentisLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successEmoji: { fontSize: 48 },
  successTitle: {
    fontSize: FontSize.xxl,
    fontWeight: '800',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  successText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  successCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    width: '100%',
    gap: Spacing.sm,
    borderLeftWidth: 4,
    borderLeftColor: Colors.apprentis,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  successSession: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  successMeta: { fontSize: FontSize.sm, color: Colors.textSecondary },
  successNote: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: Spacing.md,
  },
  retourBtn: {
    backgroundColor: Colors.apprentis,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    width: '100%',
  },
  retourBtnText: { fontSize: FontSize.md, fontWeight: '700', color: Colors.white },
});
