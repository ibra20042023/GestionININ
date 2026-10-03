import { useRef, useState, useEffect, useCallback } from 'react';
import { Link, useNavigate }     from 'react-router-dom';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import {
  TrendingDown, LogOut, Settings, Plus, X, Upload,
  CheckCircle2, AlertCircle, Loader2, RefreshCw,
  Heart, CreditCard, Calendar, Receipt, Wallet,
  ArrowUpRight, ArrowDownRight, Filter,
  Banknote, Users, BadgeCheck, Clock, Ban,
  Edit3, Save, DollarSign,
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
  azure:         '#1640c8',
  azureDark:     '#0f172a',
  azureLight:    '#eef5ff',
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

// ── Utilitaire : liste tous les mois depuis septembre 2025 ───
// Même logique que DashboardMembre — génère "Septembre 2025", "Octobre 2025", etc.
function genererMoisDepuisDebut() {
  const MOIS_FR = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
  const liste = [];
  const now = new Date();
  let annee = 2025, moisIdx = 8; // septembre = index 8
  while (annee < now.getFullYear() || (annee === now.getFullYear() && moisIdx <= now.getMonth())) {
    liste.push(`${MOIS_FR[moisIdx]} ${annee}`);
    moisIdx++;
    if (moisIdx > 11) { moisIdx = 0; annee++; }
  }
  return liste;
}

const NAV_HEIGHT   = 85;
const API_STATS      = `${import.meta.env.VITE_API_URL}/api/finance/stats/`;
const API_DONS       = `${import.meta.env.VITE_API_URL}/api/dons/`;
const API_RECU       = (id) => `${import.meta.env.VITE_API_URL}/api/dons/${id}/generer_recu/`;
const API_DEPENSE    = `${import.meta.env.VITE_API_URL}/api/depenses/`;
const API_ACTIONS    = `${import.meta.env.VITE_API_URL}/api/actions/`;
const API_COTISATION = `${import.meta.env.VITE_API_URL}/api/cotisations/`;
const API_MEMBRES    = `${import.meta.env.VITE_API_URL}/api/membres/`;  // RH only
const API_MEMBRES_TRESORIER = `${import.meta.env.VITE_API_URL}/api/membres/`; // MembreViewSet — accessible au Trésorier

const getToken   = () => localStorage.getItem('access_token') || sessionStorage.getItem('access_token') || '';
const authHeader = () => ({ Authorization: `Bearer ${getToken()}` });

const fmt = (val) =>
  val != null
    ? new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(val) + ' FCFA'
    : '— FCFA';

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
  EN_LIGNE:     { label:'En ligne',     color:C.cyanDark,bg:'#ecfeff'      },
  AUTRE:        { label:'Autre',        color:C.muted,   bg:C.offWhite     },
};

const CAT_DEPENSE = [
  { key:'TRANSPORT',      label:'Transport'               },
  { key:'LOGISTIQUE',     label:'Logistique'              },
  { key:'COMMUNICATION',  label:'Communication'           },
  { key:'LOCATION',       label:'Location de salle'       },
  { key:'INTERVENANT',    label:'Rémunération intervenant'},
  { key:'MATERIEL',       label:'Matériel pédagogique'    },
  { key:'RESTAURATION',   label:'Restauration'            },
  { key:'ADMINISTRATIF',  label:'Frais administratifs'    },
  { key:'AUTRE',          label:'Autre'                   },
];

// ── Statuts dépense ───────────────────────────────────────────
const STATUT_DEP = {
  EN_ATTENTE: { label:'En attente', color:C.warning, bg:C.warningBg, Icon:Clock      },
  // ✅ Clés alignées sur les valeurs renvoyées par le backend (VALIDEE / REJETEE)
  VALIDEE:    { label:'Validée',    color:C.success, bg:C.successBg, Icon:BadgeCheck },
  REJETEE:    { label:'Rejetée',    color:C.danger,  bg:C.dangerBg,  Icon:Ban        },
};

const ANNEE_COURANTE = new Date().getFullYear();
const ANNEES_COTIS   = Array.from({ length:5 }, (_,i) => ANNEE_COURANTE - 1 + i);

const IS_shared = (ac) => ({ width:'100%', padding:'11px 14px', border:`1.5px solid ${C.border}`, borderRadius:'10px', fontSize:'14px', fontFamily:'"DM Sans",sans-serif', color:C.azureDark, background:C.offWhite, outline:'none', transition:'border-color .2s,box-shadow .2s', boxSizing:'border-box' });
const fo_shared = (ac) => (e) => { e.target.style.borderColor=ac; e.target.style.boxShadow=`0 0 0 3px ${ac}18`; };
const bl_shared = () => (e) => { e.target.style.borderColor=C.border; e.target.style.boxShadow='none'; };
const LBs = { display:'block', fontFamily:'"DM Sans",sans-serif', fontSize:'11.5px', fontWeight:700, color:C.muted, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'6px' };

// Overlay + wrapper centrage réutilisable
function ModalShell({ onClose, children, maxWidth='500px' }) {
  return (
    <>
      <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
        transition={{duration:.18}} onClick={onClose}
        style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.6)', backdropFilter:'blur(4px)', zIndex:999 }}/>
      <div style={{ position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)', zIndex:1000, width:'90%', maxWidth:maxWidth }}>
        <motion.div initial={{opacity:0,scale:.95}} animate={{opacity:1,scale:1}} exit={{opacity:0,scale:.95}}
          transition={{duration:.26, ease:[0.22,1,0.36,1]}}
          style={{ background:C.white, borderRadius:'24px', boxShadow:'0 36px 80px rgba(0,0,0,.22)', maxHeight:'90vh', display:'flex', flexDirection:'column', overflow:'hidden' }}>
          {children}
        </motion.div>
      </div>
    </>
  );
}

