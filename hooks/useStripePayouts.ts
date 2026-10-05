import { useCallback, useEffect, useState } from 'react';
import * as WebBrowser from 'expo-web-browser';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/config/firebase';
import { useAuth, type User } from '@/context/AuthContext';

export type PayoutStatus = NonNullable<User['stripePayoutStatus']>;

const getLink   = httpsCallable<void, { url: string }>(functions, 'stripeOnboardingLink');
const getStatus = httpsCallable<void, { status: PayoutStatus }>(functions, 'stripeRefreshStatus');

/* Versements de l'interprète via Stripe Connect.
   Le formulaire (identité, IBAN) s'ouvre sur les pages Stripe ; à la fermeture
   on relit l'état du compte chez Stripe. */
export function useStripePayouts() {
  const { user } = useAuth();
  const [status, setStatus] = useState<PayoutStatus>(user?.stripePayoutStatus ?? 'none');
  const [busy, setBusy]     = useState(false);
  const [error, setError]   = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setStatus((await getStatus()).data.status);
    } catch {
      // état précédent conservé ; pas bloquant
    }
  }, []);

  // Un compte « en vérification » peut être validé par Stripe entre deux ouvertures
  useEffect(() => {
    if (user?.role === 'interprete' && user.stripePayoutStatus && user.stripePayoutStatus !== 'active') refresh();
  }, [user?.id, user?.role, user?.stripePayoutStatus, refresh]);

  const startOnboarding = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const { url } = (await getLink()).data;
      await WebBrowser.openAuthSessionAsync(url, 'pharmasign://stripe-return');
      await refresh();
    } catch {
      setError('Impossible d’ouvrir la page Stripe. Vérifiez votre connexion et réessayez.');
    } finally {
      setBusy(false);
    }
  }, [refresh]);

  return { status, busy, error, startOnboarding };
}
