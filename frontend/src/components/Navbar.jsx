/**
 * src/components/Navbar.jsx
 * ─────────────────────────────────────────────────────────────
 * Navbar fixe — Association ININ
 *
 * Changements v5 :
 *   - currentPath correctement défini depuis useLocation()
 *   - isLoginPage : masque le bouton "Connexion" sur /login
 *   - user + logout depuis useAuth()
 *   - "Mon Espace" si connecté, "Connexion" sinon (et pas sur /login)
 *   - "Se déconnecter" uniquement sur /dashboard
 * ─────────────────────────────────────────────────────────────
 */

import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate} from 'react-router-dom';
import { Menu, X, Heart, LayoutDashboard } from 'lucide-react';
import logoinin from '../assets/logoininST.svg';
import { useAuth } from '../context/AuthContext';

// ── Palette ───────────────────────────────────────────────────
const C = {
  azure:      '#1640c8',
  azureDark:  '#0f2060',
  azureLight: '#eef5ff',
  azureAlpha: 'rgba(22,64,200,0.08)',
  cyan:       '#30c8d3',
  cyanDark:   '#17a8b5',
  white:      '#ffffff',
  dark:       '#0f172a',
  slate:      '#64748b',
  border:     '#e2e8f0',
};

const NAV_HEIGHT  = 85;
const LOGO_HEIGHT = 115;

