/**
 * src/pages/Profil.jsx
 * ─────────────────────────────────────────────────────────────
 * Page de gestion du profil utilisateur — Association ININ
 *
 * Fonctionnalités :
 *   • Affichage + modification de la photo de profil (prévisualisation)
 *   • Formulaire informations personnelles (2 colonnes)
 *   • Champs en lecture seule : Email, Rôle
 *   • Section changement de mot de passe
 *   • Bouton déconnexion
 *
 * API :
 *   GET   /api/user/profile/         → données profil
 *   PATCH /api/user/profile/update/  → mise à jour (FormData)
 *   POST  /api/user/change-password/ → changement mot de passe
 *
 * Design : Épuré, lumineux — fond gris perle, cartes blanches
 * Typographie : Playfair Display (titres) + DM Sans (corps)
 * ─────────────────────────────────────────────────────────────
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, Link }  from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import {
  Camera, Save, LogOut, Eye, EyeOff,
  CheckCircle2, AlertCircle, Loader2,
  User, Mail, Phone, MapPin, FileText,
  ShieldCheck, ChevronLeft, Sparkles,
  Lock, ArrowLeft,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// ── API endpoints ─────────────────────────────────────────────
const API_PROFILE        = `${import.meta.env.VITE_API_URL}/api/user/profile/`;
const API_PROFILE_UPDATE = `${import.meta.env.VITE_API_URL}/api/user/profile/update/`;
const API_CHANGE_PWD     = `${import.meta.env.VITE_API_URL}/api/user/change-password/`;

const getToken   = () =>
  localStorage.getItem('access_token') ||
  sessionStorage.getItem('access_token') || '';
const authHeader = () => ({ Authorization: `Bearer ${getToken()}` });

// ── Palette ───────────────────────────────────────────────────
const C = {
  // Fonds
  bg:          '#f1f4f9',
  bgDeep:      '#e8edf5',
  white:       '#ffffff',
  offWhite:    '#f8fafc',

  // Bleu azur (primaire)
  azure:       '#1640c8',
  azureLight:  '#eef2ff',
  azureMid:    '#dce4ff',
  azureDark:   '#0f2a96',
  azureGlow:   'rgba(22,64,200,.12)',

  // Texte
  ink:         '#0f172a',
  inkSoft:     '#1e2d45',
  muted:       '#64748b',
  mutedLight:  '#94a3b8',
  border:      '#e2e8f0',
  borderFocus: '#a5b4fc',

  // États
  success:     '#059669',
  successBg:   '#ecfdf5',
  successBorder:'#6ee7b7',
  danger:      '#dc2626',
  dangerBg:    '#fef2f2',
  dangerBorder:'#fca5a5',
  warning:     '#d97706',
  warningBg:   '#fffbeb',

  // Rôles
  roleAdmin:   { color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
  roleTreso:   { color: '#059669', bg: '#ecfdf5', border: '#6ee7b7' },
  roleProjet:  { color: '#0369a1', bg: '#e0f2fe', border: '#7dd3fc' },
  roleRH:      { color: '#b45309', bg: '#fffbeb', border: '#fde68a' },
  rolePart:    { color: '#be185d', bg: '#fdf2f8', border: '#f9a8d4' },
  roleMembre:  { color: '#475569', bg: '#f1f5f9', border: '#cbd5e1' },
};

const NAV_HEIGHT = 85;

// ── Config rôles ──────────────────────────────────────────────
const ROLE_CFG = {
  ADMIN:              { label: 'Administrateur',   ...C.roleAdmin  },
  ADMINISTRATEUR:     { label: 'Administrateur',   ...C.roleAdmin  },
  TRESORIER:          { label: 'Trésorier',        ...C.roleTreso  },
  CHARGE_PROJET:      { label: 'Chargé de Projet', ...C.roleProjet },
  RESPONSABLE_RH:     { label: 'Responsable RH',   ...C.roleRH     },
  CHARGE_PARTENARIAT: { label: 'Chargé Partenariat', ...C.rolePart },
  MEMBRE:             { label: 'Membre',           ...C.roleMembre },
};

const getRoleCfg = (role) =>
  ROLE_CFG[role] ?? { label: role ?? 'Membre', ...C.roleMembre };

const fmtDate = (s) => s
  ? new Date(s).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  : null;

// ── Animations ────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.48, ease: [0.22, 1, 0.36, 1] } },
};
const stagger = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.07 } },
};

// ── Styles champs ─────────────────────────────────────────────
const inputBase = {
  width: '100%',
  padding: '11px 14px',
  border: `1.5px solid ${C.border}`,
  borderRadius: '10px',
  fontSize: '14px',
  fontFamily: '"DM Sans", sans-serif',
  color: C.ink,
  background: C.white,
  outline: 'none',
  transition: 'border-color .2s, box-shadow .2s',
  boxSizing: 'border-box',
};

const inputReadOnly = {
  ...inputBase,
  background: C.offWhite,
  color: C.muted,
  cursor: 'not-allowed',
  borderStyle: 'dashed',
};

const labelStyle = {
  display: 'block',
  fontFamily: '"DM Sans", sans-serif',
  fontSize: '11px',
  fontWeight: 700,
  color: C.muted,
  textTransform: 'uppercase',
  letterSpacing: '0.09em',
  marginBottom: '6px',
};

// ════════════════════════════════════════════════════════════════
// SOUS-COMPOSANTS
// ════════════════════════════════════════════════════════════════

// ── Toast notification ────────────────────────────────────────
function Toast({ type, message, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3800);
    return () => clearTimeout(t);
  }, [onDone]);

  const isSuccess = type === 'success';
  return (
    <motion.div
      initial={{ opacity: 0, y: -16, scale: .96 }}
      animate={{ opacity: 1, y: 0,   scale: 1   }}
      exit={{    opacity: 0, y: -12, scale: .96  }}
      transition={{ duration: .3, ease: [0.22, 1, 0.36, 1] }}
      style={{
        position: 'fixed', top: '24px', left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 2000, minWidth: '280px', maxWidth: '440px',
        background: C.white,
        borderRadius: '14px',
        border: `1.5px solid ${isSuccess ? C.successBorder : C.dangerBorder}`,
        boxShadow: `0 8px 32px ${isSuccess ? 'rgba(5,150,105,.15)' : 'rgba(220,38,38,.15)'}`,
        padding: '14px 18px',
        display: 'flex', alignItems: 'center', gap: '10px',
      }}
    >
      {isSuccess
        ? <CheckCircle2 size={18} style={{ color: C.success, flexShrink: 0 }} />
        : <AlertCircle  size={18} style={{ color: C.danger,  flexShrink: 0 }} />}
      <span style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '13.5px',
        color: C.ink, lineHeight: 1.5 }}>
        {message}
      </span>
      {/* Barre de progression */}
      <motion.div
        initial={{ scaleX: 1 }} animate={{ scaleX: 0 }}
        transition={{ duration: 3.8, ease: 'linear' }}
        style={{
          position: 'absolute', bottom: 0, left: 0,
          height: '3px', width: '100%', originX: 0,
          background: isSuccess ? C.success : C.danger,
          borderRadius: '0 0 14px 14px', opacity: .5,
        }}
      />
    </motion.div>
  );
}

