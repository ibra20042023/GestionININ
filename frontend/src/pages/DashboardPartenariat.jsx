/**
 * src/pages/DashboardPartenariat.jsx
 * ─────────────────────────────────────────────────────────────
 * Espace Chargé de Partenariat — Association ININ
 */

import { useRef, useState, useEffect, useCallback } from 'react';
import { Link, useNavigate }       from 'react-router-dom';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import api from '../api/api'; // ✅ instance centralisée — gère token + FormData automatiquement
import {
  LogOut, Settings, Plus, X,
  CheckCircle2, AlertCircle, Loader2, RefreshCw,
  Heart, CreditCard, Users, Handshake,
  ArrowUpRight, ArrowDownRight, Pencil,
  Banknote, Building2, Globe, Target, TrendingUp,
  Upload, ExternalLink,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// ── Palette ───────────────────────────────────────────────────
const C = {
  emerald:       '#059669',
  emeraldDark:   '#064e3b',
  emeraldDeep:   '#022c22',
  emeraldLight:  '#ecfdf5',
  emeraldMid:    '#d1fae5',
  emeraldAccent: '#6ee7b7',
  teal:          '#0d9488',
  tealLight:     '#f0fdfa',
  tealDark:      '#0f766e',
  azure:         '#1640c8',
  azureDark:     '#0f172a',
  azureLight:    '#eef5ff',
  violet:        '#7c3aed',
  violetLight:   '#f5f3ff',
  cyan:          '#30c8d3',
  cyanDark:      '#17a8b5',
  white:         '#ffffff',
  offWhite:      '#f8fafc',
  muted:         '#64748b',
  mutedLight:    '#94a3b8',
  border:        '#e2e8f0',
  success:       '#16a34a',
  successBg:     '#f0fdf4',
  warning:       '#d97706',
  warningBg:     '#fffbeb',
  danger:        '#dc2626',
  dangerBg:      '#fef2f2',
};

const NAV_HEIGHT      = 85;

// ✅ Chemins relatifs — l'instance api a déjà baseURL = `${import.meta.env.VITE_API_URL}/api/`
const API_PARTENAIRES = 'partenaires/';
const API_PART_ID     = (id) => `partenaires/${id}/`;
const API_ACTIONS     = 'actions/';
const API_DONS        = 'dons/';
const API_COTISATION  = 'cotisations/';

const fmtDate = (str) =>
  str ? new Date(str).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

const fmtMontant = (v) =>
  v !== undefined && v !== null
    ? Number(v).toLocaleString('fr-FR') + ' FCFA'
    : '—';

// ── Animations ────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
};
const stagger = (d = 0.08) => ({ hidden: {}, show: { transition: { staggerChildren: d } } });

// ── Config modes paiement ─────────────────────────────────────
const MODE_CFG = {
  ESPECES:      { label: 'Espèces',       color: '#7c3aed', bg: '#f5f3ff'    },
  VIREMENT:     { label: 'Virement',      color: C.azure,   bg: C.azureLight },
  MOBILE_MONEY: { label: 'Mobile Money',  color: C.emerald, bg: C.emeraldLight },
  CHEQUE:       { label: 'Chèque',        color: C.warning, bg: C.warningBg  },
  EN_LIGNE:     { label: 'En ligne',      color: C.cyanDark, bg: '#ecfeff'   },
  AUTRE:        { label: 'Autre',         color: C.muted,   bg: C.offWhite   },
};

// ── Types de partenariat ──────────────────────────────────────
const TYPES_PART = [
  { key: 'ONG',        label: 'ONG / Association'   },
  { key: 'Entreprise', label: 'Entreprise'           },
  { key: 'Public',     label: 'Institution Publique' },
  { key: 'Fondation',  label: 'Fondation'            },
  { key: 'Académique', label: 'Académique'            },
  { key: 'Autre',      label: 'Autre'                },
];

const ANNEE_COURANTE = new Date().getFullYear();
const ANNEES_COTIS   = Array.from({ length: 5 }, (_, i) => ANNEE_COURANTE - 1 + i);

// ── Styles champs ─────────────────────────────────────────────
const IS  = (ac = C.teal) => ({
  width: '100%', padding: '11px 14px', border: `1.5px solid ${C.border}`,
  borderRadius: '10px', fontSize: '14px', fontFamily: '"DM Sans",sans-serif',
  color: C.azureDark, background: C.offWhite, outline: 'none',
  transition: 'border-color .2s,box-shadow .2s', boxSizing: 'border-box',
});
const fo  = (ac = C.teal) => (e) => { e.target.style.borderColor = ac; e.target.style.boxShadow = `0 0 0 3px ${ac}18`; };
const bl  = () => (e) => { e.target.style.borderColor = C.border; e.target.style.boxShadow = 'none'; };
const LBs = {
  display: 'block', fontFamily: '"DM Sans",sans-serif', fontSize: '11.5px',
  fontWeight: 700, color: C.muted, textTransform: 'uppercase',
  letterSpacing: '0.08em', marginBottom: '6px',
};

// ════════════════════════════════════════════════════════════
// PRIMITIVES RÉUTILISABLES
// ════════════════════════════════════════════════════════════

function ModalShell({ onClose, children, maxWidth = '540px' }) {
  return (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        transition={{ duration: .18 }} onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)',
          backdropFilter: 'blur(4px)', zIndex: 999 }}
      />
      <div style={{ position: 'fixed', top: '50%', left: '50%',
        transform: 'translate(-50%,-50%)', zIndex: 1000, width: '90%', maxWidth }}>
        <motion.div
          initial={{ opacity: 0, scale: .95 }} animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: .95 }} transition={{ duration: .26, ease: [0.22, 1, 0.36, 1] }}
          style={{ background: C.white, borderRadius: '24px',
            boxShadow: '0 36px 80px rgba(0,0,0,.22)',
            maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
        >
          {children}
        </motion.div>
      </div>
    </>
  );
}

