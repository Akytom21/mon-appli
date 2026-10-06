/* Construction et envoi des notifications push (service Expo Push).
   Aucun contenu médical ni texte de message dans les notifications :
   elles transitent par Expo, Google et Apple et s'affichent sur l'écran
   verrouillé. Le détail reste dans l'appli. */

export type Appointment = {
  patientId: string;
  patientName?: string;
  type?: string;
  date?: string;
  time?: string;
  durationMin?: number;
  status?: string;
  interpreterId?: string | null;
  interpreterName?: string | null;
  declinedBy?: string[];
};

export type ChatMessage = {
  senderId: string;
  senderName?: string;
  recipientId: string;
  appointmentId?: string;
};

export type PushMessage = {
  to: string;
  title: string;
  body: string;
  data: { url: string };
  sound: 'default';
  priority: 'default' | 'high';
  channelId: string;
};

type Ticket = { status: 'ok' | 'error'; details?: { error?: string } };
export type FetchLike = (url: string, init: { method: string; headers: Record<string, string>; body: string }) =>
  Promise<{ ok: boolean; status: number; json: () => Promise<unknown> }>;

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const CHUNK_SIZE = 100; // limite du service Expo par requête

const TYPE_LABEL: Record<string, string> = {
  generaliste: 'Médecin généraliste',
  specialiste: 'Spécialiste',
  pharmacie: 'Pharmacie',
  urgences: 'Urgences',
};

export function isExpoToken(token: unknown): token is string {
  return typeof token === 'string' && /^Expo(nent)?PushToken\[.+\]$/.test(token);
}

/* "2026-10-12" → "12/10" */
function shortDate(date?: string): string {
  const m = /^\d{4}-(\d{2})-(\d{2})$/.exec(date ?? '');
  return m ? `${m[2]}/${m[1]}` : '';
}

function when(appt: Appointment): string {
  const d = shortDate(appt.date);
  return [d && `le ${d}`, appt.time && `à ${appt.time}`].filter(Boolean).join(' ');
}

