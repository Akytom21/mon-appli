import { router } from 'expo-router';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors, FontSize, Radius, Spacing } from '@/constants/theme';

export default function ConfirmationScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Success icon */}
        <View style={styles.iconCircle}>
          <Text style={styles.iconText}>✅</Text>
        </View>

        <Text style={styles.title}>Demande envoyée !</Text>
        <Text style={styles.subtitle}>
          Votre demande de rendez-vous avec un interprète LSF a bien été transmise.
        </Text>

        {/* Details card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Récapitulatif</Text>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>🩺  Type de soin</Text>
            <Text style={styles.rowValue}>Médecin généraliste</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.rowLabel}>📅  Date</Text>
            <Text style={styles.rowValue}>Aujourd'hui</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.rowLabel}>🕐  Créneau</Text>
            <Text style={styles.rowValue}>Matin (8h–12h)</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.rowLabel}>📍  Localisation</Text>
            <Text style={styles.rowValue}>Votre position actuelle</Text>
          </View>
        </View>

        {/* Status */}
        <View style={styles.statusBox}>
          <Text style={styles.statusEmoji}>⏳</Text>
          <Text style={styles.statusText}>
            Un interprète disponible va accepter votre demande. Vous serez notifié(e) dans les plus brefs délais.
          </Text>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => router.replace('/(tabs)/malentendants')}
            accessibilityRole="button"
          >
            <Text style={styles.primaryBtnText}>Retour à l'espace</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => router.replace('/(tabs)')}
            accessibilityRole="button"
          >
            <Text style={styles.secondaryBtnText}>Accueil PharmaSign</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: {
    flex: 1,
    padding: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.lg,
  },

  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: Radius.full,
    backgroundColor: Colors.interpretesLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: { fontSize: 48 },

  title: {
    fontSize: FontSize.xxl,
    fontWeight: '800',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: Spacing.md,
  },

  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    width: '100%',
    gap: Spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowLabel: { fontSize: FontSize.sm, color: Colors.textSecondary },
  rowValue: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textPrimary },
  divider: { height: 1, backgroundColor: Colors.border },

  statusBox: {
    flexDirection: 'row',
    gap: Spacing.md,
    backgroundColor: Colors.malentendantsLight,
    borderRadius: Radius.md,
    padding: Spacing.md,
    width: '100%',
    alignItems: 'flex-start',
  },
  statusEmoji: { fontSize: 20, flexShrink: 0 },
  statusText: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.malentendantsDark,
    lineHeight: 20,
  },

  actions: { width: '100%', gap: Spacing.sm },
  primaryBtn: {
    backgroundColor: Colors.malentendants,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    alignItems: 'center',
  },
  primaryBtnText: { fontSize: FontSize.md, fontWeight: '700', color: Colors.white },
  secondaryBtn: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  secondaryBtnText: { fontSize: FontSize.md, color: Colors.textSecondary },
});