function ModalHeader({ eyebrow, title, gradient, onClose }) {
  return (
    <div style={{ background: gradient, padding: '20px 24px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
      <div>
        <div style={{ fontFamily: '"DM Sans",sans-serif', fontSize: '10px', fontWeight: 700,
          letterSpacing: '0.2em', textTransform: 'uppercase',
          color: 'rgba(255,255,255,.4)', marginBottom: '3px' }}>{eyebrow}</div>
        <h3 style={{ fontFamily: '"Playfair Display",serif', fontSize: '1.2rem',
          fontWeight: 700, color: C.white, margin: 0 }}>{title}</h3>
      </div>
      <button onClick={onClose}
        style={{ width: '34px', height: '34px', borderRadius: '50%',
          background: 'rgba(255,255,255,.12)', border: 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: C.white, transition: 'background .2s' }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,.24)'}
        onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,.12)'}>
        <X size={16} />
      </button>
    </div>
  );
}

function ModalFooter({ onClose, onSubmit, loading, label, color }) {
  return (
    <div style={{ padding: '14px 24px', borderTop: `1px solid ${C.border}`,
      display: 'flex', gap: '10px', justifyContent: 'flex-end', flexShrink: 0 }}>
      <button onClick={onClose}
        style={{ padding: '10px 20px', borderRadius: '100px',
          border: `1.5px solid ${C.border}`, background: C.white, color: C.muted,
          fontSize: '13px', fontWeight: 600, cursor: 'pointer',
          fontFamily: '"DM Sans",sans-serif' }}
        onMouseEnter={e => e.currentTarget.style.borderColor = C.muted}
        onMouseLeave={e => e.currentTarget.style.borderColor = C.border}>
        Annuler
      </button>
      <button onClick={onSubmit} disabled={loading}
        style={{ padding: '10px 24px', borderRadius: '100px', border: 'none',
          background: loading ? C.border : color,
          color: loading ? C.mutedLight : C.white, fontSize: '13px', fontWeight: 700,
          cursor: loading ? 'wait' : 'pointer', fontFamily: '"DM Sans",sans-serif',
          boxShadow: loading ? 'none' : `0 4px 16px ${color}55`,
          transition: 'all .22s', display: 'flex', alignItems: 'center', gap: '6px' }}>
        {loading
          ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> Envoi…</>
          : label}
      </button>
    </div>
  );
}

// ── Avatar ────────────────────────────────────────────────────
function Avatar({ user, size = 58 }) {
  const [err, setErr] = useState(false);
  const photoUrl = user?.photo_profil
    ? (user.photo_profil.startsWith('http') ? user.photo_profil : `${import.meta.env.VITE_API_URL}${user.photo_profil}`)
    : null;
  const initials = (user?.first_name || user?.username || 'CP').slice(0, 2).toUpperCase();
  if (photoUrl && !err) {
    return <img src={photoUrl} alt={initials} onError={() => setErr(true)}
      style={{ width: `${size}px`, height: `${size}px`, borderRadius: '50%',
        objectFit: 'cover', border: '2px solid rgba(255,255,255,.3)', flexShrink: 0 }} />;
  }
  return (
    <div style={{ width: `${size}px`, height: `${size}px`, borderRadius: '50%', flexShrink: 0,
      background: 'linear-gradient(135deg,rgba(13,148,136,.7),rgba(5,150,105,.5))',
      border: '2px solid rgba(255,255,255,.3)',
      display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ fontFamily: '"Playfair Display",serif',
        fontSize: `${size * .37}px`, fontWeight: 700, color: C.white }}>{initials}</span>
    </div>
  );
}

// ── KPI Card ──────────────────────────────────────────────────
function KpiCard({ icon: Icon, label, value, sub, subPositive = true, color, bg }) {
  return (
    <motion.div variants={fadeUp}
      style={{ background: C.white, borderRadius: '20px', border: `1.5px solid ${C.border}`,
        padding: '24px 22px', boxShadow: '0 2px 16px rgba(0,0,0,.05)',
        position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: '-16px', right: '-16px', width: '76px',
        height: '76px', borderRadius: '50%', background: bg, opacity: .55, pointerEvents: 'none' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between',
        alignItems: 'flex-start', marginBottom: '16px', position: 'relative' }}>
        <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: bg,
          display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={19} style={{ color }} strokeWidth={1.75} />
        </div>
        {sub && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px',
            padding: '4px 10px', borderRadius: '100px',
            background: subPositive ? C.successBg : C.dangerBg,
            color: subPositive ? C.success : C.danger, fontSize: '11px', fontWeight: 700 }}>
            {subPositive ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}{sub}
          </span>
        )}
      </div>
      <div style={{ fontFamily: '"Playfair Display",serif', fontSize: '1.85rem',
        fontWeight: 800, color: C.azureDark, lineHeight: 1, marginBottom: '6px',
        position: 'relative' }}>{value}</div>
      <div style={{ fontFamily: '"DM Sans",sans-serif', fontSize: '11.5px', fontWeight: 600,
        color: C.muted, textTransform: 'uppercase', letterSpacing: '0.09em' }}>{label}</div>
    </motion.div>
  );
}

