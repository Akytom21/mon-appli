// AuthScreens — Login + Register pour PharmaSign, même langage visuel que Home.
// Esprit santé/accessibilité, icônes Lucide, hiérarchie claire.

const PS_BRAND = '#0F766E';
const PS_BRAND_DARK = '#0B5F58';
const PS_BRAND_TINT = '#E8F4F2';
const PS_INK = '#0F1B2D';
const PS_INK_2 = '#475569';
const PS_INK_3 = '#94A3B8';
const PS_SURFACE = '#FFFFFF';
const PS_BG = '#F6F8FA';
const PS_BORDER = '#E5EAF0';
const PS_AMBER = '#B45309';

// roles palette (chaque rôle a sa couleur d'accent)
const ROLE_COLORS = {
  sourd:      { c: '#0F766E', tint: '#E8F4F2' }, // teal
  interprete: { c: '#1D4ED8', tint: '#E6EDFD' }, // bleu
  apprenti:   { c: '#B45309', tint: '#FEF3C7' }, // amber
};

// ── Icons (Lucide-style) ─────────────────────────────────────
const Ico = ({ size = 20, color = 'currentColor', sw = 1.75, fill = 'none', children }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={color}
    strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
    {children}
  </svg>
);
const IcoMail = (p) => <Ico {...p}><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/></Ico>;
const IcoLock = (p) => <Ico {...p}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></Ico>;
const IcoUser = (p) => <Ico {...p}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></Ico>;
const IcoEye = (p) => <Ico {...p}><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></Ico>;
const IcoEar = (p) => <Ico {...p}><path d="M6 8.5a6.5 6.5 0 1 1 13 0c0 6-6 4-6 8.5a3.5 3.5 0 0 1-7 0"/><path d="M9 12a3 3 0 1 1 6 0"/></Ico>;
const IcoHands = (p) => <Ico {...p}><path d="M11 14V5.5a1.5 1.5 0 1 1 3 0V12"/><path d="M14 11.5V4.5a1.5 1.5 0 1 1 3 0V13"/><path d="M17 12V6a1.5 1.5 0 1 1 3 0v9a6 6 0 0 1-6 6h-2c-2 0-3.5-1-5-2.5L4 16.5a2 2 0 0 1 2.83-2.83L8 14.83V7.5a1.5 1.5 0 1 1 3 0V12"/></Ico>;
const IcoBook = (p) => <Ico {...p}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"/></Ico>;
const IcoArrow = (p) => <Ico {...p}><path d="M5 12h14M12 5l7 7-7 7"/></Ico>;
const IcoCheck = (p) => <Ico {...p}><path d="M20 6 9 17l-5-5"/></Ico>;
const IcoBack = (p) => <Ico {...p}><path d="M19 12H5M12 19l-7-7 7-7"/></Ico>;

// Logo
const LogoMark = ({ size = 40, color = '#fff' }) => (
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

// ── Field ────────────────────────────────────────────────────
function Field({ label, icon: Icon, value, placeholder, type = 'text', trailing }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 13, fontWeight: 600, color: PS_INK, letterSpacing: '0.005em' }}>{label}</label>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        background: PS_SURFACE,
        border: `1.5px solid ${PS_BORDER}`,
        borderRadius: 12, padding: '0 14px', height: 48,
      }}>
        {Icon && <Icon size={18} color={PS_INK_3} sw={2}/>}
        <input
          defaultValue={value}
          placeholder={placeholder}
          type={type}
          style={{
            flex: 1, border: 0, outline: 0, background: 'transparent',
            fontFamily: 'inherit', fontSize: 15, color: PS_INK,
            padding: 0, height: '100%',
          }}
        />
        {trailing}
      </div>
    </div>
  );
}

function PrimaryBtn({ children, onClick }) {
  return (
    <button onClick={onClick} style={{
      width: '100%', border: 0, cursor: 'pointer',
      background: PS_BRAND, color: '#fff',
      borderRadius: 14, height: 52,
      fontSize: 15.5, fontWeight: 700, letterSpacing: '0.01em',
      fontFamily: 'inherit',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      boxShadow: '0 6px 18px -6px rgba(15,118,110,0.5)',
    }}>
      {children}
    </button>
  );
}

