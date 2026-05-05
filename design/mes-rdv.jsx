// MesRDV — Écran "Mes rendez-vous" (rôle Sourd) de PharmaSign
// Reprend le langage visuel de HomeSourd / MapRDV : teal #0F766E, ink #0F1B2D,
// surfaces F6F8FA/FFF, icônes Lucide, typographie Inter.

const MV_BRAND = '#0F766E';
const MV_BRAND_DARK = '#0B5F58';
const MV_BRAND_TINT = '#E8F4F2';
const MV_INK = '#0F1B2D';
const MV_INK_2 = '#475569';
const MV_INK_3 = '#94A3B8';
const MV_SURFACE = '#FFFFFF';
const MV_BG = '#F6F8FA';
const MV_BORDER = '#E5EAF0';

// Statuts RDV — couleurs sémantiques cohérentes avec ton mock
const STATUS = {
  pending:  { label: 'En attente',    color: '#B45309', tint: '#FEF3C7', dark: '#92400E' },
  accepted: { label: 'Confirmé',      color: '#059669', tint: '#D1FADF', dark: '#065F46' },
  declined: { label: 'Non attribué',  color: '#DC2626', tint: '#FEE7E7', dark: '#991B1B' },
  cancelled:{ label: 'Annulé',        color: '#94A3B8', tint: '#F1F5F9', dark: '#475569' },
};

// Types de RDV
const TYPES = {
  generaliste: { label: 'Médecin généraliste', icon: 'stetho' },
  urgences:    { label: 'Urgences',            icon: 'alert' },
  specialiste: { label: 'Spécialiste',         icon: 'spec' },
  pharmacie:   { label: 'Pharmacie',           icon: 'pill' },
  hopital:     { label: 'Hôpital · Examen',    icon: 'hosp' },
};

// ── Icons (Lucide) ──────────────────────────────────────────
const VIco = ({ size = 20, color = 'currentColor', sw = 1.75, fill = 'none', children }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={color}
    strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
    {children}
  </svg>
);
const VBack    = (p) => <VIco {...p}><path d="m15 18-6-6 6-6"/></VIco>;
const VCal     = (p) => <VIco {...p}><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></VIco>;
const VClock   = (p) => <VIco {...p}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></VIco>;
const VPin     = (p) => <VIco {...p}><path d="M20 10c0 7-8 12-8 12s-8-5-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></VIco>;
const VHands   = (p) => <VIco {...p}><path d="M11 14V5.5a1.5 1.5 0 1 1 3 0V12"/><path d="M14 11.5V4.5a1.5 1.5 0 1 1 3 0V13"/><path d="M17 12V6a1.5 1.5 0 1 1 3 0v9a6 6 0 0 1-6 6h-2c-2 0-3.5-1-5-2.5L4 16.5a2 2 0 0 1 2.83-2.83L8 14.83V7.5a1.5 1.5 0 1 1 3 0V12"/></VIco>;
const VStetho  = (p) => <VIco {...p}><path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6 6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"/><path d="M8 15v1a6 6 0 0 0 6 6 6 6 0 0 0 6-6v-4"/><circle cx="20" cy="10" r="2"/></VIco>;
const VSpec    = (p) => <VIco {...p}><circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 0 0-16 0"/></VIco>;
const VPill    = (p) => <VIco {...p}><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><path d="m8.5 8.5 7 7"/></VIco>;
const VHosp    = (p) => <VIco {...p}><path d="M12 6v4M10 8h4"/><rect x="3" y="6" width="18" height="15" rx="2"/><path d="M3 11h18M9 21V14h6v7"/></VIco>;
const VAlert   = (p) => <VIco {...p}><path d="M12 9v4M12 17h.01"/><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"/></VIco>;
const VPlus    = (p) => <VIco {...p}><path d="M5 12h14M12 5v14"/></VIco>;
const VMore    = (p) => <VIco {...p}><circle cx="12" cy="6" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="18" r="1.5"/></VIco>;
const VFilter  = (p) => <VIco {...p}><path d="M3 6h18M6 12h12M10 18h4"/></VIco>;
const VChev    = (p) => <VIco {...p}><path d="m9 18 6-6-6-6"/></VIco>;
const VCheck   = (p) => <VIco {...p}><path d="M20 6 9 17l-5-5"/></VIco>;
const VX       = (p) => <VIco {...p}><path d="M18 6 6 18M6 6l12 12"/></VIco>;
const VHourgl  = (p) => <VIco {...p}><path d="M5 22h14M5 2h14M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22M17 2v4.172a2 2 0 0 1-.586 1.414L12 12 7.586 7.586A2 2 0 0 1 7 6.172V2"/></VIco>;
const VPhone   = (p) => <VIco {...p}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.37 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.33 1.85.57 2.81.7A2 2 0 0 1 22 16.92Z"/></VIco>;
const VMsg     = (p) => <VIco {...p}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></VIco>;
const VTrash   = (p) => <VIco {...p}><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14ZM10 11v6M14 11v6"/></VIco>;
const VShare   = (p) => <VIco {...p}><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.59 13.51 6.83 3.98M15.41 6.51l-6.82 3.98"/></VIco>;
const VInfo    = (p) => <VIco {...p}><circle cx="12" cy="12" r="9"/><path d="M12 16v-4M12 8h.01"/></VIco>;
const VSparkle = (p) => <VIco {...p}><path d="M9.94 14.34 12 22l2.06-7.66L22 12l-7.94-2.34L12 2l-2.06 7.66L2 12l7.94 2.34Z"/></VIco>;

