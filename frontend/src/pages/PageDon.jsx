// src/pages/PageDon.jsx
// ══════════════════════════════════════════════════════════════
// PAGE DE DON PUBLIQUE — Association ININ
// Page standalone : aucune authentification requise
// ══════════════════════════════════════════════════════════════

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check, Heart, Shield, FileCheck, Target } from 'lucide-react';

// ── PALETTE DE COULEURS ────────────────────────────────────────
const C = {
  emerald:       '#059669',
  emeraldDark:   '#064e3b',
  emeraldDeep:   '#022c22',
  emeraldLight:  '#ecfdf5',
  emeraldAccent: '#6ee7b7',
  azure:         '#1640c8',
  azureDark:     '#0f172a',
  azureLight:    '#eef5ff',
  cyanDark:      '#17a8b5',
  white:         '#ffffff',
  offWhite:      '#f8fafc',
  muted:         '#64748b',
  mutedLight:    '#94a3b8',
  border:        '#e2e8f0',
};

// ── CONFIGURATION DES 5 MODES DE PAIEMENT ──────────────────────
const MODES = [
  {
    id:        'wave',
    label:     'Wave',
    emoji:     '🌊',
    accent:    '#1877F2',
    accentBg:  '#EBF3FF',
    numero:    '+221 XX XXX XX XX',   // TODO: remplacer par le vrai numéro Wave
    lien:      '#',                   // TODO: remplacer par lien de paiement Wave direct
  },
  {
    id:        'orange',
    label:     'Orange Money',
    emoji:     '🟠',
    accent:    '#FF6600',
    accentBg:  '#FFF3EB',
    numero:    '+221 XX XXX XX XX',   // TODO: remplacer par le vrai numéro Orange Money
    lien:      '#',                   // TODO: remplacer par lien de paiement Orange Money
  },
  {
    id:        'mtn',
    label:     'MTN Money',
    emoji:     '💛',
    accent:    '#FFCC00',
    accentBg:  '#FFFBE6',
    numero:    '+XXX XX XXX XX XX',   // TODO: remplacer par le vrai numéro MTN
    lien:      '#',                   // TODO: remplacer par lien de paiement MTN Money
  },
  {
    id:        'moov',
    label:     'Moov Money',
    emoji:     '🔵',
    accent:    '#0066CC',
    accentBg:  '#E6F0FF',
    numero:    '+XXX XX XXX XX XX',   // TODO: remplacer par le vrai numéro Moov Money
    lien:      '#',                   // TODO: remplacer par lien de paiement Moov Money
  },
  {
    id:        'paypal',
    label:     'PayPal',
    emoji:     '💙',
    accent:    '#003087',
    accentBg:  '#E8EEF7',
    numero:    'dons@inin.org',       // TODO: remplacer par l'email PayPal réel
    lien:      '#',                   // TODO: remplacer par lien PayPal.me de l'association
  },
];

// ── ANIMATIONS ─────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

const stagger = (delay = 0.1) => ({
  hidden: {},
  show:   { transition: { staggerChildren: delay } },
});

