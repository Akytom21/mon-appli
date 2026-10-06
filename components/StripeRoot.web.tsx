import type { ReactElement } from 'react';

/* Web : pas de SDK Stripe React Native, le paiement se fait dans l'appli mobile. */
export default function StripeRoot({ children }: { children: ReactElement }) {
  return children;
}
