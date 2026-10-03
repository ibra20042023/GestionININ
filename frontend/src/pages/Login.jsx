/**
 * src/pages/Login.jsx
 * ─────────────────────────────────────────────────────────────
 * Page Login — Association ININ
 * Layout "Split Screen" :
 *   ├── Gauche  : Image plein écran + overlay ININ + quote
 *   └── Droite  : Formulaire de connexion centré
 *
 * Correction v2 :
 *   ✅ Redirection rôle-aware après login
 *   ✅ navigate('/dashboard') dans tous les cas (DashboardRouter
 *      se charge du rendu selon le rôle — pas besoin d'URL distinctes)
 *   ✅ Le rôle est lu depuis data.role (réponse API) et non depuis
 *      user (state React) pour éviter la course d'état asynchrone
 * ─────────────────────────────────────────────────────────────
 */

import { useState, useEffect } from 'react';
import { Link, useNavigate }   from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Navigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
  Eye, EyeOff, Mail, Lock,
  AlertCircle, ArrowRight, Loader2, CheckCircle2,
} from 'lucide-react';

// ── Config API ────────────────────────────────────────────────
const API_BASE  = import.meta.env.VITE_API_URL;
const TOKEN_URL = `${API_BASE}/api/auth/token/`;

// ── Palette ININ ──────────────────────────────────────────────
const NAV_HEIGHT = 85;

const C = {
  azure:       '#1640c8',
  azureDark:   '#0f172a',
  azureDeep:   '#0f2060',
  azureLight:  '#eef5ff',
  azureAlpha:  'rgba(22,64,200,0.09)',
  cyan:        '#30c8d3',
  cyanDark:    '#17a8b5',
  cyanLight:   '#ecfeff',
  white:       '#ffffff',
  offWhite:    '#f8fafc',
  muted:       '#64748b',
  mutedLight:  '#94a3b8',
  border:      '#e2e8f0',
  error:       '#dc2626',
  errorBg:     '#fef2f2',
  errorBorder: 'rgba(220,38,38,0.25)',
  success:     '#16a34a',
  successBg:   '#f0fdf4',
};

const HERO_IMG = 'https://images.unsplash.com/photo-1529390079861-591de354faf5?w=1200&q=85&auto=format&fit=crop';

// ──────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────

/**
 * Calcule la route de destination selon le rôle.
 * Tous les rôles atterrissent sur /dashboard — le DashboardRouter
 * dans App.jsx sélectionne ensuite le bon composant.
 * On garde une fonction explicite pour faciliter un futur split
 * d'URL (/dashboard/tresorerie, etc.) si nécessaire.
 */
function routeForRole(role) {
  switch (role) {
    case 'TRESORIER':
    case 'CHARGE_PROJET':
    case 'ADMINISTRATEUR':
    case 'RESPONSABLE_RH':
    case 'CHARGE_PARTENARIAT':
    case 'MEMBRE':
    default:
      return '/dashboard';
  }
}

