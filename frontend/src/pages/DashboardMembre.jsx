/**
 * src/pages/DashboardMembre.jsx
 * ─────────────────────────────────────────────────────────────
 * Tableau de bord — Espace membre ININ
 * v5 — Corrections appliquées :
 *   ✅ [1] accessToken (plus 'token') récupéré via useAuth()
 *   ✅ [2] logout destructuré depuis useAuth()
 *   ✅ [3] Navigate importé depuis react-router-dom
 *   ✅ [4] Hooks (useState, useEffect) tous déclarés AVANT
 *          les return conditionnels (règle des Hooks React)
 *   ✅ [5] useEffect dépend de accessToken (plus 'token')
 *   ✅ [6] Guard if (!accessToken) dans useEffect
 * ─────────────────────────────────────────────────────────────
 */

import { useState, useEffect } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom'; // ✅ [3] Navigate ajouté
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/api'; 
import {
  LayoutDashboard, Users, Bell,
  Heart, LogOut, Settings,
  ChevronRight, Zap, X,
  CheckCircle2, Clock, TrendingUp,
  CreditCard, AlertCircle, Loader2,
  CalendarDays,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API_BASE = import.meta.env.VITE_API_URL; // uniquement pour les URLs médias


// ── Palette ───────────────────────────────────────────────────
const C = {
  azure:      '#1640c8',
  azureDark:  '#0f172a',
  azureDeep:  '#0f2060',
  azureLight: '#eef5ff',
  azureAlpha: 'rgba(22,64,200,0.08)',
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

// ── Framer Motion variants ────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
};
const stagger = (d = 0.07) => ({
  hidden: {},
  show:   { transition: { staggerChildren: d } },
});

// ── Activités récentes (statiques) ───────────────────────────
const ACTIVITES = [
  { icon: CheckCircle2, text: "Votre profil a été validé par l'équipe RH.",      time: 'Il y a 2 jours',   color: C.success  },
  { icon: Bell,         text: 'Nouveau webinaire : "Santé mentale en Afrique".', time: 'Il y a 4 jours',   color: C.azure    },
  { icon: Users,        text: '3 nouveaux membres ont rejoint votre région.',     time: 'Il y a 1 semaine', color: C.cyanDark },
  { icon: Clock,        text: 'Rappel : Atelier en ligne ce vendredi à 18h.',     time: 'Il y a 1 semaine', color: C.warning  },
];

// ─────────────────────────────────────────────────────────────
// Utilitaire — liste des mois depuis septembre 2025
// ─────────────────────────────────────────────────────────────
function genererMoisDepuisDebut() {
  const MOIS_FR = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
  ];
  const liste   = [];
  const now     = new Date();
  let annee     = 2025;
  let moisIdx   = 8; // septembre = index 8

  while (
    annee < now.getFullYear() ||
    (annee === now.getFullYear() && moisIdx <= now.getMonth())
  ) {
    liste.push(`${MOIS_FR[moisIdx]} ${annee}`);
    moisIdx++;
    if (moisIdx > 11) { moisIdx = 0; annee++; }
  }
  return liste;
}

