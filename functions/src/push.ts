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
  status?: string;
  interpreterId?: string | null;
  interpreterName?: string | null;
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

function base(to: string, title: string, body: string, url: string, urgent = false): PushMessage {
  return { to, title, body, data: { url }, sound: 'default', priority: urgent ? 'high' : 'default', channelId: 'default' };
}

/* Interprètes : nouvelle demande dans la bourse de missions */
export function newRequestPushes(appt: Appointment, tokens: string[]): PushMessage[] {
  const urgent = appt.type === 'urgences';
  const title = urgent ? '🚨 Urgence : interprète demandé' : 'Nouvelle demande d’interprétation';
  const body = [TYPE_LABEL[appt.type ?? ''] ?? 'Rendez-vous médical', when(appt)].filter(Boolean).join(' ');
  return tokens.map((t) => base(t, title, body, '/(tabs)/interpretes/missions', urgent));
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

/* Changement de statut d'un RDV → notification éventuelle, avec son destinataire */
export function statusChangePush(
  before: Appointment,
  after: Appointment,
): { recipientId: string; build: (token: string) => PushMessage } | null {
  if (before.status === 'pending' && after.status === 'accepted') {
    return { recipientId: after.patientId, build: (t) => acceptedPush(after, t) };
  }
  if (before.status === 'accepted' && after.status === 'cancelled' && before.interpreterId) {
    return { recipientId: before.interpreterId, build: (t) => cancelledPush(after, t) };
  }
  return null;
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
