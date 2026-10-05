import { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { ColorTokens } from '@/constants/design';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useStripePayouts, type PayoutStatus } from '@/hooks/useStripePayouts';

/* Carte « Paiements » du profil interprète : activation des versements Stripe */

const COPY: Record<PayoutStatus, { title: string; text: string; cta?: string }> = {
  none: {
    title: 'Paiements non activés',
    text: 'Activez les paiements pour être payé directement par les patients via PharmaSign. '
      + 'Vos informations (identité, IBAN) sont saisies sur une page sécurisée Stripe.',
    cta: 'Activer mes paiements',
  },
  incomplete: {
    title: 'Inscription à terminer',
    text: 'Il manque des informations sur votre compte de paiement.',
    cta: 'Reprendre l’inscription',
  },
  pending: {
    title: 'Vérification en cours',
    text: 'Stripe vérifie vos informations. Cela prend en général quelques minutes, parfois 1 à 2 jours.',
    cta: 'Compléter ou corriger',
  },
  active: {
    title: 'Paiements activés',
    text: 'Vous recevez vos versements sur votre compte bancaire après chaque mission.',
  },
};

export default function PayoutsCard() {
  const colors = useThemeColor();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { status, busy, error, startOnboarding } = useStripePayouts();
  const copy = COPY[status];
  const active = status === 'active';

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Paiements</Text>
      <View style={styles.row}>
        <View style={[styles.icon, active ? styles.iconActive : styles.iconTodo]}>
          <Feather name={active ? 'check' : 'credit-card'} size={18} color={active ? colors.SUCCESS : colors.WARNING} />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={styles.title}>{copy.title}</Text>
          <Text style={styles.text}>{copy.text}</Text>
        </View>
      </View>
      {!!error && <Text style={styles.error}>{error}</Text>}
      {copy.cta && (
        <TouchableOpacity
          style={[styles.button, busy && { opacity: 0.6 }]}
          onPress={startOnboarding}
          disabled={busy}
          accessibilityRole="button"
          accessibilityLabel={copy.cta}
        >
          {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{copy.cta}</Text>}
        </TouchableOpacity>
      )}
    </View>
  );
}

function createStyles(colors: ColorTokens) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.SURFACE,
      borderRadius: 16, padding: 16, gap: 12,
      borderWidth: 1, borderColor: colors.BORDER,
      shadowColor: colors.INK_1,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
    },
    cardTitle: {
      fontSize: 11, fontWeight: '700', color: colors.INK_3,
      textTransform: 'uppercase', letterSpacing: 1,
    },
    row: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
    icon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
    iconActive: { backgroundColor: colors.BRAND_TINT },
    iconTodo: { backgroundColor: colors.SURFACE_ALT },
    title: { fontSize: 15, fontWeight: '700', color: colors.INK_1 },
    text: { fontSize: 13, color: colors.INK_2, lineHeight: 19 },
    error: { fontSize: 13, color: colors.ERROR },
    button: {
      backgroundColor: colors.BRAND, borderRadius: 12,
      paddingVertical: 12, alignItems: 'center',
    },
    buttonText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  });
}