// ── Row — au niveau module pour éviter le re-render ──────────
function Row({ label, children }) {
  return (
    <div>
      <span style={LBs}>{label}</span>
      {children}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// MODALE PARTENAIRE — Ajout & Modification
// ════════════════════════════════════════════════════════════
function ModalPartenaire({ onClose, onSuccess, initial = null }) {
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
  const [loading,  setLoad]     = useState(false);
  const [error,    setErr]      = useState(null);

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));
  const foc = fo(C.teal);
  const blr = bl();
  const ISv = IS(C.teal);

  // Guard robuste : vérifie que c'est bien un fichier uploadable
  const isValidFile = (f) =>
    f !== null &&
    f !== undefined &&
    (f instanceof File || (typeof f === 'object' && typeof f.name === 'string' && f.size > 0));

  const submit = async () => {
    if (!form.nom.trim())  { setErr('Le nom est requis.');            return; }
    if (!form.date_debut)  { setErr('La date de début est requise.'); return; }

    setLoad(true); setErr(null);
    try {
      const payload = new FormData();

      // Champs toujours envoyés
      ['nom', 'type', 'statut', 'date_debut'].forEach((k) => {
        payload.append(k, form[k]);
      });

      // Champs optionnels — uniquement si non vides
      ['email', 'telephone', 'description'].forEach((k) => {
        const val = form[k];
        if (val !== null && val !== undefined && String(val).trim() !== '') {
          payload.append(k, String(val).trim());
        }
      });

      // ✅ Logo uniquement si c'est un vrai fichier
      if (isValidFile(logoFile)) {
        payload.append('logo', logoFile, logoFile.name);
      }

      // ✅ api gère automatiquement :
      //    - le header Authorization (intercepteur request)
      //    - la suppression de Content-Type pour FormData (intercepteur request)
      //    → NE JAMAIS passer { headers } manuellement ici
      if (isEdit) {
        await api.patch(API_PART_ID(initial.id), payload);
      } else {
        await api.post(API_PARTENAIRES, payload);
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
        gradient={`linear-gradient(135deg,${C.emeraldDeep},${C.tealDark})`}
        onClose={onClose}
      />

      <div style={{ padding: '24px', overflowY: 'auto', display: 'flex',
        flexDirection: 'column', gap: '16px' }}>

        {/* Nom */}
        <Row label="Nom de l'organisation *">
          <input
            type="text"
            placeholder="Ex : Fondation TOTAL, USAID, UNICEF…"
            value={form.nom}
            onChange={set('nom')}
            onFocus={foc}
            onBlur={blr}
            style={ISv}
          />
        </Row>

        {/* Type + Statut */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <Row label="Type de partenariat *">
            <select value={form.type} onChange={set('type')} onFocus={foc} onBlur={blr}
              style={{ ...ISv, cursor: 'pointer' }}>
              {TYPES_PART.map((t) => (
                <option key={t.key} value={t.key}>{t.label}</option>
              ))}
            </select>
          </Row>
          <Row label="Statut">
            <select value={form.statut} onChange={set('statut')} onFocus={foc} onBlur={blr}
              style={{ ...ISv, cursor: 'pointer' }}>
              <option value="ACTIF">Actif</option>
              <option value="INACTIF">Inactif</option>
            </select>
          </Row>
        </div>

        {/* Email + Téléphone */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <Row label="Email contact">
            <input
              type="email"
              placeholder="contact@organisation.org"
              value={form.email}
              onChange={set('email')}
              onFocus={foc}
              onBlur={blr}
              style={ISv}
            />
          </Row>
          <Row label="Téléphone">
            <input
              type="tel"
              placeholder="+221 77 000 00 00"
              value={form.telephone}
              onChange={set('telephone')}
              onFocus={foc}
              onBlur={blr}
              style={ISv}
            />
          </Row>
        </div>

        {/* Date début */}
        <Row label="Date de début du partenariat *">
          <input
            type="date"
            value={form.date_debut}
            onChange={set('date_debut')}
            onFocus={foc}
            onBlur={blr}
            style={ISv}
          />
        </Row>

        {/* Logo */}
        <Row label="Logo (PNG / JPG)">
          {/* Aperçu logo existant en mode édition */}
          {isEdit && initial?.logo && !logoFile && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <img
                src={initial.logo.startsWith('http')
                  ? initial.logo
                  : `${import.meta.env.VITE_API_URL}${initial.logo}`}
                alt="Logo actuel"
                style={{ width: '40px', height: '40px', borderRadius: '8px',
                  objectFit: 'contain', border: `1px solid ${C.border}` }}
              />
              <span style={{ fontFamily: '"DM Sans",sans-serif', fontSize: '12px', color: C.muted }}>
                Logo actuel — sélectionnez un fichier pour le remplacer
              </span>
            </div>
          )}
          <label
            style={{ display: 'flex', alignItems: 'center', gap: '10px',
              padding: '10px 14px', border: `1.5px dashed ${C.border}`,
              borderRadius: '10px', background: C.offWhite,
              cursor: 'pointer', transition: 'border-color .2s' }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = C.teal}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = C.border}
          >
            <Upload size={15} style={{ color: C.teal, flexShrink: 0 }} />
            <span style={{ fontFamily: '"DM Sans",sans-serif', fontSize: '13px', color: C.muted }}>
              {logoFile ? logoFile.name : 'Choisir un fichier…'}
            </span>
            <input
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(e) => {
                // ✅ nullish coalescing — null si l'utilisateur annule
                const file = e.target.files?.[0] ?? null;
                setLogoFile(file);
              }}
            />
          </label>
        </Row>

        {/* Description */}
        <Row label="Description / Accords de partenariat">
          <textarea
            rows={3}
            placeholder="Décrivez la nature du partenariat, les engagements, les projets communs…"
            value={form.description}
            onChange={set('description')}
            onFocus={foc}
            onBlur={blr}
            style={{ ...ISv, resize: 'vertical', minHeight: '80px' }}
          />
        </Row>

        {error && (
          <div style={{ display: 'flex', gap: '8px', padding: '12px 14px',
            borderRadius: '10px', background: C.dangerBg, border: `1px solid ${C.danger}30` }}>
            <AlertCircle size={14} style={{ color: C.danger, flexShrink: 0, marginTop: '1px' }} />
            <span style={{ fontFamily: '"DM Sans",sans-serif', fontSize: '13px', color: C.danger }}>
              {error}
            </span>
          </div>
        )}
      </div>

      <ModalFooter
        onClose={onClose}
        onSubmit={submit}
        loading={loading}
        label={isEdit
          ? <><CheckCircle2 size={13} /> Enregistrer</>
          : <><Handshake size={13} /> Ajouter le partenaire</>}
        color={C.teal}
      />
    </ModalShell>
  );
}

// ════════════════════════════════════════════════════════════
// MODAL DON
// ════════════════════════════════════════════════════════════
function ModalDon({ onClose, onSuccess }) {
  const [form, setForm]    = useState({ montant: '', mode: 'VIREMENT', anonyme: false });
  const [loading, setLoad] = useState(false);
  const [error, setErr]    = useState(null);
  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));
  const ISv = IS(C.azure);
  const foc = fo(C.azure);
  const blr = bl();

  const submit = async () => {
    if (!form.montant || parseFloat(form.montant) <= 0) { setErr('Montant invalide.'); return; }
    setLoad(true); setErr(null);
    try {
      await api.post(API_DONS, {
        montant: form.montant,
        mode_paiement: form.mode,
        anonyme: form.anonyme,
      });
      onSuccess?.();
      onClose();
    } catch (e) {
      setErr(e.response?.data ? Object.values(e.response.data).flat().join(' ') : 'Erreur serveur.');
    } finally { setLoad(false); }
  };

  return (
    <ModalShell onClose={onClose}>
      <ModalHeader eyebrow="Comptabilité" title="Enregistrer un don"
        gradient={`linear-gradient(135deg,#0f172a,${C.azure})`} onClose={onClose} />
      <div style={{ padding: '24px', overflowY: 'auto', display: 'flex',
        flexDirection: 'column', gap: '16px' }}>
        <div>
          <span style={LBs}>Montant (FCFA) *</span>
          <input type="number" min="0" step="500" placeholder="Ex : 25 000"
            value={form.montant} onChange={set('montant')} onFocus={foc} onBlur={blr} style={ISv} />
        </div>
        <div>
          <span style={LBs}>Mode de paiement *</span>
          <select value={form.mode} onChange={set('mode')} onFocus={foc} onBlur={blr}
            style={{ ...ISv, cursor: 'pointer' }}>
            {Object.entries(MODE_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>
        {error && (
          <div style={{ display: 'flex', gap: '8px', padding: '12px 14px', borderRadius: '10px',
            background: C.dangerBg, border: `1px solid ${C.danger}30` }}>
            <AlertCircle size={14} style={{ color: C.danger, flexShrink: 0 }} />
            <span style={{ fontFamily: '"DM Sans",sans-serif', fontSize: '13px', color: C.danger }}>{error}</span>
          </div>
        )}
      </div>
      <ModalFooter onClose={onClose} onSubmit={submit} loading={loading}
        label={<><Banknote size={13} /> Enregistrer le don</>} color={C.azure} />
    </ModalShell>
  );
}

// ════════════════════════════════════════════════════════════
// MODAL COTISATION
// ════════════════════════════════════════════════════════════
function ModalCotisation({ onClose, onSuccess, userId }) {
  const [form, setForm]    = useState({ montant: '10000', annee: String(ANNEE_COURANTE), mode: 'VIREMENT' });
  const [loading, setLoad] = useState(false);
  const [error, setErr]    = useState(null);
  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));
  const ISv = IS(C.cyanDark);
  const foc = fo(C.cyanDark);
  const blr = bl();

  const submit = async () => {
    if (!form.montant || parseFloat(form.montant) <= 0) { setErr('Montant invalide.'); return; }
    setLoad(true); setErr(null);
    try {
      await api.post(API_COTISATION, {
        montant: form.montant,
        annee: parseInt(form.annee),
        mode_paiement: form.mode,
        ...(userId ? { membre: userId } : {}),
      });
      onSuccess?.();
      onClose();
    } catch (e) {
      setErr(e.response?.data ? Object.values(e.response.data).flat().join(' ') : 'Erreur serveur.');
    } finally { setLoad(false); }
  };

  return (
    <ModalShell onClose={onClose}>
      <ModalHeader eyebrow="Adhésion" title="Payer ma cotisation"
        gradient={`linear-gradient(135deg,${C.emeraldDeep},${C.cyanDark})`} onClose={onClose} />
      <div style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <span style={LBs}>Période concernée *</span>
          <select value={form.annee} onChange={set('annee')} onFocus={foc} onBlur={blr}
            style={{ ...ISv, cursor: 'pointer' }}>
            {ANNEES_COTIS.map((a) => (
              <option key={a} value={String(a)}>
                {a === ANNEE_COURANTE ? `${a} — Année en cours` : String(a)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <span style={LBs}>Montant (FCFA) *</span>
          <input type="number" min="0" step="500" value={form.montant}
            onChange={set('montant')} onFocus={foc} onBlur={blr} style={ISv} />
        </div>
        <div>
          <span style={LBs}>Mode de paiement *</span>
          <select value={form.mode} onChange={set('mode')} onFocus={foc} onBlur={blr}
            style={{ ...ISv, cursor: 'pointer' }}>
            {Object.entries(MODE_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>
        {error && (
          <div style={{ display: 'flex', gap: '8px', padding: '12px 14px', borderRadius: '10px',
            background: C.dangerBg, border: `1px solid ${C.danger}30` }}>
            <AlertCircle size={14} style={{ color: C.danger, flexShrink: 0 }} />
            <span style={{ fontFamily: '"DM Sans",sans-serif', fontSize: '13px', color: C.danger }}>{error}</span>
          </div>
        )}
      </div>
      <ModalFooter onClose={onClose} onSubmit={submit} loading={loading}
        label={<><CreditCard size={13} /> Valider le paiement</>} color={C.cyanDark} />
    </ModalShell>
  );
}

// ════════════════════════════════════════════════════════════
// TABLEAU DES PARTENAIRES (Gauche 60%)
// ════════════════════════════════════════════════════════════
function SectionPartenaires({ onStatsRefresh }) {
  const [partenaires, setPart] = useState([]);
  const [loading, setLoad]     = useState(true);
  const [error, setErr]        = useState(null);
  const [modal, setModal]      = useState(null);

  const fetchPartenaires = useCallback(async () => {
    setLoad(true); setErr(null);
    try {
      const { data } = await api.get(API_PARTENAIRES);
      setPart(data.results ?? data);
    } catch { setErr('Impossible de charger les partenaires.'); }
    finally  { setLoad(false); }
  }, []);

  useEffect(() => { fetchPartenaires(); }, [fetchPartenaires]);

  const typeIcon = (type) => {
    const icons = { ONG: '🤝', Entreprise: '🏢', Public: '🏛️', Fondation: '💎', Académique: '🎓', Autre: '🌐' };
    return icons[type] ?? '🌐';
  };

  const typeColor = (type) => {
    const map = { ONG: C.emerald, Entreprise: C.azure, Public: C.violet, Fondation: C.teal, Académique: C.warning, Autre: C.muted };
    return map[type] ?? C.muted;
  };

  const StatutBadge = ({ statut }) => {
    const cfg = statut === 'ACTIF'
      ? { color: C.success, bg: C.successBg, label: 'Actif' }
      : { color: C.muted,   bg: C.offWhite,  label: 'Inactif' };
    return (
      <span style={{ fontFamily: '"DM Sans",sans-serif', fontSize: '11px', fontWeight: 700,
        padding: '3px 9px', borderRadius: '100px', color: cfg.color, background: cfg.bg,
        whiteSpace: 'nowrap' }}>{cfg.label}</span>
    );
  };

  return (
    <>
      <motion.div variants={fadeUp}
        style={{ background: C.white, borderRadius: '20px', border: `1.5px solid ${C.border}`,
          overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,.05)' }}>

        {/* En-tête */}
        <div style={{ padding: '18px 22px', borderBottom: `1px solid ${C.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '34px', height: '34px', borderRadius: '10px',
              background: C.tealLight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Handshake size={16} style={{ color: C.teal }} />
            </div>
            <div>
              <h3 style={{ fontFamily: '"Playfair Display",serif', fontSize: '1.05rem',
                fontWeight: 700, color: C.azureDark, margin: 0 }}>Partenaires</h3>
              <p style={{ fontFamily: '"DM Sans",sans-serif', fontSize: '12px', color: C.muted, margin: 0 }}>
                {loading ? '…' : `${partenaires.length} partenaire${partenaires.length > 1 ? 's' : ''} enregistré${partenaires.length > 1 ? 's' : ''}`}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={fetchPartenaires}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '5px',
                padding: '7px 12px', borderRadius: '8px', border: `1.5px solid ${C.border}`,
                background: C.white, color: C.muted, fontSize: '12px', fontWeight: 600,
                cursor: 'pointer', fontFamily: '"DM Sans",sans-serif', transition: 'all .2s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = C.teal; e.currentTarget.style.color = C.teal; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.muted; }}>
              <RefreshCw size={11} /> Actualiser
            </button>
            <button onClick={() => setModal('add')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '7px 14px', borderRadius: '8px',
                background: `linear-gradient(135deg,${C.tealDark},${C.emerald})`,
                color: C.white, fontSize: '12px', fontWeight: 700, border: 'none',
                cursor: 'pointer', fontFamily: '"DM Sans",sans-serif',
                boxShadow: `0 4px 12px ${C.teal}35`, transition: 'all .22s' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
              <Plus size={13} /> Nouveau Partenaire
            </button>
          </div>
        </div>

        {/* Corps */}
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: '8px', padding: '40px', color: C.muted, fontSize: '13px',
            fontFamily: '"DM Sans",sans-serif' }}>
            <Loader2 size={16} style={{ animation: 'spin 1s linear infinite', color: C.teal }} />
            Chargement…
          </div>
        ) : error ? (
          <div style={{ padding: '36px', textAlign: 'center', color: C.danger,
            fontFamily: '"DM Sans",sans-serif', fontSize: '13px' }}>{error}</div>
        ) : partenaires.length === 0 ? (
          <div style={{ padding: '50px', textAlign: 'center', display: 'flex',
            flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%',
              background: C.tealLight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Handshake size={22} style={{ color: C.teal }} />
            </div>
            <p style={{ fontFamily: '"DM Sans",sans-serif', fontSize: '13px',
              color: C.muted, margin: 0 }}>Aucun partenaire enregistré.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ borderCollapse: 'collapse', width: '100%' }}>
              <thead>
                <tr style={{ background: C.offWhite }}>
                  {['Logo', 'Organisation', 'Type', 'Contact', 'Statut', ''].map((h, i) => (
                    <th key={i} style={{ padding: '10px 16px',
                      textAlign: i === 5 ? 'right' : 'left',
                      fontFamily: '"DM Sans",sans-serif', fontSize: '10.5px', fontWeight: 700,
                      textTransform: 'uppercase', letterSpacing: '0.09em', color: C.muted,
                      whiteSpace: 'nowrap', borderBottom: `1.5px solid ${C.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {partenaires.map((p, i) => (
                  <tr key={p.id}
                    style={{ background: i % 2 === 0 ? C.white : '#fafbfc', transition: 'background .15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = C.offWhite}
                    onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? C.white : '#fafbfc'}>

                    {/* Logo */}
                    <td style={{ padding: '12px 16px', borderBottom: `1px solid ${C.border}`, verticalAlign: 'middle' }}>
                      {p.logo ? (
                        <img src={p.logo.startsWith('http') ? p.logo : `${import.meta.env.VITE_API_URL}${p.logo}`}
                          alt={p.nom} style={{ width: '36px', height: '36px', borderRadius: '8px',
                            objectFit: 'contain', border: `1px solid ${C.border}` }} />
                      ) : (
                        <div style={{ width: '36px', height: '36px', borderRadius: '8px',
                          background: C.tealLight, display: 'flex', alignItems: 'center',
                          justifyContent: 'center', fontSize: '18px' }}>
                          {typeIcon(p.type)}
                        </div>
                      )}
                    </td>

                    {/* Nom */}
                    <td style={{ padding: '12px 16px', borderBottom: `1px solid ${C.border}`, verticalAlign: 'middle' }}>
                      <span style={{ fontFamily: '"DM Sans",sans-serif', fontSize: '13px',
                        fontWeight: 700, color: C.azureDark }}>{p.nom}</span>
                      {p.date_debut && (
                        <div style={{ fontFamily: '"DM Sans",sans-serif', fontSize: '11px',
                          color: C.mutedLight, marginTop: '2px' }}>
                          Depuis {fmtDate(p.date_debut)}
                        </div>
                      )}
                    </td>

                    {/* Type */}
                    <td style={{ padding: '12px 16px', borderBottom: `1px solid ${C.border}`, verticalAlign: 'middle' }}>
                      <span style={{ fontFamily: '"DM Sans",sans-serif', fontSize: '11px',
                        fontWeight: 700, padding: '3px 9px', borderRadius: '100px',
                        color: typeColor(p.type), background: typeColor(p.type) + '15',
                        whiteSpace: 'nowrap' }}>
                        {p.type || '—'}
                      </span>
                    </td>

                    {/* Contact */}
                    <td style={{ padding: '12px 16px', borderBottom: `1px solid ${C.border}`, verticalAlign: 'middle' }}>
                      <div style={{ fontFamily: '"DM Sans",sans-serif', fontSize: '12.5px', color: C.muted }}>
                        {p.email || '—'}
                      </div>
                      {p.telephone && (
                        <div style={{ fontFamily: '"DM Sans",sans-serif', fontSize: '11.5px',
                          color: C.mutedLight, marginTop: '2px' }}>{p.telephone}</div>
                      )}
                    </td>

                    {/* Statut */}
                    <td style={{ padding: '12px 16px', borderBottom: `1px solid ${C.border}`, verticalAlign: 'middle' }}>
                      <StatutBadge statut={p.statut} />
                    </td>

                    {/* Modifier */}
                    <td style={{ padding: '12px 16px', borderBottom: `1px solid ${C.border}`,
                      verticalAlign: 'middle', textAlign: 'right' }}>
                      <button onClick={() => setModal(p)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px',
                          padding: '6px 11px', borderRadius: '8px',
                          background: C.tealLight, border: `1.5px solid ${C.teal}25`,
                          color: C.teal, fontSize: '11.5px', fontWeight: 700,
                          cursor: 'pointer', fontFamily: '"DM Sans",sans-serif',
                          transition: 'all .2s' }}
                        onMouseEnter={e => { e.currentTarget.style.background = C.teal; e.currentTarget.style.color = C.white; }}
                        onMouseLeave={e => { e.currentTarget.style.background = C.tealLight; e.currentTarget.style.color = C.teal; }}>
                        <Pencil size={11} /> Modifier
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Modales */}
      <AnimatePresence>
        {modal === 'add' && (
          <ModalPartenaire
            onClose={() => setModal(null)}
            onSuccess={() => { setModal(null); fetchPartenaires(); onStatsRefresh?.(); }}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {modal && modal !== 'add' && (
          <ModalPartenaire
            initial={modal}
            onClose={() => setModal(null)}
            onSuccess={() => { setModal(null); fetchPartenaires(); onStatsRefresh?.(); }}
          />
        )}
      </AnimatePresence>
    </>
  );
}

// ════════════════════════════════════════════════════════════
// ACTIONS À FINANCER (Droite)
// ════════════════════════════════════════════════════════════
function SectionActionsAFinancer() {
  const [actions, setAct] = useState([]);
  const [loading, setLoad] = useState(true);

  useEffect(() => {
    (async () => {
      setLoad(true);
      try {
        const { data } = await api.get(`${API_ACTIONS}?statut=EN_COURS&statut=PLANIFIEE`);
        const liste = (data.results ?? data).filter((a) => (a.budget_restant ?? 0) > 0);
        setAct(liste.slice(0, 5));
      } catch { setAct([]); }
      finally { setLoad(false); }
    })();
  }, []);

  const pct = (a) => {
    if (!a.budget_prevu || a.budget_prevu == 0) return 0;
    const depenses = a.total_depenses_reelles ?? 0;
    return Math.min(100, Math.round((depenses / a.budget_prevu) * 100));
  };

  return (
    <motion.div variants={fadeUp}
      style={{ background: C.white, borderRadius: '20px', border: `1.5px solid ${C.border}`,
        padding: '22px', boxShadow: '0 4px 24px rgba(0,0,0,.05)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
        <div style={{ width: '34px', height: '34px', borderRadius: '10px',
          background: C.warningBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Target size={16} style={{ color: C.warning }} />
        </div>
        <div>
          <h3 style={{ fontFamily: '"Playfair Display",serif', fontSize: '1.05rem',
            fontWeight: 700, color: C.azureDark, margin: 0 }}>Actions à Financer</h3>
          <p style={{ fontFamily: '"DM Sans",sans-serif', fontSize: '12px',
            color: C.muted, margin: 0 }}>Budget non encore couvert</p>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '24px' }}>
          <Loader2 size={18} style={{ animation: 'spin 1s linear infinite', color: C.teal }} />
        </div>
      ) : actions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '24px', fontFamily: '"DM Sans",sans-serif',
          fontSize: '13px', color: C.muted }}>
          <CheckCircle2 size={22} style={{ color: C.success, marginBottom: '8px',
            display: 'block', margin: '0 auto 8px' }} />
          Toutes les actions sont financées ! 🎉
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {actions.map((a) => {
            const p = pct(a);
            return (
              <div key={a.id} style={{ padding: '14px', borderRadius: '12px',
                border: `1px solid ${C.border}`, background: C.offWhite }}>
                <div style={{ display: 'flex', justifyContent: 'space-between',
                  alignItems: 'flex-start', gap: '8px', marginBottom: '10px' }}>
                  <span style={{ fontFamily: '"DM Sans",sans-serif', fontSize: '13px',
                    fontWeight: 700, color: C.azureDark, lineHeight: 1.3 }}>
                    {a.titre}
                  </span>
                  <span style={{ fontFamily: '"DM Sans",sans-serif', fontSize: '11px',
                    fontWeight: 700, padding: '2px 8px', borderRadius: '100px',
                    background: C.warningBg, color: C.warning, whiteSpace: 'nowrap', flexShrink: 0 }}>
                    {fmtMontant(a.budget_restant)} restant
                  </span>
                </div>
                <div style={{ height: '6px', borderRadius: '100px',
                  background: C.border, overflow: 'hidden', marginBottom: '6px' }}>
                  <div style={{ height: '100%', borderRadius: '100px',
                    width: `${p}%`, background: `linear-gradient(90deg,${C.teal},${C.emerald})`,
                    transition: 'width .5s ease' }} />
                </div>
                <div style={{ fontFamily: '"DM Sans",sans-serif', fontSize: '11px', color: C.mutedLight }}>
                  {p}% financé — Budget : {fmtMontant(a.budget_prevu)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}

// ════════════════════════════════════════════════════════════
// COLONNE DROITE — Engagement Personnel
// ════════════════════════════════════════════════════════════
function ColonneEngagement({ user }) {
  const [showDon, setDon] = useState(false);
  const [showCot, setCot] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      <SectionActionsAFinancer />

      {/* Carte Don */}
      <motion.div variants={fadeUp}
        style={{ background: C.white, borderRadius: '20px', border: `1.5px solid ${C.border}`,
          padding: '24px', boxShadow: '0 4px 24px rgba(0,0,0,.05)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '100px',
          height: '100px', borderRadius: '50%', background: C.azureLight, opacity: .6, pointerEvents: 'none' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', position: 'relative' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '14px',
            background: C.azureLight, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Heart size={20} style={{ color: C.azure }} />
          </div>
          <div>
            <div style={{ fontFamily: '"DM Sans",sans-serif', fontSize: '10.5px', fontWeight: 700,
              letterSpacing: '0.12em', textTransform: 'uppercase', color: C.azure, marginBottom: '2px' }}>
              Solidarité
            </div>
            <h4 style={{ fontFamily: '"Playfair Display",serif', fontSize: '1.05rem',
              fontWeight: 700, color: C.azureDark, margin: 0 }}>Faire un don</h4>
          </div>
        </div>
        <p style={{ fontFamily: '"DM Sans",sans-serif', fontSize: '13px', color: C.muted,
          lineHeight: 1.6, margin: '0 0 20px', position: 'relative' }}>
          Contribuez directement au financement des actions de l'association ININ.
        </p>
        <button onClick={() => setDon(true)}
          style={{ width: '100%', padding: '12px', borderRadius: '12px',
            background: `linear-gradient(135deg,${C.azure},#2d4fd4)`,
            color: C.white, fontSize: '13.5px', fontWeight: 700, border: 'none',
            cursor: 'pointer', fontFamily: '"DM Sans",sans-serif',
            boxShadow: `0 6px 18px ${C.azure}35`, transition: 'all .25s',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px' }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}>
          <Banknote size={15} /> Enregistrer un don
        </button>
      </motion.div>

      {/* Carte Cotisation */}
      <motion.div variants={fadeUp}
        style={{ background: C.white, borderRadius: '20px', border: `1.5px solid ${C.border}`,
          padding: '24px', boxShadow: '0 4px 24px rgba(0,0,0,.05)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '100px',
          height: '100px', borderRadius: '50%', background: '#ecfeff', opacity: .7, pointerEvents: 'none' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px', position: 'relative' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '14px',
            background: '#ecfeff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <CreditCard size={20} style={{ color: C.cyanDark }} />
          </div>
          <div>
            <div style={{ fontFamily: '"DM Sans",sans-serif', fontSize: '10.5px', fontWeight: 700,
              letterSpacing: '0.12em', textTransform: 'uppercase', color: C.cyanDark, marginBottom: '2px' }}>
              Adhésion
            </div>
            <h4 style={{ fontFamily: '"Playfair Display",serif', fontSize: '1.05rem',
              fontWeight: 700, color: C.azureDark, margin: 0 }}>Cotisation annuelle</h4>
          </div>
        </div>
        <p style={{ fontFamily: '"DM Sans",sans-serif', fontSize: '13px', color: C.muted,
          lineHeight: 1.6, margin: '0 0 20px', position: 'relative' }}>
          Cotisation annuelle : <strong style={{ color: C.azureDark }}>10 000 FCFA</strong>.
        </p>
        <button onClick={() => setCot(true)}
          style={{ width: '100%', padding: '12px', borderRadius: '12px',
            background: `linear-gradient(135deg,${C.emerald},${C.cyanDark})`,
            color: C.white, fontSize: '13.5px', fontWeight: 700, border: 'none',
            cursor: 'pointer', fontFamily: '"DM Sans",sans-serif',
            boxShadow: `0 6px 18px ${C.cyanDark}35`, transition: 'all .25s',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px' }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}>
          <CheckCircle2 size={15} /> Payer ma cotisation
        </button>
      </motion.div>

      <AnimatePresence>
        {showDon && <ModalDon onClose={() => setDon(false)} onSuccess={() => {}} />}
      </AnimatePresence>
      <AnimatePresence>
        {showCot && <ModalCotisation onClose={() => setCot(false)} onSuccess={() => {}} userId={user?.id} />}
      </AnimatePresence>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// PAGE PRINCIPALE — DashboardPartenariat
// ════════════════════════════════════════════════════════════
export default function DashboardPartenariat() {
  const { user, logout } = useAuth();
  const navigate  = useNavigate();
  const ref       = useRef(null);
  const inView    = useInView(ref, { once: true, amount: .05 });

  const [stats,   setStats]  = useState(null);
  const [ldStats, setLdStat] = useState(true);

  const displayName = user?.first_name || user?.username || 'Chargé de Partenariat';
  const handleLogout = () => { logout(); navigate('/', { replace: true }); };

  const fetchStats = useCallback(async () => {
    setLdStat(true);
    try {
      const [partRes, donsRes, actionsRes] = await Promise.allSettled([
        api.get(`${API_PARTENAIRES}?statut=ACTIF`),
        api.get(API_DONS),
        api.get(`${API_ACTIONS}?statut=EN_COURS`),
      ]);

      const partenairesActifs = partRes.status === 'fulfilled'
        ? (partRes.value.data.results ?? partRes.value.data).length
        : 0;

      const maintenant = new Date();
      const debutAnnee = `${maintenant.getFullYear()}-01-01`;
      const donsPart   = donsRes.status === 'fulfilled'
        ? (donsRes.value.data.results ?? donsRes.value.data)
            .filter((d) => d.donateur_partenaire && d.date_don >= debutAnnee)
            .reduce((acc, d) => acc + parseFloat(d.montant || 0), 0)
        : 0;

      const actionsAFinancer = actionsRes.status === 'fulfilled'
        ? (actionsRes.value.data.results ?? actionsRes.value.data)
            .filter((a) => (a.budget_restant ?? 0) > 0).length
        : 0;

      setStats({ partenairesActifs, donsPart, actionsAFinancer });
    } catch { setStats(null); }
    finally { setLdStat(false); }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  return (
    <>
      <style>{`
        @keyframes spin  { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.35} }
        .part-grid-6040 {
          display: grid;
          grid-template-columns: 3fr 2fr;
          gap: 24px;
          align-items: start;
        }
        @media (max-width: 900px) {
          .part-grid-6040 { grid-template-columns: 1fr; }
        }
      `}</style>

      <div style={{ fontFamily: '"DM Sans",sans-serif', background: C.offWhite,
        minHeight: '100vh', paddingTop: `${NAV_HEIGHT}px` }}>

        {/* ══ HERO HEADER ══════════════════════════════════════ */}
        <div style={{
          background: `linear-gradient(135deg,${C.emeraldDeep} 0%,${C.tealDark} 35%,${C.teal} 65%,${C.emerald} 100%)`,
          padding: '44px 24px 56px', position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: '-60px', right: '-60px', width: '260px',
            height: '260px', borderRadius: '50%', background: 'rgba(255,255,255,.03)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: '-40px', left: '28%', width: '200px',
            height: '200px', borderRadius: '50%', background: 'rgba(13,148,136,.12)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', top: '20px', right: '12%', width: '90px',
            height: '90px', border: '1px solid rgba(255,255,255,.05)', borderRadius: '14px',
            transform: 'rotate(20deg)', pointerEvents: 'none' }} />

          <div style={{ maxWidth: '1280px', margin: '0 auto', position: 'relative',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexWrap: 'wrap', gap: '20px' }}>

            <motion.div initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }}
              transition={{ duration: .6, ease: [0.22, 1, 0.36, 1] }}
              style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
              <Avatar user={user} size={58} />
              <div>
                <div style={{ fontFamily: '"DM Sans",sans-serif', fontSize: '11px',
                  color: 'rgba(255,255,255,.45)', fontWeight: 600, letterSpacing: '0.15em',
                  textTransform: 'uppercase', marginBottom: '4px' }}>
                  Espace Partenariat
                </div>
                <h1 style={{ fontFamily: '"Playfair Display",serif',
                  fontSize: 'clamp(1.4rem,3vw,1.9rem)', fontWeight: 800,
                  color: C.white, margin: 0, lineHeight: 1.15 }}>
                  Bonjour,{' '}
                  <em style={{ fontStyle: 'italic', color: '#6ee7b7' }}>{displayName}</em> 👋
                </h1>
                <div style={{ fontFamily: '"DM Sans",sans-serif', fontSize: '13px',
                  color: 'rgba(255,255,255,.45)', marginTop: '4px' }}>
                  Gérez les partenariats stratégiques et les financements de l'association ININ.
                </div>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }}
              transition={{ duration: .6, ease: [0.22, 1, 0.36, 1] }}
              style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
              <Link to="/dashboard/settings"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px',
                  padding: '10px 16px', borderRadius: '100px',
                  background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.2)',
                  color: C.white, fontSize: '13px', fontWeight: 600,
                  fontFamily: '"DM Sans",sans-serif', textDecoration: 'none',
                  transition: 'background .2s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,.18)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,.1)'}>
                <Settings size={14} /> Profil
              </Link>
              <button onClick={handleLogout}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px',
                  padding: '10px 16px', borderRadius: '100px',
                  background: 'rgba(220,38,38,.15)', border: '1px solid rgba(220,38,38,.3)',
                  color: '#fca5a5', fontSize: '13px', fontWeight: 600,
                  fontFamily: '"DM Sans",sans-serif', cursor: 'pointer',
                  transition: 'background .2s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(220,38,38,.28)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(220,38,38,.15)'}>
                <LogOut size={14} /> Déconnecter
              </button>
            </motion.div>
          </div>
        </div>

        {/* ══ CONTENU PRINCIPAL ════════════════════════════════ */}
        <div ref={ref} style={{ maxWidth: '1280px', margin: '0 auto', padding: '36px 24px 80px' }}>

          {/* ── KPI CARDS ──────────────────────────────────── */}
          <motion.div variants={stagger(.09)} initial="hidden" animate={inView ? 'show' : 'hidden'}
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))',
              gap: '18px', marginBottom: '44px' }}>
            <KpiCard
              icon={Handshake} label="Partenaires Actifs"
              value={ldStats ? '…' : (stats?.partenairesActifs ?? '—')}
              sub="En cours" subPositive={true}
              color={C.teal} bg={C.tealLight}
            />
            <KpiCard
              icon={TrendingUp} label="Dons Partenaires (Année)"
              value={ldStats ? '…' : (stats ? fmtMontant(stats.donsPart) : '—')}
              sub="Collectés" subPositive={true}
              color={C.emerald} bg={C.emeraldLight}
            />
            <KpiCard
              icon={Target} label="Actions à Financer"
              value={ldStats ? '…' : (stats?.actionsAFinancer ?? '—')}
              sub={stats?.actionsAFinancer > 0 ? 'Budget incomplet' : 'Toutes couvertes'}
              subPositive={stats?.actionsAFinancer === 0}
              color={C.warning} bg={C.warningBg}
            />
          </motion.div>

          {/* ── GRILLE 60 / 40 ─────────────────────────────── */}
          <motion.div variants={stagger(.1)} initial="hidden" animate={inView ? 'show' : 'hidden'}
            className="part-grid-6040">
            <SectionPartenaires onStatsRefresh={fetchStats} />
            <ColonneEngagement user={user} />
          </motion.div>
        </div>
      </div>
    </>
  );
}