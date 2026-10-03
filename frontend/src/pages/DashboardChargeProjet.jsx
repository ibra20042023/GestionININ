/**
 * src/pages/DashboardChargeProjet.jsx
 * ─────────────────────────────────────────────────────────────
 * API :
 *  GET   /api/charge-projet/actions/   → liste de ses actions
 *  GET   /api/charge-projet/stats/     → KPIs agrégés
 *  GET   /api/actions/{id}/            → détail complet d'une action
 *  POST  /api/actions/                 → créer (FormData)
 *  PATCH /api/actions/{id}/            → modifier (FormData)
 *  POST  /api/actions/{id}/cloturer/   → clôturer
 * ─────────────────────────────────────────────────────────────
 */

import { useRef, useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import {
  LayoutDashboard, LogOut, Settings, Plus, ChevronRight,
  Clock, AlertCircle, Users, MapPin, Calendar, CreditCard,
  Heart, Zap, Lock, RefreshCw, Loader2, BarChart2, Target,
  Flag, X, ImageIcon, CheckCircle2, Info, Edit3, Eye,
  DollarSign, AlignLeft, Hash, Save, XCircle, User,
  CalendarDays, Maximize2, Image as ImageLucide, FileText,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// ── Palette ───────────────────────────────────────────────────
const C = {
  azure:      '#1640c8',
  azureDark:  '#0f172a',
  azureDeep:  '#0f2060',
  azureLight: '#eef5ff',
  cyan:       '#30c8d3',
  cyanDark:   '#17a8b5',
  cyanLight:  '#ecfeff',
  white:      '#ffffff',
  offWhite:   '#f8fafc',
  muted:      '#64748b',
  mutedLight: '#94a3b8',
  border:     '#e2e8f0',
  success:    '#16a34a',
  successBg:  '#f0fdf4',
  warning:    '#d97706',
  warningBg:  '#fffbeb',
  danger:     '#dc2626',
  dangerBg:   '#fef2f2',
};

const NAV_HEIGHT = 85;

const API_MES_ACTIONS = `${import.meta.env.VITE_API_URL}/api/charge-projet/actions/`;
const API_CP_STATS    = `${import.meta.env.VITE_API_URL}/api/charge-projet/stats/`;
const API_ACTIONS     = `${import.meta.env.VITE_API_URL}/api/actions/`;
const API_CLOTURER    = (id) => `${import.meta.env.VITE_API_URL}/api/actions/${id}/cloturer/`;
const API_DASHBOARD   = `${import.meta.env.VITE_API_URL}/api/membres/me/dashboard/`;

// ── Helpers ───────────────────────────────────────────────────
const getToken = () =>
  localStorage.getItem('access_token') || sessionStorage.getItem('access_token') || '';
const authHeader = () => ({ Authorization: `Bearer ${getToken()}` });

const formatDate = (str) =>
  str ? new Date(str).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
const formatDateInput = (str) => (str ? str.slice(0, 10) : '');
const formatMontant = (val) =>
  val != null
    ? new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(val) + ' FCFA'
    : '—';
const mediaUrl = (path) => {
  if (!path) return null;
  return path.startsWith('http') ? path : `${import.meta.env.VITE_API_URL}${path}`;
};

// ── Utilitaire cotisations ────────────────────────────────────
function genererMoisDepuisDebut() {
  const MOIS_FR = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
  const liste = []; const now = new Date(); let annee = 2025; let moisIdx = 8;
  while (annee < now.getFullYear() || (annee === now.getFullYear() && moisIdx <= now.getMonth())) {
    liste.push(`${MOIS_FR[moisIdx]} ${annee}`); moisIdx++; if (moisIdx > 11) { moisIdx = 0; annee++; }
  }
  return liste;
}

// ── Variants Framer Motion ────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
};
const stagger = (d = 0.08) => ({
  hidden: {},
  show:   { transition: { staggerChildren: d } },
});

// ── Config statuts & types ────────────────────────────────────
const STATUT_CFG = {
  EN_COURS:  { label: 'En cours',  color: C.success,  bg: C.successBg,  dot: true  },
  PLANIFIEE: { label: 'Planifiée', color: C.azure,    bg: C.azureLight, dot: false },
  CLOTUREE:  { label: 'Clôturée', color: C.muted,    bg: '#f1f5f9',    dot: false },
  ANNULEE:   { label: 'Annulée',  color: C.danger,   bg: C.dangerBg,   dot: false },
};

const TYPE_OPTIONS = [
  { value: 'SENSIBILISATION', label: 'Sensibilisation' },
  { value: 'EDUCATION',       label: 'Éducation'       },
  { value: 'ACCOMPAGNEMENT',  label: 'Accompagnement'  },
  { value: 'SOLIDARITE',      label: 'Solidarité'      },
  { value: 'FORMATION',       label: 'Formation'       },
  { value: 'AUTRE',           label: 'Autre'           },
];
const STATUT_OPTIONS = [
  { value: 'PLANIFIEE', label: 'Planifiée' },
  { value: 'EN_COURS',  label: 'En cours'  },
];
const TYPE_LABEL = Object.fromEntries(TYPE_OPTIONS.map(o => [o.value, o.label]));

// ══════════════════════════════════════════════════════════════
// Composants utilitaires
// ══════════════════════════════════════════════════════════════

function Avatar({ user, size = 58 }) {
  const [imgError, setImgError] = useState(false);
  const photoUrl = user?.photo_profil ? mediaUrl(user.photo_profil) : null;
  const displayName = user?.first_name || user?.username || 'C';
  const initials = displayName.slice(0, 2).toUpperCase();
  if (photoUrl && !imgError) {
    return (
      <img src={photoUrl} alt={displayName} onError={() => setImgError(true)}
        style={{ width: `${size}px`, height: `${size}px`, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.32)', flexShrink: 0 }} />
    );
  }
  return (
    <div style={{ width: `${size}px`, height: `${size}px`, borderRadius: '50%', flexShrink: 0, background: 'linear-gradient(135deg,rgba(48,200,211,.6),rgba(22,64,200,.5))', border: '2px solid rgba(255,255,255,0.32)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ fontFamily: '"Playfair Display",serif', fontSize: `${size * 0.37}px`, fontWeight: 700, color: C.white }}>{initials}</span>
    </div>
  );
}

function StatutBadge({ statut, size = 'md' }) {
  const cfg = STATUT_CFG[statut] ?? STATUT_CFG.PLANIFIEE;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: size === 'lg' ? '6px 14px' : '4px 10px', borderRadius: '100px', background: cfg.bg, color: cfg.color, fontSize: size === 'lg' ? '12px' : '11px', fontWeight: 700, fontFamily: '"DM Sans",sans-serif', whiteSpace: 'nowrap' }}>
      {cfg.dot && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: cfg.color, animation: 'pulse 2s infinite', flexShrink: 0 }} />}
      {cfg.label}
    </span>
  );
}

function KpiCard({ icon: Icon, label, value, sub, color, bg, loading }) {
  return (
    <motion.div variants={fadeUp} style={{ background: C.white, borderRadius: '18px', border: `1.5px solid ${C.border}`, padding: '22px 20px', boxShadow: '0 2px 12px rgba(0,0,0,.04)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '11px', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={18} style={{ color }} strokeWidth={1.75} />
        </div>
        {sub && <span style={{ fontFamily: '"DM Sans",sans-serif', fontSize: '11px', fontWeight: 600, color, background: bg, borderRadius: '100px', padding: '3px 9px' }}>{sub}</span>}
      </div>
      {loading
        ? <div style={{ height: '36px', borderRadius: '8px', background: `linear-gradient(90deg,${C.border} 25%,${C.offWhite} 50%,${C.border} 75%)`, backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite', marginBottom: '8px' }} />
        : <div style={{ fontFamily: '"Playfair Display",serif', fontSize: '1.85rem', fontWeight: 800, color: C.azureDark, lineHeight: 1, marginBottom: '5px' }}>{value}</div>
      }
      <div style={{ fontFamily: '"DM Sans",sans-serif', fontSize: '11.5px', fontWeight: 500, color: C.muted, textTransform: 'uppercase', letterSpacing: '.08em' }}>{label}</div>
    </motion.div>
  );
}

// Champ formulaire avec label + erreur
function FormField({ label, required, error, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
      <label style={{ fontFamily: '"DM Sans",sans-serif', fontSize: '11px', fontWeight: 700, color: C.azureDark, textTransform: 'uppercase', letterSpacing: '.07em' }}>
        {label}{required && <span style={{ color: C.danger, marginLeft: '3px' }}>*</span>}
      </label>
      {children}
      {error && <span style={{ fontFamily: '"DM Sans",sans-serif', fontSize: '11px', color: C.danger, display: 'flex', alignItems: 'center', gap: '4px' }}><AlertCircle size={10} />{error}</span>}
    </div>
  );
}

const inputSt = (err = false) => ({
  width: '100%', padding: '9px 12px', borderRadius: '9px',
  border: `1.5px solid ${err ? C.danger : C.border}`,
  fontFamily: '"DM Sans",sans-serif', fontSize: '13px', color: C.azureDark,
  background: C.white, outline: 'none',
  transition: 'border-color .2s,box-shadow .2s', boxSizing: 'border-box',
});

// Ligne info en mode lecture
function InfoRow({ icon: Icon, label, value, color }) {
  if (value === null || value === undefined || value === '') return null;
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '11px', padding: '10px 0', borderBottom: `1px solid ${C.border}` }}>
      <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: C.azureLight, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={13} style={{ color: color ?? C.azure }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: '"DM Sans",sans-serif', fontSize: '10px', fontWeight: 700, color: C.mutedLight, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '2px' }}>{label}</div>
        <div style={{ fontFamily: '"DM Sans",sans-serif', fontSize: '13px', color: C.azureDark, lineHeight: 1.55, wordBreak: 'break-word' }}>{value}</div>
      </div>
    </div>
  );
}

