/**
 * src/pages/DashboardRH.jsx
 * ─────────────────────────────────────────────────────────────
 * Espace Ressources Humaines — Association ININ
 * v6 — Ajout ModalDetailDemande + bouton "Détails" dans SectionDemandes
 */

import { useRef, useState, useEffect, useCallback } from 'react';
import { Link, useNavigate }      from 'react-router-dom';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import {
  LogOut, Settings, Plus, X,
  CheckCircle2, AlertCircle, Loader2, RefreshCw,
  Heart, CreditCard, Users, UserPlus, UserCheck,
  ArrowUpRight, ArrowDownRight, Pencil, Clock,
  Banknote, ThumbsUp, ThumbsDown,
  Upload, User as UserIcon, CalendarDays,
  Eye, Mail, Phone, MapPin, Link as LinkIcon,
  FileText, Briefcase, Tag, MessageSquare,
  Info,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// ── Palette ────────────────────────────────────────────────
const C = {
  emerald:       '#059669',
  emeraldDark:   '#064e3b',
  emeraldDeep:   '#022c22',
  emeraldLight:  '#ecfdf5',
  emeraldMid:    '#d1fae5',
  emeraldAccent: '#6ee7b7',
  azure:         '#1640c8',
  azureDark:     '#0f172a',
  azureDeep:     '#0f2060',
  azureLight:    '#eef5ff',
  violet:        '#7c3aed',
  violetLight:   '#f5f3ff',
  cyan:          '#30c8d3',
  cyanDark:      '#17a8b5',
  cyanLight:     '#ecfeff',
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
const API_BASE        = import.meta.env.VITE_API_URL;
const API_RH_STATS    = `${API_BASE}/api/rh/stats/`;
const API_DEMANDES    = `${API_BASE}/api/demandes-adhesion/`;
const API_DEMANDE_ID  = (id) => `${API_BASE}/api/demandes-adhesion/${id}/`;
const API_DONS        = `${API_BASE}/api/dons/`;
const API_COTISATION  = `${API_BASE}/api/cotisations/`;
const API_MEMBRES     = `${API_BASE}/api/membres/`;
const API_DASHBOARD   = `${API_BASE}/api/membres/me/dashboard/`;

const getToken   = () => localStorage.getItem('access_token') || sessionStorage.getItem('access_token') || '';
const authHeader = () => ({ Authorization: `Bearer ${getToken()}` });

const fmtDate = (str) =>
  str ? new Date(str).toLocaleDateString('fr-FR', { day:'numeric', month:'short', year:'numeric' }) : '—';

const fadeUp = {
  hidden: { opacity:0, y:20 },
  show:   { opacity:1, y:0, transition:{ duration:0.55, ease:[0.22,1,0.36,1] } },
};
const stagger = (d=0.08) => ({ hidden:{}, show:{ transition:{ staggerChildren:d } } });

const MODE_CFG = {
  ESPECES:      { label:'Espèces',      color:'#7c3aed', bg:'#f5f3ff'      },
  VIREMENT:     { label:'Virement',     color:C.azure,   bg:C.azureLight   },
  MOBILE_MONEY: { label:'Mobile Money', color:C.emerald, bg:C.emeraldLight },
  CHEQUE:       { label:'Chèque',       color:C.warning, bg:C.warningBg    },
  EN_LIGNE:     { label:'En ligne',     color:C.cyanDark,bg:C.cyanLight    },
  AUTRE:        { label:'Autre',        color:C.muted,   bg:C.offWhite     },
};

const TYPE_MEMBRE_OPTIONS = [
  { value:'PRESIDENT',          label:'Président'                 },
  { value:'VICE_PRESIDENT',     label:'Vice-Président'            },
  { value:'SECRETAIRE',         label:'Secrétaire'                },
  { value:'TRESORIER',          label:'Trésorier'                 },
  { value:'RESPONSABLE_RH',     label:'Responsable RH'            },
  { value:'RESPONSABLE_COM',    label:'Responsable Communication' },
  { value:'CHARGE_PROJET',      label:'Chargé de Projet'          },
  { value:'CHARGE_PARTENARIAT', label:'Chargé de Partenariat'     },
  { value:'BENEVOLE',           label:'Bénévole'                  },
  { value:'MEMBRE_ACTIF',       label:'Membre Actif'              },
];

const STATUT_OPTIONS = [
  { value:'ACTIF',      label:'Actif'                    },
  { value:'INACTIF',    label:'Inactif'                   },
  { value:'EN_ATTENTE', label:'En attente de validation'  },
];

const SEXE_OPTIONS = [
  { value:'',      label:'Non précisé' },
  { value:'HOMME', label:'Homme'       },
  { value:'FEMME', label:'Femme'       },
  { value:'AUTRE', label:'Autre'       },
];

const DOMAINE_LABELS = {
  SANTE_MENTALE:  'Santé mentale & psychologie',
  SANTE_PHYSIQUE: 'Santé physique & sport',
  EDUCATION:      'Éducation & pédagogie',
  COMMUNICATION:  'Communication & médias',
  TECHNOLOGIE:    'Technologie & numérique',
  DROIT:          'Droit & plaidoyer',
  FINANCE:        'Finance & gestion',
  LOGISTIQUE:     'Logistique & coordination',
  ART_CULTURE:    'Art & culture',
  AUTRE:          'Autre',
};

const TYPE_MEMBRE_SOUHAITE_LABELS = {
  MEMBRE:     'Membre',
  BENEVOLE:   'Bénévole',
  PARTENAIRE: 'Partenaire',
};


// ── Style helpers ──────────────────────────────────────────
const IS = (ac=C.azure) => ({
  width:'100%', padding:'11px 14px', border:`1.5px solid ${C.border}`,
  borderRadius:'10px', fontSize:'14px', fontFamily:'"DM Sans",sans-serif',
  color:C.azureDark, background:C.offWhite, outline:'none',
  transition:'border-color .2s,box-shadow .2s', boxSizing:'border-box',
});
const fo = (ac=C.azure) => (e) => { e.target.style.borderColor=ac; e.target.style.boxShadow=`0 0 0 3px ${ac}18`; };
const bl = () => (e) => { e.target.style.borderColor=C.border; e.target.style.boxShadow='none'; };
const LBs = {
  display:'block', fontFamily:'"DM Sans",sans-serif', fontSize:'11.5px', fontWeight:700,
  color:C.muted, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'6px',
};

// ── Section title style (used in ModalDetailDemande) ──────
const SectionTitleStyle = {
  fontFamily:'"DM Sans",sans-serif', fontSize:'10.5px', fontWeight:700,
  textTransform:'uppercase', letterSpacing:'0.09em', color:C.muted,
  marginBottom:'12px', paddingBottom:'8px',
  borderBottom:`1px solid ${C.border}`,
};

// ════════════════════════════════════════════════════════════
// UTILITAIRE — Mois depuis septembre 2025
// ════════════════════════════════════════════════════════════
function genererMoisDepuisDebut() {
  const MOIS_FR = [
    'Janvier','Février','Mars','Avril','Mai','Juin',
    'Juillet','Août','Septembre','Octobre','Novembre','Décembre',
  ];
  const liste  = [];
  const now    = new Date();
  let annee    = 2025;
  let moisIdx  = 8;

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

// ════════════════════════════════════════════════════════════
// PRIMITIVES PARTAGÉES
// ════════════════════════════════════════════════════════════

function ModalShell({ onClose, children, maxWidth='580px' }) {
  return (
    <>
      <motion.div
        initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
        transition={{duration:.18}} onClick={onClose}
        style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.6)',
          backdropFilter:'blur(4px)', zIndex:999 }}
      />
      <div style={{ position:'fixed', top:'50%', left:'50%',
        transform:'translate(-50%,-50%)', zIndex:1000, width:'94%', maxWidth }}>
        <motion.div
          initial={{opacity:0,scale:.95}} animate={{opacity:1,scale:1}}
          exit={{opacity:0,scale:.95}} transition={{duration:.26,ease:[0.22,1,0.36,1]}}
          style={{ background:C.white, borderRadius:'24px',
            boxShadow:'0 36px 80px rgba(0,0,0,.22)',
            maxHeight:'92vh', display:'flex', flexDirection:'column', overflow:'hidden' }}
        >
          {children}
        </motion.div>
      </div>
    </>
  );
}

