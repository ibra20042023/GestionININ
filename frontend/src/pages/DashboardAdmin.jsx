/**
 * src/pages/DashboardAdmin.jsx
 * ─────────────────────────────────────────────────────────────
 * v2 — ModalNouvelleAction intégrée
 * ─────────────────────────────────────────────────────────────
 */

import {
  useRef, useState, useEffect, useCallback, Fragment,
} from 'react';
import { Link, useNavigate }       from 'react-router-dom';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import axios from 'axios';
import api from '../api/api';
import {
  LogOut, Settings, Plus, X, Trash2, Pencil,
  CheckCircle2, AlertCircle, Loader2, RefreshCw,
  Heart, CreditCard, Users, UserPlus, ShieldCheck,
  BarChart3, Handshake, TrendingUp, Banknote,
  Eye, EyeOff, Landmark, FileText, ArrowUpRight,
  Building2, LayoutDashboard, Wallet, ChevronRight,
  Globe, Lock, Layers, Sparkles, ExternalLink,
  AlertTriangle, Download, Search, Filter,
  Edit3, Save, XCircle, ImageIcon, Info, Upload, Receipt,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ModalDon from '../components/modals/ModalDon';

// ── Palette ADMIN ─────────────────────────────────────────────
const C = {
  ink:           '#08090c',
  inkDeep:       '#05060a',
  inkSoft:       '#111318',
  inkMid:        '#1a1d26',
  inkCard:       '#1e2130',
  inkBorder:     '#2a2f40',
  inkHover:      '#242840',
  gold:          '#c9a84c',
  goldLight:     '#f0d080',
  goldDark:      '#9a7a2a',
  goldBg:        'rgba(201,168,76,.08)',
  goldBorder:    'rgba(201,168,76,.18)',
  emerald:       '#10b981',
  emeraldDark:   '#059669',
  emeraldBg:     'rgba(16,185,129,.08)',
  emeraldBorder: 'rgba(16,185,129,.18)',
  sapphire:      '#3b82f6',
  sapphireBg:    'rgba(59,130,246,.08)',
  sapphireBorder:'rgba(59,130,246,.18)',
  rose:          '#f43f5e',
  roseBg:        'rgba(244,63,94,.08)',
  roseBorder:    'rgba(244,63,94,.18)',
  violet:        '#8b5cf6',
  violetBg:      'rgba(139,92,246,.08)',
  white:         '#ffffff',
  offWhite:      '#e8eaf0',
  muted:         '#8892a4',
  mutedDark:     '#5a6478',
  dim:           '#3a4055',
  success:       '#10b981',
  successBg:     'rgba(16,185,129,.1)',
  warning:       '#f59e0b',
  warningBg:     'rgba(245,158,11,.1)',
  danger:        '#f43f5e',
  dangerBg:      'rgba(244,63,94,.1)',
};

const NAV_HEIGHT = 85;

// ── API paths ─────────────────────────────────────────────────
const API = {
  dashboard:  'dashboard/',
  users:      'users/',
  userById:   (id) => `users/${id}/`,
  membres:    'membres/',
  membreById: (id) => `membres/${id}/`,
  dons:       'dons/',
  depenses:   'depenses/',
  partenaires:'partenaires/',
  partById:   (id) => `partenaires/${id}/`,
  cotisations:'cotisations/',
  actions:    'actions/',
  actionById: (id) => `actions/${id}/`,
  demandes:   'demandes-adhesion/',
};

// ── Helpers ───────────────────────────────────────────────────
const fmtDate = (s) => s
  ? new Date(s).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
  : '—';
const fmtMontant = (v) => v != null
  ? Number(v).toLocaleString('fr-FR') + ' FCFA'
  : '—';

// ── Onglets ───────────────────────────────────────────────────
const TABS = [
  { id: 0, label: 'Vue d\'ensemble',        icon: LayoutDashboard },
  { id: 1, label: 'Utilisateurs & Membres', icon: Users           },
  { id: 2, label: 'Finances',               icon: Wallet          },
  { id: 3, label: 'Partenaires',            icon: Handshake       },
  { id: 4, label: 'Paramètres',             icon: Settings        },
];

// ── Rôles / Types ─────────────────────────────────────────────
const ROLES = [
  { key: 'ADMIN',              label: 'Administrateur'     },
  { key: 'TRESORIER',          label: 'Trésorier'          },
  { key: 'CHARGE_PROJET',      label: 'Chargé de Projet'   },
  { key: 'RESPONSABLE_RH',     label: 'Responsable RH'     },
  { key: 'CHARGE_PARTENARIAT', label: 'Chargé Partenariat' },
  { key: 'MEMBRE',             label: 'Membre'             },
];

const TYPES_MEMBRE = [
  { key: 'PRESIDENT',          label: 'Président'                },
  { key: 'VICE_PRESIDENT',     label: 'Vice-Président'           },
  { key: 'TRESORIER',          label: 'Trésorier'                },
  { key: 'RESPONSABLE_RH',     label: 'Responsable RH'           },
  { key: 'RESPONSABLE_COM',    label: 'Responsable Communication' },
  { key: 'CHARGE_PROJET',      label: 'Chargé de Projet'         },
  { key: 'CHARGE_PARTENARIAT', label: 'Chargé de Partenariat'    },
  { key: 'SECRETAIRE',         label: 'Secrétaire'               },
  { key: 'BENEVOLE',           label: 'Bénévole'                 },
  { key: 'MEMBRE_ACTIF',       label: 'Membre Actif'             },
];

const TYPES_PART = [
  { key: 'ONG',        label: 'ONG / Association'   },
  { key: 'Entreprise', label: 'Entreprise'           },
  { key: 'Public',     label: 'Institution Publique' },
  { key: 'Fondation',  label: 'Fondation'            },
  { key: 'Académique', label: 'Académique'           },
  { key: 'Autre',      label: 'Autre'                },
];

const SEXE_OPTIONS = [
  { value: '', label: 'Non précisé' },
  { value: 'HOMME', label: 'Homme' },
  { value: 'FEMME', label: 'Femme' },
  { value: 'AUTRE', label: 'Autre' },
];

const MODES_PAIEMENT = [
  { key: 'ESPECES',      label: 'Espèces'      },
  { key: 'VIREMENT',     label: 'Virement'     },
  { key: 'MOBILE_MONEY', label: 'Mobile Money' },
  { key: 'CHEQUE',       label: 'Chèque'       },
  { key: 'EN_LIGNE',     label: 'En ligne'     },
  { key: 'AUTRE',        label: 'Autre'        },
];

// ── ✅ MODE_CFG — configuration visuelle des modes de paiement
const MODE_CFG = {
  ESPECES:      { label: 'Espèces'      },
  VIREMENT:     { label: 'Virement'     },
  MOBILE_MONEY: { label: 'Mobile Money' },
  CHEQUE:       { label: 'Chèque'       },
  EN_LIGNE:     { label: 'En ligne'     },
  AUTRE:        { label: 'Autre'        },
};

// ── ✅ NOUVELLES CONSTANTES — ModalNouvelleAction ─────────────
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

const ANNEE_COURANTE = new Date().getFullYear();
const ANNEES_COTIS   = Array.from({ length: 5 }, (_, i) => ANNEE_COURANTE - 1 + i);

// ── Animations ────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};
const stagger = (d = 0.07) => ({
  hidden: {},
  show:   { transition: { staggerChildren: d } },
});
const tabContent = {
  hidden: { opacity: 0, x: 12  },
  show:   { opacity: 1, x: 0,  transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
  exit:   { opacity: 0, x: -8, transition: { duration: 0.2 } },
};

// ════════════════════════════════════════════════════════════════
// STYLES PARTAGÉS
// ════════════════════════════════════════════════════════════════

const IS = (ac = C.gold) => ({
  width: '100%', padding: '10px 13px',
  border: `1.5px solid ${C.inkBorder}`,
  borderRadius: '9px', fontSize: '13.5px',
  fontFamily: '"DM Sans",sans-serif',
  color: C.offWhite, background: C.inkMid,
  outline: 'none',
  transition: 'border-color .2s, box-shadow .2s',
  boxSizing: 'border-box',
});
const focStyle = (ac = C.gold) => (e) => {
  e.target.style.borderColor = ac;
  e.target.style.boxShadow   = `0 0 0 3px ${ac}20`;
};
const blrStyle = () => (e) => {
  e.target.style.borderColor = C.inkBorder;
  e.target.style.boxShadow   = 'none';
};

const LBs = {
  display: 'block',
  fontFamily: '"DM Sans",sans-serif',
  fontSize: '10.5px', fontWeight: 700,
  color: C.muted,
  textTransform: 'uppercase', letterSpacing: '0.09em',
  marginBottom: '5px',
};

const btnPrimary = (color = C.gold) => ({
  display: 'inline-flex', alignItems: 'center', gap: '5px',
  padding: '9px 18px', borderRadius: '8px',
  background: `linear-gradient(135deg,${color},${color}bb)`,
  color: color === C.gold ? C.ink : C.white,
  fontSize: '12.5px', fontWeight: 700, border: 'none',
  cursor: 'pointer', fontFamily: '"DM Sans",sans-serif',
  boxShadow: `0 4px 14px ${color}30`,
  transition: 'all .22s',
});

const btnGhost = {
  display: 'inline-flex', alignItems: 'center', gap: '5px',
  padding: '8px 14px', borderRadius: '8px',
  background: 'transparent', border: `1.5px solid ${C.inkBorder}`,
  color: C.muted, fontSize: '12px', fontWeight: 600,
  cursor: 'pointer', fontFamily: '"DM Sans",sans-serif',
  transition: 'all .2s',
};

const btnDanger = {
  display: 'inline-flex', alignItems: 'center', gap: '4px',
  padding: '6px 11px', borderRadius: '7px',
  background: C.dangerBg, border: `1px solid ${C.roseBorder}`,
  color: C.rose, fontSize: '11.5px', fontWeight: 700,
  cursor: 'pointer', fontFamily: '"DM Sans",sans-serif',
  transition: 'all .2s',
};

// ── ✅ inputSt — style input pour ModalNouvelleAction ─────────
const inputSt = (err = false) => ({
  width: '100%', padding: '10px 13px',
  border: `1.5px solid ${err ? C.rose : C.inkBorder}`,
  borderRadius: '9px', fontSize: '13.5px',
  fontFamily: '"DM Sans",sans-serif',
  color: C.offWhite, background: C.inkMid,
  outline: 'none',
  transition: 'border-color .2s, box-shadow .2s',
  boxSizing: 'border-box',
  resize: 'vertical',
});

// ════════════════════════════════════════════════════════════════
// PRIMITIVES UI
// ════════════════════════════════════════════════════════════════

function ModalShell({ onClose, children, maxWidth = '520px' }) {
  return (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        transition={{ duration: .18 }} onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.75)',
          backdropFilter: 'blur(6px)', zIndex: 1000 }}
      />
      <div style={{ position: 'fixed', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)', zIndex: 1001, width: '90%', maxWidth }}>
        <motion.div
          initial={{ opacity: 0, scale: .93, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: .93, y: 8 }}
          transition={{ duration: .28, ease: [0.22, 1, 0.36, 1] }}
          style={{ background: C.inkCard, borderRadius: '20px',
            border: `1px solid ${C.inkBorder}`,
            boxShadow: '0 40px 90px rgba(0,0,0,.6)',
            maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
        >
          {children}
        </motion.div>
      </div>
    </>
  );
}

function ModalHeader({ eyebrow, title, accentColor = C.gold, onClose }) {
  return (
    <div style={{ padding: '18px 22px', borderBottom: `1px solid ${C.inkBorder}`,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
      background: `linear-gradient(135deg,${C.inkMid},${C.inkCard})` }}>
      <div>
        <div style={{ fontFamily: '"DM Sans",sans-serif', fontSize: '9.5px', fontWeight: 700,
          letterSpacing: '0.22em', textTransform: 'uppercase',
          color: accentColor, marginBottom: '4px', opacity: .85 }}>
          {eyebrow}
        </div>
        <h3 style={{ fontFamily: '"Cormorant Garamond",serif', fontSize: '1.3rem',
          fontWeight: 600, color: C.offWhite, margin: 0, letterSpacing: '0.01em' }}>
          {title}
        </h3>
      </div>
      <button onClick={onClose}
        style={{ width: '32px', height: '32px', borderRadius: '50%',
          background: C.inkSoft, border: `1px solid ${C.inkBorder}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: C.muted, transition: 'all .2s' }}
        onMouseEnter={e => { e.currentTarget.style.background = C.inkBorder; e.currentTarget.style.color = C.white; }}
        onMouseLeave={e => { e.currentTarget.style.background = C.inkSoft;   e.currentTarget.style.color = C.muted; }}>
        <X size={14} />
      </button>
    </div>
  );
}

function ModalBody({ children }) {
  return (
    <div style={{ padding: '22px', overflowY: 'auto', display: 'flex',
      flexDirection: 'column', gap: '14px', flex: 1 }}>
      {children}
    </div>
  );
}

function ModalFooter({ onClose, onSubmit, loading, label, accentColor = C.gold }) {
  return (
    <div style={{ padding: '14px 22px', borderTop: `1px solid ${C.inkBorder}`,
      display: 'flex', gap: '10px', justifyContent: 'flex-end', flexShrink: 0 }}>
      <button onClick={onClose} style={{ ...btnGhost }}>Annuler</button>
      <button onClick={onSubmit} disabled={loading}
        style={{ ...btnPrimary(accentColor), opacity: loading ? .6 : 1,
          cursor: loading ? 'wait' : 'pointer' }}>
        {loading
          ? <><Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> Envoi…</>
          : label}
      </button>
    </div>
  );
}

function ErrorBox({ msg }) {
  if (!msg) return null;
  return (
    <div style={{ display: 'flex', gap: '8px', padding: '10px 13px',
      borderRadius: '8px', background: C.dangerBg, border: `1px solid ${C.roseBorder}` }}>
      <AlertCircle size={13} style={{ color: C.rose, flexShrink: 0, marginTop: '1px' }} />
      <span style={{ fontFamily: '"DM Sans",sans-serif', fontSize: '12.5px', color: C.rose }}>
        {msg}
      </span>
    </div>
  );
}

function FormRow({ label, children }) {
  return (
    <div>
      <span style={LBs}>{label}</span>
      {children}
    </div>
  );
}

function FormGrid({ cols = 2, children }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols},1fr)`, gap: '12px' }}>
      {children}
    </div>
  );
}

// ── ✅ FormField — version enrichie avec gestion d'erreur ─────
function FormField({ label, required, error, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
      <label style={{ fontFamily: '"DM Sans",sans-serif', fontSize: '10.5px', fontWeight: 700,
        color: C.muted, textTransform: 'uppercase', letterSpacing: '0.09em' }}>
        {label}{required && <span style={{ color: C.rose, marginLeft: '3px' }}>*</span>}
      </label>
      {children}
      {error && (
        <span style={{ fontFamily: '"DM Sans",sans-serif', fontSize: '11px',
          color: C.rose, display: 'flex', alignItems: 'center', gap: '4px' }}>
          <AlertCircle size={10} /> {error}
        </span>
      )}
    </div>
  );
}

function ConfirmModal({ message, onConfirm, onClose, loading }) {
  return (
    <ModalShell onClose={onClose} maxWidth="420px">
      <ModalHeader eyebrow="Confirmation" title="Supprimer cet élément ?"
        accentColor={C.rose} onClose={onClose} />
      <ModalBody>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start',
          padding: '14px', background: C.dangerBg, borderRadius: '10px',
          border: `1px solid ${C.roseBorder}` }}>
          <AlertTriangle size={18} style={{ color: C.rose, flexShrink: 0 }} />
          <p style={{ fontFamily: '"DM Sans",sans-serif', fontSize: '13.5px',
            color: C.offWhite, margin: 0, lineHeight: 1.6 }}>
            {message || 'Cette action est irréversible. Confirmer la suppression ?'}
          </p>
        </div>
      </ModalBody>
      <ModalFooter onClose={onClose} onSubmit={onConfirm} loading={loading}
        label={<><Trash2 size={12} /> Supprimer</>} accentColor={C.rose} />
    </ModalShell>
  );
}

