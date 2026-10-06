import { StyleSheet, Text, View } from 'react-native';
import type { Appointment } from '@/hooks/useAppointments';
import { formatCents, usePaymentStatus } from '@/hooks/usePaymentStatus';
import { formatPrice } from '@/utils/appointment';

/* Web : le paiement se fait dans l'appli mobile ; on affiche seulement l'état. */
export default function PaymentPanel({ appt }: { appt: Appointment }) {
  const payment = usePaymentStatus(appt.id);
  const rate = appt.interpreterHourlyRate;
  const text = payment?.status === 'paid'
    ? `✓ Payé · ${formatCents(payment.amount)}`
    : rate
      ? `💳 ${formatPrice(rate, appt.durationMin)} · paiement dans l'appli mobile PharmaSign`
      : "💳 Paiement à convenir avec l'interprète";
  return (
    <View style={styles.note}>
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  note: { paddingHorizontal: 2 },
  text: { fontSize: 11.5, color: '#94A3B8' },
});