function ModalHeader({ eyebrow, title, gradient, onClose }) {
  return (
    <div style={{ background:gradient, padding:'20px 24px',
      display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
      <div>
        <div style={{ fontFamily:'"DM Sans",sans-serif', fontSize:'10px', fontWeight:700,
          letterSpacing:'0.2em', textTransform:'uppercase',
          color:'rgba(255,255,255,.4)', marginBottom:'3px' }}>{eyebrow}</div>
        <h3 style={{ fontFamily:'"Playfair Display",serif', fontSize:'1.2rem',
          fontWeight:700, color:C.white, margin:0 }}>{title}</h3>
      </div>
      <button onClick={onClose}
        style={{ width:'34px', height:'34px', borderRadius:'50%',
          background:'rgba(255,255,255,.12)', border:'none',
          display:'flex', alignItems:'center', justifyContent:'center',
          cursor:'pointer', color:C.white, transition:'background .2s' }}
        onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,.24)'}
        onMouseLeave={e=>e.currentTarget.style.background='rgba(255,255,255,.12)'}>
        <X size={16}/>
      </button>
    </div>
  );
}

function ModalFooter({ onClose, onSubmit, loading, label, color }) {
  return (
    <div style={{ padding:'14px 24px', borderTop:`1px solid ${C.border}`,
      display:'flex', gap:'10px', justifyContent:'flex-end', flexShrink:0 }}>
      <button onClick={onClose}
        style={{ padding:'10px 20px', borderRadius:'100px',
          border:`1.5px solid ${C.border}`, background:C.white, color:C.muted,
          fontSize:'13px', fontWeight:600, cursor:'pointer',
          fontFamily:'"DM Sans",sans-serif' }}
        onMouseEnter={e=>e.currentTarget.style.borderColor=C.muted}
        onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>
        Annuler
      </button>
      {onSubmit && (
        <button onClick={onSubmit} disabled={loading}
          style={{ padding:'10px 24px', borderRadius:'100px', border:'none',
            background:loading?C.border:color,
            color:loading?C.mutedLight:C.white, fontSize:'13px', fontWeight:700,
            cursor:loading?'wait':'pointer', fontFamily:'"DM Sans",sans-serif',
            boxShadow:loading?'none':`0 4px 16px ${color}55`,
            transition:'all .22s', display:'flex', alignItems:'center', gap:'6px' }}>
          {loading
            ? <><Loader2 size={13} style={{animation:'spin 1s linear infinite'}}/> Envoi…</>
            : label}
        </button>
      )}
    </div>
  );
}

function Avatar({ user, size=58 }) {
  const [err, setErr] = useState(false);
  const photoUrl = user?.photo_profil
    ? (user.photo_profil.startsWith('http')
        ? user.photo_profil
        : `${API_BASE}${user.photo_profil}`)
    : null;
  const initials = (user?.first_name || user?.username || 'RH').slice(0,2).toUpperCase();
  if (photoUrl && !err) {
    return <img src={photoUrl} alt={initials} onError={()=>setErr(true)}
      style={{ width:`${size}px`, height:`${size}px`, borderRadius:'50%',
        objectFit:'cover', border:'2px solid rgba(255,255,255,.3)', flexShrink:0 }}/>;
  }
  return (
    <div style={{ width:`${size}px`, height:`${size}px`, borderRadius:'50%', flexShrink:0,
      background:'linear-gradient(135deg,rgba(124,58,237,.7),rgba(22,64,200,.5))',
      border:'2px solid rgba(255,255,255,.3)',
      display:'flex', alignItems:'center', justifyContent:'center' }}>
      <span style={{ fontFamily:'"Playfair Display",serif',
        fontSize:`${size*.37}px`, fontWeight:700, color:C.white }}>{initials}</span>
    </div>
  );
}

function KpiCard({ icon:Icon, label, value, sub, subPositive=true, color, bg }) {
  return (
    <motion.div variants={fadeUp}
      style={{ background:C.white, borderRadius:'20px', border:`1.5px solid ${C.border}`,
        padding:'24px 22px', boxShadow:'0 2px 16px rgba(0,0,0,.05)',
        position:'relative', overflow:'hidden' }}>
      <div style={{ position:'absolute', top:'-16px', right:'-16px', width:'76px',
        height:'76px', borderRadius:'50%', background:bg, opacity:.55, pointerEvents:'none' }}/>
      <div style={{ display:'flex', justifyContent:'space-between',
        alignItems:'flex-start', marginBottom:'16px', position:'relative' }}>
        <div style={{ width:'42px', height:'42px', borderRadius:'12px', background:bg,
          display:'flex', alignItems:'center', justifyContent:'center' }}>
          <Icon size={19} style={{ color }} strokeWidth={1.75}/>
        </div>
        {sub && (
          <span style={{ display:'inline-flex', alignItems:'center', gap:'3px',
            padding:'4px 10px', borderRadius:'100px',
            background:subPositive?C.successBg:C.dangerBg,
            color:subPositive?C.success:C.danger, fontSize:'11px', fontWeight:700 }}>
            {subPositive ? <ArrowUpRight size={11}/> : <ArrowDownRight size={11}/>}{sub}
          </span>
        )}
      </div>
      <div style={{ fontFamily:'"Playfair Display",serif', fontSize:'1.85rem',
        fontWeight:800, color:C.azureDark, lineHeight:1, marginBottom:'6px',
        position:'relative' }}>{value}</div>
      <div style={{ fontFamily:'"DM Sans",sans-serif', fontSize:'11.5px', fontWeight:600,
        color:C.muted, textTransform:'uppercase', letterSpacing:'0.09em' }}>{label}</div>
    </motion.div>
  );
}

// ════════════════════════════════════════════════════════════
// MODALE COTISATIONS
// ════════════════════════════════════════════════════════════
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
      <motion.div key="backdrop"
        initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
        onClick={onClose}
        style={{ position:'fixed', inset:0, zIndex:1000,
          background:'rgba(15,23,42,0.55)', backdropFilter:'blur(4px)',
          display:'flex', alignItems:'center', justifyContent:'center', padding:'24px' }}>
        <motion.div key="modal"
          initial={{opacity:0,scale:0.94,y:20}}
          animate={{opacity:1,scale:1,y:0}}
          exit={{opacity:0,scale:0.94,y:20}}
          transition={{duration:0.35,ease:[0.22,1,0.36,1]}}
          onClick={e=>e.stopPropagation()}
          style={{ background:C.white, borderRadius:'24px', border:`1.5px solid ${C.border}`,
            boxShadow:'0 32px 80px rgba(15,23,42,0.22)',
            width:'100%', maxWidth:'520px', maxHeight:'85vh',
            display:'flex', flexDirection:'column', overflow:'hidden' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
            padding:'22px 24px 18px', borderBottom:`1px solid ${C.border}`, flexShrink:0 }}>
            <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
              <div style={{ width:'38px', height:'38px', borderRadius:'10px',
                background:C.azureLight, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <CalendarDays size={18} style={{color:C.azure}} strokeWidth={1.75}/>
              </div>
              <div>
                <div style={{ fontFamily:'"Playfair Display",serif', fontSize:'1.1rem',
                  fontWeight:700, color:C.azureDark, lineHeight:1.2 }}>Mes cotisations</div>
                <div style={{ fontFamily:'"DM Sans",sans-serif', fontSize:'12px',
                  color:C.muted, marginTop:'2px' }}>Depuis septembre 2025</div>
              </div>
            </div>
            <button onClick={onClose}
              style={{ width:'32px', height:'32px', borderRadius:'50%',
                border:`1px solid ${C.border}`, background:C.offWhite,
                display:'flex', alignItems:'center', justifyContent:'center',
                cursor:'pointer', transition:'all 0.2s' }}
              onMouseEnter={e=>{e.currentTarget.style.background=C.dangerBg;e.currentTarget.style.borderColor=`${C.danger}40`;}}
              onMouseLeave={e=>{e.currentTarget.style.background=C.offWhite;e.currentTarget.style.borderColor=C.border;}}>
              <X size={15} style={{color:C.muted}}/>
            </button>
          </div>
          <div style={{ display:'flex', gap:'12px', padding:'16px 24px',
            borderBottom:`1px solid ${C.border}`, flexShrink:0 }}>
            <div style={{ flex:1, background:C.successBg, borderRadius:'12px',
              padding:'12px 16px', border:`1px solid ${C.success}20` }}>
              <div style={{ fontFamily:'"Playfair Display",serif', fontSize:'1.6rem',
                fontWeight:800, color:C.success, lineHeight:1 }}>{nbPayes}</div>
              <div style={{ fontFamily:'"DM Sans",sans-serif', fontSize:'11px', color:C.success,
                fontWeight:600, marginTop:'3px', textTransform:'uppercase', letterSpacing:'0.07em' }}>
                Payé{nbPayes>1?'s':''}
              </div>
            </div>
            <div style={{ flex:1, background:nbImpayes>0?C.dangerBg:C.offWhite,
              borderRadius:'12px', padding:'12px 16px',
              border:`1px solid ${nbImpayes>0?`${C.danger}20`:C.border}` }}>
              <div style={{ fontFamily:'"Playfair Display",serif', fontSize:'1.6rem',
                fontWeight:800, color:nbImpayes>0?C.danger:C.muted, lineHeight:1 }}>
                {nbImpayes}
              </div>
              <div style={{ fontFamily:'"DM Sans",sans-serif', fontSize:'11px',
                color:nbImpayes>0?C.danger:C.muted,
                fontWeight:600, marginTop:'3px', textTransform:'uppercase', letterSpacing:'0.07em' }}>
                Impayé{nbImpayes>1?'s':''}
              </div>
            </div>
            <div style={{ flex:1, background:C.azureLight, borderRadius:'12px',
              padding:'12px 16px', border:`1px solid ${C.azure}20` }}>
              <div style={{ fontFamily:'"Playfair Display",serif', fontSize:'1.6rem',
                fontWeight:800, color:C.azure, lineHeight:1 }}>{tousLesMois.length}</div>
              <div style={{ fontFamily:'"DM Sans",sans-serif', fontSize:'11px', color:C.azure,
                fontWeight:600, marginTop:'3px', textTransform:'uppercase', letterSpacing:'0.07em' }}>
                Total
              </div>
            </div>
          </div>
          <div style={{ overflowY:'auto', flex:1, padding:'8px 0' }}>
            {tousLesMois.map((mois,i) => {
              const paye = payesMap[mois]===true;
              return (
                <div key={mois} style={{ display:'flex', alignItems:'center',
                  justifyContent:'space-between', padding:'13px 24px',
                  background:i%2===0?'transparent':C.offWhite,
                  borderBottom:i<tousLesMois.length-1?`1px solid ${C.border}`:'none' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                    <div style={{ width:'8px', height:'8px', borderRadius:'50%', flexShrink:0,
                      background:paye?C.success:C.danger,
                      boxShadow:paye?`0 0 0 3px ${C.success}22`:`0 0 0 3px ${C.danger}22` }}/>
                    <span style={{ fontFamily:'"DM Sans",sans-serif', fontSize:'14px',
                      fontWeight:500, color:C.azureDark }}>{mois}</span>
                  </div>
                  <span style={{ display:'inline-flex', alignItems:'center', gap:'4px',
                    fontFamily:'"DM Sans",sans-serif', fontSize:'11px', fontWeight:700,
                    color:paye?C.success:C.danger,
                    background:paye?C.successBg:C.dangerBg,
                    border:`1px solid ${paye?`${C.success}30`:`${C.danger}30`}`,
                    borderRadius:'100px', padding:'3px 10px' }}>
                    {paye?<><CheckCircle2 size={11}/> Payée</>:<><AlertCircle size={11}/> Impayée</>}
                  </span>
                </div>
              );
            })}
          </div>
          <div style={{ padding:'16px 24px', borderTop:`1px solid ${C.border}`, flexShrink:0 }}>
            <button onClick={onClose}
              style={{ width:'100%', padding:'11px', borderRadius:'100px',
                background:C.offWhite, border:`1.5px solid ${C.border}`,
                fontFamily:'"DM Sans",sans-serif', fontSize:'14px',
                fontWeight:600, color:C.muted, cursor:'pointer', transition:'all 0.2s' }}
              onMouseEnter={e=>{e.currentTarget.style.background=C.border;}}
              onMouseLeave={e=>{e.currentTarget.style.background=C.offWhite;}}>
              Fermer
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ════════════════════════════════════════════════════════════
// CARTE COTISATIONS
// ════════════════════════════════════════════════════════════
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
  const dernierMois = tousLesMois[tousLesMois.length-1];
  const estAJour    = loading ? null : (payesMap[dernierMois]===true);

  return (
    <>
      <motion.div variants={fadeUp}>
        <div onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
          style={{ background:C.white, borderRadius:'18px',
            border:`1.5px solid ${hov?`${C.azure}50`:C.border}`,
            padding:'24px 22px',
            boxShadow:hov?`0 14px 40px ${C.azure}14`:'0 2px 12px rgba(0,0,0,.04)',
            transform:hov?'translateY(-4px)':'translateY(0)',
            transition:'all 0.35s cubic-bezier(0.34,1.56,0.64,1)',
            display:'flex', flexDirection:'column', gap:'16px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
            <div style={{ width:'42px', height:'42px', borderRadius:'12px',
              background:C.azureLight, display:'flex', alignItems:'center', justifyContent:'center',
              transform:hov?'scale(1.1)':'scale(1)', transition:'transform 0.3s' }}>
              <CalendarDays size={19} style={{color:C.azure}} strokeWidth={1.75}/>
            </div>
            {loading ? (
              <div style={{ width:'72px', height:'24px', borderRadius:'100px',
                background:C.border, animation:'pulse-soft 1.6s ease-in-out infinite' }}/>
            ) : (
              <span style={{ display:'inline-flex', alignItems:'center', gap:'4px',
                fontFamily:'"DM Sans",sans-serif', fontSize:'11px', fontWeight:700,
                color:estAJour===true?C.success:estAJour===false?C.danger:C.muted,
                background:estAJour===true?C.successBg:estAJour===false?C.dangerBg:C.offWhite,
                border:`1px solid ${estAJour===true?`${C.success}30`:estAJour===false?`${C.danger}30`:C.border}`,
                borderRadius:'100px', padding:'3px 10px' }}>
                {estAJour===true
                  ?<><CheckCircle2 size={11}/> À jour</>
                  :estAJour===false
                    ?<><AlertCircle size={11}/> En attente</>
                    :<><Clock size={11}/> Chargement…</>}
              </span>
            )}
          </div>
          <div>
            <div style={{ fontFamily:'"DM Sans",sans-serif', fontSize:'14px',
              fontWeight:700, color:C.azureDark, marginBottom:'4px' }}>
              Suivi des cotisations
            </div>
            <div style={{ fontFamily:'"DM Sans",sans-serif', fontSize:'12.5px',
              lineHeight:1.6, color:C.muted }}>
              {loading?'Chargement de vos cotisations…'
                :estAJour===true?'Votre cotisation du mois est à jour. Merci de votre engagement !'
                :'Consultez le détail de vos cotisations mois par mois.'}
            </div>
          </div>
          <button onClick={()=>setModaleOpen(true)} disabled={loading}
            style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', gap:'6px',
              padding:'10px 16px', borderRadius:'100px',
              background:loading?C.border:`linear-gradient(135deg,${C.azure},${C.cyanDark})`,
              color:loading?C.mutedLight:C.white,
              border:'none', fontSize:'13px', fontWeight:700,
              fontFamily:'"DM Sans",sans-serif',
              cursor:loading?'not-allowed':'pointer',
              boxShadow:loading?'none':`0 4px 14px ${C.azure}40`,
              transition:'all 0.2s ease' }}
            onMouseEnter={e=>{if(!loading){e.currentTarget.style.transform='translateY(-1px)';e.currentTarget.style.boxShadow=`0 7px 20px ${C.azure}55`;}}}
            onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';if(!loading)e.currentTarget.style.boxShadow=`0 4px 14px ${C.azure}40`;}}>
            {loading
              ?<><Loader2 size={13} style={{animation:'spin 0.8s linear infinite'}}/> Chargement…</>
              :<><CalendarDays size={13}/> Voir mes cotisations</>}
          </button>
        </div>
      </motion.div>
      {modaleOpen && (
        <ModaleCotisations cotisations={cotisations} onClose={()=>setModaleOpen(false)}/>
      )}
    </>
  );
}

// ════════════════════════════════════════════════════════════
// MODAL DON
// ════════════════════════════════════════════════════════════
function ModalDon({ onClose, onSuccess }) {
  const [form, setForm]    = useState({ montant:'', mode:'VIREMENT' });
  const [loading, setLoad] = useState(false);
  const [error, setErr]    = useState(null);
  const set = k => e => setForm(p=>({...p,[k]:e.target.value}));
  const ISv = IS(C.azure); const foc=fo(C.azure); const blr=bl();

  const submit = async () => {
    if (!form.montant||parseFloat(form.montant)<=0){setErr('Montant invalide.');return;}
    setLoad(true);setErr(null);
    try {
      await axios.post(API_DONS,{montant:form.montant,mode_paiement:form.mode},{headers:authHeader()});
      onSuccess?.();onClose();
    } catch(e){setErr(e.response?.data?Object.values(e.response.data).flat().join(' '):'Erreur serveur.');}
    finally{setLoad(false);}
  };

  return (
    <ModalShell onClose={onClose}>
      <ModalHeader eyebrow="Comptabilité" title="Enregistrer un don"
        gradient={`linear-gradient(135deg,#0f172a,${C.azure})`} onClose={onClose}/>
      <div style={{padding:'24px',overflowY:'auto',display:'flex',flexDirection:'column',gap:'16px'}}>
        <div>
          <span style={LBs}>Montant (FCFA) *</span>
          <input type="number" min="0" step="500" placeholder="Ex : 25 000"
            value={form.montant} onChange={set('montant')} onFocus={foc} onBlur={blr} style={ISv}/>
        </div>
        <div>
          <span style={LBs}>Mode de paiement *</span>
          <select value={form.mode} onChange={set('mode')} onFocus={foc} onBlur={blr}
            style={{...ISv,cursor:'pointer'}}>
            {Object.entries(MODE_CFG).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>
        {error&&(
          <div style={{display:'flex',gap:'8px',padding:'12px 14px',borderRadius:'10px',
            background:C.dangerBg,border:`1px solid ${C.danger}30`}}>
            <AlertCircle size={14} style={{color:C.danger,flexShrink:0,marginTop:'1px'}}/>
            <span style={{fontFamily:'"DM Sans",sans-serif',fontSize:'13px',color:C.danger}}>{error}</span>
          </div>
        )}
      </div>
      <ModalFooter onClose={onClose} onSubmit={submit} loading={loading}
        label={<><Banknote size={13}/> Enregistrer le don</>} color={C.azure}/>
    </ModalShell>
  );
}


// ════════════════════════════════════════════════════════════
// MODAL MEMBRE — Création / Modification
// ════════════════════════════════════════════════════════════
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
      : `${API_BASE}${initial.photo_profil}`;
  });

  const [loading, setLoad] = useState(false);
  const [errors,  setErrs] = useState({});

  const accentColor = isEdit ? C.violet : C.emerald;
  const gradient    = isEdit
    ? `linear-gradient(135deg,${C.azureDark},${C.violet})`
    : `linear-gradient(135deg,${C.emeraldDeep},${C.emerald})`;

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
        await axios.patch(`${API_MEMBRES}${initial.id}/`,fd,{headers:authHeader()});
      } else {
        await axios.post(API_MEMBRES,fd,{headers:authHeader()});
      }
      onSuccess?.();onClose();
    } catch(e){
      setErrs(e.response?.data?parseErrors(e.response.data):{non_field:'Erreur réseau.'});
    } finally{setLoad(false);}
  };

  const ISv=IS(accentColor);const foc=fo(accentColor);const blr=bl();
  const FieldError=({name})=>errors[name]
    ?<span style={{fontFamily:'"DM Sans",sans-serif',fontSize:'11.5px',
        color:C.danger,marginTop:'4px',display:'block'}}>{errors[name]}</span>
    :null;

  return (
    <ModalShell onClose={onClose} maxWidth="600px">
      <ModalHeader
        eyebrow={isEdit?'Modifier un membre':'Nouveau membre'}
        title={isEdit?`${initial.prenom} ${initial.nom}`:'Ajouter un membre'}
        gradient={gradient} onClose={onClose}
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
              background:C.offWhite,border:`2px dashed ${C.border}`,
              display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden'}}>
              {photoPreview
                ?<img src={photoPreview} alt="preview" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                :<UserIcon size={24} style={{color:C.mutedLight}}/>}
            </div>
            <label style={{display:'inline-flex',alignItems:'center',gap:'6px',
              padding:'9px 16px',borderRadius:'10px',cursor:'pointer',
              border:`1.5px solid ${C.border}`,background:C.white,
              fontFamily:'"DM Sans",sans-serif',fontSize:'13px',
              fontWeight:600,color:C.muted,transition:'all .2s'}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=accentColor;e.currentTarget.style.color=accentColor;}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.color=C.muted;}}>
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
              {TYPE_MEMBRE_OPTIONS.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <FieldError name="type_membre"/>
          </div>
          <div>
            <span style={LBs}>Statut *</span>
            <select value={form.statut} onChange={set('statut')}
              onFocus={foc} onBlur={blr} style={{...ISv,cursor:'pointer'}}>
              {STATUT_OPTIONS.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
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
        color={accentColor}/>
    </ModalShell>
  );
}