function ModalHeader({ eyebrow, title, gradient, onClose }) {
  return (
    <div style={{ background:gradient, padding:'20px 24px', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
      <div>
        <div style={{ fontFamily:'"DM Sans",sans-serif', fontSize:'10px', fontWeight:700, letterSpacing:'0.2em', textTransform:'uppercase', color:'rgba(255,255,255,.4)', marginBottom:'3px' }}>{eyebrow}</div>
        <h3 style={{ fontFamily:'"Playfair Display",serif', fontSize:'1.2rem', fontWeight:700, color:C.white, margin:0 }}>{title}</h3>
      </div>
      <button onClick={onClose} style={{ width:'34px', height:'34px', borderRadius:'50%', background:'rgba(255,255,255,.12)', border:'none', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:C.white, transition:'background .2s' }}
        onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,.24)'}
        onMouseLeave={e=>e.currentTarget.style.background='rgba(255,255,255,.12)'}>
        <X size={16}/>
      </button>
    </div>
  );
}

function ModalFooter({ onClose, onSubmit, loading, label, color }) {
  return (
    <div style={{ padding:'14px 24px', borderTop:`1px solid ${C.border}`, display:'flex', gap:'10px', justifyContent:'flex-end', flexShrink:0 }}>
      <button onClick={onClose}
        style={{ padding:'10px 20px', borderRadius:'100px', border:`1.5px solid ${C.border}`, background:C.white, color:C.muted, fontSize:'13px', fontWeight:600, cursor:'pointer', fontFamily:'"DM Sans",sans-serif' }}
        onMouseEnter={e=>e.currentTarget.style.borderColor=C.muted}
        onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>Annuler</button>
      <button onClick={onSubmit} disabled={loading}
        style={{ padding:'10px 24px', borderRadius:'100px', border:'none', background:loading?C.border:color, color:loading?C.mutedLight:C.white, fontSize:'13px', fontWeight:700, cursor:loading?'wait':'pointer', fontFamily:'"DM Sans",sans-serif', boxShadow:loading?'none':`0 4px 16px ${color}55`, transition:'all .22s', display:'flex', alignItems:'center', gap:'6px' }}>
        {loading ? <><Loader2 size={13} style={{animation:'spin 1s linear infinite'}}/> Envoi…</> : label}
      </button>
    </div>
  );
}

// ── Avatar ────────────────────────────────────────────────────
function Avatar({ user, size=58 }) {
  const [err, setErr] = useState(false);
  const photoUrl = user?.photo_profil
    ? (user.photo_profil.startsWith('http') ? user.photo_profil : `${import.meta.env.VITE_API_URL}${user.photo_profil}`)
    : null;
  const initials = (user?.first_name || user?.username || 'T').slice(0,2).toUpperCase();

  if (photoUrl && !err) {
    return <img src={photoUrl} alt={initials} onError={()=>setErr(true)}
      style={{ width:`${size}px`, height:`${size}px`, borderRadius:'50%', objectFit:'cover', border:'2px solid rgba(255,255,255,.3)', flexShrink:0 }} />;
  }
  return (
    <div style={{ width:`${size}px`, height:`${size}px`, borderRadius:'50%', flexShrink:0, background:'linear-gradient(135deg,rgba(5,150,105,.7),rgba(22,64,200,.5))', border:'2px solid rgba(255,255,255,.3)', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <span style={{ fontFamily:'"Playfair Display",serif', fontSize:`${size*.37}px`, fontWeight:700, color:C.white }}>{initials}</span>
    </div>
  );
}

// ── KPI Card ──────────────────────────────────────────────────
function KpiCard({ icon:Icon, label, value, sub, subPositive=true, color, bg }) {
  return (
    <motion.div variants={fadeUp}
      style={{ background:C.white, borderRadius:'20px', border:`1.5px solid ${C.border}`, padding:'24px 22px', boxShadow:'0 2px 16px rgba(0,0,0,.05)', position:'relative', overflow:'hidden' }}>
      <div style={{ position:'absolute', top:'-16px', right:'-16px', width:'76px', height:'76px', borderRadius:'50%', background:bg, opacity:.55, pointerEvents:'none' }} />
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'16px', position:'relative' }}>
        <div style={{ width:'42px', height:'42px', borderRadius:'12px', background:bg, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <Icon size={19} style={{ color }} strokeWidth={1.75} />
        </div>
        {sub && (
          <span style={{ display:'inline-flex', alignItems:'center', gap:'3px', padding:'4px 10px', borderRadius:'100px', background: subPositive ? C.successBg : C.dangerBg, color: subPositive ? C.success : C.danger, fontSize:'11px', fontWeight:700 }}>
            {subPositive ? <ArrowUpRight size={11}/> : <ArrowDownRight size={11}/>}
            {sub}
          </span>
        )}
      </div>
      <div style={{ fontFamily:'"Playfair Display",serif', fontSize:'1.85rem', fontWeight:800, color:C.azureDark, lineHeight:1, marginBottom:'6px', position:'relative' }}>{value}</div>
      <div style={{ fontFamily:'"DM Sans",sans-serif', fontSize:'11.5px', fontWeight:600, color:C.muted, textTransform:'uppercase', letterSpacing:'0.09em' }}>{label}</div>
    </motion.div>
  );
}

// ── Ligne don ─────────────────────────────────────────────────
function DonRow({ don, index, onRecuGenere }) {
  const [hov,     setHov]     = useState(false);
  const [loading, setLoading] = useState(false);
  const [done,    setDone]    = useState(don.recu_genere ?? false);
  const ref    = useRef(null);
  const inView = useInView(ref, { once:true, amount:.3 });

  const handleRecu = async () => {
    setLoading(true);
    try {
      await axios.post(API_RECU(don.id), {}, { headers:authHeader() });
      setDone(true);
      onRecuGenere?.(don.id);

      // Génération fichier côté client
      const lignes = [
        '═══════════════════════════════════════════════════════',
        '         ASSOCIATION ININ — REÇU DE DON OFFICIEL',
        '═══════════════════════════════════════════════════════',
        '',
        `  N° Reçu            : REC-${String(don.id).padStart(6,'0')}`,
        `  Date d'émission    : ${new Date().toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'})}`,
        `  Date du don        : ${fmtDate(don.date_don)}`,
        '',
        '  ── DONATEUR ──────────────────────────────────────────',
        `  Nom                : ${don.donateur_display ?? 'Anonyme'}`,
        '',
        '  ── DON ───────────────────────────────────────────────',
        `  Montant            : ${fmt(don.montant)}`,
        `  Mode de paiement   : ${MODE_CFG[don.mode_paiement]?.label ?? don.mode_paiement ?? '—'}`,
        don.action_titre ? `  Action financée    : ${don.action_titre}` : null,
        '',
        '  ── ATTESTATION ───────────────────────────────────────',
        '  Ce document certifie la réception du don susmentionné.',
        '  Il vaut reçu fiscal conformément à la réglementation.',
        '',
        '  Association ININ – Santé & Épanouissement de la Jeunesse',
        '═══════════════════════════════════════════════════════',
      ].filter(l => l !== null).join('\n');

      const blob  = new Blob([lignes], { type:'text/plain;charset=utf-8' });
      const url   = URL.createObjectURL(blob);
      const a     = document.createElement('a');
      a.href      = url;
      a.download  = `ININ_Recu_${String(don.id).padStart(6,'0')}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    } catch(e) {
      console.error('[Reçu]', e);
    } finally { setLoading(false); }
  };

  const cfg = MODE_CFG[don.mode_paiement] ?? MODE_CFG.AUTRE;

  return (
    <motion.tr ref={ref} variants={fadeUp} initial="hidden" animate={inView?'show':'hidden'}
      transition={{ delay:index*.045 }}
      onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{ background: hov ? C.offWhite : C.white, transition:'background .18s' }}>

      {/* Donateur */}
      <td style={{ padding:'16px 20px', borderBottom:`1px solid ${C.border}`, verticalAlign:'middle' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
          <div style={{ width:'34px', height:'34px', borderRadius:'50%', background:C.emeraldLight, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <span style={{ fontFamily:'"Playfair Display",serif', fontSize:'12px', fontWeight:700, color:C.emerald }}>
              {(don.donateur_display ?? 'A').slice(0,1).toUpperCase()}
            </span>
          </div>
          <div>
            <div style={{ fontFamily:'"DM Sans",sans-serif', fontSize:'13.5px', fontWeight:700, color:C.azureDark }}>{don.donateur_display ?? 'Anonyme'}</div>
            {don.action_titre && <div style={{ fontFamily:'"DM Sans",sans-serif', fontSize:'11px', color:C.cyanDark, fontWeight:600 }}>↳ {don.action_titre}</div>}
          </div>
        </div>
      </td>

      {/* Montant */}
      <td style={{ padding:'16px 16px', borderBottom:`1px solid ${C.border}`, verticalAlign:'middle', whiteSpace:'nowrap' }}>
        <span style={{ fontFamily:'"Playfair Display",serif', fontSize:'1.1rem', fontWeight:800, color:C.emerald }}>{fmt(don.montant)}</span>
      </td>

      {/* Date */}
      <td style={{ padding:'16px 16px', borderBottom:`1px solid ${C.border}`, verticalAlign:'middle' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'5px', fontFamily:'"DM Sans",sans-serif', fontSize:'13px', color:C.muted }}>
          <Calendar size={12} style={{ color:C.mutedLight }}/>
          {fmtDate(don.date_don)}
        </div>
      </td>

      {/* Mode paiement */}
      <td style={{ padding:'16px 16px', borderBottom:`1px solid ${C.border}`, verticalAlign:'middle' }}>
        <span style={{ fontFamily:'"DM Sans",sans-serif', fontSize:'11px', fontWeight:700, padding:'3px 10px', borderRadius:'100px', color:cfg.color, background:cfg.bg, whiteSpace:'nowrap' }}>
          {cfg.label}
        </span>
      </td>

      {/* Reçu */}
      <td style={{ padding:'16px 20px', borderBottom:`1px solid ${C.border}`, verticalAlign:'middle', textAlign:'right' }}>
        {done ? (
          <span style={{ display:'inline-flex', alignItems:'center', gap:'5px', padding:'7px 13px', borderRadius:'8px', background:C.successBg, color:C.success, fontSize:'12px', fontWeight:700, fontFamily:'"DM Sans",sans-serif' }}>
            <CheckCircle2 size={13}/> Reçu émis
          </span>
        ) : (
          <button onClick={handleRecu} disabled={loading}
            style={{ display:'inline-flex', alignItems:'center', gap:'5px', padding:'7px 14px', borderRadius:'8px', background: hov ? C.emerald : C.emeraldLight, border:`1.5px solid ${C.emerald}40`, color: hov ? C.white : C.emerald, fontSize:'12px', fontWeight:700, cursor: loading?'wait':'pointer', fontFamily:'"DM Sans",sans-serif', transition:'all .22s ease', opacity: loading ? .7:1 }}
            onMouseLeave={e=>{ e.currentTarget.style.background=C.emeraldLight; e.currentTarget.style.color=C.emerald; }}>
            {loading ? <><Loader2 size={12} style={{ animation:'spin 1s linear infinite' }}/> Génération…</> : <><Receipt size={12}/> Générer Reçu</>}
          </button>
        )}
      </td>
    </motion.tr>
  );
}

// ── Modal dépense ─────────────────────────────────────────────
// Props :
//   onClose    — ferme la modale
//   onSuccess  — appelé après enregistrement réussi (refresh stats)
//   actions    — liste des actions { id, titre } chargée par le parent
//   ldActions  — boolean : chargement actions en cours
function ModalDepense({ onClose, onSuccess, actions = [], ldActions = false }) {
  const [form,    setForm]    = useState({
    action_id:  '',       // ← nouveau champ
    motif:      '',
    montant:    '',
    date:       '',
    categorie:  'TRANSPORT',
  });
  const [fichier, setFichier] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);
  const today = new Date().toISOString().split('T')[0];
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async () => {
    // ── Validation ──────────────────────────────────────────
    if (!form.action_id)          { setError('Veuillez sélectionner une action associée (*).'); return; }
    if (!form.motif.trim())       { setError('Le motif / description est obligatoire (*).'); return; }
    if (!form.montant)            { setError('Le montant est obligatoire (*).'); return; }
    if (parseFloat(form.montant) <= 0) { setError('Le montant doit être supérieur à zéro.'); return; }
    if (!form.date)               { setError('La date est obligatoire (*).'); return; }

    setLoading(true); setError(null);
    try {
      // ── FormData (supporte le fichier justificatif) ────────
      const fd = new FormData();
      fd.append('action',        form.action_id);    // ← action_id envoyé au backend
      fd.append('description',   form.motif.trim());
      fd.append('montant',       form.montant);
      fd.append('date_depense',  form.date);
      fd.append('categorie',     form.categorie);
      if (fichier) fd.append('justificatif', fichier);

      await axios.post(API_DEPENSE, fd, {
        headers: { ...authHeader(), 'Content-Type': 'multipart/form-data' },
      });
      onSuccess?.();
      onClose();
    } catch (e) {
      const msg = e.response?.data
        ? Object.values(e.response.data).flat().join(' ')
        : 'Une erreur est survenue.';
      setError(msg);
    } finally { setLoading(false); }
  };

  // ── Styles réutilisables ──────────────────────────────────
  const IS = {
    width: '100%', padding: '11px 14px',
    border: `1.5px solid ${C.border}`, borderRadius: '10px',
    fontSize: '14px', fontFamily: '"DM Sans",sans-serif',
    color: C.azureDark, background: C.offWhite, outline: 'none',
    transition: 'border-color .2s,box-shadow .2s', boxSizing: 'border-box',
  };
  const fo = e => { e.target.style.borderColor = C.emerald; e.target.style.boxShadow = `0 0 0 3px ${C.emerald}18`; };
  const bl = e => { e.target.style.borderColor = C.border;  e.target.style.boxShadow = 'none'; };
  const LB = {
    display: 'block', fontFamily: '"DM Sans",sans-serif',
    fontSize: '11.5px', fontWeight: 700, color: C.muted,
    textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px',
  };

  return (
    <>
      {/* ── OVERLAY ─────────────────────────────────────────────
          Fond sombre couvrant tout l'écran — clic = fermeture.
          zIndex 1000 > navbar.
      ──────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        transition={{ duration: .2 }}
        onClick={onClose}
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(4px)',
          zIndex: 999,
        }}
      />

      {/* ── WRAPPER CENTRAGE ────────────────────────────────────
          <div> statique portant uniquement translate(-50%,-50%).
          Séparé du motion.div pour éviter le conflit entre
          Framer Motion (anime `transform`) et le centrage CSS.
      ──────────────────────────────────────────────────────── */}
      <div style={{
        position: 'fixed', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 1000,
        width: '90%', maxWidth: '500px',
      }}>
        <motion.div
          initial={{ opacity: 0, scale: .95 }}
          animate={{ opacity: 1, scale: 1   }}
          exit={{ opacity: 0, scale: .95 }}
          transition={{ duration: .28, ease: [0.22, 1, 0.36, 1] }}
          style={{
            background: C.white, borderRadius: '24px',
            boxShadow: '0 36px 80px rgba(0,0,0,.22)',
            maxHeight: '90vh',
            display: 'flex', flexDirection: 'column',
            overflow: 'hidden',
          }}
        >

          {/* En-tête — fixe, ne scroll pas ──────────────────── */}
          <div style={{ background: `linear-gradient(135deg,${C.emeraldDeep},${C.emerald})`, padding: '22px 26px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <div>
              <div style={{ fontFamily: '"DM Sans",sans-serif', fontSize: '10px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,.4)', marginBottom: '3px' }}>Trésorerie</div>
              <h3 style={{ fontFamily: '"Playfair Display",serif', fontSize: '1.25rem', fontWeight: 700, color: C.white, margin: 0 }}>Saisir une dépense</h3>
            </div>
            <button onClick={onClose}
              style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'rgba(255,255,255,.1)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: C.white, transition: 'background .2s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,.22)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,.1)'}>
              <X size={16} />
            </button>
          </div>

          {/* Corps scrollable ─────────────────────────────────── */}
          <div style={{ padding: '26px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '18px' }}>

            {/* ── 1. ACTION ASSOCIÉE ── nouveau champ en premier ── */}
            <div>
              <span style={LB}>
                Action associée *
                {ldActions && (
                  <span style={{ marginLeft: '8px', fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: C.mutedLight, fontSize: '11px' }}>
                    <Loader2 size={10} style={{ display: 'inline', animation: 'spin 1s linear infinite', marginRight: '3px' }} />
                    Chargement…
                  </span>
                )}
              </span>
              <select
                value={form.action_id}
                onChange={set('action_id')}
                onFocus={fo} onBlur={bl}
                disabled={ldActions}
                style={{
                  ...IS,
                  cursor: ldActions ? 'wait' : 'pointer',
                  opacity: ldActions ? .6 : 1,
                  // Indicateur visuel si aucune action sélectionnée
                  color: form.action_id ? C.azureDark : C.mutedLight,
                }}
              >
                <option value="" disabled>— Sélectionnez une action —</option>
                {actions.map(a => (
                  <option key={a.id} value={a.id} style={{ color: C.azureDark }}>
                    {a.titre}
                  </option>
                ))}
                {!ldActions && actions.length === 0 && (
                  <option value="" disabled>Aucune action disponible</option>
                )}
              </select>
              {/* Aide contextuelle */}
              <span style={{ fontFamily: '"DM Sans",sans-serif', fontSize: '11.5px', color: C.mutedLight, marginTop: '5px', display: 'block' }}>
                Associez cette dépense à un projet / action ININ.
              </span>
            </div>

            {/* ── 2. MOTIF ── */}
            <div>
              <span style={LB}>Motif / Description *</span>
              <input
                type="text"
                placeholder="Ex : Location salle atelier Dakar"
                value={form.motif}
                onChange={set('motif')} onFocus={fo} onBlur={bl}
                style={IS}
              />
            </div>

            {/* ── 3. CATÉGORIE ── */}
            <div>
              <span style={LB}>Catégorie *</span>
              <select value={form.categorie} onChange={set('categorie')} onFocus={fo} onBlur={bl} style={{ ...IS, cursor: 'pointer' }}>
                {CAT_DEPENSE.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
              </select>
            </div>

            {/* ── 4. MONTANT + DATE ── grille 2 colonnes ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <span style={LB}>Montant (FCFA) *</span>
                <input
                  type="number" min="0" step="100" placeholder="50 000"
                  value={form.montant}
                  onChange={set('montant')} onFocus={fo} onBlur={bl}
                  style={IS}
                />
              </div>
              <div>
                <span style={LB}>Date *</span>
                <input
                  type="date" max={today}
                  value={form.date}
                  onChange={set('date')} onFocus={fo} onBlur={bl}
                  style={IS}
                />
              </div>
            </div>

            {/* ── 5. JUSTIFICATIF ── */}
            <div>
              <span style={LB}>Justificatif — image ou PDF (max 5 Mo)</span>
              <label
                style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '13px 16px', border: `1.5px dashed ${fichier ? C.emerald : C.border}`, borderRadius: '10px', background: fichier ? C.emeraldLight : C.offWhite, cursor: 'pointer', transition: 'all .2s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = C.emerald}
                onMouseLeave={e => e.currentTarget.style.borderColor = fichier ? C.emerald : C.border}
              >
                <Upload size={16} style={{ color: fichier ? C.emerald : C.mutedLight, flexShrink: 0 }} />
                <span style={{ fontFamily: '"DM Sans",sans-serif', fontSize: '13.5px', color: fichier ? C.emerald : C.mutedLight, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {fichier ? fichier.name : 'Cliquez pour sélectionner un fichier…'}
                </span>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.webp"
                  style={{ display: 'none' }}
                  onChange={e => setFichier(e.target.files?.[0] ?? null)}
                />
              </label>
              {fichier && (
                <button
                  onClick={() => setFichier(null)}
                  style={{ marginTop: '6px', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: C.danger, background: 'none', border: 'none', cursor: 'pointer', fontFamily: '"DM Sans",sans-serif', fontWeight: 600 }}
                >
                  <X size={11} /> Supprimer le fichier
                </button>
              )}
            </div>

            {/* ── ERREUR ── */}
            {error && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '12px 14px', borderRadius: '10px', background: C.dangerBg, border: `1px solid ${C.danger}30` }}>
                <AlertCircle size={15} style={{ color: C.danger, flexShrink: 0, marginTop: '1px' }} />
                <span style={{ fontFamily: '"DM Sans",sans-serif', fontSize: '13px', color: C.danger }}>{error}</span>
              </div>
            )}
          </div>

          {/* Pied — fixe, ne scroll pas ───────────────────────── */}
          <div style={{ padding: '16px 26px', borderTop: `1px solid ${C.border}`, display: 'flex', gap: '10px', justifyContent: 'flex-end', flexShrink: 0 }}>
            <button
              onClick={onClose}
              style={{ padding: '10px 20px', borderRadius: '100px', border: `1.5px solid ${C.border}`, background: C.white, color: C.muted, fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: '"DM Sans",sans-serif' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = C.muted}
              onMouseLeave={e => e.currentTarget.style.borderColor = C.border}
            >
              Annuler
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              style={{ padding: '10px 24px', borderRadius: '100px', border: 'none', background: loading ? C.emeraldMid : `linear-gradient(135deg,${C.emeraldDark},${C.emerald})`, color: loading ? C.emerald : C.white, fontSize: '13px', fontWeight: 700, cursor: loading ? 'wait' : 'pointer', fontFamily: '"DM Sans",sans-serif', boxShadow: loading ? 'none' : `0 4px 16px ${C.emerald}40`, transition: 'all .22s', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              {loading
                ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> Enregistrement…</>
                : <><CheckCircle2 size={13} /> Enregistrer la dépense</>
              }
            </button>
          </div>

        </motion.div>
      </div>{/* fin wrapper centrage */}
    </>
  );
}


// ════════════════════════════════════════════════════════════
// MODAL DON ─ Enregistrer un don
// ════════════════════════════════════════════════════════════
function ModalDon({ onClose, onSuccess, membres = [] }) {
  const [form, setForm]     = useState({ montant:'', mode:'VIREMENT', membre_id:'' });
  const [loading, setLoad]  = useState(false);
  const [error, setError]   = useState(null);
  const set = k => e => setForm(p => ({ ...p, [k]:e.target.value }));
  const IS  = IS_shared(C.azure);
  const fo  = fo_shared(C.azure);
  const bl  = bl_shared();

  const submit = async () => {
    if (!form.montant || parseFloat(form.montant) <= 0) { setError('Montant invalide.'); return; }
    setLoad(true); setError(null);
    try {
      const payload = { montant: form.montant, mode_paiement: form.mode };
      if (form.membre_id) payload.membre = form.membre_id;
      await axios.post(API_DONS, payload, { headers: authHeader() });
      onSuccess?.(); onClose();
    } catch(e) {
      setError(e.response?.data ? Object.values(e.response.data).flat().join(' ') : 'Erreur serveur.');
    } finally { setLoad(false); }
  };

  return (
    <ModalShell onClose={onClose}>
      <ModalHeader eyebrow="Comptabilité" title="Enregistrer un don"
        gradient={`linear-gradient(135deg,#0f172a,${C.azure})`} onClose={onClose}/>

      <div style={{ padding:'24px', overflowY:'auto', display:'flex', flexDirection:'column', gap:'16px' }}>
        {/* Montant */}
        <div>
          <span style={LBs}>Montant (FCFA) *</span>
          <input type="number" min="0" step="500" placeholder="Ex : 25 000"
            value={form.montant} onChange={set('montant')} onFocus={fo} onBlur={bl} style={IS}/>
        </div>

        {/* Mode paiement */}
        <div>
          <span style={LBs}>Mode de paiement *</span>
          <select value={form.mode} onChange={set('mode')} onFocus={fo} onBlur={bl}
            style={{ ...IS, cursor:'pointer' }}>
            {Object.entries(MODE_CFG).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>

        {/* Membre lié (optionnel) */}
        <div>
          <span style={LBs}>Membre associé <span style={{ fontWeight:400, textTransform:'none', letterSpacing:0 }}>(optionnel)</span></span>
          <select value={form.membre_id} onChange={set('membre_id')} onFocus={fo} onBlur={bl}
            style={{ ...IS, cursor:'pointer', color: form.membre_id ? C.azureDark : C.mutedLight }}>
            <option value="">— Don anonyme ou externe —</option>
            {membres.map(m => <option key={m.id} value={m.id}>{m.display}</option>)}
          </select>
          <span style={{ fontFamily:'"DM Sans",sans-serif', fontSize:'11.5px', color:C.mutedLight, marginTop:'4px', display:'block' }}>
            Laissez vide pour un don anonyme ou d'une personne extérieure.
          </span>
        </div>

        {error && (
          <div style={{ display:'flex', gap:'8px', padding:'12px 14px', borderRadius:'10px', background:C.dangerBg, border:`1px solid ${C.danger}30` }}>
            <AlertCircle size={14} style={{ color:C.danger, flexShrink:0, marginTop:'1px' }}/>
            <span style={{ fontFamily:'"DM Sans",sans-serif', fontSize:'13px', color:C.danger }}>{error}</span>
          </div>
        )}
      </div>

      <ModalFooter onClose={onClose} onSubmit={submit} loading={loading}
        label={<><CheckCircle2 size={13}/> Enregistrer le don</>}
        color={C.azure}/>
    </ModalShell>
  );
}

// ════════════════════════════════════════════════════════════
// MODAL COTISATION ─ Payer une cotisation
// ════════════════════════════════════════════════════════════
function ModalCotisation({ onClose, onSuccess, userId }) {
  const [form, setForm]    = useState({ montant:'10000', annee:String(new Date().getFullYear()), mode:'VIREMENT' });
  const [loading, setLoad] = useState(false);
  const [error, setError]  = useState(null);
  const set = k => e => setForm(p => ({ ...p, [k]:e.target.value }));
  const IS  = IS_shared(C.cyanDark);
  const fo  = fo_shared(C.cyanDark);
  const bl  = bl_shared();

  const submit = async () => {
    if (!form.montant || parseFloat(form.montant) <= 0) { setError('Montant invalide.'); return; }
    setLoad(true); setError(null);
    try {
      await axios.post(API_COTISATION, {
        montant: form.montant, annee: parseInt(form.annee),
        mode_paiement: form.mode,
        ...(userId ? { membre: userId } : {}),
      }, { headers: authHeader() });
      onSuccess?.(); onClose();
    } catch(e) {
      setError(e.response?.data ? Object.values(e.response.data).flat().join(' ') : 'Erreur serveur.');
    } finally { setLoad(false); }
  };

  return (
    <ModalShell onClose={onClose}>
      <ModalHeader eyebrow="Adhésion" title="Payer ma cotisation"
        gradient={`linear-gradient(135deg,${C.emeraldDeep},${C.cyanDark})`} onClose={onClose}/>

      <div style={{ padding:'24px', overflowY:'auto', display:'flex', flexDirection:'column', gap:'16px' }}>
        {/* Année */}
        <div>
          <span style={LBs}>Période concernée *</span>
          <select value={form.annee} onChange={set('annee')} onFocus={fo} onBlur={bl}
            style={{ ...IS, cursor:'pointer' }}>
            {ANNEES_COTIS.map(a => (
              <option key={a} value={String(a)}>
                {a === new Date().getFullYear() ? `${a} — Année en cours` : String(a)}
              </option>
            ))}
          </select>
        </div>

        {/* Montant */}
        <div>
          <span style={LBs}>Montant (FCFA) *</span>
          <input type="number" min="0" step="500"
            value={form.montant} onChange={set('montant')} onFocus={fo} onBlur={bl} style={IS}/>
          <span style={{ fontFamily:'"DM Sans",sans-serif', fontSize:'11.5px', color:C.mutedLight, marginTop:'4px', display:'block' }}>
            Montant standard : 10 000 FCFA / an.
          </span>
        </div>

        {/* Mode paiement */}
        <div>
          <span style={LBs}>Mode de paiement *</span>
          <select value={form.mode} onChange={set('mode')} onFocus={fo} onBlur={bl}
            style={{ ...IS, cursor:'pointer' }}>
            {Object.entries(MODE_CFG).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>

        {error && (
          <div style={{ display:'flex', gap:'8px', padding:'12px 14px', borderRadius:'10px', background:C.dangerBg, border:`1px solid ${C.danger}30` }}>
            <AlertCircle size={14} style={{ color:C.danger, flexShrink:0, marginTop:'1px' }}/>
            <span style={{ fontFamily:'"DM Sans",sans-serif', fontSize:'13px', color:C.danger }}>{error}</span>
          </div>
        )}
      </div>

      <ModalFooter onClose={onClose} onSubmit={submit} loading={loading}
        label={<><CreditCard size={13}/> Valider le paiement</>}
        color={C.cyanDark}/>
    </ModalShell>
  );
}


// ════════════════════════════════════════════════════════════
// SECTION COTISATIONS — gestion par le trésorier
// ════════════════════════════════════════════════════════════

// ── Modale : historique + ajout cotisation pour un membre ───
function ModalCotisationsMembre({ membre, onClose, onDemandeAjout }) {
  // ── Même logique d'affichage que DashboardMembre / ModaleCotisations ──
  // On génère TOUS les mois depuis l'ouverture de l'asso (sept 2025),
  // puis on marque chacun payé/impayé selon les données du backend.
  const [cotisations, setCotis] = useState([]);
  const [loading, setLoad]      = useState(true);
  const [error, setError]       = useState(null);

  const fetchHistorique = useCallback(async () => {
    setLoad(true); setError(null);
    try {
      // ✅ Filtre par membre_id (nom du param dans CotisationViewSet.get_queryset)
      const { data } = await axios.get(
        `${API_COTISATION}?membre_id=${membre.id}`,
        { headers: authHeader() }
      );
      setCotis(data.results ?? data);
    } catch {
      setError("Impossible de charger l'historique.");
    } finally { setLoad(false); }
  }, [membre.id]);

  useEffect(() => { fetchHistorique(); }, [fetchHistorique]);

  // ── Construire la map payesMap : "Septembre 2025" → true/false ──
  // Le backend renvoie c.mois (string ex: "Septembre" ou entier 9) + c.annee
  const MOIS_FR = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
  const tousLesMois = genererMoisDepuisDebut();

  const payesMap = {};
  cotisations.forEach(c => {
    // ✅ Le backend retourne periode_concernee: "Octobre 2025"
    //    (pas de champs mois/annee séparés)
    const periode = c.periode_concernee ?? '';
    const estPaye = c.statut === 'PAYE' || c.statut === 'PAYEE' || c.paye === true;
    if (periode) {
      payesMap[periode.trim()] = {
        paye:    estPaye,
        montant: c.montant,
        mode:    c.mode_paiement,
        date:    c.date_paiement ?? c.date_creation,
      };
    }
  });

  const nbPayes   = tousLesMois.filter(m => payesMap[m]?.paye === true).length;
  const nbImpayes = tousLesMois.length - nbPayes;

  return (
    <ModalShell onClose={onClose} maxWidth="520px">

      {/* ── Header ── */}
      <div style={{ background:`linear-gradient(135deg,${C.emeraldDeep},${C.cyanDark})`, padding:'20px 24px', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
          <div style={{ width:'36px', height:'36px', borderRadius:'10px', background:'rgba(255,255,255,.15)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <CreditCard size={16} style={{ color:C.white }}/>
          </div>
          <div>
            <div style={{ fontFamily:'"DM Sans",sans-serif', fontSize:'10px', fontWeight:700, letterSpacing:'.18em', textTransform:'uppercase', color:'rgba(255,255,255,.5)', marginBottom:'2px' }}>Gestion cotisations</div>
            <h3 style={{ fontFamily:'"Playfair Display",serif', fontSize:'1.1rem', fontWeight:700, color:C.white, margin:0 }}>{membre.display}</h3>
          </div>
        </div>
        <button onClick={onClose} style={{ width:'32px', height:'32px', borderRadius:'50%', background:'rgba(255,255,255,.12)', border:'none', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:C.white }}
          onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,.25)'}
          onMouseLeave={e=>e.currentTarget.style.background='rgba(255,255,255,.12)'}>
          <X size={14}/>
        </button>
      </div>

      {/* ── Barre : résumé + bouton Ajouter ── */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 24px', borderBottom:`1px solid ${C.border}`, flexShrink:0, gap:'12px', flexWrap:'wrap' }}>
        <div style={{ fontFamily:'"DM Sans",sans-serif', fontSize:'12.5px', color:C.muted }}>
          {loading ? 'Chargement…' : `Depuis septembre 2025`}
        </div>
        <button onClick={() => onDemandeAjout?.()}
          style={{ display:'inline-flex', alignItems:'center', gap:'5px', padding:'7px 14px', borderRadius:'100px', background:`linear-gradient(135deg,${C.emerald},${C.cyanDark})`, color:C.white, border:'none', fontSize:'12px', fontWeight:700, cursor:'pointer', fontFamily:'"DM Sans",sans-serif', boxShadow:`0 4px 12px ${C.emerald}40`, transition:'all .2s' }}
          onMouseEnter={e=>{ e.currentTarget.style.transform='translateY(-1px)'; e.currentTarget.style.boxShadow=`0 7px 18px ${C.emerald}55`; }}
          onMouseLeave={e=>{ e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow=`0 4px 12px ${C.emerald}40`; }}>
          <Plus size={12} strokeWidth={2.5}/> Nouvelle cotisation
        </button>
      </div>

      {/* ── KPI résumé (masqué pendant chargement) ── */}
      {!loading && !error && (
        <div style={{ display:'flex', gap:'10px', padding:'14px 24px', borderBottom:`1px solid ${C.border}`, flexShrink:0 }}>
          <div style={{ flex:1, background:C.successBg, borderRadius:'10px', padding:'10px 14px', border:`1px solid ${C.success}20` }}>
            <div style={{ fontFamily:'"Playfair Display",serif', fontSize:'1.5rem', fontWeight:800, color:C.success, lineHeight:1 }}>{nbPayes}</div>
            <div style={{ fontFamily:'"DM Sans",sans-serif', fontSize:'10px', color:C.success, fontWeight:700, marginTop:'2px', textTransform:'uppercase', letterSpacing:'.07em' }}>Payé{nbPayes>1?'s':''}</div>
          </div>
          <div style={{ flex:1, background: nbImpayes>0 ? C.dangerBg : C.offWhite, borderRadius:'10px', padding:'10px 14px', border:`1px solid ${nbImpayes>0 ? `${C.danger}20` : C.border}` }}>
            <div style={{ fontFamily:'"Playfair Display",serif', fontSize:'1.5rem', fontWeight:800, color: nbImpayes>0 ? C.danger : C.muted, lineHeight:1 }}>{nbImpayes}</div>
            <div style={{ fontFamily:'"DM Sans",sans-serif', fontSize:'10px', color: nbImpayes>0 ? C.danger : C.muted, fontWeight:700, marginTop:'2px', textTransform:'uppercase', letterSpacing:'.07em' }}>Impayé{nbImpayes>1?'s':''}</div>
          </div>
          <div style={{ flex:1, background:C.azureLight, borderRadius:'10px', padding:'10px 14px', border:`1px solid ${C.azure}20` }}>
            <div style={{ fontFamily:'"Playfair Display",serif', fontSize:'1.5rem', fontWeight:800, color:C.azure, lineHeight:1 }}>{tousLesMois.length}</div>
            <div style={{ fontFamily:'"DM Sans",sans-serif', fontSize:'10px', color:C.azure, fontWeight:700, marginTop:'2px', textTransform:'uppercase', letterSpacing:'.07em' }}>Total</div>
          </div>
        </div>
      )}

      {/* ── Corps : liste TOUS les mois (payés + impayés) ── */}
      <div style={{ overflowY:'auto', flex:1 }}>
        {loading ? (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', padding:'48px 24px', color:C.muted, fontFamily:'"DM Sans",sans-serif', fontSize:'13px' }}>
            <Loader2 size={16} style={{ animation:'spin 1s linear infinite', color:C.cyanDark }}/> Chargement…
          </div>
        ) : error ? (
          <div style={{ padding:'40px 24px', textAlign:'center', color:C.danger, fontFamily:'"DM Sans",sans-serif', fontSize:'13px' }}>{error}</div>
        ) : (
          tousLesMois.map((mois, i) => {
            const entry  = payesMap[mois];
            const paye   = entry?.paye === true;
            return (
              <div key={mois} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 24px', background: i%2===0 ? 'transparent' : C.offWhite, borderBottom: i < tousLesMois.length-1 ? `1px solid ${C.border}` : 'none' }}>

                {/* Point + mois */}
                <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                  <div style={{ width:'8px', height:'8px', borderRadius:'50%', flexShrink:0, background: paye ? C.success : C.danger, boxShadow: paye ? `0 0 0 3px ${C.success}22` : `0 0 0 3px ${C.danger}22` }}/>
                  <div>
                    <div style={{ fontFamily:'"DM Sans",sans-serif', fontSize:'13.5px', fontWeight:600, color:C.azureDark }}>{mois}</div>
                    {paye && entry?.mode && (
                      <div style={{ fontFamily:'"DM Sans",sans-serif', fontSize:'11px', color:C.mutedLight, marginTop:'1px' }}>
                        {MODE_CFG[entry.mode]?.label ?? entry.mode}
                        {entry.montant ? ` · ${fmt(entry.montant)}` : ''}
                        {entry.date ? ` · ${fmtDate(entry.date)}` : ''}
                      </div>
                    )}
                  </div>
                </div>

                {/* Badge statut */}
                <span style={{ display:'inline-flex', alignItems:'center', gap:'4px', fontFamily:'"DM Sans",sans-serif', fontSize:'11px', fontWeight:700, color: paye ? C.success : C.danger, background: paye ? C.successBg : C.dangerBg, border:`1px solid ${paye ? `${C.success}30` : `${C.danger}30`}`, borderRadius:'100px', padding:'3px 10px', whiteSpace:'nowrap' }}>
                  {paye ? <><CheckCircle2 size={11}/> Payée</> : <><AlertCircle size={11}/> Impayée</>}
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* ── Pied ── */}
      <div style={{ padding:'14px 24px', borderTop:`1px solid ${C.border}`, display:'flex', justifyContent:'flex-end', flexShrink:0 }}>
        <button onClick={onClose}
          style={{ padding:'9px 22px', borderRadius:'100px', border:`1.5px solid ${C.border}`, background:C.white, color:C.muted, fontSize:'13px', fontWeight:600, cursor:'pointer', fontFamily:'"DM Sans",sans-serif', transition:'border-color .2s' }}
          onMouseEnter={e=>e.currentTarget.style.borderColor=C.muted}
          onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>
          Fermer
        </button>
      </div>

    </ModalShell>
  );
}
// ── Modale : ajouter une cotisation pour un membre ───────────
function ModalCotisationAjout({ membre, onClose, onSuccess }) {
  const [form, setForm]   = useState({
    annee:   String(new Date().getFullYear()),
    montant: '10000',
    mode:    'VIREMENT',
    date:    new Date().toISOString().slice(0, 10),
    mois:    '',
  });
  const [loading, setLoad] = useState(false);
  const [error, setError]  = useState(null);
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const IS  = IS_shared(C.cyanDark);
  const fo  = fo_shared(C.cyanDark);
  const bl  = bl_shared();

  const submit = async () => {
    if (!form.montant || parseFloat(form.montant) <= 0) { setError('Montant invalide.'); return; }
    if (!form.date) { setError('La date de paiement est obligatoire.'); return; }
    setLoad(true); setError(null);
    try {
      // ── Construire la période concernée : "Octobre 2025" ──────────────────
      const MOIS_FR_P = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
      const periodeLabel = form.mois
        ? `${form.mois} ${form.annee}`
        : `Année ${form.annee}`;

      const payload = {
        membre_id:         membre.id,  // ✅ DRF attend membre_id (PrimaryKeyRelatedField)
        montant:           parseFloat(form.montant),
        mode_paiement:     form.mode,
        date_paiement:     form.date,
        statut:            'PAYEE',          // valeur exacte retournée par l'API
        periodicite:       form.mois ? 'MENSUELLE' : 'ANNUELLE',
        periode_concernee: periodeLabel,     // ✅ champ réel du backend
        annee:             parseInt(form.annee),
        ...(form.mois ? { mois: form.mois } : {}),
      };
      console.log('[Cotisation] Payload envoyé :', payload);
      await axios.post(API_COTISATION, payload, { headers: authHeader() });
      onSuccess?.();
    } catch (e) {
      // Log complet pour diagnostic
      console.error('[Cotisation] Erreur POST :', e.response?.data);
      const errData = e.response?.data;
      const msg = errData
        ? (typeof errData === 'string' ? errData : Object.entries(errData).map(([k,v]) => `${k}: ${Array.isArray(v)?v.join(', '):v}`).join(' | '))
        : 'Erreur serveur.';
      setError(msg);
    } finally { setLoad(false); }
  };

  return (
    <ModalShell onClose={onClose} maxWidth="480px">
      <ModalHeader
        eyebrow={`Cotisation — ${membre.display}`}
        title="Nouvelle cotisation"
        gradient={`linear-gradient(135deg,${C.emeraldDeep},${C.cyanDark})`}
        onClose={onClose}
      />
      <div style={{ padding:'22px 24px', overflowY:'auto', display:'flex', flexDirection:'column', gap:'14px' }}>

        {error && (
          <div style={{ display:'flex', gap:'8px', padding:'11px 13px', borderRadius:'9px', background:C.dangerBg, border:`1px solid ${C.danger}30` }}>
            <AlertCircle size={13} style={{ color:C.danger, flexShrink:0, marginTop:'1px' }}/>
            <span style={{ fontFamily:'"DM Sans",sans-serif', fontSize:'12.5px', color:C.danger }}>{error}</span>
          </div>
        )}

        {/* Membre — lecture seule */}
        <div>
          <span style={LBs}>Membre</span>
          <div style={{ ...IS, background:'#f1f5f9', color:C.muted, cursor:'not-allowed', display:'flex', alignItems:'center', gap:'8px' }}>
            <Users size={13} style={{ color:C.mutedLight, flexShrink:0 }}/>{membre.display}
          </div>
        </div>

        {/* Année */}
        <div>
          <span style={LBs}>Année *</span>
          <select value={form.annee} onChange={set('annee')} onFocus={fo} onBlur={bl}
            style={{ ...IS, cursor:'pointer' }}>
            {ANNEES_COTIS.map(a => (
              <option key={a} value={String(a)}>
                {a === new Date().getFullYear() ? `${a} — Année en cours` : String(a)}
              </option>
            ))}
          </select>
        </div>

        {/* Mois (optionnel) */}
        <div>
          <span style={LBs}>Mois <span style={{ fontWeight:400, textTransform:'none', letterSpacing:0 }}>(optionnel)</span></span>
          <select value={form.mois} onChange={set('mois')} onFocus={fo} onBlur={bl}
            style={{ ...IS, cursor:'pointer', color: form.mois ? C.azureDark : C.mutedLight }}>
            <option value="">— Cotisation annuelle (sans mois) —</option>
            {['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'].map((m, i) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        {/* Montant */}
        <div>
          <span style={LBs}>Montant (FCFA) *</span>
          <input type="number" min="0" step="500" value={form.montant} onChange={set('montant')} onFocus={fo} onBlur={bl} style={IS}/>
          <span style={{ fontFamily:'"DM Sans",sans-serif', fontSize:'11px', color:C.mutedLight, marginTop:'4px', display:'block' }}>Montant standard : 10 000 FCFA / an</span>
        </div>

        {/* Mode de paiement */}
        <div>
          <span style={LBs}>Mode de paiement *</span>
          <select value={form.mode} onChange={set('mode')} onFocus={fo} onBlur={bl}
            style={{ ...IS, cursor:'pointer' }}>
            {Object.entries(MODE_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>

        {/* Date de paiement */}
        <div>
          <span style={LBs}>Date de paiement *</span>
          <input type="date" value={form.date} onChange={set('date')} onFocus={fo} onBlur={bl} style={IS}/>
        </div>

      </div>
      <ModalFooter
        onClose={onClose} onSubmit={submit} loading={loading}
        label={<><CheckCircle2 size={13}/> Enregistrer la cotisation</>}
        color={C.emerald}
      />
    </ModalShell>
  );
}

// ── Section Cotisations — tableau des membres ────────────────
function SectionCotisations({ membres, ldMembres, onRefreshStats }) {
  const [recherche,     setRecherche]     = useState('');
  const [membreChoisi,  setMembreChoisi]  = useState(null); // { id, display } — modale historique
  const [showAjout,     setShowAjout]     = useState(false); // modale ajout cotisation
  const [summaries,     setSummaries]     = useState({});   // { [membreId]: { count, anneesCouvertes, aJour } }
  const [ldSummaries,   setLdSummaries]   = useState(false);

  // Charger un résumé allégé (1 requête globale, on regroupe côté frontend)
  const fetchSummaries = useCallback(async () => {
    if (!membres.length) return;
    setLdSummaries(true);
    try {
      const { data } = await axios.get(API_COTISATION, { headers: authHeader() });
      const liste = data.results ?? data;
      const anneeCourante = new Date().getFullYear();
      const map = {};
      liste.forEach(c => {
        // membre peut être un objet {id, nom, ...} ou directement un id
        const mid = c.membre?.id ?? c.membre ?? c.membre_id;
        if (!map[mid]) map[mid] = { count: 0, aJour: false };
        map[mid].count++;
        const estPaye = c.statut === 'PAYE' || c.statut === 'PAYEE' || c.paye === true;
        // periode_concernee ex: "Mars 2026" → vérifier si elle contient l'année courante
        const periodeAnnee = c.periode_concernee
          ? parseInt(c.periode_concernee.split(' ').pop())
          : c.annee;
        if (periodeAnnee === anneeCourante && estPaye) map[mid].aJour = true;
      });
      setSummaries(map);
    } catch { /* silencieux */ }
    finally { setLdSummaries(false); }
  }, [membres.length]);

  useEffect(() => { fetchSummaries(); }, [fetchSummaries]);

  const membresFiltres = membres.filter(m =>
    m.display.toLowerCase().includes(recherche.toLowerCase())
  );

  const anneeCourante = new Date().getFullYear();

  return (
    <>
      {/* ── Modale historique cotisations ── */}
      <AnimatePresence>
        {membreChoisi && !showAjout && (
          <ModalCotisationsMembre
            key={`cotis-${membreChoisi.id}`}
            membre={membreChoisi}
            onClose={() => setMembreChoisi(null)}
            onDemandeAjout={() => setShowAjout(true)}
          />
        )}
      </AnimatePresence>

      {/* ── Modale ajout cotisation (même niveau DOM = z-index correct) ── */}
      <AnimatePresence>
        {showAjout && membreChoisi && (
          <ModalCotisationAjout
            key={`ajout-${membreChoisi.id}`}
            membre={membreChoisi}
            onClose={() => setShowAjout(false)}
            onSuccess={() => {
              setShowAjout(false);
              fetchSummaries();
              onRefreshStats?.();
              // Rouvrir l'historique après ajout pour voir la nouvelle cotisation
              setMembreChoisi({ ...membreChoisi });
            }}
          />
        )}
      </AnimatePresence>

      <motion.div variants={fadeUp} style={{ background:C.white, borderRadius:'20px', border:`1.5px solid ${C.border}`, overflow:'hidden', boxShadow:'0 4px 24px rgba(0,0,0,.05)', marginBottom:'32px' }}>

        {/* En-tête */}
        <div style={{ padding:'20px 22px', borderBottom:`1px solid ${C.border}`, display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'12px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
            <div style={{ width:'34px', height:'34px', borderRadius:'10px', background:C.emeraldLight, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <CreditCard size={16} style={{ color:C.emerald }}/>
            </div>
            <div>
              <h3 style={{ fontFamily:'"Playfair Display",serif', fontSize:'1.05rem', fontWeight:700, color:C.azureDark, margin:0 }}>Cotisations des membres</h3>
              <p style={{ fontFamily:'"DM Sans",sans-serif', fontSize:'12px', color:C.muted, margin:0 }}>
                {ldMembres ? 'Chargement…' : `${membres.length} membre${membres.length > 1 ? 's' : ''}`}
              </p>
            </div>
          </div>

          {/* Barre de recherche */}
          <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'8px 13px', borderRadius:'10px', border:`1.5px solid ${C.border}`, background:C.offWhite, minWidth:'220px' }}>
            <Filter size={12} style={{ color:C.mutedLight, flexShrink:0 }}/>
            <input
              value={recherche} onChange={e => setRecherche(e.target.value)}
              placeholder="Rechercher un membre…"
              style={{ border:'none', background:'transparent', outline:'none', fontFamily:'"DM Sans",sans-serif', fontSize:'13px', color:C.azureDark, width:'100%' }}
            />
          </div>
        </div>

        {/* Tableau */}
        <div style={{ overflowX:'auto' }}>
          {ldMembres ? (
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', padding:'48px', color:C.muted, fontFamily:'"DM Sans",sans-serif', fontSize:'13px' }}>
              <Loader2 size={16} style={{ animation:'spin 1s linear infinite', color:C.emerald }}/> Chargement des membres…
            </div>
          ) : membresFiltres.length === 0 ? (
            <div style={{ padding:'48px', textAlign:'center', fontFamily:'"DM Sans",sans-serif', fontSize:'13px', color:C.muted }}>
              {recherche ? `Aucun membre ne correspond à « ${recherche} ».` : 'Aucun membre disponible.'}
            </div>
          ) : (
            <table style={{ borderCollapse:'collapse', width:'100%' }}>
              <thead>
                <tr style={{ background:C.offWhite }}>
                  {['Membre', `Cotisation ${anneeCourante}`, 'Historique', ''].map((h, i) => (
                    <th key={h + i} style={{ padding:'10px 18px', textAlign: i === 3 ? 'right' : 'left', fontFamily:'"DM Sans",sans-serif', fontSize:'10px', fontWeight:700, textTransform:'uppercase', letterSpacing:'.09em', color:C.muted, whiteSpace:'nowrap', borderBottom:`1.5px solid ${C.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {membresFiltres.map((m, i) => {
                  const sum      = summaries[m.id];
                  const aJour    = sum?.aJour ?? false;
                  const nbCotis  = sum?.count ?? 0;
                  const loaded   = !ldSummaries;
                  return (
                    <tr key={m.id}
                      style={{ background: i % 2 === 0 ? C.white : '#fafbfc', transition:'background .15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = C.offWhite}
                      onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? C.white : '#fafbfc'}
                    >
                      {/* Membre */}
                      <td style={{ padding:'12px 18px', borderBottom:`1px solid ${C.border}`, verticalAlign:'middle' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:'9px' }}>
                          <div style={{ width:'30px', height:'30px', borderRadius:'50%', background:`linear-gradient(135deg,${C.emerald},${C.cyanDark})`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                            <span style={{ fontFamily:'"DM Sans",sans-serif', fontSize:'10px', fontWeight:800, color:C.white }}>{m.display.slice(0, 2).toUpperCase()}</span>
                          </div>
                          <span style={{ fontFamily:'"DM Sans",sans-serif', fontSize:'13px', fontWeight:600, color:C.azureDark }}>{m.display}</span>
                        </div>
                      </td>

                      {/* Statut cotisation année courante */}
                      <td style={{ padding:'12px 18px', borderBottom:`1px solid ${C.border}`, verticalAlign:'middle' }}>
                        {!loaded ? (
                          <div style={{ width:'70px', height:'22px', borderRadius:'100px', background:C.border, animation:'pulse 1.4s ease-in-out infinite' }}/>
                        ) : (
                          <span style={{ display:'inline-flex', alignItems:'center', gap:'4px', padding:'4px 10px', borderRadius:'100px', background: aJour ? C.successBg : C.dangerBg, color: aJour ? C.success : C.danger, fontSize:'11px', fontWeight:700, fontFamily:'"DM Sans",sans-serif' }}>
                            {aJour ? <><CheckCircle2 size={10}/> À jour</> : <><AlertCircle size={10}/> En attente</>}
                          </span>
                        )}
                      </td>

                      {/* Historique */}
                      <td style={{ padding:'12px 18px', borderBottom:`1px solid ${C.border}`, verticalAlign:'middle' }}>
                        <span style={{ fontFamily:'"DM Sans",sans-serif', fontSize:'12px', color:C.muted }}>
                          {!loaded ? '…' : nbCotis === 0 ? 'Aucune cotisation' : `${nbCotis} cotisation${nbCotis > 1 ? 's' : ''}`}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ padding:'12px 18px', borderBottom:`1px solid ${C.border}`, verticalAlign:'middle', textAlign:'right' }}>
                        <button
                          onClick={() => setMembreChoisi(m)}
                          style={{ display:'inline-flex', alignItems:'center', gap:'5px', padding:'7px 13px', borderRadius:'8px', border:`1.5px solid ${C.border}`, background:C.offWhite, color:C.muted, fontSize:'12px', fontWeight:600, cursor:'pointer', fontFamily:'"DM Sans",sans-serif', transition:'all .2s' }}
                          onMouseEnter={e=>{ e.currentTarget.style.borderColor=C.emerald; e.currentTarget.style.color=C.emerald; e.currentTarget.style.background=C.emeraldLight; }}
                          onMouseLeave={e=>{ e.currentTarget.style.borderColor=C.border; e.currentTarget.style.color=C.muted; e.currentTarget.style.background=C.offWhite; }}
                        >
                          <Receipt size={11}/> Gérer
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </motion.div>
    </>
  );
}

// ════════════════════════════════════════════════════════════
// SECTION DÉPENSES ─ Tableau filtrable (60% de la grille)
// ════════════════════════════════════════════════════════════
// ModalModifierDepense — édition d'une dépense (montant non modifiable)
// ════════════════════════════════════════════════════════════
function ModalModifierDepense({ depense, actions = [], ldActions = false, onClose, onSuccess }) {
  const [form,    setForm]    = useState({
    action_id:   depense.action_id ?? '',
    description: depense.description ?? '',
    date:        depense.date_depense?.slice(0, 10) ?? '',
    categorie:   depense.categorie ?? 'TRANSPORT',
  });
  const [fichier, setFichier] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  useEffect(() => {
    const h = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);
  useEffect(() => { document.body.style.overflow = 'hidden'; return () => { document.body.style.overflow = ''; }; }, []);

  const handleSubmit = async () => {
    if (!form.description.trim()) { setError('La description est obligatoire.'); return; }
    if (!form.date)               { setError('La date est obligatoire.'); return; }
    setLoading(true); setError(null);
    try {
      const fd = new FormData();
      if (form.action_id) fd.append('action_id', parseInt(form.action_id, 10));
      fd.append('description', form.description.trim());
      fd.append('date_depense', form.date);
      fd.append('categorie',   form.categorie);
      if (fichier) fd.append('justificatif', fichier);
      await axios.patch(`${API_DEPENSE}${depense.id}/`, fd, { headers: authHeader() });
      onSuccess?.();
      onClose();
    } catch (e) {
      const msg = e.response?.data
        ? Object.values(e.response.data).flat().join(' ')
        : 'Une erreur est survenue.';
      setError(msg);
    } finally { setLoading(false); }
  };

  const IS = {
    width: '100%', padding: '11px 14px',
    border: `1.5px solid ${C.border}`, borderRadius: '10px',
    fontSize: '14px', fontFamily: '"DM Sans",sans-serif',
    color: C.azureDark, background: C.offWhite, outline: 'none',
    transition: 'border-color .2s,box-shadow .2s', boxSizing: 'border-box',
  };
  const fo = e => { e.target.style.borderColor = C.azure; e.target.style.boxShadow = `0 0 0 3px ${C.azure}18`; };
  const bl = e => { e.target.style.borderColor = C.border; e.target.style.boxShadow = 'none'; };
  const LB = { display:'block', fontFamily:'"DM Sans",sans-serif', fontSize:'11.5px', fontWeight:700, color:C.muted, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'6px' };

  return (
    <>
      <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
        onClick={onClose}
        style={{ position:'fixed', inset:0, background:'rgba(15,32,96,.55)', backdropFilter:'blur(4px)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:'20px' }}
      >
        <motion.div initial={{ opacity:0, scale:0.94, y:20 }} animate={{ opacity:1, scale:1, y:0 }} exit={{ opacity:0, scale:0.94, y:20 }}
          transition={{ duration:0.3, ease:[0.22,1,0.36,1] }}
          onClick={e => e.stopPropagation()}
          style={{ background:C.white, borderRadius:'22px', width:'100%', maxWidth:'560px', maxHeight:'90vh', overflow:'hidden', display:'flex', flexDirection:'column', boxShadow:'0 32px 80px rgba(15,32,96,.28)' }}
        >
          {/* Header */}
          <div style={{ background:`linear-gradient(135deg,${C.azureDeep},${C.azure})`, padding:'20px 24px', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
            <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
              <div style={{ width:'34px', height:'34px', borderRadius:'9px', background:'rgba(255,255,255,.15)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Edit3 size={15} style={{ color:C.white }}/>
              </div>
              <div>
                <h3 style={{ fontFamily:'"Playfair Display",serif', fontSize:'1.05rem', fontWeight:700, color:C.white, margin:0 }}>Modifier la dépense</h3>
                <p style={{ fontFamily:'"DM Sans",sans-serif', fontSize:'11px', color:'rgba(255,255,255,.55)', margin:0 }}>
                  Montant : <strong style={{ color:C.white }}>{fmt(depense.montant)}</strong> — non modifiable
                </p>
              </div>
            </div>
            <button onClick={onClose}
              style={{ width:'30px', height:'30px', borderRadius:'50%', border:'1px solid rgba(255,255,255,.2)', background:'rgba(255,255,255,.1)', color:C.white, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <X size={13}/>
            </button>
          </div>

          {/* Corps */}
          <div style={{ overflowY:'auto', padding:'22px', display:'flex', flexDirection:'column', gap:'14px', flex:1 }}>
            {error && (
              <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'10px 13px', borderRadius:'9px', background:C.dangerBg, border:`1px solid ${C.danger}30` }}>
                <AlertCircle size={13} style={{ color:C.danger, flexShrink:0 }}/>
                <span style={{ fontFamily:'"DM Sans",sans-serif', fontSize:'12.5px', color:C.danger }}>{error}</span>
              </div>
            )}

            {/* Montant — lecture seule */}
            <div>
              <label style={LB}>Montant (non modifiable)</label>
              <div style={{ ...IS, background:'#f1f5f9', color:C.mutedLight, cursor:'not-allowed', display:'flex', alignItems:'center', gap:'8px' }}>
                <DollarSign size={14} style={{ color:C.mutedLight, flexShrink:0 }}/>
                {fmt(depense.montant)}
              </div>
            </div>

            {/* Description */}
            <div>
              <label style={LB}>Description *</label>
              <textarea value={form.description} onChange={set('description')} onFocus={fo} onBlur={bl} rows={3}
                placeholder="Décrivez la dépense…"
                style={{ ...IS, resize:'vertical', minHeight:'80px', lineHeight:'1.6' }}/>
            </div>

            {/* Date */}
            <div>
              <label style={LB}>Date *</label>
              <input type="date" value={form.date} onChange={set('date')} onFocus={fo} onBlur={bl} style={IS}/>
            </div>

            {/* Catégorie */}
            <div>
              <label style={LB}>Catégorie</label>
              <select value={form.categorie} onChange={set('categorie')} onFocus={fo} onBlur={bl}
                style={{ ...IS, cursor:'pointer' }}>
                {CAT_DEPENSE.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
              </select>
            </div>

            {/* Action associée */}
            <div>
              <label style={LB}>Action associée {ldActions && <span style={{ fontWeight:400, textTransform:'none' }}>(chargement…)</span>}</label>
              <select value={form.action_id} onChange={set('action_id')} onFocus={fo} onBlur={bl}
                disabled={ldActions}
                style={{ ...IS, cursor: ldActions ? 'wait' : 'pointer', opacity: ldActions ? .6 : 1, color: form.action_id ? C.azureDark : C.mutedLight }}>
                <option value="">— Aucune action —</option>
                {actions.map(a => <option key={a.id} value={a.id}>{a.titre}</option>)}
              </select>
            </div>

            {/* Justificatif */}
            <div>
              <label style={LB}>Remplacer le justificatif</label>
              <input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp"
                onChange={e => setFichier(e.target.files?.[0] ?? null)}
                style={{ fontFamily:'"DM Sans",sans-serif', fontSize:'12.5px', color:C.muted, width:'100%' }}/>
              {depense.justificatif && !fichier && (
                <p style={{ fontFamily:'"DM Sans",sans-serif', fontSize:'11px', color:C.muted, marginTop:'4px' }}>
                  Fichier actuel : <a href={depense.justificatif} target="_blank" rel="noreferrer" style={{ color:C.azure }}>voir</a>
                </p>
              )}
            </div>
          </div>

          {/* Pied */}
          <div style={{ padding:'14px 22px', borderTop:`1.5px solid ${C.border}`, display:'flex', justifyContent:'flex-end', gap:'10px', flexShrink:0, background:C.offWhite }}>
            <button onClick={onClose} disabled={loading}
              style={{ padding:'9px 20px', borderRadius:'100px', border:`1.5px solid ${C.border}`, background:C.white, color:C.muted, fontSize:'13px', fontWeight:600, cursor:'pointer', fontFamily:'"DM Sans",sans-serif', opacity: loading ? .6 : 1 }}>
              Annuler
            </button>
            <button onClick={handleSubmit} disabled={loading}
              style={{ display:'inline-flex', alignItems:'center', gap:'7px', padding:'9px 22px', borderRadius:'100px', border:'none', background: loading ? C.mutedLight : `linear-gradient(135deg,${C.azure},${C.cyanDark})`, color:C.white, fontSize:'13px', fontWeight:700, cursor: loading ? 'wait' : 'pointer', fontFamily:'"DM Sans",sans-serif', boxShadow: loading ? 'none' : `0 4px 14px ${C.azure}40`, transition:'all .2s' }}>
              {loading ? <><Loader2 size={13} style={{ animation:'spin 1s linear infinite' }}/> Enregistrement…</> : <><Save size={13}/> Enregistrer</>}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </>
  );
}

// ════════════════════════════════════════════════════════════
function SectionDepenses({ actions, ldActions = false }) {
  const [depenses, setDep]        = useState([]);
  const [loading, setLoad]        = useState(true);
  const [error, setError]         = useState(null);
  const [filtreAction, setFA]     = useState('');
  const [depenseAModifier, setDM] = useState(null); // ✅ dépense en cours d'édition

  const fetch = useCallback(async () => {
    setLoad(true); setError(null);
    try {
      const url = filtreAction
        ? `${API_DEPENSE}?action_id=${filtreAction}`
        : API_DEPENSE;
      const { data } = await axios.get(url, { headers:authHeader() });
      setDep(data.results ?? data);
    } catch { setError('Impossible de charger les dépenses.'); }
    finally  { setLoad(false); }
  }, [filtreAction]);

  useEffect(() => { fetch(); }, [fetch]);

  const IS  = IS_shared(C.danger);
  const fo  = fo_shared(C.danger);
  const bl  = bl_shared();

  return (
    <>
    {/* ✅ Modale modification */}
    <AnimatePresence>
      {depenseAModifier && (
        <ModalModifierDepense
          key={`edit-${depenseAModifier.id}`}
          depense={depenseAModifier}
          actions={actions}
          ldActions={ldActions}
          onClose={() => setDM(null)}
          onSuccess={() => { setDM(null); fetch(); }}
        />
      )}
    </AnimatePresence>

    <motion.div variants={fadeUp} style={{ background:C.white, borderRadius:'20px', border:`1.5px solid ${C.border}`, overflow:'hidden', boxShadow:'0 4px 24px rgba(0,0,0,.05)', display:'flex', flexDirection:'column' }}>

      {/* En-tête section */}
      <div style={{ padding:'20px 22px 0', borderBottom:`1px solid ${C.border}` }}>
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:'12px', marginBottom:'16px' }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'3px' }}>
              <div style={{ width:'32px', height:'32px', borderRadius:'10px', background:C.dangerBg, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <TrendingDown size={16} style={{ color:C.danger }}/>
              </div>
              <h3 style={{ fontFamily:'"Playfair Display",serif', fontSize:'1.1rem', fontWeight:700, color:C.azureDark, margin:0 }}>Les Dépenses</h3>
            </div>
            <p style={{ fontFamily:'"DM Sans",sans-serif', fontSize:'12.5px', color:C.muted, margin:0 }}>
              {loading ? '…' : `${depenses.length} dépense${depenses.length>1?'s':''}`}
            </p>
          </div>
          <button onClick={fetch}
            style={{ display:'inline-flex', alignItems:'center', gap:'5px', padding:'7px 12px', borderRadius:'8px', border:`1.5px solid ${C.border}`, background:C.white, color:C.muted, fontSize:'12px', fontWeight:600, cursor:'pointer', fontFamily:'"DM Sans",sans-serif', transition:'all .2s' }}
            onMouseEnter={e=>{ e.currentTarget.style.borderColor=C.danger; e.currentTarget.style.color=C.danger; }}
            onMouseLeave={e=>{ e.currentTarget.style.borderColor=C.border; e.currentTarget.style.color=C.muted; }}>
            <RefreshCw size={11}/> Actualiser
          </button>
        </div>

        {/* Filtre par action */}
        <div style={{ display:'flex', alignItems:'center', gap:'8px', paddingBottom:'14px' }}>
          <Filter size={13} style={{ color:C.mutedLight, flexShrink:0 }}/>
          <select value={filtreAction} onChange={e=>setFA(e.target.value)} onFocus={fo} onBlur={bl}
            style={{ ...IS, padding:'8px 12px', fontSize:'12.5px', cursor:'pointer' }}>
            <option value="">Toutes les actions</option>
            {actions.map(a => <option key={a.id} value={a.id}>{a.titre}</option>)}
          </select>
        </div>
      </div>

      {/* Corps tableau */}
      <div style={{ overflowX:'auto', flex:1 }}>
        {loading ? (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', padding:'40px', color:C.muted, fontSize:'13px', fontFamily:'"DM Sans",sans-serif' }}>
            <Loader2 size={16} style={{ animation:'spin 1s linear infinite', color:C.danger }}/> Chargement…
          </div>
        ) : error ? (
          <div style={{ padding:'40px', textAlign:'center', color:C.danger, fontFamily:'"DM Sans",sans-serif', fontSize:'13px' }}>{error}</div>
        ) : depenses.length === 0 ? (
          <div style={{ padding:'50px', textAlign:'center', display:'flex', flexDirection:'column', alignItems:'center', gap:'10px' }}>
            <div style={{ width:'48px', height:'48px', borderRadius:'50%', background:C.dangerBg, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <TrendingDown size={20} style={{ color:C.danger }}/>
            </div>
            <p style={{ fontFamily:'"DM Sans",sans-serif', fontSize:'13px', color:C.muted, margin:0 }}>
              {filtreAction ? 'Aucune dépense pour cette action.' : 'Aucune dépense enregistrée.'}
            </p>
          </div>
        ) : (
          <table style={{ borderCollapse:'collapse', width:'100%' }}>
            <thead>
              <tr style={{ background:C.offWhite }}>
                {['Date','Action','Description','Montant','Statut',''].map((h,i) => (
                  <th key={h+i} style={{ padding:'10px 14px', textAlign: i>=3?'right':'left', fontFamily:'"DM Sans",sans-serif', fontSize:'10.5px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.09em', color:C.muted, whiteSpace:'nowrap', borderBottom:`1.5px solid ${C.border}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {depenses.map((dep, i) => {
                const st  = STATUT_DEP[dep.statut] ?? STATUT_DEP.EN_ATTENTE;
                const StIcon = st.Icon;
                return (
                  <tr key={dep.id}
                    style={{ background: i%2===0 ? C.white : '#fafbfc', transition:'background .15s' }}
                    onMouseEnter={e=>e.currentTarget.style.background=C.offWhite}
                    onMouseLeave={e=>e.currentTarget.style.background=i%2===0?C.white:'#fafbfc'}>
                    {/* Date */}
                    <td style={{ padding:'11px 14px', borderBottom:`1px solid ${C.border}`, verticalAlign:'middle', whiteSpace:'nowrap' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:'5px', fontFamily:'"DM Sans",sans-serif', fontSize:'12px', color:C.muted }}>
                        <Calendar size={11} style={{ color:C.mutedLight }}/>{fmtDate(dep.date_depense)}
                      </div>
                    </td>
                    {/* Action */}
                    <td style={{ padding:'11px 14px', borderBottom:`1px solid ${C.border}`, verticalAlign:'middle', maxWidth:'120px' }}>
                      <span style={{ fontFamily:'"DM Sans",sans-serif', fontSize:'12px', color:C.azure, fontWeight:600, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', display:'block' }}>
                        {dep.action_titre ?? dep.action?.titre ?? '—'}
                      </span>
                    </td>
                    {/* Description */}
                    <td style={{ padding:'11px 14px', borderBottom:`1px solid ${C.border}`, verticalAlign:'middle', maxWidth:'160px' }}>
                      <span style={{ fontFamily:'"DM Sans",sans-serif', fontSize:'12.5px', color:C.azureDark, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', display:'block' }}>
                        {dep.description ?? '—'}
                      </span>
                    </td>
                    {/* Montant */}
                    <td style={{ padding:'11px 14px', borderBottom:`1px solid ${C.border}`, verticalAlign:'middle', textAlign:'right', whiteSpace:'nowrap' }}>
                      <span style={{ fontFamily:'"Playfair Display",serif', fontSize:'13px', fontWeight:800, color:C.danger }}>{fmt(dep.montant)}</span>
                    </td>
                    {/* Statut */}
                    <td style={{ padding:'11px 14px', borderBottom:`1px solid ${C.border}`, verticalAlign:'middle', textAlign:'right' }}>
                      <span style={{ display:'inline-flex', alignItems:'center', gap:'4px', padding:'3px 10px', borderRadius:'100px', background:st.bg, color:st.color, fontSize:'11px', fontWeight:700, fontFamily:'"DM Sans",sans-serif', whiteSpace:'nowrap' }}>
                        <StIcon size={10}/>{st.label}
                      </span>
                    </td>
                    {/* ✅ Bouton Modifier */}
                    <td style={{ padding:'11px 14px', borderBottom:`1px solid ${C.border}`, verticalAlign:'middle', textAlign:'right', whiteSpace:'nowrap' }}>
                      <button
                        onClick={() => setDM(dep)}
                        style={{ display:'inline-flex', alignItems:'center', gap:'4px', padding:'6px 11px', borderRadius:'7px', border:`1.5px solid ${C.border}`, background:C.offWhite, color:C.muted, fontSize:'11.5px', fontWeight:600, cursor:'pointer', fontFamily:'"DM Sans",sans-serif', transition:'all .2s' }}
                        onMouseEnter={e=>{ e.currentTarget.style.borderColor=C.azure; e.currentTarget.style.color=C.azure; e.currentTarget.style.background=C.azureLight; }}
                        onMouseLeave={e=>{ e.currentTarget.style.borderColor=C.border; e.currentTarget.style.color=C.muted; e.currentTarget.style.background=C.offWhite; }}
                      >
                        <Edit3 size={11}/> Modifier
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </motion.div>
    </>
  );
}

// ════════════════════════════════════════════════════════════
// CARTE ENGAGEMENT ─ Don + Cotisation empilés (40% de la grille)
// ════════════════════════════════════════════════════════════
function ColonneEngagement({ user, membres, onDonSuccess }) {
  const [showDon, setDon] = useState(false);

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'18px' }}>

      {/* ── CARTE DON ── */}
      <motion.div variants={fadeUp}
        style={{ background:C.white, borderRadius:'20px', border:`1.5px solid ${C.border}`, padding:'24px', boxShadow:'0 4px 24px rgba(0,0,0,.05)', position:'relative', overflow:'hidden' }}>
        {/* Déco */}
        <div style={{ position:'absolute', top:'-20px', right:'-20px', width:'100px', height:'100px', borderRadius:'50%', background:C.azureLight, opacity:.6, pointerEvents:'none' }}/>

        <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'16px', position:'relative' }}>
          <div style={{ width:'44px', height:'44px', borderRadius:'14px', background:C.azureLight, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <Heart size={20} style={{ color:C.azure }}/>
          </div>
          <div>
            <div style={{ fontFamily:'"DM Sans",sans-serif', fontSize:'10.5px', fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:C.azure, marginBottom:'2px' }}>Solidarité</div>
            <h4 style={{ fontFamily:'"Playfair Display",serif', fontSize:'1.05rem', fontWeight:700, color:C.azureDark, margin:0 }}>Faire un don</h4>
          </div>
        </div>

        <p style={{ fontFamily:'"DM Sans",sans-serif', fontSize:'13px', color:C.muted, lineHeight:1.6, margin:'0 0 20px', position:'relative' }}>
          Contribuez directement au financement des actions de l'association ININ. Chaque don est traçable et génère un reçu.
        </p>

        <button onClick={() => setDon(true)}
          style={{ width:'100%', padding:'12px', borderRadius:'12px', background:`linear-gradient(135deg,${C.azure},#2d4fd4)`, color:C.white, fontSize:'13.5px', fontWeight:700, border:'none', cursor:'pointer', fontFamily:'"DM Sans",sans-serif', boxShadow:`0 6px 18px ${C.azure}35`, transition:'all .25s', display:'flex', alignItems:'center', justifyContent:'center', gap:'7px', position:'relative' }}
          onMouseEnter={e=>{ e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow=`0 10px 26px ${C.azure}45`; }}
          onMouseLeave={e=>{ e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow=`0 6px 18px ${C.azure}35`; }}>
          <Banknote size={15}/> Enregistrer un don
        </button>
      </motion.div>


      {/* ── Modales ── */}
      <AnimatePresence>
        {showDon && (
          <ModalDon onClose={()=>setDon(false)} onSuccess={onDonSuccess} membres={membres}/>
        )}
      </AnimatePresence>

    </div>
  );
}

// ── PAGE PRINCIPALE ───────────────────────────────────────────
export default function DashboardTresorier() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const ref    = useRef(null);
  const inView = useInView(ref, { once:true, amount:.05 });

  const [stats,     setStats]     = useState(null);
  const [dons,      setDons]      = useState([]);
  const [actions,   setActions]   = useState([]);    // ← liste pour le select
  const [membres,   setMembres]  = useState([]);     // ← liste pour modale don
  const [ldMembres, setLdMembres] = useState(true);  // ← chargement membres
  const [ldStats,   setLdStats]   = useState(true);
  const [ldDons,    setLdDons]    = useState(true);
  const [ldActions, setLdActions] = useState(true);  // ← chargement actions
  const [errStats,  setErrStats]  = useState(null);
  const [errDons,   setErrDons]   = useState(null);
  const [showModal,    setShowModal]    = useState(false);


  const displayName = user?.first_name || user?.username || 'Trésorier·e';
  const handleLogout = () => { logout(); navigate('/', { replace:true }); };

  const fetchStats = useCallback(async () => {
    setLdStats(true); setErrStats(null);
    try { const { data } = await axios.get(API_STATS, { headers:authHeader() }); setStats(data); }
    catch { setErrStats('Impossible de charger les statistiques financières.'); }
    finally { setLdStats(false); }
  }, []);

  const fetchDons = useCallback(async () => {
    setLdDons(true); setErrDons(null);
    try { const { data } = await axios.get(API_DONS, { headers:authHeader() }); setDons(data.results??data); }
    catch { setErrDons('Impossible de charger la liste des dons.'); }
    finally { setLdDons(false); }
  }, []);

  // ── Chargement des actions pour le select de la modale ────
  const fetchActions = useCallback(async () => {
    setLdActions(true);
    try {
      const { data } = await axios.get(API_ACTIONS, { headers: authHeader() });
      // L'API peut renvoyer { results: [...] } (pagination DRF) ou directement []
      const liste = data.results ?? data;
      setActions(liste.map(a => ({ id: a.id, titre: a.titre })));
    } catch {
      // Échec silencieux : la modale restera vide mais restera utilisable
      console.warn('[Trésorier] Impossible de charger les actions.');
      setActions([]);
    } finally { setLdActions(false); }
  }, []);

  // Chargement membres pour la modale don
  // ✅ /api/users/ est accessible au Trésorier (contrairement à /api/membres/ — RH only)
  //    On filtre sur le role MEMBRE pour ne lister que les membres actifs.
  const fetchMembres = useCallback(async () => {
    setLdMembres(true);
    try {
      const { data } = await axios.get(API_MEMBRES_TRESORIER, { headers: authHeader() });
      // ── Debug : log la structure brute pour repérer les bons champs ──
      const liste = Array.isArray(data) ? data : (data.results ?? data.data ?? []);
      console.log('[Trésorier] liste-membres — premier élément :', liste[0]);

      setMembres(
        // ✅ /api/membres-viewset/ retourne les champs natifs Membre :
        //    { id, nom, prenom, email, ... } via MembreSerializer
        liste
          .filter(m => !m.statut || m.statut === 'ACTIF')
          .map(m => ({
            id:      m.id,
            display: ((m.prenom ?? '') + ' ' + (m.nom ?? '')).trim()
                  || m.email
                  || String(m.id),
          }))
      );
    } catch (e) {
      // Afficher l'erreur complète pour diagnostic
      console.error('[Trésorier] Impossible de charger les membres :', e.message, e.response?.status, e.response?.data);
      setMembres([]);
    } finally { setLdMembres(false); }
  }, []);

  useEffect(() => { fetchStats(); fetchDons(); fetchActions(); fetchMembres(); }, [fetchStats, fetchDons, fetchActions, fetchMembres]);

  const handleRecuGenere = (id) => setDons(prev=>prev.map(d=>d.id===id?{...d,recu_genere:true}:d));

  const solde   = stats ? parseFloat(stats.solde_financier ?? 0) : null;
  const soldeOk = solde == null || solde >= 0;

  return (
    <>
      <style>{`
        @keyframes spin  { to { transform:rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.35} }
        table { border-collapse:collapse; width:100%; }
      `}</style>

      <div style={{ fontFamily:'"DM Sans",sans-serif', background:C.offWhite, minHeight:'100vh', paddingTop:`${NAV_HEIGHT}px` }}>

        {/* ══ HEADER ══════════════════════════════════════ */}
        <div style={{ background:`linear-gradient(135deg,${C.emeraldDeep} 0%,${C.emeraldDark} 45%,${C.emerald} 80%,${C.cyanDark} 100%)`, padding:'44px 24px 56px', position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', top:'-60px', right:'-60px', width:'260px', height:'260px', borderRadius:'50%', background:'rgba(255,255,255,.03)', pointerEvents:'none' }}/>
          <div style={{ position:'absolute', bottom:'-40px', left:'28%', width:'200px', height:'200px', borderRadius:'50%', background:'rgba(5,150,105,.12)', pointerEvents:'none' }}/>
          <div style={{ position:'absolute', top:'20px', right:'12%', width:'90px', height:'90px', border:'1px solid rgba(255,255,255,.05)', borderRadius:'14px', transform:'rotate(20deg)', pointerEvents:'none' }}/>
          <div style={{ position:'absolute', top:'36px', right:'calc(12% + 12px)', width:'62px', height:'62px', border:'1px solid rgba(255,255,255,.05)', borderRadius:'10px', transform:'rotate(20deg)', pointerEvents:'none' }}/>

          <div style={{ maxWidth:'1280px', margin:'0 auto', position:'relative', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'20px' }}>

            <motion.div initial={{ opacity:0, x:-24 }} animate={{ opacity:1, x:0 }} transition={{ duration:.6, ease:[0.22,1,0.36,1] }}
              style={{ display:'flex', alignItems:'center', gap:'18px' }}>
              <Avatar user={user} size={58}/>
              <div>
                <div style={{ fontFamily:'"DM Sans",sans-serif', fontSize:'11px', color:'rgba(255,255,255,.45)', fontWeight:600, letterSpacing:'0.15em', textTransform:'uppercase', marginBottom:'4px' }}>Espace Trésorerie & Finance</div>
                <h1 style={{ fontFamily:'"Playfair Display",serif', fontSize:'clamp(1.4rem,3vw,1.9rem)', fontWeight:800, color:C.white, margin:0, lineHeight:1.15 }}>
                  Bonjour, <em style={{ fontStyle:'italic', color:C.emeraldAccent }}>{displayName}</em> 👋
                </h1>
                <div style={{ fontFamily:'"DM Sans",sans-serif', fontSize:'13px', color:'rgba(255,255,255,.45)', marginTop:'4px' }}>Pilotez les flux financiers de l'association ININ.</div>
              </div>
            </motion.div>

            <motion.div initial={{ opacity:0, x:24 }} animate={{ opacity:1, x:0 }} transition={{ duration:.6, ease:[0.22,1,0.36,1] }}
              style={{ display:'flex', gap:'10px', flexWrap:'wrap', alignItems:'center' }}>
              <button onClick={()=>setShowModal(true)}
                style={{ display:'inline-flex', alignItems:'center', gap:'7px', padding:'10px 20px', borderRadius:'100px', background:C.emeraldAccent, color:C.emeraldDeep, fontSize:'13px', fontWeight:800, border:'none', cursor:'pointer', fontFamily:'"DM Sans",sans-serif', boxShadow:'0 6px 20px rgba(110,231,183,.4)', transition:'all .25s cubic-bezier(0.34,1.56,0.64,1)' }}
                onMouseEnter={e=>{ e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 10px 28px rgba(110,231,183,.55)'; }}
                onMouseLeave={e=>{ e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='0 6px 20px rgba(110,231,183,.4)'; }}>
                <Plus size={15} strokeWidth={2.5}/> Saisir une dépense
              </button>
              <Link to="/dashboard/settings"
                style={{ display:'inline-flex', alignItems:'center', gap:'6px', padding:'10px 16px', borderRadius:'100px', background:'rgba(255,255,255,.1)', border:'1px solid rgba(255,255,255,.2)', color:C.white, fontSize:'13px', fontWeight:600, fontFamily:'"DM Sans",sans-serif', textDecoration:'none', transition:'background .2s' }}
                onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,.18)'}
                onMouseLeave={e=>e.currentTarget.style.background='rgba(255,255,255,.1)'}>
                <Settings size={14}/> Profil
              </Link>
              <button onClick={handleLogout}
                style={{ display:'inline-flex', alignItems:'center', gap:'6px', padding:'10px 16px', borderRadius:'100px', background:'rgba(220,38,38,.15)', border:'1px solid rgba(220,38,38,.3)', color:'#fca5a5', fontSize:'13px', fontWeight:600, fontFamily:'"DM Sans",sans-serif', cursor:'pointer', transition:'background .2s' }}
                onMouseEnter={e=>e.currentTarget.style.background='rgba(220,38,38,.28)'}
                onMouseLeave={e=>e.currentTarget.style.background='rgba(220,38,38,.15)'}>
                <LogOut size={14}/> Déconnecter
              </button>
            </motion.div>
          </div>
        </div>

        {/* ══ CONTENU ══════════════════════════════════════ */}
        <div ref={ref} style={{ maxWidth:'1280px', margin:'0 auto', padding:'36px 24px 80px' }}>

          {/* KPI FINANCIERS */}
          {ldStats ? (
            <div style={{ display:'flex', alignItems:'center', gap:'8px', color:C.muted, fontSize:'13px', marginBottom:'44px', fontFamily:'"DM Sans",sans-serif' }}>
              <Loader2 size={15} style={{ animation:'spin 1s linear infinite', color:C.emerald }}/> Chargement des statistiques…
            </div>
          ) : errStats ? (
            <div style={{ display:'flex', alignItems:'center', gap:'10px', padding:'14px 18px', borderRadius:'12px', background:C.dangerBg, border:`1px solid ${C.danger}30`, marginBottom:'44px' }}>
              <AlertCircle size={15} style={{ color:C.danger }}/>
              <span style={{ fontFamily:'"DM Sans",sans-serif', fontSize:'13px', color:C.danger, flex:1 }}>{errStats}</span>
              <button onClick={fetchStats} style={{ display:'flex', alignItems:'center', gap:'4px', fontSize:'12px', fontWeight:600, color:C.danger, background:'none', border:'none', cursor:'pointer', fontFamily:'"DM Sans",sans-serif', flexShrink:0 }}>
                <RefreshCw size={12}/> Réessayer
              </button>
            </div>
          ) : (
            <motion.div variants={stagger(.09)} initial="hidden" animate={inView?'show':'hidden'}
              style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:'18px', marginBottom:'44px' }}>
              <KpiCard icon={Wallet}       label="Solde global"       value={fmt(stats?.solde_financier)} sub={soldeOk?'Excédentaire':'Déficitaire'} subPositive={soldeOk}  color={soldeOk?C.emerald:C.danger}   bg={soldeOk?C.emeraldLight:C.dangerBg}/>
              <KpiCard icon={Heart}        label="Total dons reçus"   value={fmt(stats?.total_dons)}      sub={`${stats?.nb_dons??0} don${(stats?.nb_dons??0)>1?'s':''}`} subPositive={true}  color={C.azure}     bg={C.azureLight}/>
              <KpiCard icon={CreditCard}   label="Cotisations payées" value={fmt(stats?.total_cotisations)} sub={`${stats?.nb_membres_a_jour??0} à jour`} subPositive={true} color={C.cyanDark}  bg={'#ecfeff'}/>
              <KpiCard icon={TrendingDown} label="Dépenses validées"  value={fmt(stats?.total_depenses)}  sub="Validées"                                  subPositive={false} color={C.danger}    bg={C.dangerBg}/>
            </motion.div>
          )}

          {/* TABLEAU DES DONS */}
          <motion.div variants={fadeUp} initial="hidden" animate={inView?'show':'hidden'} style={{ marginBottom:'40px' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'20px', flexWrap:'wrap', gap:'12px' }}>
              <div>
                <div style={{ display:'flex', alignItems:'center', gap:'9px', marginBottom:'4px' }}>
                  <Heart size={17} style={{ color:C.emerald }}/>
                  <h2 style={{ fontFamily:'"Playfair Display",serif', fontSize:'1.2rem', fontWeight:700, color:C.azureDark, margin:0 }}>Registre des Dons</h2>
                </div>
                <p style={{ fontFamily:'"DM Sans",sans-serif', fontSize:'13.5px', color:C.muted, margin:0 }}>
                  {ldDons ? '…' : `${dons.length} don${dons.length>1?'s':''} enregistré${dons.length>1?'s':''}`}
                </p>
              </div>
              <button onClick={fetchDons}
                style={{ display:'inline-flex', alignItems:'center', gap:'6px', padding:'8px 14px', borderRadius:'10px', border:`1.5px solid ${C.border}`, background:C.white, color:C.muted, fontSize:'12px', fontWeight:600, cursor:'pointer', fontFamily:'"DM Sans",sans-serif', transition:'all .2s' }}
                onMouseEnter={e=>{ e.currentTarget.style.borderColor=C.emerald; e.currentTarget.style.color=C.emerald; }}
                onMouseLeave={e=>{ e.currentTarget.style.borderColor=C.border;  e.currentTarget.style.color=C.muted; }}>
                <RefreshCw size={12}/> Actualiser
              </button>
            </div>

            <div style={{ background:C.white, borderRadius:'20px', border:`1.5px solid ${C.border}`, overflow:'hidden', boxShadow:'0 4px 20px rgba(0,0,0,.04)' }}>
              {ldDons ? (
                <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'10px', padding:'50px', color:C.muted, fontSize:'14px', fontFamily:'"DM Sans",sans-serif' }}>
                  <Loader2 size={18} style={{ animation:'spin 1s linear infinite', color:C.emerald }}/> Chargement des dons…
                </div>
              ) : errDons ? (
                <div style={{ padding:'50px', textAlign:'center', color:C.danger, fontFamily:'"DM Sans",sans-serif', fontSize:'14px' }}>{errDons}</div>
              ) : dons.length === 0 ? (
                <div style={{ padding:'60px', textAlign:'center', display:'flex', flexDirection:'column', alignItems:'center', gap:'12px' }}>
                  <div style={{ width:'58px', height:'58px', borderRadius:'50%', background:C.emeraldLight, display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <Heart size={24} style={{ color:C.emerald }}/>
                  </div>
                  <p style={{ fontFamily:'"DM Sans",sans-serif', fontSize:'14px', color:C.muted, margin:0 }}>Aucun don enregistré pour le moment.</p>
                </div>
              ) : (
                <div style={{ overflowX:'auto' }}>
                  <table>
                    <thead>
                      <tr style={{ background:C.offWhite, borderBottom:`2px solid ${C.border}` }}>
                        {['Donateur','Montant','Date','Mode de paiement','Reçu'].map((h,i)=>(
                          <th key={h} style={{ padding:'13px 20px', textAlign:i===4?'right':'left', fontFamily:'"DM Sans",sans-serif', fontSize:'11px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', color:C.muted, whiteSpace:'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {dons.map((don,i)=><DonRow key={don.id} don={don} index={i} onRecuGenere={handleRecuGenere}/>)}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </motion.div>

          {/* ══ SECTION COTISATIONS ══ */}
          <motion.div variants={fadeUp} initial="hidden" animate={inView?'show':'hidden'}>
            <SectionCotisations
              membres={membres}
              ldMembres={ldMembres}
              onRefreshStats={() => fetchStats()}
            />
          </motion.div>

          {/* BANDEAU DÉPENSE */}
          <motion.div variants={fadeUp} initial="hidden" animate={inView?'show':'hidden'} style={{ marginBottom:'32px' }}>
            <div style={{ background:`linear-gradient(135deg,${C.emeraldDeep}f5,${C.emeraldDark}f2)`, borderRadius:'20px', padding:'28px 32px', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'20px', position:'relative', overflow:'hidden' }}>
              <div style={{ position:'absolute', right:'-20px', top:'-20px', width:'150px', height:'150px', borderRadius:'50%', background:'rgba(110,231,183,.06)', pointerEvents:'none' }}/>
              <div>
                <div style={{ fontFamily:'"DM Sans",sans-serif', fontSize:'11px', fontWeight:700, letterSpacing:'0.16em', textTransform:'uppercase', color:'rgba(110,231,183,.65)', marginBottom:'6px' }}>Comptabilité</div>
                <h3 style={{ fontFamily:'"Playfair Display",serif', fontSize:'1.3rem', fontWeight:700, color:C.white, margin:'0 0 4px' }}>Enregistrer une dépense</h3>
                <p style={{ fontFamily:'"DM Sans",sans-serif', fontSize:'13.5px', color:'rgba(255,255,255,.5)', margin:0 }}>Motif, montant, date et justificatif — tout en un formulaire.</p>
              </div>
              <button onClick={()=>setShowModal(true)}
                style={{ display:'inline-flex', alignItems:'center', gap:'8px', padding:'13px 28px', borderRadius:'100px', background:C.emeraldAccent, color:C.emeraldDeep, fontSize:'14px', fontWeight:800, border:'none', cursor:'pointer', fontFamily:'"DM Sans",sans-serif', boxShadow:'0 6px 20px rgba(110,231,183,.4)', flexShrink:0, transition:'all .25s cubic-bezier(0.34,1.56,0.64,1)', position:'relative', zIndex:1 }}
                onMouseEnter={e=>{ e.currentTarget.style.transform='translateY(-2px) scale(1.03)'; e.currentTarget.style.boxShadow='0 12px 30px rgba(110,231,183,.55)'; }}
                onMouseLeave={e=>{ e.currentTarget.style.transform='translateY(0) scale(1)'; e.currentTarget.style.boxShadow='0 6px 20px rgba(110,231,183,.4)'; }}>
                <Plus size={16} strokeWidth={2.5}/> Saisir une dépense
              </button>
            </div>
          </motion.div>

          {/* ══ GRILLE 60/40 : DÉPENSES | ENGAGEMENT ══════════ */}
          <style>{`
            .grid-6040 {
              display: grid;
              grid-template-columns: 3fr 2fr;
              gap: 24px;
              align-items: start;
            }
            @media (max-width: 900px) {
              .grid-6040 { grid-template-columns: 1fr; }
            }
          `}</style>

          <motion.div variants={stagger(.1)} initial="hidden" animate={inView?'show':'hidden'} className="grid-6040">
            {/* Colonne gauche : Tableau dépenses */}
            <SectionDepenses actions={actions} ldActions={ldActions}/>

            {/* Colonne droite : Don + Cotisation */}
            <ColonneEngagement
              user={user}
              membres={membres}
              onDonSuccess={() => { fetchStats(); fetchDons(); }}
            />
          </motion.div>

        </div>
      </div>

      <AnimatePresence>
        {showModal && (
          <ModalDepense
            onClose={() => setShowModal(false)}
            onSuccess={() => { fetchStats(); }}
            actions={actions}
            ldActions={ldActions}
          />
        )}
      </AnimatePresence>
    </>
  );
}