/**
 * src/pages/Actions.jsx
 * ─────────────────────────────────────────────────────────────
 * Page "Nos Actions" — Association ININ
 *
 * v4 — Design complet restauré + responsive mobile amélioré :
 *  ✅ Layout horizontal (image gauche / contenu droite) sur desktop
 *  ✅ Sur mobile : image en fond à 40% opacité, contenu par-dessus
 *  ✅ Titre, description, badges, métadonnées, jauge budget
 *  ✅ participants_count (dynamique) + is_inscrit (depuis API)
 *  ✅ Bouton "Inscrit·e" si déjà inscrit au chargement
 *  ✅ is_full → bouton désactivé si complet
 * ─────────────────────────────────────────────────────────────
 */

import { useRef, useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import api from '../api/api';
import {
  Calendar, MapPin, Users, ArrowRight,
  Heart, RefreshCw, Search, SlidersHorizontal,
  ChevronDown, Loader2, Inbox, CheckCircle2,
  Lock, Zap, Tag,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// ── Palette ININ ──────────────────────────────────────────────
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
};

const NAV_HEIGHT = 85;

// ── Variants Framer Motion ────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] } },
};
const stagger = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.1 } },
};

// ── Constante API ─────────────────────────────────────────────
const API_ACTIONS_URL = `${import.meta.env.VITE_API_URL}/api/actions/`;

// ── Config types ──────────────────────────────────────────────
const TYPE_CONFIG = {
  SENSIBILISATION: { label: 'Sensibilisation', color: C.azure,    bg: C.azureLight, dot: '#5a9bff'  },
  EDUCATION:       { label: 'Éducation',        color: '#0e7490', bg: C.cyanLight,  dot: '#22d3ee'  },
  ACCOMPAGNEMENT:  { label: 'Accompagnement',   color: '#15803d', bg: '#f0fdf4',    dot: '#4ade80'  },
  SOLIDARITE:      { label: 'Solidarité',       color: '#b45309', bg: '#fffbeb',    dot: '#fbbf24'  },
  FORMATION:       { label: 'Formation',        color: '#7e22ce', bg: '#faf5ff',    dot: '#a78bfa'  },
  AUTRE:           { label: 'Autre',            color: '#4b5563', bg: '#f9fafb',    dot: '#9ca3af'  },
};

const STATUT_CONFIG = {
  EN_COURS:  { label: 'En cours',  color: C.success,  bg: C.successBg  },
  PLANIFIEE: { label: 'Planifiée', color: C.azure,    bg: C.azureLight },
  CLOTUREE:  { label: 'Clôturée', color: '#6b7280',  bg: '#f3f4f6'    },
  ANNULEE:   { label: 'Annulée',  color: '#dc2626',  bg: '#fef2f2'    },
};

const FILTRES_TYPE = [
  { key: '',                label: 'Tous les types'  },
  { key: 'SENSIBILISATION', label: 'Sensibilisation' },
  { key: 'EDUCATION',       label: 'Éducation'       },
  { key: 'ACCOMPAGNEMENT',  label: 'Accompagnement'  },
  { key: 'SOLIDARITE',      label: 'Solidarité'      },
  { key: 'FORMATION',       label: 'Formation'       },
];

const TYPE_IMAGES = {
  SENSIBILISATION: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600&q=80&auto=format&fit=crop',
  EDUCATION:       'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600&q=80&auto=format&fit=crop',
  ACCOMPAGNEMENT:  'https://images.unsplash.com/photo-1573497620053-ea5300f94f21?w=600&q=80&auto=format&fit=crop',
  SOLIDARITE:      'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=600&q=80&auto=format&fit=crop',
  FORMATION:       'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=600&q=80&auto=format&fit=crop',
  AUTRE:           'https://images.unsplash.com/photo-1509099836639-18ba1795216d?w=600&q=80&auto=format&fit=crop',
};

// ── Utilitaires ───────────────────────────────────────────────
const formatDate = (str) =>
  str
    ? new Date(str).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    : '—';

const formatMontant = (val) =>
  val != null
    ? new Intl.NumberFormat('fr-FR', { style: 'decimal', maximumFractionDigits: 0 }).format(val) + ' FCFA'
    : '—';

const calcPct = (prevu, restant) => {
  const p = parseFloat(prevu);
  const r = parseFloat(restant) ?? p;
  if (!p) return 0;
  return Math.min(100, Math.max(0, Math.round(((p - r) / p) * 100)));
};

const truncate = (str, n = 120) =>
  str && str.length > n ? str.slice(0, n).trimEnd() + '…' : str;

// ── Hook responsive ───────────────────────────────────────────
function useIsMobile(breakpoint = 680) {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < breakpoint);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, [breakpoint]);
  return isMobile;
}

