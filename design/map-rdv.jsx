// MapRDV — écran Carte + Détail interprète + Prise de RDV (rôle Sourd)
// Reprend exactement le langage visuel de HomeSourd / AuthScreens :
// teal #0F766E, ink #0F1B2D, surfaces F6F8FA / FFFFFF, icônes Lucide-style.

const MR_BRAND = '#0F766E';
const MR_BRAND_DARK = '#0B5F58';
const MR_BRAND_TINT = '#E8F4F2';
const MR_INK = '#0F1B2D';
const MR_INK_2 = '#475569';
const MR_INK_3 = '#94A3B8';
const MR_SURFACE = '#FFFFFF';
const MR_BG = '#F6F8FA';
const MR_BORDER = '#E5EAF0';
const MR_AMBER = '#B45309';
const MR_AMBER_BG = '#FEF3C7';

// Couleurs par catégorie (filtres + marqueurs carte)
const CAT = {
  interp:   { color: '#0F766E', tint: '#E8F4F2', label: 'Interprètes' },
  hospital: { color: '#DC2626', tint: '#FEE7E7', label: 'Hôpitaux' },
  pharmacy: { color: '#059669', tint: '#D1FADF', label: 'Pharmacies' },
  doctor:   { color: '#2563EB', tint: '#DBEAFE', label: 'Médecins' },
  special:  { color: '#EA580C', tint: '#FFEDD5', label: 'Spécialistes' },
};

// Statut interprète
const ST = {
  available: { color: '#0F766E', tint: '#E8F4F2', label: 'Disponible' },
  enroute:   { color: '#B45309', tint: '#FEF3C7', label: 'En déplacement' },
  busy:      { color: '#DC2626', tint: '#FEE7E7', label: 'Occupé' },
};

// ── Icons (Lucide-style 1.75) ───────────────────────────────
const MIco = ({ size = 20, color = 'currentColor', sw = 1.75, fill = 'none', children }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={color}
    strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
    {children}
  </svg>
);
const IBack    = (p) => <MIco {...p}><path d="m15 18-6-6 6-6"/></MIco>;
const ISearch  = (p) => <MIco {...p}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></MIco>;
const IPin     = (p) => <MIco {...p}><path d="M20 10c0 7-8 12-8 12s-8-5-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></MIco>;
const IHands2  = (p) => <MIco {...p}><path d="M11 14V5.5a1.5 1.5 0 1 1 3 0V12"/><path d="M14 11.5V4.5a1.5 1.5 0 1 1 3 0V13"/><path d="M17 12V6a1.5 1.5 0 1 1 3 0v9a6 6 0 0 1-6 6h-2c-2 0-3.5-1-5-2.5L4 16.5a2 2 0 0 1 2.83-2.83L8 14.83V7.5a1.5 1.5 0 1 1 3 0V12"/></MIco>;
const IHosp    = (p) => <MIco {...p}><path d="M12 6v4M10 8h4"/><rect x="3" y="6" width="18" height="15" rx="2"/><path d="M3 11h18M9 21V14h6v7"/></MIco>;
const IPill    = (p) => <MIco {...p}><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><path d="m8.5 8.5 7 7"/></MIco>;
const IStetho  = (p) => <MIco {...p}><path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6 6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"/><path d="M8 15v1a6 6 0 0 0 6 6 6 6 0 0 0 6-6v-4"/><circle cx="20" cy="10" r="2"/></MIco>;
const ISpec    = (p) => <MIco {...p}><circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 0 0-16 0"/></MIco>;
const ITarget  = (p) => <MIco {...p}><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/></MIco>;
const IPlus    = (p) => <MIco {...p}><path d="M5 12h14M12 5v14"/></MIco>;
const IMinus   = (p) => <MIco {...p}><path d="M5 12h14"/></MIco>;
const ILayers  = (p) => <MIco {...p}><path d="m12 2 9 5-9 5-9-5 9-5Z"/><path d="m3 12 9 5 9-5"/><path d="m3 17 9 5 9-5"/></MIco>;
const IClose   = (p) => <MIco {...p}><path d="M18 6 6 18M6 6l12 12"/></MIco>;
const IPhone   = (p) => <MIco {...p}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.37 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.33 1.85.57 2.81.7A2 2 0 0 1 22 16.92Z"/></MIco>;
const IClock   = (p) => <MIco {...p}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></MIco>;
const IStar    = (p) => <MIco {...p} fill="currentColor"><path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2Z"/></MIco>;
const ICalSm   = (p) => <MIco {...p}><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></MIco>;
const IChev    = (p) => <MIco {...p}><path d="m9 18 6-6-6-6"/></MIco>;
const ICheck2  = (p) => <MIco {...p}><path d="M20 6 9 17l-5-5"/></MIco>;
const IInfo    = (p) => <MIco {...p}><circle cx="12" cy="12" r="9"/><path d="M12 16v-4M12 8h.01"/></MIco>;
const IFilter  = (p) => <MIco {...p}><path d="M3 6h18M6 12h12M10 18h4"/></MIco>;

// ── Avatar avec initiales ───────────────────────────────────
function getInitials(name) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