function Avatar({ user, size = 52 }) {
  const [err, setErr] = useState(false);
  const photoUrl = user?.photo_profil
    ? (user.photo_profil.startsWith('http') ? user.photo_profil : `http://127.0.0.1:8000${user.photo_profil}`)
    : null;
  const initials = (user?.first_name || user?.username || 'AD').slice(0, 2).toUpperCase();
  if (photoUrl && !err) {
    return (
      <img src={photoUrl} alt={initials} onError={() => setErr(true)}
        style={{ width: `${size}px`, height: `${size}px`, borderRadius: '50%',
          objectFit: 'cover', border: `2px solid ${C.goldBorder}`, flexShrink: 0 }} />
    );
  }
  return (
    <div style={{ width: `${size}px`, height: `${size}px`, borderRadius: '50%', flexShrink: 0,
      background: `linear-gradient(135deg,${C.gold}40,${C.goldDark}60)`,
      border: `2px solid ${C.goldBorder}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ fontFamily: '"Cormorant Garamond",serif',
        fontSize: `${size * .38}px`, fontWeight: 700, color: C.goldLight }}>
        {initials}
      </span>
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, sub, accentColor, loading }) {
  return (
    <motion.div variants={fadeUp}
      style={{ background: C.inkCard, borderRadius: '16px',
        border: `1px solid ${C.inkBorder}`,
        padding: '20px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '90px',
        height: '90px', borderRadius: '50%', background: accentColor,
        opacity: .06, pointerEvents: 'none', filter: 'blur(20px)' }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
        <div style={{ width: '38px', height: '38px', borderRadius: '10px',
          background: accentColor + '18', display: 'flex', alignItems: 'center',
          justifyContent: 'center', border: `1px solid ${accentColor}25` }}>
          <Icon size={17} style={{ color: accentColor }} />
        </div>
        <span style={{ fontFamily: '"DM Sans",sans-serif', fontSize: '10.5px', fontWeight: 700,
          color: C.muted, textTransform: 'uppercase', letterSpacing: '0.09em' }}>
          {label}
        </span>
      </div>
      <div style={{ fontFamily: '"Cormorant Garamond",serif', fontSize: '2rem',
        fontWeight: 700, color: C.offWhite, lineHeight: 1, marginBottom: '5px' }}>
        {loading
          ? <Loader2 size={20} style={{ animation: 'spin 1s linear infinite', color: accentColor }} />
          : value}
      </div>
      {sub && (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px',
          fontFamily: '"DM Sans",sans-serif', fontSize: '11px', fontWeight: 600,
          color: accentColor, opacity: .8 }}>
          <ArrowUpRight size={11} />{sub}
        </div>
      )}
    </motion.div>
  );
}

function DataTable({ columns, data, loading, error, empty, actions }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      {loading ? (
        <div style={{ padding: '48px', display: 'flex', alignItems: 'center',
          justifyContent: 'center', gap: '10px', color: C.muted,
          fontFamily: '"DM Sans",sans-serif', fontSize: '13px' }}>
          <Loader2 size={18} style={{ animation: 'spin 1s linear infinite', color: C.gold }} />
          Chargement…
        </div>
      ) : error ? (
        <div style={{ padding: '40px', textAlign: 'center', color: C.rose,
          fontFamily: '"DM Sans",sans-serif', fontSize: '13px' }}>{error}</div>
      ) : data.length === 0 ? (
        <div style={{ padding: '52px', textAlign: 'center', color: C.mutedDark,
          fontFamily: '"DM Sans",sans-serif', fontSize: '13px' }}>{empty}</div>
      ) : (
        <table style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr>
              {[...columns, ...(actions ? [{ label: '', key: '__actions' }] : [])].map((col, i) => (
                <th key={i} style={{ padding: '10px 14px',
                  textAlign: col.key === '__actions' ? 'right' : 'left',
                  fontFamily: '"DM Sans",sans-serif', fontSize: '10px', fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '0.1em', color: C.mutedDark,
                  borderBottom: `1px solid ${C.inkBorder}`,
                  background: C.inkSoft, whiteSpace: 'nowrap' }}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={row.id ?? i}
                style={{ transition: 'background .15s' }}
                onMouseEnter={e => e.currentTarget.style.background = C.inkHover}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                {columns.map((col, ci) => (
                  <td key={ci} style={{ padding: '11px 14px',
                    borderBottom: `1px solid ${C.inkBorder}20`,
                    verticalAlign: 'middle', maxWidth: col.maxWidth || 'none' }}>
                    {col.render ? col.render(row) : (
                      <span style={{ fontFamily: '"DM Sans",sans-serif', fontSize: '12.5px',
                        color: col.primary ? C.offWhite : C.muted,
                        fontWeight: col.primary ? 600 : 400,
                        whiteSpace: col.noWrap ? 'nowrap' : 'normal',
                        overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>
                        {row[col.key] ?? '—'}
                      </span>
                    )}
                  </td>
                ))}
                {actions && (
                  <td style={{ padding: '11px 14px', borderBottom: `1px solid ${C.inkBorder}20`,
                    verticalAlign: 'middle', textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'inline-flex', gap: '6px' }}>
                      {actions(row)}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function SectionCard({ title, subtitle, icon: Icon, accentColor = C.gold, headerRight, children }) {
  return (
    <div style={{ background: C.inkCard, borderRadius: '16px',
      border: `1px solid ${C.inkBorder}`, overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.inkBorder}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: '10px',
        background: `linear-gradient(135deg,${C.inkMid},${C.inkCard})` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '9px',
            background: accentColor + '15', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon size={15} style={{ color: accentColor }} />
          </div>
          <div>
            <h3 style={{ fontFamily: '"Cormorant Garamond",serif', fontSize: '1.05rem',
              fontWeight: 600, color: C.offWhite, margin: 0, letterSpacing: '0.01em' }}>
              {title}
            </h3>
            {subtitle && (
              <p style={{ fontFamily: '"DM Sans",sans-serif', fontSize: '11.5px',
                color: C.mutedDark, margin: 0 }}>{subtitle}</p>
            )}
          </div>
        </div>
        {headerRight}
      </div>
      {children}
    </div>
  );
}

function Badge({ label, color, bg }) {
  return (
    <span style={{ fontFamily: '"DM Sans",sans-serif', fontSize: '10.5px', fontWeight: 700,
      padding: '2px 8px', borderRadius: '100px', color, background: bg,
      whiteSpace: 'nowrap', letterSpacing: '0.03em' }}>
      {label}
    </span>
  );
}

const roleBadge = (role) => {
  const map = {
    ADMIN:              { label: 'Admin',       color: C.gold,     bg: C.goldBg     },
    ADMINISTRATEUR:     { label: 'Admin',       color: C.gold,     bg: C.goldBg     },
    TRESORIER:          { label: 'Trésorier',   color: C.emerald,  bg: C.emeraldBg  },
    CHARGE_PROJET:      { label: 'Chg. Projet', color: C.sapphire, bg: C.sapphireBg },
    RESPONSABLE_RH:     { label: 'RH',          color: C.violet,   bg: C.violetBg   },
    CHARGE_PARTENARIAT: { label: 'Partenariat', color: '#f472b6',  bg: 'rgba(244,114,182,.1)' },
    MEMBRE:             { label: 'Membre',      color: C.muted,    bg: C.inkMid     },
  };
  const cfg = map[role] ?? { label: role ?? '—', color: C.muted, bg: C.inkMid };
  return <Badge {...cfg} />;
};

const statutBadge = (statut) => {
  const cfg = statut === 'ACTIF' || statut === true
    ? { label: 'Actif',      color: C.success, bg: C.successBg }
    : statut === 'INACTIF'
    ? { label: 'Inactif',    color: C.muted,   bg: C.inkMid    }
    : statut === 'EN_ATTENTE'
    ? { label: 'En attente', color: C.warning, bg: C.warningBg }
    : { label: statut ?? '—', color: C.muted,  bg: C.inkMid    };
  return <Badge {...cfg} />;
};

// ════════════════════════════════════════════════════════════════
// MODALES MÉTIER — existantes
// ════════════════════════════════════════════════════════════════

function ModalUser({ initial, onClose, onSuccess }) {
  const isEdit = !!initial;

  const emptyForm = {
    username: '', first_name: '', last_name: '', email: '',
    role: 'MEMBRE', telephone: '', bio: '', password: '', is_active: true,
  };

  const [form, setForm] = useState(()=>{
    if (!initial) return emptyForm;
    return {
      username:    initial.username    || '',
      first_name:  initial.first_name  || '',
      last_name:   initial.last_name   || '',
      email:       initial.email       || '',
      role:        initial.role        || 'MEMBRE',
      telephone:   initial.telephone   || '',
      bio:         initial.bio         || '',
      password:    '',
      is_active:   initial.is_active   ?? true,
    };
  });

  const [loading, setLoad] = useState(false);
  const [errors,  setErrs] = useState({});
  const [showPwd, setShowPwd] = useState(false);

  const accentColor = isEdit ? C.gold : C.gold;
  const gradient    = isEdit
    ? `linear-gradient(135deg,${C.goldDark},${C.gold})`
    : `linear-gradient(135deg,${C.goldDark},${C.gold})`;

  const set = (k) => (e) => {
    if (k === 'is_active') {
      setForm(p=>({...p,[k]:e.target.checked}));
    } else {
      setForm(p=>({...p,[k]:e.target.value}));
    }
  };

  const parseErrors = (data) => {
    if (!data||typeof data!=='object') return {non_field:'Erreur serveur.'};
    const out={};
    for (const [key,val] of Object.entries(data)) {
      out[key]=Array.isArray(val)?val.join(' '):String(val);
    }
    return out;
  };

  const submit = async () => {
    setLoad(true);setErrs({});
    try {
      if (!form.first_name.trim()) throw new Error('Prénom requis');
      if (!form.email.trim()) throw new Error('Email requis');
      if (!form.username.trim()) throw new Error('Username requis');
      if (!isEdit && !form.password.trim()) throw new Error('Mot de passe requis à la création');
      
      const payload = { ...form };
      if (!payload.password) delete payload.password;

      if(isEdit){
        await api.patch(API.userById(initial.id),payload);
      } else {
        await api.post(API.users,payload);
      }
      onSuccess?.();onClose();
    } catch(e){
      const msg = e.message || (e.response?.data ? Object.values(e.response.data).flat().join(' ') : 'Erreur réseau.');
      if (e.response?.data && typeof e.response.data === 'object') {
        setErrs(parseErrors(e.response.data));
      } else {
        setErrs({non_field:msg});
      }
    } finally{setLoad(false);}
  };

  const ISv=IS(accentColor);const foc=focStyle(accentColor);const blr=blrStyle();
  const FieldError=({name})=>errors[name]
    ?<span style={{fontFamily:'"DM Sans",sans-serif',fontSize:'11.5px',
        color:C.danger,marginTop:'4px',display:'block'}}>{errors[name]}</span>
    :null;

  return (
    <ModalShell onClose={onClose} maxWidth="600px">
      <ModalHeader
        eyebrow={isEdit?'Modifier un utilisateur':'Nouvel utilisateur'}
        title={isEdit?`${initial.first_name} ${initial.last_name}`:'Ajouter un utilisateur'}
        accentColor={accentColor} onClose={onClose}
      />
      <div style={{overflowY:'auto',padding:'24px',
        display:'flex',flexDirection:'column',gap:'18px',flex:1}}>
        {errors.non_field&&(
          <div style={{display:'flex',gap:'8px',padding:'12px 14px',borderRadius:'10px',
            background:C.dangerBg,border:`1px solid ${C.danger}30`}}>
            <AlertCircle size={14} style={{color:C.danger,flexShrink:0,marginTop:'1px'}}/>
            <span style={{fontFamily:'"DM Sans",sans-serif',fontSize:'13px',color:C.danger}}>
              {errors.non_field}
            </span>
          </div>
        )}
        {/* Prénom / Nom */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'14px'}}>
          <div>
            <span style={LBs}>Prénom *</span>
            <input value={form.first_name} onChange={set('first_name')}
              onFocus={foc} onBlur={blr} style={ISv} placeholder="Aminata"/>
            <FieldError name="first_name"/>
          </div>
          <div>
            <span style={LBs}>Nom *</span>
            <input value={form.last_name} onChange={set('last_name')}
              onFocus={foc} onBlur={blr} style={ISv} placeholder="Diallo"/>
            <FieldError name="last_name"/>
          </div>
        </div>
        {/* Username / Email */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'14px'}}>
          <div>
            <span style={LBs}>Username *</span>
            <input value={form.username} onChange={set('username')}
              onFocus={foc} onBlur={blr} style={ISv} placeholder="aminata.diallo" disabled={isEdit}/>
            <FieldError name="username"/>
          </div>
          <div>
            <span style={LBs}>Email *</span>
            <input type="email" value={form.email} onChange={set('email')}
              onFocus={foc} onBlur={blr} style={ISv} placeholder="aminata@inin.org"/>
            <FieldError name="email"/>
          </div>
        </div>
        {/* Rôle */}
        <div>
          <span style={LBs}>Rôle *</span>
          <select value={form.role} onChange={set('role')}
            onFocus={foc} onBlur={blr} style={{...ISv,cursor:'pointer'}}>
            {ROLES.map(o=><option key={o.key} value={o.key}>{o.label}</option>)}
          </select>
          <FieldError name="role"/>
        </div>
        {/* Téléphone */}
        <div>
          <span style={LBs}>Téléphone</span>
          <input value={form.telephone} onChange={set('telephone')}
            onFocus={foc} onBlur={blr} style={ISv} placeholder="+221 77 000 00 00"/>
          <FieldError name="telephone"/>
        </div>
        {/* Mot de passe */}
        <div>
          <span style={LBs}>{isEdit?'Nouveau mot de passe (laisser vide si inchangé)':'Mot de passe *'}</span>
          <div style={{position:'relative'}}>
            <input type={showPwd?'text':'password'} value={form.password}
              onChange={set('password')} onFocus={foc} onBlur={blr}
              style={{...ISv,paddingRight:'40px'}} placeholder="••••••••"/>
            <button type="button" onClick={()=>setShowPwd(p=>!p)}
              style={{position:'absolute',right:'11px',top:'50%',
                transform:'translateY(-50%)',background:'none',border:'none',
                color:C.muted,cursor:'pointer',padding:0}}>
              {showPwd?<EyeOff size={14}/>:<Eye size={14}/>}
            </button>
          </div>
          <FieldError name="password"/>
        </div>
        {/* Bio */}
        <div>
          <span style={LBs}>Bio / Description</span>
          <textarea value={form.bio} onChange={set('bio')}
            onFocus={foc} onBlur={blr} rows={3}
            placeholder="Responsable du projet X, spécialiste en communication..."
            style={{...ISv,resize:'vertical',lineHeight:'1.5'}}/>
          <FieldError name="bio"/>
        </div>
        {/* Checkbox Compte actif */}
        <label style={{display:'flex',alignItems:'center',gap:'8px',
          cursor:'pointer',userSelect:'none'}}>
          <input type="checkbox" checked={form.is_active} onChange={set('is_active')}
            style={{accentColor:C.gold,width:'15px',height:'15px'}}/>
          <span style={{fontFamily:'"DM Sans",sans-serif',fontSize:'13px',
            color:C.muted}}>Compte actif</span>
        </label>
      </div>
      <ModalFooter onClose={onClose} onSubmit={submit} loading={loading}
        label={isEdit
          ?<><Pencil size={13}/> Enregistrer les modifications</>
          :<><UserPlus size={13}/> Créer l'utilisateur</>}
        accentColor={accentColor}/>
    </ModalShell>
  );
}

function ModalMembre({ initial, onClose, onSuccess }) {
  const isEdit = !!initial;

  const emptyForm = {
    nom:'', prenom:'', email:'', telephone:'',
    adresse:'', date_adhesion:new Date().toISOString().slice(0,10),
    type_membre:'BENEVOLE', statut:'ACTIF',
    sexe:'', date_naissance:'', photo_profil:null,
  };

  const [form, setForm] = useState(()=>{
    if (!initial) return emptyForm;
    return {
      nom:            initial.nom            || '',
      prenom:         initial.prenom         || '',
      email:          initial.email          || '',
      telephone:      initial.telephone      || '',
      adresse:        initial.adresse        || '',
      date_adhesion:  initial.date_adhesion  || new Date().toISOString().slice(0,10),
      type_membre:    initial.type_membre    || 'BENEVOLE',
      statut:         initial.statut         || 'ACTIF',
      sexe:           initial.sexe           || '',
      date_naissance: initial.date_naissance || '',
      photo_profil:   null,
    };
  });

  const [photoPreview, setPhotoPreview] = useState(()=>{
    if (!initial?.photo_profil) return null;
    return initial.photo_profil.startsWith('http')
      ? initial.photo_profil
      : `http://127.0.0.1:8000${initial.photo_profil}`;
  });

  const [loading, setLoad] = useState(false);
  const [errors,  setErrs] = useState({});

  const accentColor = isEdit ? C.emeraldDark : C.emerald;
  const gradient    = isEdit
    ? `linear-gradient(135deg,${C.emeraldDark},${C.emerald})`
    : `linear-gradient(135deg,${C.emeraldDark},${C.emerald})`;

  const set = (k) => (e) => setForm(p=>({...p,[k]:e.target.value}));

  const handlePhoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setForm(p=>({...p,photo_profil:file}));
    setPhotoPreview(URL.createObjectURL(file));
  };

  const parseErrors = (data) => {
    if (!data||typeof data!=='object') return {non_field:'Erreur serveur.'};
    const out={};
    for (const [key,val] of Object.entries(data)) {
      out[key]=Array.isArray(val)?val.join(' '):String(val);
    }
    return out;
  };

  const submit = async () => {
    setLoad(true);setErrs({});
    const fd=new FormData();
    fd.append('nom',form.nom);fd.append('prenom',form.prenom);
    fd.append('email',form.email);fd.append('type_membre',form.type_membre);
    fd.append('statut',form.statut);
    if(form.telephone)      fd.append('telephone',form.telephone);
    if(form.adresse)        fd.append('adresse',form.adresse);
    if(form.date_adhesion)  fd.append('date_adhesion',form.date_adhesion);
    if(form.sexe)           fd.append('sexe',form.sexe);
    if(form.date_naissance) fd.append('date_naissance',form.date_naissance);
    if(form.photo_profil instanceof File) fd.append('photo_profil',form.photo_profil);
    try {
      if(isEdit){
        await api.patch(API.membreById(initial.id),fd);
      } else {
        await api.post(API.membres,fd);
      }
      onSuccess?.();onClose();
    } catch(e){
      setErrs(e.response?.data?parseErrors(e.response.data):{non_field:'Erreur réseau.'});
    } finally{setLoad(false);}
  };

  const ISv=IS(accentColor);const foc=focStyle(accentColor);const blr=blrStyle();
  const FieldError=({name})=>errors[name]
    ?<span style={{fontFamily:'"DM Sans",sans-serif',fontSize:'11.5px',
        color:C.danger,marginTop:'4px',display:'block'}}>{errors[name]}</span>
    :null;

  return (
    <ModalShell onClose={onClose} maxWidth="600px">
      <ModalHeader
        eyebrow={isEdit?'Modifier un membre':'Nouveau membre'}
        title={isEdit?`${initial.prenom} ${initial.nom}`:'Ajouter un membre'}
        accentColor={accentColor} onClose={onClose}
      />
      <div style={{overflowY:'auto',padding:'24px',
        display:'flex',flexDirection:'column',gap:'18px',flex:1}}>
        {errors.non_field&&(
          <div style={{display:'flex',gap:'8px',padding:'12px 14px',borderRadius:'10px',
            background:C.dangerBg,border:`1px solid ${C.danger}30`}}>
            <AlertCircle size={14} style={{color:C.danger,flexShrink:0,marginTop:'1px'}}/>
            <span style={{fontFamily:'"DM Sans",sans-serif',fontSize:'13px',color:C.danger}}>
              {errors.non_field}
            </span>
          </div>
        )}
        {/* Photo */}
        <div>
          <span style={LBs}>Photo de profil</span>
          <div style={{display:'flex',alignItems:'center',gap:'16px'}}>
            <div style={{width:'64px',height:'64px',borderRadius:'50%',flexShrink:0,
              background:C.inkMid,border:`2px dashed ${C.inkBorder}`,
              display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden'}}>
              {photoPreview
                ?<img src={photoPreview} alt="preview" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                :<UserPlus size={24} style={{color:C.muted}}/>}
            </div>
            <label style={{display:'inline-flex',alignItems:'center',gap:'6px',
              padding:'9px 16px',borderRadius:'10px',cursor:'pointer',
              border:`1.5px solid ${C.inkBorder}`,background:C.inkMid,
              fontFamily:'"DM Sans",sans-serif',fontSize:'13px',
              fontWeight:600,color:C.muted,transition:'all .2s'}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=accentColor;e.currentTarget.style.color=accentColor;}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor=C.inkBorder;e.currentTarget.style.color=C.muted;}}>
              <Upload size={13}/>
              {photoPreview?'Changer la photo':'Choisir une photo'}
              <input type="file" accept="image/*" onChange={handlePhoto} style={{display:'none'}}/>
            </label>
          </div>
          <FieldError name="photo_profil"/>
        </div>
        {/* Prénom / Nom */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'14px'}}>
          <div>
            <span style={LBs}>Prénom *</span>
            <input value={form.prenom} onChange={set('prenom')}
              onFocus={foc} onBlur={blr} style={ISv} placeholder="Aminata"/>
            <FieldError name="prenom"/>
          </div>
          <div>
            <span style={LBs}>Nom *</span>
            <input value={form.nom} onChange={set('nom')}
              onFocus={foc} onBlur={blr} style={ISv} placeholder="Diallo"/>
            <FieldError name="nom"/>
          </div>
        </div>
        {/* Email */}
        <div>
          <span style={LBs}>Email *</span>
          <input type="email" value={form.email} onChange={set('email')}
            onFocus={foc} onBlur={blr} style={ISv} placeholder="aminata@inin.org"/>
          <FieldError name="email"/>
        </div>
        {/* Téléphone / Date naissance */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'14px'}}>
          <div>
            <span style={LBs}>Téléphone</span>
            <input value={form.telephone} onChange={set('telephone')}
              onFocus={foc} onBlur={blr} style={ISv} placeholder="+221 77 000 00 00"/>
            <FieldError name="telephone"/>
          </div>
          <div>
            <span style={LBs}>Date de naissance</span>
            <input type="date" value={form.date_naissance} onChange={set('date_naissance')}
              onFocus={foc} onBlur={blr} style={ISv}/>
            <FieldError name="date_naissance"/>
          </div>
        </div>
        {/* Sexe / Date adhésion */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'14px'}}>
          <div>
            <span style={LBs}>Sexe</span>
            <select value={form.sexe} onChange={set('sexe')}
              onFocus={foc} onBlur={blr} style={{...ISv,cursor:'pointer'}}>
              {SEXE_OPTIONS.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <FieldError name="sexe"/>
          </div>
          <div>
            <span style={LBs}>Date d'adhésion</span>
            <input type="date" value={form.date_adhesion} onChange={set('date_adhesion')}
              onFocus={foc} onBlur={blr} style={ISv}/>
            <FieldError name="date_adhesion"/>
          </div>
        </div>
        {/* Type / Statut */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'14px'}}>
          <div>
            <span style={LBs}>Type de membre *</span>
            <select value={form.type_membre} onChange={set('type_membre')}
              onFocus={foc} onBlur={blr} style={{...ISv,cursor:'pointer'}}>
              {TYPES_MEMBRE.map(o=><option key={o.key} value={o.key}>{o.label}</option>)}
            </select>
            <FieldError name="type_membre"/>
          </div>
          <div>
            <span style={LBs}>Statut *</span>
            <select value={form.statut} onChange={set('statut')}
              onFocus={foc} onBlur={blr} style={{...ISv,cursor:'pointer'}}>
              <option value="ACTIF">Actif</option>
              <option value="INACTIF">Inactif</option>
              <option value="EN_ATTENTE">En attente</option>
            </select>
            <FieldError name="statut"/>
          </div>
        </div>
        {/* Adresse */}
        <div>
          <span style={LBs}>Adresse</span>
          <textarea value={form.adresse} onChange={set('adresse')}
            onFocus={foc} onBlur={blr} rows={2} placeholder="Dakar, Sénégal"
            style={{...ISv,resize:'vertical',lineHeight:'1.5'}}/>
          <FieldError name="adresse"/>
        </div>
      </div>
      <ModalFooter onClose={onClose} onSubmit={submit} loading={loading}
        label={isEdit
          ?<><Pencil size={13}/> Enregistrer les modifications</>
          :<><UserPlus size={13}/> Créer le membre</>}
        accentColor={accentColor}/>
    </ModalShell>
  );
}