// ──────────────────────────────────────────────────────────────
// HERO
// ──────────────────────────────────────────────────────────────
function PageHero({ total, loading }) {
  return (
    <section style={{
      paddingTop:    `${NAV_HEIGHT + 72}px`,
      paddingBottom: '88px',
      paddingLeft:   '24px',
      paddingRight:  '24px',
      background:    `linear-gradient(135deg, ${C.azureDeep} 0%, ${C.azure} 58%, ${C.cyanDark} 100%)`,
      position:      'relative',
      overflow:      'hidden',
    }}>
      {/* Orbes déco */}
      <div style={{ position:'absolute', top:'-80px', right:'-80px', width:'360px', height:'360px', borderRadius:'50%', background:'rgba(255,255,255,0.04)', pointerEvents:'none' }} />
      <div style={{ position:'absolute', bottom:'-60px', left:'-60px', width:'280px', height:'280px', borderRadius:'50%', background:'rgba(48,200,211,0.10)', pointerEvents:'none' }} />

      <div style={{ maxWidth:'1280px', margin:'0 auto', position:'relative' }}>
        <div style={{ maxWidth:'680px', margin:'0 auto', textAlign:'center' }}>

          <motion.div initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'10px', marginBottom:'14px' }}>
              <span style={{ display:'block', width:'28px', height:'2px', borderRadius:'2px', background:C.cyan }} />
              <span style={{ fontFamily:'"DM Sans", sans-serif', fontSize:'11px', fontWeight:700, letterSpacing:'0.2em', textTransform:'uppercase', color:C.cyan }}>
                Sur le terrain
              </span>
              <span style={{ display:'block', width:'28px', height:'2px', borderRadius:'2px', background:C.cyan }} />
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity:0, y:22 }} animate={{ opacity:1, y:0 }}
            transition={{ duration:0.65, delay:0.12, ease:[0.22,1,0.36,1] }}
            style={{ fontFamily:'"Playfair Display", Georgia, serif', fontSize:'clamp(2.4rem, 5vw, 3.8rem)', fontWeight:800, lineHeight:1.1, color:C.white, margin:'0 0 20px', letterSpacing:'-0.01em' }}
          >
            Nos <em style={{ fontStyle:'italic', color:C.cyan }}>Actions</em> sur le terrain
          </motion.h1>

          <motion.p
            initial={{ opacity:0, y:18 }} animate={{ opacity:1, y:0 }}
            transition={{ duration:0.65, delay:0.24, ease:[0.22,1,0.36,1] }}
            style={{ fontFamily:'"DM Sans", sans-serif', fontSize:'17px', lineHeight:1.78, color:'rgba(255,255,255,0.72)', margin:'0 auto 36px', maxWidth:'540px' }}
          >
            De la sensibilisation à l'accompagnement, découvrez toutes les initiatives
            menées par l'association ININ pour la jeunesse africaine.
          </motion.p>

          {!loading && (
            <motion.div
              initial={{ opacity:0, scale:0.9 }} animate={{ opacity:1, scale:1 }}
              transition={{ delay:0.4, duration:0.4 }}
              style={{ display:'inline-flex', alignItems:'center', gap:'8px', padding:'10px 22px', borderRadius:'100px', background:'rgba(255,255,255,0.12)', border:'1px solid rgba(255,255,255,0.22)', backdropFilter:'blur(8px)' }}
            >
              <Zap size={14} style={{ color:C.cyan }} />
              <span style={{ fontFamily:'"DM Sans", sans-serif', fontSize:'13px', color:C.white, fontWeight:500 }}>
                <strong>{total}</strong> action{total > 1 ? 's' : ''} disponible{total > 1 ? 's' : ''}
              </span>
            </motion.div>
          )}

          <motion.div
            initial={{ scaleX:0 }} animate={{ scaleX:1 }}
            transition={{ duration:0.8, delay:0.5, ease:[0.22,1,0.36,1] }}
            style={{ width:'80px', height:'4px', borderRadius:'4px', background:`linear-gradient(90deg, ${C.cyan}, rgba(255,255,255,0.4))`, margin:'32px auto 0' }}
          />
        </div>
      </div>
    </section>
  );
}