// ─────────────────────────────────────────────────────────────
// Squelette de stat card (pendant le chargement)
// ─────────────────────────────────────────────────────────────
function StatSkeleton() {
  return (
    <div style={{
      background: C.white, borderRadius: '18px',
      border: `1.5px solid ${C.border}`, padding: '22px 20px',
      boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
      animation: 'pulse-soft 1.6s ease-in-out infinite',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '11px', background: C.border }} />
        <div style={{ width: '60px', height: '22px', borderRadius: '100px', background: C.border }} />
      </div>
      <div style={{ width: '70px', height: '30px', borderRadius: '6px', background: C.border, marginBottom: '8px' }} />
      <div style={{ width: '100px', height: '14px', borderRadius: '4px', background: C.border }} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Modale cotisations
// ─────────────────────────────────────────────────────────────
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

  return (
    <AnimatePresence>
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(15,23,42,0.55)',
          backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '24px',
        }}
      >
        <motion.div
          key="modal"
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 20 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          onClick={e => e.stopPropagation()}
          style={{
            background: C.white, borderRadius: '24px',
            border: `1.5px solid ${C.border}`,
            boxShadow: '0 32px 80px rgba(15,23,42,0.22)',
            width: '100%', maxWidth: '520px', maxHeight: '85vh',
            display: 'flex', flexDirection: 'column', overflow: 'hidden',
          }}
        >
          {/* En-tête */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '22px 24px 18px', borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: C.azureLight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CalendarDays size={18} style={{ color: C.azure }} strokeWidth={1.75} />
              </div>
              <div>
                <div style={{ fontFamily: '"Playfair Display", serif', fontSize: '1.1rem', fontWeight: 700, color: C.azureDark, lineHeight: 1.2 }}>Mes cotisations</div>
                <div style={{ fontFamily: '"DM Sans"', fontSize: '12px', color: C.muted, marginTop: '2px' }}>Depuis septembre 2025</div>
              </div>
            </div>
            <button
              onClick={onClose}
              style={{ width: '32px', height: '32px', borderRadius: '50%', border: `1px solid ${C.border}`, background: C.offWhite, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.background = C.dangerBg; e.currentTarget.style.borderColor = `${C.danger}40`; }}
              onMouseLeave={e => { e.currentTarget.style.background = C.offWhite; e.currentTarget.style.borderColor = C.border; }}
            >
              <X size={15} style={{ color: C.muted }} />
            </button>
          </div>

          {/* KPI résumé */}
          <div style={{ display: 'flex', gap: '12px', padding: '16px 24px', borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
            <div style={{ flex: 1, background: C.successBg, borderRadius: '12px', padding: '12px 16px', border: `1px solid ${C.success}20` }}>
              <div style={{ fontFamily: '"Playfair Display", serif', fontSize: '1.6rem', fontWeight: 800, color: C.success, lineHeight: 1 }}>{nbPayes}</div>
              <div style={{ fontFamily: '"DM Sans"', fontSize: '11px', color: C.success, fontWeight: 600, marginTop: '3px', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Payé{nbPayes > 1 ? 's' : ''}</div>
            </div>
            <div style={{ flex: 1, background: nbImpayes > 0 ? C.dangerBg : C.offWhite, borderRadius: '12px', padding: '12px 16px', border: `1px solid ${nbImpayes > 0 ? `${C.danger}20` : C.border}` }}>
              <div style={{ fontFamily: '"Playfair Display", serif', fontSize: '1.6rem', fontWeight: 800, color: nbImpayes > 0 ? C.danger : C.muted, lineHeight: 1 }}>{nbImpayes}</div>
              <div style={{ fontFamily: '"DM Sans"', fontSize: '11px', color: nbImpayes > 0 ? C.danger : C.muted, fontWeight: 600, marginTop: '3px', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Impayé{nbImpayes > 1 ? 's' : ''}</div>
            </div>
            <div style={{ flex: 1, background: C.azureLight, borderRadius: '12px', padding: '12px 16px', border: `1px solid ${C.azure}20` }}>
              <div style={{ fontFamily: '"Playfair Display", serif', fontSize: '1.6rem', fontWeight: 800, color: C.azure, lineHeight: 1 }}>{tousLesMois.length}</div>
              <div style={{ fontFamily: '"DM Sans"', fontSize: '11px', color: C.azure, fontWeight: 600, marginTop: '3px', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Total</div>
            </div>
          </div>

          {/* Liste scrollable */}
          <div style={{ overflowY: 'auto', flex: 1, padding: '8px 0' }}>
            {tousLesMois.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 24px', fontFamily: '"DM Sans"', fontSize: '14px', color: C.mutedLight }}>
                Aucune période à afficher.
              </div>
            ) : (
              tousLesMois.map((mois, i) => {
                const paye = payesMap[mois] === true;
                return (
                  <div
                    key={mois}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '13px 24px',
                      background: i % 2 === 0 ? 'transparent' : C.offWhite,
                      borderBottom: i < tousLesMois.length - 1 ? `1px solid ${C.border}` : 'none',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0,
                        background: paye ? C.success : C.danger,
                        boxShadow: paye ? `0 0 0 3px ${C.success}22` : `0 0 0 3px ${C.danger}22`,
                      }} />
                      <span style={{ fontFamily: '"DM Sans"', fontSize: '14px', fontWeight: 500, color: C.azureDark }}>
                        {mois}
                      </span>
                    </div>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: '4px',
                      fontFamily: '"DM Sans"', fontSize: '11px', fontWeight: 700,
                      color: paye ? C.success : C.danger,
                      background: paye ? C.successBg : C.dangerBg,
                      border: `1px solid ${paye ? `${C.success}30` : `${C.danger}30`}`,
                      borderRadius: '100px', padding: '3px 10px',
                    }}>
                      {paye ? <><CheckCircle2 size={11} /> Payée</> : <><AlertCircle size={11} /> Impayée</>}
                    </span>
                  </div>
                );
              })
            )}
          </div>

          {/* Pied */}
          <div style={{ padding: '16px 24px', borderTop: `1px solid ${C.border}`, flexShrink: 0 }}>
            <button
              onClick={onClose}
              style={{ width: '100%', padding: '11px', borderRadius: '100px', background: C.offWhite, border: `1.5px solid ${C.border}`, fontFamily: '"DM Sans"', fontSize: '14px', fontWeight: 600, color: C.muted, cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.background = C.border; }}
              onMouseLeave={e => { e.currentTarget.style.background = C.offWhite; }}
            >
              Fermer
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─────────────────────────────────────────────────────────────
// Carte : Participer à une action
// ─────────────────────────────────────────────────────────────
function CarteActions() {
  const [hov, setHov] = useState(false);
  return (
    <motion.div variants={fadeUp}>
      <div
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          background: C.white, borderRadius: '18px',
          border: `1.5px solid ${hov ? `${C.cyanDark}50` : C.border}`,
          padding: '24px 22px',
          boxShadow: hov ? `0 14px 40px ${C.cyanDark}14` : '0 2px 12px rgba(0,0,0,0.04)',
          transform: hov ? 'translateY(-4px)' : 'translateY(0)',
          transition: 'all 0.35s cubic-bezier(0.34,1.56,0.64,1)',
          display: 'flex', flexDirection: 'column', gap: '16px',
        }}
      >
        <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: C.cyanLight, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: hov ? 'scale(1.1)' : 'scale(1)', transition: 'transform 0.3s' }}>
          <Zap size={19} style={{ color: C.cyanDark }} strokeWidth={1.75} />
        </div>
        <div>
          <div style={{ fontFamily: '"DM Sans"', fontSize: '14px', fontWeight: 700, color: C.azureDark, marginBottom: '4px' }}>Participer à une action</div>
          <div style={{ fontFamily: '"DM Sans"', fontSize: '12.5px', lineHeight: 1.6, color: C.muted }}>Découvrez les projets actifs et contribuez aux initiatives de terrain.</div>
        </div>
        <Link
          to="/actions"
          style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px 16px', borderRadius: '100px', background: `linear-gradient(135deg, ${C.cyanDark}, ${C.cyan})`, color: C.white, fontSize: '13px', fontWeight: 700, fontFamily: '"DM Sans"', textDecoration: 'none', boxShadow: `0 4px 14px ${C.cyan}40`, transition: 'all 0.2s ease' }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = `0 7px 20px ${C.cyan}55`; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = `0 4px 14px ${C.cyan}40`; }}
        >
          Voir les actions <ChevronRight size={13} />
        </Link>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
// Carte : Cotisations
// ─────────────────────────────────────────────────────────────
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
          onMouseEnter={() => setHov(true)}
          onMouseLeave={() => setHov(false)}
          style={{
            background: C.white, borderRadius: '18px',
            border: `1.5px solid ${hov ? `${C.azure}50` : C.border}`,
            padding: '24px 22px',
            boxShadow: hov ? `0 14px 40px ${C.azure}14` : '0 2px 12px rgba(0,0,0,0.04)',
            transform: hov ? 'translateY(-4px)' : 'translateY(0)',
            transition: 'all 0.35s cubic-bezier(0.34,1.56,0.64,1)',
            display: 'flex', flexDirection: 'column', gap: '16px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: C.azureLight, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: hov ? 'scale(1.1)' : 'scale(1)', transition: 'transform 0.3s' }}>
              <CreditCard size={19} style={{ color: C.azure }} strokeWidth={1.75} />
            </div>
            {loading ? (
              <div style={{ width: '72px', height: '24px', borderRadius: '100px', background: C.border, animation: 'pulse-soft 1.6s ease-in-out infinite' }} />
            ) : (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '4px',
                fontFamily: '"DM Sans"', fontSize: '11px', fontWeight: 700,
                color:      estAJour === true ? C.success : estAJour === false ? C.danger : C.muted,
                background: estAJour === true ? C.successBg : estAJour === false ? C.dangerBg : C.offWhite,
                border: `1px solid ${estAJour === true ? `${C.success}30` : estAJour === false ? `${C.danger}30` : C.border}`,
                borderRadius: '100px', padding: '3px 10px',
              }}>
                {estAJour === true
                  ? <><CheckCircle2 size={11} /> À jour</>
                  : estAJour === false
                    ? <><AlertCircle size={11} /> En attente</>
                    : <><Clock size={11} /> Chargement…</>
                }
              </span>
            )}
          </div>

          <div>
            <div style={{ fontFamily: '"DM Sans"', fontSize: '14px', fontWeight: 700, color: C.azureDark, marginBottom: '4px' }}>Mes cotisations</div>
            <div style={{ fontFamily: '"DM Sans"', fontSize: '12.5px', lineHeight: 1.6, color: C.muted }}>
              {loading
                ? 'Chargement de vos cotisations…'
                : estAJour === true
                  ? 'Votre cotisation du mois est à jour. Merci de votre engagement !'
                  : 'Consultez le détail de vos cotisations mois par mois.'
              }
            </div>
          </div>

          <button
            onClick={() => setModaleOpen(true)}
            disabled={loading}
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              padding: '10px 16px', borderRadius: '100px',
              background: loading ? C.border : `linear-gradient(135deg, ${C.azure}, ${C.cyanDark})`,
              color: loading ? C.mutedLight : C.white,
              border: 'none', fontSize: '13px', fontWeight: 700, fontFamily: '"DM Sans"',
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: loading ? 'none' : `0 4px 14px ${C.azure}40`,
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => { if (!loading) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = `0 7px 20px ${C.azure}55`; } }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; if (!loading) e.currentTarget.style.boxShadow = `0 4px 14px ${C.azure}40`; }}
          >
            {loading
              ? <><Loader2 size={13} style={{ animation: 'spin 0.8s linear infinite' }} /> Chargement…</>
              : <><CalendarDays size={13} /> Voir mes cotisations</>
            }
          </button>
        </div>
      </motion.div>

      {modaleOpen && (
        <ModaleCotisations
          cotisations={cotisations}
          onClose={() => setModaleOpen(false)}
        />
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// Carte : Faire un don
// ─────────────────────────────────────────────────────────────
function CarteDon() {
  const [hov, setHov] = useState(false);
  return (
    <motion.div variants={fadeUp}>
      <div
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          background: C.white, borderRadius: '18px',
          border: `1.5px solid ${hov ? '#e11d4850' : C.border}`,
          padding: '24px 22px',
          boxShadow: hov ? '0 14px 40px rgba(225,29,72,0.08)' : '0 2px 12px rgba(0,0,0,0.04)',
          transform: hov ? 'translateY(-4px)' : 'translateY(0)',
          transition: 'all 0.35s cubic-bezier(0.34,1.56,0.64,1)',
          display: 'flex', flexDirection: 'column', gap: '16px',
        }}
      >
        <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#fff1f2', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: hov ? 'scale(1.1)' : 'scale(1)', transition: 'transform 0.3s' }}>
          <Heart size={19} style={{ color: '#e11d48' }} strokeWidth={1.75} />
        </div>
        <div>
          <div style={{ fontFamily: '"DM Sans"', fontSize: '14px', fontWeight: 700, color: C.azureDark, marginBottom: '4px' }}>Faire un don</div>
          <div style={{ fontFamily: '"DM Sans"', fontSize: '12.5px', lineHeight: 1.6, color: C.muted }}>Soutenez nos programmes de terrain et aidez-nous à grandir.</div>
        </div>
        <Link
          to="/contact"
          style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px 16px', borderRadius: '100px', background: 'linear-gradient(135deg, #e11d48, #f43f5e)', color: C.white, fontSize: '13px', fontWeight: 700, fontFamily: '"DM Sans"', textDecoration: 'none', boxShadow: '0 4px 14px rgba(225,29,72,0.35)', transition: 'all 0.2s ease' }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 7px 20px rgba(225,29,72,0.5)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(225,29,72,0.35)'; }}
        >
          <Heart size={13} /> Faire un don
        </Link>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
// Avatar — photo de profil ou initiales
// ─────────────────────────────────────────────────────────────
function Avatar({ user, size = 58 }) {
  const [imgError, setImgError] = useState(false);
  const photoUrl = user?.photo_profil
    ? user.photo_profil.startsWith('http')
      ? user.photo_profil
      : `${API_BASE}${user.photo_profil}`
    : null;

  const displayName = user?.first_name || user?.username || 'M';
  const initials    = displayName.slice(0, 2).toUpperCase();

  if (photoUrl && !imgError) {
    return (
      <img
        src={photoUrl}
        alt={`Photo de ${displayName}`}
        onError={() => setImgError(true)}
        style={{ width: `${size}px`, height: `${size}px`, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.32)', flexShrink: 0 }}
      />
    );
  }

  return (
    <div style={{ width: `${size}px`, height: `${size}px`, borderRadius: '50%', flexShrink: 0, background: 'linear-gradient(135deg, rgba(255,255,255,0.28), rgba(255,255,255,0.1))', border: '2px solid rgba(255,255,255,0.32)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ fontFamily: '"Playfair Display", serif', fontSize: `${size * 0.37}px`, fontWeight: 700, color: C.white }}>
        {initials}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PAGE PRINCIPALE
// ─────────────────────────────────────────────────────────────
export default function DashboardMembre() {

  // ✅ [1] accessToken (plus 'token') + [2] logout destructurés depuis useAuth()
  const { isLoggedIn, isReady, user, accessToken, logout } = useAuth();
  const navigate = useNavigate();

  const displayName = user?.first_name || user?.username || 'Membre';

  // ── États ─────────────────────────────────────────────────────
  // ✅ [4] TOUS les hooks déclarés ICI, avant tout return conditionnel
  const [stats,        setStats]        = useState(null);
  const [cotisations,  setCotisations]  = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingCotis, setLoadingCotis] = useState(true);

  // ── Fetch /api/membres/me/dashboard/ ──────────────────────────
  // ✅ [4] useEffect déclaré avant les return conditionnels
  // ✅ [5] dépend de accessToken (plus 'token')
  useEffect(() => {

    // ✅ [6] Guard — aucun appel API sans token
    if (!accessToken) {
      console.warn('⚠️ [Dashboard] Aucun token JWT — appel API annulé.');
      setLoadingStats(false);
      setLoadingCotis(false);
      return;
    }

    api
      .get('membres/me/dashboard/')
      .then(({ data }) => {
        console.log('📊 [Dashboard] Données reçues :', data);

        setStats({
          nb_actions:        data.nb_actions        ?? null,
          nb_projets_actifs: data.nb_projets_actifs ?? null,
          taux_engagement:   data.taux_engagement   ?? null,
          total_dons:        data.total_dons        ?? null,
        });

        if (Array.isArray(data.cotisations)) {
          setCotisations(data.cotisations);
        } else {
          console.warn('⚠️ [Dashboard] data.cotisations absent ou non-tableau :', data);
          setCotisations([]);
        }
      })
      .catch(error => {
        const status = error.response?.status ?? 'pas de réponse';
        console.error(`❌ [Dashboard] Erreur ${status} — CORS ou token expiré ?`, error);
        setStats(null);
        setCotisations([]);
      })
      .finally(() => {
        setLoadingStats(false);
        setLoadingCotis(false);
      });

  }, [accessToken]); // ✅ [5] Se relance si le token change

  // ── Guards de rendu ───────────────────────────────────────────
  // ✅ [4] Placés APRÈS tous les hooks — ordre légal selon les règles React

  // 1. Contexte pas encore hydraté → spinner
  if (!isReady) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <Loader2 size={28} style={{ animation: 'spin 0.8s linear infinite', color: C.azure }} />
        <style>{`@keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }`}</style>
      </div>
    );
  }

  // 2. Non connecté → /login
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  // 3. Mauvais rôle → /dashboard (DashboardRouter redirigera correctement)
  if (user?.role !== 'MEMBRE') {
    return <Navigate to="/dashboard" replace />;
  }

  // ── Stats cards ───────────────────────────────────────────────
  const statsCards = [
    {
      icon:   Zap,
      label:  'Mes actions',
      value:  stats?.nb_actions != null ? String(stats.nb_actions) : '—',
      change: 'En cours',
      color:  C.cyanDark,
      bg:     C.cyanLight,
    },
    {
      icon:   CheckCircle2,
      label:  'Projets actifs',
      value:  stats?.nb_projets_actifs != null ? String(stats.nb_projets_actifs) : '—',
      change: 'Global asso',
      color:  C.success,
      bg:     C.successBg,
    },
    {
      icon:   TrendingUp,
      label:  'Engagement',
      value:  stats?.taux_engagement != null ? String(stats.taux_engagement) : '—',
      change: 'Cotisations',
      color:  C.warning,
      bg:     C.warningBg,
    },
    {
      icon:   Heart,
      label:  'Mes dons',
      value:  stats?.total_dons != null
                ? `${Number(stats.total_dons).toLocaleString('fr-FR')} FCFA`
                : '—',
      change: 'Total',
      color:  '#e11d48',
      bg:     '#fff1f2',
    },
  ];

  // ✅ [2] logout disponible car destructuré depuis useAuth()
  const handleLogout = () => { logout(); navigate('/', { replace: true }); };

  return (
    <>
      <style>{`
        @keyframes pulse-soft {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.45; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>

      <div style={{ fontFamily: '"DM Sans", sans-serif', background: C.offWhite, minHeight: '100vh', paddingTop: `${NAV_HEIGHT}px` }}>

        {/* ══ HEADER ══ */}
        <div style={{ background: `linear-gradient(135deg, ${C.azureDeep} 0%, ${C.azure} 58%, ${C.cyanDark} 100%)`, padding: '44px 24px 52px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-60px', right: '-60px', width: '240px', height: '240px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: '-40px', left: '35%', width: '180px', height: '180px', borderRadius: '50%', background: 'rgba(48,200,211,0.08)', pointerEvents: 'none' }} />

          <div style={{ maxWidth: '1280px', margin: '0 auto', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
            <motion.div
              initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              style={{ display: 'flex', alignItems: 'center', gap: '18px' }}
            >
              <Avatar user={user} size={58} />
              <div>
                <div style={{ fontFamily: '"DM Sans"', fontSize: '11px', color: 'rgba(255,255,255,0.6)', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '4px' }}>
                  Espace membre
                </div>
                <h1 style={{ fontFamily: '"Playfair Display", serif', fontSize: 'clamp(1.4rem, 3vw, 1.9rem)', fontWeight: 800, color: C.white, margin: 0, lineHeight: 1.15 }}>
                  Bonjour, <em style={{ fontStyle: 'italic', color: 'rgba(48,200,211,0.95)' }}>{displayName}</em> 👋
                </h1>
                <div style={{ fontFamily: '"DM Sans"', fontSize: '13px', color: 'rgba(255,255,255,0.58)', marginTop: '4px' }}>
                  Bienvenue dans votre tableau de bord ININ.
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}
            >
              <Link
                to="/dashboard/settings"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '9px 16px', borderRadius: '100px', background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.22)', color: C.white, fontSize: '13px', fontWeight: 600, fontFamily: '"DM Sans"', textDecoration: 'none', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.2)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; }}
              >
                <Settings size={14} /> Mon profil
              </Link>
              <button
                onClick={handleLogout}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '9px 16px', borderRadius: '100px', background: 'rgba(220,38,38,0.15)', border: '1px solid rgba(220,38,38,0.3)', color: '#fca5a5', fontSize: '13px', fontWeight: 600, fontFamily: '"DM Sans"', cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(220,38,38,0.28)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(220,38,38,0.15)'; }}
              >
                <LogOut size={14} /> Se déconnecter
              </button>
            </motion.div>
          </div>
        </div>

        {/* ══ CONTENU ══ */}
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '36px 24px 80px' }}>

          {/* ── Stats ── */}
          {/* ✅ key={loadingStats} force Framer à recréer le conteneur
               quand on passe du skeleton aux vraies cards,
               ce qui re-déclenche le stagger depuis "hidden" → "show" */}
          <motion.div
            key={loadingStats ? 'loading' : 'loaded'}
            variants={stagger(0.08)}
            initial="hidden"
            animate="show"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '18px', marginBottom: '44px' }}
          >
            {loadingStats
              ? [1, 2, 3, 4].map(i => <StatSkeleton key={i} />)
              : statsCards.map(({ icon: Icon, label, value, change, color, bg }) => (
                  <motion.div
                    key={label}
                    variants={fadeUp}
                    style={{ background: C.white, borderRadius: '18px', border: `1.5px solid ${C.border}`, padding: '22px 20px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '11px', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon size={18} style={{ color }} strokeWidth={1.75} />
                      </div>
                      <span style={{ fontFamily: '"DM Sans"', fontSize: '11px', fontWeight: 600, color, background: bg, borderRadius: '100px', padding: '3px 9px' }}>{change}</span>
                    </div>
                    <div style={{ fontFamily: '"Playfair Display", serif', fontSize: '1.85rem', fontWeight: 800, color: C.azureDark, lineHeight: 1, marginBottom: '5px' }}>
                      {value}
                    </div>
                    <div style={{ fontFamily: '"DM Sans"', fontSize: '11.5px', fontWeight: 500, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
                  </motion.div>
                ))
            }
          </motion.div>

          {/* ── Grid modules + activité ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '32px', alignItems: 'start' }}>

            {/* Mes espaces */}
            <div>
              <motion.div variants={fadeUp} initial="hidden" animate="show" style={{ marginBottom: '22px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '9px', marginBottom: '6px' }}>
                  <LayoutDashboard size={17} style={{ color: C.azure }} />
                  <h2 style={{ fontFamily: '"Playfair Display", serif', fontSize: '1.15rem', fontWeight: 700, color: C.azureDark, margin: 0 }}>Mes espaces</h2>
                </div>
                <p style={{ fontFamily: '"DM Sans"', fontSize: '13.5px', color: C.muted, margin: 0, lineHeight: 1.6 }}>
                  Accédez rapidement à vos fonctionnalités membres.
                </p>
              </motion.div>

              <motion.div variants={stagger(0.07)} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <CarteActions />
                <CarteCotisations cotisations={cotisations} loading={loadingCotis} />
                <CarteDon />
              </motion.div>
            </div>

            {/* Activité récente */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="show"
              style={{ background: C.white, borderRadius: '20px', border: `1.5px solid ${C.border}`, padding: '26px 22px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '9px', marginBottom: '22px' }}>
                <Bell size={16} style={{ color: C.azure }} />
                <h2 style={{ fontFamily: '"Playfair Display", serif', fontSize: '1.1rem', fontWeight: 700, color: C.azureDark, margin: 0 }}>Activité récente</h2>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {ACTIVITES.map(({ icon: Icon, text, time, color }, i) => (
                  <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', paddingBottom: i < ACTIVITES.length - 1 ? '18px' : 0, position: 'relative' }}>
                    {i < ACTIVITES.length - 1 && (
                      <div style={{ position: 'absolute', left: '13px', top: '26px', bottom: 0, width: '1.5px', background: C.border }} />
                    )}
                    <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: `${color}18`, border: `1.5px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, zIndex: 1 }}>
                      <Icon size={12} style={{ color }} />
                    </div>
                    <div style={{ flex: 1, paddingTop: '2px' }}>
                      <div style={{ fontFamily: '"DM Sans"', fontSize: '13px', color: C.azureDark, lineHeight: 1.55, marginBottom: '3px' }}>{text}</div>
                      <div style={{ fontFamily: '"DM Sans"', fontSize: '11px', color: C.mutedLight }}>{time}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: `1px solid ${C.border}` }}>
                <button style={{ fontFamily: '"DM Sans"', fontSize: '13px', fontWeight: 600, color: C.azure, background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  Voir toutes les notifications <ChevronRight size={13} />
                </button>
              </div>
            </motion.div>

          </div>
        </div>
      </div>
    </>
  );
}