// ── Fake data ───────────────────────────────────────────────
const INTERPRETES = [
  { id: 'i1', name: 'Sophie Marchand', spec: 'Médical général',  status: 'available', distance: 0.4, rating: 4.9, exp: 8 },
  { id: 'i2', name: 'Karim Benali',    spec: 'Urgences · Pédiatrie', status: 'available', distance: 0.9, rating: 4.8, exp: 6 },
  { id: 'i3', name: 'Léa Rousseau',    spec: 'Cardio · Gynécologie', status: 'enroute', distance: 1.2, rating: 4.9, exp: 11 },
  { id: 'i4', name: 'Marc Dupont',     spec: 'Médical général',  status: 'busy', distance: 1.8, rating: 4.7, exp: 5 },
];

// Marqueurs sur la carte stylisée — positions en % (relatif au cadre carte)
const MAP_MARKERS = [
  { id: 'i1', cat: 'interp',   x: 32, y: 38, label: 'SM' },
  { id: 'i2', cat: 'interp',   x: 58, y: 28, label: 'KB' },
  { id: 'i3', cat: 'interp',   x: 72, y: 56, label: 'LR' },
  { id: 'i4', cat: 'interp',   x: 22, y: 66, label: 'MD' },
  { id: 'h1', cat: 'hospital', x: 48, y: 18 },
  { id: 'h2', cat: 'hospital', x: 80, y: 70 },
  { id: 'p1', cat: 'pharmacy', x: 42, y: 50 },
  { id: 'p2', cat: 'pharmacy', x: 65, y: 78 },
  { id: 'p3', cat: 'pharmacy', x: 12, y: 42 },
  { id: 'd1', cat: 'doctor',   x: 55, y: 42 },
  { id: 'd2', cat: 'doctor',   x: 28, y: 24 },
  { id: 's1', cat: 'special',  x: 88, y: 32 },
];

// ── Carte stylisée (SVG) ────────────────────────────────────
function StyledMap({ activeCat, onMarkerClick, selectedId }) {
  return (
    <div style={{
      position: 'absolute', inset: 0, overflow: 'hidden',
      background: '#E6EEF1',
    }}>
      {/* Background pattern — rues + parcs */}
      <svg width="100%" height="100%" viewBox="0 0 400 400" preserveAspectRatio="xMidYMid slice"
        style={{ position: 'absolute', inset: 0 }}>
        <defs>
          <pattern id="streets" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
            <rect width="80" height="80" fill="#EAF1F3"/>
          </pattern>
        </defs>
        <rect width="400" height="400" fill="url(#streets)"/>

        {/* Mer (côte) */}
        <path d="M0 320 Q 100 305 200 312 T 400 305 L 400 400 L 0 400 Z" fill="#BFD8E0"/>
        <path d="M0 340 Q 120 328 220 333 T 400 326 L 400 400 L 0 400 Z" fill="#A9C8D2"/>

        {/* Parcs */}
        <ellipse cx="120" cy="100" rx="55" ry="35" fill="#CDE3CC"/>
        <ellipse cx="320" cy="160" rx="40" ry="28" fill="#CDE3CC"/>

        {/* Rues principales */}
        <g stroke="#fff" strokeWidth="6" fill="none" opacity="0.95">
          <path d="M0 200 L 400 180"/>
          <path d="M200 0 L 220 400"/>
          <path d="M0 280 Q 200 270 400 280"/>
        </g>
        <g stroke="#fff" strokeWidth="3" fill="none" opacity="0.85">
          <path d="M0 130 L 400 110"/>
          <path d="M0 250 L 400 240"/>
          <path d="M100 0 L 110 400"/>
          <path d="M300 0 L 320 400"/>
          <path d="M50 0 L 60 320"/>
        </g>
        <g stroke="#fff" strokeWidth="1.5" fill="none" opacity="0.7">
          <path d="M0 60 L 400 48"/>
          <path d="M0 160 L 400 150"/>
          <path d="M0 220 L 400 210"/>
          <path d="M150 0 L 160 320"/>
          <path d="M250 0 L 260 320"/>
          <path d="M350 0 L 360 320"/>
        </g>

        {/* Étiquette zone */}
        <text x="200" y="362" fontSize="11" fill="#5C7A85" fontWeight="600"
          fontFamily="Inter, system-ui" textAnchor="middle" letterSpacing="0.08em">
          BAIE DES ANGES
        </text>
        <text x="120" y="105" fontSize="9" fill="#4F7B4D" fontWeight="600"
          fontFamily="Inter, system-ui" textAnchor="middle" letterSpacing="0.05em">
          PARC IMPÉRIAL
        </text>
      </svg>

      {/* Marqueurs */}
      {MAP_MARKERS.filter(m => activeCat[m.cat]).map(m => {
        const c = CAT[m.cat];
        const isInterp = m.cat === 'interp';
        const sel = selectedId === m.id;
        const size = isInterp ? 38 : 30;
        return (
          <button key={m.id}
            onClick={() => onMarkerClick && onMarkerClick(m)}
            style={{
              position: 'absolute', left: `${m.x}%`, top: `${m.y}%`,
              transform: `translate(-50%, -100%) scale(${sel ? 1.15 : 1})`,
              width: size, height: size,
              border: 0, padding: 0, background: 'transparent', cursor: 'pointer',
              transition: 'transform .15s', zIndex: sel ? 5 : 2,
            }}>
            {/* drop shadow */}
            <div style={{
              position: 'absolute', bottom: -4, left: '50%', transform: 'translateX(-50%)',
              width: size * 0.5, height: 4, borderRadius: '50%',
              background: 'rgba(0,0,0,0.18)', filter: 'blur(2px)',
            }}/>
            {/* pin */}
            <div style={{
              position: 'absolute', inset: 0,
              background: '#fff', borderRadius: '50% 50% 50% 8%',
              transform: 'rotate(-45deg)',
              border: `2.5px solid ${c.color}`,
              boxShadow: '0 2px 6px rgba(0,0,0,0.18)',
            }}>
              <div style={{
                position: 'absolute', inset: 3, transform: 'rotate(45deg)',
                background: c.color, borderRadius: '50%',
                color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'Inter, system-ui', fontSize: 10, fontWeight: 800,
                letterSpacing: '0.02em',
              }}>
                {isInterp ? m.label : (
                  m.cat === 'hospital' ? <IHosp size={14} sw={2.5} color="#fff"/>
                  : m.cat === 'pharmacy' ? <IPlus size={14} sw={3} color="#fff"/>
                  : m.cat === 'doctor' ? <IStetho size={13} sw={2.5} color="#fff"/>
                  : <ISpec size={13} sw={2.5} color="#fff"/>
                )}
              </div>
            </div>
          </button>
        );
      })}

      {/* User location dot (centre, fixe) */}
      <div style={{
        position: 'absolute', left: '46%', top: '60%',
        transform: 'translate(-50%, -50%)', zIndex: 3,
      }}>
        <div style={{
          position: 'absolute', inset: -12, borderRadius: '50%',
          background: '#3B82F6', opacity: 0.18,
          animation: 'mr-pulse 1.8s ease-out infinite',
        }}/>
        <div style={{
          width: 16, height: 16, borderRadius: '50%',
          background: '#3B82F6', border: '3px solid #fff',
          boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
        }}/>
      </div>

      <style>{`
        @keyframes mr-pulse {
          0%   { transform: scale(1);   opacity: 0.4; }
          100% { transform: scale(2.2); opacity: 0;   }
        }
      `}</style>
    </div>
  );
}