// ══════════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ══════════════════════════════════════════════════════════════
export default function PageDon() {
  const [copiedId, setCopiedId] = useState(null);

  // ── Fonction : copier dans le clipboard ──────────────────────
  const handleCopy = (mode) => {
    navigator.clipboard.writeText(mode.numero);
    setCopiedId(mode.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <>
      {/* ══ STYLES GLOBAUX (responsive + animations) ═══════════ */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=DM+Sans:wght@400;500;600;700&display=swap');
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'DM Sans', sans-serif;
          background: ${C.offWhite};
          color: ${C.azureDark};
        }

        .card-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 24px;
          margin-bottom: 24px;
        }

        .card-grid-last {
          display: flex;
          justify-content: center;
        }

        @media (max-width: 768px) {
          .card-grid {
            grid-template-columns: 1fr;
          }
        }

        @keyframes pulse-check {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
      `}</style>

      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', paddingTop: '80px' }}>
        
        {/* ══════════════════════════════════════════════════════
            1. HERO HEADER
        ══════════════════════════════════════════════════════ */}
        <div style={{
          background: `linear-gradient(135deg, ${C.emeraldDeep} 0%, ${C.emeraldDark} 35%, ${C.emerald} 70%, ${C.cyanDark} 100%)`,
          padding: '80px 24px 100px',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Décorations abstraites */}
          <div style={{
            position: 'absolute',
            top: '-80px',
            right: '-80px',
            width: '300px',
            height: '300px',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.05)',
            pointerEvents: 'none',
          }} />
          <div style={{
            position: 'absolute',
            bottom: '-60px',
            left: '-40px',
            width: '220px',
            height: '220px',
            borderRadius: '50%',
            background: 'rgba(110,231,183,0.1)',
            pointerEvents: 'none',
          }} />

          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            style={{
              maxWidth: '900px',
              margin: '0 auto',
              textAlign: 'center',
              position: 'relative',
              zIndex: 1,
            }}
          >
            {/* Logo / Icône association */}
            <div style={{
              width: '80px',
              height: '80px',
              margin: '0 auto 20px',
              borderRadius: '20px',
              background: `linear-gradient(135deg, ${C.emeraldAccent}, ${C.emerald})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 12px 40px ${C.emeraldDeep}60`,
            }}>
              <Heart size={40} style={{ color: C.white }} strokeWidth={2} />
            </div>

            {/* Nom de l'association */}
            <div style={{
              fontFamily: '"DM Sans", sans-serif',
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: C.emeraldAccent,
              marginBottom: '16px',
            }}>
              Association ININ
            </div>

            {/* Titre principal */}
            <h1 style={{
              fontFamily: '"Playfair Display", serif',
              fontSize: 'clamp(2rem, 5vw, 3.5rem)',
              fontWeight: 700,
              color: C.white,
              lineHeight: 1.2,
              marginBottom: '20px',
              letterSpacing: '0.01em',
            }}>
              Soutenez nos actions
            </h1>

            {/* Sous-titre */}
            <p style={{
              fontFamily: '"DM Sans", sans-serif',
              fontSize: 'clamp(1rem, 2.5vw, 1.25rem)',
              color: 'rgba(255,255,255,0.85)',
              lineHeight: 1.7,
              maxWidth: '650px',
              margin: '0 auto',
              fontWeight: 500,
            }}>
              Chaque don contribue directement à la santé et à l'épanouissement de la jeunesse.
              Ensemble, bâtissons un avenir meilleur.
            </p>
          </motion.div>
        </div>

        {/* ══════════════════════════════════════════════════════
            2. INTRO STRIP — Badges de confiance
        ══════════════════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          style={{
            background: C.white,
            padding: '48px 24px',
            borderBottom: `1px solid ${C.border}`,
          }}
        >
          <div style={{ maxWidth: '1100px', margin: '0 auto', textAlign: 'center' }}>
            {/* Message de confiance */}
            <p style={{
              fontFamily: '"DM Sans", sans-serif',
              fontSize: '15px',
              color: C.muted,
              lineHeight: 1.7,
              marginBottom: '32px',
              maxWidth: '700px',
              margin: '0 auto 32px',
            }}>
              Nous nous engageons à utiliser chaque franc avec transparence.
              Vos contributions financent des projets concrets au service de notre jeunesse.
            </p>

            {/* 3 badges de confiance */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '32px',
              flexWrap: 'wrap',
            }}>
              {[
                { icon: Shield, text: 'Paiement sécurisé' },
                { icon: FileCheck, text: 'Reçu sur demande' },
                { icon: Target, text: '100% dédié au terrain' },
              ].map((badge, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.3 + i * 0.1 }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 20px',
                    borderRadius: '100px',
                    background: C.emeraldLight,
                    border: `1px solid ${C.emerald}30`,
                  }}
                >
                  <badge.icon size={16} style={{ color: C.emerald }} strokeWidth={2.5} />
                  <span style={{
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: C.emeraldDark,
                  }}>
                    {badge.text}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* ══════════════════════════════════════════════════════
            3. SECTION MODES DE PAIEMENT — 5 cartes
        ══════════════════════════════════════════════════════ */}
        <div style={{
          flex: 1,
          padding: '64px 24px 80px',
          background: C.offWhite,
        }}>
          <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
            
            {/* Titre de section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              style={{ textAlign: 'center', marginBottom: '48px' }}
            >
              <h2 style={{
                fontFamily: '"Playfair Display", serif',
                fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
                fontWeight: 700,
                color: C.azureDark,
                marginBottom: '12px',
              }}>
                Choisissez votre mode de paiement
              </h2>
              <p style={{
                fontFamily: '"DM Sans", sans-serif',
                fontSize: '15px',
                color: C.muted,
                maxWidth: '600px',
                margin: '0 auto',
              }}>
                Sélectionnez le service qui vous convient le mieux pour effectuer votre don en toute sécurité.
              </p>
            </motion.div>

            {/* Grille des 4 premières cartes (2x2) */}
            <motion.div
              variants={stagger(0.1)}
              initial="hidden"
              animate="show"
              className="card-grid"
            >
              {MODES.slice(0, 4).map((mode) => (
                <CardModePaiement
                  key={mode.id}
                  mode={mode}
                  copiedId={copiedId}
                  onCopy={handleCopy}
                />
              ))}
            </motion.div>

            {/* 5e carte (PayPal) centrée */}
            <motion.div
              variants={stagger(0.1)}
              initial="hidden"
              animate="show"
              className="card-grid-last"
            >
              <div style={{ width: '100%', maxWidth: '520px' }}>
                <CardModePaiement
                  mode={MODES[4]}
                  copiedId={copiedId}
                  onCopy={handleCopy}
                />
              </div>
            </motion.div>

          </div>
        </div>

        {/* ══════════════════════════════════════════════════════
            4. FOOTER STRIP
        ══════════════════════════════════════════════════════ */}
        <div style={{
          background: C.emeraldDeep,
          padding: '40px 24px',
          textAlign: 'center',
        }}>
          <p style={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: '14px',
            color: C.emeraldAccent,
            marginBottom: '12px',
            fontWeight: 500,
          }}>
            Une question ? Contactez-nous :{' '}
            <a
              href="mailto:contact@inin.org" // TODO: remplacer par l'email réel
              style={{
                color: C.white,
                textDecoration: 'none',
                fontWeight: 700,
                borderBottom: `1px solid ${C.emeraldAccent}50`,
              }}
            >
              contact@inin.org
            </a>
          </p>
          <p style={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: '12px',
            color: 'rgba(110,231,183,0.6)',
          }}>
            Association ININ — Tous droits réservés {new Date().getFullYear()}
          </p>
        </div>

        {/* ══════════════════════════════════════════════════════
            TOAST "Copié !" (affiché 2s après copie)
        ══════════════════════════════════════════════════════ */}
        <AnimatePresence>
          {copiedId && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              style={{
                position: 'fixed',
                bottom: '32px',
                right: '32px',
                background: C.emeraldDark,
                color: C.white,
                padding: '14px 24px',
                borderRadius: '12px',
                boxShadow: '0 12px 40px rgba(6,78,59,0.5)',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                zIndex: 9999,
              }}
            >
              <Check size={18} style={{ color: C.emeraldAccent, animation: 'pulse-check 0.6s ease' }} />
              <span style={{
                fontFamily: '"DM Sans", sans-serif',
                fontSize: '14px',
                fontWeight: 700,
              }}>
                Numéro copié !
              </span>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </>
  );
}

// ══════════════════════════════════════════════════════════════
// SOUS-COMPOSANT : CARTE MODE DE PAIEMENT
// ══════════════════════════════════════════════════════════════
function CardModePaiement({ mode, copiedId, onCopy }) {
  const [hover, setHover] = useState(false);

  return (
    <motion.div
      variants={fadeUp}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: C.white,
        borderRadius: '20px',
        border: `1.5px solid ${C.border}`,
        borderTop: `4px solid ${mode.accent}`,
        boxShadow: hover
          ? `0 20px 60px ${mode.accent}25`
          : '0 4px 20px rgba(0,0,0,0.06)',
        padding: '28px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        transition: 'all 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
        transform: hover ? 'translateY(-4px)' : 'translateY(0)',
        cursor: 'default',
      }}
    >
      {/* Badge + Emoji */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 14px',
          borderRadius: '100px',
          background: mode.accentBg,
          border: `1px solid ${mode.accent}30`,
        }}>
          <span style={{ fontSize: '16px' }}>{mode.emoji}</span>
          <span style={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: '12px',
            fontWeight: 700,
            color: mode.accent,
          }}>
            {mode.label}
          </span>
        </div>
      </div>

      {/* Nom du service (titre) */}
      <div>
        <h3 style={{
          fontFamily: '"Playfair Display", serif',
          fontSize: '1.5rem',
          fontWeight: 700,
          color: C.azureDark,
          marginBottom: '8px',
          lineHeight: 1.2,
        }}>
          {mode.label}
        </h3>
        <p style={{
          fontFamily: '"DM Sans", sans-serif',
          fontSize: '13px',
          color: C.muted,
          fontWeight: 500,
        }}>
          Bénéficiaire : <strong style={{ color: C.azureDark }}>Association ININ</strong>
        </p>
      </div>

      {/* Numéro / Email */}
      <div style={{
        padding: '14px 16px',
        background: C.offWhite,
        borderRadius: '10px',
        border: `1px solid ${C.border}`,
      }}>
        <div style={{
          fontFamily: '"DM Sans", sans-serif',
          fontSize: '10px',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: C.muted,
          marginBottom: '6px',
        }}>
          {mode.id === 'paypal' ? 'Email PayPal' : 'Numéro de compte'}
        </div>
        <div style={{
          fontFamily: '"DM Sans", sans-serif',
          fontSize: '16px',
          fontWeight: 700,
          color: mode.accent,
          letterSpacing: '0.02em',
        }}>
          {mode.numero}
        </div>
      </div>

      {/* QR Code Placeholder */}
      <div style={{
        width: '100%',
        height: '180px',
        borderRadius: '12px',
        background: `linear-gradient(135deg, ${C.offWhite}, ${mode.accentBg})`,
        border: `2px dashed ${mode.accent}30`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '8px',
      }}>
        <span style={{ fontSize: '32px' }}>{mode.emoji}</span>
        <span style={{
          fontFamily: '"DM Sans", sans-serif',
          fontSize: '13px',
          fontWeight: 600,
          color: C.muted,
        }}>
          QR Code {mode.label}
        </span>
        <span style={{
          fontFamily: '"DM Sans", sans-serif',
          fontSize: '11px',
          color: C.mutedLight,
        }}>
          (À venir)
        </span>
      </div>

      {/* Boutons d'action */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {/* Bouton Payer via [service] */}
        <a
          href={mode.lien}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '14px 24px',
            borderRadius: '10px',
            background: mode.accent,
            color: C.white,
            fontFamily: '"DM Sans", sans-serif',
            fontSize: '14px',
            fontWeight: 700,
            textDecoration: 'none',
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.2s',
            boxShadow: `0 4px 16px ${mode.accent}40`,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = `0 8px 24px ${mode.accent}55`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = `0 4px 16px ${mode.accent}40`;
          }}
        >
          <span>{mode.emoji}</span>
          Payer via {mode.label}
        </a>

        {/* Bouton Copier le numéro */}
        <button
          onClick={() => onCopy(mode)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '12px 20px',
            borderRadius: '10px',
            background: C.offWhite,
            color: C.muted,
            fontFamily: '"DM Sans", sans-serif',
            fontSize: '13px',
            fontWeight: 600,
            border: `1.5px solid ${C.border}`,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = mode.accent;
            e.currentTarget.style.color = mode.accent;
            e.currentTarget.style.background = mode.accentBg;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = C.border;
            e.currentTarget.style.color = C.muted;
            e.currentTarget.style.background = C.offWhite;
          }}
        >
          {copiedId === mode.id ? (
            <>
              <Check size={14} />
              Copié !
            </>
          ) : (
            <>
              <Copy size={14} />
              Copier le {mode.id === 'paypal' ? 'email' : 'numéro'}
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
}