function ModalPartenaire({ initial, onClose, onSuccess }) {
  const isEdit = !!initial;
  const [form, setForm] = useState({
    nom:         initial?.nom         ?? '',
    type:        initial?.type        ?? 'Entreprise',
    email:       initial?.email       ?? '',
    telephone:   initial?.telephone   ?? '',
    description: initial?.description ?? '',
    statut:      initial?.statut      ?? 'ACTIF',
    date_debut:  initial?.date_debut  ?? new Date().toISOString().slice(0, 10),
  });
  const [logoFile, setLogoFile] = useState(null);
  const [loading, setLoad] = useState(false);
  const [error, setErr] = useState(null);
  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const isValidFile = (f) =>
    f !== null &&
    f !== undefined &&
    (f instanceof File || (typeof f === 'object' && typeof f.name === 'string' && f.size > 0));

  const submit = async () => {
    if (!form.nom.trim()) { setErr('Le nom est requis.'); return; }
    if (!form.date_debut) { setErr('La date de début est requise.'); return; }
    setLoad(true); setErr(null);
    try {
      const payload = new FormData();
      ['nom', 'type', 'statut', 'date_debut'].forEach((k) => {
        payload.append(k, form[k]);
      });
      ['email', 'telephone', 'description'].forEach((k) => {
        const val = form[k];
        if (val !== null && val !== undefined && String(val).trim() !== '') {
          payload.append(k, String(val).trim());
        }
      });
      if (isValidFile(logoFile)) {
        payload.append('logo', logoFile, logoFile.name);
      }
      if (isEdit) {
        await api.patch(API.partById(initial.id), payload);
      } else {
        await api.post(API.partenaires, payload);
      }
      onSuccess?.();
      onClose();
    } catch (e) {
      const d = e.response?.data;
      setErr(d ? Object.values(d).flat().join(' ') : 'Erreur serveur.');
    } finally {
      setLoad(false);
    }
  };

  return (
    <ModalShell onClose={onClose} maxWidth="560px">
      <ModalHeader
        eyebrow="Gestion des Partenariats"
        title={isEdit ? 'Modifier le partenaire' : 'Nouveau partenaire'}
        accentColor={C.sapphire}
        onClose={onClose}
      />
      <ModalBody>
        {/* ── 1. NOM ── */}
        <FormRow label="Nom de l'organisation *">
          <input
            type="text"
            placeholder="Ex : Fondation TOTAL, USAID, UNICEF…"
            value={form.nom}
            onChange={set('nom')}
            onFocus={focStyle(C.sapphire)}
            onBlur={blrStyle()}
            style={IS(C.sapphire)}
          />
        </FormRow>

        {/* ── 2. TYPE + STATUT ── */}
        <FormGrid>
          <FormRow label="Type de partenariat *">
            <select value={form.type} onChange={set('type')}
              onFocus={focStyle(C.sapphire)} onBlur={blrStyle()}
              style={{ ...IS(C.sapphire), cursor: 'pointer' }}>
              {TYPES_PART.map((t) => (
                <option key={t.key} value={t.key}>{t.label}</option>
              ))}
            </select>
          </FormRow>
          <FormRow label="Statut">
            <select value={form.statut} onChange={set('statut')}
              onFocus={focStyle(C.sapphire)} onBlur={blrStyle()}
              style={{ ...IS(C.sapphire), cursor: 'pointer' }}>
              <option value="ACTIF">Actif</option>
              <option value="INACTIF">Inactif</option>
            </select>
          </FormRow>
        </FormGrid>

        {/* ── 3. EMAIL + TÉLÉPHONE ── */}
        <FormGrid>
          <FormRow label="Email contact">
            <input
              type="email"
              placeholder="contact@organisation.org"
              value={form.email}
              onChange={set('email')}
              onFocus={focStyle(C.sapphire)}
              onBlur={blrStyle()}
              style={IS(C.sapphire)}
            />
          </FormRow>
          <FormRow label="Téléphone">
            <input
              type="tel"
              placeholder="+221 77 000 00 00"
              value={form.telephone}
              onChange={set('telephone')}
              onFocus={focStyle(C.sapphire)}
              onBlur={blrStyle()}
              style={IS(C.sapphire)}
            />
          </FormRow>
        </FormGrid>

        {/* ── 4. DATE DÉBUT ── */}
        <FormRow label="Date de début du partenariat *">
          <input
            type="date"
            value={form.date_debut}
            onChange={set('date_debut')}
            onFocus={focStyle(C.sapphire)}
            onBlur={blrStyle()}
            style={IS(C.sapphire)}
          />
        </FormRow>

        {/* ── 5. LOGO ── */}
        <FormRow label="Logo (PNG / JPG)">
          {isEdit && initial?.logo && !logoFile && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <img
                src={initial.logo.startsWith('http')
                  ? initial.logo
                  : `http://127.0.0.1:8000${initial.logo}`}
                alt="Logo actuel"
                style={{ width: '40px', height: '40px', borderRadius: '8px',
                  objectFit: 'contain', border: `1px solid ${C.inkBorder}` }}
              />
              <span style={{ fontFamily: '"DM Sans",sans-serif', fontSize: '12px', color: C.muted }}>
                Logo actuel — sélectionnez un fichier pour le remplacer
              </span>
            </div>
          )}
          <label
            style={{ display: 'flex', alignItems: 'center', gap: '10px',
              padding: '10px 14px', border: `1.5px dashed ${C.inkBorder}`,
              borderRadius: '10px', background: C.inkMid,
              cursor: 'pointer', transition: 'border-color .2s' }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = C.sapphire}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = C.inkBorder}
          >
            <Upload size={15} style={{ color: C.sapphire, flexShrink: 0 }} />
            <span style={{ fontFamily: '"DM Sans",sans-serif', fontSize: '13px', color: C.muted }}>
              {logoFile ? logoFile.name : 'Choisir un fichier…'}
            </span>
            <input
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)}
            />
          </label>
        </FormRow>

        {/* ── 6. DESCRIPTION ── */}
        <FormRow label="Description / Accords de partenariat">
          <textarea
            rows={3}
            placeholder="Décrivez la nature du partenariat, les engagements, les projets communs…"
            value={form.description}
            onChange={set('description')}
            onFocus={focStyle(C.sapphire)}
            onBlur={blrStyle()}
            style={{ ...IS(C.sapphire), resize: 'vertical', minHeight: '80px' }}
          />
        </FormRow>

        <ErrorBox msg={error} />
      </ModalBody>

      <ModalFooter
        onClose={onClose}
        onSubmit={submit}
        loading={loading}
        label={isEdit
          ? <><CheckCircle2 size={13} /> Enregistrer</>
          : <><Handshake size={13} /> Ajouter le partenaire</>}
        accentColor={C.sapphire}
      />
    </ModalShell>
  );
}