// ── LOGIN ────────────────────────────────────────────────────
function LoginScreen({ onSwitch }) {
  return (
    <div style={{
      width: '100%', height: '100%', background: PS_BG,
      fontFamily: '"Inter", -apple-system, system-ui, sans-serif',
      color: PS_INK, overflow: 'auto', display: 'flex', flexDirection: 'column',
      WebkitFontSmoothing: 'antialiased',
    }}>
      {/* Header — bandeau de marque */}
      <div style={{
        background: PS_BRAND, color: '#fff',
        padding: '20px 24px 56px',
        position: 'relative', overflow: 'hidden',
      }}>
        <div aria-hidden style={{
          position: 'absolute', top: -50, right: -30, width: 200, height: 200,
          borderRadius: '50%', background: 'rgba(255,255,255,0.06)',
        }}/>
        <div aria-hidden style={{
          position: 'absolute', top: 40, right: 60, width: 90, height: 90,
          borderRadius: '50%', background: 'rgba(255,255,255,0.04)',
        }}/>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, position: 'relative', zIndex: 1, paddingTop: 12 }}>
          <LogoMark size={56}/>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em' }}>PharmaSign</div>
            <div style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.85)', marginTop: 4, lineHeight: 1.4 }}>
              L'accès aux soins, en langue des signes
            </div>
          </div>
        </div>
      </div>

      {/* Carte de connexion */}
      <div style={{
        background: PS_SURFACE, borderRadius: '20px 20px 0 0',
        padding: '24px 22px 28px', marginTop: -20,
        flex: 1, display: 'flex', flexDirection: 'column', gap: 18,
        boxShadow: '0 -8px 24px -12px rgba(15,27,45,0.08)',
        position: 'relative', zIndex: 2,
      }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: PS_INK, letterSpacing: '-0.02em' }}>Connexion</div>
          <div style={{ fontSize: 13.5, color: PS_INK_2, marginTop: 4 }}>
            Bon retour parmi nous.
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="Adresse email" icon={IcoMail} placeholder="exemple@email.fr" type="email"/>
          <Field
            label="Mot de passe"
            icon={IcoLock}
            placeholder="••••••••"
            type="password"
            trailing={
              <button aria-label="Afficher le mot de passe" style={{
                border: 0, background: 'transparent', cursor: 'pointer',
                color: PS_INK_3, padding: 4, display: 'flex',
              }}>
                <IcoEye size={18} sw={2}/>
              </button>
            }
          />
          <div style={{ textAlign: 'right', marginTop: -4 }}>
            <a style={{
              fontSize: 13, color: PS_BRAND, fontWeight: 600,
              textDecoration: 'none', cursor: 'pointer',
            }}>Mot de passe oublié ?</a>
          </div>
        </div>

        <PrimaryBtn>
          Se connecter
          <IcoArrow size={18} sw={2.25}/>
        </PrimaryBtn>

        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '4px 0',
        }}>
          <div style={{ flex: 1, height: 1, background: PS_BORDER }}/>
          <span style={{ fontSize: 12, color: PS_INK_3, fontWeight: 500 }}>OU</span>
          <div style={{ flex: 1, height: 1, background: PS_BORDER }}/>
        </div>

        <button onClick={onSwitch} style={{
          width: '100%', border: `1.5px solid ${PS_BORDER}`,
          background: PS_SURFACE, color: PS_INK,
          borderRadius: 14, height: 50,
          fontSize: 14.5, fontWeight: 600,
          fontFamily: 'inherit', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          Créer un compte
          <IcoArrow size={16} color={PS_BRAND} sw={2.25}/>
        </button>

        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          padding: '12px 14px', background: PS_BRAND_TINT, borderRadius: 12,
          marginTop: 'auto',
        }}>
          <div style={{
            width: 22, height: 22, borderRadius: 999, background: PS_BRAND,
            color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <IcoCheck size={13} sw={3}/>
          </div>
          <div style={{ fontSize: 12.5, color: PS_BRAND_DARK, fontWeight: 500, lineHeight: 1.35 }}>
            Confidentialité médicale · Données chiffrées
          </div>
        </div>
      </div>
    </div>
  );
}

// ── REGISTER ─────────────────────────────────────────────────
const ROLES = [
  { id: 'sourd',      icon: IcoEar,   title: 'Malentendant / Sourd',  sub: 'Je cherche un interprète LSF' },
  { id: 'interprete', icon: IcoHands, title: 'Interprète LSF agréé',  sub: 'Je propose mes services' },
  { id: 'apprenti',   icon: IcoBook,  title: 'Apprenti interprète',   sub: 'Je me forme en LSF médical' },
];

