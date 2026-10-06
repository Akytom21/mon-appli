import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/config/firebase';

export type PaymentStatus = 'pending' | 'processing' | 'paid' | 'failed' | 'canceled';
export type PaymentInfo = { status: PaymentStatus; amount: number } | null;

/* Suivi en temps réel de payments/{apptId} (écrit par les Cloud Functions de paiement).
   null : aucun paiement en ligne commencé pour ce RDV. */
export function usePaymentStatus(apptId: string, enabled = true): PaymentInfo {
  const [info, setInfo] = useState<PaymentInfo>(null);
  useEffect(() => {
    if (!enabled || !apptId) return;
    return onSnapshot(
      doc(db, 'payments', apptId),
      (snap) => setInfo(snap.exists() ? { status: snap.get('status'), amount: snap.get('amount') } : null),
      () => setInfo(null),
    );
  }, [apptId, enabled]);
  return info;
}

/* 6750 → "67,50 €" */
export function formatCents(cents: number): string {
  return `${(cents / 100).toFixed(2).replace('.', ',')} €`;
}