/* 90 → "1 h 30" */
function duration(min?: number): string {
  if (!min) return '';
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} h` : `${h} h ${String(m).padStart(2, '0')}`;
}

function base(to: string, title: string, body: string, url: string, urgent = false): PushMessage {
  return { to, title, body, data: { url }, sound: 'default', priority: urgent ? 'high' : 'default', channelId: 'default' };
}

/* Interprètes : nouvelle demande dans la bourse de missions
   (aussi après un désistement : titre adapté via `relaunched`) */
export function newRequestPushes(appt: Appointment, tokens: string[], relaunched = false): PushMessage[] {
  const urgent = appt.type === 'urgences';
  const title = urgent ? '🚨 Urgence : interprète demandé'
    : relaunched ? 'Demande à reprendre' : 'Nouvelle demande d’interprétation';
  const d = duration(appt.durationMin);
  const body = [TYPE_LABEL[appt.type ?? ''] ?? 'Rendez-vous médical', when(appt), d && `(${d})`]
    .filter(Boolean).join(' ');
  return tokens.map((t) => base(t, title, body, '/(tabs)/interpretes/missions', urgent));
}

/* Interprètes à prévenir d'une demande : disponibles, pas le patient,
   pas ceux qui l'ont déjà refusée ou s'en sont désistés */
export function interpreterTokens(
  appt: Appointment,
  interpreters: { id: string; disponible?: boolean; expoPushToken?: unknown }[],
): string[] {
  const declined = new Set(appt.declinedBy ?? []);
  return interpreters
    .filter((i) => i.disponible !== false && i.id !== appt.patientId && !declined.has(i.id))
    .map((i) => i.expoPushToken)
    .filter(isExpoToken);
}

/* Patient : un interprète a accepté sa demande */
export function acceptedPush(appt: Appointment, token: string): PushMessage {
  const who = appt.interpreterName || 'Un interprète';
  const w = when(appt);
  return base(token, 'RDV confirmé ✅', `${who} sera votre interprète${w ? ' ' + w : ''}.`, '/(tabs)/malentendants/mes-rdv');
}

/* Interprète : le patient a annulé une mission qu'il avait acceptée */
export function cancelledPush(appt: Appointment, token: string): PushMessage {
  const w = when(appt);
  return base(token, 'Mission annulée', `Le patient a annulé le RDV${w ? ' ' + w : ''}.`, '/(tabs)/interpretes/planning');
}

/* Destinataire d'un message du chat (sans le texte du message) */
export function chatPush(msg: ChatMessage, appointmentId: string, token: string): PushMessage {
  const name = msg.senderName || 'Votre contact';
  const url = `/(tabs)/messagerie/${appointmentId}?recipientId=${encodeURIComponent(msg.senderId)}&name=${encodeURIComponent(name)}`;
  return base(token, '💬 Nouveau message', `${name} vous a écrit.`, url);
}

/* Interprète : le patient a réglé la mission en ligne */
export function paidPush(appt: Appointment, amountCents: number, token: string): PushMessage {
  const w = when(appt);
  const euros = (amountCents / 100).toFixed(2).replace('.', ',');
  return base(token, '💳 Mission réglée', `Le patient a payé ${euros} € pour le RDV${w ? ' ' + w : ''}.`, '/(tabs)/interpretes/planning');
}

const eur = (cents: number) => `${(cents / 100).toFixed(2).replace('.', ',')} €`;

/* Patient : remboursement (total ou partiel) d'un RDV payé */
export function refundPush(
  appt: Appointment, refundCents: number, reason: 'withdrawn' | 'cancelled_early' | 'cancelled_late' | 'stale', token: string,
): PushMessage {
  const w = when(appt);
  const why = reason === 'withdrawn' ? 'Votre interprète s’est désisté'
    : reason === 'cancelled_late' ? 'Annulation moins de 24 h avant : remboursement de 50 %'
      : 'Votre RDV a été annulé';
  return base(token, `↩️ Remboursement de ${eur(refundCents)}`,
    `${why}${w ? ` (RDV ${w})` : ''}. Le remboursement apparaît sous 5 à 10 jours.`,
    '/(tabs)/malentendants/mes-rdv');
}

/* Interprète : versement envoyé sur son compte Stripe */
export function payoutPush(appt: Appointment, netCents: number, token: string): PushMessage {
  const w = when(appt);
  return base(token, `💶 Versement de ${eur(netCents)}`,
    `Pour la mission${w ? ' ' + w : ''}. Il arrive sur votre compte bancaire sous quelques jours.`,
    '/(tabs)/interpretes/planning');
}

/* Patient : son interprète s'est désisté, la demande est relancée */
export function withdrawnPush(appt: Appointment, token: string): PushMessage {
  const w = when(appt);
  return base(
    token,
    'Votre interprète s’est désisté',
    `Pour votre RDV${w ? ' ' + w : ''}, nous recherchons un autre interprète.`,
    '/(tabs)/malentendants/mes-rdv',
  );
}

/* Changement de statut d'un RDV → notification éventuelle, avec son destinataire.
   `relaunch` : la demande est de nouveau ouverte aux autres interprètes. */
export function statusChangePush(
  before: Appointment,
  after: Appointment,
): { recipientId: string; build: (token: string) => PushMessage; relaunch?: boolean } | null {
  if (before.status === 'pending' && after.status === 'accepted') {
    return { recipientId: after.patientId, build: (t) => acceptedPush(after, t) };
  }
  if (before.status === 'accepted' && after.status === 'cancelled' && before.interpreterId) {
    return { recipientId: before.interpreterId, build: (t) => cancelledPush(after, t) };
  }
  if (before.status === 'accepted' && after.status === 'pending') {
    return { recipientId: after.patientId, build: (t) => withdrawnPush(after, t), relaunch: true };
  }
  return null;
}

/* ── Rappels de RDV ─────────────────────────────────────────────
   Les dates/heures des RDV sont saisies en heure de Paris. */

function parisOffsetMs(utcMs: number): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Paris', hourCycle: 'h23',
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).formatToParts(new Date(utcMs));
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  return Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second')) - utcMs;
}

/* "2026-10-12" + "10:30" (heure de Paris) → instant UTC en ms */
export function parisInstant(date: string, time: string): number {
  const [y, mo, d] = date.split('-').map(Number);
  const [h, mi] = time.split(':').map(Number);
  const naive = Date.UTC(y, mo - 1, d, h, mi);
  const first = naive - parisOffsetMs(naive);
  return naive - parisOffsetMs(first); // corrige les jours de changement d'heure
}

/* Instant UTC → "YYYY-MM-DD" à Paris */
export function parisDate(utcMs: number): string {
  return new Date(utcMs + parisOffsetMs(utcMs)).toISOString().slice(0, 10);
}

export type ReminderKind = 'dayBefore' | 'hourBefore';
export type ReminderPlan = {
  apptId: string; kind: ReminderKind; recipientId: string; key: string; today: boolean;
};

const HOUR = 3_600_000;

/* Rappels à envoyer maintenant. La fonction tourne toutes les 15 min :
   - veille : RDV dans 2 h à 24 h ;
   - 1 h avant : RDV dans 0 à 70 min.
   `sent` contient les clés "kind:uid" déjà envoyées (un interprète remplaçant
   reçoit ses propres rappels, le patient n'est pas prévenu deux fois). */
export function planReminders(
  appts: { id: string; appt: Appointment; sent: string[] }[],
  now: number,
): ReminderPlan[] {
  const plans: ReminderPlan[] = [];
  for (const { id, appt, sent } of appts) {
    if (appt.status !== 'accepted' || !appt.date || !appt.time || !appt.interpreterId) continue;
    const delta = parisInstant(appt.date, appt.time) - now;
    const kind: ReminderKind | null =
      delta > 0 && delta <= 70 * 60_000 ? 'hourBefore'
        : delta > 2 * HOUR && delta <= 24 * HOUR ? 'dayBefore'
          : null;
    if (!kind) continue;
    const today = appt.date === parisDate(now);
    for (const recipientId of [appt.patientId, appt.interpreterId]) {
      const key = `${kind}:${recipientId}`;
      if (!sent.includes(key)) plans.push({ apptId: id, kind, recipientId, key, today });
    }
  }
  return plans;
}

export function reminderPush(
  appt: Appointment, plan: Pick<ReminderPlan, 'kind' | 'today'>, forPatient: boolean, token: string,
): PushMessage {
  const at = appt.time ? `à ${appt.time}` : '';
  const day = plan.today ? 'aujourd’hui' : 'demain';
  const title = plan.kind === 'hourBefore'
    ? `⏰ RDV ${at} — dans moins d’une heure`
    : `📅 Rappel : RDV ${day} ${at}`.trim();
  const when = plan.kind === 'dayBefore' ? `${day} ${at}` : at;
  const body = forPatient
    ? `${appt.interpreterName || 'Votre interprète'} vous retrouve ${when}.`
    : `Mission d’interprétation ${when}${appt.durationMin ? ` (${duration(appt.durationMin)})` : ''}.`;
  const url = forPatient ? '/(tabs)/malentendants/mes-rdv' : '/(tabs)/interpretes/planning';
  return base(token, title, body, url);
}

/* Envoie les messages par paquets de 100 ; renvoie les jetons à oublier
   (application désinstallée ou jeton révoqué : DeviceNotRegistered). */
export async function sendPushes(messages: PushMessage[], fetchImpl: FetchLike): Promise<{ sent: number; staleTokens: string[] }> {
  const valid = messages.filter((m) => isExpoToken(m.to));
  const staleTokens: string[] = [];
  let sent = 0;
  for (let i = 0; i < valid.length; i += CHUNK_SIZE) {
    const chunk = valid.slice(i, i + CHUNK_SIZE);
    const res = await fetchImpl(EXPO_PUSH_URL, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify(chunk),
    });
    if (!res.ok) throw new Error(`Expo Push HTTP ${res.status}`);
    const { data } = (await res.json()) as { data: Ticket[] };
    data.forEach((ticket, j) => {
      if (ticket.status === 'ok') sent++;
      else if (ticket.details?.error === 'DeviceNotRegistered') staleTokens.push(chunk[j].to);
    });
  }
  return { sent, staleTokens };
}