// ── Card wrapper ──────────────────────────────────────────────
function Card({ children, style = {} }) {
  return (
    <motion.div
      variants={fadeUp}
      style={{
        background: C.white,
        borderRadius: '20px',
        border: `1px solid ${C.border}`,
        boxShadow: '0 2px 20px rgba(15,23,42,.06)',
        overflow: 'hidden',
        ...style,
      }}
    >
      {children}
    </motion.div>
  );
}

// ── Card Header ───────────────────────────────────────────────
function CardHeader({ icon: Icon, title, subtitle, accentColor = C.azure }) {
  return (
    <div style={{
      padding: '20px 24px',
      borderBottom: `1px solid ${C.border}`,
      display: 'flex', alignItems: 'center', gap: '12px',
      background: `linear-gradient(135deg,${C.white},${C.offWhite})`,
    }}>
      <div style={{
        width: '38px', height: '38px', borderRadius: '11px',
        background: accentColor + '14',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: `1px solid ${accentColor}20`,
        flexShrink: 0,
      }}>
        <Icon size={17} style={{ color: accentColor }} />
      </div>
      <div>
        <h2 style={{
          fontFamily: '"Playfair Display", serif',
          fontSize: '1.05rem', fontWeight: 700,
          color: C.ink, margin: 0, letterSpacing: '.01em',
        }}>
          {title}
        </h2>
        {subtitle && (
          <p style={{
            fontFamily: '"DM Sans", sans-serif', fontSize: '12px',
            color: C.muted, margin: '2px 0 0',
          }}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}

// ── Champ de formulaire ───────────────────────────────────────
function Field({ label, children }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  );
}

// ── Champ avec icône ──────────────────────────────────────────
function IconInput({ icon: Icon, value, onChange, placeholder, type = 'text',
  readOnly = false, accentColor = C.azure }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      <Icon size={15} style={{
        position: 'absolute', left: '13px', top: '50%',
        transform: 'translateY(-50%)',
        color: focused ? accentColor : C.mutedLight,
        pointerEvents: 'none', transition: 'color .2s',
      }} />
      <input
        type={type} value={value} onChange={onChange}
        placeholder={placeholder} readOnly={readOnly}
        style={{
          ...( readOnly ? inputReadOnly : inputBase ),
          paddingLeft: '38px',
          ...(focused && !readOnly ? {
            borderColor: accentColor,
            boxShadow: `0 0 0 3px ${accentColor}18`,
          } : {}),
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </div>
  );
}

// ── Champ mot de passe ────────────────────────────────────────
function PasswordInput({ value, onChange, placeholder, label }) {
  const [show, setShow]       = useState(false);
  const [focused, setFocused] = useState(false);
  return (
    <Field label={label}>
      <div style={{ position: 'relative' }}>
        <Lock size={15} style={{
          position: 'absolute', left: '13px', top: '50%',
          transform: 'translateY(-50%)',
          color: focused ? C.azure : C.mutedLight,
          pointerEvents: 'none', transition: 'color .2s',
        }} />
        <input
          type={show ? 'text' : 'password'}
          value={value} onChange={onChange}
          placeholder={placeholder}
          style={{
            ...inputBase,
            paddingLeft: '38px', paddingRight: '42px',
            ...(focused ? {
              borderColor: C.azure,
              boxShadow: `0 0 0 3px ${C.azureGlow}`,
            } : {}),
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        <button
          type="button" onClick={() => setShow((p) => !p)}
          style={{
            position: 'absolute', right: '12px', top: '50%',
            transform: 'translateY(-50%)',
            background: 'none', border: 'none',
            color: C.mutedLight, cursor: 'pointer', padding: '2px',
            transition: 'color .2s',
          }}
          onMouseEnter={e => e.currentTarget.style.color = C.azure}
          onMouseLeave={e => e.currentTarget.style.color = C.mutedLight}
        >
          {show ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
    </Field>
  );
}

// ── Barre de force mot de passe ───────────────────────────────
function PasswordStrength({ password }) {
  if (!password) return null;

  let score = 0;
  if (password.length >= 8)            score++;
  if (/[A-Z]/.test(password))          score++;
  if (/[0-9]/.test(password))          score++;
  if (/[^A-Za-z0-9]/.test(password))  score++;

  const levels = [
    { label: 'Faible',    color: C.danger,  width: '25%'  },
    { label: 'Moyen',     color: C.warning, width: '50%'  },
    { label: 'Bon',       color: '#0891b2', width: '75%'  },
    { label: 'Excellent', color: C.success, width: '100%' },
  ];
  const level = levels[Math.max(0, score - 1)];

  return (
    <div style={{ marginTop: '8px' }}>
      <div style={{
        height: '4px', borderRadius: '100px',
        background: C.border, overflow: 'hidden',
      }}>
        <motion.div
          animate={{ width: level.width }}
          transition={{ duration: .4, ease: 'easeOut' }}
          style={{
            height: '100%', borderRadius: '100px',
            background: level.color,
          }}
        />
      </div>
      <span style={{
        fontFamily: '"DM Sans", sans-serif',
        fontSize: '11px', color: level.color,
        fontWeight: 600, marginTop: '4px', display: 'block',
      }}>
        {level.label}
      </span>
    </div>
  );
}

// ── Bouton principal ──────────────────────────────────────────
function BtnPrimary({ onClick, loading, children, color = C.azure, disabled = false, fullWidth = false }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      disabled={loading || disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        gap: '7px',
        padding: '11px 24px',
        borderRadius: '11px',
        border: 'none',
        background: (loading || disabled) ? C.border : (hovered
          ? `linear-gradient(135deg,${color},${color}dd)`
          : `linear-gradient(135deg,${color}ee,${color})`),
        color: (loading || disabled) ? C.mutedLight : C.white,
        fontSize: '13.5px', fontWeight: 700,
        fontFamily: '"DM Sans", sans-serif',
        cursor: (loading || disabled) ? 'not-allowed' : 'pointer',
        boxShadow: (loading || disabled) ? 'none' : (hovered
          ? `0 8px 24px ${color}40`
          : `0 4px 14px ${color}30`),
        transition: 'all .25s',
        transform: hovered && !(loading || disabled) ? 'translateY(-1px)' : 'translateY(0)',
        width: fullWidth ? '100%' : 'auto',
        minWidth: '140px',
      }}
    >
      {loading
        ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Enregistrement…</>
        : children}
    </button>
  );
}

// ════════════════════════════════════════════════════════════════
// PAGE PRINCIPALE
// ════════════════════════════════════════════════════════════════
export default function Profil() {
  const { user: authUser, logout, login } = useAuth();
  const navigate = useNavigate();

  // ── State profil ──────────────────────────────────────────
  const [profile, setProfile]       = useState(null);
  const [loadingProfile, setLdProf] = useState(true);
  const [profileError, setProfErr]  = useState(null);

  // ── State formulaire infos ────────────────────────────────
  const [form, setForm] = useState({
    first_name: '', last_name: '', telephone: '',
    adresse: '',    bio: '',
  });
  const [savingInfo, setSaveInfo] = useState(false);

  // ── State photo ───────────────────────────────────────────
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoFile, setPhotoFile]       = useState(null);
  const fileInputRef = useRef(null);

  // ── State mot de passe ────────────────────────────────────
  const [pwd, setPwd] = useState({
    current: '', newPwd: '', confirm: '',
  });
  const [savingPwd, setSavePwd] = useState(false);

  // ── Toasts ────────────────────────────────────────────────
  const [toast, setToast] = useState(null);
  const showToast = (type, message) => setToast({ type, message, key: Date.now() });

  // ── Chargement du profil ──────────────────────────────────
  const fetchProfile = useCallback(async () => {
    setLdProf(true); setProfErr(null);
    try {
      const { data } = await axios.get(API_PROFILE, { headers: authHeader() });
      setProfile(data);
      setForm({
        first_name: data.first_name ?? '',
        last_name:  data.last_name  ?? '',
        telephone:  data.telephone  ?? '',
        adresse:    data.adresse    ?? '',
        bio:        data.bio        ?? '',
      });
    } catch (e) {
      // Fallback sur les données AuthContext si l'API n'existe pas encore
      if (authUser) {
        setProfile(authUser);
        setForm({
          first_name: authUser.first_name ?? '',
          last_name:  authUser.last_name  ?? '',
          telephone:  authUser.telephone  ?? '',
          adresse:    authUser.adresse    ?? '',
          bio:        authUser.bio        ?? '',
        });
      } else {
        setProfErr('Impossible de charger le profil.');
      }
    } finally {
      setLdProf(false);
    }
  }, [authUser]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  // ── Gestion photo ─────────────────────────────────────────
  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    // Prévisualisation immédiate
    const reader = new FileReader();
    reader.onloadend = () => setPhotoPreview(reader.result);
    reader.readAsDataURL(file);
  };

  // ── Soumission infos + photo ──────────────────────────────
  const handleSaveInfo = async () => {
    setSaveInfo(true);
    try {
      const payload = new FormData();
      Object.entries(form).forEach(([k, v]) => payload.append(k, v ?? ''));
      if (photoFile) payload.append('photo_profil', photoFile);

      const { data } = await axios.patch(API_PROFILE_UPDATE, payload, {
        headers: {
          ...authHeader(),
          // Content-Type automatique via FormData
        },
      });

      // Met à jour AuthContext avec les nouvelles données
      if (login) {
        const stored = localStorage.getItem('access_token')
          ? localStorage
          : sessionStorage;
        const remember = !!localStorage.getItem('access_token');
        login({
          access:       getToken(),
          refresh:      stored.getItem('refresh_token') ?? '',
          email:        data.email        ?? authUser?.email,
          first_name:   data.first_name   ?? form.first_name,
          last_name:    data.last_name    ?? form.last_name,
          role:         data.role         ?? authUser?.role,
          role_label:   data.role_label   ?? authUser?.role_label,
          photo_profil: data.photo_profil ?? photoPreview ?? authUser?.photo_profil,
        }, remember);
      }

      setProfile(data);
      setPhotoFile(null);
      showToast('success', 'Profil mis à jour avec succès.');
    } catch (e) {
      const d = e.response?.data;
      showToast('error', d ? Object.values(d).flat().join(' ') : 'Erreur lors de la mise à jour.');
    } finally {
      setSaveInfo(false);
    }
  };

  // ── Changement mot de passe ───────────────────────────────
  const handleChangePwd = async () => {
    if (!pwd.current.trim())  { showToast('error', 'Mot de passe actuel requis.');  return; }
    if (!pwd.newPwd.trim())   { showToast('error', 'Nouveau mot de passe requis.');  return; }
    if (pwd.newPwd !== pwd.confirm) {
      showToast('error', 'Les mots de passe ne correspondent pas.');
      return;
    }
    if (pwd.newPwd.length < 8) {
      showToast('error', 'Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    setSavePwd(true);
    try {
      await axios.post(API_CHANGE_PWD, {
        old_password:     pwd.current,
        new_password:     pwd.newPwd,
        confirm_password: pwd.confirm,
      }, { headers: authHeader() });
      setPwd({ current: '', newPwd: '', confirm: '' });
      showToast('success', 'Mot de passe modifié avec succès.');
    } catch (e) {
      const d = e.response?.data;
      showToast('error', d ? Object.values(d).flat().join(' ') : 'Erreur lors du changement de mot de passe.');
    } finally {
      setSavePwd(false);
    }
  };

  const handleLogout = () => { logout(); navigate('/', { replace: true }); };

  // ── URL photo affichée ────────────────────────────────────
  const displayedPhoto = photoPreview
    || (profile?.photo_profil
      ? (profile.photo_profil.startsWith('http')
          ? profile.photo_profil
          : `${import.meta.env.VITE_API_URL}${profile.photo_profil}`)
      : null);

  const initials = `${(form.first_name || '?').slice(0, 1)}${(form.last_name || '').slice(0, 1)}`.toUpperCase();
  const roleCfg = getRoleCfg(profile?.role ?? authUser?.role);
  const dateAdhesion = profile?.date_joined ?? profile?.date_adhesion ?? null;

  // ── État de chargement ────────────────────────────────────
  if (loadingProfile) {
    return (
      <div style={{
        minHeight: '100vh', background: C.bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        paddingTop: `${NAV_HEIGHT}px`,
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '50%',
            background: C.azureLight,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Loader2 size={24} style={{ color: C.azure, animation: 'spin 1s linear infinite' }} />
          </div>
          <span style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '14px',
            color: C.muted }}>Chargement du profil…</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,800;1,700&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap');
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes fadeIn  { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        * { box-sizing: border-box; }
        textarea:focus, input:focus { outline: none; }

        /* Responsive grid 2 colonnes */
        .profil-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        @media (max-width: 640px) {
          .profil-grid { grid-template-columns: 1fr; }
        }
        .profil-layout {
          display: grid;
          grid-template-columns: 340px 1fr;
          gap: 24px;
          align-items: start;
        }
        @media (max-width: 960px) {
          .profil-layout { grid-template-columns: 1fr; }
        }

        /* Hover sur photo */
        .photo-overlay {
          position: absolute; inset: 0;
          border-radius: 50%;
          background: rgba(15,23,42,.5);
          display: flex; align-items: center; justify-content: center;
          opacity: 0; transition: opacity .25s;
          cursor: pointer;
        }
        .photo-wrapper:hover .photo-overlay { opacity: 1; }
      `}</style>

      {/* Toast global */}
      <AnimatePresence>
        {toast && (
          <Toast key={toast.key} type={toast.type} message={toast.message}
            onDone={() => setToast(null)} />
        )}
      </AnimatePresence>

      <div style={{
        fontFamily: '"DM Sans", sans-serif',
        background: C.bg,
        minHeight: '100vh',
        paddingTop: `${NAV_HEIGHT}px`,
      }}>

        {/* ── Bannière Hero ──────────────────────────────── */}
        <div style={{
          background: `linear-gradient(135deg,${C.azureDark} 0%,${C.azure} 55%,#3b5ce8 100%)`,
          padding: '36px 24px 68px',
          position: 'relative', overflow: 'hidden',
        }}>
          {/* Décorations */}
          <div style={{ position: 'absolute', top: '-60px', right: '-40px', width: '280px',
            height: '280px', borderRadius: '50%', background: 'rgba(255,255,255,.04)',
            pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: '-30px', left: '15%', width: '220px',
            height: '220px', borderRadius: '50%', background: 'rgba(255,255,255,.03)',
            pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', top: '20px', left: '60%', width: '1px',
            height: '120px', background: 'rgba(255,255,255,.06)', pointerEvents: 'none' }} />

          <div style={{ maxWidth: '1100px', margin: '0 auto', position: 'relative' }}>
            {/* Retour au dashboard */}
            <button
              onClick={() => navigate('/dashboard')}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.2)',
                borderRadius: '100px', padding: '7px 14px',
                color: 'rgba(255,255,255,.8)', fontSize: '12.5px', fontWeight: 600,
                fontFamily: '"DM Sans", sans-serif', cursor: 'pointer',
                transition: 'all .2s', marginBottom: '24px',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,.18)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,.1)'}
            >
              <ArrowLeft size={13} /> Retour au tableau de bord
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
              <div>
                <div style={{
                  fontFamily: '"DM Sans", sans-serif', fontSize: '10.5px', fontWeight: 700,
                  color: 'rgba(255,255,255,.5)', letterSpacing: '0.2em',
                  textTransform: 'uppercase', marginBottom: '6px',
                }}>
                  Compte personnel
                </div>
                <h1 style={{
                  fontFamily: '"Playfair Display", serif',
                  fontSize: 'clamp(1.6rem, 4vw, 2.2rem)',
                  fontWeight: 800, color: '#fff',
                  margin: 0, lineHeight: 1.15,
                }}>
                  Mon Profil
                </h1>
                <div style={{
                  fontFamily: '"DM Sans", sans-serif', fontSize: '13px',
                  color: 'rgba(255,255,255,.5)', marginTop: '6px',
                }}>
                  Gérez vos informations personnelles et la sécurité de votre compte.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Contenu principal ──────────────────────────── */}
        <div style={{
          maxWidth: '1100px', margin: '0 auto',
          padding: '0 24px 80px',
          marginTop: '-40px', // Chevauche la bannière hero
          position: 'relative', zIndex: 1,
        }}>
          <motion.div
            className="profil-layout"
            variants={stagger}
            initial="hidden"
            animate="show"
          >
            {/* ════ COLONNE GAUCHE — Photo + Identité ════ */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

              {/* Carte identité */}
              <Card>
                <div style={{ padding: '32px 24px', textAlign: 'center' }}>
                  {/* Photo de profil */}
                  <div style={{ position: 'relative', display: 'inline-block', marginBottom: '20px' }}>
                    <div
                      className="photo-wrapper"
                      style={{ position: 'relative', width: '110px', height: '110px', margin: '0 auto' }}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {displayedPhoto ? (
                        <img
                          src={displayedPhoto}
                          alt={initials}
                          style={{
                            width: '110px', height: '110px', borderRadius: '50%',
                            objectFit: 'cover',
                            border: `3px solid ${C.white}`,
                            boxShadow: `0 0 0 3px ${C.azure}30, 0 8px 32px rgba(22,64,200,.2)`,
                          }}
                        />
                      ) : (
                        <div style={{
                          width: '110px', height: '110px', borderRadius: '50%',
                          background: `linear-gradient(135deg,${C.azure}cc,${C.azureDark})`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          border: `3px solid ${C.white}`,
                          boxShadow: `0 0 0 3px ${C.azure}30, 0 8px 32px rgba(22,64,200,.2)`,
                        }}>
                          <span style={{
                            fontFamily: '"Playfair Display", serif',
                            fontSize: '2.2rem', fontWeight: 700, color: C.white,
                          }}>
                            {initials}
                          </span>
                        </div>
                      )}

                      {/* Overlay caméra */}
                      <div className="photo-overlay">
                        <div style={{
                          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                        }}>
                          <Camera size={20} style={{ color: C.white }} />
                          <span style={{
                            fontFamily: '"DM Sans", sans-serif', fontSize: '10px',
                            color: C.white, fontWeight: 700,
                          }}>
                            Modifier
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Indicateur de nouvelle photo */}
                    {photoFile && (
                      <div style={{
                        position: 'absolute', bottom: '-4px', right: '-4px',
                        width: '28px', height: '28px', borderRadius: '50%',
                        background: C.success, border: `2px solid ${C.white}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <CheckCircle2 size={14} style={{ color: C.white }} />
                      </div>
                    )}
                  </div>

                  <input
                    ref={fileInputRef} type="file"
                    accept="image/png,image/jpeg,image/webp"
                    style={{ display: 'none' }}
                    onChange={handlePhotoChange}
                  />

                  {/* Nom + rôle */}
                  <h2 style={{
                    fontFamily: '"Playfair Display", serif',
                    fontSize: '1.4rem', fontWeight: 800,
                    color: C.ink, margin: '0 0 8px',
                  }}>
                    {form.first_name} {form.last_name}
                  </h2>

                  {/* Badge rôle */}
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: '5px',
                    padding: '5px 13px', borderRadius: '100px',
                    background: roleCfg.bg,
                    border: `1.5px solid ${roleCfg.border}`,
                    color: roleCfg.color,
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: '11.5px', fontWeight: 700,
                    marginBottom: '14px',
                  }}>
                    <ShieldCheck size={12} />
                    {roleCfg.label}
                  </div>

                  {/* Email */}
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
                    fontFamily: '"DM Sans", sans-serif', fontSize: '13px',
                    color: C.muted, marginBottom: '8px',
                  }}>
                    <Mail size={13} style={{ color: C.mutedLight }} />
                    {profile?.email ?? authUser?.email ?? '—'}
                  </div>

                  {/* Date d'adhésion */}
                  {dateAdhesion && (
                    <div style={{
                      fontFamily: '"DM Sans", sans-serif', fontSize: '12px',
                      color: C.mutedLight,
                    }}>
                      Membre depuis le {fmtDate(dateAdhesion)}
                    </div>
                  )}

                  {/* Bouton modifier photo (clic) */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      marginTop: '18px',
                      display: 'inline-flex', alignItems: 'center', gap: '6px',
                      padding: '9px 18px', borderRadius: '10px',
                      background: C.azureLight, border: `1.5px solid ${C.azure}25`,
                      color: C.azure, fontSize: '12.5px', fontWeight: 700,
                      fontFamily: '"DM Sans", sans-serif', cursor: 'pointer',
                      transition: 'all .2s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = C.azure; e.currentTarget.style.color = C.white; }}
                    onMouseLeave={e => { e.currentTarget.style.background = C.azureLight; e.currentTarget.style.color = C.azure; }}
                  >
                    <Camera size={13} />
                    {photoFile ? 'Photo sélectionnée ✓' : 'Modifier la photo'}
                  </button>

                  {photoFile && (
                    <div style={{
                      marginTop: '8px',
                      fontFamily: '"DM Sans", sans-serif', fontSize: '11.5px',
                      color: C.muted,
                    }}>
                      {photoFile.name}
                    </div>
                  )}
                </div>
              </Card>

              {/* Bouton déconnexion */}
              <Card>
                <div style={{ padding: '20px 24px' }}>
                  <div style={{
                    fontFamily: '"DM Sans", sans-serif', fontSize: '11px', fontWeight: 700,
                    color: C.muted, textTransform: 'uppercase', letterSpacing: '0.09em',
                    marginBottom: '14px',
                  }}>
                    Session
                  </div>
                  <button
                    onClick={handleLogout}
                    style={{
                      width: '100%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                      padding: '11px 20px', borderRadius: '11px',
                      background: C.dangerBg, border: `1.5px solid ${C.dangerBorder}`,
                      color: C.danger, fontSize: '13.5px', fontWeight: 700,
                      fontFamily: '"DM Sans", sans-serif', cursor: 'pointer',
                      transition: 'all .22s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = C.danger; e.currentTarget.style.color = C.white; e.currentTarget.style.boxShadow = `0 6px 18px ${C.danger}30`; }}
                    onMouseLeave={e => { e.currentTarget.style.background = C.dangerBg; e.currentTarget.style.color = C.danger; e.currentTarget.style.boxShadow = 'none'; }}
                  >
                    <LogOut size={15} />
                    Se déconnecter
                  </button>
                </div>
              </Card>
            </div>

            {/* ════ COLONNE DROITE — Formulaires ════ */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

              {/* Informations personnelles */}
              <Card>
                <CardHeader
                  icon={User}
                  title="Informations personnelles"
                  subtitle="Modifiez vos informations de contact et de présentation."
                  accentColor={C.azure}
                />

                <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>

                  {/* Prénom + Nom */}
                  <div className="profil-grid">
                    <Field label="Prénom *">
                      <IconInput
                        icon={User}
                        value={form.first_name}
                        onChange={(e) => setForm((p) => ({ ...p, first_name: e.target.value }))}
                        placeholder="Aminata"
                      />
                    </Field>
                    <Field label="Nom *">
                      <IconInput
                        icon={User}
                        value={form.last_name}
                        onChange={(e) => setForm((p) => ({ ...p, last_name: e.target.value }))}
                        placeholder="Diallo"
                      />
                    </Field>
                  </div>

                  {/* Email (lecture seule) + Rôle */}
                  <div className="profil-grid">
                    <Field label="Email — Lecture seule">
                      <div style={{ position: 'relative' }}>
                        <Mail size={15} style={{
                          position: 'absolute', left: '13px', top: '50%',
                          transform: 'translateY(-50%)',
                          color: C.mutedLight, pointerEvents: 'none',
                        }} />
                        <input
                          type="email"
                          value={profile?.email ?? authUser?.email ?? ''}
                          readOnly
                          style={{ ...inputReadOnly, paddingLeft: '38px' }}
                        />
                      </div>
                      <p style={{
                        fontFamily: '"DM Sans", sans-serif', fontSize: '11px',
                        color: C.mutedLight, margin: '5px 0 0',
                      }}>
                        L'email ne peut pas être modifié pour des raisons de sécurité.
                      </p>
                    </Field>
                    <Field label="Rôle — Lecture seule">
                      <div style={{ position: 'relative' }}>
                        <ShieldCheck size={15} style={{
                          position: 'absolute', left: '13px', top: '50%',
                          transform: 'translateY(-50%)',
                          color: roleCfg.color, pointerEvents: 'none',
                        }} />
                        <input
                          type="text"
                          value={roleCfg.label}
                          readOnly
                          style={{
                            ...inputReadOnly,
                            paddingLeft: '38px',
                            color: roleCfg.color,
                            background: roleCfg.bg,
                            borderColor: roleCfg.border,
                          }}
                        />
                      </div>
                    </Field>
                  </div>

                  {/* Téléphone + Adresse */}
                  <div className="profil-grid">
                    <Field label="Téléphone">
                      <IconInput
                        icon={Phone}
                        value={form.telephone}
                        onChange={(e) => setForm((p) => ({ ...p, telephone: e.target.value }))}
                        placeholder="+221 77 000 00 00"
                      />
                    </Field>
                    <Field label="Adresse">
                      <IconInput
                        icon={MapPin}
                        value={form.adresse}
                        onChange={(e) => setForm((p) => ({ ...p, adresse: e.target.value }))}
                        placeholder="Dakar, Sénégal"
                      />
                    </Field>
                  </div>

                  {/* Bio */}
                  <Field label="Bio / Description">
                    <div style={{ position: 'relative' }}>
                      <FileText size={14} style={{
                        position: 'absolute', left: '13px', top: '14px',
                        color: C.mutedLight, pointerEvents: 'none',
                      }} />
                      <textarea
                        value={form.bio}
                        onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
                        placeholder="Quelques mots sur vous, votre rôle dans l'association…"
                        rows={3}
                        style={{
                          ...inputBase,
                          paddingLeft: '38px',
                          resize: 'vertical', minHeight: '80px',
                        }}
                        onFocus={(e) => { e.target.style.borderColor = C.azure; e.target.style.boxShadow = `0 0 0 3px ${C.azureGlow}`; }}
                        onBlur={(e) => { e.target.style.borderColor = C.border; e.target.style.boxShadow = 'none'; }}
                      />
                    </div>
                    <div style={{
                      fontFamily: '"DM Sans", sans-serif', fontSize: '11px',
                      color: C.mutedLight, marginTop: '4px',
                      textAlign: 'right',
                    }}>
                      {form.bio.length} caractères
                    </div>
                  </Field>

                  {/* Bouton enregistrer */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '4px' }}>
                    <BtnPrimary onClick={handleSaveInfo} loading={savingInfo} color={C.azure}>
                      <Save size={14} /> Enregistrer les modifications
                    </BtnPrimary>
                  </div>
                </div>
              </Card>

              {/* Sécurité — Changement de mot de passe */}
              <Card>
                <CardHeader
                  icon={Lock}
                  title="Sécurité — Mot de passe"
                  subtitle="Choisissez un mot de passe fort d'au moins 8 caractères."
                  accentColor="#7c3aed"
                />

                <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>

                  <PasswordInput
                    label="Mot de passe actuel *"
                    value={pwd.current}
                    onChange={(e) => setPwd((p) => ({ ...p, current: e.target.value }))}
                    placeholder="••••••••"
                  />

                  <div className="profil-grid">
                    <div>
                      <PasswordInput
                        label="Nouveau mot de passe *"
                        value={pwd.newPwd}
                        onChange={(e) => setPwd((p) => ({ ...p, newPwd: e.target.value }))}
                        placeholder="Minimum 8 caractères"
                      />
                      <PasswordStrength password={pwd.newPwd} />
                    </div>

                    <PasswordInput
                      label="Confirmer le nouveau mot de passe *"
                      value={pwd.confirm}
                      onChange={(e) => setPwd((p) => ({ ...p, confirm: e.target.value }))}
                      placeholder="Répéter le mot de passe"
                    />
                  </div>

                  {/* Correspondance */}
                  {pwd.confirm && pwd.newPwd && (
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '7px',
                      padding: '10px 14px', borderRadius: '9px',
                      background: pwd.newPwd === pwd.confirm ? C.successBg : C.dangerBg,
                      border: `1px solid ${pwd.newPwd === pwd.confirm ? C.successBorder : C.dangerBorder}`,
                    }}>
                      {pwd.newPwd === pwd.confirm
                        ? <CheckCircle2 size={14} style={{ color: C.success, flexShrink: 0 }} />
                        : <AlertCircle  size={14} style={{ color: C.danger,  flexShrink: 0 }} />}
                      <span style={{
                        fontFamily: '"DM Sans", sans-serif', fontSize: '12.5px',
                        color: pwd.newPwd === pwd.confirm ? C.success : C.danger,
                        fontWeight: 600,
                      }}>
                        {pwd.newPwd === pwd.confirm
                          ? 'Les mots de passe correspondent.'
                          : 'Les mots de passe ne correspondent pas.'}
                      </span>
                    </div>
                  )}

                  {/* Conseils sécurité */}
                  <div style={{
                    padding: '14px 16px', borderRadius: '11px',
                    background: `linear-gradient(135deg,${C.azureLight},#f0f3ff)`,
                    border: `1px solid ${C.azureMid}`,
                  }}>
                    <div style={{
                      fontFamily: '"DM Sans", sans-serif', fontSize: '11px', fontWeight: 700,
                      color: C.azure, textTransform: 'uppercase', letterSpacing: '0.08em',
                      marginBottom: '8px',
                    }}>
                      Conseils pour un mot de passe sécurisé
                    </div>
                    {[
                      '8 caractères minimum',
                      'Une lettre majuscule',
                      'Un chiffre',
                      'Un caractère spécial (!@#$…)',
                    ].map((tip) => (
                      <div key={tip} style={{
                        display: 'flex', alignItems: 'center', gap: '7px',
                        fontFamily: '"DM Sans", sans-serif', fontSize: '12px',
                        color: C.muted, marginBottom: '4px',
                      }}>
                        <div style={{
                          width: '5px', height: '5px', borderRadius: '50%',
                          background: C.azure, flexShrink: 0, opacity: .6,
                        }} />
                        {tip}
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <BtnPrimary
                      onClick={handleChangePwd}
                      loading={savingPwd}
                      color="#7c3aed"
                      disabled={!pwd.current || !pwd.newPwd || !pwd.confirm || pwd.newPwd !== pwd.confirm}
                    >
                      <ShieldCheck size={14} /> Changer le mot de passe
                    </BtnPrimary>
                  </div>
                </div>
              </Card>

            </div>
            {/* Fin colonne droite */}
          </motion.div>
        </div>
      </div>
    </>
  );
}