// ════════════════════════════════════════════════════════════
// ✅ NOUVELLE MODALE — Détail d'une demande d'adhésion
// ════════════════════════════════════════════════════════════
function ModalDetailDemande({ demande: d, onClose }) {

  // Résoudre l'URL du document si présent
  const docUrl = d.document
    ? (d.document.startsWith('http') ? d.document : `${API_BASE}${d.document}`)
    : null;

  // Résoudre la photo de profil si disponible
  const photoUrl = d.photo_profil
    ? (d.photo_profil.startsWith('http') ? d.photo_profil : `${API_BASE}${d.photo_profil}`)
    : null;

  // Initiales pour l'avatar fallback
  const initiales = `${(d.prenom||'?').slice(0,1)}${(d.nom||'?').slice(0,1)}`.toUpperCase();

  // Helper : ligne d'info avec icône
  const InfoRow = ({ icon: Icon, label, value, isLink=false, href='' }) => (
    <div style={{ display:'flex', alignItems:'flex-start', gap:'10px' }}>
      <div style={{ width:'32px', height:'32px', borderRadius:'8px', flexShrink:0,
        background:C.offWhite, border:`1px solid ${C.border}`,
        display:'flex', alignItems:'center', justifyContent:'center', marginTop:'1px' }}>
        <Icon size={13} style={{ color:C.mutedLight }}/>
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <span style={LBs}>{label}</span>
        {isLink && value ? (
          <a href={href||value} target="_blank" rel="noopener noreferrer"
            style={{ fontFamily:'"DM Sans",sans-serif', fontSize:'14px',
              color:C.azure, fontWeight:500, textDecoration:'none',
              display:'block', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}
            onMouseEnter={e=>e.currentTarget.style.textDecoration='underline'}
            onMouseLeave={e=>e.currentTarget.style.textDecoration='none'}>
            {value}
          </a>
        ) : (
          <span style={{ fontFamily:'"DM Sans",sans-serif', fontSize:'14px',
            color: value ? C.azureDark : C.mutedLight, fontWeight:500,
            display:'block' }}>
            {value || '—'}
          </span>
        )}
      </div>
    </div>
  );

  // Helper : séparateur de section
  const SectionTitle = ({ children }) => (
    <div style={{ ...SectionTitleStyle, display:'flex', alignItems:'center', gap:'8px' }}>
      {children}
    </div>
  );

  return (
    <ModalShell onClose={onClose} maxWidth="640px">
      <ModalHeader
        eyebrow="Demande d'adhésion"
        title={`${d.prenom||''} ${d.nom||''}`}
        gradient={`linear-gradient(135deg,#0f172a,${C.violet})`}
        onClose={onClose}
      />

      {/* Corps scrollable */}
      <div style={{ overflowY:'auto', flex:1, padding:'24px',
        display:'flex', flexDirection:'column', gap:'24px' }}>

        {/* ── Zone média : avatar + lien document ── */}
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'12px' }}>
          {/* Photo de profil ou avatar initiales */}
          {photoUrl ? (
            <img src={photoUrl} alt={`${d.prenom} ${d.nom}`}
              style={{ width:'96px', height:'96px', borderRadius:'50%',
                objectFit:'cover', border:`3px solid ${C.border}`,
                boxShadow:'0 4px 16px rgba(0,0,0,.1)' }}/>
          ) : (
            <div style={{ width:'96px', height:'96px', borderRadius:'50%',
              background:`linear-gradient(135deg,${C.violet}cc,${C.azure}99)`,
              border:`3px solid ${C.border}`,
              boxShadow:'0 4px 16px rgba(124,58,237,.18)',
              display:'flex', alignItems:'center', justifyContent:'center' }}>
              <span style={{ fontFamily:'"Playfair Display",serif', fontSize:'2rem',
                fontWeight:800, color:C.white }}>{initiales}</span>
            </div>
          )}

          {/* Nom complet sous l'avatar */}
          <div style={{ textAlign:'center' }}>
            <div style={{ fontFamily:'"Playfair Display",serif', fontSize:'1.15rem',
              fontWeight:700, color:C.azureDark, lineHeight:1.2 }}>
              {d.prenom} {d.nom}
            </div>
            <div style={{ fontFamily:'"DM Sans",sans-serif', fontSize:'12px',
              color:C.muted, marginTop:'3px' }}>
              {d.email||'—'}
            </div>
          </div>

          {/* Badge statut */}
          <span style={{
            display:'inline-flex', alignItems:'center', gap:'5px',
            padding:'5px 14px', borderRadius:'100px',
            fontFamily:'"DM Sans",sans-serif', fontSize:'11px', fontWeight:700,
            background: d.statut==='EN_ATTENTE' ? C.warningBg
              : d.statut==='ACCEPTEE' ? C.successBg : C.dangerBg,
            color: d.statut==='EN_ATTENTE' ? C.warning
              : d.statut==='ACCEPTEE' ? C.success : C.danger,
            border:`1px solid ${d.statut==='EN_ATTENTE'?`${C.warning}30`
              :d.statut==='ACCEPTEE'?`${C.success}30`:`${C.danger}30`}`,
          }}>
            {d.statut==='EN_ATTENTE'
              ? <><Clock size={11}/> En attente</>
              : d.statut==='ACCEPTEE'
                ? <><CheckCircle2 size={11}/> Acceptée</>
                : <><X size={11}/> Rejetée</>
            }
          </span>

          {/* Bouton "Voir le document" si CV/fichier joint */}
          {docUrl && (
            <a href={docUrl} target="_blank" rel="noopener noreferrer"
              style={{ display:'inline-flex', alignItems:'center', gap:'7px',
                padding:'9px 18px', borderRadius:'10px', textDecoration:'none',
                background:C.offWhite, border:`1.5px solid ${C.border}`,
                fontFamily:'"DM Sans",sans-serif', fontSize:'13px',
                fontWeight:600, color:C.muted, transition:'all .2s' }}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=C.cyanDark;e.currentTarget.style.color=C.cyanDark;e.currentTarget.style.background=C.cyanLight;}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.color=C.muted;e.currentTarget.style.background=C.offWhite;}}>
              <FileText size={14}/>
              Voir le document joint
            </a>
          )}
        </div>

        {/* ── Section Identité ── */}
        <div>
          <SectionTitle>
            <UserIcon size={12}/> Identité
          </SectionTitle>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px' }}>
            <InfoRow icon={UserIcon}   label="Prénom"            value={d.prenom}/>
            <InfoRow icon={UserIcon}   label="Nom"               value={d.nom}/>
            <InfoRow icon={Mail}       label="Email"             value={d.email}
              isLink href={`mailto:${d.email}`}/>
            <InfoRow icon={Phone}      label="Téléphone"         value={d.telephone}/>
            <InfoRow icon={CalendarDays} label="Date de naissance" value={fmtDate(d.date_naissance)}/>
            <InfoRow icon={MapPin}     label="Adresse"           value={d.adresse}/>
          </div>
        </div>

        {/* ── Section Profil ── */}
        <div>
          <SectionTitle>
            <Briefcase size={12}/> Profil
          </SectionTitle>
          <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
            <InfoRow icon={Tag}       label="Type d'adhésion souhaité"
              value={TYPE_MEMBRE_SOUHAITE_LABELS[d.type_membre_souhaite] || d.type_membre_souhaite || '—'}/>
            <InfoRow icon={Briefcase} label="Domaine d'expertise"
              value={DOMAINE_LABELS[d.domaine_expertise] || d.domaine_expertise || '—'}/>
            <InfoRow icon={LinkIcon}  label="Profil LinkedIn"
              value={d.profil_linkedin} isLink href={d.profil_linkedin}/>
          </div>
        </div>

        {/* ── Section Motivation ── */}
        <div>
          <SectionTitle>
            <MessageSquare size={12}/> Motivation
          </SectionTitle>
          <div style={{ padding:'16px', borderRadius:'12px',
            background:C.offWhite, border:`1.5px solid ${C.border}` }}>
            {(d.motivation || d.message) ? (
              <p style={{ fontFamily:'"DM Sans",sans-serif', fontSize:'14px',
                color:C.azureDark, lineHeight:1.75, margin:0,
                whiteSpace:'pre-wrap' }}>
                {d.motivation || d.message}
              </p>
            ) : (
              <span style={{ fontFamily:'"DM Sans",sans-serif', fontSize:'14px',
                color:C.mutedLight, fontStyle:'italic' }}>
                Aucune motivation renseignée.
              </span>
            )}
          </div>
        </div>

        {/* ── Section Métadonnées ── */}
        <div>
          <SectionTitle>
            <Info size={12}/> Informations de suivi
          </SectionTitle>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px' }}>
            <InfoRow icon={CalendarDays} label="Date de dépôt"
              value={fmtDate(d.date_demande || d.created_at)}/>
            <InfoRow icon={CheckCircle2} label="Date de traitement"
              value={fmtDate(d.date_traitement)}/>
          </div>
        </div>

      </div>{/* fin corps scrollable */}

      {/* Pied — bouton Fermer uniquement */}
      <div style={{ padding:'14px 24px', borderTop:`1px solid ${C.border}`,
        display:'flex', justifyContent:'flex-end', flexShrink:0 }}>
        <button onClick={onClose}
          style={{ padding:'10px 28px', borderRadius:'100px',
            border:`1.5px solid ${C.border}`, background:C.white, color:C.muted,
            fontSize:'13px', fontWeight:600, cursor:'pointer',
            fontFamily:'"DM Sans",sans-serif', transition:'all .2s' }}
          onMouseEnter={e=>e.currentTarget.style.borderColor=C.muted}
          onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>
          Fermer
        </button>
      </div>
    </ModalShell>
  );
}