// ModalDon importée depuis components/modals/ModalDon.jsx

// ── Utilitaire : liste tous les mois depuis septembre 2025 ─────
function genererMoisDepuisDebut() {
  const MOIS_FR = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
  const liste = [];
  const now = new Date();
  let annee = 2025, moisIdx = 8;
  while (annee < now.getFullYear() || (annee === now.getFullYear() && moisIdx <= now.getMonth())) {
    liste.push(`${MOIS_FR[moisIdx]} ${annee}`);
    moisIdx++;
    if (moisIdx > 11) { moisIdx = 0; annee++; }
  }
  return liste;
}

function ModalCotisationsMembre({ membre, onClose, onDemandeAjout }) {
  const [cotisations, setCotis] = useState([]);
  const [loading, setLoad] = useState(true);
  const [error, setError] = useState(null);

  const fetchHistorique = useCallback(async () => {
    setLoad(true); setError(null);
    try {
      const { data } = await api.get(`${API.cotisations}?membre_id=${membre.id}`);
      setCotis(data.results ?? data);
    } catch { setError("Impossible de charger l'historique."); }
    finally { setLoad(false); }
  }, [membre.id]);

  useEffect(() => { fetchHistorique(); }, [fetchHistorique]);

  const tousLesMois = genererMoisDepuisDebut();
  const payesMap = {};
  cotisations.forEach(c => {
    const periode = c.periode_concernee ?? '';
    const estPaye = c.statut === 'PAYE' || c.statut === 'PAYEE' || c.paye === true;
    if (periode) {
      payesMap[periode.trim()] = {
        paye: estPaye, montant: c.montant, mode: c.mode_paiement,
        date: c.date_paiement ?? c.date_creation,
      };
    }
  });

  const nbPayes = tousLesMois.filter(m => payesMap[m]?.paye === true).length;
  const nbImpayes = tousLesMois.length - nbPayes;

  return (
    <ModalShell onClose={onClose} maxWidth="520px">
      <div style={{ background: `linear-gradient(135deg,${C.inkDeep},${C.emeraldDark})`, padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(16,185,129,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CreditCard size={16} style={{ color: C.emerald }} />
          </div>
          <div>
            <div style={{ fontFamily: '"DM Sans",sans-serif', fontSize: '10px', fontWeight: 700, letterSpacing: '.18em', textTransform: 'uppercase', color: 'rgba(16,185,129,.5)', marginBottom: '2px' }}>Gestion cotisations</div>
            <h3 style={{ fontFamily: '"Cormorant Garamond",serif', fontSize: '1.1rem', fontWeight: 700, color: C.offWhite, margin: 0 }}>{membre.display}</h3>
          </div>
        </div>
        <button onClick={onClose} style={{ width: '32px', height: '32px', borderRadius: '50%', background: C.inkMid, border: `1px solid ${C.inkBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: C.muted, transition: 'all .2s' }}
          onMouseEnter={e => { e.currentTarget.style.background = C.inkBorder; e.currentTarget.style.color = C.offWhite; }}
          onMouseLeave={e => { e.currentTarget.style.background = C.inkMid; e.currentTarget.style.color = C.muted; }}>
          <X size={14} />
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 24px', borderBottom: `1px solid ${C.inkBorder}`, flexShrink: 0, gap: '12px', flexWrap: 'wrap', background: C.inkMid }}>
        <div style={{ fontFamily: '"DM Sans",sans-serif', fontSize: '12.5px', color: C.muted }}>
          {loading ? 'Chargement…' : 'Depuis septembre 2025'}
        </div>
        <button onClick={() => onDemandeAjout?.()} style={{ ...btnPrimary(C.emerald), padding: '7px 14px', fontSize: '12px' }}
          onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
          <Plus size={12} strokeWidth={2.5} /> Nouvelle cotisation
        </button>
      </div>

      {!loading && !error && (
        <div style={{ display: 'flex', gap: '10px', padding: '14px 24px', borderBottom: `1px solid ${C.inkBorder}`, flexShrink: 0, background: C.inkCard }}>
          <div style={{ flex: 1, background: C.successBg, borderRadius: '10px', padding: '10px 14px', border: `1px solid ${C.emeraldBorder}` }}>
            <div style={{ fontFamily: '"Cormorant Garamond",serif', fontSize: '1.5rem', fontWeight: 800, color: C.success, lineHeight: 1 }}>{nbPayes}</div>
            <div style={{ fontFamily: '"DM Sans",sans-serif', fontSize: '10px', color: C.success, fontWeight: 700, marginTop: '2px', textTransform: 'uppercase', letterSpacing: '.07em' }}>Payé{nbPayes > 1 ? 's' : ''}</div>
          </div>
          <div style={{ flex: 1, background: nbImpayes > 0 ? C.dangerBg : C.inkMid, borderRadius: '10px', padding: '10px 14px', border: `1px solid ${nbImpayes > 0 ? C.roseBorder : C.inkBorder}` }}>
            <div style={{ fontFamily: '"Cormorant Garamond",serif', fontSize: '1.5rem', fontWeight: 800, color: nbImpayes > 0 ? C.rose : C.muted, lineHeight: 1 }}>{nbImpayes}</div>
            <div style={{ fontFamily: '"DM Sans",sans-serif', fontSize: '10px', color: nbImpayes > 0 ? C.rose : C.muted, fontWeight: 700, marginTop: '2px', textTransform: 'uppercase', letterSpacing: '.07em' }}>Impayé{nbImpayes > 1 ? 's' : ''}</div>
          </div>
          <div style={{ flex: 1, background: C.sapphireBg, borderRadius: '10px', padding: '10px 14px', border: `1px solid ${C.sapphireBorder}` }}>
            <div style={{ fontFamily: '"Cormorant Garamond",serif', fontSize: '1.5rem', fontWeight: 800, color: C.sapphire, lineHeight: 1 }}>{tousLesMois.length}</div>
            <div style={{ fontFamily: '"DM Sans",sans-serif', fontSize: '10px', color: C.sapphire, fontWeight: 700, marginTop: '2px', textTransform: 'uppercase', letterSpacing: '.07em' }}>Total</div>
          </div>
        </div>
      )}

      <div style={{ overflowY: 'auto', flex: 1, background: C.inkCard }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '48px 24px', color: C.muted, fontFamily: '"DM Sans",sans-serif', fontSize: '13px' }}>
            <Loader2 size={16} style={{ animation: 'spin 1s linear infinite', color: C.emerald }} /> Chargement…
          </div>
        ) : error ? (
          <div style={{ padding: '40px 24px', textAlign: 'center', color: C.rose, fontFamily: '"DM Sans",sans-serif', fontSize: '13px' }}>{error}</div>
        ) : (
          tousLesMois.map((mois, i) => {
            const entry = payesMap[mois];
            const paye = entry?.paye === true;
            return (
              <div key={mois} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 24px', background: i % 2 === 0 ? 'transparent' : C.inkMid, borderBottom: i < tousLesMois.length - 1 ? `1px solid ${C.inkBorder}20` : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0, background: paye ? C.success : C.rose, boxShadow: paye ? `0 0 0 3px ${C.successBg}` : `0 0 0 3px ${C.dangerBg}` }} />
                  <div>
                    <div style={{ fontFamily: '"DM Sans",sans-serif', fontSize: '13.5px', fontWeight: 600, color: C.offWhite }}>{mois}</div>
                    {paye && entry?.mode && (
                      <div style={{ fontFamily: '"DM Sans",sans-serif', fontSize: '11px', color: C.muted, marginTop: '1px' }}>
                        {MODE_CFG[entry.mode]?.label ?? entry.mode}
                        {entry.montant ? ` · ${fmtMontant(entry.montant)}` : ''}
                      </div>
                    )}
                  </div>
                </div>
                <Badge label={paye ? 'Payée' : 'Impayée'} color={paye ? C.success : C.rose} bg={paye ? C.successBg : C.dangerBg} />
              </div>
            );
          })
        )}
      </div>

      <div style={{ padding: '14px 24px', borderTop: `1px solid ${C.inkBorder}`, display: 'flex', justifyContent: 'flex-end', flexShrink: 0, background: C.inkMid }}>
        <button onClick={onClose} style={{ ...btnGhost }}>Fermer</button>
      </div>
    </ModalShell>
  );
}

function ModalCotisationAjout({ membre, onClose, onSuccess }) {
  const [form, setForm] = useState({
    annee: String(new Date().getFullYear()),
    montant: '10000',
    mode: 'VIREMENT',
    date: new Date().toISOString().slice(0, 10),
    mois: '',
  });
  const [loading, setLoad] = useState(false);
  const [error, setError] = useState(null);
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const submit = async () => {
    if (!form.montant || parseFloat(form.montant) <= 0) { setError('Montant invalide.'); return; }
    if (!form.date) { setError('La date de paiement est obligatoire.'); return; }
    setLoad(true); setError(null);
    try {
      const periodeLabel = form.mois ? `${form.mois} ${form.annee}` : `Année ${form.annee}`;
      const payload = {
        membre_id: membre.id,
        montant: parseFloat(form.montant),
        mode_paiement: form.mode,
        date_paiement: form.date,
        statut: 'PAYEE',
        periodicite: form.mois ? 'MENSUELLE' : 'ANNUELLE',
        periode_concernee: periodeLabel,
        annee: parseInt(form.annee),
        ...(form.mois ? { mois: form.mois } : {}),
      };
      await api.post(API.cotisations, payload);
      onSuccess?.();
    } catch (e) {
      const errData = e.response?.data;
      const msg = errData
        ? (typeof errData === 'string' ? errData : Object.entries(errData).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join(' | '))
        : 'Erreur serveur.';
      setError(msg);
    } finally { setLoad(false); }
  };

  return (
    <ModalShell onClose={onClose} maxWidth="480px">
      <ModalHeader eyebrow={`Cotisation — ${membre.display}`} title="Nouvelle cotisation" accentColor={C.emerald} onClose={onClose} />
      <ModalBody>
        <ErrorBox msg={error} />
        <FormRow label="Membre">
          <div style={{ ...IS(C.emerald), background: C.inkSoft, cursor: 'not-allowed', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={13} style={{ color: C.muted, flexShrink: 0 }} />{membre.display}
          </div>
        </FormRow>
        <FormRow label="Année *">
          <select value={form.annee} onChange={set('annee')} onFocus={focStyle(C.emerald)} onBlur={blrStyle()} style={{ ...IS(C.emerald), cursor: 'pointer' }}>
            {ANNEES_COTIS.map(a => (
              <option key={a} value={String(a)}>
                {a === ANNEE_COURANTE ? `${a} — Année en cours` : String(a)}
              </option>
            ))}
          </select>
        </FormRow>
        <FormRow label="Mois (optionnel)">
          <select value={form.mois} onChange={set('mois')} onFocus={focStyle(C.emerald)} onBlur={blrStyle()} style={{ ...IS(C.emerald), cursor: 'pointer', color: form.mois ? C.offWhite : C.muted }}>
            <option value="">— Cotisation annuelle —</option>
            {['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'].map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </FormRow>
        <FormRow label="Montant (FCFA) *">
          <input type="number" min="0" step="500" value={form.montant} onChange={set('montant')} onFocus={focStyle(C.emerald)} onBlur={blrStyle()} style={IS(C.emerald)} />
          <span style={{ fontFamily: '"DM Sans",sans-serif', fontSize: '11px', color: C.muted, marginTop: '4px', display: 'block' }}>
            Montant standard : 10 000 FCFA / an
          </span>
        </FormRow>
        <FormRow label="Mode de paiement *">
          <select value={form.mode} onChange={set('mode')} onFocus={focStyle(C.emerald)} onBlur={blrStyle()} style={{ ...IS(C.emerald), cursor: 'pointer' }}>
            {Object.entries(MODE_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </FormRow>
        <FormRow label="Date de paiement *">
          <input type="date" value={form.date} onChange={set('date')} onFocus={focStyle(C.emerald)} onBlur={blrStyle()} style={IS(C.emerald)} />
        </FormRow>
      </ModalBody>
      <ModalFooter onClose={onClose} onSubmit={submit} loading={loading}
        label={<><CheckCircle2 size={13} /> Enregistrer la cotisation</>}
        accentColor={C.emerald} />
    </ModalShell>
  );
}

// ════════════════════════════════════════════════════════════════
// ✅ NOUVELLE MODALE — Créer une action (v2 — avec upload image)
// ════════════════════════════════════════════════════════════════

// ── Palette propre à la modale ────────────────────────────────
const A = {
  noir:         '#0a0e1a',
  noirDeep:     '#060810',
  noirCard:     '#111827',
  noirSurface:  '#1a2235',
  noirBorder:   '#1e2d45',
  noirHover:    '#243050',
  or:           '#c9a84c',
  orLight:      '#e8c96a',
  orDark:       '#a07830',
  orAlpha:      'rgba(201,168,76,0.12)',
  orAlphaHover: 'rgba(201,168,76,0.20)',
  orGlow:       'rgba(201,168,76,0.25)',
  em:           '#10b981',
  emLight:      '#34d399',
  emDark:       '#059669',
  emAlpha:      'rgba(16,185,129,0.12)',
  emGlow:       'rgba(16,185,129,0.30)',
  white:        '#ffffff',
  text:         '#e2e8f0',
  textMuted:    '#94a3b8',
  textDim:      '#64748b',
  danger:       '#f87171',
  dangerBg:     'rgba(248,113,113,0.10)',
  dangerBorder: 'rgba(248,113,113,0.25)',
};

// ── Auth helpers ──────────────────────────────────────────────
const _getToken   = () =>
  localStorage.getItem('access_token') || sessionStorage.getItem('access_token') || '';
const _authHeader = () => ({ Authorization: `Bearer ${_getToken()}` });

// ── Style inputs ──────────────────────────────────────────────
const inputBase = (hasError = false) => ({
  width:        '100%',
  padding:      '11px 14px',
  borderRadius: '10px',
  border:       `1.5px solid ${hasError ? A.danger : A.noirBorder}`,
  background:   A.noirSurface,
  color:        A.text,
  fontFamily:   '"DM Sans", sans-serif',
  fontSize:     '13.5px',
  outline:      'none',
  boxSizing:    'border-box',
  transition:   'border-color .2s, box-shadow .2s',
  caretColor:   A.or,
});

// ── Field — label + erreur ────────────────────────────────────
function FieldModal({ label, required, error, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <label style={{
        fontFamily: '"DM Sans", sans-serif', fontSize: '10px', fontWeight: 700,
        letterSpacing: '0.14em', textTransform: 'uppercase',
        color: A.or, marginBottom: '6px', display: 'block',
      }}>
        {label}
        {required && <span style={{ color: A.em, marginLeft: '3px' }}>*</span>}
      </label>
      {children}
      {error && (
        <span style={{
          display: 'flex', alignItems: 'center', gap: '5px', marginTop: '5px',
          fontFamily: '"DM Sans", sans-serif', fontSize: '11px', color: A.danger,
        }}>
          <AlertCircle size={10} />{error}
        </span>
      )}
    </div>
  );
}

// ── Composant principal ───────────────────────────────────────
function ModalNouvelleAction({ onClose, onSuccess }) {
  const INIT = {
    titre: '', type: 'SENSIBILISATION', lieu: '', date_debut: '',
    date_cloture: '', description: '', statut: 'PLANIFIEE',
    nb_participants_max: '', budget_prevu: '',
  };

  const [form,         setForm]         = useState(INIT);
  const [imageFile,    setImageFile]    = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [errors,       setErrors]       = useState({});
  const [submitting,   setSubmitting]   = useState(false);
  const [submitError,  setSubmitError]  = useState(null);
  const fileRef = useRef(null);

  // Escape + scroll lock
  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', h);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: value }));
    if (errors[name]) setErrors(p => ({ ...p, [name]: null }));
  };

  const handleFocus = (e) => {
    e.target.style.borderColor = A.or;
    e.target.style.boxShadow   = `0 0 0 3px ${A.orGlow}`;
  };
  const handleBlur = (errKey) => (e) => {
    e.target.style.borderColor = errors[errKey] ? A.danger : A.noirBorder;
    e.target.style.boxShadow   = 'none';
  };

  // Image
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
      setErrors(p => ({ ...p, image: 'Format non supporté (JPG, PNG, WEBP).' }));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrors(p => ({ ...p, image: 'Taille max : 5 Mo.' }));
      return;
    }
    setImageFile(file);
    setErrors(p => ({ ...p, image: null }));
    const r = new FileReader();
    r.onload = (ev) => setImagePreview(ev.target.result);
    r.readAsDataURL(file);
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  // Validation
  const validate = () => {
    const e = {};
    if (!form.titre.trim()) e.titre     = 'Ce champ est obligatoire.';
    if (!form.date_debut)   e.date_debut = 'Ce champ est obligatoire.';
    if (form.date_cloture && form.date_debut && form.date_cloture < form.date_debut)
      e.date_cloture = 'Doit être après la date de début.';
    return e;
  };

  // Soumission
  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSubmitting(true);
    setSubmitError(null);
    try {
      const fd = new FormData();
      fd.append('titre',  form.titre.trim());
      fd.append('type',   form.type);
      fd.append('statut', form.statut);
      if (form.lieu.trim())         fd.append('lieu',               form.lieu.trim());
      if (form.date_debut)          fd.append('date_debut',         form.date_debut);
      if (form.date_cloture)        fd.append('date_cloture',       form.date_cloture);
      if (form.description.trim())  fd.append('description',        form.description.trim());
      if (form.budget_prevu)        fd.append('budget_prevu',       parseFloat(form.budget_prevu));
      if (form.nb_participants_max) fd.append('nb_participants_max', parseInt(form.nb_participants_max));
      if (imageFile)                fd.append('image',              imageFile, imageFile.name);
      await axios.post('http://127.0.0.1:8000/api/actions/', fd, { headers: _authHeader() });
      onSuccess?.();
      onClose();
    } catch (err) {
      const d = err.response?.data;
      if (d && typeof d === 'object') {
        const fe = {};
        Object.entries(d).forEach(([k, v]) => { fe[k] = Array.isArray(v) ? v[0] : String(v); });
        setErrors(fe);
        setSubmitError('Veuillez corriger les erreurs ci-dessous.');
      } else {
        setSubmitError('Erreur serveur. Veuillez réessayer.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <style>{`
        @keyframes modal-action-in {
          from { opacity:0; transform:scale(.96) translateY(16px); }
          to   { opacity:1; transform:scale(1)   translateY(0);    }
        }
        @keyframes spin-modal { to { transform: rotate(360deg); } }
        .inin-input::placeholder  { color: ${A.textDim}; }
        .inin-select option        { background: ${A.noirCard}; color: ${A.text}; }
        .inin-upload:hover         { border-color: ${A.or} !important; background: ${A.orAlphaHover} !important; }
        .inin-upload:hover .upload-icon  { color: ${A.orLight} !important; }
        .inin-upload:hover .upload-label { color: ${A.text}    !important; }
        .inin-btn-cancel:hover  { background: ${A.noirHover} !important; border-color: ${A.or} !important; color: ${A.or} !important; }
        .inin-btn-submit:hover  { box-shadow: 0 8px 28px ${A.emGlow} !important; transform: translateY(-1px) !important; }
        .inin-btn-submit:active { transform: translateY(0) !important; }
        .inin-close-btn:hover   { background: rgba(248,113,113,0.15) !important; border-color: rgba(248,113,113,0.4) !important; }
        .inin-close-btn:hover svg { color: ${A.danger} !important; }
      `}</style>

      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(6,8,16,0.82)',
          backdropFilter: 'blur(7px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '20px',
        }}
      >
        {/* Panneau */}
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            background:    A.noirCard,
            borderRadius:  '20px',
            border:        `1px solid ${A.noirBorder}`,
            boxShadow:     `0 0 0 1px ${A.orAlpha}, 0 32px 80px rgba(0,0,0,0.7)`,
            width: '100%', maxWidth: '660px', maxHeight: '92vh',
            overflow: 'hidden', display: 'flex', flexDirection: 'column',
            animation: 'modal-action-in .32s cubic-bezier(.22,1,.36,1) both',
          }}
        >

          {/* ══ EN-TÊTE ══ */}
          <div style={{
            position: 'relative', padding: '22px 26px 20px',
            borderBottom: `1px solid ${A.noirBorder}`,
            background: `linear-gradient(135deg, ${A.noirDeep} 0%, ${A.noirCard} 100%)`,
            overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute', top: '-40px', right: '-40px',
              width: '140px', height: '140px', borderRadius: '50%',
              background: `radial-gradient(circle, ${A.orAlpha} 0%, transparent 70%)`,
              pointerEvents: 'none',
            }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                  width: '44px', height: '44px', borderRadius: '12px', flexShrink: 0,
                  background: `linear-gradient(135deg, ${A.orDark}, ${A.or})`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: `0 4px 16px ${A.orGlow}`,
                }}>
                  <Plus size={20} style={{ color: A.noirDeep }} strokeWidth={2.5} />
                </div>
                <div>
                  <div style={{
                    fontFamily: '"DM Sans", sans-serif', fontSize: '10px', fontWeight: 700,
                    letterSpacing: '0.18em', textTransform: 'uppercase',
                    color: A.or, marginBottom: '3px',
                  }}>
                    Actions &amp; Projets
                  </div>
                  <h2 style={{
                    fontFamily: '"Cormorant Garamond", serif',
                    fontSize: '1.55rem', fontWeight: 700, color: A.white,
                    margin: 0, lineHeight: 1.1,
                  }}>
                    Nouvelle action
                  </h2>
                </div>
              </div>
              <button className="inin-close-btn" onClick={onClose} style={{
                width: '34px', height: '34px', borderRadius: '9px', flexShrink: 0,
                border: `1px solid ${A.noirBorder}`, background: A.noirSurface,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', transition: 'all .2s',
              }}>
                <X size={15} style={{ color: A.textMuted, transition: 'color .2s' }} />
              </button>
            </div>
          </div>

          {/* ══ CORPS ══ */}
          <div style={{ overflowY: 'auto', flex: 1, padding: '24px 26px', display: 'flex', flexDirection: 'column', gap: '18px' }}>

            {/* Erreur globale */}
            {submitError && (
              <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '11px 14px', borderRadius: '10px',
                  background: A.dangerBg, border: `1px solid ${A.dangerBorder}`,
                }}>
                <AlertCircle size={14} style={{ color: A.danger, flexShrink: 0 }} />
                <span style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '12.5px', color: A.danger }}>{submitError}</span>
              </motion.div>
            )}

            {/* Titre */}
            <FieldModal label="Titre de l'action" required error={errors.titre}>
              <input className="inin-input" name="titre" value={form.titre}
                onChange={handleChange} style={inputBase(!!errors.titre)}
                placeholder="Ex : Campagne de sensibilisation Dakar 2026"
                onFocus={handleFocus} onBlur={handleBlur('titre')} />
            </FieldModal>

            {/* Type + Statut */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <FieldModal label="Type d'action" required error={errors.type}>
                <select className="inin-select" name="type" value={form.type} onChange={handleChange}
                  style={{
                    ...inputBase(!!errors.type), cursor: 'pointer', appearance: 'none',
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23c9a84c' stroke-width='2.5'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', paddingRight: '36px',
                  }}
                  onFocus={handleFocus} onBlur={handleBlur('type')}>
                  {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </FieldModal>

              <FieldModal label="Statut initial" required error={errors.statut}>
                <select className="inin-select" name="statut" value={form.statut} onChange={handleChange}
                  style={{
                    ...inputBase(!!errors.statut), cursor: 'pointer', appearance: 'none',
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23c9a84c' stroke-width='2.5'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', paddingRight: '36px',
                  }}
                  onFocus={handleFocus} onBlur={handleBlur('statut')}>
                  {STATUT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </FieldModal>
            </div>

            {/* Description */}
            <FieldModal label="Description" required error={errors.description}>
              <textarea className="inin-input" name="description" value={form.description}
                onChange={handleChange} rows={4}
                style={{ ...inputBase(!!errors.description), resize: 'vertical', minHeight: '96px', lineHeight: '1.65' }}
                placeholder="Objectifs, public cible, déroulement prévu…"
                onFocus={handleFocus} onBlur={handleBlur('description')} />
            </FieldModal>

            {/* Dates */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <FieldModal label="Date de début" required error={errors.date_debut}>
                <input className="inin-input" type="date" name="date_debut" value={form.date_debut}
                  onChange={handleChange} style={{ ...inputBase(!!errors.date_debut), colorScheme: 'dark' }}
                  onFocus={handleFocus} onBlur={handleBlur('date_debut')} />
              </FieldModal>
              <FieldModal label="Date de clôture (optionnel)" error={errors.date_cloture}>
                <input className="inin-input" type="date" name="date_cloture" value={form.date_cloture}
                  onChange={handleChange} style={{ ...inputBase(!!errors.date_cloture), colorScheme: 'dark' }}
                  onFocus={handleFocus} onBlur={handleBlur('date_cloture')} />
              </FieldModal>
            </div>

            {/* Lieu + Budget */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <FieldModal label="Lieu" error={errors.lieu}>
                <input className="inin-input" name="lieu" value={form.lieu}
                  onChange={handleChange} placeholder="Dakar, Thiès…"
                  style={inputBase(!!errors.lieu)}
                  onFocus={handleFocus} onBlur={handleBlur('lieu')} />
              </FieldModal>
              <FieldModal label="Budget prévu (FCFA)" error={errors.budget_prevu}>
                <input className="inin-input" type="number" name="budget_prevu" value={form.budget_prevu}
                  onChange={handleChange} placeholder="0" min="0"
                  style={inputBase(!!errors.budget_prevu)}
                  onFocus={handleFocus} onBlur={handleBlur('budget_prevu')} />
              </FieldModal>
            </div>

            {/* Capacité */}
            <FieldModal label="Capacité maximale (laisser vide = illimitée)" error={errors.nb_participants_max}>
              <input className="inin-input" type="number" name="nb_participants_max"
                value={form.nb_participants_max} onChange={handleChange}
                placeholder="Ex : 50" min="1" style={inputBase(!!errors.nb_participants_max)}
                onFocus={handleFocus} onBlur={handleBlur('nb_participants_max')} />
            </FieldModal>

            {/* Upload image */}
            <FieldModal label="Photo de l'action (optionnel)" error={errors.image}>
              {imagePreview ? (
                <div style={{
                  position: 'relative', borderRadius: '12px', overflow: 'hidden',
                  border: `1.5px solid ${A.or}`, boxShadow: `0 0 0 3px ${A.orAlpha}`,
                }}>
                  <img src={imagePreview} alt="Aperçu"
                    style={{ width: '100%', height: '140px', objectFit: 'cover', display: 'block' }} />
                  <div style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0,
                    padding: '8px 12px',
                    background: 'linear-gradient(transparent, rgba(6,8,16,0.8))',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}>
                    <span style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '11px', color: A.text, fontWeight: 600 }}>
                      {imageFile?.name}
                    </span>
                    <button onClick={removeImage} style={{
                      width: '22px', height: '22px', borderRadius: '50%', border: 'none',
                      background: 'rgba(248,113,113,0.85)', color: A.white,
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <X size={10} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="inin-upload" onClick={() => fileRef.current?.click()}
                  style={{
                    border: `2px dashed ${A.noirBorder}`, borderRadius: '12px',
                    padding: '20px 18px', background: A.noirSurface, cursor: 'pointer',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
                    transition: 'all .25s ease',
                  }}>
                  <ImageIcon className="upload-icon" size={22}
                    style={{ color: A.textDim, transition: 'color .2s' }} />
                  <span className="upload-label" style={{
                    fontFamily: '"DM Sans", sans-serif', fontSize: '12.5px',
                    color: A.textDim, transition: 'color .2s', textAlign: 'center',
                  }}>
                    Cliquez pour sélectionner une image
                    <br />
                    <span style={{ fontSize: '11px', opacity: 0.7 }}>JPG, PNG, WEBP — max 5 Mo</span>
                  </span>
                </div>
              )}
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleImageChange} style={{ display: 'none' }} />
            </FieldModal>

            {/* Note responsable */}
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: '10px',
              padding: '11px 14px', borderRadius: '10px',
              background: A.emAlpha, border: `1px solid rgba(16,185,129,0.20)`,
            }}>
              <Info size={14} style={{ color: A.em, flexShrink: 0, marginTop: '1px' }} />
              <span style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '12px', color: A.emLight, lineHeight: 1.55 }}>
                Vous serez automatiquement assigné·e comme <strong>responsable</strong> de cette action.
              </span>
            </div>
          </div>

          {/* ══ PIED ══ */}
          <div style={{
            padding: '16px 26px', borderTop: `1px solid ${A.noirBorder}`,
            background: A.noirDeep,
            display: 'flex', justifyContent: 'flex-end', gap: '10px', flexShrink: 0,
          }}>
            <button className="inin-btn-cancel" onClick={onClose} disabled={submitting}
              style={{
                padding: '10px 22px', borderRadius: '10px',
                border: `1.5px solid ${A.noirBorder}`, background: 'transparent',
                color: A.textMuted, fontSize: '13px', fontWeight: 600,
                fontFamily: '"DM Sans", sans-serif', cursor: 'pointer', transition: 'all .2s',
                opacity: submitting ? 0.5 : 1,
              }}>
              Annuler
            </button>

            <button className="inin-btn-submit" onClick={handleSubmit} disabled={submitting}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                padding: '10px 26px', borderRadius: '10px', border: 'none',
                background: submitting ? A.noirSurface : `linear-gradient(135deg, ${A.emDark}, ${A.em})`,
                color: submitting ? A.textDim : A.white,
                fontSize: '13.5px', fontWeight: 700,
                fontFamily: '"DM Sans", sans-serif',
                cursor: submitting ? 'wait' : 'pointer',
                boxShadow: submitting ? 'none' : `0 4px 18px ${A.emGlow}`,
                transition: 'all .25s cubic-bezier(.34,1.56,.64,1)',
              }}>
              {submitting ? (
                <><Loader2 size={14} style={{ animation: 'spin-modal 1s linear infinite' }} /> Création en cours…</>
              ) : (
                <><Sparkles size={14} /> Créer l'action</>
              )}
            </button>
          </div>

        </div>
      </motion.div>
    </>
  );
}

// ════════════════════════════════════════════════════════════════
// ONGLET 0 — Vue d'ensemble
// ════════════════════════════════════════════════════════════════
// ⚠️ Reçoit maintenant onNewAction en prop
function TabOverview({ stats, loading, navigate, onNewAction }) {
  const shortcuts = [
    { label: 'Analytics',        icon: BarChart3, color: C.gold,     action: () => navigate('/admin/analytics') },
    { label: 'Nouvelle action',  icon: Sparkles,  color: C.emerald,  action: onNewAction                        },
    { label: 'Rapport finances', icon: FileText,  color: C.sapphire, action: () => navigate('/admin/analytics') },
    { label: 'Accès publics',    icon: Globe,     color: C.violet,   action: () => navigate('/actions')         },
  ];

  return (
    <motion.div key="overview" variants={tabContent} initial="hidden" animate="show" exit="exit">
      {/* Bannière Analytics */}
      <div style={{ background: `linear-gradient(135deg,${C.inkMid} 0%,${C.inkCard} 40%,#1a2040 100%)`,
        borderRadius: '16px', padding: '28px 32px', marginBottom: '28px',
        border: `1px solid ${C.goldBorder}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: '20px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '180px',
          height: '180px', borderRadius: '50%', background: C.gold, opacity: .04,
          filter: 'blur(40px)', pointerEvents: 'none' }} />
        <div>
          <div style={{ fontFamily: '"DM Sans",sans-serif', fontSize: '10px', fontWeight: 700,
            color: C.gold, letterSpacing: '0.2em', textTransform: 'uppercase',
            marginBottom: '8px', opacity: .8 }}>
            Centre de contrôle
          </div>
          <h2 style={{ fontFamily: '"Cormorant Garamond",serif', fontSize: '1.8rem',
            fontWeight: 700, color: C.offWhite, margin: '0 0 8px', letterSpacing: '0.01em' }}>
            Vue d'ensemble de l'association ININ
          </h2>
          <p style={{ fontFamily: '"DM Sans",sans-serif', fontSize: '13px',
            color: C.mutedDark, margin: 0 }}>
            Toutes les métriques clés en un seul regard. Naviguez par onglets pour accéder à chaque module.
          </p>
        </div>
        <button onClick={() => navigate('/admin/analytics')}
          style={{ ...btnPrimary(C.gold), padding: '12px 24px', fontSize: '13px' }}
          onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
          <BarChart3 size={15} /> Consulter Analytics <ChevronRight size={14} />
        </button>
      </div>

      {/* Résumé financier */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))',
        gap: '14px', marginBottom: '28px' }}>
        {[
          { label: 'Total Dons',     value: fmtMontant(stats?.total_dons),       color: C.gold,     icon: Banknote   },
          { label: 'Cotisations',    value: fmtMontant(stats?.total_cotisations), color: C.emerald,  icon: CreditCard },
          { label: 'Dépenses',       value: fmtMontant(stats?.total_depenses),    color: C.rose,     icon: Wallet     },
          { label: 'Actions menées', value: stats?.nb_actions_realisees ?? '—',   color: C.sapphire, icon: Sparkles   },
          { label: 'Bénéficiaires',  value: stats?.nb_total_beneficiaires ?? '—', color: C.violet,   icon: Users      },
        ].map((item) => (
          <div key={item.label} style={{ background: C.inkCard, borderRadius: '12px',
            border: `1px solid ${C.inkBorder}`, padding: '16px',
            display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '9px',
              background: item.color + '15', display: 'flex', alignItems: 'center',
              justifyContent: 'center', flexShrink: 0 }}>
              <item.icon size={16} style={{ color: item.color }} />
            </div>
            <div>
              <div style={{ fontFamily: '"Cormorant Garamond",serif', fontSize: '1.2rem',
                fontWeight: 700, color: C.offWhite, lineHeight: 1 }}>
                {loading ? '…' : item.value}
              </div>
              <div style={{ fontFamily: '"DM Sans",sans-serif', fontSize: '10.5px',
                color: C.mutedDark, fontWeight: 600, textTransform: 'uppercase',
                letterSpacing: '0.07em', marginTop: '3px' }}>
                {item.label}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Raccourcis */}
      <div style={{ background: C.inkCard, borderRadius: '16px',
        border: `1px solid ${C.inkBorder}`, padding: '20px' }}>
        <div style={{ fontFamily: '"DM Sans",sans-serif', fontSize: '10.5px', fontWeight: 700,
          color: C.mutedDark, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px' }}>
          Accès rapide
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: '10px' }}>
          {shortcuts.map((s) => (
            <button key={s.label} onClick={s.action}
              style={{ display: 'flex', alignItems: 'center', gap: '10px',
                padding: '14px 16px', borderRadius: '11px',
                background: s.color + '0a', border: `1px solid ${s.color}20`,
                cursor: 'pointer', transition: 'all .22s', textAlign: 'left' }}
              onMouseEnter={e => { e.currentTarget.style.background = s.color + '18'; e.currentTarget.style.borderColor = s.color + '40'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = s.color + '0a'; e.currentTarget.style.borderColor = s.color + '20'; e.currentTarget.style.transform = 'translateY(0)'; }}>
              <div style={{ width: '34px', height: '34px', borderRadius: '9px',
                background: s.color + '20', display: 'flex', alignItems: 'center',
                justifyContent: 'center', flexShrink: 0 }}>
                <s.icon size={16} style={{ color: s.color }} />
              </div>
              <span style={{ fontFamily: '"DM Sans",sans-serif', fontSize: '12.5px',
                fontWeight: 600, color: C.offWhite }}>{s.label}</span>
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ════════════════════════════════════════════════════════════════
// ONGLET 1 — Utilisateurs & Membres
// ════════════════════════════════════════════════════════════════
function TabUsers() {
  const [users,   setUsers]   = useState([]);
  const [membres, setMembres] = useState([]);
  const [ldUsers, setLdU]     = useState(true);
  const [ldMem,   setLdM]     = useState(true);
  const [errU,    setErrU]    = useState(null);
  const [errM,    setErrM]    = useState(null);
  const [modal,   setModal]   = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [delLoad, setDelLoad] = useState(false);
  const [searchU, setSearchU] = useState('');
  const [searchM, setSearchM] = useState('');

  const fetchUsers = useCallback(async () => {
    setLdU(true); setErrU(null);
    try {
      const { data } = await api.get(API.users);
      setUsers(data.results ?? data);
    } catch { setErrU('Impossible de charger les utilisateurs.'); }
    finally  { setLdU(false); }
  }, []);

  const fetchMembres = useCallback(async () => {
    setLdM(true); setErrM(null);
    try {
      const { data } = await api.get(API.membres);
      setMembres(data.results ?? data);
    } catch { setErrM('Impossible de charger les membres.'); }
    finally  { setLdM(false); }
  }, []);

  useEffect(() => { fetchUsers(); fetchMembres(); }, [fetchUsers, fetchMembres]);

  const doDelete = async () => {
    if (!confirm) return;
    setDelLoad(true);
    try {
      if (confirm.type === 'user') await api.delete(API.userById(confirm.id));
      else                          await api.delete(API.membreById(confirm.id));
      setConfirm(null);
      if (confirm.type === 'user') fetchUsers(); else fetchMembres();
    } catch {}
    finally { setDelLoad(false); }
  };

  const filteredU = users.filter((u) => {
    const q = searchU.toLowerCase();
    return !q || `${u.first_name} ${u.last_name} ${u.email}`.toLowerCase().includes(q);
  });

  const filteredM = membres.filter((m) => {
    const q = searchM.toLowerCase();
    return !q || `${m.prenom ?? ''} ${m.nom ?? ''} ${m.email ?? ''}`.toLowerCase().includes(q);
  });

  const SearchInput = ({ value, onChange, placeholder }) => (
    <div style={{ position: 'relative' }}>
      <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%',
        transform: 'translateY(-50%)', color: C.mutedDark, pointerEvents: 'none' }} />
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ ...IS(C.gold), paddingLeft: '30px', width: '200px' }}
        onFocus={focStyle(C.gold)} onBlur={blrStyle()} />
    </div>
  );

  const editBtn = (row, type) => (
    <button onClick={() => setModal({ type, data: row })}
      style={{ ...btnGhost, padding: '5px 10px', fontSize: '11.5px' }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = C.gold; e.currentTarget.style.color = C.gold; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = C.inkBorder; e.currentTarget.style.color = C.muted; }}>
      <Pencil size={11} /> Modifier
    </button>
  );

  const delBtn = (row, type, msg) => (
    <button onClick={() => setConfirm({ id: row.id, type, msg })} style={btnDanger}
      onMouseEnter={e => { e.currentTarget.style.background = C.rose; e.currentTarget.style.color = C.white; }}
      onMouseLeave={e => { e.currentTarget.style.background = C.dangerBg; e.currentTarget.style.color = C.rose; }}>
      <Trash2 size={11} />
    </button>
  );

  return (
    <motion.div key="users" variants={tabContent} initial="hidden" animate="show" exit="exit"
      style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <SectionCard title="Utilisateurs — Accès au site" icon={Lock}
        subtitle={`${filteredU.length} compte${filteredU.length > 1 ? 's' : ''}`}
        accentColor={C.gold}
        headerRight={
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <SearchInput value={searchU} onChange={setSearchU} placeholder="Rechercher…" />
            <button onClick={() => setModal({ type: 'user', data: null })} style={btnPrimary(C.gold)}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
              <UserPlus size={13} /> Ajouter
            </button>
          </div>
        }>
        <DataTable loading={ldUsers} error={errU} data={filteredU} empty="Aucun utilisateur."
          columns={[
            { label: 'Utilisateur', key: 'name', primary: true, render: (row) => (
              <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                <div style={{ width: '30px', height: '30px', borderRadius: '50%', flexShrink: 0,
                  background: C.goldBg, border: `1px solid ${C.goldBorder}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: '"Cormorant Garamond",serif', fontSize: '12px', fontWeight: 700, color: C.gold }}>
                  {(row.first_name || row.email || '?').slice(0, 1).toUpperCase()}
                </div>
                <span style={{ fontFamily: '"DM Sans",sans-serif', fontSize: '13px', fontWeight: 600, color: C.offWhite }}>
                  {row.first_name} {row.last_name}
                </span>
              </div>
            )},
            { label: 'Email',  key: 'email',     noWrap: true },
            { label: 'Rôle',   key: 'role',      render: (r) => roleBadge(r.role) },
            { label: 'Statut', key: 'is_active',  render: (r) => statutBadge(r.is_active ? 'ACTIF' : 'INACTIF') },
          ]}
          actions={(row) => <>{editBtn(row, 'user')}{delBtn(row, 'user', `Supprimer l'accès de ${row.first_name} ${row.last_name} ?`)}</>}
        />
      </SectionCard>

      <SectionCard title="Membres — Fiches adhérents" icon={Users}
        subtitle={`${filteredM.length} membre${filteredM.length > 1 ? 's' : ''}`}
        accentColor={C.emerald}
        headerRight={
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <SearchInput value={searchM} onChange={setSearchM} placeholder="Rechercher…" />
            <button onClick={() => setModal({ type: 'membre', data: null })} style={btnPrimary(C.emerald)}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
              <Plus size={13} /> Ajouter
            </button>
          </div>
        }>
        <DataTable loading={ldMem} error={errM} data={filteredM} empty="Aucun membre."
          columns={[
            { label: 'Nom complet', key: 'name', primary: true, render: (row) => (
              <span style={{ fontFamily: '"DM Sans",sans-serif', fontSize: '13px', fontWeight: 600, color: C.offWhite }}>
                {row.prenom ?? row.first_name ?? ''} {row.nom ?? row.last_name ?? ''}
              </span>
            )},
            { label: 'Type', key: 'type_membre', render: (r) => (
              <Badge label={TYPES_MEMBRE.find(t => t.key === r.type_membre)?.label ?? r.type_membre ?? '—'}
                color={C.emerald} bg={C.emeraldBg} />
            )},
            { label: 'Téléphone', key: 'telephone', noWrap: true },
            { label: 'Statut',    key: 'statut',    render: (r) => statutBadge(r.statut) },
          ]}
          actions={(row) => <>{editBtn(row, 'membre')}{delBtn(row, 'membre', `Supprimer la fiche de ${row.prenom ?? ''} ${row.nom ?? ''} ?`)}</>}
        />
      </SectionCard>

      <AnimatePresence>
        {modal?.type === 'user'   && <ModalUser    initial={modal.data} onClose={() => setModal(null)} onSuccess={() => { setModal(null); fetchUsers(); }} />}
        {modal?.type === 'membre' && <ModalMembre  initial={modal.data} onClose={() => setModal(null)} onSuccess={() => { setModal(null); fetchMembres(); }} />}
        {confirm && <ConfirmModal message={confirm.msg} loading={delLoad} onConfirm={doDelete} onClose={() => setConfirm(null)} />}
      </AnimatePresence>
    </motion.div>
  );
}