// ──────────────────────────────────────────────────────────────
// FILTRES
// ──────────────────────────────────────────────────────────────
function FiltersBar({ recherche, setRecherche, filtreType, setFiltreType }) {
  const [drop, setDrop] = useState(false);
  const typeLabel = FILTRES_TYPE.find((f) => f.key === filtreType)?.label ?? 'Tous les types';

  return (
    <div style={{ maxWidth:'1200px', margin:'-24px auto 0', padding:'0 24px', position:'relative', zIndex:20 }}>
      <motion.div
        initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
        transition={{ delay:0.3, duration:0.5 }}
        style={{ background:C.white, borderRadius:'18px', border:`1.5px solid ${C.border}`, boxShadow:'0 8px 32px rgba(0,0,0,0.08)', padding:'16px 20px', display:'flex', gap:'12px', flexWrap:'wrap', alignItems:'center' }}
      >
        {/* Recherche */}
        <div style={{ flex:1, minWidth:'220px', position:'relative' }}>
          <Search size={15} style={{ position:'absolute', left:'14px', top:'50%', transform:'translateY(-50%)', color:C.mutedLight, pointerEvents:'none' }} />
          <input
            type="text"
            placeholder="Rechercher une action, un lieu…"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            style={{ width:'100%', padding:'10px 14px 10px 38px', border:`1.5px solid ${C.border}`, borderRadius:'10px', fontSize:'13.5px', fontFamily:'"DM Sans", sans-serif', color:C.azureDark, background:C.offWhite, outline:'none', boxSizing:'border-box' }}
            onFocus={(e) => { e.target.style.borderColor=C.azure; e.target.style.boxShadow=`0 0 0 3px ${C.azure}18`; }}
            onBlur={(e)  => { e.target.style.borderColor=C.border; e.target.style.boxShadow='none'; }}
          />
        </div>

        {/* Dropdown type */}
        <div style={{ position:'relative' }}>
          <button
            type="button"
            onClick={() => setDrop(!drop)}
            style={{ display:'flex', alignItems:'center', gap:'8px', padding:'10px 16px', borderRadius:'10px', border:`1.5px solid ${filtreType ? C.azure : C.border}`, background:filtreType ? C.azureLight : C.offWhite, color:filtreType ? C.azure : C.muted, fontSize:'13.5px', fontWeight:filtreType ? 600 : 500, cursor:'pointer', fontFamily:'"DM Sans", sans-serif', whiteSpace:'nowrap' }}
          >
            <SlidersHorizontal size={14} />
            {typeLabel}
            <ChevronDown size={13} style={{ transform:drop ? 'rotate(180deg)' : 'none', transition:'transform 0.2s' }} />
          </button>

          <AnimatePresence>
            {drop && (
              <motion.div
                initial={{ opacity:0, y:-8, scale:0.96 }}
                animate={{ opacity:1, y:0, scale:1 }}
                exit={{ opacity:0, y:-8, scale:0.96 }}
                transition={{ duration:0.18 }}
                style={{ position:'absolute', top:'calc(100% + 8px)', left:0, background:C.white, border:`1.5px solid ${C.border}`, borderRadius:'14px', overflow:'hidden', boxShadow:'0 12px 36px rgba(0,0,0,0.1)', zIndex:50, minWidth:'200px' }}
              >
                {FILTRES_TYPE.map(({ key, label }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => { setFiltreType(key); setDrop(false); }}
                    style={{ display:'flex', alignItems:'center', gap:'10px', padding:'10px 16px', fontSize:'13px', fontFamily:'"DM Sans", sans-serif', color:filtreType === key ? C.azure : C.azureDark, background:filtreType === key ? C.azureLight : 'transparent', fontWeight:filtreType === key ? 700 : 400, cursor:'pointer', border:'none', width:'100%', textAlign:'left' }}
                  >
                    {filtreType === key && <span style={{ width:'6px', height:'6px', borderRadius:'50%', background:C.azure, flexShrink:0 }} />}
                    {label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Reset */}
        {(filtreType || recherche) && (
          <button
            type="button"
            onClick={() => { setFiltreType(''); setRecherche(''); }}
            style={{ display:'flex', alignItems:'center', gap:'5px', padding:'10px 14px', borderRadius:'10px', border:'none', background:'transparent', color:C.muted, fontSize:'13px', cursor:'pointer', fontFamily:'"DM Sans", sans-serif' }}
            onMouseEnter={(e) => e.currentTarget.style.color='#ef4444'}
            onMouseLeave={(e) => e.currentTarget.style.color=C.muted}
          >
            <RefreshCw size={13} /> Réinitialiser
          </button>
        )}

        {drop && <div style={{ position:'fixed', inset:0, zIndex:19 }} onClick={() => setDrop(false)} />}
      </motion.div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// MÉTADONNÉE INLINE
// ──────────────────────────────────────────────────────────────
function MetaTag({ icon, text, color = C.muted, bold = false }) {
  if (!text) return null;
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:'5px', fontSize:'12.5px', color, fontWeight: bold ? 600 : 400 }}>
      <span style={{ opacity:0.65, flexShrink:0, display:'flex' }}>{icon}</span>
      <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{text}</span>
    </span>
  );
}

// ──────────────────────────────────────────────────────────────
// ACTION CARD — Design complet restauré + responsive mobile
// ──────────────────────────────────────────────────────────────
function ActionCard({ action, index, onInscription }) {
  const { user }   = useAuth();
  const isMobile   = useIsMobile();

  // ✅ Initialisé depuis API (is_inscrit retourné par le serializer)
  const [inscrit,  setInscrit]  = useState(action.is_inscrit ?? false);
  const [hov,      setHov]      = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [feedback, setFeedback] = useState(null); // 'success' | 'error' | 'auth_error'
  const [errMsg,   setErrMsg]   = useState('');

  const ref    = useRef(null);
  const inView = useInView(ref, { once:true, amount:0.12 });

  const typeConfig   = TYPE_CONFIG[action.type]     ?? TYPE_CONFIG.AUTRE;
  const statutConfig = STATUT_CONFIG[action.statut] ?? STATUT_CONFIG.PLANIFIEE;
  const pct          = calcPct(action.budget_prevu, action.budget_restant);
  const imgSrc       = TYPE_IMAGES[action.type]     ?? TYPE_IMAGES.AUTRE;
  const estOuverte   = ['EN_COURS', 'PLANIFIEE'].includes(action.statut);

  // Participants : préfère participants_count (dynamique), fallback sur nb_participants
  const nbInscrits = action.participants_count ?? action.nb_participants ?? 0;

  // ── Inscription ───────────────────────────────────────────
  const handleInscription = async (e) => {
    e?.preventDefault();
    if (!user || loading || inscrit || action.is_full) return;

    const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
    if (!token) {
      setFeedback('auth_error');
      setErrMsg('Session expirée. Veuillez vous reconnecter.');
      return;
    }

    setLoading(true);
    setFeedback(null);
    setErrMsg('');

    try {
      await api.post(`actions/${action.id}/inscrire/`, {});
      setInscrit(true);
      setFeedback('success');
      onInscription?.();
    } catch (err) {
      const httpStatus = err.response?.status;
      const msgDjango  = err.response?.data?.error || err.response?.data?.detail || null;

      if      (httpStatus === 401) { setFeedback('auth_error'); setErrMsg('Session expirée. Veuillez vous reconnecter.'); }
      else if (httpStatus === 400) { setFeedback('error');      setErrMsg(msgDjango || 'Inscription impossible.'); }
      else if (httpStatus === 403) { setFeedback('error');      setErrMsg(msgDjango || 'Accès refusé.'); }
      else if (httpStatus === 404) { setFeedback('error');      setErrMsg("Cette action n'existe plus."); }
      else                         { setFeedback('error');      setErrMsg(msgDjango || 'Une erreur est survenue.'); }
    } finally {
      setLoading(false);
      setTimeout(() => { setFeedback(null); setErrMsg(''); }, 4500);
    }
  };

  // ── RENDU MOBILE — image en fond à 40% ───────────────────
  if (isMobile) {
    return (
      <motion.article
        ref={ref}
        variants={fadeUp}
        initial="hidden"
        animate={inView ? 'show' : 'hidden'}
        transition={{ delay: index * 0.07 }}
        style={{
          borderRadius:  '20px',
          overflow:      'hidden',
          position:      'relative',
          minHeight:     '280px',
          border:        `1.5px solid ${C.border}`,
          boxShadow:     '0 4px 20px rgba(0,0,0,0.08)',
          fontFamily:    '"DM Sans", sans-serif',
          background:    C.white,
        }}
      >
        {/* Image fond 40% */}
        <div style={{ position:'absolute', inset:0, zIndex:0 }}>
          <img
            src={imgSrc}
            alt={action.titre}
            style={{ width:'100%', height:'100%', objectFit:'cover', opacity:0.4 }}
          />
          {/* Overlay dégradé pour lisibilité */}
          <div style={{ position:'absolute', inset:0, background:`linear-gradient(to bottom, rgba(248,250,252,0.3) 0%, rgba(248,250,252,0.92) 45%, ${C.white} 100%)` }} />
        </div>

        {/* Contenu par-dessus */}
        <div style={{ position:'relative', zIndex:1, padding:'20px 18px' }}>

          {/* Badges en haut */}
          <div style={{ display:'flex', gap:'7px', flexWrap:'wrap', marginBottom:'12px' }}>
            <span style={{ display:'inline-flex', alignItems:'center', gap:'5px', padding:'4px 10px', borderRadius:'100px', background:typeConfig.color + 'dd', backdropFilter:'blur(4px)' }}>
              <span style={{ width:'6px', height:'6px', borderRadius:'50%', background:'rgba(255,255,255,0.9)', flexShrink:0 }} />
              <span style={{ fontSize:'10px', fontWeight:700, color:C.white, letterSpacing:'0.06em', textTransform:'uppercase' }}>{typeConfig.label}</span>
            </span>
            <span style={{ display:'inline-flex', alignItems:'center', padding:'4px 10px', borderRadius:'100px', background:statutConfig.color + 'dd', backdropFilter:'blur(4px)' }}>
              {action.statut === 'EN_COURS' && (
                <span style={{ width:'6px', height:'6px', borderRadius:'50%', background:'rgba(255,255,255,0.9)', marginRight:'5px', animation:'pulse 2s infinite', flexShrink:0 }} />
              )}
              <span style={{ fontSize:'10px', fontWeight:700, color:C.white }}>{statutConfig.label}</span>
            </span>
          </div>

          {/* Titre */}
          <h3 style={{ fontFamily:'"Playfair Display", Georgia, serif', fontSize:'1.2rem', fontWeight:700, lineHeight:1.25, color:C.azureDark, margin:'0 0 10px' }}>
            {action.titre}
          </h3>

          {/* Description */}
          {action.description && (
            <p style={{ fontSize:'13px', lineHeight:1.65, color:C.muted, margin:'0 0 12px' }}>
              {truncate(action.description, 100)}
            </p>
          )}

          {/* Métadonnées */}
          <div style={{ display:'flex', flexDirection:'column', gap:'6px', marginBottom:'14px' }}>
            <MetaTag icon={<Calendar size={13} />} text={formatDate(action.date_debut)} />
            <MetaTag icon={<MapPin    size={13} />} text={action.lieu} />
            <MetaTag icon={<Users     size={13} />} text={`${nbInscrits} participant·e·s${action.nb_participants_max ? ` / ${action.nb_participants_max} places` : ''}`} color={action.is_full ? '#dc2626' : typeConfig.color} bold />
          </div>

          {/* Jauge budget */}
          {parseFloat(action.budget_prevu) > 0 && (
            <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'14px' }}>
              <div style={{ flex:1, height:'4px', background:C.border, borderRadius:'10px', overflow:'hidden' }}>
                <div style={{ height:'100%', width:`${pct}%`, background:`linear-gradient(90deg, ${typeConfig.color}, ${C.cyanDark})`, borderRadius:'10px' }} />
              </div>
              <span style={{ fontSize:'10px', fontWeight:700, color:typeConfig.color, whiteSpace:'nowrap', flexShrink:0 }}>{pct}%</span>
            </div>
          )}

          {/* Zone bouton */}
          <div style={{ display:'flex', alignItems:'center', gap:'8px', flexWrap:'wrap' }}>
            <AnimatePresence>
              {feedback === 'success' && (
                <motion.span initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                  style={{ display:'flex', alignItems:'center', gap:'5px', fontSize:'12px', fontWeight:600, color:C.success }}>
                  <CheckCircle2 size={13} /> Inscription confirmée !
                </motion.span>
              )}
              {(feedback === 'error' || feedback === 'auth_error') && (
                <motion.span initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                  style={{ fontSize:'12px', fontWeight:600, color:'#dc2626' }}>
                  {errMsg}
                </motion.span>
              )}
            </AnimatePresence>

            {BoutonInscription({ user, estOuverte, inscrit, loading, action, hov: false, typeConfig, handleInscription, isMobile: true })}
          </div>
        </div>
      </motion.article>
    );
  }

  // ── RENDU DESKTOP — layout horizontal ────────────────────
  return (
    <motion.article
      ref={ref}
      variants={fadeUp}
      initial="hidden"
      animate={inView ? 'show' : 'hidden'}
      transition={{ delay: index * 0.07 }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background:    C.white,
        borderRadius:  '22px',
        border:        `1.5px solid ${hov ? typeConfig.color + '45' : C.border}`,
        overflow:      'hidden',
        display:       'flex',
        flexDirection: 'row',
        boxShadow:     hov ? `0 20px 56px ${typeConfig.color}16, 0 4px 16px rgba(0,0,0,0.06)` : '0 2px 16px rgba(0,0,0,0.05)',
        transform:     hov ? 'translateY(-4px)' : 'translateY(0)',
        transition:    'all 0.38s cubic-bezier(0.34,1.56,0.64,1)',
        fontFamily:    '"DM Sans", sans-serif',
        minHeight:     '230px',
      }}
    >
      {/* ── IMAGE (gauche) ── */}
      <div style={{ width:'260px', flexShrink:0, position:'relative', overflow:'hidden' }}>
        <img
          src={imgSrc}
          alt={action.titre}
          style={{ width:'100%', height:'100%', objectFit:'cover', display:'block', transition:'transform 0.5s ease', transform: hov ? 'scale(1.07)' : 'scale(1)' }}
        />
        {/* Overlay latéral */}
        <div style={{ position:'absolute', inset:0, background:`linear-gradient(to right, transparent 55%, ${C.white}15)` }} />

        {/* Badge type */}
        <div style={{ position:'absolute', top:'14px', left:'14px', display:'flex', alignItems:'center', gap:'5px', padding:'5px 11px', borderRadius:'100px', background:'rgba(0,0,0,0.52)', backdropFilter:'blur(6px)' }}>
          <span style={{ width:'7px', height:'7px', borderRadius:'50%', background:typeConfig.dot, flexShrink:0 }} />
          <span style={{ fontFamily:'"DM Sans", sans-serif', fontSize:'10px', fontWeight:700, color:C.white, letterSpacing:'0.06em', textTransform:'uppercase' }}>
            {typeConfig.label}
          </span>
        </div>

        {/* Badge statut */}
        <div style={{ position:'absolute', bottom:'14px', left:'14px', padding:'4px 10px', borderRadius:'100px', background:statutConfig.color + 'ee', backdropFilter:'blur(6px)' }}>
          <span style={{ fontFamily:'"DM Sans", sans-serif', fontSize:'10px', fontWeight:700, color:C.white, display:'flex', alignItems:'center', gap:'4px' }}>
            {action.statut === 'EN_COURS' && (
              <span style={{ width:'6px', height:'6px', borderRadius:'50%', background:C.white, animation:'pulse 2s infinite', flexShrink:0 }} />
            )}
            {statutConfig.label}
          </span>
        </div>

        {/* Badge "Complet" si is_full */}
        {action.is_full && (
          <div style={{ position:'absolute', top:'14px', right:'14px', padding:'4px 10px', borderRadius:'100px', background:'#dc2626ee', backdropFilter:'blur(6px)' }}>
            <span style={{ fontSize:'10px', fontWeight:700, color:C.white }}>Complet</span>
          </div>
        )}
      </div>

      {/* ── CONTENU (droite) ── */}
      <div style={{ flex:1, padding:'26px 32px', display:'flex', flexDirection:'column', gap:'12px', overflow:'hidden', minWidth:0 }}>

        {/* ── Titre ── */}
        <h3 style={{ fontFamily:'"Playfair Display", Georgia, serif', fontSize:'1.25rem', fontWeight:700, lineHeight:1.28, color:C.azureDark, margin:0 }}>
          {action.titre}
        </h3>

        {/* ── Description ── */}
        {action.description && (
          <p style={{ fontFamily:'"DM Sans", sans-serif', fontSize:'13.5px', lineHeight:1.7, color:C.muted, margin:0, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>
            {action.description}
          </p>
        )}

        {/* ── Métadonnées ── */}
        <div style={{ display:'flex', flexWrap:'wrap', gap:'16px', alignItems:'center' }}>
          <MetaTag icon={<Calendar size={13} />} text={formatDate(action.date_debut)} />
          <MetaTag icon={<MapPin    size={13} />} text={action.lieu} />
          {action.responsable_nom && (
            <MetaTag icon={<Users size={13} />} text={action.responsable_nom} />
          )}
          {/* ✅ participants_count dynamique */}
          <MetaTag
            icon={<Users size={13} />}
            text={
              action.nb_participants_max
                ? `${nbInscrits} / ${action.nb_participants_max} places`
                : `${nbInscrits} participant·e·s`
            }
            color={action.is_full ? '#dc2626' : typeConfig.color}
            bold
          />
          <MetaTag icon={<Tag size={13} />} text={typeConfig.label} color={typeConfig.color} />
        </div>

        {/* ── Jauge budget ── */}
        {parseFloat(action.budget_prevu) > 0 && (
          <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
            <div style={{ flex:1, height:'5px', background:C.border, borderRadius:'10px', overflow:'hidden' }}>
              <div style={{ height:'100%', width:`${pct}%`, background:`linear-gradient(90deg, ${typeConfig.color}, ${C.cyanDark})`, borderRadius:'10px', transition:'width 1s ease' }} />
            </div>
            <span style={{ fontSize:'11px', fontWeight:700, color:typeConfig.color, whiteSpace:'nowrap', flexShrink:0 }}>
              {pct}% consommé
            </span>
          </div>
        )}

        {/* ── Footer ── */}
        <div style={{ marginTop:'auto', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'10px' }}>

          {/* Budget restant */}
          {parseFloat(action.budget_prevu) > 0 && (
            <span style={{ fontSize:'12px', color:C.mutedLight }}>
              Budget restant : <strong style={{ color:C.azureDark }}>{formatMontant(action.budget_restant)}</strong>
            </span>
          )}

          {/* Zone bouton (droite) */}
          <div style={{ display:'flex', alignItems:'center', gap:'10px', marginLeft:'auto', flexWrap:'wrap' }}>

            {/* Feedback */}
            <AnimatePresence>
              {feedback === 'success' && (
                <motion.span initial={{ opacity:0, x:8 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0 }}
                  style={{ display:'flex', alignItems:'center', gap:'5px', fontSize:'12px', fontWeight:600, color:C.success }}>
                  <CheckCircle2 size={13} /> Inscription confirmée !
                </motion.span>
              )}
              {(feedback === 'error' || feedback === 'auth_error') && (
                <motion.span initial={{ opacity:0, x:8 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0 }}
                  style={{ fontSize:'12px', fontWeight:600, color:'#dc2626', maxWidth:'220px', lineHeight:1.4 }}>
                  {errMsg}
                </motion.span>
              )}
            </AnimatePresence>

            {BoutonInscription({ user, estOuverte, inscrit, loading, action, hov, typeConfig, handleInscription, isMobile: false })}
          </div>
        </div>
      </div>
    </motion.article>
  );
}

// ── Bouton d'inscription — partagé desktop/mobile ─────────────
function BoutonInscription({ user, estOuverte, inscrit, loading, action, hov, typeConfig, handleInscription, isMobile }) {
  const C_local = C; // accès à la palette

  // ✅ Déjà inscrit (state local OU api)
  if (user && inscrit) {
    return (
      <span style={{ display:'inline-flex', alignItems:'center', gap:'6px', padding:'10px 20px', borderRadius:'100px', background:C_local.successBg, color:C_local.success, border:`1.5px solid ${C_local.success}30`, fontSize:'13px', fontWeight:700 }}>
        <CheckCircle2 size={13} /> Inscrit·e
      </span>
    );
  }

  // ✅ Connecté + action ouverte + pas inscrit
  if (user && estOuverte && !inscrit) {
    const isFull = action.is_full;
    return (
      <button
        type="button"
        onClick={isFull ? undefined : handleInscription}
        disabled={loading || isFull}
        style={{
          display:    'inline-flex', alignItems:'center', gap:'6px',
          padding:    '10px 20px', borderRadius:'100px',
          background: isFull
            ? C_local.border
            : (hov && !isMobile)
              ? `linear-gradient(135deg, ${typeConfig.color}, ${C_local.cyanDark})`
              : C_local.azureLight,
          color:      isFull ? C_local.mutedLight : (hov && !isMobile) ? C_local.white : typeConfig.color,
          border:     `1.5px solid ${isFull ? C_local.border : typeConfig.color + '30'}`,
          fontSize:   '13px', fontWeight:700,
          cursor:     isFull ? 'not-allowed' : loading ? 'wait' : 'pointer',
          fontFamily: '"DM Sans", sans-serif',
          boxShadow:  (hov && !isMobile && !isFull) ? `0 6px 20px ${typeConfig.color}35` : 'none',
          transition: 'all 0.28s cubic-bezier(0.34,1.56,0.64,1)',
          opacity:    loading ? 0.7 : 1,
        }}
      >
        {isFull
          ? '🔒 Complet'
          : loading
            ? <><Loader2 size={13} style={{ animation:'spin 1s linear infinite' }} /> En cours…</>
            : <><CheckCircle2 size={13} /> S'inscrire</>
        }
      </button>
    );
  }

  // ✅ Non connecté
  if (!user && estOuverte) {
    return (
      <Link
        to="/login"
        state={{ from: '/actions' }}
        style={{ display:'inline-flex', alignItems:'center', gap:'6px', padding:'10px 20px', borderRadius:'100px', background:'transparent', color:C_local.muted, border:`1.5px solid ${C_local.border}`, fontSize:'13px', fontWeight:600, fontFamily:'"DM Sans", sans-serif', textDecoration:'none', transition:'all 0.2s ease' }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor=C_local.azure; e.currentTarget.style.color=C_local.azure; e.currentTarget.style.background=C_local.azureLight; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor=C_local.border; e.currentTarget.style.color=C_local.muted; e.currentTarget.style.background='transparent'; }}
      >
        <Lock size={12} /> Se connecter pour participer
      </Link>
    );
  }

  // Action fermée
  if (!estOuverte) {
    return (
      <span style={{ fontSize:'12px', fontWeight:600, color:C_local.mutedLight, fontStyle:'italic' }}>
        Inscriptions fermées
      </span>
    );
  }

  return null;
}

// ──────────────────────────────────────────────────────────────
// SKELETON
// ──────────────────────────────────────────────────────────────
function SkeletonCard() {
  const shimmer = {
    background: '#e9ecef',
    backgroundImage: 'linear-gradient(90deg, #f3f4f6 25%, #e9ecef 50%, #f3f4f6 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.4s infinite',
    borderRadius: '6px',
  };
  return (
    <div style={{ background:C.white, borderRadius:'22px', border:`1.5px solid ${C.border}`, overflow:'hidden', display:'flex', height:'230px' }}>
      <div style={{ width:'260px', flexShrink:0, ...shimmer, borderRadius:0 }} />
      <div style={{ flex:1, padding:'26px 32px', display:'flex', flexDirection:'column', gap:'14px' }}>
        <div style={{ height:'22px', width:'60%', ...shimmer }} />
        <div style={{ height:'14px', width:'85%', ...shimmer }} />
        <div style={{ height:'14px', width:'50%', ...shimmer }} />
        <div style={{ display:'flex', gap:'10px' }}>
          {[90, 110, 130].map((w, i) => <div key={i} style={{ height:'14px', width:`${w}px`, ...shimmer }} />)}
        </div>
        <div style={{ marginTop:'auto', display:'flex', justifyContent:'flex-end' }}>
          <div style={{ height:'36px', width:'140px', borderRadius:'100px', ...shimmer }} />
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// CTA SECTION
// ──────────────────────────────────────────────────────────────
function CTASection() {
  const [hovP, setHovP] = useState(false);
  const [hovS, setHovS] = useState(false);
  const ref    = useRef(null);
  const inView = useInView(ref, { once:true, amount:0.2 });

  return (
    <section style={{ padding:'96px 24px', position:'relative', overflow:'hidden', background:`linear-gradient(135deg, ${C.azureDeep} 0%, ${C.azure} 55%, ${C.cyanDark} 100%)` }}>
      <div style={{ position:'absolute', top:'-80px', right:'-80px', width:'320px', height:'320px', borderRadius:'50%', background:'rgba(255,255,255,0.04)', pointerEvents:'none' }} />
      <div style={{ position:'absolute', bottom:'-60px', left:'-60px', width:'256px', height:'256px', borderRadius:'50%', background:'rgba(48,200,211,0.10)', pointerEvents:'none' }} />

      <motion.div ref={ref} variants={fadeUp} initial="hidden" animate={inView ? 'show' : 'hidden'}
        style={{ maxWidth:'600px', margin:'0 auto', textAlign:'center', position:'relative' }}>
        <div style={{ width:'64px', height:'64px', borderRadius:'50%', background:'rgba(255,255,255,0.12)', border:'1px solid rgba(255,255,255,0.2)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 24px' }}>
          <Heart size={28} style={{ color:C.cyan }} fill={C.cyan} />
        </div>
        <h2 style={{ fontFamily:'"Playfair Display", Georgia, serif', fontSize:'clamp(1.9rem, 3.5vw, 2.6rem)', fontWeight:700, color:C.white, lineHeight:1.15, margin:'0 0 16px' }}>
          Envie de contribuer ?
        </h2>
        <p style={{ fontFamily:'"DM Sans", sans-serif', fontSize:'17px', lineHeight:1.75, color:'rgba(255,255,255,0.72)', margin:'0 0 40px' }}>
          Que vous souhaitiez faire un don, devenir bénévole ou simplement partager
          notre mission — chaque geste compte pour la jeunesse africaine.
        </p>
        <div style={{ display:'flex', flexWrap:'wrap', gap:'14px', justifyContent:'center' }}>
          <Link to="/contact"
            onMouseEnter={() => setHovP(true)} onMouseLeave={() => setHovP(false)}
            style={{ display:'inline-flex', alignItems:'center', gap:'8px', padding:'14px 32px', borderRadius:'100px', background:C.cyan, color:C.azureDeep, fontSize:'15px', fontWeight:700, fontFamily:'"DM Sans", sans-serif', textDecoration:'none', boxShadow: hovP ? '0 14px 36px rgba(48,200,211,0.45)' : '0 8px 28px rgba(48,200,211,0.35)', transform: hovP ? 'translateY(-3px)' : 'translateY(0)', transition:'all 0.3s cubic-bezier(0.34,1.56,0.64,1)' }}>
            Nous contacter <ArrowRight size={16} />
          </Link>
          <Link to="/devenir-membre"
            onMouseEnter={() => setHovS(true)} onMouseLeave={() => setHovS(false)}
            style={{ display:'inline-flex', alignItems:'center', gap:'8px', padding:'13px 30px', borderRadius:'100px', background: hovS ? 'rgba(255,255,255,0.1)' : 'transparent', border:`2px solid ${hovS ? 'rgba(255,255,255,0.65)' : 'rgba(255,255,255,0.35)'}`, color:C.white, fontSize:'15px', fontWeight:600, fontFamily:'"DM Sans", sans-serif', textDecoration:'none', transition:'all 0.3s cubic-bezier(0.34,1.56,0.64,1)' }}>
            Devenir membre
          </Link>
        </div>
      </motion.div>
    </section>
  );
}

// ──────────────────────────────────────────────────────────────
// PAGE PRINCIPALE
// ──────────────────────────────────────────────────────────────
export default function Actions() {
  const [actions,    setActions]    = useState([]);
  const [total,      setTotal]      = useState(0);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [recherche,  setRecherche]  = useState('');
  const [filtreType, setFiltreType] = useState('');

  const fetchActions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (filtreType) params.type   = filtreType;
      if (recherche)  params.search = recherche;
      const { data } = await axios.get(API_ACTIONS_URL, { params });
      const results  = data.results ?? data;
      setActions(results);
      setTotal(data.count ?? results.length);
    } catch (err) {
      console.error('[ININ Actions]', err);
      setError('Impossible de charger les actions. Vérifiez que le serveur Django est démarré.');
    } finally {
      setLoading(false);
    }
  }, [filtreType, recherche]);

  useEffect(() => {
    const timer = setTimeout(fetchActions, recherche ? 400 : 0);
    return () => clearTimeout(timer);
  }, [fetchActions, recherche]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,800;1,700;1,800&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap');
        * { box-sizing: border-box; }
        @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:0.35} }
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
      `}</style>

      <div style={{ background:C.offWhite, minHeight:'100vh', fontFamily:'"DM Sans", sans-serif' }}>

        <PageHero total={total} loading={loading} />

        <FiltersBar
          recherche={recherche}   setRecherche={setRecherche}
          filtreType={filtreType} setFiltreType={setFiltreType}
        />

        <div style={{ maxWidth:'1200px', margin:'0 auto', padding:'44px 24px 80px' }}>

          {/* Chargement */}
          {loading && (
            <div style={{ display:'flex', flexDirection:'column', gap:'18px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'8px', color:C.muted, fontSize:'13px', marginBottom:'4px' }}>
                <Loader2 size={15} style={{ animation:'spin 1s linear infinite' }} />
                Chargement des actions…
              </div>
              {Array.from({ length:4 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          )}

          {/* Erreur */}
          {!loading && error && (
            <div style={{ textAlign:'center', padding:'80px 24px', display:'flex', flexDirection:'column', alignItems:'center', gap:'16px' }}>
              <div style={{ fontSize:'48px', lineHeight:1 }}>⚠️</div>
              <h3 style={{ fontFamily:'"Playfair Display", serif', fontSize:'22px', fontWeight:700, color:C.azureDark, margin:0 }}>
                Impossible de charger les actions
              </h3>
              <p style={{ color:C.muted, fontSize:'15px', maxWidth:'400px', margin:0 }}>{error}</p>
              <button type="button" onClick={fetchActions}
                style={{ display:'flex', alignItems:'center', gap:'7px', padding:'11px 24px', borderRadius:'100px', background:C.azure, color:C.white, border:'none', fontSize:'14px', fontWeight:600, cursor:'pointer', fontFamily:'"DM Sans", sans-serif', marginTop:'8px' }}
                onMouseEnter={(e) => e.currentTarget.style.background=C.azureDeep}
                onMouseLeave={(e) => e.currentTarget.style.background=C.azure}
              >
                <RefreshCw size={15} /> Réessayer
              </button>
            </div>
          )}

          {/* Vide */}
          {!loading && !error && actions.length === 0 && (
            <div style={{ textAlign:'center', padding:'80px 24px', display:'flex', flexDirection:'column', alignItems:'center', gap:'16px' }}>
              <div style={{ width:'72px', height:'72px', borderRadius:'50%', background:C.azureLight, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Inbox size={30} style={{ color:C.azure }} />
              </div>
              <h3 style={{ fontFamily:'"Playfair Display", serif', fontSize:'22px', fontWeight:700, color:C.azureDark, margin:0 }}>
                Aucune action disponible
              </h3>
              <p style={{ color:C.muted, fontSize:'15px', maxWidth:'380px', margin:0 }}>
                {filtreType || recherche ? 'Essayez de modifier vos filtres.' : 'De nouvelles initiatives seront publiées prochainement.'}
              </p>
              {(filtreType || recherche) && (
                <button type="button" onClick={() => { setFiltreType(''); setRecherche(''); }}
                  style={{ padding:'10px 22px', borderRadius:'100px', border:`1.5px solid ${C.azure}`, background:'transparent', color:C.azure, fontSize:'13px', fontWeight:600, cursor:'pointer', fontFamily:'"DM Sans", sans-serif', marginTop:'4px' }}>
                  Effacer les filtres
                </button>
              )}
            </div>
          )}

          {/* Liste */}
          {!loading && !error && actions.length > 0 && (
            <>
              <p style={{ fontSize:'13px', color:C.mutedLight, marginBottom:'24px' }}>
                <strong style={{ color:C.azureDark }}>{total}</strong> action{total > 1 ? 's' : ''} trouvée{total > 1 ? 's' : ''}
                {filtreType && ` · ${FILTRES_TYPE.find((f) => f.key === filtreType)?.label}`}
                {recherche  && ` · "${recherche}"`}
              </p>
              <motion.div variants={stagger} initial="hidden" animate="show"
                style={{ display:'flex', flexDirection:'column', gap:'20px' }}>
                {actions.map((action, i) => (
                  <ActionCard key={action.id} action={action} index={i} onInscription={fetchActions} />
                ))}
              </motion.div>
            </>
          )}
        </div>

        {!loading && !error && <CTASection />}
      </div>
    </>
  );
}