import type { ReactElement } from 'react';
import { StripeProvider } from '@stripe/stripe-react-native';

/* Fournit Stripe à l'appli mobile (clé PUBLIABLE uniquement, depuis .env / EAS).
   Sans clé (environnement mal configuré), l'appli tourne sans paiement en ligne. */
const publishableKey = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY;

export default function StripeRoot({ children }: { children: ReactElement }) {
  if (!publishableKey) return children;
  return (
    <StripeProvider
      publishableKey={publishableKey}
      urlScheme="pharmasign"
      merchantIdentifier="merchant.com.tomcaucigh.pharmasign"
    >
      {children}
    </StripeProvider>
  );
}