// ════════════════════════════════════════════════════════════════
// ONGLET 2 — Finances
// ════════════════════════════════════════════════════════════════
function TabFinances({ user }) {
  const [dons,     setDons]   = useState([]);
  const [depenses, setDep]    = useState([]);
  const [membres,  setMembres] = useState([]);
  const [ldD,      setLdD]    = useState(true);
  const [ldDep,    setLdDep]  = useState(true);
  const [ldMembres, setLdMembres] = useState(true);
  const [errD,     setErrD]   = useState(null);
  const [errDep,   setErrDep] = useState(null);
  const [showDon,  setShowDon] = useState(false);

  // ── États pour Cotisations ────────────────────────────
  const [membreChoisi, setMembreChoisi] = useState(null);
  const [showAjout, setShowAjout] = useState(false);
  const [summaries, setSummaries] = useState({});
  const [ldSummaries, setLdSummaries] = useState(false);
  const [recherche, setRecherche] = useState('');

  const fetchDons = useCallback(async () => {
    setLdD(true); setErrD(null);
    try { const { data } = await api.get(API.dons); setDons(data.results ?? data); }
    catch { setErrD('Erreur chargement dons.'); }
    finally { setLdD(false); }
  }, []);

  const fetchDep = useCallback(async () => {
    setLdDep(true); setErrDep(null);
    try { const { data } = await api.get(API.depenses); setDep(data.results ?? data); }
    catch { setErrDep('Erreur chargement dépenses.'); }
    finally { setLdDep(false); }
  }, []);

  const fetchMembres = useCallback(async () => {
    setLdMembres(true);
    try {
      const { data } = await api.get(API.membres);
      const liste = (data.results ?? data).map((m) => ({
        id:      m.id,
        display: `${m.prenom ?? ''} ${m.nom ?? ''}`.trim() || m.email,
        email:   m.email,
      }));
      setMembres(liste);
    } catch { setMembres([]); }
    finally { setLdMembres(false); }
  }, []);

  const fetchSummaries = useCallback(async () => {
    if (!membres.length) return;
    setLdSummaries(true);
    try {
      const { data } = await api.get(API.cotisations);
      const liste = data.results ?? data;
      const anneeCourante = new Date().getFullYear();
      const map = {};
      liste.forEach(c => {
        const mid = c.membre?.id ?? c.membre ?? c.membre_id;
        if (!map[mid]) map[mid] = { count: 0, aJour: false };
        map[mid].count++;
        const estPaye = c.statut === 'PAYE' || c.statut === 'PAYEE' || c.paye === true;
        const periodeAnnee = c.periode_concernee
          ? parseInt(c.periode_concernee.split(' ').pop())
          : c.annee;
        if (periodeAnnee === anneeCourante && estPaye) map[mid].aJour = true;
      });
      setSummaries(map);
    } catch {}
    finally { setLdSummaries(false); }
  }, [membres.length]);

  useEffect(() => { fetchDons(); fetchDep(); fetchMembres(); }, [fetchDons, fetchDep, fetchMembres]);
  useEffect(() => { fetchSummaries(); }, [fetchSummaries]);

  const membresFiltres = membres.filter(m =>
    m.display.toLowerCase().includes(recherche.toLowerCase())
  );
  const anneeCourante = new Date().getFullYear();


  return (
    <motion.div key="finances" variants={tabContent} initial="hidden" animate="show" exit="exit"
      style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* ✅ CARTE UNIQUE : Enregistrer un don */}
      <button onClick={() => setShowDon(true)}
        style={{ display: 'flex', alignItems: 'center', gap: '14px',
          padding: '18px 20px', borderRadius: '14px',
          background: C.goldBg, border: `1px solid ${C.goldBorder}`,
          cursor: 'pointer', textAlign: 'left', transition: 'all .22s', width: '100%' }}
        onMouseEnter={e => { e.currentTarget.style.background = C.gold + '15'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 8px 24px ${C.gold}20`; }}
        onMouseLeave={e => { e.currentTarget.style.background = C.goldBg; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
        <div style={{ width: '44px', height: '44px', borderRadius: '12px',
          background: C.gold + '20', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Banknote size={20} style={{ color: C.gold }} />
        </div>
        <div>
          <div style={{ fontFamily: '"DM Sans",sans-serif', fontSize: '14px', fontWeight: 700, color: C.offWhite, marginBottom: '3px' }}>Enregistrer un don</div>
          <div style={{ fontFamily: '"DM Sans",sans-serif', fontSize: '12px', color: C.mutedDark }}>Saisir un nouveau don reçu.</div>
        </div>
      </button>

      {/* ✅ SECTION COTISATIONS DES MEMBRES */}
      <SectionCard title="Cotisations des membres" icon={CreditCard} accentColor={C.emerald}
        subtitle={`${membresFiltres.length} membre${membresFiltres.length > 1 ? 's' : ''}`}
        headerRight={
          <div style={{ position: 'relative' }}>
            <Filter size={13} style={{ position: 'absolute', left: '10px', top: '50%',
              transform: 'translateY(-50%)', color: C.mutedDark, pointerEvents: 'none' }} />
            <input type="text" value={recherche} onChange={(e) => setRecherche(e.target.value)}
              placeholder="Rechercher…"
              style={{ ...IS(C.emerald), paddingLeft: '30px', width: '200px' }}
              onFocus={focStyle(C.emerald)} onBlur={blrStyle()} />
          </div>
        }>
        <DataTable loading={ldMembres} error={null} data={membresFiltres} empty="Aucun membre disponible."
          columns={[
            { label: 'Membre', key: 'display', primary: true, render: (m) => (
              <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                <div style={{ width: '30px', height: '30px', borderRadius: '50%',
                  background: `linear-gradient(135deg,${C.emerald},${C.emeraldDark})`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontFamily: '"DM Sans",sans-serif', fontSize: '10px', fontWeight: 800, color: C.white }}>
                    {m.display.slice(0, 2).toUpperCase()}
                  </span>
                </div>
                <span style={{ fontFamily: '"DM Sans",sans-serif', fontSize: '13px', fontWeight: 600, color: C.offWhite }}>{m.display}</span>
              </div>
            )},
            { label: `Cotisation ${anneeCourante}`, key: 'status', render: (m) => {
              const sum = summaries[m.id];
              const aJour = sum?.aJour ?? false;
              const loaded = !ldSummaries;
              if (!loaded) return <div style={{ width:'70px', height:'22px', borderRadius:'100px', background:C.inkBorder, animation:'pulse 1.4s ease-in-out infinite' }}/>;
              return <Badge label={aJour ? 'À jour' : 'En attente'}
                color={aJour ? C.success : C.rose}
                bg={aJour ? C.successBg : C.dangerBg} />;
            }},
            { label: 'Historique', key: 'history', render: (m) => {
              const nbCotis = summaries[m.id]?.count ?? 0;
              const loaded = !ldSummaries;
              if (!loaded) return '…';
              return (
                <span style={{ fontFamily: '"DM Sans",sans-serif', fontSize: '12px', color: C.muted }}>
                  {nbCotis === 0 ? 'Aucune cotisation' : `${nbCotis} cotisation${nbCotis > 1 ? 's' : ''}`}
                </span>
              );
            }},
          ]}
          actions={(m) => (
            <button onClick={() => setMembreChoisi(m)}
              style={{ ...btnGhost, padding: '5px 10px', fontSize: '11.5px' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = C.emerald; e.currentTarget.style.color = C.emerald; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.inkBorder; e.currentTarget.style.color = C.muted; }}>
              <CreditCard size={11} /> Gérer
            </button>
          )}
        />
      </SectionCard>

      <SectionCard title="Dons reçus" icon={Heart} accentColor={C.gold}
        subtitle={`${dons.length} don${dons.length > 1 ? 's' : ''} enregistré${dons.length > 1 ? 's' : ''}`}
        headerRight={
          <button onClick={fetchDons} style={{ ...btnGhost, fontSize: '11.5px', padding: '6px 11px' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = C.gold; e.currentTarget.style.color = C.gold; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.inkBorder; e.currentTarget.style.color = C.muted; }}>
            <RefreshCw size={11} /> Actualiser
          </button>
        }>
        <DataTable loading={ldD} error={errD} data={dons} empty="Aucun don enregistré."
          columns={[
            { label: 'Donateur', key: 'donateur_display', primary: true, render: (r) => (
              <span style={{ fontFamily: '"DM Sans",sans-serif', fontSize: '13px', fontWeight: 600, color: C.offWhite }}>
                {r.donateur_display ?? (r.anonyme ? 'Anonyme' : '—')}
              </span>
            )},
            { label: 'Montant', key: 'montant', render: (r) => (
              <span style={{ fontFamily: '"Cormorant Garamond",serif', fontSize: '1.1rem', fontWeight: 700, color: C.gold }}>{fmtMontant(r.montant)}</span>
            )},
            { label: 'Mode',  key: 'mode_paiement_display', noWrap: true },
            { label: 'Date',  key: 'date_don', render: (r) => (
              <span style={{ fontFamily: '"DM Sans",sans-serif', fontSize: '12px', color: C.muted, whiteSpace: 'nowrap' }}>{fmtDate(r.date_don)}</span>
            )},
            { label: 'Reçu', key: 'recu_genere', render: (r) => (
              r.recu_genere
                ? <Badge label="Généré"     color={C.success} bg={C.successBg} />
                : <Badge label="Non généré" color={C.muted}   bg={C.inkMid}    />
            )},
          ]}
        />
      </SectionCard>

      <SectionCard title="Dépenses" icon={Wallet} accentColor={C.rose}
        subtitle={`${depenses.length} dépense${depenses.length > 1 ? 's' : ''} enregistrée${depenses.length > 1 ? 's' : ''}`}
        headerRight={
          <button onClick={fetchDep} style={{ ...btnGhost, fontSize: '11.5px', padding: '6px 11px' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = C.rose; e.currentTarget.style.color = C.rose; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.inkBorder; e.currentTarget.style.color = C.muted; }}>
            <RefreshCw size={11} /> Actualiser
          </button>
        }>
        <DataTable loading={ldDep} error={errDep} data={depenses} empty="Aucune dépense enregistrée."
          columns={[
            { label: 'Description', key: 'description', primary: true, maxWidth: '200px', render: (r) => (
              <span style={{ fontFamily: '"DM Sans",sans-serif', fontSize: '13px', fontWeight: 600, color: C.offWhite,
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block', maxWidth: '200px' }}>
                {r.description || r.categorie_display || '—'}
              </span>
            )},
            { label: 'Montant', key: 'montant', render: (r) => (
              <span style={{ fontFamily: '"Cormorant Garamond",serif', fontSize: '1.1rem', fontWeight: 700, color: C.rose }}>{fmtMontant(r.montant)}</span>
            )},
            { label: 'Catégorie', key: 'categorie_display', render: (r) => (
              <Badge label={r.categorie_display ?? '—'} color={C.sapphire} bg={C.sapphireBg} />
            )},
            { label: 'Action', key: 'action_titre', render: (r) => (
              <span style={{ fontFamily: '"DM Sans",sans-serif', fontSize: '12px', color: C.muted, whiteSpace: 'nowrap' }}>{r.action_titre ?? '—'}</span>
            )},
            { label: 'Statut', key: 'statut', render: (r) => {
              const cfg = r.statut === 'VALIDEE'
                ? { label: 'Validée',    color: C.success, bg: C.successBg }
                : r.statut === 'REJETEE'
                ? { label: 'Rejetée',    color: C.rose,    bg: C.dangerBg  }
                : { label: 'En attente', color: C.warning, bg: C.warningBg };
              return <Badge {...cfg} />;
            }},
            { label: 'Justificatif', key: 'justificatif', render: (r) => r.justificatif ? (
              <a href={r.justificatif} target="_blank" rel="noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px',
                  color: C.sapphire, fontFamily: '"DM Sans",sans-serif', fontSize: '11.5px', textDecoration: 'none' }}>
                <ExternalLink size={11} /> Voir
              </a>
            ) : <span style={{ color: C.dim, fontSize: '12px' }}>—</span>},
          ]}
        />
      </SectionCard>

            <AnimatePresence>
        {showDon && <ModalDon onClose={() => setShowDon(false)} onSuccess={fetchDons} membres={membres} />}
        {membreChoisi && !showAjout && (
          <ModalCotisationsMembre membre={membreChoisi}
            onClose={() => setMembreChoisi(null)}
            onDemandeAjout={() => setShowAjout(true)} />
        )}
        {showAjout && membreChoisi && (
          <ModalCotisationAjout membre={membreChoisi}
            onClose={() => setShowAjout(false)}
            onSuccess={() => {
              setShowAjout(false);
              fetchSummaries();
              setMembreChoisi({ ...membreChoisi });
            }} />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ════════════════════════════════════════════════════════════════
// ONGLET 3 — Partenaires
// ════════════════════════════════════════════════════════════════
function TabPartenaires() {
  const [partenaires, setPart]  = useState([]);
  const [loading,     setLoad]  = useState(true);
  const [error,       setErr]   = useState(null);
  const [modal,       setModal] = useState(null);
  const [confirm,  setConfirm]  = useState(null);
  const [delLoad,  setDelLoad]  = useState(false);

  const fetchPartenaires = useCallback(async () => {
    setLoad(true); setErr(null);
    try {
      const { data } = await api.get(API.partenaires);
      setPart(data.results ?? data);
    } catch { setErr('Impossible de charger les partenaires.'); }
    finally  { setLoad(false); }
  }, []);

  useEffect(() => { fetchPartenaires(); }, [fetchPartenaires]);

  const doDelete = async () => {
    if (!confirm) return;
    setDelLoad(true);
    try { await api.delete(API.partById(confirm.id)); setConfirm(null); fetchPartenaires(); }
    catch {}
    finally { setDelLoad(false); }
  };

  return (
    <motion.div key="partenaires" variants={tabContent} initial="hidden" animate="show" exit="exit">
      <SectionCard title="Gestion des Partenaires" icon={Handshake}
        subtitle={`${partenaires.length} partenaire${partenaires.length > 1 ? 's' : ''}`}
        accentColor={C.sapphire}
        headerRight={
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={fetchPartenaires} style={{ ...btnGhost, fontSize: '11.5px', padding: '6px 11px' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = C.sapphire; e.currentTarget.style.color = C.sapphire; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.inkBorder; e.currentTarget.style.color = C.muted; }}>
              <RefreshCw size={11} /> Actualiser
            </button>
            <button onClick={() => setModal({ data: null })} style={btnPrimary(C.sapphire)}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
              <Plus size={13} /> Nouveau
            </button>
          </div>
        }>
        <DataTable loading={loading} error={error} data={partenaires} empty="Aucun partenaire enregistré."
          columns={[
            { label: 'Organisation', key: 'nom', primary: true, render: (r) => (
              <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', flexShrink: 0,
                  background: C.sapphireBg, border: `1px solid ${C.sapphireBorder}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>
                  {r.logo ? '🖼' : (r.type === 'ONG' ? '🤝' : r.type === 'Entreprise' ? '🏢' : '🌐')}
                </div>
                <div>
                  <div style={{ fontFamily: '"DM Sans",sans-serif', fontSize: '13px', fontWeight: 600, color: C.offWhite }}>{r.nom}</div>
                  {r.date_debut && (
                    <div style={{ fontFamily: '"DM Sans",sans-serif', fontSize: '11px', color: C.mutedDark }}>Depuis {fmtDate(r.date_debut)}</div>
                  )}
                </div>
              </div>
            )},
            { label: 'Type', key: 'type', render: (r) => <Badge label={r.type || '—'} color={C.sapphire} bg={C.sapphireBg} /> },
            { label: 'Contact', key: 'email', render: (r) => (
              <div>
                <div style={{ fontFamily: '"DM Sans",sans-serif', fontSize: '12.5px', color: C.muted }}>{r.email || '—'}</div>
                {r.telephone && <div style={{ fontFamily: '"DM Sans",sans-serif', fontSize: '11.5px', color: C.mutedDark, marginTop: '2px' }}>{r.telephone}</div>}
              </div>
            )},
            { label: 'Actions menées', key: 'nb_actions', render: (r) => (
              <span style={{ fontFamily: '"Cormorant Garamond",serif', fontSize: '1.1rem', fontWeight: 700, color: C.offWhite }}>{r.nb_actions ?? 0}</span>
            )},
            { label: 'Total dons', key: 'total_dons', render: (r) => (
              <span style={{ fontFamily: '"Cormorant Garamond",serif', fontSize: '1.1rem', fontWeight: 700, color: C.gold }}>{fmtMontant(r.total_dons)}</span>
            )},
            { label: 'Statut', key: 'statut', render: (r) => statutBadge(r.statut) },
          ]}
          actions={(row) => (
            <>
              <button onClick={() => setModal({ data: row })}
                style={{ ...btnGhost, padding: '5px 10px', fontSize: '11.5px' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = C.sapphire; e.currentTarget.style.color = C.sapphire; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = C.inkBorder; e.currentTarget.style.color = C.muted; }}>
                <Pencil size={11} /> Modifier
              </button>
              <button onClick={() => setConfirm({ id: row.id, msg: `Supprimer ${row.nom} ?` })} style={btnDanger}
                onMouseEnter={e => { e.currentTarget.style.background = C.rose; e.currentTarget.style.color = C.white; }}
                onMouseLeave={e => { e.currentTarget.style.background = C.dangerBg; e.currentTarget.style.color = C.rose; }}>
                <Trash2 size={11} />
              </button>
            </>
          )}
        />
      </SectionCard>

      <AnimatePresence>
        {modal && <ModalPartenaire initial={modal.data} onClose={() => setModal(null)} onSuccess={() => { setModal(null); fetchPartenaires(); }} />}
        {confirm && <ConfirmModal message={confirm.msg} loading={delLoad} onConfirm={doDelete} onClose={() => setConfirm(null)} />}
      </AnimatePresence>
    </motion.div>
  );
}