// ════════════════════════════════════════════════════════════
// SECTION DEMANDES D'ADHÉSION — avec bouton Détails ✅
// ════════════════════════════════════════════════════════════
function SectionDemandes({ onCountChange }) {
  const [demandes, setDem]     = useState([]);
  const [loading, setLoad]     = useState(true);
  const [error, setErr]        = useState(null);
  const [actioning, setAct]    = useState(null);
  // ── Nouvel état : demande sélectionnée pour la modale détail
  const [detailDemande, setDetail] = useState(null);

  const fetch = useCallback(async () => {
    setLoad(true);setErr(null);
    try {
      const { data } = await axios.get(`${API_DEMANDES}?statut=EN_ATTENTE`,{headers:authHeader()});
      const liste = data.results??data;
      setDem(liste);
      onCountChange?.(liste.length);
    } catch { setErr('Impossible de charger les demandes.'); }
    finally  { setLoad(false); }
  },[onCountChange]);

  useEffect(()=>{fetch();},[fetch]);

  const action = async (id, decision) => {
    setAct(id);
    try {
      await axios.patch(API_DEMANDE_ID(id),{statut:decision},{headers:authHeader()});
      await fetch();
    } catch(e){console.error('[Demandes]',e);}
    finally{setAct(null);}
  };

  const isEmpty   = !loading&&!error&&demandes.length===0;
  const isPending = (id) => actioning===id;

  return (
    <>
      <motion.div variants={fadeUp}
        style={{ background:C.white, borderRadius:'20px', border:`1.5px solid ${C.border}`,
          overflow:'hidden', boxShadow:'0 4px 24px rgba(0,0,0,.05)', marginBottom:'20px' }}>
        <div style={{ padding:'18px 22px', borderBottom:`1px solid ${C.border}`,
          display:'flex', alignItems:'center', justifyContent:'space-between',
          flexWrap:'wrap', gap:'10px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
            <div style={{ width:'34px', height:'34px', borderRadius:'10px',
              background:C.warningBg, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Clock size={16} style={{color:C.warning}}/>
            </div>
            <div>
              <h3 style={{ fontFamily:'"Playfair Display",serif', fontSize:'1.05rem',
                fontWeight:700, color:C.azureDark, margin:0 }}>Demandes d'adhésion en attente</h3>
              <p style={{ fontFamily:'"DM Sans",sans-serif', fontSize:'12px', color:C.muted, margin:0 }}>
                {loading?'…':`${demandes.length} demande${demandes.length>1?'s':''}`}
              </p>
            </div>
          </div>
          <button onClick={fetch}
            style={{ display:'inline-flex', alignItems:'center', gap:'5px',
              padding:'7px 12px', borderRadius:'8px', border:`1.5px solid ${C.border}`,
              background:C.white, color:C.muted, fontSize:'12px', fontWeight:600,
              cursor:'pointer', fontFamily:'"DM Sans",sans-serif', transition:'all .2s' }}
            onMouseEnter={e=>{e.currentTarget.style.borderColor=C.warning;e.currentTarget.style.color=C.warning;}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.color=C.muted;}}>
            <RefreshCw size={11}/> Actualiser
          </button>
        </div>

        {loading ? (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center',
            gap:'8px', padding:'40px', color:C.muted, fontSize:'13px',
            fontFamily:'"DM Sans",sans-serif' }}>
            <Loader2 size={16} style={{animation:'spin 1s linear infinite',color:C.warning}}/>
            Chargement…
          </div>
        ) : error ? (
          <div style={{ padding:'36px', textAlign:'center', color:C.danger,
            fontFamily:'"DM Sans",sans-serif', fontSize:'13px' }}>{error}</div>
        ) : isEmpty ? (
          <div style={{ padding:'48px', textAlign:'center', display:'flex',
            flexDirection:'column', alignItems:'center', gap:'10px' }}>
            <div style={{ width:'48px', height:'48px', borderRadius:'50%',
              background:C.successBg, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <CheckCircle2 size={22} style={{color:C.success}}/>
            </div>
            <p style={{ fontFamily:'"DM Sans",sans-serif', fontSize:'13px', color:C.muted, margin:0 }}>
              Aucune demande en attente — tout est traité ! 🎉
            </p>
          </div>
        ) : (
          <div style={{overflowX:'auto'}}>
            <table style={{borderCollapse:'collapse',width:'100%'}}>
              <thead>
                <tr style={{background:C.offWhite}}>
                  {['Nom complet','Email','Date dépôt','Message','Actions'].map((h,i)=>(
                    <th key={h} style={{ padding:'10px 16px', textAlign:i===4?'right':'left',
                      fontFamily:'"DM Sans",sans-serif', fontSize:'10.5px', fontWeight:700,
                      textTransform:'uppercase', letterSpacing:'0.09em', color:C.muted,
                      whiteSpace:'nowrap', borderBottom:`1.5px solid ${C.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {demandes.map((d,i)=>(
                  <tr key={d.id}
                    style={{background:i%2===0?C.white:'#fafbfc',transition:'background .15s'}}
                    onMouseEnter={e=>e.currentTarget.style.background=C.offWhite}
                    onMouseLeave={e=>e.currentTarget.style.background=i%2===0?C.white:'#fafbfc'}>
                    {/* Nom complet */}
                    <td style={{padding:'12px 16px',borderBottom:`1px solid ${C.border}`,verticalAlign:'middle'}}>
                      <div style={{display:'flex',alignItems:'center',gap:'9px'}}>
                        <div style={{width:'32px',height:'32px',borderRadius:'50%',
                          background:C.violetLight,display:'flex',alignItems:'center',
                          justifyContent:'center',flexShrink:0}}>
                          <span style={{fontFamily:'"Playfair Display",serif',fontSize:'11px',
                            fontWeight:700,color:C.violet}}>
                            {(d.prenom??d.first_name??'?').slice(0,1).toUpperCase()}
                          </span>
                        </div>
                        <span style={{fontFamily:'"DM Sans",sans-serif',fontSize:'13px',
                          fontWeight:700,color:C.azureDark}}>
                          {d.prenom??d.first_name??'—'} {d.nom??d.last_name??''}
                        </span>
                      </div>
                    </td>
                    {/* Email */}
                    <td style={{padding:'12px 16px',borderBottom:`1px solid ${C.border}`,verticalAlign:'middle'}}>
                      <span style={{fontFamily:'"DM Sans",sans-serif',fontSize:'12.5px',color:C.muted}}>
                        {d.email??'—'}
                      </span>
                    </td>
                    {/* Date dépôt */}
                    <td style={{padding:'12px 16px',borderBottom:`1px solid ${C.border}`,verticalAlign:'middle',whiteSpace:'nowrap'}}>
                      <span style={{fontFamily:'"DM Sans",sans-serif',fontSize:'12px',color:C.muted}}>
                        {fmtDate(d.date_demande??d.created_at)}
                      </span>
                    </td>
                    {/* Message */}
                    <td style={{padding:'12px 16px',borderBottom:`1px solid ${C.border}`,verticalAlign:'middle',maxWidth:'180px'}}>
                      <span style={{fontFamily:'"DM Sans",sans-serif',fontSize:'12px',color:C.muted,
                        whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',display:'block'}}>
                        {d.message??d.motivation??'—'}
                      </span>
                    </td>
                    {/* ── Actions : Approuver + Rejeter + Détails ✅ ── */}
                    <td style={{padding:'12px 16px',borderBottom:`1px solid ${C.border}`,verticalAlign:'middle',textAlign:'right'}}>
                      <div style={{display:'inline-flex',gap:'6px',alignItems:'center'}}>

                        {/* Approuver */}
                        <button onClick={()=>action(d.id,'APPROUVE')} disabled={!!actioning}
                          style={{display:'inline-flex',alignItems:'center',gap:'4px',
                            padding:'6px 11px',borderRadius:'8px',
                            background:isPending(d.id)?C.border:C.successBg,
                            border:`1.5px solid ${C.success}30`,
                            color:isPending(d.id)?C.mutedLight:C.success,
                            fontSize:'11.5px',fontWeight:700,cursor:actioning?'wait':'pointer',
                            fontFamily:'"DM Sans",sans-serif',transition:'all .2s',whiteSpace:'nowrap'}}
                          onMouseEnter={e=>{if(!actioning){e.currentTarget.style.background=C.success;e.currentTarget.style.color=C.white;}}}
                          onMouseLeave={e=>{e.currentTarget.style.background=C.successBg;e.currentTarget.style.color=C.success;}}>
                          {isPending(d.id)
                            ?<Loader2 size={11} style={{animation:'spin 1s linear infinite'}}/>
                            :<ThumbsUp size={11}/>}
                          Approuver
                        </button>

                        {/* Rejeter */}
                        <button onClick={()=>action(d.id,'REJETE')} disabled={!!actioning}
                          style={{display:'inline-flex',alignItems:'center',gap:'4px',
                            padding:'6px 11px',borderRadius:'8px',
                            background:C.dangerBg,border:`1.5px solid ${C.danger}30`,
                            color:C.danger,fontSize:'11.5px',fontWeight:700,
                            cursor:actioning?'wait':'pointer',fontFamily:'"DM Sans",sans-serif',
                            transition:'all .2s',whiteSpace:'nowrap'}}
                          onMouseEnter={e=>{if(!actioning){e.currentTarget.style.background=C.danger;e.currentTarget.style.color=C.white;}}}
                          onMouseLeave={e=>{e.currentTarget.style.background=C.dangerBg;e.currentTarget.style.color=C.danger;}}>
                          <ThumbsDown size={11}/> Rejeter
                        </button>

                        {/* ✅ Détails */}
                        <button onClick={()=>setDetail(d)}
                          style={{display:'inline-flex',alignItems:'center',gap:'4px',
                            padding:'6px 11px',borderRadius:'8px',
                            background:C.azureLight,border:`1.5px solid ${C.azure}25`,
                            color:C.azure,fontSize:'11.5px',fontWeight:700,
                            cursor:'pointer',fontFamily:'"DM Sans",sans-serif',
                            transition:'all .2s',whiteSpace:'nowrap'}}
                          onMouseEnter={e=>{e.currentTarget.style.background=C.azure;e.currentTarget.style.color=C.white;e.currentTarget.style.borderColor=C.azure;}}
                          onMouseLeave={e=>{e.currentTarget.style.background=C.azureLight;e.currentTarget.style.color=C.azure;e.currentTarget.style.borderColor=`${C.azure}25`;}}>
                          <Eye size={11}/> Détails
                        </button>

                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* ✅ Modale détail — AnimatePresence */}
      <AnimatePresence>
        {detailDemande && (
          <ModalDetailDemande
            demande={detailDemande}
            onClose={()=>setDetail(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

// ════════════════════════════════════════════════════════════
// SECTION ANNUAIRE
// ════════════════════════════════════════════════════════════
function SectionAnnuaire() {
  const [membres,    setMembres] = useState([]);
  const [loading,    setLoad]    = useState(true);
  const [error,      setErr]     = useState(null);
  const [modalOpen,  setModal]   = useState(false);
  const [editTarget, setEdit]    = useState(null);
  const [search,     setSearch]  = useState('');

  const fetchMembres = useCallback(async()=>{
    setLoad(true);setErr(null);
    try {
      const {data} = await axios.get(API_MEMBRES,{headers:authHeader()});
      setMembres(data.results??data);
    } catch{setErr('Impossible de charger les membres.');}
    finally{setLoad(false);}
  },[]);

  useEffect(()=>{fetchMembres();},[fetchMembres]);

  const openCreate    = ()  => {setEdit(null);setModal(true);};
  const openEdit      = (m) => {setEdit(m);setModal(true);};
  const handleSuccess = ()  => {setModal(false);fetchMembres();};

  const filtered = membres.filter(m=>{
    const q=search.toLowerCase();
    return (m.nom||'').toLowerCase().includes(q)||
      (m.prenom||'').toLowerCase().includes(q)||
      (m.email||'').toLowerCase().includes(q);
  });

  const COLS = [
    {label:'Membre',           align:'left' },
    {label:'Email',            align:'left' },
    {label:'Adresse',          align:'left' },
    {label:'Date naissance',   align:'left' },
    {label:'Type',             align:'left' },
    {label:"Date d'adhésion",  align:'left' },
    {label:'Actions',          align:'right'},
  ];

  return (
    <>
      <motion.div variants={fadeUp}
        style={{ background:C.white, borderRadius:'20px', border:`1.5px solid ${C.border}`,
          overflow:'hidden', boxShadow:'0 4px 24px rgba(0,0,0,.05)' }}>
        {/* En-tête */}
        <div style={{ padding:'18px 22px', borderBottom:`1px solid ${C.border}`,
          display:'flex', alignItems:'center', justifyContent:'space-between',
          flexWrap:'wrap', gap:'12px' }}>
          <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
            <div style={{width:'34px',height:'34px',borderRadius:'10px',
              background:C.emeraldLight,display:'flex',alignItems:'center',justifyContent:'center'}}>
              <Users size={16} style={{color:C.emerald}}/>
            </div>
            <div>
              <h3 style={{fontFamily:'"Playfair Display",serif',fontSize:'1.05rem',
                fontWeight:700,color:C.azureDark,margin:0}}>Annuaire des membres</h3>
              <p style={{fontFamily:'"DM Sans",sans-serif',fontSize:'12px',color:C.muted,margin:0}}>
                {loading?'…':`${membres.length} membre${membres.length>1?'s':''} enregistré${membres.length>1?'s':''}`}
              </p>
            </div>
          </div>
          <div style={{display:'flex',gap:'10px',alignItems:'center',flexWrap:'wrap'}}>
            <div style={{position:'relative'}}>
              <input value={search} onChange={e=>setSearch(e.target.value)}
                placeholder="Rechercher…"
                style={{...IS(C.emerald),width:'200px',padding:'8px 12px 8px 34px'}}
                onFocus={fo(C.emerald)} onBlur={bl()}/>
              <svg style={{position:'absolute',left:'10px',top:'50%',
                transform:'translateY(-50%)',pointerEvents:'none'}}
                width="13" height="13" viewBox="0 0 24 24"
                fill="none" stroke={C.muted} strokeWidth="2.5">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
            </div>
            <button onClick={fetchMembres}
              style={{display:'inline-flex',alignItems:'center',gap:'5px',
                padding:'8px 13px',borderRadius:'8px',border:`1.5px solid ${C.border}`,
                background:C.white,color:C.muted,fontSize:'12px',fontWeight:600,
                cursor:'pointer',fontFamily:'"DM Sans",sans-serif',transition:'all .2s'}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=C.emerald;e.currentTarget.style.color=C.emerald;}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.color=C.muted;}}>
              <RefreshCw size={11}/> Actualiser
            </button>
            <button onClick={openCreate}
              style={{display:'inline-flex',alignItems:'center',gap:'6px',
                padding:'9px 16px',borderRadius:'10px',border:'none',
                background:`linear-gradient(135deg,${C.emerald},${C.cyanDark})`,
                color:C.white,fontSize:'13px',fontWeight:700,
                cursor:'pointer',fontFamily:'"DM Sans",sans-serif',
                boxShadow:`0 4px 14px ${C.emerald}35`,transition:'all .22s'}}
              onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-1px)';e.currentTarget.style.boxShadow=`0 8px 20px ${C.emerald}45`;}}
              onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow=`0 4px 14px ${C.emerald}35`;}}>
              <Plus size={14}/> Ajouter un membre
            </button>
          </div>
        </div>

        {/* Corps */}
        {loading ? (
          <div style={{display:'flex',alignItems:'center',justifyContent:'center',
            gap:'8px',padding:'52px',color:C.muted,fontFamily:'"DM Sans",sans-serif',fontSize:'13px'}}>
            <Loader2 size={16} style={{animation:'spin 1s linear infinite',color:C.emerald}}/>
            Chargement des membres…
          </div>
        ) : error ? (
          <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:'8px',padding:'48px'}}>
            <AlertCircle size={16} style={{color:C.danger}}/>
            <span style={{fontFamily:'"DM Sans",sans-serif',fontSize:'13px',color:C.danger}}>{error}</span>
          </div>
        ) : membres.length===0 ? (
          <div style={{padding:'52px',textAlign:'center'}}>
            <div style={{width:'48px',height:'48px',borderRadius:'50%',
              background:C.offWhite,display:'flex',alignItems:'center',
              justifyContent:'center',margin:'0 auto 12px'}}>
              <Users size={22} style={{color:C.mutedLight}}/>
            </div>
            <p style={{fontFamily:'"DM Sans",sans-serif',fontSize:'13px',color:C.muted,margin:0}}>
              Aucun membre enregistré pour le moment.
            </p>
          </div>
        ) : filtered.length===0 ? (
          <div style={{padding:'52px',textAlign:'center'}}>
            <p style={{fontFamily:'"DM Sans",sans-serif',fontSize:'13px',color:C.muted,margin:0}}>
              Aucun résultat pour <strong>«&nbsp;{search}&nbsp;»</strong>.
            </p>
          </div>
        ) : (
          <div style={{overflowX:'auto'}}>
            <table style={{borderCollapse:'collapse',width:'100%',minWidth:'860px'}}>
              <thead>
                <tr style={{background:C.offWhite}}>
                  {COLS.map(col=>(
                    <th key={col.label} style={{padding:'10px 16px',textAlign:col.align,
                      fontFamily:'"DM Sans",sans-serif',fontSize:'10.5px',fontWeight:700,
                      textTransform:'uppercase',letterSpacing:'0.09em',color:C.muted,
                      whiteSpace:'nowrap',borderBottom:`1.5px solid ${C.border}`}}>
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((m,i)=>(
                  <tr key={m.id}
                    style={{background:i%2===0?C.white:'#fafbfc',transition:'background .15s'}}
                    onMouseEnter={e=>e.currentTarget.style.background=C.offWhite}
                    onMouseLeave={e=>e.currentTarget.style.background=i%2===0?C.white:'#fafbfc'}>
                    <td style={{padding:'12px 16px',borderBottom:`1px solid ${C.border}`,verticalAlign:'middle'}}>
                      <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
                        <div style={{width:'36px',height:'36px',borderRadius:'50%',flexShrink:0,
                          background:C.emeraldLight,overflow:'hidden',
                          display:'flex',alignItems:'center',justifyContent:'center',
                          border:`1.5px solid ${C.emeraldMid}`}}>
                          {m.photo_profil
                            ?<img src={m.photo_profil.startsWith('http')?m.photo_profil:`${API_BASE}${m.photo_profil}`}
                                alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                            :<span style={{fontFamily:'"Playfair Display",serif',fontSize:'13px',
                                fontWeight:700,color:C.emerald}}>
                                {(m.prenom||'?').slice(0,1).toUpperCase()}
                              </span>}
                        </div>
                        <div>
                          <div style={{fontFamily:'"DM Sans",sans-serif',fontSize:'13px',
                            fontWeight:700,color:C.azureDark,whiteSpace:'nowrap'}}>
                            {m.prenom} {m.nom}
                          </div>
                          {m.telephone&&(
                            <div style={{fontFamily:'"DM Sans",sans-serif',fontSize:'11.5px',
                              color:C.mutedLight,marginTop:'1px'}}>{m.telephone}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td style={{padding:'12px 16px',borderBottom:`1px solid ${C.border}`,verticalAlign:'middle'}}>
                      <span style={{fontFamily:'"DM Sans",sans-serif',fontSize:'12.5px',color:C.muted}}>
                        {m.email||'—'}
                      </span>
                    </td>
                    <td style={{padding:'12px 16px',borderBottom:`1px solid ${C.border}`,verticalAlign:'middle',maxWidth:'150px'}}>
                      <span style={{fontFamily:'"DM Sans",sans-serif',fontSize:'12px',color:C.muted,
                        display:'block',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>
                        {m.adresse||'—'}
                      </span>
                    </td>
                    <td style={{padding:'12px 16px',borderBottom:`1px solid ${C.border}`,verticalAlign:'middle',whiteSpace:'nowrap'}}>
                      <span style={{fontFamily:'"DM Sans",sans-serif',fontSize:'12px',color:C.muted}}>
                        {fmtDate(m.date_naissance)}
                      </span>
                    </td>
                    <td style={{padding:'12px 16px',borderBottom:`1px solid ${C.border}`,verticalAlign:'middle'}}>
                      <span style={{fontFamily:'"DM Sans",sans-serif',fontSize:'12px',
                        color:C.azureDark,fontWeight:500}}>
                        {m.type_membre_display||m.type_membre||'—'}
                      </span>
                    </td>
                    <td style={{padding:'12px 16px',borderBottom:`1px solid ${C.border}`,verticalAlign:'middle',whiteSpace:'nowrap'}}>
                      <span style={{fontFamily:'"DM Sans",sans-serif',fontSize:'12px',color:C.muted}}>
                        {fmtDate(m.date_adhesion)}
                      </span>
                    </td>
                    <td style={{padding:'12px 16px',borderBottom:`1px solid ${C.border}`,verticalAlign:'middle',textAlign:'right'}}>
                      <button onClick={()=>openEdit(m)}
                        style={{display:'inline-flex',alignItems:'center',gap:'5px',
                          padding:'6px 13px',borderRadius:'8px',
                          background:C.violetLight,border:`1.5px solid ${C.violet}25`,
                          color:C.violet,fontSize:'11.5px',fontWeight:700,
                          cursor:'pointer',fontFamily:'"DM Sans",sans-serif',
                          transition:'all .2s',whiteSpace:'nowrap'}}
                        onMouseEnter={e=>{e.currentTarget.style.background=C.violet;e.currentTarget.style.color=C.white;}}
                        onMouseLeave={e=>{e.currentTarget.style.background=C.violetLight;e.currentTarget.style.color=C.violet;}}>
                        <Pencil size={11}/> Modifier
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      <AnimatePresence>
        {modalOpen&&(
          <ModalMembre initial={editTarget} onClose={()=>setModal(false)} onSuccess={handleSuccess}/>
        )}
      </AnimatePresence>
    </>
  );
}

// ════════════════════════════════════════════════════════════
// COLONNE ENGAGEMENT
// ════════════════════════════════════════════════════════════
function ColonneEngagement({ user, cotisations, loadingCotis }) {
  const [showDon, setDon] = useState(false);

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'18px', minWidth:0 }}>

      {/* Carte Don */}
      <motion.div variants={fadeUp}
        style={{ background:C.white, borderRadius:'20px', border:`1.5px solid ${C.border}`,
          padding:'24px', boxShadow:'0 4px 24px rgba(0,0,0,.05)',
          position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:'-20px', right:'-20px', width:'100px',
          height:'100px', borderRadius:'50%', background:C.azureLight,
          opacity:.6, pointerEvents:'none' }}/>
        <div style={{ display:'flex', alignItems:'center', gap:'12px',
          marginBottom:'16px', position:'relative' }}>
          <div style={{ width:'44px', height:'44px', borderRadius:'14px',
            background:C.azureLight, display:'flex', alignItems:'center',
            justifyContent:'center', flexShrink:0 }}>
            <Heart size={20} style={{ color:C.azure }}/>
          </div>
          <div>
            <div style={{ fontFamily:'"DM Sans",sans-serif', fontSize:'10.5px', fontWeight:700,
              letterSpacing:'0.12em', textTransform:'uppercase',
              color:C.azure, marginBottom:'2px' }}>
              Solidarité
            </div>
            <h4 style={{ fontFamily:'"Playfair Display",serif', fontSize:'1.05rem',
              fontWeight:700, color:C.azureDark, margin:0 }}>Faire un don</h4>
          </div>
        </div>
        <p style={{ fontFamily:'"DM Sans",sans-serif', fontSize:'13px', color:C.muted,
          lineHeight:1.6, margin:'0 0 20px', position:'relative' }}>
          Contribuez directement au financement des actions de l'association ININ.
        </p>
        <button onClick={() => setDon(true)}
          style={{ width:'100%', padding:'12px', borderRadius:'12px',
            background:`linear-gradient(135deg,${C.azure},#2d4fd4)`,
            color:C.white, fontSize:'13.5px', fontWeight:700, border:'none',
            cursor:'pointer', fontFamily:'"DM Sans",sans-serif',
            boxShadow:`0 6px 18px ${C.azure}35`, transition:'all .25s',
            display:'flex', alignItems:'center', justifyContent:'center', gap:'7px' }}
          onMouseEnter={e=>{ e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow=`0 10px 26px ${C.azure}45`; }}
          onMouseLeave={e=>{ e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow=`0 6px 18px ${C.azure}35`; }}>
          <Banknote size={15}/> Enregistrer un don
        </button>
      </motion.div>

      {/* Suivi cotisations */}
      <CarteCotisations cotisations={cotisations} loading={loadingCotis}/>

      <AnimatePresence>
        {showDon && <ModalDon onClose={() => setDon(false)} onSuccess={() => {}}/>}
      </AnimatePresence>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// PAGE PRINCIPALE
// ════════════════════════════════════════════════════════════
export default function DashboardRH() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const ref    = useRef(null);
  const inView = useInView(ref,{once:true,amount:.05});

  const [stats,        setStats]   = useState(null);
  const [ldStats,      setLdStats] = useState(true);
  const [nbDemandes,   setNbDem]   = useState(0);
  const [cotisations,  setCotis]   = useState([]);
  const [loadingCotis, setLdCotis] = useState(true);

  const displayName = user?.first_name||user?.username||'Responsable RH';
  const handleLogout = ()=>{logout();navigate('/',{replace:true});};

  const fetchStats = useCallback(async()=>{
    setLdStats(true);
    try{const{data}=await axios.get(API_RH_STATS,{headers:authHeader()});setStats(data);}
    catch{setStats(null);}
    finally{setLdStats(false);}
  },[]);

  useEffect(()=>{
    const token=getToken();
    if(!token){setLdCotis(false);return;}
    axios.get(API_DASHBOARD,{headers:{Authorization:`Bearer ${token}`}})
      .then(({data})=>{setCotis(Array.isArray(data.cotisations)?data.cotisations:[]);})
      .catch(()=>setCotis([]))
      .finally(()=>setLdCotis(false));
  },[]);

  useEffect(()=>{fetchStats();},[fetchStats]);

  return (
    <>
      <style>{`
        @keyframes spin       { to { transform:rotate(360deg); } }
        @keyframes pulse-soft { 0%,100%{opacity:1} 50%{opacity:.35} }
        .rh-grid-6040 {
          display: grid;
          grid-template-columns: 3fr 2fr;
          gap: 24px;
          align-items: start;
        }
        @media (max-width: 900px) {
          .rh-grid-6040 { grid-template-columns: 1fr; }
        }
      `}</style>

      <div style={{fontFamily:'"DM Sans",sans-serif',background:C.offWhite,
        minHeight:'100vh',paddingTop:`${NAV_HEIGHT}px`}}>

        {/* ── HERO ── */}
        <div style={{
          background:`linear-gradient(135deg,#0f172a 0%,${C.violet} 45%,${C.azure} 80%,${C.cyanDark} 100%)`,
          padding:'44px 24px 56px',position:'relative',overflow:'hidden',
        }}>
          <div style={{position:'absolute',top:'-60px',right:'-60px',width:'260px',
            height:'260px',borderRadius:'50%',background:'rgba(255,255,255,.03)',pointerEvents:'none'}}/>
          <div style={{position:'absolute',bottom:'-40px',left:'28%',width:'200px',
            height:'200px',borderRadius:'50%',background:'rgba(124,58,237,.12)',pointerEvents:'none'}}/>
          <div style={{position:'absolute',top:'20px',right:'12%',width:'90px',
            height:'90px',border:'1px solid rgba(255,255,255,.05)',borderRadius:'14px',
            transform:'rotate(20deg)',pointerEvents:'none'}}/>

          <div style={{maxWidth:'1280px',margin:'0 auto',position:'relative',
            display:'flex',alignItems:'center',justifyContent:'space-between',
            flexWrap:'wrap',gap:'20px'}}>
            <motion.div initial={{opacity:0,x:-24}} animate={{opacity:1,x:0}}
              transition={{duration:.6,ease:[0.22,1,0.36,1]}}
              style={{display:'flex',alignItems:'center',gap:'18px'}}>
              <Avatar user={user} size={58}/>
              <div>
                <div style={{fontFamily:'"DM Sans",sans-serif',fontSize:'11px',
                  color:'rgba(255,255,255,.45)',fontWeight:600,letterSpacing:'0.15em',
                  textTransform:'uppercase',marginBottom:'4px'}}>
                  Espace Ressources Humaines
                </div>
                <h1 style={{fontFamily:'"Playfair Display",serif',
                  fontSize:'clamp(1.4rem,3vw,1.9rem)',fontWeight:800,
                  color:C.white,margin:0,lineHeight:1.15}}>
                  Bonjour, <em style={{fontStyle:'italic',color:'#c4b5fd'}}>{displayName}</em> 👋
                </h1>
                <div style={{fontFamily:'"DM Sans",sans-serif',fontSize:'13px',
                  color:'rgba(255,255,255,.45)',marginTop:'4px'}}>
                  Gérez les membres, les demandes et les ressources humaines d'ININ.
                </div>
              </div>
            </motion.div>

            <motion.div initial={{opacity:0,x:24}} animate={{opacity:1,x:0}}
              transition={{duration:.6,ease:[0.22,1,0.36,1]}}
              style={{display:'flex',gap:'10px',flexWrap:'wrap',alignItems:'center'}}>
              <Link to="/dashboard/settings"
                style={{display:'inline-flex',alignItems:'center',gap:'6px',
                  padding:'10px 16px',borderRadius:'100px',
                  background:'rgba(255,255,255,.1)',border:'1px solid rgba(255,255,255,.2)',
                  color:C.white,fontSize:'13px',fontWeight:600,
                  fontFamily:'"DM Sans",sans-serif',textDecoration:'none',transition:'background .2s'}}
                onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,.18)'}
                onMouseLeave={e=>e.currentTarget.style.background='rgba(255,255,255,.1)'}>
                <Settings size={14}/> Profil
              </Link>
              <button onClick={handleLogout}
                style={{display:'inline-flex',alignItems:'center',gap:'6px',
                  padding:'10px 16px',borderRadius:'100px',
                  background:'rgba(220,38,38,.15)',border:'1px solid rgba(220,38,38,.3)',
                  color:'#fca5a5',fontSize:'13px',fontWeight:600,
                  fontFamily:'"DM Sans",sans-serif',cursor:'pointer',transition:'background .2s'}}
                onMouseEnter={e=>e.currentTarget.style.background='rgba(220,38,38,.28)'}
                onMouseLeave={e=>e.currentTarget.style.background='rgba(220,38,38,.15)'}>
                <LogOut size={14}/> Déconnecter
              </button>
            </motion.div>
          </div>
        </div>

        {/* ── CONTENU ── */}
        <div ref={ref} style={{maxWidth:'1280px',margin:'0 auto',padding:'36px 24px 80px'}}>

          {/* KPIs */}
          <motion.div variants={stagger(.09)} initial="hidden" animate={inView?'show':'hidden'}
            style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))',
              gap:'18px',marginBottom:'44px'}}>
            <KpiCard icon={Users} label="Total Membres"
              value={ldStats?'…':(stats?.total_membres??'—')}
              sub="Inscrits" subPositive={true} color={C.azure} bg={C.azureLight}/>
            <KpiCard icon={UserCheck} label="Total Bénévoles"
              value={ldStats?'…':(stats?.total_benevoles??'—')}
              sub="Actifs" subPositive={true} color={C.violet} bg={C.violetLight}/>
            <KpiCard icon={Clock} label="Demandes en attente"
              value={ldStats?'…':(stats?.demandes_en_attente??nbDemandes)}
              sub={nbDemandes>0?'À traiter':'Tout traité'}
              subPositive={nbDemandes===0} color={C.warning} bg={C.warningBg}/>
          </motion.div>

          {/* Grille principale */}
          <motion.div variants={stagger(.1)} initial="hidden" animate={inView?'show':'hidden'}
            className="rh-grid-6040">
            <div style={{display:'flex',flexDirection:'column',gap:'24px', minWidth:0, overflow:'hidden' }}>
              <SectionDemandes onCountChange={setNbDem}/>
              <SectionAnnuaire/>
            </div>
            <ColonneEngagement user={user} cotisations={cotisations} loadingCotis={loadingCotis}/>
          </motion.div>

        </div>
      </div>
    </>
  );
}