// Chip participant
function ParticipantChip({ utilisateur }) {
  const nom = utilisateur?.first_name
    ? `${utilisateur.first_name} ${utilisateur.last_name}`.trim()
    : utilisateur?.username ?? 'Anonyme';
  const initials = nom.slice(0, 2).toUpperCase();
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 10px', borderRadius: '10px', background: C.offWhite, border: `1px solid ${C.border}` }}>
      <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: `linear-gradient(135deg,${C.azure},${C.cyanDark})`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <span style={{ fontFamily: '"DM Sans",sans-serif', fontSize: '9px', fontWeight: 800, color: C.white }}>{initials}</span>
      </div>
      <span style={{ fontFamily: '"DM Sans",sans-serif', fontSize: '12px', fontWeight: 600, color: C.azureDark, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nom}</span>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// ✅ MODALE DÉTAILS / MODIFICATION
// ══════════════════════════════════════════════════════════════
function ModalDetailsAction({ actionId, onClose, onUpdated }) {

  const [detail,       setDetail]       = useState(null);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [fetchError,   setFetchError]   = useState(null);
  const [editMode,     setEditMode]     = useState(false);
  const [form,         setForm]         = useState({});
  const [imageFile,    setImageFile]    = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [errors,       setErrors]       = useState({});
  const [saving,       setSaving]       = useState(false);
  const [saveError,    setSaveError]    = useState(null);
  const [lightbox,     setLightbox]     = useState(null);

  const fileInputRef = useRef(null);

  // ── Charger le détail ────────────────────────────────────
  const loadDetail = useCallback(async () => {
    setFetchLoading(true);
    setFetchError(null);
    try {
      const { data } = await axios.get(`${API_ACTIONS}${actionId}/`, { headers: authHeader() });
      setDetail(data);
      setForm({
        titre:               data.titre ?? '',
        type:                data.type  ?? 'SENSIBILISATION',
        lieu:                data.lieu  ?? '',
        statut:              data.statut ?? 'PLANIFIEE',
        date_debut:          formatDateInput(data.date_debut),
        date_cloture:        formatDateInput(data.date_cloture),
        description:         data.description ?? '',
        budget_prevu:        data.budget_prevu ?? '',
        nb_participants_max: data.nb_participants_max ?? '',
      });
    } catch (e) {
      console.error('[ModalDetails]', e);
      setFetchError('Impossible de charger les détails de cette action.');
    } finally {
      setFetchLoading(false);
    }
  }, [actionId]);

  useEffect(() => { loadDetail(); }, [loadDetail]);

  // Escape
  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') { if (lightbox) setLightbox(null); else onClose(); } };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose, lightbox]);

  // Bloquer scroll body
  useEffect(() => { document.body.style.overflow = 'hidden'; return () => { document.body.style.overflow = ''; }; }, []);

  // ── Handlers formulaire ──────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: value }));
    if (errors[name]) setErrors(p => ({ ...p, [name]: null }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowed.includes(file.type)) { setErrors(p => ({ ...p, image: 'Format non supporté (JPG, PNG, WEBP, GIF).' })); return; }
    if (file.size > 5 * 1024 * 1024)  { setErrors(p => ({ ...p, image: 'Taille max : 5 Mo.' })); return; }
    setImageFile(file);
    setErrors(p => ({ ...p, image: null }));
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImageFile(null); setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const cancelEdit = () => {
    setEditMode(false); setErrors({}); setSaveError(null);
    setImageFile(null); setImagePreview(null);
    if (detail) {
      setForm({
        titre:               detail.titre ?? '',
        type:                detail.type  ?? 'SENSIBILISATION',
        lieu:                detail.lieu  ?? '',
        statut:              detail.statut ?? 'PLANIFIEE',
        date_debut:          formatDateInput(detail.date_debut),
        date_cloture:        formatDateInput(detail.date_cloture),
        description:         detail.description ?? '',
        budget_prevu:        detail.budget_prevu ?? '',
        nb_participants_max: detail.nb_participants_max ?? '',
      });
    }
  };

  // ── Validation ───────────────────────────────────────────
  const validate = () => {
    const errs = {};
    if (!form.titre.trim()) errs.titre = 'Obligatoire.';
    if (!form.date_debut)   errs.date_debut = 'Obligatoire.';
    if (form.date_cloture && form.date_debut && form.date_cloture < form.date_debut)
      errs.date_cloture = 'Doit être après la date de début.';
    return errs;
  };

  // ── Soumission PATCH via FormData ────────────────────────
  const handleSave = async () => {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true); setSaveError(null);
    try {
      const fd = new FormData();
      fd.append('titre',  form.titre.trim());
      fd.append('type',   form.type);
      fd.append('statut', form.statut);
      if (form.lieu.trim())          fd.append('lieu',               form.lieu.trim());
      if (form.date_debut)           fd.append('date_debut',         form.date_debut);
      if (form.date_cloture)         fd.append('date_cloture',       form.date_cloture);
      if (form.description.trim())   fd.append('description',        form.description.trim());
      if (form.budget_prevu !== '')  fd.append('budget_prevu',       parseFloat(form.budget_prevu) || 0);
      if (form.nb_participants_max !== '') fd.append('nb_participants_max', parseInt(form.nb_participants_max) || 0);
      // ✅ image uniquement si un nouveau fichier a été sélectionné
      if (imageFile) fd.append('image', imageFile, imageFile.name);

      const { data } = await axios.patch(
        `${API_ACTIONS}${actionId}/`, fd, { headers: authHeader() }
      );
      setDetail(data);
      setEditMode(false);
      setImageFile(null); setImagePreview(null);
      onUpdated?.();
    } catch (err) {
      console.error('[ModalDetails PATCH]', err);
      const data = err.response?.data;
      if (data && typeof data === 'object') {
        const fe = {};
        Object.entries(data).forEach(([k, v]) => { fe[k] = Array.isArray(v) ? v[0] : String(v); });
        setErrors(fe);
        setSaveError('Veuillez corriger les erreurs ci-dessous.');
      } else {
        setSaveError('Erreur serveur. Veuillez réessayer.');
      }
    } finally { setSaving(false); }
  };

  // Image principale (champ direct ou première photo)
  const mainImageUrl = (() => {
    if (!detail) return null;
    if (detail.image) return mediaUrl(detail.image);
    if (detail.photos?.length) return mediaUrl(detail.photos[0].image);
    return null;
  })();

  // ── Input focus helpers ──────────────────────────────────
  const onFocus = (color = C.azure) => (e) => {
    e.target.style.borderColor = color;
    e.target.style.boxShadow = `0 0 0 3px ${color}18`;
  };
  const onBlur = (errKey) => (e) => {
    e.target.style.borderColor = errors[errKey] ? C.danger : C.border;
    e.target.style.boxShadow = 'none';
  };

  // ─────────────────────────────────────────────────────────
  return (
    <>
      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <motion.div key="lightbox"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setLightbox(null)}
            style={{ position: 'fixed', inset: 0, zIndex: 1200, background: 'rgba(0,0,0,.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
          >
            <img src={lightbox} alt="Aperçu" style={{ maxWidth: '92vw', maxHeight: '88vh', borderRadius: '12px', objectFit: 'contain', boxShadow: '0 24px 60px rgba(0,0,0,.5)' }} />
            <button onClick={() => setLightbox(null)}
              style={{ position: 'absolute', top: '16px', right: '16px', width: '36px', height: '36px', borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,.15)', color: C.white, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            ><X size={16} /></button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop */}
      <motion.div key="details-backdrop"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        transition={{ duration: 0.22 }}
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(15,32,96,.55)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
      >
        {/* Panneau */}
        <motion.div key="details-panel"
          initial={{ opacity: 0, scale: 0.93, y: 28 }}
          animate={{ opacity: 1, scale: 1,    y: 0  }}
          exit=  {{ opacity: 0, scale: 0.93, y: 28  }}
          transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
          onClick={(e) => e.stopPropagation()}
          style={{ background: C.white, borderRadius: '24px', width: '100%', maxWidth: '840px', maxHeight: '94vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 32px 80px rgba(15,32,96,.28),0 0 0 1px rgba(22,64,200,.08)' }}
        >
          {/* ── En-tête ── */}
          <div style={{ background: `linear-gradient(135deg,${C.azureDeep},${C.cyanDark})`, padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(255,255,255,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {editMode ? <Edit3 size={16} style={{ color: C.cyan }} /> : <Eye size={16} style={{ color: C.cyan }} />}
              </div>
              <div style={{ minWidth: 0 }}>
                <h2 style={{ fontFamily: '"Playfair Display",serif', fontSize: '1.05rem', fontWeight: 800, color: C.white, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {editMode ? "Modifier l'action" : (detail?.titre ?? 'Détails de l\'action')}
                </h2>
                <p style={{ fontFamily: '"DM Sans",sans-serif', fontSize: '11.5px', color: 'rgba(255,255,255,.55)', margin: 0 }}>
                  {editMode ? 'Modifiez les champs puis enregistrez' : 'Informations complètes · participants · images'}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
              {!fetchLoading && !fetchError && (
                editMode
                  ? <button onClick={cancelEdit}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '7px 14px', borderRadius: '100px', border: '1px solid rgba(255,255,255,.25)', background: 'rgba(255,255,255,.1)', color: C.white, fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: '"DM Sans",sans-serif', transition: 'background .2s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,.2)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,.1)'}
                    ><XCircle size={13} /> Annuler</button>
                  : <button onClick={() => setEditMode(true)}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '7px 14px', borderRadius: '100px', border: 'none', background: C.cyan, color: C.azureDeep, fontSize: '12px', fontWeight: 800, cursor: 'pointer', fontFamily: '"DM Sans",sans-serif', transition: 'all .2s' }}
                      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 18px rgba(48,200,211,.45)'; }}
                      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                    ><Edit3 size={13} /> Modifier</button>
              )}
              <button onClick={onClose}
                style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid rgba(255,255,255,.2)', background: 'rgba(255,255,255,.1)', color: C.white, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background .2s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,.22)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,.1)'}
              ><X size={14} /></button>
            </div>
          </div>

          {/* ── Corps ── */}
          <div style={{ overflowY: 'auto', flex: 1 }}>

            {fetchLoading && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '72px 24px', color: C.muted, fontFamily: '"DM Sans",sans-serif', fontSize: '14px' }}>
                <Loader2 size={20} style={{ animation: 'spin 1s linear infinite', color: C.cyanDark }} />
                Chargement des détails…
              </div>
            )}

            {!fetchLoading && fetchError && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '72px 24px', textAlign: 'center' }}>
                <AlertCircle size={32} style={{ color: C.danger }} />
                <p style={{ fontFamily: '"DM Sans",sans-serif', fontSize: '14px', color: C.muted, margin: 0 }}>{fetchError}</p>
                <button onClick={loadDetail}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '9px 20px', borderRadius: '100px', background: C.azure, color: C.white, border: 'none', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: '"DM Sans",sans-serif' }}
                ><RefreshCw size={13} /> Réessayer</button>
              </div>
            )}

            {!fetchLoading && !fetchError && detail && (
              editMode
                /* ══════════════ MODE ÉDITION ══════════════ */
                ? <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>

                    {saveError && (
                      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                        style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '11px 14px', borderRadius: '11px', background: C.dangerBg, border: `1px solid ${C.danger}30` }}
                      >
                        <AlertCircle size={14} style={{ color: C.danger, flexShrink: 0 }} />
                        <span style={{ fontFamily: '"DM Sans",sans-serif', fontSize: '12.5px', color: C.danger }}>{saveError}</span>
                      </motion.div>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                      <FormField label="Titre" required error={errors.titre}>
                        <input name="titre" value={form.titre} onChange={handleChange} placeholder="Titre de l'action" style={inputSt(!!errors.titre)} onFocus={onFocus()} onBlur={onBlur('titre')} />
                      </FormField>
                      <FormField label="Type" required error={errors.type}>
                        <select name="type" value={form.type} onChange={handleChange} style={{ ...inputSt(), cursor: 'pointer' }} onFocus={onFocus()} onBlur={onBlur('type')}>
                          {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                      </FormField>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                      <FormField label="Lieu" error={errors.lieu}>
                        <input name="lieu" value={form.lieu} onChange={handleChange} placeholder="Ex : Dakar" style={inputSt()} onFocus={onFocus()} onBlur={onBlur('lieu')} />
                      </FormField>
                      <FormField label="Statut" required error={errors.statut}>
                        <select name="statut" value={form.statut} onChange={handleChange} style={{ ...inputSt(), cursor: 'pointer' }} onFocus={onFocus()} onBlur={onBlur('statut')}>
                          {STATUT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                      </FormField>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                      <FormField label="Date de début" required error={errors.date_debut}>
                        <input type="date" name="date_debut" value={form.date_debut} onChange={handleChange} style={inputSt(!!errors.date_debut)} onFocus={onFocus()} onBlur={onBlur('date_debut')} />
                      </FormField>
                      <FormField label="Date de fin" error={errors.date_cloture}>
                        <input type="date" name="date_cloture" value={form.date_cloture} onChange={handleChange} style={inputSt(!!errors.date_cloture)} onFocus={onFocus(C.cyanDark)} onBlur={onBlur('date_cloture')} />
                      </FormField>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                      <FormField label="Budget prévu (FCFA)" error={errors.budget_prevu}>
                        <input type="number" name="budget_prevu" value={form.budget_prevu} onChange={handleChange} placeholder="Ex : 500 000" min="0" style={inputSt(!!errors.budget_prevu)} onFocus={onFocus()} onBlur={onBlur('budget_prevu')} />
                      </FormField>
                      <FormField label="Capacité maximale" error={errors.nb_participants_max}>
                        <input type="number" name="nb_participants_max" value={form.nb_participants_max} onChange={handleChange} placeholder="Ex : 50" min="1" style={inputSt(!!errors.nb_participants_max)} onFocus={onFocus()} onBlur={onBlur('nb_participants_max')} />
                      </FormField>
                    </div>

                    <FormField label="Description" error={errors.description}>
                      <textarea name="description" value={form.description} onChange={handleChange} placeholder="Objectifs, déroulement, impact…" rows={4}
                        style={{ ...inputSt(), resize: 'vertical', minHeight: '88px', lineHeight: '1.6' }}
                        onFocus={onFocus()} onBlur={onBlur('description')} />
                    </FormField>

                    {/* ── Upload / remplacement image ── */}
                    <FormField label="Remplacer la photo" error={errors.image}>
                      {/* Preview : nouvelle image ou image actuelle */}
                      {(imagePreview || mainImageUrl) && (
                        <div style={{ position: 'relative', borderRadius: '10px', overflow: 'hidden', border: `1.5px solid ${C.border}`, marginBottom: '8px' }}>
                          <img src={imagePreview ?? mainImageUrl} alt="Aperçu" style={{ width: '100%', height: '150px', objectFit: 'cover', display: 'block' }} />
                          <div style={{ position: 'absolute', top: '8px', right: '8px', display: 'flex', gap: '6px' }}>
                            {!imagePreview && (
                              <span style={{ fontFamily: '"DM Sans",sans-serif', fontSize: '10px', fontWeight: 700, background: 'rgba(15,32,96,.7)', color: C.white, padding: '3px 8px', borderRadius: '100px' }}>Image actuelle</span>
                            )}
                            {imagePreview && (
                              <button onClick={removeImage}
                                style={{ width: '24px', height: '24px', borderRadius: '50%', border: 'none', background: 'rgba(220,38,38,.85)', color: C.white, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                              ><X size={11} /></button>
                            )}
                          </div>
                          {imagePreview && (
                            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '5px 10px', background: 'linear-gradient(transparent,rgba(15,32,96,.65))' }}>
                              <span style={{ fontFamily: '"DM Sans",sans-serif', fontSize: '11px', color: C.white, fontWeight: 600 }}>{imageFile?.name}</span>
                            </div>
                          )}
                        </div>
                      )}
                      <div onClick={() => fileInputRef.current?.click()}
                        style={{ border: `2px dashed ${C.border}`, borderRadius: '10px', padding: '14px 18px', background: C.offWhite, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', transition: 'all .2s' }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = C.azure; e.currentTarget.style.background = C.azureLight; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.background = C.offWhite; }}
                      >
                        <ImageLucide size={15} style={{ color: C.azure, flexShrink: 0 }} />
                        <span style={{ fontFamily: '"DM Sans",sans-serif', fontSize: '12.5px', color: C.muted }}>
                          Cliquez pour choisir une nouvelle image (JPG, PNG, WEBP — max 5 Mo)
                        </span>
                      </div>
                      <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleImageChange} style={{ display: 'none' }} />
                    </FormField>

                  </div>

                /* ══════════════ MODE LECTURE ══════════════ */
                : <div style={{ display: 'flex', flexDirection: 'column' }}>

                    {/* Image principale cliquable */}
                    {mainImageUrl && (
                      <div style={{ position: 'relative', height: '210px', overflow: 'hidden', cursor: 'zoom-in' }} onClick={() => setLightbox(mainImageUrl)}>
                        <img src={mainImageUrl} alt={detail.titre} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 55%, rgba(15,32,96,.45))', display: 'flex', alignItems: 'flex-end', padding: '12px 18px' }}>
                          <span style={{ fontFamily: '"DM Sans",sans-serif', fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,.85)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <Maximize2 size={11} /> Cliquez pour agrandir
                          </span>
                        </div>
                      </div>
                    )}

                    <div style={{ padding: '20px 24px' }}>

                      {/* Titre + badges */}
                      <div style={{ marginBottom: '16px' }}>
                        <h3 style={{ fontFamily: '"Playfair Display",serif', fontSize: '1.3rem', fontWeight: 800, color: C.azureDark, margin: '0 0 10px' }}>{detail.titre}</h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <StatutBadge statut={detail.statut} size="lg" />
                          <span style={{ fontFamily: '"DM Sans",sans-serif', fontSize: '12px', fontWeight: 600, color: C.cyanDark, background: C.cyanLight, padding: '4px 10px', borderRadius: '100px' }}>
                            {TYPE_LABEL[detail.type] ?? detail.type}
                          </span>
                        </div>
                      </div>

                      {/* Grille 2 colonnes d'infos */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 28px' }}>
                        <div>
                          <InfoRow icon={CalendarDays} label="Date de début"  value={formatDate(detail.date_debut)} />
                          <InfoRow icon={CalendarDays} label="Date de fin"    value={formatDate(detail.date_cloture)} color={C.cyanDark} />
                          <InfoRow icon={MapPin}       label="Lieu"           value={detail.lieu} />
                          <InfoRow icon={DollarSign}   label="Budget prévu"   value={formatMontant(detail.budget_prevu)} color={C.success} />
                        </div>
                        <div>
                          <InfoRow icon={DollarSign}   label="Budget restant" value={formatMontant(detail.budget_restant)} color={parseFloat(detail.budget_restant) < 0 ? C.danger : C.success} />
                          <InfoRow icon={Hash}         label="Capacité max"   value={detail.nb_participants_max ? `${detail.nb_participants_max} places` : null} />
                          <InfoRow icon={Users}        label="Inscrits"       value={`${detail.participants_count ?? detail.nb_participants ?? 0} participant·e·s`} color={C.azure} />
                          <InfoRow icon={User}         label="Responsable"    value={detail.responsable ? `${detail.responsable.first_name ?? ''} ${detail.responsable.last_name ?? ''}`.trim() : null} />
                        </div>
                      </div>

                      {/* Description */}
                      {detail.description && (
                        <div style={{ marginTop: '6px', paddingTop: '14px', borderTop: `1px solid ${C.border}` }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                            <AlignLeft size={13} style={{ color: C.azure }} />
                            <span style={{ fontFamily: '"DM Sans",sans-serif', fontSize: '10px', fontWeight: 700, color: C.mutedLight, textTransform: 'uppercase', letterSpacing: '.08em' }}>Description</span>
                          </div>
                          <p style={{ fontFamily: '"DM Sans",sans-serif', fontSize: '13.5px', color: C.muted, lineHeight: 1.7, margin: 0 }}>{detail.description}</p>
                        </div>
                      )}

                      {/* Galerie photos supplémentaires */}
                      {detail.photos?.length > 1 && (
                        <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: `1px solid ${C.border}` }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                            <ImageLucide size={13} style={{ color: C.azure }} />
                            <span style={{ fontFamily: '"DM Sans",sans-serif', fontSize: '10px', fontWeight: 700, color: C.mutedLight, textTransform: 'uppercase', letterSpacing: '.08em' }}>Photos ({detail.photos.length})</span>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(90px,1fr))', gap: '8px' }}>
                            {detail.photos.map((p, i) => (
                              <div key={i} onClick={() => setLightbox(mediaUrl(p.image))}
                                style={{ aspectRatio: '1', borderRadius: '10px', overflow: 'hidden', cursor: 'zoom-in', border: `1.5px solid ${C.border}`, transition: 'transform .2s' }}
                                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.04)'}
                                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                              >
                                <img src={mediaUrl(p.image)} alt={`Photo ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* ── Participants ── */}
                      <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: `1px solid ${C.border}` }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Users size={13} style={{ color: C.azure }} />
                            <span style={{ fontFamily: '"DM Sans",sans-serif', fontSize: '10px', fontWeight: 700, color: C.mutedLight, textTransform: 'uppercase', letterSpacing: '.08em' }}>Participants</span>
                          </div>
                          <span style={{ fontFamily: '"DM Sans",sans-serif', fontSize: '11px', fontWeight: 700, color: C.azure, background: C.azureLight, padding: '3px 9px', borderRadius: '100px' }}>
                            {detail.participants_count ?? detail.nb_participants ?? 0}
                            {detail.nb_participants_max ? ` / ${detail.nb_participants_max}` : ''}
                          </span>
                        </div>

                        {/* Barre de remplissage */}
                        {detail.nb_participants_max > 0 && (() => {
                          const count = detail.participants_count ?? detail.nb_participants ?? 0;
                          const pct   = Math.min(100, Math.round((count / detail.nb_participants_max) * 100));
                          const barColor = pct >= 90 ? C.danger : pct >= 60 ? C.warning : C.success;
                          return (
                            <div style={{ marginBottom: '12px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                <span style={{ fontFamily: '"DM Sans",sans-serif', fontSize: '11px', color: C.muted }}>{pct}% rempli</span>
                                <span style={{ fontFamily: '"DM Sans",sans-serif', fontSize: '11px', fontWeight: 700, color: barColor }}>{detail.nb_participants_max - count} places restantes</span>
                              </div>
                              <div style={{ height: '6px', background: C.border, borderRadius: '10px', overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg,${C.azure},${barColor})`, borderRadius: '10px', transition: 'width 1s ease' }} />
                              </div>
                            </div>
                          );
                        })()}

                        {/* Liste inscrits */}
                        {detail.inscriptions?.length > 0
                          ? <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: '6px' }}>
                              {detail.inscriptions.map((insc, i) => (
                                <ParticipantChip key={i} utilisateur={insc.utilisateur ?? insc} />
                              ))}
                            </div>
                          : <div style={{ padding: '16px', borderRadius: '10px', background: C.offWhite, textAlign: 'center', fontFamily: '"DM Sans",sans-serif', fontSize: '12.5px', color: C.mutedLight }}>
                              Aucun participant inscrit pour le moment.
                            </div>
                        }
                      </div>

                    </div>
                  </div>
            )}
          </div>

          {/* ── Pied de modale ── */}
          <div style={{ padding: '14px 24px', borderTop: `1.5px solid ${C.border}`, display: 'flex', justifyContent: 'flex-end', gap: '10px', flexShrink: 0, background: C.offWhite }}>
            {editMode && !fetchLoading && !fetchError
              ? <>
                  <button onClick={cancelEdit} disabled={saving}
                    style={{ padding: '9px 20px', borderRadius: '100px', border: `1.5px solid ${C.border}`, background: C.white, color: C.muted, fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: '"DM Sans",sans-serif', opacity: saving ? 0.6 : 1 }}
                  >Annuler</button>
                  <button onClick={handleSave} disabled={saving}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '9px 24px', borderRadius: '100px', border: 'none', background: saving ? C.mutedLight : `linear-gradient(135deg,${C.azure},${C.cyanDark})`, color: C.white, fontSize: '13px', fontWeight: 700, cursor: saving ? 'wait' : 'pointer', fontFamily: '"DM Sans",sans-serif', boxShadow: saving ? 'none' : `0 4px 16px ${C.azure}40`, transition: 'all .2s' }}
                    onMouseEnter={e => { if (!saving) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = `0 8px 22px ${C.azure}50`; }}}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = saving ? 'none' : `0 4px 16px ${C.azure}40`; }}
                  >
                    {saving ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Enregistrement…</> : <><Save size={14} /> Enregistrer</>}
                  </button>
                </>
              : <button onClick={onClose}
                  style={{ padding: '9px 24px', borderRadius: '100px', border: `1.5px solid ${C.border}`, background: C.white, color: C.muted, fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: '"DM Sans",sans-serif', transition: 'border-color .2s' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = C.muted}
                  onMouseLeave={e => e.currentTarget.style.borderColor = C.border}
                >Fermer</button>
            }
          </div>

        </motion.div>
      </motion.div>
    </>
  );
}

