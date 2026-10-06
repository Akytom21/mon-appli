import { useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useStripe } from '@stripe/stripe-react-native';
import { FirebaseError } from 'firebase/app';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/config/firebase';
import type { ColorTokens } from '@/constants/design';
import type { Appointment } from '@/hooks/useAppointments';
import { formatCents, usePaymentStatus } from '@/hooks/usePaymentStatus';
import { useThemeColor } from '@/hooks/use-theme-color';
import { formatPrice } from '@/utils/appointment';

const createPayment = httpsCallable<{ apptId: string }, { clientSecret: string; amount: number }>(
  functions, 'createPayment',
);
const PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '';

/* Paiement d'un RDV accepté, côté patient (écran Stripe PaymentSheet).
   Le montant est calculé par le serveur ; le statut « payé » arrive par le
   webhook Stripe (payments/{apptId}), pas par l'appli. */
export default function PaymentPanel({ appt }: { appt: Appointment }) {
  const colors = useThemeColor();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const payment = usePaymentStatus(appt.id);
  const [busy, setBusy]               = useState(false);
  const [justPaid, setJustPaid]       = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [unavailable, setUnavailable] = useState<string | null>(null);

  const rate = appt.interpreterHourlyRate;
  const note = (text: string) => (
    <View style={styles.note}>
      <Feather name="credit-card" size={12} color={colors.INK_3} />
      <Text style={styles.noteText}>{text}</Text>
    </View>
  );

  if (!rate || !PUBLISHABLE_KEY) return note("💳 Paiement à convenir avec l'interprète");
  if (unavailable) return note(`💳 ${formatPrice(rate, appt.durationMin)} · ${unavailable}`);

  if (payment?.status === 'paid') {
    return (
      <View style={[styles.note, styles.paid]} accessibilityLabel={`Payé, ${formatCents(payment.amount)}`}>
        <Feather name="check-circle" size={14} color={colors.SUCCESS} />
        <Text style={styles.paidText}>Payé · {formatCents(payment.amount)}</Text>
      </View>
    );
  }
  if (justPaid || payment?.status === 'processing') {
    return note('⏳ Paiement envoyé, confirmation en cours…');
  }

  const pay = async () => {
    setBusy(true);
    setError(null);
    try {
      const { clientSecret } = (await createPayment({ apptId: appt.id })).data;
      const init = await initPaymentSheet({
        merchantDisplayName: 'PharmaSign',
        paymentIntentClientSecret: clientSecret,
        returnURL: 'pharmasign://stripe-redirect',
        googlePay: { merchantCountryCode: 'FR', currencyCode: 'EUR', testEnv: PUBLISHABLE_KEY.startsWith('pk_test_') },
        allowsDelayedPaymentMethods: false,
      });
      if (init.error) throw new Error(init.error.message);
      const result = await presentPaymentSheet();
      if (!result.error) setJustPaid(true);
      else if (result.error.code !== 'Canceled') setError(result.error.message);
    } catch (err) {
      if (err instanceof FirebaseError && err.code === 'functions/failed-precondition') {
        setUnavailable(err.message); // interprète sans paiement en ligne : règlement direct
      } else if (err instanceof FirebaseError && err.code === 'functions/already-exists') {
        setJustPaid(true);
      } else {
        setError('Paiement impossible pour le moment. Vérifiez votre connexion et réessayez.');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.block}>
      {payment?.status === 'failed' && <Text style={styles.error}>Le dernier paiement a échoué.</Text>}
      {payment?.status === 'refunded' && (
        <Text style={styles.hint}>
          ↩️ Votre paiement précédent ({formatCents(payment.refundedAmount ?? payment.amount)}) a été remboursé.
        </Text>
      )}
      {!!error && <Text style={styles.error}>{error}</Text>}
      <TouchableOpacity
        style={[styles.button, busy && { opacity: 0.6 }]}
        onPress={pay}
        disabled={busy}
        accessibilityRole="button"
        accessibilityLabel={`Payer ${formatPrice(rate, appt.durationMin)}`}
      >
        {busy
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.buttonText}>💳 Payer {formatPrice(rate, appt.durationMin)}</Text>}
      </TouchableOpacity>
      <Text style={styles.hint}>Paiement sécurisé par Stripe · reçu envoyé par e-mail</Text>
    </View>
  );
}

function createStyles(colors: ColorTokens) {
  return StyleSheet.create({
    note: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 2 },
    noteText: { fontSize: 11.5, color: colors.INK_3, flex: 1 },
    paid: { backgroundColor: colors.BRAND_TINT, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 10 },
    paidText: { fontSize: 13, fontWeight: '700', color: colors.SUCCESS },
    block: { gap: 6 },
    button: { backgroundColor: colors.BRAND, borderRadius: 12, paddingVertical: 11, paddingHorizontal: 12, alignItems: 'center' },
    buttonText: { fontSize: 14, fontWeight: '700', color: '#fff', textAlign: 'center' },
    hint: { fontSize: 11, color: colors.INK_3, textAlign: 'center' },
    error: { fontSize: 12.5, color: colors.ERROR },
  });
}