const TYPE_ICONS = {
  generaliste: VStetho, urgences: VAlert, specialiste: VSpec,
  pharmacie: VPill, hopital: VHosp,
};

// ── Helpers ─────────────────────────────────────────────────
function getInitials(name) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

function frDate({ wd, day, month }) {
  return `${wd} ${day} ${month}`;
}

// ── Données démo ────────────────────────────────────────────
const APPOINTMENTS = [
  {
    id: 'a1',
    type: 'specialiste',
    status: 'accepted',
    wd: 'jeudi', day: 22, month: 'mai',
    time: '14h30',
    location: 'Cabinet Dr. Lefèvre',
    address: '12 rue Pastorelli, 06000 Nice',
    interpName: 'Sophie Marchand',
    note: 'Consultation cardio · contrôle annuel',
  },
  {
    id: 'a2',
    type: 'generaliste',
    status: 'pending',
    wd: 'lundi', day: 26, month: 'mai',
    time: '09h00',
    location: 'Maison médicale Saint-Roch',
    address: '8 av. de la République, 06000 Nice',
    pendingCount: 3,
    note: 'Renouvellement ordonnance',
  },
  {
    id: 'a3',
    type: 'pharmacie',
    status: 'declined',
    wd: 'mardi', day: 27, month: 'mai',
    time: '11h00',
    location: 'Pharmacie du Port',
    address: '4 quai des Deux-Emmanuels, 06300 Nice',
    note: 'Conseil traitement chronique',
  },
];

const PAST_APPOINTMENTS = [
  {
    id: 'p1',
    type: 'urgences',
    status: 'accepted',
    wd: 'vendredi', day: 9, month: 'mai',
    time: '20h45',
    location: 'CHU Pasteur — Urgences',
    address: '30 voie Romaine, 06000 Nice',
    interpName: 'Karim Benali',
  },
  {
    id: 'p2',
    type: 'specialiste',
    status: 'cancelled',
    wd: 'mardi', day: 6, month: 'mai',
    time: '16h00',
    location: 'Dr. Hamidi — Dermatologie',
    address: '22 rue de France, 06000 Nice',
  },
];

// ── Tabs (Prochains / Historique) ───────────────────────────
function Tabs({ active, onChange, counts }) {
  const items = [
    { id: 'upcoming', label: 'Prochains',   count: counts.upcoming },
    { id: 'past',     label: 'Historique',  count: counts.past },
  ];
  return (
    <div style={{
      display: 'flex', gap: 4, padding: '6px',
      background: MV_BG, borderRadius: 14,
      border: `1px solid ${MV_BORDER}`,
    }}>
      {items.map(it => {
        const on = active === it.id;
        return (
          <button key={it.id} onClick={() => onChange(it.id)} style={{
            flex: 1, cursor: 'pointer', fontFamily: 'inherit',
            border: 0, borderRadius: 10,
            background: on ? MV_SURFACE : 'transparent',
            color: on ? MV_INK : MV_INK_2,
            padding: '9px 12px',
            fontSize: 13.5, fontWeight: 600, letterSpacing: '-0.005em',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            boxShadow: on ? '0 1px 3px rgba(15,27,45,0.08)' : 'none',
            transition: 'all .15s',
          }}>
            {it.label}
            <span style={{
              fontSize: 11, fontWeight: 700,
              padding: '1px 7px', borderRadius: 999,
              background: on ? MV_BRAND_TINT : MV_BORDER,
              color: on ? MV_BRAND : MV_INK_3,
              fontVariantNumeric: 'tabular-nums',
            }}>{it.count}</span>
          </button>
        );
      })}
    </div>
  );
}