function RoleCard({ role, selected, onSelect }) {
  const accent = ROLE_COLORS[role.id];
  const Icon = role.icon;
  return (
    <button onClick={() => onSelect(role.id)} style={{
      textAlign: 'left', cursor: 'pointer', width: '100%',
      background: selected ? accent.tint : PS_SURFACE,
      border: `1.5px solid ${selected ? accent.c : PS_BORDER}`,
      borderRadius: 14, padding: 14,
      display: 'flex', alignItems: 'center', gap: 12,
      fontFamily: 'inherit',
      transition: 'all 120ms ease',
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: 11,
        background: selected ? accent.c : '#F1F5F9',
        color: selected ? '#fff' : PS_INK_2,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Icon size={20} sw={2}/>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 14.5, fontWeight: 700,
          color: selected ? accent.c : PS_INK, letterSpacing: '-0.005em',
        }}>{role.title}</div>
        <div style={{ fontSize: 12.5, color: PS_INK_2, marginTop: 2, lineHeight: 1.35 }}>
          {role.sub}
        </div>
      </div>
      <div style={{
        width: 20, height: 20, borderRadius: 999,
        border: `2px solid ${selected ? accent.c : PS_BORDER}`,
        background: selected ? accent.c : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        {selected && <IcoCheck size={11} color="#fff" sw={3.5}/>}
      </div>
    </button>
  );
}

function RegisterScreen({ onSwitch }) {
  const [role, setRole] = React.useState('sourd');
  const accent = ROLE_COLORS[role];

  return (
    <div style={{
      width: '100%', height: '100%', background: PS_BG,
      fontFamily: '"Inter", -apple-system, system-ui, sans-serif',
      color: PS_INK, overflow: 'auto',
      WebkitFontSmoothing: 'antialiased',
    }}>
      {/* Header avec back button */}
      <div style={{
        background: PS_BRAND, color: '#fff',
        padding: '14px 20px 32px',
        position: 'relative', overflow: 'hidden',
      }}>
        <div aria-hidden style={{
          position: 'absolute', top: -50, right: -30, width: 200, height: 200,
          borderRadius: '50%', background: 'rgba(255,255,255,0.06)',
        }}/>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative', zIndex: 1 }}>
          <button onClick={onSwitch} aria-label="Retour" style={{
            width: 38, height: 38, borderRadius: 12, border: 0,
            background: 'rgba(255,255,255,0.18)', color: '#fff', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <IcoBack size={18} sw={2.25}/>
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <LogoMark size={28}/>
            <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.01em' }}>PharmaSign</div>
          </div>
        </div>

        <div style={{ marginTop: 18, position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
            Créer un compte
          </div>
          <div style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.82)', marginTop: 4 }}>
            Quelques minutes suffisent.
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{
        padding: '20px 22px 32px', marginTop: -16,
        position: 'relative', zIndex: 2,
        display: 'flex', flexDirection: 'column', gap: 22,
      }}>
        {/* Role section */}
        <div>
          <div style={{
            display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
            marginBottom: 10,
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: PS_INK, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Je suis…
            </div>
            <div style={{ fontSize: 11.5, color: PS_INK_3, fontWeight: 500 }}>Étape 1/2</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {ROLES.map(r => (
              <RoleCard key={r.id} role={r} selected={role === r.id} onSelect={setRole}/>
            ))}
          </div>
        </div>

        {/* Form section */}
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: PS_INK, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
            Mes informations
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Field label="Prénom et nom" icon={IcoUser} placeholder="Jean Dupont"/>
            <Field label="Adresse email" icon={IcoMail} placeholder="exemple@email.fr" type="email"/>
            <Field
              label="Mot de passe"
              icon={IcoLock}
              placeholder="6 caractères minimum"
              type="password"
              trailing={
                <button aria-label="Afficher" style={{
                  border: 0, background: 'transparent', cursor: 'pointer',
                  color: PS_INK_3, padding: 4, display: 'flex',
                }}>
                  <IcoEye size={18} sw={2}/>
                </button>
              }
            />
          </div>

          {role === 'apprenti' && (
            <div style={{
              marginTop: 12, padding: '12px 14px',
              background: ROLE_COLORS.apprenti.tint,
              border: `1px solid ${ROLE_COLORS.apprenti.c}33`,
              borderRadius: 12, display: 'flex', gap: 10, alignItems: 'flex-start',
            }}>
              <div style={{
                width: 22, height: 22, borderRadius: 999, background: ROLE_COLORS.apprenti.c,
                color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1,
              }}>
                <IcoBook size={12} sw={2.5}/>
              </div>
              <div style={{ fontSize: 12.5, color: '#78350F', lineHeight: 1.45 }}>
                Vous pourrez soumettre votre brevet LSF depuis l'app pour évoluer vers le statut <strong>Interprète agréé</strong>.
              </div>
            </div>
          )}
        </div>

        <button style={{
          width: '100%', border: 0, cursor: 'pointer',
          background: accent.c, color: '#fff',
          borderRadius: 14, height: 52,
          fontSize: 15.5, fontWeight: 700, letterSpacing: '0.01em',
          fontFamily: 'inherit',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          boxShadow: `0 6px 18px -6px ${accent.c}80`,
          transition: 'background 120ms ease',
        }}>
          Créer mon compte
          <IcoArrow size={18} sw={2.25}/>
        </button>

        <button onClick={onSwitch} style={{
          background: 'transparent', border: 0, cursor: 'pointer', fontFamily: 'inherit',
          fontSize: 13.5, color: PS_INK_2, padding: 8,
        }}>
          J'ai déjà un compte · <span style={{ color: PS_BRAND, fontWeight: 700 }}>Se connecter</span>
        </button>
      </div>
    </div>
  );
}

window.LoginScreen = LoginScreen;
window.RegisterScreen = RegisterScreen;
