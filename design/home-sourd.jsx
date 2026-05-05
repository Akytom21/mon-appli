// HomeSourd — refonte de l'écran Home (rôle Sourd/Malentendant) de PharmaSign
// Esprit santé/accessibilité : propre, rassurant, professionnel.
// Icônes Lucide (inline SVG), typographie soignée, hiérarchie claire,
// remplacement des emojis par des pictos.

const PS_BRAND = '#0F766E';        // teal pharma profond — confiance
const PS_BRAND_DARK = '#0B5F58';
const PS_BRAND_TINT = '#E8F4F2';   // surface tintée (header, callouts)
const PS_INK = '#0F1B2D';          // titres
const PS_INK_2 = '#475569';        // texte courant
const PS_INK_3 = '#94A3B8';        // labels, légendes
const PS_SURFACE = '#FFFFFF';
const PS_BG = '#F6F8FA';
const PS_BORDER = '#E5EAF0';
const PS_AMBER = '#B45309';        // accent statut
const PS_AMBER_BG = '#FEF3C7';

// ── Icons (Lucide-style, 1.5 stroke) ─────────────────────────
const Ico = ({ d, size = 20, color = 'currentColor', sw = 1.75, fill = 'none', children }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={color}
    strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
    {d ? <path d={d} /> : children}
  </svg>
);
const IconMap = (p) => <Ico {...p}><path d="M20 10c0 7-8 12-8 12s-8-5-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></Ico>;
const IconCal = (p) => <Ico {...p}><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></Ico>;
const IconBolt = (p) => <Ico {...p}><path d="M13 2 4.09 12.97a.5.5 0 0 0 .39.81H11l-1 8.22 9.91-10.99a.5.5 0 0 0-.39-.81H13l1-7.2Z"/></Ico>;
const IconHands = (p) => <Ico {...p}><path d="M11 14V5.5a1.5 1.5 0 1 1 3 0V12"/><path d="M14 11.5V4.5a1.5 1.5 0 1 1 3 0V13"/><path d="M17 12V6a1.5 1.5 0 1 1 3 0v9a6 6 0 0 1-6 6h-2c-2 0-3.5-1-5-2.5L4 16.5a2 2 0 0 1 2.83-2.83L8 14.83V7.5a1.5 1.5 0 1 1 3 0V12"/></Ico>;
const IconStar = (p) => <Ico {...p}><path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2Z"/></Ico>;
const IconChev = (p) => <Ico {...p}><path d="m9 18 6-6-6-6"/></Ico>;
const IconLogout = (p) => <Ico {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></Ico>;
const IconBell = (p) => <Ico {...p}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></Ico>;
const IconCheck = (p) => <Ico {...p}><path d="M20 6 9 17l-5-5"/></Ico>;

// Logo lockup — placeholder propre (mains LSF stylisées dans cercle)
const LogoMark = ({ size = 36, color = '#fff' }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" style={{ display: 'block' }}>
    <circle cx="20" cy="20" r="20" fill="rgba(255,255,255,0.18)"/>
    <g stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none">
      <path d="M14 22V13.5a1.5 1.5 0 0 1 3 0V20"/>
      <path d="M17 19V12a1.5 1.5 0 0 1 3 0v8"/>
      <path d="M20 20v-6.5a1.5 1.5 0 0 1 3 0V22"/>
      <path d="M23 22v-3.5a1.5 1.5 0 0 1 3 0V25a4 4 0 0 1-4 4h-2c-1.5 0-2.5-.7-3.6-1.7L13 25l1.5-1.5"/>
    </g>
  </svg>
);

// ── Reusable ────────────────────────────────────────────────
function StatTile({ icon: Icon, value, label, accent, density }) {
  const pad = density === 'compact' ? 12 : 16;
  return (
    <div style={{
      flex: 1, background: PS_SURFACE, borderRadius: 14,
      border: `1px solid ${PS_BORDER}`,
      padding: pad, display: 'flex', flexDirection: 'column', gap: density === 'compact' ? 4 : 6,
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: 10,
        background: PS_BRAND_TINT, color: accent || PS_BRAND,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={18} sw={2}/>
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, color: PS_INK, letterSpacing: '-0.02em', lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </div>
      <div style={{ fontSize: 12, color: PS_INK_3, fontWeight: 500, letterSpacing: '0.01em' }}>
        {label}
      </div>
    </div>
  );
}

function StepRow({ n, title, desc, density }) {
  return (
    <div style={{
      display: 'flex', gap: 14, alignItems: 'flex-start',
      paddingTop: density === 'compact' ? 10 : 14,
      paddingBottom: density === 'compact' ? 10 : 14,
    }}>
      <div style={{
        width: 28, height: 28, flexShrink: 0,
        borderRadius: 999, background: PS_BRAND_TINT,
        color: PS_BRAND, fontSize: 13, fontWeight: 700,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontVariantNumeric: 'tabular-nums',
      }}>{n}</div>
      <div style={{ flex: 1, paddingTop: 2 }}>
        <div style={{ fontSize: 14.5, fontWeight: 600, color: PS_INK, lineHeight: 1.35 }}>{title}</div>
        <div style={{ fontSize: 13.5, color: PS_INK_2, lineHeight: 1.45, marginTop: 2 }}>{desc}</div>
      </div>
    </div>
  );
}

// ── Main screen ─────────────────────────────────────────────
function HomeSourd({ density = 'aere' }) {
  const compact = density === 'compact';
  const SP = {
    sectionGap: compact ? 14 : 20,
    blockPad: compact ? 16 : 20,
    headerPad: compact ? 18 : 24,
  };

  return (
    <div style={{
      width: '100%', height: '100%', background: PS_BG,
      fontFamily: '"Inter", -apple-system, system-ui, sans-serif',
      color: PS_INK, overflow: 'auto',
      WebkitFontSmoothing: 'antialiased',
    }}>
      {/* ── Top bar (identité + déconnexion) ──────────────── */}
      <div style={{
        background: PS_BRAND, color: '#fff',
        padding: `${compact ? 14 : 18}px ${SP.headerPad}px 0`,
        position: 'relative', overflow: 'hidden',
      }}>
        {/* subtle decoration */}
        <div aria-hidden style={{
          position: 'absolute', top: -60, right: -40, width: 220, height: 220,
          borderRadius: '50%', background: 'rgba(255,255,255,0.06)', pointerEvents: 'none',
        }}/>
        <div aria-hidden style={{
          position: 'absolute', top: 30, right: 50, width: 100, height: 100,
          borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none',
        }}/>

        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          position: 'relative', zIndex: 1,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <LogoMark size={34}/>
            <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.01em' }}>PharmaSign</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button aria-label="Notifications" style={{
              width: 38, height: 38, borderRadius: 12, border: 0,
              background: 'rgba(255,255,255,0.16)', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', position: 'relative',
            }}>
              <IconBell size={18} sw={2}/>
              <span style={{
                position: 'absolute', top: 9, right: 9, width: 7, height: 7,
                borderRadius: '50%', background: '#FCD34D', border: '1.5px solid ' + PS_BRAND,
              }}/>
            </button>
            <button aria-label="Déconnexion" style={{
              width: 38, height: 38, borderRadius: 12, border: 0,
              background: 'rgba(255,255,255,0.16)', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            }}>
              <IconLogout size={18} sw={2}/>
            </button>
          </div>
        </div>

        {/* Greeting */}
        <div style={{
          marginTop: compact ? 18 : 24, paddingBottom: compact ? 22 : 28,
          position: 'relative', zIndex: 1,
        }}>
          <div style={{
            fontSize: 13, fontWeight: 500,
            color: 'rgba(255,255,255,0.78)',
            textTransform: 'uppercase', letterSpacing: '0.08em',
          }}>Bonjour</div>
          <div style={{
            fontSize: 30, fontWeight: 700, marginTop: 4,
            letterSpacing: '-0.025em', color: '#fff', lineHeight: 1.15,
          }}>Camille D.</div>
          <div style={{
            fontSize: 14.5, color: 'rgba(255,255,255,0.85)', marginTop: 6, lineHeight: 1.4,
          }}>Trouvez un interprète LSF pour vos rendez-vous médicaux à Nice.</div>
        </div>
      </div>

      {/* ── Body ─────────────────────────────────────────── */}
      <div style={{
        padding: `${compact ? 16 : 20}px ${SP.headerPad}px ${compact ? 24 : 32}px`,
        marginTop: -16, position: 'relative',
        display: 'flex', flexDirection: 'column', gap: SP.sectionGap,
      }}>

        {/* ── Action principale ──────────────────────────── */}
        <button style={{
          textAlign: 'left', border: 0, cursor: 'pointer',
          background: PS_SURFACE, borderRadius: 18,
          padding: SP.blockPad,
          display: 'flex', alignItems: 'center', gap: 14,
          boxShadow: '0 1px 2px rgba(15,27,45,0.04), 0 8px 24px -8px rgba(15,118,110,0.18)',
          border: `1px solid ${PS_BORDER}`,
        }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14,
            background: `linear-gradient(135deg, ${PS_BRAND} 0%, ${PS_BRAND_DARK} 100%)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
            flexShrink: 0,
          }}>
            <IconMap size={24} sw={2}/>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: PS_INK, letterSpacing: '-0.01em' }}>
              Trouver un interprète
            </div>
            <div style={{ fontSize: 13, color: PS_INK_2, marginTop: 2, lineHeight: 1.35 }}>
              Carte · disponibilités · prise de RDV
            </div>
          </div>
          <IconChev size={18} color={PS_INK_3} sw={2}/>
        </button>

        {/* ── Mes RDV (avec badge en attente) ────────────── */}
        <button style={{
          textAlign: 'left', border: `1px solid ${PS_BORDER}`, cursor: 'pointer',
          background: PS_SURFACE, borderRadius: 18,
          padding: SP.blockPad,
          display: 'flex', alignItems: 'center', gap: 14,
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12, background: PS_BRAND_TINT,
            color: PS_BRAND, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <IconCal size={20} sw={2}/>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 15.5, fontWeight: 700, color: PS_INK, letterSpacing: '-0.01em' }}>
                Mes rendez-vous
              </span>
              <span style={{
                fontSize: 11, fontWeight: 700, color: PS_AMBER,
                background: PS_AMBER_BG, padding: '2px 8px', borderRadius: 999,
                letterSpacing: '0.02em',
              }}>1 en attente</span>
            </div>
            <div style={{ fontSize: 13, color: PS_INK_2, marginTop: 3, lineHeight: 1.35 }}>
              Demande envoyée à 3 interprètes proches
            </div>
          </div>
          <IconChev size={18} color={PS_INK_3} sw={2}/>
        </button>

        {/* ── Stats ──────────────────────────────────────── */}
        <div style={{ display: 'flex', gap: 10 }}>
          <StatTile icon={IconBolt} value="< 2h" label="Délai moyen" density={density}/>
          <StatTile icon={IconHands} value="3" label="Dispo. à Nice" density={density}/>
          <StatTile icon={IconStar} value="4,8" label="Note moyenne" density={density}/>
        </div>

        {/* ── Comment ça marche ─────────────────────────── */}
        <div style={{
          background: PS_SURFACE, borderRadius: 18,
          border: `1px solid ${PS_BORDER}`,
          padding: SP.blockPad,
        }}>
          <div style={{
            display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
            marginBottom: compact ? 4 : 8,
          }}>
            <div style={{ fontSize: 15.5, fontWeight: 700, color: PS_INK, letterSpacing: '-0.01em' }}>
              Comment ça marche
            </div>
            <div style={{ fontSize: 12, color: PS_INK_3, fontWeight: 500 }}>3 étapes</div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', divideY: 1 }}>
            <StepRow n="1"
              title="Localisez sur la carte"
              desc="Visualisez les interprètes LSF disponibles autour de vous à Nice."
              density={density}/>
            <div style={{ height: 1, background: PS_BORDER }}/>
            <StepRow n="2"
              title="Choisissez votre besoin"
              desc="Type de RDV médical, date et créneau qui vous conviennent."
              density={density}/>
            <div style={{ height: 1, background: PS_BORDER }}/>
            <StepRow n="3"
              title="Confirmation rapide"
              desc="Un interprète accepte votre demande et vous accompagne au RDV."
              density={density}/>
          </div>
        </div>

        {/* ── Reassurance footer ─────────────────────────── */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: `${compact ? 10 : 12}px 14px`,
          background: PS_BRAND_TINT, borderRadius: 12,
        }}>
          <div style={{
            width: 24, height: 24, borderRadius: 999, background: PS_BRAND,
            color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <IconCheck size={14} sw={3}/>
          </div>
          <div style={{ fontSize: 12.5, color: PS_BRAND_DARK, fontWeight: 500, lineHeight: 1.4 }}>
            Service gratuit · Interprètes LSF agréés · Confidentialité médicale
          </div>
        </div>

      </div>
    </div>
  );
}

window.HomeSourd = HomeSourd;