// ════════════════════════════════════════════════════════════════
// ONGLET 4 — Paramètres
// ════════════════════════════════════════════════════════════════
function TabSettings({ user }) {
  const [asso, setAsso] = useState({
    nom:     'Association ININ',
    slogan:  'Ensemble pour l\'impact',
    email:   'contact@inin.org',
    tel:     '', adresse: '', website: '',
  });
  const [saved,   setSaved]  = useState(false);
  const [loading, setLoad]   = useState(false);
  const set = (k) => (e) => setAsso((p) => ({ ...p, [k]: e.target.value }));

  const handleSave = async () => {
    setLoad(true);
    await new Promise((r) => setTimeout(r, 800));
    setSaved(true); setLoad(false);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <motion.div key="settings" variants={tabContent} initial="hidden" animate="show" exit="exit"
      style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <SectionCard title="Informations de l'association" icon={Building2} accentColor={C.gold}>
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <FormGrid>
            <FormRow label="Nom de l'association">
              <input type="text" value={asso.nom} onChange={set('nom')} onFocus={focStyle(C.gold)} onBlur={blrStyle()} style={IS(C.gold)} />
            </FormRow>
            <FormRow label="Slogan">
              <input type="text" value={asso.slogan} onChange={set('slogan')} onFocus={focStyle(C.gold)} onBlur={blrStyle()} style={IS(C.gold)} />
            </FormRow>
          </FormGrid>
          <FormGrid>
            <FormRow label="Email de contact">
              <input type="email" value={asso.email} onChange={set('email')} onFocus={focStyle(C.gold)} onBlur={blrStyle()} style={IS(C.gold)} />
            </FormRow>
            <FormRow label="Téléphone">
              <input type="tel" value={asso.tel} onChange={set('tel')} onFocus={focStyle(C.gold)} onBlur={blrStyle()} style={IS(C.gold)} />
            </FormRow>
          </FormGrid>
          <FormRow label="Adresse">
            <input type="text" value={asso.adresse} onChange={set('adresse')} onFocus={focStyle(C.gold)} onBlur={blrStyle()} style={IS(C.gold)} placeholder="Dakar, Sénégal" />
          </FormRow>
          <FormRow label="Site web">
            <input type="url" value={asso.website} onChange={set('website')} onFocus={focStyle(C.gold)} onBlur={blrStyle()} style={IS(C.gold)} placeholder="https://inin.org" />
          </FormRow>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '4px' }}>
            {saved && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px',
                borderRadius: '8px', background: C.successBg, border: `1px solid ${C.emeraldBorder}`,
                fontFamily: '"DM Sans",sans-serif', fontSize: '12.5px', color: C.success }}>
                <CheckCircle2 size={13} /> Modifications enregistrées
              </div>
            )}
            <button onClick={handleSave} disabled={loading}
              style={{ ...btnPrimary(C.gold), padding: '10px 22px', opacity: loading ? .6 : 1 }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
              {loading
                ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> Enregistrement…</>
                : <><CheckCircle2 size={13} /> Sauvegarder</>}
            </button>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Mon compte administrateur" icon={ShieldCheck} accentColor={C.emerald}>
        <div style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px',
            background: C.inkMid, borderRadius: '12px', border: `1px solid ${C.inkBorder}` }}>
            <Avatar user={user} size={48} />
            <div>
              <div style={{ fontFamily: '"Cormorant Garamond",serif', fontSize: '1.2rem', fontWeight: 600, color: C.offWhite }}>
                {user?.first_name} {user?.last_name}
              </div>
              <div style={{ fontFamily: '"DM Sans",sans-serif', fontSize: '12.5px', color: C.muted, marginTop: '3px' }}>{user?.email}</div>
              <div style={{ marginTop: '6px' }}>{roleBadge(user?.role)}</div>
            </div>
          </div>
          <div style={{ marginTop: '14px', padding: '14px', background: C.goldBg,
            borderRadius: '10px', border: `1px solid ${C.goldBorder}`,
            display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
            <ShieldCheck size={15} style={{ color: C.gold, flexShrink: 0, marginTop: '1px' }} />
            <p style={{ fontFamily: '"DM Sans",sans-serif', fontSize: '12.5px', color: C.offWhite, margin: 0, lineHeight: 1.6, opacity: .8 }}>
              En tant qu'Administrateur, vous avez accès à l'ensemble des modules de l'application.
              Pour modifier votre mot de passe ou votre photo de profil, rendez-vous sur la page{' '}
              <strong style={{ color: C.gold }}>Profil</strong>.
            </p>
          </div>
        </div>
      </SectionCard>
    </motion.div>
  );
}

