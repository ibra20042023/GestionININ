

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { X, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

// ── Configuration API ─────────────────────────────────────
const API_DONS = 'http://127.0.0.1:8000/api/dons/';
const getToken = () =>
  localStorage.getItem('access_token') ||
  sessionStorage.getItem('access_token') ||
  '';
const authHeader = () => ({ Authorization: `Bearer ${getToken()}` });

// ── Palette couleurs ──────────────────────────────────────
const C = {
  azure: '#1640c8',
  azureDark: '#0f172a',
  azureLight: '#eef5ff',
  white: '#ffffff',
  offWhite: '#f8fafc',
  muted: '#64748b',
  mutedLight: '#94a3b8',
  border: '#e2e8f0',
  danger: '#dc2626',
  dangerBg: '#fef2f2',
};

// ── Configuration modes de paiement ───────────────────────
const MODE_CFG = {
  ESPECES: { label: 'Espèces' },
  VIREMENT: { label: 'Virement' },
  MOBILE_MONEY: { label: 'Mobile Money' },
  CHEQUE: { label: 'Chèque' },
  EN_LIGNE: { label: 'En ligne' },
  AUTRE: { label: 'Autre' },
};

// ── Styles réutilisables ──────────────────────────────────
const IS_shared = (ac) => ({
  width: '100%',
  padding: '11px 14px',
  border: `1.5px solid ${C.border}`,
  borderRadius: '10px',
  fontSize: '14px',
  fontFamily: '"DM Sans",sans-serif',
  color: C.azureDark,
  background: C.offWhite,
  outline: 'none',
  transition: 'border-color .2s,box-shadow .2s',
  boxSizing: 'border-box',
});

const fo_shared = (ac) => (e) => {
  e.target.style.borderColor = ac;
  e.target.style.boxShadow = `0 0 0 3px ${ac}18`;
};

const bl_shared = () => (e) => {
  e.target.style.borderColor = C.border;
  e.target.style.boxShadow = 'none';
};

const LBs = {
  display: 'block',
  fontFamily: '"DM Sans",sans-serif',
  fontSize: '11.5px',
  fontWeight: 700,
  color: C.muted,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  marginBottom: '6px',
};

// ── Composants UI de base ─────────────────────────────────

function ModalShell({ onClose, children, maxWidth = '500px' }) {
  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,.6)',
          backdropFilter: 'blur(4px)',
          zIndex: 999,
        }}
      />
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%,-50%)',
          zIndex: 1000,
          width: '90%',
          maxWidth: maxWidth,
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
          style={{
            background: C.white,
            borderRadius: '24px',
            boxShadow: '0 36px 80px rgba(0,0,0,.22)',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {children}
        </motion.div>
      </div>
    </>
  );
}

function ModalHeader({ eyebrow, title, gradient, onClose }) {
  return (
    <div
      style={{
        background: gradient,
        padding: '20px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
      }}
    >
      <div>
        <div
          style={{
            fontFamily: '"DM Sans",sans-serif',
            fontSize: '10px',
            fontWeight: 700,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,.4)',
            marginBottom: '3px',
          }}
        >
          {eyebrow}
        </div>
        <h3
          style={{
            fontFamily: '"Playfair Display",serif',
            fontSize: '1.2rem',
            fontWeight: 700,
            color: C.white,
            margin: 0,
          }}
        >
          {title}
        </h3>
      </div>
      <button
        onClick={onClose}
        style={{
          width: '34px',
          height: '34px',
          borderRadius: '50%',
          background: 'rgba(255,255,255,.12)',
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: C.white,
          transition: 'background .2s',
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.background = 'rgba(255,255,255,.24)')
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.background = 'rgba(255,255,255,.12)')
        }
      >
        <X size={16} />
      </button>
    </div>
  );
}

