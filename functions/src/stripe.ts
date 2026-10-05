/* Logique de paiement indépendante de Stripe (testable sans réseau). */

/* Montant d'une mission en centimes : tarif horaire (€) × durée */
export function priceCents(hourlyRate: number, durationMin: number): number {
  if (!(hourlyRate > 0) || !(durationMin > 0)) return 0;
  return Math.round((hourlyRate * 100 * durationMin) / 60);
}

/* État des versements d'un interprète, tel qu'affiché dans l'appli :
   - none       : pas encore de compte Stripe
   - incomplete : formulaire Stripe commencé mais pas terminé
   - pending    : formulaire envoyé, vérification en cours chez Stripe
   - active     : l'interprète peut recevoir des versements */
export type PayoutStatus = 'none' | 'incomplete' | 'pending' | 'active';

export type AccountLike = {
  details_submitted?: boolean;
  payouts_enabled?: boolean;
  capabilities?: { transfers?: string } | null;
};

export function payoutStatus(account: AccountLike | null | undefined): PayoutStatus {
  if (!account) return 'none';
  if (account.payouts_enabled && account.capabilities?.transfers === 'active') return 'active';
  return account.details_submitted ? 'pending' : 'incomplete';
}

/* Page affichée à la fin (ou à l'expiration) du formulaire Stripe : renvoie dans l'appli */
export function returnPage(reason: 'done' | 'refresh'): string {
  const deepLink = `pharmasign://stripe-return?r=${reason}`;
  const text = reason === 'done'
    ? 'Merci ! Vous pouvez revenir dans PharmaSign.'
    : 'Le lien a expiré. Revenez dans PharmaSign pour recommencer.';
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="refresh" content="0;url=${deepLink}"><title>PharmaSign</title></head>
<body style="font-family:sans-serif;text-align:center;padding:48px 24px">
<p style="font-size:18px">${text}</p>
<p><a href="${deepLink}" style="display:inline-block;padding:14px 24px;background:#2A9D8F;color:#fff;border-radius:10px;text-decoration:none;font-weight:700">Revenir dans l’appli</a></p>
</body></html>`;
}