// ══════════════════════════════════════════════════════════════
// Ligne action dans le tableau de pilotage
// ══════════════════════════════════════════════════════════════
function ActionRow({ action, onCloturer, onOpenDetails, index }) {
  const [hov, setHov]         = useState(false);
  const [loading, setLoading] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const ref    = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });

  const pct = (() => {
    const p = parseFloat(action.budget_prevu);
    const r = parseFloat(action.budget_restant ?? action.budget_prevu);
    if (!p) return 0;
    return Math.min(100, Math.max(0, Math.round(((p - r) / p) * 100)));
  })();

  const peutCloturer = ['EN_COURS', 'PLANIFIEE'].includes(action.statut);

  const handleCloturer = async () => {
    setLoading(true); setConfirm(false);
    try {
      await axios.post(API_CLOTURER(action.id), {}, { headers: authHeader() });
      onCloturer(action.id);
    } catch (err) { console.error('[Clôture]', err); }
    finally { setLoading(false); }
  };

  return (
    <>
      <motion.tr ref={ref} variants={fadeUp} initial="hidden"
        animate={inView ? 'show' : 'hidden'} transition={{ delay: index * 0.06 }}
        onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
        style={{ background: hov ? C.offWhite : C.white, transition: 'background .2s' }}
      >
        <td style={{ padding: '18px 20px', verticalAlign: 'middle', borderBottom: `1px solid ${C.border}` }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontFamily: '"DM Sans",sans-serif', fontSize: '14px', fontWeight: 700, color: C.azureDark }}>{action.titre}</span>
            <span style={{ fontFamily: '"DM Sans",sans-serif', fontSize: '11px', fontWeight: 600, color: C.cyanDark, textTransform: 'uppercase', letterSpacing: '.08em' }}>
              {TYPE_LABEL[action.type] ?? action.type}
            </span>
          </div>
        </td>
        <td style={{ padding: '18px 16px', verticalAlign: 'middle', borderBottom: `1px solid ${C.border}`, whiteSpace: 'nowrap' }}>
          <StatutBadge statut={action.statut} />
        </td>
        <td style={{ padding: '18px 16px', verticalAlign: 'middle', borderBottom: `1px solid ${C.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontFamily: '"DM Sans",sans-serif', fontSize: '13px', color: C.muted }}>
            <Calendar size={13} style={{ color: C.mutedLight, flexShrink: 0 }} />
            {formatDate(action.date_debut)}
          </div>
        </td>
        <td style={{ padding: '18px 16px', verticalAlign: 'middle', borderBottom: `1px solid ${C.border}` }}>
          {action.lieu
            ? <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontFamily: '"DM Sans",sans-serif', fontSize: '13px', color: C.muted }}>
                <MapPin size={13} style={{ color: C.mutedLight, flexShrink: 0 }} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '130px' }}>{action.lieu}</span>
              </div>
            : <span style={{ color: C.border }}>—</span>
          }
        </td>
        <td style={{ padding: '18px 16px', verticalAlign: 'middle', borderBottom: `1px solid ${C.border}`, textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
            <span style={{ fontFamily: '"Playfair Display",serif', fontSize: '1.3rem', fontWeight: 800, color: C.azure, lineHeight: 1 }}>
              {action.participants_count ?? action.nb_participants ?? 0}
            </span>
            <span style={{ fontFamily: '"DM Sans",sans-serif', fontSize: '10px', color: C.mutedLight, textTransform: 'uppercase', letterSpacing: '.08em' }}>participant·e·s</span>
          </div>
        </td>
        <td style={{ padding: '18px 16px', verticalAlign: 'middle', borderBottom: `1px solid ${C.border}`, minWidth: '140px' }}>
          {parseFloat(action.budget_prevu) > 0
            ? <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontFamily: '"DM Sans",sans-serif', fontSize: '11px', color: C.muted }}>{pct}% consommé</span>
                  <span style={{ fontFamily: '"DM Sans",sans-serif', fontSize: '11px', fontWeight: 700, color: pct >= 90 ? C.danger : C.azure }}>{formatMontant(action.budget_restant)}</span>
                </div>
                <div style={{ height: '5px', background: C.border, borderRadius: '10px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: pct >= 90 ? `linear-gradient(90deg,${C.warning},${C.danger})` : `linear-gradient(90deg,${C.azure},${C.cyanDark})`, borderRadius: '10px', transition: 'width 1s ease' }} />
                </div>
              </div>
            : <span style={{ fontFamily: '"DM Sans",sans-serif', fontSize: '12px', color: C.border }}>—</span>
          }
        </td>
        <td style={{ padding: '18px 20px', verticalAlign: 'middle', borderBottom: `1px solid ${C.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end' }}>
            {/* ✅ Bouton Détails → ouvre ModalDetailsAction */}
            <button onClick={() => onOpenDetails(action.id)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '7px 12px', borderRadius: '8px', background: C.offWhite, border: `1.5px solid ${C.border}`, color: C.muted, fontSize: '12px', fontWeight: 600, fontFamily: '"DM Sans",sans-serif', cursor: 'pointer', transition: 'all .2s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = C.azure; e.currentTarget.style.color = C.azure; e.currentTarget.style.background = C.azureLight; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.muted; e.currentTarget.style.background = C.offWhite; }}
            >
              <FileText size={12} /> Détails
            </button>

            {peutCloturer
              ? <button onClick={() => setConfirm(true)} disabled={loading}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '7px 12px', borderRadius: '8px', background: loading ? C.border : C.dangerBg, border: `1.5px solid ${loading ? C.border : C.danger + '40'}`, color: loading ? C.mutedLight : C.danger, fontSize: '12px', fontWeight: 700, cursor: loading ? 'wait' : 'pointer', fontFamily: '"DM Sans",sans-serif', transition: 'all .2s', opacity: loading ? 0.7 : 1 }}
                  onMouseEnter={e => { if (!loading) { e.currentTarget.style.background = C.danger; e.currentTarget.style.color = C.white; }}}
                  onMouseLeave={e => { e.currentTarget.style.background = C.dangerBg; e.currentTarget.style.color = C.danger; }}
                >
                  {loading ? <><Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> En cours…</> : <><Flag size={12} /> Clôturer</>}
                </button>
              : <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '7px 12px', borderRadius: '8px', background: '#f1f5f9', color: C.mutedLight, fontSize: '12px', fontWeight: 600, fontFamily: '"DM Sans",sans-serif' }}>
                  <Lock size={12} /> Fermée
                </span>
            }
          </div>
        </td>
      </motion.tr>

      <AnimatePresence>
        {confirm && (
          <tr>
            <td colSpan={7} style={{ padding: 0, border: 'none' }}>
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.22 }}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', padding: '14px 20px', background: C.dangerBg, borderBottom: `1px solid ${C.danger}25` }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <AlertCircle size={16} style={{ color: C.danger, flexShrink: 0 }} />
                  <span style={{ fontFamily: '"DM Sans",sans-serif', fontSize: '13px', color: C.azureDark }}>
                    Confirmer la clôture de <strong>"{action.titre}"</strong> ? Irréversible.
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => setConfirm(false)} style={{ padding: '7px 14px', borderRadius: '8px', border: `1.5px solid ${C.border}`, background: C.white, color: C.muted, fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: '"DM Sans",sans-serif' }}>Annuler</button>
                  <button onClick={handleCloturer} style={{ padding: '7px 14px', borderRadius: '8px', border: 'none', background: C.danger, color: C.white, fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: '"DM Sans",sans-serif', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Flag size={12} /> Confirmer
                  </button>
                </div>
              </motion.div>
            </td>
          </tr>
        )}
      </AnimatePresence>
    </>
  );
}