// ── Filtres horizontaux ─────────────────────────────────────
function FilterPills({ active, onToggle }) {
  const items = [
    { id: 'interp',   icon: IHands2, ...CAT.interp },
    { id: 'hospital', icon: IHosp,   ...CAT.hospital },
    { id: 'pharmacy', icon: IPlus,   ...CAT.pharmacy },
    { id: 'doctor',   icon: IStetho, ...CAT.doctor },
    { id: 'special',  icon: ISpec,   ...CAT.special },
  ];
  return (
    <div style={{
      display: 'flex', gap: 8, padding: '14px 20px',
      overflowX: 'auto', background: MR_SURFACE,
      borderBottom: `1px solid ${MR_BORDER}`,
    }}>
      {items.map(it => {
        const on = active[it.id];
        const Icon = it.icon;
        return (
          <button key={it.id}
            onClick={() => onToggle(it.id)}
            style={{
              flexShrink: 0,
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 12px',
              borderRadius: 999,
              border: `1.5px solid ${on ? it.color : MR_BORDER}`,
              background: on ? it.color : MR_SURFACE,
              color: on ? '#fff' : MR_INK_2,
              cursor: 'pointer',
              fontFamily: 'inherit', fontSize: 13, fontWeight: 600,
              letterSpacing: '-0.005em',
              transition: 'all .15s',
            }}>
            <Icon size={14} sw={2.25}/>
            {it.label}
          </button>
        );
      })}
    </div>
  );
}