// ════════════════════════════════════════════════════════════════
// PAGE PRINCIPALE — DashboardAdmin
// ════════════════════════════════════════════════════════════════
export default function DashboardAdmin() {
  const { user, logout } = useAuth();
  const navigate  = useNavigate();
  const ref       = useRef(null);
  const inView    = useInView(ref, { once: true, amount: .05 });

  const [activeTab,     setActiveTab]     = useState(0);
  const [stats,         setStats]         = useState(null);
  const [ldStats,       setLdStats]       = useState(true);
  // ✅ Nouvel état — modale création d'action
  const [isCreateOpen,  setIsCreateOpen]  = useState(false);

  const displayName  = user?.first_name || user?.username || 'Administrateur';
  const handleLogout = () => { logout(); navigate('/', { replace: true }); };

  const fetchStats = useCallback(async () => {
    setLdStats(true);
    try {
      const [dashRes, usersRes, memRes, demRes, donsRes, cotisRes, depRes] = await Promise.allSettled([
        api.get(API.dashboard),
        api.get(API.users),
        api.get(`${API.membres}?statut=ACTIF`),
        api.get(`${API.demandes}?statut=EN_ATTENTE`),
        api.get(API.dons),
        api.get(API.cotisations),
        api.get(`${API.depenses}?statut=VALIDEE`),
      ]);

      const dash = dashRes.status === 'fulfilled' ? dashRes.value.data : {};

      const nbUsers = usersRes.status === 'fulfilled'
        ? (usersRes.value.data.count ?? (usersRes.value.data.results ?? usersRes.value.data).length) : 0;
      const nbMem = memRes.status === 'fulfilled'
        ? (memRes.value.data.count ?? (memRes.value.data.results ?? memRes.value.data).length) : 0;
      const nbDem = demRes.status === 'fulfilled'
        ? (demRes.value.data.count ?? (demRes.value.data.results ?? demRes.value.data).length) : 0;

      const donsListe  = donsRes.status  === 'fulfilled' ? (donsRes.value.data.results  ?? donsRes.value.data)  : [];
      const cotisListe = cotisRes.status === 'fulfilled' ? (cotisRes.value.data.results ?? cotisRes.value.data) : [];
      const depListe   = depRes.status   === 'fulfilled' ? (depRes.value.data.results   ?? depRes.value.data)   : [];

      const totalDons  = dash.total_dons        != null ? parseFloat(dash.total_dons)        : donsListe.reduce((a, d) => a + parseFloat(d.montant || 0), 0);
      const totalCotis = dash.total_cotisations != null ? parseFloat(dash.total_cotisations) : cotisListe.reduce((a, c) => a + parseFloat(c.montant || 0), 0);
      const totalDep   = dash.total_depenses    != null ? parseFloat(dash.total_depenses)    : depListe.reduce((a, d) => a + parseFloat(d.montant || 0), 0);

      setStats({ ...dash, total_dons: totalDons, total_cotisations: totalCotis,
        total_depenses: totalDep, nb_utilisateurs: nbUsers,
        nb_membres_actifs: nbMem, nb_demandes_en_attente: nbDem });
    } catch { setStats(null); }
    finally { setLdStats(false); }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const kpis = [
    { icon: Wallet,       label: 'Trésorerie Totale',  accentColor: C.gold,    sub: 'Solde net',
      value: stats ? fmtMontant(stats.total_dons + stats.total_cotisations - stats.total_depenses) : '—' },
    { icon: Users,        label: 'Total Utilisateurs', accentColor: C.sapphire, sub: 'Comptes actifs',
      value: stats?.nb_utilisateurs ?? '—' },
    { icon: UserPlus,     label: 'Membres Actifs',     accentColor: C.emerald,  sub: 'Adhérents',
      value: stats?.nb_membres_actifs ?? '—' },
    { icon: AlertCircle,  label: 'Demandes à Traiter', accentColor: C.warning,  sub: 'En attente',
      value: stats?.nb_demandes_en_attente ?? '—' },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap');
        @keyframes spin  { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.35} }
        .admin-tabs { display:flex; gap:2px; overflow-x:auto; padding-bottom:2px; scrollbar-width:none; }
        .admin-tabs::-webkit-scrollbar { display:none; }
        .tab-btn {
          display:inline-flex; align-items:center; gap:7px;
          padding:10px 18px; border-radius:10px; white-space:nowrap; cursor:pointer;
          font-family:"DM Sans",sans-serif; font-size:13px; font-weight:600;
          border:1px solid transparent; transition:all .22s; flex-shrink:0;
        }
        .tab-btn.active {
          background:linear-gradient(135deg,rgba(201,168,76,.18),rgba(201,168,76,.08));
          border-color:rgba(201,168,76,.25); color:#f0d080;
        }
        .tab-btn:not(.active) { background:transparent; color:#5a6478; }
        .tab-btn:not(.active):hover { background:rgba(255,255,255,.04); color:#8892a4; border-color:rgba(255,255,255,.06); }
      `}</style>

      <div style={{ fontFamily: '"DM Sans",sans-serif', background: C.ink,
        minHeight: '100vh', paddingTop: `${NAV_HEIGHT}px` }}>

        {/* ✅ Modale Nouvelle Action — portée au niveau racine */}
        <AnimatePresence>
          {isCreateOpen && (
            <ModalNouvelleAction
              key="create-action"
              onClose={() => setIsCreateOpen(false)}
              onSuccess={() => {
                setIsCreateOpen(false);
                fetchStats(); // rafraîchit les KPIs après création
              }}
            />
          )}
        </AnimatePresence>

        {/* ══ HERO HEADER ══════════════════════════════════════ */}
        <div style={{
          background: `linear-gradient(135deg,${C.inkDeep} 0%,${C.inkSoft} 40%,#14161f 70%,${C.inkMid} 100%)`,
          padding: '40px 24px 0', position: 'relative', overflow: 'hidden',
          borderBottom: `1px solid ${C.inkBorder}`,
        }}>
          <div style={{ position: 'absolute', top: '-60px', right: '-40px', width: '300px',
            height: '300px', borderRadius: '50%', background: C.gold, opacity: .03,
            filter: 'blur(60px)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: '0', left: '20%', width: '400px',
            height: '2px', background: `linear-gradient(90deg,transparent,${C.gold}25,transparent)`, pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', top: '30px', right: '8%', width: '70px', height: '70px',
            border: `1px solid ${C.gold}08`, borderRadius: '12px', transform: 'rotate(18deg)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', top: '44px', right: 'calc(8% + 10px)', width: '46px', height: '46px',
            border: `1px solid ${C.gold}06`, borderRadius: '8px', transform: 'rotate(18deg)', pointerEvents: 'none' }} />

          <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              flexWrap: 'wrap', gap: '20px', marginBottom: '32px' }}>

              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                transition={{ duration: .6, ease: [0.22, 1, 0.36, 1] }}
                style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <Avatar user={user} size={52} />
                <div>
                  <div style={{ fontFamily: '"DM Sans",sans-serif', fontSize: '10.5px', fontWeight: 700,
                    color: C.gold, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '5px', opacity: .7 }}>
                    Administration Centrale
                  </div>
                  <h1 style={{ fontFamily: '"Cormorant Garamond",serif',
                    fontSize: 'clamp(1.5rem,3vw,2rem)', fontWeight: 700,
                    color: C.offWhite, margin: 0, letterSpacing: '0.02em', lineHeight: 1.2 }}>
                    Bonjour,{' '}
                    <em style={{ fontStyle: 'italic', color: C.goldLight }}>{displayName}</em>
                  </h1>
                  <div style={{ fontFamily: '"DM Sans",sans-serif', fontSize: '12.5px', color: C.mutedDark, marginTop: '5px' }}>
                    Tableau de bord principal — Association ININ
                  </div>
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                transition={{ duration: .6, ease: [0.22, 1, 0.36, 1] }}
                style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                <Link to="/dashboard/settings"
                  style={{ ...btnGhost, textDecoration: 'none', fontSize: '13px', padding: '9px 16px' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = C.gold; e.currentTarget.style.color = C.gold; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = C.inkBorder; e.currentTarget.style.color = C.muted; }}>
                  <Settings size={13} /> Profil
                </Link>
                <button onClick={() => navigate('/admin/analytics')}
                  style={{ ...btnPrimary(C.gold), padding: '9px 18px' }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                  <BarChart3 size={14} /> Analytics
                </button>
                <button onClick={handleLogout}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px',
                    padding: '9px 16px', borderRadius: '8px',
                    background: 'rgba(244,63,94,.1)', border: '1px solid rgba(244,63,94,.2)',
                    color: '#fca5a5', fontSize: '13px', fontWeight: 600,
                    fontFamily: '"DM Sans",sans-serif', cursor: 'pointer', transition: 'background .2s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(244,63,94,.2)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(244,63,94,.1)'}>
                  <LogOut size={13} /> Déconnecter
                </button>
              </motion.div>
            </div>

            {/* Barre d'onglets */}
            <div className="admin-tabs">
              {TABS.map((tab) => (
                <button key={tab.id}
                  className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}>
                  <tab.icon size={14} /> {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ══ CONTENU ══════════════════════════════════════════ */}
        <div ref={ref} style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px 24px 80px' }}>

          <motion.div variants={stagger(.08)} initial="hidden" animate={inView ? 'show' : 'hidden'}
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(210px,1fr))',
              gap: '14px', marginBottom: '32px' }}>
            {kpis.map((k) => <KpiCard key={k.label} loading={ldStats} {...k} />)}
          </motion.div>

          <AnimatePresence mode="wait">
            {activeTab === 0 && (
              <TabOverview
                stats={stats} loading={ldStats} navigate={navigate}
                onNewAction={() => setIsCreateOpen(true)}   
              />
            )}
            {activeTab === 1 && <TabUsers />}
            {activeTab === 2 && <TabFinances user={user} />}
            {activeTab === 3 && <TabPartenaires />}
            {activeTab === 4 && <TabSettings  user={user} />}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}