// ── Status pill ─────────────────────────────────────────────
function StatusPill({ status, animated = false }) {
  const s = STATUS[status];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      fontSize: 11.5, fontWeight: 700, color: s.dark,
      background: s.tint, padding: '4px 10px', borderRadius: 999,
      letterSpacing: '0.005em',
    }}>
      <span style={{
        width: 7, height: 7, borderRadius: '50%', background: s.color,
        animation: animated ? 'mv-pulse 1.6s ease-in-out infinite' : 'none',
        flexShrink: 0,
      }}/>
      {s.label}
    </span>
  );
}

// ── Card RDV ────────────────────────────────────────────────
function RDVCard({ appt, onClick }) {
  const TypeIcon = TYPE_ICONS[appt.type] || VCal;
  const typeLabel = TYPES[appt.type]?.label || appt.type;
  const isAccepted = appt.status === 'accepted';
  const isPending = appt.status === 'pending';
  const isPast = appt.isPast;

  // Border accent par statut (sobre)
  const accentBorder =
    isAccepted ? '#A7F3D0' :
    isPending ? '#FCD34D' :
    appt.status === 'declined' ? '#FECACA' :
    MV_BORDER;

  return (
    <button onClick={onClick} style={{
      width: '100%', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit',
      background: MV_SURFACE,
      border: `1px solid ${accentBorder}`,
      borderRadius: 16, padding: 14,
      display: 'flex', flexDirection: 'column', gap: 10,
      opacity: isPast || appt.status === 'cancelled' ? 0.78 : 1,
      boxShadow: isAccepted
        ? '0 4px 16px -8px rgba(5,150,105,0.25), 0 1px 2px rgba(15,27,45,0.04)'
        : '0 1px 2px rgba(15,27,45,0.04)',
    }}>
      {/* Top row : type + status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: MV_BRAND_TINT, color: MV_BRAND,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <TypeIcon size={18} sw={2}/>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 11, fontWeight: 600, color: MV_INK_3,
            textTransform: 'uppercase', letterSpacing: '0.06em',
          }}>{typeLabel}</div>
          <div style={{
            fontSize: 14.5, fontWeight: 700, color: MV_INK, letterSpacing: '-0.01em',
            lineHeight: 1.25, marginTop: 1,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>{appt.location}</div>
        </div>
        <StatusPill status={appt.status} animated={isPending}/>
      </div>

      {/* Middle row : date + heure (chips) */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '5px 10px', borderRadius: 8,
          background: MV_BG, border: `1px solid ${MV_BORDER}`,
          fontSize: 12.5, fontWeight: 600, color: MV_INK,
        }}>
          <VCal size={13} sw={2} color={MV_INK_2}/>
          <span style={{ textTransform: 'capitalize' }}>{appt.wd} {appt.day} {appt.month}</span>
        </div>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '5px 10px', borderRadius: 8,
          background: MV_BG, border: `1px solid ${MV_BORDER}`,
          fontSize: 12.5, fontWeight: 600, color: MV_INK,
          fontVariantNumeric: 'tabular-nums',
        }}>
          <VClock size={13} sw={2} color={MV_INK_2}/>
          {appt.time}
        </div>
      </div>

      {/* Address */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', gap: 6,
        fontSize: 12, color: MV_INK_2, lineHeight: 1.4,
      }}>
        <VPin size={13} sw={2} color={MV_INK_3}/>
        <span style={{
          flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>{appt.address}</span>
      </div>

      {/* Footer : interprète assigné OU statut info */}
      {isAccepted && appt.interpName && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 12px',
          background: '#ECFDF5',
          border: '1px solid #A7F3D0',
          borderRadius: 12,
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: 10, flexShrink: 0,
            background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
            color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: 11, letterSpacing: '0.02em',
          }}>{getInitials(appt.interpName)}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 11, fontWeight: 700, color: '#065F46',
              textTransform: 'uppercase', letterSpacing: '0.06em',
            }}>Interprète confirmé</div>
            <div style={{
              fontSize: 13.5, fontWeight: 700, color: '#065F46',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>{appt.interpName}</div>
          </div>
          <div style={{
            display: 'flex', gap: 6,
          }}>
            <button aria-label="Appeler" style={{
              width: 32, height: 32, borderRadius: 10, border: 0, cursor: 'pointer',
              background: '#fff', color: '#065F46',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <VPhone size={14} sw={2}/>
            </button>
            <button aria-label="Message" style={{
              width: 32, height: 32, borderRadius: 10, border: 0, cursor: 'pointer',
              background: '#fff', color: '#065F46',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <VMsg size={14} sw={2}/>
            </button>
          </div>
        </div>
      )}

      {isPending && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '8px 12px',
          background: '#FFFBEB',
          border: '1px solid #FDE68A',
          borderRadius: 10,
          fontSize: 12, color: '#92400E', lineHeight: 1.4,
        }}>
          <VHourgl size={14} sw={2} color="#B45309"/>
          <span style={{ flex: 1 }}>
            Demande envoyée à <strong>{appt.pendingCount} interprètes</strong> · Réponse sous 2h
          </span>
        </div>
      )}

      {appt.status === 'declined' && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '8px 12px',
          background: '#FEF2F2',
          border: '1px solid #FECACA',
          borderRadius: 10,
          fontSize: 12, color: '#991B1B', lineHeight: 1.4,
        }}>
          <VInfo size={14} sw={2} color="#DC2626"/>
          <span style={{ flex: 1 }}>
            Aucun interprète disponible · <span style={{ fontWeight: 700, textDecoration: 'underline' }}>Reprogrammer</span>
          </span>
        </div>
      )}
    </button>
  );
}