// ── Liste interprètes (en-dessous de la carte) ─────────────
function InterpreteCard({ interp, onClick }) {
  const st = ST[interp.status];
  return (
    <button onClick={onClick} style={{
      width: '100%', textAlign: 'left', cursor: 'pointer',
      background: MR_SURFACE, border: `1px solid ${MR_BORDER}`,
      borderRadius: 16, padding: 14,
      display: 'flex', alignItems: 'center', gap: 12,
    }}>
      {/* Avatar */}
      <div style={{
        width: 46, height: 46, borderRadius: 14, flexShrink: 0,
        background: `linear-gradient(135deg, ${st.color} 0%, ${st.color}cc 100%)`,
        color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 700, fontSize: 14, letterSpacing: '0.02em',
        boxShadow: `0 4px 12px -4px ${st.color}66`,
      }}>{getInitials(interp.name)}</div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 14.5, fontWeight: 700, color: MR_INK, letterSpacing: '-0.01em' }}>
            {interp.name}
          </span>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            fontSize: 11, fontWeight: 700, color: st.color,
            background: st.tint, padding: '2px 8px', borderRadius: 999,
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: '50%', background: st.color,
            }}/>
            {st.label}
          </span>
        </div>
        <div style={{ fontSize: 12.5, color: MR_INK_2, marginTop: 2 }}>
          {interp.spec}
        </div>
        <div style={{
          display: 'flex', gap: 12, marginTop: 6,
          fontSize: 12, color: MR_INK_3, fontVariantNumeric: 'tabular-nums',
        }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <IPin size={12} sw={2}/> {interp.distance} km
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <IStar size={12} color="#F59E0B"/> {interp.rating}
          </span>
          <span>{interp.exp} ans d'exp.</span>
        </div>
      </div>

      <IChev size={16} color={MR_INK_3} sw={2}/>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// VUE 1 — CARTE
// ─────────────────────────────────────────────────────────────
function MapScreen({ onSelectInterp }) {
  const [active, setActive] = React.useState({
    interp: true, hospital: true, pharmacy: true, doctor: true, special: false,
  });
  const [selectedMarker, setSelectedMarker] = React.useState(null);

  const toggle = (id) => setActive(a => ({ ...a, [id]: !a[id] }));

  return (
    <div style={{
      width: '100%', height: '100%', background: MR_BG,
      fontFamily: '"Inter", -apple-system, system-ui, sans-serif',
      color: MR_INK, display: 'flex', flexDirection: 'column',
      WebkitFontSmoothing: 'antialiased',
    }}>
      {/* ── Header teal ─────────────────────────────────── */}
      <div style={{
        background: MR_BRAND, color: '#fff',
        padding: '14px 20px 16px',
        position: 'relative', overflow: 'hidden',
      }}>
        <div aria-hidden style={{
          position: 'absolute', top: -40, right: -30, width: 160, height: 160,
          borderRadius: '50%', background: 'rgba(255,255,255,0.06)',
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
            <IBack size={18} sw={2.25}/>
          </button>
          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: 11, fontWeight: 600,
              color: 'rgba(255,255,255,0.78)',
              textTransform: 'uppercase', letterSpacing: '0.08em',
            }}>Carte</div>
            <div style={{
              fontSize: 20, fontWeight: 700, marginTop: 2,
              letterSpacing: '-0.02em', lineHeight: 1.1,
            }}>Nice — autour de moi</div>
          </div>
          <button aria-label="Filtres" style={{
            width: 36, height: 36, borderRadius: 12, border: 0,
            background: 'rgba(255,255,255,0.16)', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          }}>
            <IFilter size={18} sw={2}/>
          </button>
        </div>

        {/* Search bar */}
        <div style={{
          position: 'relative', zIndex: 1,
          background: '#fff', borderRadius: 12,
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 14px',
          boxShadow: '0 4px 16px -4px rgba(0,0,0,0.15)',
        }}>
          <ISearch size={18} color={MR_INK_3} sw={2}/>
          <input placeholder="Adresse, hôpital, pharmacie…"
            style={{
              flex: 1, border: 0, outline: 0, fontFamily: 'inherit',
              fontSize: 14, color: MR_INK, background: 'transparent',
            }}/>
        </div>
      </div>

      {/* ── Filtres ──────────────────────────────────────── */}
      <FilterPills active={active} onToggle={toggle}/>

      {/* ── Carte ───────────────────────────────────────── */}
      <div style={{ position: 'relative', height: 280, flexShrink: 0 }}>
        <StyledMap
          activeCat={active}
          selectedId={selectedMarker}
          onMarkerClick={(m) => {
            setSelectedMarker(m.id);
            if (m.cat === 'interp') {
              const interp = INTERPRETES.find(i => i.id === m.id);
              if (interp) onSelectInterp && onSelectInterp(interp);
            }
          }}
        />

        {/* Map controls */}
        <div style={{
          position: 'absolute', top: 12, right: 12,
          display: 'flex', flexDirection: 'column', gap: 6,
        }}>
          {[ILayers].map((Icon, i) => (
            <button key={i} style={{
              width: 36, height: 36, borderRadius: 10, border: 0,
              background: '#fff', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.12)', color: MR_INK_2,
            }}>
              <Icon size={16} sw={2}/>
            </button>
          ))}
        </div>
        <div style={{
          position: 'absolute', bottom: 12, right: 12,
          display: 'flex', flexDirection: 'column',
          background: '#fff', borderRadius: 10,
          boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
        }}>
          <button style={{
            width: 36, height: 36, border: 0, background: 'transparent', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: MR_INK_2, borderBottom: `1px solid ${MR_BORDER}`,
          }}><IPlus size={16} sw={2.5}/></button>
          <button style={{
            width: 36, height: 36, border: 0, background: 'transparent', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: MR_INK_2,
          }}><IMinus size={16} sw={2.5}/></button>
        </div>
        <button style={{
          position: 'absolute', bottom: 12, left: 12,
          width: 40, height: 40, borderRadius: 12, border: 0,
          background: MR_BRAND, color: '#fff', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(15,118,110,0.4)',
        }}>
          <ITarget size={18} sw={2}/>
        </button>

        {/* Légende compteur */}
        <div style={{
          position: 'absolute', bottom: 12, left: 60,
          background: '#fff', borderRadius: 999,
          padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6,
          boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
          fontSize: 12, fontWeight: 600, color: MR_INK_2,
        }}>
          <span style={{
            width: 7, height: 7, borderRadius: '50%', background: MR_BRAND,
          }}/>
          {INTERPRETES.filter(i => i.status !== 'busy').length} interprètes dispo
        </div>
      </div>

      {/* ── Liste résultats ────────────────────────────── */}
      <div style={{
        flex: 1, overflow: 'auto', background: MR_BG,
        padding: '16px 20px 24px',
      }}>
        <div style={{
          display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
          marginBottom: 12,
        }}>
          <div style={{ fontSize: 15.5, fontWeight: 700, color: MR_INK, letterSpacing: '-0.01em' }}>
            Interprètes proches
          </div>
          <div style={{ fontSize: 12, color: MR_INK_3, fontWeight: 500 }}>
            {INTERPRETES.length} résultats · trié par distance
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {INTERPRETES.map(i => (
            <InterpreteCard key={i.id} interp={i} onClick={() => onSelectInterp(i)}/>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// VUE 2 — DÉTAIL INTERPRÈTE (bottom sheet plein écran simulé)
// ─────────────────────────────────────────────────────────────
function DetailScreen({ interp, onBack, onBook }) {
  const st = ST[interp.status];

  return (
    <div style={{
      width: '100%', height: '100%', background: MR_BG,
      fontFamily: '"Inter", -apple-system, system-ui, sans-serif',
      color: MR_INK, overflow: 'auto',
      WebkitFontSmoothing: 'antialiased',
    }}>
      {/* Header coloré avec avatar */}
      <div style={{
        background: `linear-gradient(180deg, ${MR_BRAND} 0%, ${MR_BRAND_DARK} 100%)`,
        color: '#fff', padding: '14px 20px 36px', position: 'relative', overflow: 'hidden',
      }}>
        <div aria-hidden style={{
          position: 'absolute', top: -50, right: -50, width: 220, height: 220,
          borderRadius: '50%', background: 'rgba(255,255,255,0.08)',
        }}/>
        <div aria-hidden style={{
          position: 'absolute', top: 60, right: 30, width: 100, height: 100,
          borderRadius: '50%', background: 'rgba(255,255,255,0.05)',
        }}/>

        <div style={{ position: 'relative', zIndex: 1,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <button onClick={onBack} aria-label="Retour" style={{
            width: 36, height: 36, borderRadius: 12, border: 0,
            background: 'rgba(255,255,255,0.16)', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          }}>
            <IBack size={18} sw={2.25}/>
          </button>
          <div style={{
            fontSize: 11, fontWeight: 600,
            color: 'rgba(255,255,255,0.78)',
            textTransform: 'uppercase', letterSpacing: '0.08em',
          }}>Profil interprète</div>
          <button aria-label="Fermer" style={{
            width: 36, height: 36, borderRadius: 12, border: 0,
            background: 'rgba(255,255,255,0.16)', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          }}>
            <IClose size={18} sw={2.25}/>
          </button>
        </div>

        <div style={{
          position: 'relative', zIndex: 1, marginTop: 20,
          display: 'flex', alignItems: 'center', gap: 14,
        }}>
          <div style={{
            width: 72, height: 72, borderRadius: 22,
            background: '#fff', color: MR_BRAND,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, fontWeight: 700, letterSpacing: '0.02em',
            boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
            border: '3px solid rgba(255,255,255,0.4)',
          }}>{getInitials(interp.name)}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 22, fontWeight: 700, letterSpacing: '-0.025em', lineHeight: 1.15,
            }}>{interp.name}</div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)', marginTop: 4 }}>
              {interp.spec}
            </div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 8,
              fontSize: 12, fontWeight: 700, color: '#fff',
              background: 'rgba(255,255,255,0.18)', padding: '4px 10px', borderRadius: 999,
            }}>
              <span style={{
                width: 7, height: 7, borderRadius: '50%', background: '#fff',
              }}/>
              {st.label}
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{
        padding: '0 20px 24px', marginTop: -20, position: 'relative',
        display: 'flex', flexDirection: 'column', gap: 14,
      }}>
        {/* Stats row */}
        <div style={{
          display: 'flex', background: MR_SURFACE,
          border: `1px solid ${MR_BORDER}`, borderRadius: 18,
          boxShadow: '0 4px 16px -8px rgba(15,27,45,0.1)',
          overflow: 'hidden',
        }}>
          {[
            { label: 'Note', value: interp.rating, suffix: '/5', icon: IStar, color: '#F59E0B' },
            { label: 'Distance', value: interp.distance, suffix: ' km', icon: IPin, color: MR_BRAND },
            { label: 'Expérience', value: interp.exp, suffix: ' ans', icon: IClock, color: '#2563EB' },
          ].map((s, i) => (
            <div key={i} style={{
              flex: 1, padding: '14px 10px', textAlign: 'center',
              borderRight: i < 2 ? `1px solid ${MR_BORDER}` : 'none',
            }}>
              <div style={{
                width: 28, height: 28, margin: '0 auto 6px',
                borderRadius: 8, background: s.color + '14', color: s.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <s.icon size={14} sw={2}/>
              </div>
              <div style={{
                fontSize: 17, fontWeight: 700, color: MR_INK,
                fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.01em',
              }}>
                {s.value}<span style={{ fontSize: 11, color: MR_INK_3, fontWeight: 500 }}>{s.suffix}</span>
              </div>
              <div style={{ fontSize: 11, color: MR_INK_3, fontWeight: 500, marginTop: 1 }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* Spécialités */}
        <div style={{
          background: MR_SURFACE, border: `1px solid ${MR_BORDER}`,
          borderRadius: 16, padding: 16,
        }}>
          <div style={{
            fontSize: 11, fontWeight: 700, color: MR_INK_3,
            textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10,
          }}>Spécialités médicales</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {['Médecine générale', 'Pédiatrie', 'Urgences', 'Consultation gynéco'].map(t => (
              <span key={t} style={{
                fontSize: 12, fontWeight: 600, color: MR_BRAND_DARK,
                background: MR_BRAND_TINT, padding: '5px 10px', borderRadius: 999,
              }}>{t}</span>
            ))}
          </div>
        </div>

        {/* Disponibilités */}
        <div style={{
          background: MR_SURFACE, border: `1px solid ${MR_BORDER}`,
          borderRadius: 16, padding: 16,
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: 12,
          }}>
            <div style={{
              fontSize: 13.5, fontWeight: 700, color: MR_INK, letterSpacing: '-0.005em',
            }}>Prochaines disponibilités</div>
            <span style={{
              fontSize: 11, fontWeight: 700, color: MR_BRAND,
              background: MR_BRAND_TINT, padding: '3px 9px', borderRadius: 999,
            }}>3 créneaux</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { day: "Aujourd'hui", time: '14h30 — 16h00', tag: 'dans 2h' },
              { day: 'Demain',      time: '09h00 — 10h30', tag: 'matin' },
              { day: 'Vendredi',    time: '15h00 — 16h30', tag: 'après-midi' },
            ].map((s, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 12px', background: MR_BG,
                borderRadius: 12,
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: '#fff', border: `1px solid ${MR_BORDER}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: MR_BRAND,
                }}>
                  <ICalSm size={16} sw={2}/>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: MR_INK }}>{s.day}</div>
                  <div style={{ fontSize: 12, color: MR_INK_2, fontVariantNumeric: 'tabular-nums' }}>{s.time}</div>
                </div>
                <span style={{
                  fontSize: 11, fontWeight: 600, color: MR_INK_3,
                }}>{s.tag}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA — sticky-like */}
        <button onClick={onBook} style={{
          marginTop: 6, border: 0, cursor: 'pointer',
          background: MR_BRAND, color: '#fff',
          borderRadius: 16, padding: '16px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          fontFamily: 'inherit', fontSize: 15, fontWeight: 700,
          letterSpacing: '-0.005em',
          boxShadow: '0 8px 24px -8px rgba(15,118,110,0.5)',
        }}>
          <ICalSm size={18} sw={2.25}/>
          Prendre rendez-vous
        </button>

        <div style={{
          display: 'flex', gap: 8,
        }}>
          <button style={{
            flex: 1, border: `1px solid ${MR_BORDER}`, cursor: 'pointer',
            background: MR_SURFACE, color: MR_INK,
            borderRadius: 14, padding: '12px 14px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            fontFamily: 'inherit', fontSize: 13.5, fontWeight: 600,
          }}>
            <IPhone size={15} sw={2}/> Appeler
          </button>
          <button style={{
            flex: 1, border: `1px solid ${MR_BORDER}`, cursor: 'pointer',
            background: MR_SURFACE, color: MR_INK,
            borderRadius: 14, padding: '12px 14px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            fontFamily: 'inherit', fontSize: 13.5, fontWeight: 600,
          }}>
            <IPin size={15} sw={2}/> Itinéraire
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// VUE 3 — FORMULAIRE PRISE DE RDV
// ─────────────────────────────────────────────────────────────
const RDV_TYPES = [
  { id: 'gp',    label: 'Médecin généraliste', icon: IStetho },
  { id: 'spec',  label: 'Spécialiste',         icon: ISpec },
  { id: 'hosp',  label: 'Hôpital · Examen',    icon: IHosp },
  { id: 'pharm', label: 'Pharmacie',           icon: IPlus },
];

const TIME_SLOTS = ['09:00', '10:30', '11:00', '14:00', '14:30', '15:30', '16:00', '17:00'];

function BookingScreen({ interp, onBack, onConfirm }) {
  const [type, setType] = React.useState('gp');
  const [date, setDate] = React.useState(2);   // index dans la liste de jours
  const [slot, setSlot] = React.useState('14:30');
  const [notes, setNotes] = React.useState('');

  // 7 prochains jours
  const days = React.useMemo(() => {
    const arr = [];
    const labels = ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'];
    const today = new Date(2025, 4, 15); // fixe pour reproductibilité
    for (let i = 0; i < 7; i++) {
      const d = new Date(today); d.setDate(today.getDate() + i);
      arr.push({
        wd: i === 0 ? "Auj." : labels[d.getDay()],
        n: d.getDate(),
        full: i === 0 ? "Aujourd'hui" : `${labels[d.getDay()]}. ${d.getDate()}`,
      });
    }
    return arr;
  }, []);

  return (
    <div style={{
      width: '100%', height: '100%', background: MR_BG,
      fontFamily: '"Inter", -apple-system, system-ui, sans-serif',
      color: MR_INK, display: 'flex', flexDirection: 'column',
      WebkitFontSmoothing: 'antialiased',
    }}>
      {/* Header */}
      <div style={{
        background: MR_BRAND, color: '#fff',
        padding: '14px 20px 18px', position: 'relative', overflow: 'hidden',
      }}>
        <div aria-hidden style={{
          position: 'absolute', top: -40, right: -30, width: 160, height: 160,
          borderRadius: '50%', background: 'rgba(255,255,255,0.06)',
        }}/>
        <div style={{
          position: 'relative', zIndex: 1,
          display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10,
        }}>
          <button onClick={onBack} aria-label="Retour" style={{
            width: 36, height: 36, borderRadius: 12, border: 0,
            background: 'rgba(255,255,255,0.16)', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          }}>
            <IBack size={18} sw={2.25}/>
          </button>
          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.78)',
              textTransform: 'uppercase', letterSpacing: '0.08em',
            }}>Étape 1/2</div>
            <div style={{
              fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em', marginTop: 2,
            }}>Nouveau rendez-vous</div>
          </div>
        </div>
        {/* Progress bar */}
        <div style={{
          position: 'relative', zIndex: 1,
          height: 4, borderRadius: 999, background: 'rgba(255,255,255,0.18)',
        }}>
          <div style={{
            width: '50%', height: '100%', borderRadius: 999, background: '#fff',
          }}/>
        </div>
      </div>

      {/* Recap interprète */}
      {interp && (
        <div style={{
          margin: '14px 20px 0',
          background: MR_SURFACE, border: `1px solid ${MR_BORDER}`,
          borderRadius: 14, padding: 12,
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: `linear-gradient(135deg, ${MR_BRAND} 0%, ${MR_BRAND_DARK} 100%)`,
            color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: 13,
          }}>{getInitials(interp.name)}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: MR_INK_3,
              textTransform: 'uppercase', letterSpacing: '0.06em' }}>Interprète sélectionné</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: MR_INK, marginTop: 1 }}>
              {interp.name}
            </div>
          </div>
          <button style={{
            border: `1px solid ${MR_BORDER}`, background: MR_SURFACE,
            borderRadius: 999, padding: '5px 12px', cursor: 'pointer',
            fontFamily: 'inherit', fontSize: 12, fontWeight: 600, color: MR_INK_2,
          }}>Changer</button>
        </div>
      )}

      {/* Form */}
      <div style={{
        flex: 1, overflow: 'auto', padding: '14px 20px 20px',
        display: 'flex', flexDirection: 'column', gap: 18,
      }}>
        {/* Section 1 — Type de RDV */}
        <Section
          step={1}
          title="Type de rendez-vous"
          desc="Quel type de soin nécessite l'interprétation ?"
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {RDV_TYPES.map(t => {
              const on = type === t.id;
              const Icon = t.icon;
              return (
                <button key={t.id} onClick={() => setType(t.id)} style={{
                  textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit',
                  background: on ? MR_BRAND_TINT : MR_SURFACE,
                  border: `1.5px solid ${on ? MR_BRAND : MR_BORDER}`,
                  borderRadius: 14, padding: 12,
                  display: 'flex', alignItems: 'center', gap: 10,
                  transition: 'all .15s',
                }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 10,
                    background: on ? MR_BRAND : MR_BG,
                    color: on ? '#fff' : MR_INK_2,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <Icon size={16} sw={2}/>
                  </div>
                  <div style={{
                    fontSize: 13, fontWeight: 600,
                    color: on ? MR_BRAND_DARK : MR_INK, lineHeight: 1.25,
                  }}>{t.label}</div>
                </button>
              );
            })}
          </div>
        </Section>

        {/* Section 2 — Date */}
        <Section step={2} title="Date" desc="Sélectionnez le jour de votre RDV.">
          <div style={{
            display: 'flex', gap: 6, overflowX: 'auto',
            margin: '0 -20px', padding: '0 20px',
          }}>
            {days.map((d, i) => {
              const on = date === i;
              return (
                <button key={i} onClick={() => setDate(i)} style={{
                  flexShrink: 0, cursor: 'pointer', fontFamily: 'inherit',
                  background: on ? MR_BRAND : MR_SURFACE,
                  border: `1.5px solid ${on ? MR_BRAND : MR_BORDER}`,
                  borderRadius: 14, padding: '10px 14px',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                  minWidth: 56,
                }}>
                  <span style={{
                    fontSize: 11, fontWeight: 600,
                    color: on ? 'rgba(255,255,255,0.85)' : MR_INK_3,
                    textTransform: 'uppercase', letterSpacing: '0.04em',
                  }}>{d.wd}</span>
                  <span style={{
                    fontSize: 18, fontWeight: 700,
                    color: on ? '#fff' : MR_INK,
                    fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em',
                  }}>{d.n}</span>
                </button>
              );
            })}
          </div>
        </Section>

        {/* Section 3 — Créneau */}
        <Section step={3} title="Créneau horaire" desc={`${days[date].full} · 8 disponibles`}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            {TIME_SLOTS.map(t => {
              const on = slot === t;
              return (
                <button key={t} onClick={() => setSlot(t)} style={{
                  cursor: 'pointer', fontFamily: 'inherit',
                  background: on ? MR_BRAND : MR_SURFACE,
                  border: `1.5px solid ${on ? MR_BRAND : MR_BORDER}`,
                  borderRadius: 10, padding: '10px 0',
                  fontSize: 13.5, fontWeight: 600,
                  color: on ? '#fff' : MR_INK,
                  fontVariantNumeric: 'tabular-nums',
                  transition: 'all .15s',
                }}>{t}</button>
              );
            })}
          </div>
        </Section>

        {/* Section 4 — Notes */}
        <Section step={4} title="Précisions (optionnel)" desc="Détails utiles pour l'interprète.">
          <div style={{
            background: MR_SURFACE, border: `1px solid ${MR_BORDER}`,
            borderRadius: 12, padding: 12,
          }}>
            <textarea
              value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="Ex: consultation de suivi cardiologique, accompagnant d'un proche…"
              rows={3} style={{
                width: '100%', border: 0, outline: 0, resize: 'none',
                fontFamily: 'inherit', fontSize: 13.5, color: MR_INK,
                background: 'transparent', lineHeight: 1.45,
              }}/>
          </div>
        </Section>

        {/* Récap */}
        <div style={{
          background: MR_BRAND_TINT,
          borderRadius: 14, padding: 14,
          display: 'flex', gap: 10,
        }}>
          <div style={{
            width: 28, height: 28, borderRadius: 999,
            background: MR_BRAND, color: '#fff', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <IInfo size={14} sw={2.25}/>
          </div>
          <div style={{ fontSize: 12.5, color: MR_BRAND_DARK, lineHeight: 1.5 }}>
            Votre demande sera envoyée à <strong>{interp ? interp.name : "l'interprète"}</strong>.
            Vous recevrez une confirmation sous <strong>2h en moyenne</strong>. Service gratuit.
          </div>
        </div>
      </div>

      {/* Footer CTA sticky */}
      <div style={{
        padding: '12px 20px 16px',
        background: MR_SURFACE,
        borderTop: `1px solid ${MR_BORDER}`,
        display: 'flex', gap: 10, alignItems: 'center',
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: MR_INK_3,
            textTransform: 'uppercase', letterSpacing: '0.06em' }}>Récap.</div>
          <div style={{
            fontSize: 13.5, fontWeight: 700, color: MR_INK, marginTop: 1,
            letterSpacing: '-0.005em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {days[date].full} · <span style={{ fontVariantNumeric: 'tabular-nums' }}>{slot}</span>
          </div>
        </div>
        <button onClick={onConfirm} style={{
          border: 0, cursor: 'pointer', fontFamily: 'inherit',
          background: MR_BRAND, color: '#fff',
          borderRadius: 14, padding: '14px 20px',
          fontSize: 14, fontWeight: 700, letterSpacing: '-0.005em',
          display: 'flex', alignItems: 'center', gap: 8,
          boxShadow: '0 8px 20px -8px rgba(15,118,110,0.55)',
        }}>
          Envoyer la demande
          <IChev size={16} sw={2.25}/>
        </button>
      </div>
    </div>
  );
}

function Section({ step, title, desc, children }) {
  return (
    <div>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4,
      }}>
        <div style={{
          width: 22, height: 22, borderRadius: 999,
          background: MR_BRAND_TINT, color: MR_BRAND,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 700, fontVariantNumeric: 'tabular-nums',
        }}>{step}</div>
        <div style={{
          fontSize: 14.5, fontWeight: 700, color: MR_INK, letterSpacing: '-0.01em',
        }}>{title}</div>
      </div>
      <div style={{
        fontSize: 12.5, color: MR_INK_2, marginBottom: 10, marginLeft: 30,
      }}>{desc}</div>
      <div>{children}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// CONTAINER — choisit la vue à afficher
// ─────────────────────────────────────────────────────────────
function MapRDVFlow({ view = 'map', onViewChange }) {
  const [interp, setInterp] = React.useState(INTERPRETES[0]);

  // si pas de gestion externe, fallback local
  const [localView, setLocalView] = React.useState(view);
  const v = onViewChange ? view : localView;
  const setV = onViewChange || setLocalView;

  React.useEffect(() => { if (!onViewChange) setLocalView(view); }, [view]);

  if (v === 'detail') {
    return (
      <DetailScreen
        interp={interp}
        onBack={() => setV('map')}
        onBook={() => setV('booking')}
      />
    );
  }
  if (v === 'booking') {
    return (
      <BookingScreen
        interp={interp}
        onBack={() => setV('detail')}
        onConfirm={() => setV('map')}
      />
    );
  }
  return (
    <MapScreen onSelectInterp={(i) => { setInterp(i); setV('detail'); }}/>
  );
}

window.MapRDVFlow = MapRDVFlow;
window.MapScreen = MapScreen;
window.DetailScreen = DetailScreen;
window.BookingScreen = BookingScreen;
window.MR_INTERPRETES = INTERPRETES;