// ══════════════════════════════════════════════════════════════
// Modale Nouvelle Action (création POST)
// ══════════════════════════════════════════════════════════════
function ModalNouvelleAction({ onClose, onSuccess }) {
  const INIT = { titre: '', type: 'SENSIBILISATION', lieu: '', date_debut: '', date_cloture: '', description: '', statut: 'PLANIFIEE', nb_participants_max: '', budget_prevu: '' };
  const [form, setForm]               = useState(INIT);
  const [imageFile, setImageFile]     = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [errors, setErrors]           = useState({});
  const [submitting, setSubmitting]   = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const fileRef = useRef(null);

  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);
  useEffect(() => { document.body.style.overflow = 'hidden'; return () => { document.body.style.overflow = ''; }; }, []);

  const handleChange = (e) => { const { name, value } = e.target; setForm(p => ({ ...p, [name]: value })); if (errors[name]) setErrors(p => ({ ...p, [name]: null })); };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    if (!['image/jpeg','image/png','image/webp','image/gif'].includes(file.type)) { setErrors(p => ({ ...p, image: 'Format non supporté.' })); return; }
    if (file.size > 5 * 1024 * 1024) { setErrors(p => ({ ...p, image: 'Max 5 Mo.' })); return; }
    setImageFile(file); setErrors(p => ({ ...p, image: null }));
    const r = new FileReader(); r.onload = (ev) => setImagePreview(ev.target.result); r.readAsDataURL(file);
  };

  const removeImage = () => { setImageFile(null); setImagePreview(null); if (fileRef.current) fileRef.current.value = ''; };

  const validate = () => {
    const e = {};
    if (!form.titre.trim()) e.titre = 'Obligatoire.';
    if (!form.date_debut)   e.date_debut = 'Obligatoire.';
    if (form.date_cloture && form.date_debut && form.date_cloture < form.date_debut) e.date_cloture = 'Doit être après la date de début.';
    return e;
  };

  const handleSubmit = async () => {
    const e = validate(); if (Object.keys(e).length) { setErrors(e); return; }
    setSubmitting(true); setSubmitError(null);
    try {
      const fd = new FormData();
      fd.append('titre', form.titre.trim()); fd.append('type', form.type); fd.append('statut', form.statut);
      if (form.lieu.trim())         fd.append('lieu', form.lieu.trim());
      if (form.date_debut)          fd.append('date_debut', form.date_debut);
      if (form.date_cloture)        fd.append('date_cloture', form.date_cloture);
      if (form.description.trim())  fd.append('description', form.description.trim());
      if (form.budget_prevu)        fd.append('budget_prevu', parseFloat(form.budget_prevu));
      if (form.nb_participants_max) fd.append('nb_participants_max', parseInt(form.nb_participants_max));
      if (imageFile)                fd.append('image', imageFile, imageFile.name);
      await axios.post(API_ACTIONS, fd, { headers: authHeader() });
      onSuccess(); onClose();
    } catch (err) {
      const d = err.response?.data;
      if (d && typeof d === 'object') { const fe = {}; Object.entries(d).forEach(([k, v]) => { fe[k] = Array.isArray(v) ? v[0] : String(v); }); setErrors(fe); setSubmitError('Corrigez les erreurs.'); }
      else { setSubmitError('Erreur serveur.'); }
    } finally { setSubmitting(false); }
  };

  const F = (name, label, req, err, rest = {}) => (
    <FormField label={label} required={req} error={errors[name]}>
      <input name={name} value={form[name]} onChange={handleChange} style={inputSt(!!errors[name])}
        onFocus={e => { e.target.style.borderColor = C.azure; e.target.style.boxShadow = `0 0 0 3px ${C.azure}18`; }}
        onBlur={e => { e.target.style.borderColor = errors[name] ? C.danger : C.border; e.target.style.boxShadow = 'none'; }}
        {...rest} />
    </FormField>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.22 }}
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(15,32,96,.55)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
    >
      <motion.div initial={{ opacity: 0, scale: 0.94, y: 24 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.94, y: 24 }}
        transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
        onClick={e => e.stopPropagation()}
        style={{ background: C.white, borderRadius: '24px', width: '100%', maxWidth: '680px', maxHeight: '92vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 32px 80px rgba(15,32,96,.28)' }}
      >
        {/* Header */}
        <div style={{ background: `linear-gradient(135deg,${C.azureDeep},${C.cyanDark})`, padding: '22px 26px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(255,255,255,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Plus size={17} style={{ color: C.cyan }} strokeWidth={2.5} />
            </div>
            <div>
              <h2 style={{ fontFamily: '"Playfair Display",serif', fontSize: '1.1rem', fontWeight: 800, color: C.white, margin: 0 }}>Nouvelle Action</h2>
              <p style={{ fontFamily: '"DM Sans",sans-serif', fontSize: '11.5px', color: 'rgba(255,255,255,.55)', margin: 0 }}>Remplissez les informations du projet</p>
            </div>
          </div>
          <button onClick={onClose} style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid rgba(255,255,255,.2)', background: 'rgba(255,255,255,.1)', color: C.white, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={14} /></button>
        </div>

        {/* Corps */}
        <div style={{ overflowY: 'auto', padding: '22px', display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
          {submitError && <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderRadius: '10px', background: C.dangerBg, border: `1px solid ${C.danger}30` }}><AlertCircle size={14} style={{ color: C.danger }} /><span style={{ fontFamily: '"DM Sans",sans-serif', fontSize: '12.5px', color: C.danger }}>{submitError}</span></div>}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {F('titre', 'Titre', true, errors.titre, { placeholder: "Titre de l'action" })}
            <FormField label="Type" required error={errors.type}>
              <select name="type" value={form.type} onChange={handleChange} style={{ ...inputSt(), cursor: 'pointer' }} onFocus={e => { e.target.style.borderColor = C.azure; e.target.style.boxShadow = `0 0 0 3px ${C.azure}18`; }} onBlur={e => { e.target.style.borderColor = C.border; e.target.style.boxShadow = 'none'; }}>
                {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </FormField>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {F('lieu', 'Lieu', false, errors.lieu, { placeholder: 'Ex : Dakar' })}
            <FormField label="Statut" required error={errors.statut}>
              <select name="statut" value={form.statut} onChange={handleChange} style={{ ...inputSt(), cursor: 'pointer' }} onFocus={e => { e.target.style.borderColor = C.azure; e.target.style.boxShadow = `0 0 0 3px ${C.azure}18`; }} onBlur={e => { e.target.style.borderColor = C.border; e.target.style.boxShadow = 'none'; }}>
                {STATUT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </FormField>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {F('date_debut', 'Date de début', true, errors.date_debut, { type: 'date' })}
            {F('date_cloture', 'Date de fin', false, errors.date_cloture, { type: 'date' })}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {F('budget_prevu', 'Budget (FCFA)', false, errors.budget_prevu, { type: 'number', placeholder: 'Ex : 500000', min: '0' })}
            {F('nb_participants_max', 'Capacité max', false, errors.nb_participants_max, { type: 'number', placeholder: 'Ex : 50', min: '1' })}
          </div>
          <FormField label="Description" error={errors.description}>
            <textarea name="description" value={form.description} onChange={handleChange} placeholder="Objectifs, déroulement, impact…" rows={3}
              style={{ ...inputSt(), resize: 'vertical', minHeight: '80px', lineHeight: '1.6' }}
              onFocus={e => { e.target.style.borderColor = C.azure; e.target.style.boxShadow = `0 0 0 3px ${C.azure}18`; }}
              onBlur={e => { e.target.style.borderColor = C.border; e.target.style.boxShadow = 'none'; }} />
          </FormField>
          <FormField label="Photo" error={errors.image}>
            {imagePreview
              ? <div style={{ position: 'relative', borderRadius: '10px', overflow: 'hidden', border: `1.5px solid ${C.border}` }}>
                  <img src={imagePreview} alt="Aperçu" style={{ width: '100%', height: '130px', objectFit: 'cover', display: 'block' }} />
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '5px 10px', background: 'linear-gradient(transparent,rgba(15,32,96,.65))', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontFamily: '"DM Sans",sans-serif', fontSize: '11px', color: C.white, fontWeight: 600 }}>{imageFile?.name}</span>
                    <button onClick={removeImage} style={{ width: '22px', height: '22px', borderRadius: '50%', border: 'none', background: 'rgba(220,38,38,.85)', color: C.white, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={10} /></button>
                  </div>
                </div>
              : <div onClick={() => fileRef.current?.click()}
                  style={{ border: `2px dashed ${C.border}`, borderRadius: '10px', padding: '18px', background: C.offWhite, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '7px', transition: 'all .2s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = C.azure; e.currentTarget.style.background = C.azureLight; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.background = C.offWhite; }}
                >
                  <ImageIcon size={17} style={{ color: C.azure }} />
                  <span style={{ fontFamily: '"DM Sans",sans-serif', fontSize: '12px', color: C.muted }}>Cliquez ou glissez une image — JPG, PNG, WEBP, max 5 Mo</span>
                </div>
            }
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleImageChange} style={{ display: 'none' }} />
          </FormField>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '10px 13px', borderRadius: '10px', background: C.cyanLight, border: `1px solid ${C.cyanDark}25` }}>
            <Info size={13} style={{ color: C.cyanDark, flexShrink: 0, marginTop: '1px' }} />
            <span style={{ fontFamily: '"DM Sans",sans-serif', fontSize: '11.5px', color: C.cyanDark, lineHeight: 1.5 }}>Vous serez automatiquement assigné·e comme <strong>responsable</strong> de cette action.</span>
          </div>
        </div>

        {/* Pied */}
        <div style={{ padding: '14px 22px', borderTop: `1.5px solid ${C.border}`, display: 'flex', justifyContent: 'flex-end', gap: '10px', flexShrink: 0, background: C.offWhite }}>
          <button onClick={onClose} disabled={submitting} style={{ padding: '9px 20px', borderRadius: '100px', border: `1.5px solid ${C.border}`, background: C.white, color: C.muted, fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: '"DM Sans",sans-serif', opacity: submitting ? 0.6 : 1 }}>Annuler</button>
          <button onClick={handleSubmit} disabled={submitting}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '9px 24px', borderRadius: '100px', border: 'none', background: submitting ? C.mutedLight : `linear-gradient(135deg,${C.azure},${C.cyanDark})`, color: C.white, fontSize: '13px', fontWeight: 700, cursor: submitting ? 'wait' : 'pointer', fontFamily: '"DM Sans",sans-serif', boxShadow: submitting ? 'none' : `0 4px 16px ${C.azure}40`, transition: 'all .2s' }}
          >
            {submitting ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />Création…</> : <><CheckCircle2 size={14} />Créer l'action</>}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ══════════════════════════════════════════════════════════════
// Modale Cotisations (identique à DashboardMembre)
// ══════════════════════════════════════════════════════════════
function ModaleCotisations({ cotisations, onClose }) {
  const tousLesMois = genererMoisDepuisDebut();
  const payesMap = {};
  if (Array.isArray(cotisations)) {
    cotisations.forEach(c => {
      const key = String(c.mois).replace(/^\w/, ch => ch.toUpperCase());
      payesMap[key] = Boolean(c.paye);
    });
  }
  const nbPayes   = tousLesMois.filter(m => payesMap[m] === true).length;
  const nbImpayes = tousLesMois.length - nbPayes;

  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);
  useEffect(() => { document.body.style.overflow = 'hidden'; return () => { document.body.style.overflow = ''; }; }, []);

  return (
    <AnimatePresence>
      <motion.div key="cotis-backdrop"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, zIndex: 1100, background: 'rgba(15,23,42,.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}
      >
        <motion.div key="cotis-modal"
          initial={{ opacity: 0, scale: 0.94, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.94, y: 20 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          onClick={e => e.stopPropagation()}
          style={{ background: C.white, borderRadius: '24px', border: `1.5px solid ${C.border}`, boxShadow: '0 32px 80px rgba(15,23,42,.22)', width: '100%', maxWidth: '520px', maxHeight: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
        >
          {/* En-tête */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '22px 24px 18px', borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: C.azureLight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CalendarDays size={18} style={{ color: C.azure }} strokeWidth={1.75} />
              </div>
              <div>
                <div style={{ fontFamily: '"Playfair Display",serif', fontSize: '1.1rem', fontWeight: 700, color: C.azureDark, lineHeight: 1.2 }}>Mes cotisations</div>
                <div style={{ fontFamily: '"DM Sans",sans-serif', fontSize: '12px', color: C.muted, marginTop: '2px' }}>Depuis septembre 2025</div>
              </div>
            </div>
            <button onClick={onClose}
              style={{ width: '32px', height: '32px', borderRadius: '50%', border: `1px solid ${C.border}`, background: C.offWhite, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all .2s' }}
              onMouseEnter={e => { e.currentTarget.style.background = C.dangerBg; e.currentTarget.style.borderColor = `${C.danger}40`; }}
              onMouseLeave={e => { e.currentTarget.style.background = C.offWhite; e.currentTarget.style.borderColor = C.border; }}
            ><X size={15} style={{ color: C.muted }} /></button>
          </div>

          {/* KPI résumé */}
          <div style={{ display: 'flex', gap: '12px', padding: '16px 24px', borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
            <div style={{ flex: 1, background: C.successBg, borderRadius: '12px', padding: '12px 16px', border: `1px solid ${C.success}20` }}>
              <div style={{ fontFamily: '"Playfair Display",serif', fontSize: '1.6rem', fontWeight: 800, color: C.success, lineHeight: 1 }}>{nbPayes}</div>
              <div style={{ fontFamily: '"DM Sans",sans-serif', fontSize: '11px', color: C.success, fontWeight: 600, marginTop: '3px', textTransform: 'uppercase', letterSpacing: '.07em' }}>Payé{nbPayes > 1 ? 's' : ''}</div>
            </div>
            <div style={{ flex: 1, background: nbImpayes > 0 ? C.dangerBg : C.offWhite, borderRadius: '12px', padding: '12px 16px', border: `1px solid ${nbImpayes > 0 ? `${C.danger}20` : C.border}` }}>
              <div style={{ fontFamily: '"Playfair Display",serif', fontSize: '1.6rem', fontWeight: 800, color: nbImpayes > 0 ? C.danger : C.muted, lineHeight: 1 }}>{nbImpayes}</div>
              <div style={{ fontFamily: '"DM Sans",sans-serif', fontSize: '11px', color: nbImpayes > 0 ? C.danger : C.muted, fontWeight: 600, marginTop: '3px', textTransform: 'uppercase', letterSpacing: '.07em' }}>Impayé{nbImpayes > 1 ? 's' : ''}</div>
            </div>
            <div style={{ flex: 1, background: C.azureLight, borderRadius: '12px', padding: '12px 16px', border: `1px solid ${C.azure}20` }}>
              <div style={{ fontFamily: '"Playfair Display",serif', fontSize: '1.6rem', fontWeight: 800, color: C.azure, lineHeight: 1 }}>{tousLesMois.length}</div>
              <div style={{ fontFamily: '"DM Sans",sans-serif', fontSize: '11px', color: C.azure, fontWeight: 600, marginTop: '3px', textTransform: 'uppercase', letterSpacing: '.07em' }}>Total</div>
            </div>
          </div>

          {/* Liste scrollable */}
          <div style={{ overflowY: 'auto', flex: 1, padding: '8px 0' }}>
            {tousLesMois.length === 0
              ? <div style={{ textAlign: 'center', padding: '40px 24px', fontFamily: '"DM Sans",sans-serif', fontSize: '14px', color: C.mutedLight }}>Aucune période à afficher.</div>
              : tousLesMois.map((mois, i) => {
                  const paye = payesMap[mois] === true;
                  return (
                    <div key={mois} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 24px', background: i % 2 === 0 ? 'transparent' : C.offWhite, borderBottom: i < tousLesMois.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0, background: paye ? C.success : C.danger, boxShadow: paye ? `0 0 0 3px ${C.success}22` : `0 0 0 3px ${C.danger}22` }} />
                        <span style={{ fontFamily: '"DM Sans",sans-serif', fontSize: '14px', fontWeight: 500, color: C.azureDark }}>{mois}</span>
                      </div>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontFamily: '"DM Sans",sans-serif', fontSize: '11px', fontWeight: 700, color: paye ? C.success : C.danger, background: paye ? C.successBg : C.dangerBg, border: `1px solid ${paye ? `${C.success}30` : `${C.danger}30`}`, borderRadius: '100px', padding: '3px 10px' }}>
                        {paye ? <><CheckCircle2 size={11} /> Payée</> : <><AlertCircle size={11} /> Impayée</>}
                      </span>
                    </div>
                  );
                })
            }
          </div>

          {/* Pied */}
          <div style={{ padding: '16px 24px', borderTop: `1px solid ${C.border}`, flexShrink: 0 }}>
            <button onClick={onClose}
              style={{ width: '100%', padding: '11px', borderRadius: '100px', background: C.offWhite, border: `1.5px solid ${C.border}`, fontFamily: '"DM Sans",sans-serif', fontSize: '14px', fontWeight: 600, color: C.muted, cursor: 'pointer', transition: 'all .2s' }}
              onMouseEnter={e => { e.currentTarget.style.background = C.border; }}
              onMouseLeave={e => { e.currentTarget.style.background = C.offWhite; }}
            >Fermer</button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ── CarteCotisations ──────────────────────────────────────────
function CarteCotisations({ cotisations, loading }) {
  const [hov,        setHov]        = useState(false);
  const [modaleOpen, setModaleOpen] = useState(false);

  const tousLesMois = genererMoisDepuisDebut();
  const payesMap    = {};
  if (Array.isArray(cotisations)) {
    cotisations.forEach(c => {
      const key = String(c.mois).replace(/^\w/, ch => ch.toUpperCase());
      payesMap[key] = Boolean(c.paye);
    });
  }
  const dernierMois = tousLesMois[tousLesMois.length - 1];
  const estAJour    = loading ? null : (payesMap[dernierMois] === true);

  return (
    <>
      <motion.div variants={fadeUp}>
        <div
          onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
          style={{ background: C.white, borderRadius: '18px', border: `1.5px solid ${hov ? `${C.azure}50` : C.border}`, padding: '24px 22px', boxShadow: hov ? `0 14px 40px ${C.azure}14` : '0 2px 12px rgba(0,0,0,.04)', transform: hov ? 'translateY(-4px)' : 'translateY(0)', transition: 'all .35s cubic-bezier(.34,1.56,.64,1)', display: 'flex', flexDirection: 'column', gap: '16px' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: C.azureLight, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: hov ? 'scale(1.1)' : 'scale(1)', transition: 'transform .3s' }}>
              <CreditCard size={19} style={{ color: C.azure }} strokeWidth={1.75} />
            </div>
            {loading
              ? <div style={{ width: '72px', height: '24px', borderRadius: '100px', background: C.border, animation: 'pulse 1.6s ease-in-out infinite' }} />
              : <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontFamily: '"DM Sans",sans-serif', fontSize: '11px', fontWeight: 700, color: estAJour === true ? C.success : estAJour === false ? C.danger : C.muted, background: estAJour === true ? C.successBg : estAJour === false ? C.dangerBg : C.offWhite, border: `1px solid ${estAJour === true ? `${C.success}30` : estAJour === false ? `${C.danger}30` : C.border}`, borderRadius: '100px', padding: '3px 10px' }}>
                  {estAJour === true ? <><CheckCircle2 size={11} /> À jour</> : estAJour === false ? <><AlertCircle size={11} /> En attente</> : <><Clock size={11} /> Chargement…</>}
                </span>
            }
          </div>
          <div>
            <div style={{ fontFamily: '"DM Sans",sans-serif', fontSize: '14px', fontWeight: 700, color: C.azureDark, marginBottom: '4px' }}>Mes cotisations</div>
            <div style={{ fontFamily: '"DM Sans",sans-serif', fontSize: '12.5px', lineHeight: 1.6, color: C.muted }}>
              {loading ? 'Chargement de vos cotisations…' : estAJour === true ? 'Votre cotisation du mois est à jour. Merci de votre engagement !' : 'Consultez le détail de vos cotisations mois par mois.'}
            </div>
          </div>
          <button
            onClick={() => setModaleOpen(true)} disabled={loading}
            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px 16px', borderRadius: '100px', background: loading ? C.border : `linear-gradient(135deg,${C.azure},${C.cyanDark})`, color: loading ? C.mutedLight : C.white, border: 'none', fontSize: '13px', fontWeight: 700, fontFamily: '"DM Sans",sans-serif', cursor: loading ? 'not-allowed' : 'pointer', boxShadow: loading ? 'none' : `0 4px 14px ${C.azure}40`, transition: 'all .2s ease' }}
            onMouseEnter={e => { if (!loading) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = `0 7px 20px ${C.azure}55`; } }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; if (!loading) e.currentTarget.style.boxShadow = `0 4px 14px ${C.azure}40`; }}
          >
            {loading ? <><Loader2 size={13} style={{ animation: 'spin .8s linear infinite' }} /> Chargement…</> : <><CalendarDays size={13} /> Voir mes cotisations</>}
          </button>
        </div>
      </motion.div>

      {modaleOpen && <ModaleCotisations cotisations={cotisations} onClose={() => setModaleOpen(false)} />}
    </>
  );
}

// ── Carte Engagement ──────────────────────────────────────────
function EngagementCard({ icon: Icon, titre, desc, color, bg, to, btnLabel, btnGradient }) {
  const [hov, setHov] = useState(false);
  return (
    <motion.div variants={fadeUp} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background: C.white, borderRadius: '18px', border: `1.5px solid ${hov ? color + '50' : C.border}`, padding: '24px 22px', display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: hov ? `0 14px 40px ${color}14` : '0 2px 12px rgba(0,0,0,.04)', transform: hov ? 'translateY(-4px)' : 'translateY(0)', transition: 'all .35s cubic-bezier(.34,1.56,.64,1)' }}
    >
      <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: hov ? 'scale(1.1)' : 'scale(1)', transition: 'transform .3s' }}>
        <Icon size={19} style={{ color }} strokeWidth={1.75} />
      </div>
      <div>
        <div style={{ fontFamily: '"DM Sans",sans-serif', fontSize: '14px', fontWeight: 700, color: C.azureDark, marginBottom: '4px' }}>{titre}</div>
        <div style={{ fontFamily: '"DM Sans",sans-serif', fontSize: '12.5px', lineHeight: 1.6, color: C.muted }}>{desc}</div>
      </div>
      <Link to={to} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px 16px', borderRadius: '100px', background: btnGradient, color: C.white, fontSize: '13px', fontWeight: 700, fontFamily: '"DM Sans",sans-serif', textDecoration: 'none', boxShadow: `0 4px 14px ${color}40`, transition: 'all .2s' }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = `0 7px 20px ${color}55`; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = `0 4px 14px ${color}40`; }}
      >{btnLabel} <ChevronRight size={13} /></Link>
    </motion.div>
  );
}

// ══════════════════════════════════════════════════════════════
// PAGE PRINCIPALE
// ══════════════════════════════════════════════════════════════
export default function DashboardChargeProjet() {
  const { user, logout } = useAuth();
  const navigate          = useNavigate();
  const ref               = useRef(null);
  const inView            = useInView(ref, { once: true, amount: 0.05 });

  const [actions,       setActions]       = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState(null);
  const [cpStats,       setCpStats]       = useState(null);
  const [statsLoading,  setStatsLoading]  = useState(true);
  const [isCreateOpen,  setIsCreateOpen]  = useState(false);
  const [detailActionId, setDetailActionId] = useState(null); // null = fermée
  const [cotisations,   setCotisations]   = useState([]);
  const [loadingCotis,  setLoadingCotis]  = useState(true);

  const displayName = user?.first_name || user?.username || 'Chargé de Projet';
  const handleLogout = () => { logout(); navigate('/', { replace: true }); };

  const fetchActions = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const { data } = await axios.get(API_MES_ACTIONS, { headers: authHeader() });
      setActions(data.results ?? data);
    } catch (err) {
      console.error('[DashboardCP]', err);
      setError('Impossible de charger vos actions.');
    } finally { setLoading(false); }
  }, []);

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const { data } = await axios.get(API_CP_STATS, { headers: authHeader() });
      setCpStats(data);
    } catch { /* silencieux */ }
    finally { setStatsLoading(false); }
  }, []);

  useEffect(() => { fetchActions(); fetchStats(); }, [fetchActions, fetchStats]);

  // ── Fetch cotisations ────────────────────────────────────
  useEffect(() => {
    setLoadingCotis(true);
    axios.get(API_DASHBOARD, { headers: authHeader() })
      .then(({ data }) => {
        setCotisations(Array.isArray(data.cotisations) ? data.cotisations : []);
      })
      .catch(() => setCotisations([]))
      .finally(() => setLoadingCotis(false));
  }, []);

  const handleCloturer    = (id) => { setActions(p => p.map(a => a.id === id ? { ...a, statut: 'CLOTUREE' } : a)); fetchStats(); };
  const handleRefresh     = useCallback(() => { fetchActions(); fetchStats(); }, [fetchActions, fetchStats]);

  const kpis = {
    total:        cpStats?.total_actions      ?? actions.length,
    enCours:      cpStats?.actions_en_cours   ?? actions.filter(a => a.statut === 'EN_COURS').length,
    planifiees:   cpStats?.actions_planifiees ?? actions.filter(a => a.statut === 'PLANIFIEE').length,
    participants: cpStats?.total_participants ?? 0,
  };

  return (
    <>
      <style>{`
        @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:.35} }
        @keyframes spin    { to{transform:rotate(360deg)} }
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        table { border-collapse:collapse; width:100%; }
      `}</style>

      {/* ✅ Modale Création */}
      <AnimatePresence>
        {isCreateOpen && <ModalNouvelleAction key="create" onClose={() => setIsCreateOpen(false)} onSuccess={handleRefresh} />}
      </AnimatePresence>

      {/* ✅ Modale Détails / Modification */}
      <AnimatePresence>
        {detailActionId !== null && (
          <ModalDetailsAction
            key={`detail-${detailActionId}`}
            actionId={detailActionId}
            onClose={() => setDetailActionId(null)}
            onUpdated={handleRefresh}
          />
        )}
      </AnimatePresence>

      <div style={{ fontFamily: '"DM Sans",sans-serif', background: C.offWhite, minHeight: '100vh', paddingTop: `${NAV_HEIGHT}px` }}>

        {/* ══ HEADER ══ */}
        <div style={{ background: `linear-gradient(135deg,${C.azureDeep} 0%,${C.cyanDark} 50%,${C.cyan} 100%)`, padding: '44px 24px 56px', position: 'relative', overflow: 'hidden' }}>
          {[['rgba(255,255,255,.04)', '-60px', null, '-60px', null, '260px'],['rgba(22,64,200,.12)', null, '-50px', null, '30%', '200px']].map(([bg, t, b, r, l, size], i) => (
            <div key={i} style={{ position: 'absolute', top: t, bottom: b, right: r, left: l, width: size, height: size, borderRadius: '50%', background: bg, pointerEvents: 'none' }} />
          ))}
          <div style={{ maxWidth: '1280px', margin: '0 auto', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
            <motion.div initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }} style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
              <Avatar user={user} size={58} />
              <div>
                <div style={{ fontFamily: '"DM Sans",sans-serif', fontSize: '11px', color: 'rgba(255,255,255,.55)', fontWeight: 600, letterSpacing: '.14em', textTransform: 'uppercase', marginBottom: '4px' }}>Chargé·e de Projet</div>
                <h1 style={{ fontFamily: '"Playfair Display",serif', fontSize: 'clamp(1.4rem,3vw,1.9rem)', fontWeight: 800, color: C.white, margin: 0, lineHeight: 1.15 }}>
                  Bonjour, <em style={{ fontStyle: 'italic', color: C.cyan }}>{displayName}</em> 👋
                </h1>
                <div style={{ fontFamily: '"DM Sans",sans-serif', fontSize: '13px', color: 'rgba(255,255,255,.55)', marginTop: '4px' }}>Pilotez vos projets depuis votre espace dédié.</div>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
              <button onClick={() => setIsCreateOpen(true)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '10px 20px', borderRadius: '100px', background: C.cyan, color: C.azureDeep, fontSize: '13px', fontWeight: 800, fontFamily: '"DM Sans",sans-serif', border: 'none', cursor: 'pointer', boxShadow: '0 6px 20px rgba(48,200,211,.4)', transition: 'all .25s cubic-bezier(.34,1.56,.64,1)' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 28px rgba(48,200,211,.55)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(48,200,211,.4)'; }}
              ><Plus size={15} strokeWidth={2.5} /> Nouvelle action</button>
              <Link to="/dashboard/settings" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 16px', borderRadius: '100px', background: 'rgba(255,255,255,.12)', border: '1px solid rgba(255,255,255,.22)', color: C.white, fontSize: '13px', fontWeight: 600, fontFamily: '"DM Sans",sans-serif', textDecoration: 'none', transition: 'background .2s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,.2)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,.12)'}
              ><Settings size={14} /> Mon profil</Link>
              <button onClick={handleLogout} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 16px', borderRadius: '100px', background: 'rgba(220,38,38,.15)', border: '1px solid rgba(220,38,38,.3)', color: '#fca5a5', fontSize: '13px', fontWeight: 600, fontFamily: '"DM Sans",sans-serif', cursor: 'pointer', transition: 'background .2s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(220,38,38,.28)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(220,38,38,.15)'}
              ><LogOut size={14} /> Déconnecter</button>
            </motion.div>
          </div>
        </div>

        {/* ══ CONTENU ══ */}
        <div ref={ref} style={{ maxWidth: '1280px', margin: '0 auto', padding: '36px 24px 80px' }}>

          {/* KPI Cards */}
          <motion.div variants={stagger(0.08)} initial="hidden" animate={inView ? 'show' : 'hidden'}
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(210px,1fr))', gap: '18px', marginBottom: '44px' }}
          >
            <KpiCard icon={LayoutDashboard} label="Actions totales"    value={kpis.total}        sub="Toutes"  color={C.azure}   bg={C.azureLight} loading={statsLoading} />
            <KpiCard icon={Zap}             label="En cours"           value={kpis.enCours}      sub="Actives" color={C.success} bg={C.successBg}  loading={statsLoading} />
            <KpiCard icon={Clock}           label="Planifiées"         value={kpis.planifiees}   sub="À venir" color={C.cyanDark} bg={C.cyanLight}  loading={statsLoading} />
            <KpiCard icon={Users}           label="Total participants" value={kpis.participants} sub="Cumulé"  color={C.warning} bg={C.warningBg}  loading={statsLoading} />
          </motion.div>

          {/* Bannière CTA */}
          <motion.div variants={fadeUp} initial="hidden" animate={inView ? 'show' : 'hidden'} style={{ marginBottom: '40px' }}>
            <div style={{ background: `linear-gradient(135deg,${C.azureDeep}f2,${C.cyanDark}f0)`, borderRadius: '20px', padding: '28px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', right: '-20px', top: '-20px', width: '160px', height: '160px', borderRadius: '50%', background: 'rgba(48,200,211,.08)', pointerEvents: 'none' }} />
              <div>
                <div style={{ fontFamily: '"DM Sans",sans-serif', fontSize: '11px', fontWeight: 700, letterSpacing: '.16em', textTransform: 'uppercase', color: 'rgba(48,200,211,.8)', marginBottom: '6px' }}>Nouvelle initiative</div>
                <h3 style={{ fontFamily: '"Playfair Display",serif', fontSize: '1.35rem', fontWeight: 700, color: C.white, margin: '0 0 4px' }}>Lancer un nouveau projet</h3>
                <p style={{ fontFamily: '"DM Sans",sans-serif', fontSize: '13.5px', color: 'rgba(255,255,255,.6)', margin: 0 }}>Créez une action, définissez le budget et invitez des participants.</p>
              </div>
              <button onClick={() => setIsCreateOpen(true)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '13px 28px', borderRadius: '100px', background: C.cyan, color: C.azureDeep, fontSize: '14px', fontWeight: 800, fontFamily: '"DM Sans",sans-serif', border: 'none', cursor: 'pointer', boxShadow: '0 6px 20px rgba(48,200,211,.45)', flexShrink: 0, transition: 'all .25s cubic-bezier(.34,1.56,.64,1)', position: 'relative', zIndex: 1 }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px) scale(1.03)'; e.currentTarget.style.boxShadow = '0 12px 30px rgba(48,200,211,.6)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0) scale(1)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(48,200,211,.45)'; }}
              ><Plus size={16} strokeWidth={2.5} /> Créer une action</button>
            </div>
          </motion.div>

          {/* Tableau de pilotage */}
          <motion.div variants={fadeUp} initial="hidden" animate={inView ? 'show' : 'hidden'} style={{ marginBottom: '44px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '9px', marginBottom: '4px' }}>
                  <Target size={17} style={{ color: C.cyanDark }} />
                  <h2 style={{ fontFamily: '"Playfair Display",serif', fontSize: '1.2rem', fontWeight: 700, color: C.azureDark, margin: 0 }}>Pilotage de mes Actions</h2>
                </div>
                <p style={{ fontFamily: '"DM Sans",sans-serif', fontSize: '13.5px', color: C.muted, margin: 0 }}>
                  Cliquez sur <strong>Détails</strong> pour consulter ou modifier une action.
                </p>
              </div>
              <button onClick={handleRefresh}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '10px', border: `1.5px solid ${C.border}`, background: C.white, color: C.muted, fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: '"DM Sans",sans-serif', transition: 'all .2s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = C.cyanDark; e.currentTarget.style.color = C.cyanDark; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.muted; }}
              ><RefreshCw size={12} /> Actualiser</button>
            </div>

            <div style={{ background: C.white, borderRadius: '20px', border: `1.5px solid ${C.border}`, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,.04)' }}>
              {loading && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '60px 24px', color: C.muted, fontFamily: '"DM Sans",sans-serif', fontSize: '14px' }}>
                  <Loader2 size={18} style={{ animation: 'spin 1s linear infinite', color: C.cyanDark }} /> Chargement…
                </div>
              )}
              {!loading && error && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', padding: '60px 24px', textAlign: 'center' }}>
                  <AlertCircle size={32} style={{ color: C.danger }} />
                  <p style={{ fontFamily: '"DM Sans",sans-serif', fontSize: '14px', color: C.muted, margin: 0 }}>{error}</p>
                  <button onClick={handleRefresh} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 20px', borderRadius: '100px', background: C.azure, color: C.white, border: 'none', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: '"DM Sans",sans-serif' }}>
                    <RefreshCw size={13} /> Réessayer
                  </button>
                </div>
              )}
              {!loading && !error && actions.length === 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', padding: '60px 24px', textAlign: 'center' }}>
                  <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: C.cyanLight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <BarChart2 size={26} style={{ color: C.cyanDark }} />
                  </div>
                  <div>
                    <h3 style={{ fontFamily: '"Playfair Display",serif', fontSize: '1.1rem', fontWeight: 700, color: C.azureDark, margin: '0 0 6px' }}>Aucune action assignée</h3>
                    <p style={{ fontFamily: '"DM Sans",sans-serif', fontSize: '13.5px', color: C.muted, margin: 0 }}>Créez votre première action pour commencer le pilotage.</p>
                  </div>
                  <button onClick={() => setIsCreateOpen(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 22px', borderRadius: '100px', background: `linear-gradient(135deg,${C.azure},${C.cyanDark})`, color: C.white, fontSize: '13px', fontWeight: 700, fontFamily: '"DM Sans",sans-serif', border: 'none', cursor: 'pointer', boxShadow: `0 4px 16px ${C.azure}35` }}>
                    <Plus size={14} strokeWidth={2.5} /> Créer une action
                  </button>
                </div>
              )}
              {!loading && !error && actions.length > 0 && (
                <div style={{ overflowX: 'auto' }}>
                  <table>
                    <thead>
                      <tr style={{ background: C.offWhite, borderBottom: `2px solid ${C.border}` }}>
                        {['Action', 'Statut', 'Date début', 'Lieu', 'Participants', 'Budget', 'Actions'].map((h, i) => (
                          <th key={h} style={{ padding: '13px 20px', textAlign: i >= 4 && i < 6 ? 'center' : i === 6 ? 'right' : 'left', fontFamily: '"DM Sans",sans-serif', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: C.muted, whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {actions.map((action, i) => (
                        <ActionRow
                          key={action.id}
                          action={action}
                          index={i}
                          onCloturer={handleCloturer}
                          onOpenDetails={(id) => setDetailActionId(id)}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </motion.div>

          {/* Mon Engagement */}
          <motion.div variants={fadeUp} initial="hidden" animate={inView ? 'show' : 'hidden'}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '9px', marginBottom: '6px' }}>
              <Heart size={17} style={{ color: C.azure }} />
              <h2 style={{ fontFamily: '"Playfair Display",serif', fontSize: '1.2rem', fontWeight: 700, color: C.azureDark, margin: 0 }}>Mon Engagement</h2>
            </div>
            <p style={{ fontFamily: '"DM Sans",sans-serif', fontSize: '13.5px', color: C.muted, margin: '0 0 20px' }}>En tant que membre, restez à jour sur vos obligations et soutenez la mission.</p>
            <motion.div variants={stagger(0.09)} initial="hidden" animate={inView ? 'show' : 'hidden'} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: '16px' }}>
              <CarteCotisations cotisations={cotisations} loading={loadingCotis} />
              <EngagementCard icon={Heart} titre="Faire un don" desc="Soutenez les programmes de terrain et aidez-nous à grandir davantage." color="#e11d48" bg="#fff1f2" to="/contact" btnLabel="Faire un don" btnGradient="linear-gradient(135deg,#e11d48,#f43f5e)" />
            </motion.div>
          </motion.div>

        </div>
      </div>
    </>
  );
}