const NAV_LINKS = [
  { label: 'Accueil',  path: '/'        },
  { label: 'À propos', path: '/about'   },
  { label: 'Actions',  path: '/actions' },
  { label: 'Membres',  path: '/membres' },
  { label: 'Contact',  path: '/contact' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // ✅ FIX : currentPath correctement extrait de useLocation()
  const location    = useLocation();
  const currentPath = location.pathname;

  // ✅ user + logout depuis useAuth()
  const { user, logout } = useAuth();

  // ✅ Flags dérivés de currentPath
  const isDashboard = currentPath.startsWith('/dashboard');
  const isLoginPage = currentPath === '/login';



  const navigate = useNavigate();


  // ── Listeners ─────────────────────────────────────────────
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const onResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) setMenuOpen(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Ferme le menu à chaque changement de route
  useEffect(() => { setMenuOpen(false); }, [currentPath]);

  // ── Helpers couleur ───────────────────────────────────────
  const onPhoto    = !scrolled;
  const mutedColor = onPhoto ? 'rgba(255,255,255,0.78)' : C.slate;
  const textColor  = onPhoto ? C.white : C.dark;

  const isActive = (path) =>
    path === '/' ? currentPath === '/' : currentPath.startsWith(path);

  const linkStyle = (active, mobile = false) => ({
    display:        'inline-flex',
    alignItems:     'center',
    position:       'relative',
    padding:        mobile ? '12px 16px' : '8px 16px',
    width:          mobile ? '100%' : 'auto',
    borderRadius:   '8px',
    cursor:         'pointer',
    fontSize:       '14px',
    fontWeight:     500,
    fontFamily:     '"DM Sans", sans-serif',
    textDecoration: 'none',
    transition:     'background 0.2s, color 0.2s',
    background:     active
      ? (onPhoto && !mobile ? 'rgba(255,255,255,0.14)' : C.azureAlpha)
      : 'transparent',
    color: active
      ? (onPhoto && !mobile ? C.white : C.azure)
      : (mobile ? C.slate : mutedColor),
  });

  const hoverIn  = (e, active, mobile) => {
    e.currentTarget.style.background = onPhoto && !mobile ? 'rgba(255,255,255,0.14)' : C.azureAlpha;
    e.currentTarget.style.color      = onPhoto && !mobile ? C.white : C.azure;
  };
  const hoverOut = (e, active, mobile) => {
    e.currentTarget.style.background = active
      ? (onPhoto && !mobile ? 'rgba(255,255,255,0.14)' : C.azureAlpha)
      : 'transparent';
    e.currentTarget.style.color = active
      ? (onPhoto && !mobile ? C.white : C.azure)
      : (mobile ? C.slate : mutedColor);
  };

  const ActiveDot = () => (
    <span style={{
      position:'absolute', bottom:'3px', left:'50%',
      transform:'translateX(-50%)',
      width:'4px', height:'4px', borderRadius:'50%', background:C.cyan,
    }} />
  );

  const NavLink = ({ path, label, mobile = false }) => {
    const active = isActive(path);
    return (
      <Link
        to={path}
        onClick={() => setMenuOpen(false)}
        style={linkStyle(active, mobile)}
        onMouseEnter={e => hoverIn(e, active, mobile)}
        onMouseLeave={e => hoverOut(e, active, mobile)}
      >
        {label}
        {!mobile && active && <ActiveDot />}
      </Link>
    );
  };

  // ── Bouton "Mon Espace" (desktop) ─────────────────────────
  const MonEspaceDesktop = () => (
    <Link
      to="/dashboard"
      onClick={() => setMenuOpen(false)}
      style={{
        display:        'inline-flex',
        alignItems:     'center',
        gap:            '7px',
        padding:        '8px 16px',
        borderRadius:   '100px',
        fontSize:       '14px',
        fontWeight:     600,
        fontFamily:     '"DM Sans", sans-serif',
        textDecoration: 'none',
        color:          onPhoto ? C.white : C.azure,
        border:         `1.5px solid ${onPhoto ? 'rgba(255,255,255,0.35)' : C.azure + '40'}`,
        background:     onPhoto ? 'rgba(255,255,255,0.08)' : C.azureAlpha,
        transition:     'all 0.2s ease',
        whiteSpace:     'nowrap',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = onPhoto ? 'rgba(255,255,255,0.18)' : C.azureLight;
        e.currentTarget.style.transform  = 'translateY(-1px)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = onPhoto ? 'rgba(255,255,255,0.08)' : C.azureAlpha;
        e.currentTarget.style.transform  = 'translateY(0)';
      }}
    >
      <LayoutDashboard size={14} strokeWidth={2} />
      Mon Espace
    </Link>
  );

  // ── Bouton "Connexion" (desktop) ──────────────────────────
  const ConnexionDesktop = () => (
    <Link
      to="/login"
      onClick={() => setMenuOpen(false)}
      style={{
        padding:        '8px 16px',
        borderRadius:   '8px',
        fontSize:       '14px',
        fontWeight:     500,
        fontFamily:     '"DM Sans", sans-serif',
        textDecoration: 'none',
        color:          mutedColor,
        transition:     'all 0.2s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.color      = onPhoto ? C.white : C.azure;
        e.currentTarget.style.background = onPhoto ? 'rgba(255,255,255,0.1)' : C.azureAlpha;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.color      = mutedColor;
        e.currentTarget.style.background = 'transparent';
      }}
    >
      Connexion
    </Link>
  );

  // ── Bouton "Mon Espace" (mobile) ──────────────────────────
  const MonEspaceMobile = () => (
    <Link
      to="/dashboard"
      onClick={() => setMenuOpen(false)}
      style={{
        flex:           1,
        display:        'inline-flex',
        alignItems:     'center',
        justifyContent: 'center',
        gap:            '6px',
        padding:        '10px 16px',
        borderRadius:   '10px',
        border:         `1.5px solid ${scrolled ? C.azure + '40' : 'rgba(255,255,255,0.35)'}`,
        fontSize:       '14px',
        fontWeight:     600,
        fontFamily:     '"DM Sans", sans-serif',
        textDecoration: 'none',
        color:          scrolled ? C.azure : C.white,
        background:     scrolled ? C.azureAlpha : 'rgba(255,255,255,0.08)',
        transition:     'all 0.2s',
      }}
    >
      <LayoutDashboard size={14} strokeWidth={2} />
      Mon Espace
    </Link>
  );

  // ── Bouton "Connexion" (mobile) ───────────────────────────
  const ConnexionMobile = () => (
    <Link
      to="/login"
      onClick={() => setMenuOpen(false)}
      style={{
        flex:           1,
        textAlign:      'center',
        padding:        '10px 16px',
        borderRadius:   '10px',
        border:         `1.5px solid ${scrolled ? C.border : 'rgba(255,255,255,0.25)'}`,
        fontSize:       '14px',
        fontWeight:     500,
        fontFamily:     '"DM Sans", sans-serif',
        textDecoration: 'none',
        color:          scrolled ? C.slate : C.white,
      }}
    >
      Connexion
    </Link>
  );

  return (
    <>
      <style>{`
        .logo-img { transition: transform 0.3s ease, filter 0.3s ease; }
        .logo-img:hover { transform: translateY(-3px) scale(1.04); }
      `}</style>

      <nav style={{
        position:             'fixed',
        top: 0, left: 0, right: 0,
        zIndex:               1000,
        height:               `${NAV_HEIGHT}px`,
        overflow:             'visible',
        backgroundColor:      scrolled ? 'rgba(255,255,255,0.97)' : 'transparent',
        backdropFilter:       'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        boxShadow:            scrolled ? '0 1px 24px rgba(0,0,0,0.09)' : 'none',
        borderBottom:         scrolled ? `1px solid ${C.border}` : '1px solid transparent',
        transition:           'background-color 0.3s ease, box-shadow 0.3s ease',
      }}>

        {/* ── Conteneur principal ── */}
        <div style={{
          maxWidth: '1280px', margin: '0 auto', padding: '0 32px',
          height: '100%', display: 'flex', flexDirection: 'row',
          alignItems: 'center', justifyContent: 'space-between',
          position: 'relative', overflow: 'visible',
        }}>

          {/* ══ LOGO ══ */}
          <Link
            to="/"
            onClick={() => setMenuOpen(false)}
            style={{
              position: 'relative', width: '160px', height: '100%',
              flexShrink: 0, overflow: 'visible',
              display: 'flex', alignItems: 'center', textDecoration: 'none',
            }}
          >
            <img
              src={logoinin}
              alt="Logo ININ"
              className="logo-img"
              style={{
                height:    `${LOGO_HEIGHT}px`,
                width:     'auto',
                objectFit: 'contain',
                position:  'absolute',
                left: 0, top: '50%',
                transform: 'translateY(-45%)',
                filter:    !scrolled
                  ? 'brightness(0) invert(1) drop-shadow(0 2px 8px rgba(0,0,0,0.3))'
                  : 'none',
                transition: 'filter 0.3s ease',
              }}
            />
          </Link>

          {/* ══ LIENS CENTRE — desktop ══ */}
          {!isMobile && (
            <div style={{
              display: 'flex', flexDirection: 'row', alignItems: 'center',
              gap: '2px', flex: 1, justifyContent: 'center',
            }}>
              {NAV_LINKS.map(({ label, path }) => (
                <NavLink key={path} path={path} label={label} />
              ))}
            </div>
          )}

          {/* ══ ACTIONS DROITE — desktop ══ */}
          {!isMobile && (
            <div style={{
              display: 'flex', flexDirection: 'row',
              alignItems: 'center', gap: '8px', flexShrink: 0,
            }}>

              {/* ✅ Se déconnecter — uniquement sur /dashboard */}
              {user && isDashboard && (
                <button
                  onClick={()=> {
                    logout();
                    navigate('/');
                  }}
                  style={{
                    padding: '8px 16px', borderRadius: '8px', border: 'none',
                    fontSize: '14px', fontWeight: 500,
                    fontFamily: '"DM Sans", sans-serif',
                    cursor: 'pointer', background: 'transparent',
                    color: onPhoto ? 'rgba(255,255,255,0.78)' : '#ef4444',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(239,68,68,0.08)';
                    e.currentTarget.style.color = '#ef4444';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = onPhoto ? 'rgba(255,255,255,0.78)' : '#ef4444';
                  }}
                >
                  Se déconnecter
                </button>
              )}

              {/* ✅ Mon Espace si connecté
                  ✅ Connexion si non connecté ET pas sur /login */}
              {user
                ? <MonEspaceDesktop />
                : !isLoginPage && <ConnexionDesktop />
              }

                            {/* Bouton Donner */}
              <Link
                to="/don"
                onClick={() => setMenuOpen(false)}
                style={{
                  display: 'inline-flex', flexDirection: 'row',
                  alignItems: 'center', gap: '6px',
                  padding: '10px 20px', borderRadius: '100px',
                  fontSize: '14px', fontWeight: 600,
                  fontFamily: '"DM Sans", sans-serif',
                  textDecoration: 'none',
                  background: C.cyan, color: C.azureDark,
                  boxShadow: '0 4px 14px rgba(48,200,211,0.35)',
                  transition: 'all 0.25s ease', whiteSpace: 'nowrap',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background  = C.cyanDark;
                  e.currentTarget.style.transform   = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow   = '0 8px 20px rgba(48,200,211,0.4)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background  = C.cyan;
                  e.currentTarget.style.transform   = 'translateY(0)';
                  e.currentTarget.style.boxShadow   = '0 4px 14px rgba(48,200,211,0.35)';
                }}
              >
                <Heart size={14} strokeWidth={2.5} />
                Donner
              </Link>
            </div>
          )}

          {/* ══ BURGER — mobile ══ */}
          {isMobile && (
            <button
              onClick={() => setMenuOpen(o => !o)}
              aria-label="Menu"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '8px', borderRadius: '8px', border: 'none',
                background: 'transparent', cursor: 'pointer',
                color: textColor, flexShrink: 0,
              }}
            >
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          )}
        </div>

        {/* ══ MENU MOBILE — drawer ══ */}
        {isMobile && (
          <div style={{
            position: 'absolute', top: `${NAV_HEIGHT}px`, left: 0, right: 0,
            zIndex: 999, overflow: 'hidden',
            maxHeight:  menuOpen ? '560px' : '0px',
            opacity:    menuOpen ? 1 : 0,
            transition: 'max-height 0.3s ease, opacity 0.25s ease',
            background:           scrolled ? 'rgba(255,255,255,0.98)' : 'rgba(10,20,80,0.97)',
            backdropFilter:       'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
          }}>
            <div style={{
              maxWidth: '1280px', margin: '0 auto',
              padding: '16px 24px',
              display: 'flex', flexDirection: 'column', gap: '4px',
            }}>

              {/* Liens de navigation */}
              {NAV_LINKS.map(({ label, path }) => (
                <NavLink key={path} path={path} label={label} mobile />
              ))}

              {/* Séparateur + boutons auth + donner */}
              <div style={{
                display: 'flex', flexDirection: 'row', gap: '10px',
                marginTop: '12px', paddingTop: '12px',
                borderTop: `1px solid ${scrolled ? C.border : 'rgba(255,255,255,0.15)'}`,
                flexWrap: 'wrap',
              }}>

                {/* ✅ Mon Espace si connecté
                    ✅ Connexion si non connecté ET pas sur /login */}
                {user
                  ? <MonEspaceMobile />
                  : !isLoginPage && <ConnexionMobile />
                }

                {/* ✅ Se déconnecter mobile — uniquement sur /dashboard */}
                {user && isDashboard && (
                  <button
                    onClick={() => { logout(); setMenuOpen(false); navigate('/'); }}
                    style={{
                      flex: 1, padding: '10px 16px', borderRadius: '10px',
                      border: '1.5px solid rgba(239,68,68,0.35)',
                      fontSize: '14px', fontWeight: 500,
                      fontFamily: '"DM Sans", sans-serif',
                      cursor: 'pointer', background: 'transparent',
                      color: '#ef4444',
                    }}
                  >
                    Se déconnecter
                  </button>
                )}

                                {/* Bouton Donner */}
                <Link
                  to="/don"
                  onClick={() => setMenuOpen(false)}
                  style={{
                    flex: 1,
                    display: 'flex', flexDirection: 'row',
                    alignItems: 'center', justifyContent: 'center',
                    gap: '6px', padding: '10px 16px',
                    borderRadius: '100px', fontSize: '14px', fontWeight: 600,
                    fontFamily: '"DM Sans", sans-serif',
                    textDecoration: 'none',
                    background: C.cyan, color: C.azureDark,
                  }}
                >
                  <Heart size={13} strokeWidth={2.5} />
                  Donner
                </Link>
              </div>

            </div>
          </div>
        )}
      </nav>
    </>
  );
}