function ModalFooter({ onClose, onSubmit, loading, label, color }) {
  return (
    <div
      style={{
        padding: '14px 24px',
        borderTop: `1px solid ${C.border}`,
        display: 'flex',
        gap: '10px',
        justifyContent: 'flex-end',
        flexShrink: 0,
      }}
    >
      <button
        onClick={onClose}
        style={{
          padding: '10px 20px',
          borderRadius: '100px',
          border: `1.5px solid ${C.border}`,
          background: C.white,
          color: C.muted,
          fontSize: '13px',
          fontWeight: 600,
          cursor: 'pointer',
          fontFamily: '"DM Sans",sans-serif',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.borderColor = C.muted)}
        onMouseLeave={(e) => (e.currentTarget.style.borderColor = C.border)}
      >
        Annuler
      </button>
      <button
        onClick={onSubmit}
        disabled={loading}
        style={{
          padding: '10px 24px',
          borderRadius: '100px',
          border: 'none',
          background: loading ? C.border : color,
          color: loading ? C.mutedLight : C.white,
          fontSize: '13px',
          fontWeight: 700,
          cursor: loading ? 'wait' : 'pointer',
          fontFamily: '"DM Sans",sans-serif',
          boxShadow: loading ? 'none' : `0 4px 16px ${color}55`,
          transition: 'all .22s',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        {loading ? (
          <>
            <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />{' '}
            Envoi…
          </>
        ) : (
          label
        )}
      </button>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL — ModalDon
// ══════════════════════════════════════════════════════════

/**
 * Props :
 * - onClose    : fonction appelée à la fermeture
 * - onSuccess  : fonction appelée après enregistrement réussi
 * - membres    : tableau des membres { id, display }
 */
export default function ModalDon({ onClose, onSuccess, membres = [] }) {
  const [form, setForm] = useState({
    montant: '',
    mode: 'VIREMENT',
    membre_id: '',
  });
  const [loading, setLoad] = useState(false);
  const [error, setError] = useState(null);

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));
  const IS = IS_shared(C.azure);
  const fo = fo_shared(C.azure);
  const bl = bl_shared();

  const submit = async () => {
    if (!form.montant || parseFloat(form.montant) <= 0) {
      setError('Montant invalide.');
      return;
    }
    setLoad(true);
    setError(null);
    try {
      const payload = { montant: form.montant, mode_paiement: form.mode };
      if (form.membre_id) payload.donateur_membre = form.membre_id;
      await axios.post(API_DONS, payload, { headers: authHeader() });
      onSuccess?.();
      onClose();
    } catch (e) {
      setError(
        e.response?.data
          ? Object.values(e.response.data).flat().join(' ')
          : 'Erreur serveur.'
      );
    } finally {
      setLoad(false);
    }
  };

  return (
    <ModalShell onClose={onClose}>
      <ModalHeader
        eyebrow="Comptabilité"
        title="Enregistrer un don"
        gradient={`linear-gradient(135deg,#0f172a,${C.azure})`}
        onClose={onClose}
      />

      <div
        style={{
          padding: '24px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        {/* Montant */}
        <div>
          <span style={LBs}>Montant (FCFA) *</span>
          <input
            type="number"
            min="0"
            step="500"
            placeholder="Ex : 25 000"
            value={form.montant}
            onChange={set('montant')}
            onFocus={fo}
            onBlur={bl}
            style={IS}
          />
        </div>

        {/* Mode paiement */}
        <div>
          <span style={LBs}>Mode de paiement *</span>
          <select
            value={form.mode}
            onChange={set('mode')}
            onFocus={fo}
            onBlur={bl}
            style={{ ...IS, cursor: 'pointer' }}
          >
            {Object.entries(MODE_CFG).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </select>
        </div>

        {/* Membre lié (optionnel) */}
        <div>
          <span style={LBs}>
            Membre associé{' '}
            <span
              style={{
                fontWeight: 400,
                textTransform: 'none',
                letterSpacing: 0,
              }}
            >
              (optionnel)
            </span>
          </span>
          <select
            value={form.membre_id}
            onChange={set('membre_id')}
            onFocus={fo}
            onBlur={bl}
            style={{
              ...IS,
              cursor: 'pointer',
              color: form.membre_id ? C.azureDark : C.mutedLight,
            }}
          >
            <option value="">— Don anonyme ou externe —</option>
            {membres.map((m) => (
              <option key={m.id} value={m.id}>
                {m.display}
              </option>
            ))}
          </select>
          <span
            style={{
              fontFamily: '"DM Sans",sans-serif',
              fontSize: '11.5px',
              color: C.mutedLight,
              marginTop: '4px',
              display: 'block',
            }}
          >
            Laissez vide pour un don anonyme ou d'une personne extérieure.
          </span>
        </div>

        {error && (
          <div
            style={{
              display: 'flex',
              gap: '8px',
              padding: '12px 14px',
              borderRadius: '10px',
              background: C.dangerBg,
              border: `1px solid ${C.danger}30`,
            }}
          >
            <AlertCircle
              size={14}
              style={{ color: C.danger, flexShrink: 0, marginTop: '1px' }}
            />
            <span
              style={{
                fontFamily: '"DM Sans",sans-serif',
                fontSize: '13px',
                color: C.danger,
              }}
            >
              {error}
            </span>
          </div>
        )}
      </div>

      <ModalFooter
        onClose={onClose}
        onSubmit={submit}
        loading={loading}
        label={
          <>
            <CheckCircle2 size={13} /> Enregistrer le don
          </>
        }
        color={C.azure}
      />
    </ModalShell>
  );
}