// ──────────────────────────────────────────────────────────────
// Composant Field
// ──────────────────────────────────────────────────────────────
function Field({
  id, label, type = 'text', placeholder,
  value, onChange, icon: Icon,
  rightElement, error, autoComplete,
}) {
  const [focused, setFocused] = useState(false);

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
      <label
        htmlFor={id}
        style={{
          fontFamily:   '"DM Sans", sans-serif',
          fontSize:     '13px',
          fontWeight:   600,
          color:        focused ? C.cyanDark : (error ? C.error : C.azureDark),
          transition:   'color 0.2s',
          letterSpacing:'0.02em',
        }}
      >
        {label}
      </label>

      <div style={{ position:'relative', display:'flex', alignItems:'center' }}>
        {Icon && (
          <div style={{
            position:'absolute', left:'14px',
            color: focused ? C.cyan : (error ? C.error : C.mutedLight),
            transition:'color 0.2s', pointerEvents:'none',
            display:'flex', alignItems:'center',
          }}>
            <Icon size={17} strokeWidth={2} />
          </div>
        )}

        <input
          id={id}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            width:        '100%',
            padding:      `13px ${rightElement ? '44px' : '14px'} 13px ${Icon ? '44px' : '14px'}`,
            borderRadius: '12px',
            border:       `1.5px solid ${
              error   ? C.errorBorder :
              focused ? C.cyan        : C.border
            }`,
            outline:    'none',
            fontFamily: '"DM Sans", sans-serif',
            fontSize:   '15px',
            color:      C.azureDark,
            background: focused ? C.white : C.offWhite,
            boxShadow:  focused
              ? error
                ? `0 0 0 3px rgba(220,38,38,0.12)`
                : `0 0 0 3px rgba(48,200,211,0.18)`
              : 'none',
            transition:  'all 0.2s ease',
            boxSizing:   'border-box',
          }}
        />

        {rightElement && (
          <div style={{ position:'absolute', right:'14px', display:'flex', alignItems:'center' }}>
            {rightElement}
          </div>
        )}
      </div>

      <AnimatePresence>
        {error && (
          <motion.span
            initial={{ opacity:0, y:-4 }}
            animate={{ opacity:1, y:0 }}
            exit={{ opacity:0, y:-4 }}
            transition={{ duration:0.2 }}
            style={{
              fontFamily: '"DM Sans", sans-serif',
              fontSize:   '12px',
              color:      C.error,
              display:    'flex',
              alignItems: 'center',
              gap:        '4px',
            }}
          >
            <AlertCircle size={12} />
            {error}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// PANNEAU GAUCHE
// ──────────────────────────────────────────────────────────────
function LeftPanel() {
  return (
    <div
      className="login-left-panel"
      style={{ flex:'1 1 50%', position:'relative', overflow:'hidden', minHeight:'100vh' }}
    >
      <img
        src={HERO_IMG}
        alt="Jeunesse africaine"
        style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', objectPosition:'center' }}
      />
      <div style={{ position:'absolute', inset:0, background:`linear-gradient(160deg, rgba(15,32,96,0.88) 0%, rgba(22,64,200,0.65) 55%, rgba(23,168,181,0.4) 100%)` }} />

      <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', justifyContent:'space-between', padding:'40px', zIndex:1 }}>
        <Link to="/" style={{ textDecoration:'none', display:'inline-flex', alignItems:'center', gap:'10px' }}>
          <div style={{ width:'38px', height:'38px', borderRadius:'50%', background:`linear-gradient(135deg, ${C.cyan}, rgba(255,255,255,0.3))`, display:'flex', alignItems:'center', justifyContent:'center', border:'1.5px solid rgba(255,255,255,0.3)' }}>
            <span style={{ fontFamily:'"Playfair Display", serif', fontSize:'13px', fontWeight:700, color:C.white }}>IN</span>
          </div>
          <div>
            <div style={{ fontFamily:'"Playfair Display", serif', fontSize:'18px', fontWeight:700, color:C.white, letterSpacing:'0.04em' }}>ININ</div>
            <div style={{ fontFamily:'"DM Sans", sans-serif', fontSize:'9px', letterSpacing:'0.18em', textTransform:'uppercase', color:'rgba(48,200,211,0.9)' }}>Association</div>
          </div>
        </Link>

        <div style={{ maxWidth:'380px' }}>
          <div style={{ width:'3px', height:'48px', background:`linear-gradient(to bottom, ${C.cyan}, transparent)`, marginBottom:'20px', borderRadius:'4px' }} />
          <blockquote style={{ fontFamily:'"Playfair Display", Georgia, serif', fontSize:'clamp(1.3rem, 2vw, 1.65rem)', fontWeight:700, color:C.white, lineHeight:1.4, margin:'0 0 16px', fontStyle:'italic' }}>
            "Ensemble pour une jeunesse en bonne santé."
          </blockquote>
          <div style={{ fontFamily:'"DM Sans", sans-serif', fontSize:'13px', color:'rgba(255,255,255,0.6)', letterSpacing:'0.08em', textTransform:'uppercase' }}>
            — Association ININ
          </div>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// PANNEAU DROIT — formulaire avec redirection rôle-aware
// ──────────────────────────────────────────────────────────────
function RightPanel() {
  const navigate    = useNavigate();
  const { login }   = useAuth();

  const [email,       setEmail]       = useState('');
  const [password,    setPassword]    = useState('');
  const [showPass,    setShowPass]    = useState(false);
  const [remember,    setRemember]    = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [apiError,    setApiError]    = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [success,     setSuccess]     = useState(false);

  const validate = () => {
    const errs = {};
    if (!email.trim())                     errs.email    = 'L\'adresse email est requise';
    else if (!/\S+@\S+\.\S+/.test(email)) errs.email    = 'Adresse email invalide';
    if (!password)                         errs.password = 'Le mot de passe est requis';
    else if (password.length < 6)         errs.password = 'Minimum 6 caractères';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');

    const errs = validate();
    if (Object.keys(errs).length) { setFieldErrors(errs); return; }
    setFieldErrors({});
    setLoading(true);

    try {
      const { data } = await axios.post(TOKEN_URL, {
        email:    email.trim(),
        password,
      });

      // ── Débogage ──────────────────────────────────────────
      console.log('✅ Réponse backend :', data);
      if (!data.role) {
        console.warn('⚠️ Champ "role" manquant — vérifiez CustomTokenObtainPairSerializer');
      }

      // ── 1. Stockage via le contexte ───────────────────────
      // login() : stocke tokens + user_data + positionne axios header
      login(data, remember);

      // ── 2. Feedback visuel ────────────────────────────────
      setSuccess(true);

      // ── 3. Redirection ────────────────────────────────────
      // On lit data.role directement (pas user — state pas encore synchro)
      // Le setTimeout(0) place la navigation APRÈS le flush React
      // pour garantir que le contexte est à jour quand le Dashboard monte
      const destination = routeForRole(data.role ?? 'MEMBRE');
      console.log(`➡️ Redirection → ${destination} (rôle: ${data.role})`);

      setTimeout(() => navigate(destination, { replace: true }), 750);

    } catch (err) {
      if (err.response) {
        const { status, data } = err.response;
        if (status === 401 || status === 400) {
          setApiError(
            data?.detail ||
            data?.non_field_errors?.[0] ||
            'Identifiants incorrects. Vérifiez votre email et mot de passe.',
          );
        } else if (status === 429) {
          setApiError('Trop de tentatives. Réessayez dans quelques minutes.');
        } else {
          setApiError(`Erreur serveur (${status}). Veuillez réessayer.`);
        }
      } else if (err.request) {
        setApiError('Impossible de contacter le serveur. Vérifiez votre connexion.');
      } else {
        setApiError('Une erreur inattendue est survenue.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity:0, x:32 }}
      animate={{ opacity:1, x:0  }}
      transition={{ duration:0.7, ease:[0.22,1,0.36,1] }}
      style={{
        flex:'1 1 50%', minHeight:'100vh', background:C.white,
        display:'flex', flexDirection:'column',
        alignItems:'center', justifyContent:'center',
        paddingTop:`${NAV_HEIGHT + 48}px`, paddingBottom:'48px',
        paddingLeft:'24px', paddingRight:'24px',
        position:'relative', overflowY:'auto',
      }}
    >
      {/* Déco fond */}
      <div style={{ position:'absolute', top:'-60px', right:'-60px', width:'220px', height:'220px', borderRadius:'50%', background:`radial-gradient(circle, ${C.azure}08 0%, transparent 70%)`, pointerEvents:'none' }} />
      <div style={{ position:'absolute', bottom:'-40px', left:'-40px', width:'180px', height:'180px', borderRadius:'50%', background:`radial-gradient(circle, ${C.cyan}0A 0%, transparent 70%)`, pointerEvents:'none' }} />

      <div style={{ width:'100%', maxWidth:'420px', position:'relative' }}>

        {/* Logo mobile */}
        <div className="login-logo-mobile" style={{ marginBottom:'32px', textAlign:'center' }}>
          <Link to="/" style={{ textDecoration:'none', display:'inline-flex', alignItems:'center', gap:'10px', justifyContent:'center' }}>
            <div style={{ width:'36px', height:'36px', borderRadius:'50%', background:`linear-gradient(135deg, ${C.azure}, ${C.cyanDark})`, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <span style={{ fontFamily:'"Playfair Display", serif', fontSize:'13px', fontWeight:700, color:C.white }}>IN</span>
            </div>
            <div>
              <div style={{ fontFamily:'"Playfair Display", serif', fontSize:'18px', fontWeight:700, color:C.azureDark }}>ININ</div>
              <div style={{ fontFamily:'"DM Sans", sans-serif', fontSize:'9px', letterSpacing:'0.18em', textTransform:'uppercase', color:C.cyanDark }}>Association</div>
            </div>
          </Link>
        </div>

        {/* En-tête */}
        <div style={{ marginBottom:'36px' }}>
          <h1 style={{ fontFamily:'"Playfair Display", Georgia, serif', fontSize:'clamp(1.8rem, 3vw, 2.4rem)', fontWeight:800, color:C.azureDark, margin:'0 0 10px', letterSpacing:'-0.01em', lineHeight:1.15 }}>
            Bon retour parmi <em style={{ fontStyle:'italic', color:C.azure }}>nous</em>
          </h1>
          <p style={{ fontFamily:'"DM Sans", sans-serif', fontSize:'15px', color:C.muted, margin:0, lineHeight:1.65 }}>
            Connectez-vous à votre espace membre ININ.
          </p>
        </div>

        {/* Erreur API */}
        <AnimatePresence>
          {apiError && !success && (
            <motion.div
              initial={{ opacity:0, y:-8, scale:0.97 }}
              animate={{ opacity:1, y:0,  scale:1    }}
              exit={{ opacity:0, y:-8 }}
              transition={{ duration:0.3 }}
              style={{ display:'flex', alignItems:'flex-start', gap:'10px', background:C.errorBg, border:`1.5px solid ${C.errorBorder}`, borderRadius:'12px', padding:'14px 16px', marginBottom:'24px' }}
            >
              <AlertCircle size={18} style={{ color:C.error, flexShrink:0, marginTop:'1px' }} />
              <span style={{ fontFamily:'"DM Sans", sans-serif', fontSize:'14px', color:C.error, lineHeight:1.55 }}>
                {apiError}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Succès */}
        <AnimatePresence>
          {success && (
            <motion.div
              initial={{ opacity:0, scale:0.96 }}
              animate={{ opacity:1, scale:1    }}
              style={{ display:'flex', alignItems:'center', gap:'10px', background:'#f0fdf4', border:'1.5px solid rgba(22,163,74,0.25)', borderRadius:'12px', padding:'14px 16px', marginBottom:'24px' }}
            >
              <CheckCircle2 size={18} style={{ color:C.success, flexShrink:0 }} />
              <span style={{ fontFamily:'"DM Sans", sans-serif', fontSize:'14px', color:C.success, fontWeight:600 }}>
                Connexion réussie ! Redirection en cours…
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} noValidate style={{ display:'flex', flexDirection:'column', gap:'20px' }}>

          <Field
            id="email"
            label="Adresse email"
            type="email"
            placeholder="vous@exemple.com"
            value={email}
            onChange={e => { setEmail(e.target.value); setFieldErrors(p=>({...p,email:''})); setApiError(''); }}
            icon={Mail}
            error={fieldErrors.email}
            autoComplete="username email"
          />

          <Field
            id="password"
            label="Mot de passe"
            type={showPass ? 'text' : 'password'}
            placeholder="••••••••"
            value={password}
            onChange={e => { setPassword(e.target.value); setFieldErrors(p=>({...p,password:''})); setApiError(''); }}
            icon={Lock}
            error={fieldErrors.password}
            autoComplete="current-password"
            rightElement={
              <button
                type="button"
                onClick={() => setShowPass(s => !s)}
                style={{ background:'none', border:'none', cursor:'pointer', color:C.mutedLight, padding:'0', display:'flex', alignItems:'center', transition:'color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.color = C.azure}
                onMouseLeave={e => e.currentTarget.style.color = C.mutedLight}
                aria-label={showPass ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
              >
                {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            }
          />

          {/* Se souvenir + Mot de passe oublié */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:'12px', flexWrap:'wrap' }}>
            <label style={{ display:'flex', alignItems:'center', gap:'8px', cursor:'pointer', fontFamily:'"DM Sans", sans-serif', fontSize:'13.5px', color:C.muted, userSelect:'none' }}>
              <div
                onClick={() => setRemember(r => !r)}
                style={{ width:'18px', height:'18px', borderRadius:'5px', flexShrink:0, border:`2px solid ${remember ? C.azure : C.border}`, background: remember ? C.azure : C.white, display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.2s ease', cursor:'pointer' }}
              >
                {remember && (
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
              Se souvenir de moi
            </label>

            <Link
              to="/reset-password"
              style={{ fontFamily:'"DM Sans", sans-serif', fontSize:'13.5px', fontWeight:600, color:C.azure, textDecoration:'none', transition:'color 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.color = C.cyanDark}
              onMouseLeave={e => e.currentTarget.style.color = C.azure}
            >
              Mot de passe oublié ?
            </Link>
          </div>

          {/* Bouton submit */}
          <motion.button
            type="submit"
            disabled={loading || success}
            whileTap={(!loading && !success) ? { scale:0.98 } : {}}
            style={{
              display:'flex', alignItems:'center', justifyContent:'center', gap:'8px',
              padding:'14px 28px', borderRadius:'100px', border:'none',
              cursor: (loading || success) ? 'not-allowed' : 'pointer',
              background: (loading || success)
                ? C.border
                : `linear-gradient(135deg, ${C.azure} 0%, ${C.cyanDark} 100%)`,
              color:      (loading || success) ? C.mutedLight : C.white,
              fontSize:   '15px', fontWeight:700,
              fontFamily: '"DM Sans", sans-serif',
              boxShadow:  (loading || success) ? 'none' : `0 6px 20px rgba(22,64,200,0.30)`,
              transition: 'all 0.25s ease',
              marginTop:  '4px',
            }}
            onMouseEnter={e => { if (!loading && !success) { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow=`0 12px 28px rgba(22,64,200,0.38)`; }}}
            onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; }}
          >
            {loading ? (
              <><Loader2 size={17} style={{ animation:'spin 0.8s linear infinite' }} /> Connexion en cours…</>
            ) : success ? (
              <><CheckCircle2 size={17} /> Connecté !</>
            ) : (
              <>Se connecter <ArrowRight size={16} /></>
            )}
          </motion.button>

        </form>

        {/* Séparateur */}
        <div style={{ display:'flex', alignItems:'center', gap:'12px', margin:'28px 0' }}>
          <div style={{ flex:1, height:'1px', background:C.border }} />
          <span style={{ fontFamily:'"DM Sans", sans-serif', fontSize:'12px', color:C.mutedLight, whiteSpace:'nowrap' }}>Pas encore membre ?</span>
          <div style={{ flex:1, height:'1px', background:C.border }} />
        </div>

        {/* Lien inscription */}
        <Link
          to="/devenir-membre"
          style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', padding:'13px 24px', borderRadius:'100px', border:`1.5px solid ${C.border}`, background:C.white, color:C.azure, fontSize:'14px', fontWeight:600, fontFamily:'"DM Sans", sans-serif', textDecoration:'none', textAlign:'center', transition:'all 0.2s ease' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = C.azure; e.currentTarget.style.background = C.azureLight; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.background = C.white; }}
        >
          Devenir membre ou bénévole
        </Link>

        {/* Retour accueil */}
        <div style={{ textAlign:'center', marginTop:'24px' }}>
          <Link
            to="/"
            style={{ fontFamily:'"DM Sans", sans-serif', fontSize:'13px', color:C.mutedLight, textDecoration:'none', transition:'color 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.color = C.azure}
            onMouseLeave={e => e.currentTarget.style.color = C.mutedLight}
          >
            ← Retour à l'accueil
          </Link>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @media (max-width: 768px) {
          .login-left-panel { display: none !important; }
          .login-logo-mobile { display: block !important; }
        }
        @media (min-width: 769px) {
          .login-logo-mobile { display: none !important; }
        }
      `}</style>
    </motion.div>
  );
}

// ──────────────────────────────────────────────────────────────
// PAGE LOGIN — assemblage Split Screen
// ──────────────────────────────────────────────────────────────
export default function Login() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Redirige si déjà connecté (ex: retour sur /login avec token valide)
  useEffect(() => {
    if (user) navigate('/dashboard', { replace: true });
  }, [user, navigate]);

  return (
    <div style={{ display:'flex', flexDirection:'row', minHeight:'100vh', width:'100%', overflow:'hidden' }}>
      <LeftPanel />
      <RightPanel />
    </div>
  );
}