// ── Section header ──────────────────────────────────────────
function SectionHeader({ title, count, accent = MV_BRAND }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12,
    }}>
      <div style={{
        fontSize: 15.5, fontWeight: 700, color: MV_INK,
        letterSpacing: '-0.01em', flex: 1,
      }}>{title}</div>
      <span style={{
        fontSize: 11, fontWeight: 700, color: accent,
        background: accent === MV_BRAND ? MV_BRAND_TINT : '#F1F5F9',
        padding: '3px 9px', borderRadius: 999,
        fontVariantNumeric: 'tabular-nums',
      }}>{count}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// VUE PRINCIPALE — LISTE DES RDV
// ─────────────────────────────────────────────────────────────
function MesRDVList({ tab: tabProp, onSelect, onNew }) {
  const [localTab, setLocalTab] = React.useState(tabProp || 'upcoming');
  const tab = tabProp || localTab;
  const setTab = tabProp ? () => {} : setLocalTab;

  React.useEffect(() => { if (tabProp) setLocalTab(tabProp); }, [tabProp]);

  const list = tab === 'upcoming' ? APPOINTMENTS : PAST_APPOINTMENTS.map(a => ({ ...a, isPast: true }));

  // Stats agrégées
  const pendingCount = APPOINTMENTS.filter(a => a.status === 'pending').length;
  const acceptedCount = APPOINTMENTS.filter(a => a.status === 'accepted').length;

  return (
    <div style={{
      width: '100%', height: '100%', background: MV_BG,
      fontFamily: '"Inter", -apple-system, system-ui, sans-serif',
      color: MV_INK, display: 'flex', flexDirection: 'column',
      WebkitFontSmoothing: 'antialiased',
    }}>
      {/* Header teal */}
      <div style={{
        background: MV_BRAND, color: '#fff',
        padding: '14px 20px 16px', position: 'relative', overflow: 'hidden',
        flexShrink: 0,
      }}>
        <div aria-hidden style={{
          position: 'absolute', top: -50, right: -40, width: 200, height: 200,
          borderRadius: '50%', background: 'rgba(255,255,255,0.06)',
        }}/>
        <div aria-hidden style={{
          position: 'absolute', top: 20, right: 60, width: 80, height: 80,
          borderRadius: '50%', background: 'rgba(255,255,255,0.04)',
        }}/>
        <div style={{
          position: 'relative', zIndex: 1,
          display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14,
        }}>
          <button aria-label="Retour" style={{
            width: 36, height: 36, borderRadius: 12, border: 0,
            background: 'rgba(255,255,255,0.16)', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          }}>
            <VBack size={18} sw={2.25}/>
          </button>
          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.78)',
              textTransform: 'uppercase', letterSpacing: '0.08em',
            }}>Mon dossier</div>
            <div style={{
              fontSize: 22, fontWeight: 700, marginTop: 2,
              letterSpacing: '-0.025em', lineHeight: 1.1,
            }}>Mes rendez-vous</div>
          </div>
          <button aria-label="Filtres" style={{
            width: 36, height: 36, borderRadius: 12, border: 0,
            background: 'rgba(255,255,255,0.16)', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          }}>
            <VFilter size={18} sw={2}/>
          </button>
        </div>

        {/* Mini-stats sur le header */}
        <div style={{
          position: 'relative', zIndex: 1,
          display: 'flex', gap: 8,
        }}>
          <div style={{
            flex: 1, padding: '10px 12px',
            background: 'rgba(255,255,255,0.14)',
            border: '1px solid rgba(255,255,255,0.18)',
            borderRadius: 12,
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <div style={{
              width: 30, height: 30, borderRadius: 8,
              background: 'rgba(255,255,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <VHourgl size={14} sw={2} color="#fff"/>
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
                {pendingCount}
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)', marginTop: 3 }}>
                En attente
              </div>
            </div>
          </div>
          <div style={{
            flex: 1, padding: '10px 12px',
            background: 'rgba(255,255,255,0.14)',
            border: '1px solid rgba(255,255,255,0.18)',
            borderRadius: 12,
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <div style={{
              width: 30, height: 30, borderRadius: 8,
              background: 'rgba(255,255,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <VCheck size={14} sw={2.25} color="#fff"/>
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
                {acceptedCount}
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)', marginTop: 3 }}>
                Confirmés
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs sticky */}
      <div style={{
        padding: '12px 20px', background: MV_BG,
        borderBottom: `1px solid ${MV_BORDER}`,
        flexShrink: 0,
      }}>
        <Tabs active={tab} onChange={setTab}
          counts={{ upcoming: APPOINTMENTS.length, past: PAST_APPOINTMENTS.length }}/>
      </div>

      {/* Liste */}
      <div style={{
        flex: 1, overflow: 'auto', padding: '14px 20px 100px',
      }}>
        {list.length === 0 ? (
          <EmptyState onAction={onNew}/>
        ) : (
          <React.Fragment>
            <SectionHeader title={tab === 'upcoming' ? 'À venir' : 'Historique'}
              count={list.length} accent={tab === 'upcoming' ? MV_BRAND : MV_INK_3}/>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {list.map(a => <RDVCard key={a.id} appt={a} onClick={() => onSelect && onSelect(a)}/>)}
            </div>
          </React.Fragment>
        )}
      </div>

      {/* FAB nouveau RDV */}
      <button onClick={onNew} aria-label="Nouveau rendez-vous" style={{
        position: 'absolute', bottom: 20, right: 20,
        height: 52, padding: '0 18px',
        borderRadius: 999, border: 0, cursor: 'pointer', fontFamily: 'inherit',
        background: MV_BRAND, color: '#fff',
        display: 'flex', alignItems: 'center', gap: 8,
        fontSize: 14, fontWeight: 700, letterSpacing: '-0.005em',
        boxShadow: '0 12px 28px -8px rgba(15,118,110,0.55), 0 4px 12px -4px rgba(15,118,110,0.4)',
      }}>
        <VPlus size={18} sw={2.5}/>
        Nouveau RDV
      </button>

      <style>{`
        @keyframes mv-pulse {
          0%,100% { opacity: 1; transform: scale(1); }
          50%     { opacity: 0.4; transform: scale(1.4); }
        }
      `}</style>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// VUE — DÉTAIL D'UN RDV
// ─────────────────────────────────────────────────────────────
function RDVDetail({ appt, onBack }) {
  const TypeIcon = TYPE_ICONS[appt.type] || VCal;
  const typeLabel = TYPES[appt.type]?.label || appt.type;
  const isAccepted = appt.status === 'accepted';
  const isPending = appt.status === 'pending';

  return (
    <div style={{
      width: '100%', height: '100%', background: MV_BG,
      fontFamily: '"Inter", -apple-system, system-ui, sans-serif',
      color: MV_INK, overflow: 'auto',
      WebkitFontSmoothing: 'antialiased',
    }}>
      {/* Header */}
      <div style={{
        background: MV_BRAND, color: '#fff',
        padding: '14px 20px 36px', position: 'relative', overflow: 'hidden',
      }}>
        <div aria-hidden style={{
          position: 'absolute', top: -60, right: -40, width: 240, height: 240,
          borderRadius: '50%', background: 'rgba(255,255,255,0.07)',
        }}/>
        <div style={{
          position: 'relative', zIndex: 1,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 18,
        }}>
          <button onClick={onBack} aria-label="Retour" style={{
            width: 36, height: 36, borderRadius: 12, border: 0,
            background: 'rgba(255,255,255,0.16)', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          }}>
            <VBack size={18} sw={2.25}/>
          </button>
          <div style={{
            fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.78)',
            textTransform: 'uppercase', letterSpacing: '0.08em',
          }}>Détail du rendez-vous</div>
          <button aria-label="Plus d'options" style={{
            width: 36, height: 36, borderRadius: 12, border: 0,
            background: 'rgba(255,255,255,0.16)', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          }}>
            <VMore size={18} sw={2.5}/>
          </button>
        </div>

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '4px 10px', borderRadius: 999,
            background: 'rgba(255,255,255,0.18)',
            fontSize: 11.5, fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.06em',
            marginBottom: 10,
          }}>
            <TypeIcon size={13} sw={2.25} color="#fff"/>
            {typeLabel}
          </div>
          <div style={{
            fontSize: 24, fontWeight: 700, letterSpacing: '-0.025em', lineHeight: 1.15,
          }}>{appt.location}</div>
          <div style={{
            fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 4,
          }}>{appt.address}</div>
        </div>
      </div>

      {/* Status card */}
      <div style={{
        margin: '-22px 20px 0', position: 'relative',
        background: MV_SURFACE, border: `1px solid ${MV_BORDER}`,
        borderRadius: 18, padding: 16,
        boxShadow: '0 12px 32px -16px rgba(15,27,45,0.18), 0 1px 2px rgba(15,27,45,0.04)',
        display: 'flex', flexDirection: 'column', gap: 14,
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <StatusPill status={appt.status} animated={isPending}/>
          {isAccepted && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              fontSize: 11, fontWeight: 600, color: MV_INK_3,
            }}>
              <VSparkle size={12} sw={2} color="#F59E0B"/> Tout est prêt
            </span>
          )}
        </div>

        {/* Date / Heure (gros) */}
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{
            flex: 1, padding: 14,
            background: MV_BG, borderRadius: 14,
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: MV_INK_3,
              textTransform: 'uppercase', letterSpacing: '0.06em' }}>Date</div>
            <div style={{
              fontSize: 18, fontWeight: 700, color: MV_INK, marginTop: 4,
              letterSpacing: '-0.02em', textTransform: 'capitalize',
              fontVariantNumeric: 'tabular-nums',
            }}>{appt.wd} {appt.day}</div>
            <div style={{ fontSize: 12.5, color: MV_INK_2, marginTop: 1, textTransform: 'capitalize' }}>
              {appt.month} 2025
            </div>
          </div>
          <div style={{
            flex: 1, padding: 14,
            background: MV_BG, borderRadius: 14,
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: MV_INK_3,
              textTransform: 'uppercase', letterSpacing: '0.06em' }}>Heure</div>
            <div style={{
              fontSize: 18, fontWeight: 700, color: MV_INK, marginTop: 4,
              letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums',
            }}>{appt.time}</div>
            <div style={{ fontSize: 12.5, color: MV_INK_2, marginTop: 1 }}>
              Durée prévue 1h
            </div>
          </div>
        </div>

        {/* Note */}
        {appt.note && (
          <div style={{
            display: 'flex', gap: 10,
            padding: '10px 12px',
            background: MV_BRAND_TINT, borderRadius: 12,
            fontSize: 12.5, color: MV_BRAND_DARK, lineHeight: 1.4,
          }}>
            <VInfo size={14} sw={2} color={MV_BRAND}/>
            <span style={{ flex: 1, fontWeight: 500 }}>{appt.note}</span>
          </div>
        )}
      </div>

      {/* Interprète */}
      <div style={{ padding: '20px 20px 0' }}>
        <div style={{
          fontSize: 11, fontWeight: 700, color: MV_INK_3,
          textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10,
        }}>Interprète LSF</div>

        {isAccepted && appt.interpName ? (
          <div style={{
            background: MV_SURFACE, border: '1px solid #A7F3D0',
            borderRadius: 16, padding: 14,
            display: 'flex', flexDirection: 'column', gap: 12,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 50, height: 50, borderRadius: 16,
                background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: 16, letterSpacing: '0.02em',
                boxShadow: '0 4px 12px -4px rgba(5,150,105,0.4)',
              }}>{getInitials(appt.interpName)}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 15, fontWeight: 700, color: MV_INK, letterSpacing: '-0.01em',
                }}>{appt.interpName}</div>
                <div style={{ fontSize: 12.5, color: MV_INK_2, marginTop: 2 }}>
                  Interprète LSF agréée · 8 ans d'exp.
                </div>
              </div>
              <span style={{
                fontSize: 11, fontWeight: 700, color: '#065F46',
                background: '#D1FADF', padding: '4px 10px', borderRadius: 999,
              }}>★ 4,9</span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button style={{
                flex: 1, border: '1px solid #A7F3D0', cursor: 'pointer',
                background: '#ECFDF5', color: '#065F46',
                borderRadius: 12, padding: '10px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                fontFamily: 'inherit', fontSize: 13, fontWeight: 600,
              }}>
                <VPhone size={14} sw={2}/> Appeler
              </button>
              <button style={{
                flex: 1, border: '1px solid #A7F3D0', cursor: 'pointer',
                background: '#ECFDF5', color: '#065F46',
                borderRadius: 12, padding: '10px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                fontFamily: 'inherit', fontSize: 13, fontWeight: 600,
              }}>
                <VMsg size={14} sw={2}/> Message
              </button>
            </div>
          </div>
        ) : isPending ? (
          <div style={{
            background: '#FFFBEB', border: '1px solid #FDE68A',
            borderRadius: 16, padding: 16,
            display: 'flex', gap: 12, alignItems: 'center',
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 14,
              background: 'rgba(180,83,9,0.12)', color: '#B45309',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <VHourgl size={20} sw={2}/>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: '#92400E', letterSpacing: '-0.005em' }}>
                Recherche en cours…
              </div>
              <div style={{ fontSize: 12.5, color: '#92400E', marginTop: 3, lineHeight: 1.4 }}>
                Demande envoyée à <strong>{appt.pendingCount} interprètes proches</strong>.
                Vous recevrez une notification dès qu'un interprète accepte.
              </div>
            </div>
          </div>
        ) : (
          <div style={{
            background: '#FEF2F2', border: '1px solid #FECACA',
            borderRadius: 16, padding: 16,
          }}>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: '#991B1B' }}>
              Aucun interprète disponible
            </div>
            <div style={{ fontSize: 12.5, color: '#991B1B', marginTop: 4, lineHeight: 1.4 }}>
              Les interprètes proches n'ont pas pu accepter votre demande. Essayez un autre créneau.
            </div>
          </div>
        )}
      </div>

      {/* Actions secondaires */}
      <div style={{ padding: '16px 20px 24px' }}>
        <div style={{
          fontSize: 11, fontWeight: 700, color: MV_INK_3,
          textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10,
        }}>Actions</div>
        <div style={{
          background: MV_SURFACE, border: `1px solid ${MV_BORDER}`,
          borderRadius: 14, overflow: 'hidden',
        }}>
          {[
            { icon: VPin,   label: 'Voir l\'itinéraire', sub: 'Ouvre Plans' },
            { icon: VShare, label: 'Partager le RDV',   sub: 'Avec un proche' },
            { icon: VCal,   label: 'Ajouter au calendrier', sub: 'iOS / Google' },
            ...(isAccepted || isPending ? [
              { icon: VTrash, label: 'Annuler le rendez-vous', sub: 'Plus de 24h à l\'avance', danger: true },
            ] : []),
          ].map((it, i, arr) => (
            <button key={it.label} style={{
              width: '100%', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit',
              border: 0, background: 'transparent',
              padding: '12px 14px',
              display: 'flex', alignItems: 'center', gap: 12,
              borderBottom: i < arr.length - 1 ? `1px solid ${MV_BORDER}` : 'none',
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: 10,
                background: it.danger ? '#FEE7E7' : MV_BG,
                color: it.danger ? '#DC2626' : MV_INK_2,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <it.icon size={15} sw={2}/>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: 13.5, fontWeight: 600,
                  color: it.danger ? '#DC2626' : MV_INK, letterSpacing: '-0.005em',
                }}>{it.label}</div>
                <div style={{ fontSize: 11.5, color: MV_INK_3, marginTop: 1 }}>{it.sub}</div>
              </div>
              <VChev size={14} color={MV_INK_3} sw={2}/>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// VUE — ÉTAT VIDE
// ─────────────────────────────────────────────────────────────
function EmptyState({ onAction }) {
  return (
    <div style={{
      width: '100%', minHeight: '100%',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '40px 24px', textAlign: 'center', gap: 8,
    }}>
      {/* Illustration : calendrier stylisé avec icône check teal */}
      <div style={{
        width: 132, height: 132,
        marginBottom: 14, position: 'relative',
      }}>
        {/* halo */}
        <div style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(15,118,110,0.10) 0%, transparent 70%)',
        }}/>
        <div style={{
          position: 'absolute', inset: '14px',
          background: MV_BRAND_TINT, borderRadius: 28,
          border: `1.5px solid ${MV_BRAND}`, opacity: 0.4,
        }}/>
        <div style={{
          position: 'absolute', inset: '24px',
          background: '#fff', borderRadius: 22,
          border: `1.5px solid ${MV_BORDER}`,
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 8px 24px -8px rgba(15,118,110,0.25)',
        }}>
          <div style={{
            height: 22, background: MV_BRAND,
            display: 'flex', alignItems: 'center', justifyContent: 'space-around',
          }}>
            {[0,1,2].map(i => <div key={i} style={{
              width: 4, height: 8, background: '#fff', borderRadius: 2, opacity: 0.6,
            }}/>)}
          </div>
          <div style={{
            flex: 1, padding: 6,
            display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 3,
          }}>
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} style={{
                background: i === 6 ? MV_BRAND : MV_BG, borderRadius: 3,
              }}/>
            ))}
          </div>
        </div>
        {/* badge plus en surimpression */}
        <div style={{
          position: 'absolute', top: 6, right: 0,
          width: 38, height: 38, borderRadius: '50%',
          background: '#fff', border: `2px solid ${MV_BRAND}`,
          color: MV_BRAND,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 12px -4px rgba(15,118,110,0.4)',
        }}>
          <VPlus size={20} sw={2.5}/>
        </div>
      </div>

      <div style={{
        fontSize: 19, fontWeight: 700, color: MV_INK, letterSpacing: '-0.02em',
      }}>Aucun rendez-vous pour l'instant</div>
      <div style={{
        fontSize: 13.5, color: MV_INK_2, lineHeight: 1.5,
        maxWidth: 280,
      }}>
        Vos demandes de RDV avec interprète apparaîtront ici, avec leur statut en temps réel.
      </div>

      <button onClick={onAction} style={{
        marginTop: 16, border: 0, cursor: 'pointer', fontFamily: 'inherit',
        background: MV_BRAND, color: '#fff',
        borderRadius: 14, padding: '14px 24px',
        display: 'flex', alignItems: 'center', gap: 8,
        fontSize: 14, fontWeight: 700, letterSpacing: '-0.005em',
        boxShadow: '0 8px 24px -8px rgba(15,118,110,0.5)',
      }}>
        <VPlus size={16} sw={2.5}/>
        Prendre un premier RDV
      </button>

      <div style={{
        marginTop: 24,
        display: 'flex', alignItems: 'center', gap: 8,
        fontSize: 12, color: MV_INK_3,
      }}>
        <VCheck size={13} sw={2.5} color={MV_BRAND}/>
        Service gratuit · Réponse sous 2h en moyenne
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// CONTAINER
// ─────────────────────────────────────────────────────────────
function MesRDVFlow({ view = 'list', tab = 'upcoming' }) {
  const [v, setV] = React.useState(view);
  const [selected, setSelected] = React.useState(APPOINTMENTS[0]);

  React.useEffect(() => { setV(view); }, [view]);

  if (v === 'detail') {
    return <RDVDetail appt={selected} onBack={() => setV('list')}/>;
  }
  if (v === 'empty') {
    return (
      <div style={{
        width: '100%', height: '100%', background: MV_BG,
        fontFamily: '"Inter", -apple-system, system-ui, sans-serif',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Header simple */}
        <div style={{
          background: MV_BRAND, color: '#fff',
          padding: '14px 20px 16px', position: 'relative', overflow: 'hidden',
        }}>
          <div aria-hidden style={{
            position: 'absolute', top: -50, right: -40, width: 200, height: 200,
            borderRadius: '50%', background: 'rgba(255,255,255,0.06)',
          }}/>
          <div style={{
            position: 'relative', zIndex: 1,
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <button aria-label="Retour" style={{
              width: 36, height: 36, borderRadius: 12, border: 0,
              background: 'rgba(255,255,255,0.16)', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            }}>
              <VBack size={18} sw={2.25}/>
            </button>
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.78)',
                textTransform: 'uppercase', letterSpacing: '0.08em',
              }}>Mon dossier</div>
              <div style={{
                fontSize: 22, fontWeight: 700, marginTop: 2, letterSpacing: '-0.025em', lineHeight: 1.1,
              }}>Mes rendez-vous</div>
            </div>
          </div>
        </div>
        <div style={{ flex: 1, overflow: 'auto' }}>
          <EmptyState onAction={() => {}}/>
        </div>
      </div>
    );
  }
  return (
    <MesRDVList tab={tab}
      onSelect={(a) => { setSelected(a); setV('detail'); }}
      onNew={() => {}}/>
  );
}

window.MesRDVFlow = MesRDVFlow;
window.MesRDVList = MesRDVList;
window.MesRDVDetail = RDVDetail;
window.MesRDVEmpty = EmptyState;
window.MV_APPOINTMENTS = APPOINTMENTS;
