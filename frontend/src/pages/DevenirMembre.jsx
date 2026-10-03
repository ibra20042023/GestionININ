/**
 * src/pages/DevenirMembre.jsx
 * ─────────────────────────────────────────────────────────────
 * Page "Devenir Membre / Bénévole" — Association ININ
 * 100% styles inline — zéro dépendance Tailwind.
 * v2 — Responsive mobile & tablette
 * ─────────────────────────────────────────────────────────────
 */

import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';
import React from 'react';
import {
  Users, Heart, Globe, BookOpen, Shield, Star, Zap,
  ArrowRight, ArrowLeft, CheckCircle2, AlertCircle,
  Upload, Linkedin, Mail, Phone, MapPin, User,
  Briefcase, FileText, Loader2, ChevronDown, X, Send,
} from 'lucide-react';

// ── Config ────────────────────────────────────────────────────
const API_URL    = `${import.meta.env.VITE_API_URL}/api/demandes/`;
const NAV_HEIGHT = 85;

// ── Palette ───────────────────────────────────────────────────
const C = {
  azure:        '#1640c8',
  azureDark:    '#0f172a',
  azureDeep:    '#0f2060',
  azureLight:   '#eef5ff',
  azureAlpha:   'rgba(22,64,200,0.07)',
  cyan:         '#30c8d3',
  cyanDark:     '#17a8b5',
  cyanLight:    '#ecfeff',
  white:        '#ffffff',
  offWhite:     '#f8fafc',
  muted:        '#64748b',
  mutedLight:   '#94a3b8',
  border:       '#e2e8f0',
  error:        '#dc2626',
  errorBg:      '#fef2f2',
  errorBorder:  'rgba(220,38,38,0.25)',
  success:      '#16a34a',
  successBg:    '#f0fdf4',
  successBorder:'rgba(22,163,74,0.25)',
};

// ── Variants Framer ───────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};
const staggerParent = (d = 0.09) => ({
  hidden: {},
  show:   { transition: { staggerChildren: d } },
});
const slidePanel = {
  left:  { hidden: { opacity:0, x:-40 }, show: { opacity:1, x:0, transition:{ duration:0.7, ease:[0.22,1,0.36,1] } } },
  right: { hidden: { opacity:0, x: 40 }, show: { opacity:1, x:0, transition:{ duration:0.7, ease:[0.22,1,0.36,1] } } },
};
const stepAnim = {
  enter:  { opacity:0, x:28  },
  center: { opacity:1, x:0   },
  exit:   { opacity:0, x:-28 },
};

// ── Données statiques ─────────────────────────────────────────
const AVANTAGES = [
  { icon: Globe,    titre:'Réseau panafricain',      desc:'Intégrez +500 acteurs engagés dans 8 pays d\'Afrique.' },
  { icon: BookOpen, titre:'Formations exclusives',    desc:'Ateliers, webinaires et ressources réservés aux membres.' },
  { icon: Zap,      titre:'Impact concret',           desc:'Contribuez à des projets de terrain à fort impact.' },
  { icon: Heart,    titre:'Entraide & solidarité',    desc:'Un collectif bienveillant où chaque voix compte.' },
  { icon: Shield,   titre:'Reconnaissance officielle',desc:'Cité dans nos rapports d\'impact et événements.' },
  { icon: Star,     titre:'Opportunités de carrière', desc:'Offres de missions, stages et emplois dans notre réseau.' },
];

const DOMAINES = [
  { value:'',               label:'Sélectionnez votre domaine…' },
  { value:'SANTE_MENTALE',  label:'Santé mentale & psychologie' },
  { value:'SANTE_PHYSIQUE', label:'Santé physique & sport' },
  { value:'EDUCATION',      label:'Éducation & pédagogie' },
  { value:'COMMUNICATION',  label:'Communication & médias' },
  { value:'TECHNOLOGIE',    label:'Technologie & numérique' },
  { value:'DROIT',          label:'Droit & plaidoyer' },
  { value:'FINANCE',        label:'Finance & gestion' },
  { value:'LOGISTIQUE',     label:'Logistique & coordination' },
  { value:'ART_CULTURE',    label:'Art & culture' },
  { value:'AUTRE',          label:'Autre' },
];

const ROLES = [
  { value:'',           label:'Je souhaite devenir…' },
  { value:'MEMBRE',     label:'👤  Membre officiel' },
  { value:'BENEVOLE',   label:'🙌  Bénévole' },
  { value:'PARTENAIRE', label:'🤝  Partenaire' },
];

const ETAPES_LABELS = ['Informations', 'Profil', 'Motivation'];

const FORM_INIT = {
  role:'', prenom:'', nom:'', date_naissance:'', email:'',
  telephone:'', adresse:'',
  domaine:'', linkedin:'', fichier:null,
  motivation:'', engagement:false,
};

// ── Helpers validation ────────────────────────────────────────
const emailOk = v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const phoneOk = v => v === '' || /^[\d\s+().\-]{7,20}$/.test(v);

// ──────────────────────────────────────────────────────────────
// PRIMITIVES UI
// ──────────────────────────────────────────────────────────────

function FieldWrap({ label, id, required, hint, icon: Icon, error, children }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
      <label htmlFor={id} style={{
        fontFamily:'"DM Sans", sans-serif', fontSize:'12.5px', fontWeight:700,
        color: error ? C.error : C.azureDark, letterSpacing:'0.025em',
        display:'flex', alignItems:'center', gap:'5px',
      }}>
        {Icon && <Icon size={13} style={{ color: error ? C.error : C.mutedLight, flexShrink:0 }} />}
        {label}
        {required && <span style={{ color:C.cyan, marginLeft:'1px' }}>*</span>}
        {hint && <span style={{ fontWeight:400, color:C.mutedLight, fontSize:'11px' }}>({hint})</span>}
      </label>
      {children}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity:0, y:-4 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
            transition={{ duration:0.18 }}
            style={{ display:'flex', alignItems:'center', gap:'4px', fontFamily:'"DM Sans"', fontSize:'11.5px', color:C.error }}
          >
            <AlertCircle size={11} />{error}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TextInput({ id, type='text', placeholder, value, onChange, error, autoComplete, disabled }) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      id={id} type={type} placeholder={placeholder} value={value}
      onChange={onChange} autoComplete={autoComplete} disabled={disabled}
      onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
      style={{
        width:'100%', boxSizing:'border-box',
        padding:'12px 14px', borderRadius:'10px',
        border:`1.5px solid ${error ? C.errorBorder : focused ? C.cyan : C.border}`,
        outline:'none', fontFamily:'"DM Sans", sans-serif',
        fontSize:'16px', // 16px minimum → pas de zoom iOS
        color:C.azureDark,
        background: disabled ? '#f1f5f9' : (focused ? C.white : C.offWhite),
        boxShadow: focused ? (error ? '0 0 0 3px rgba(220,38,38,0.12)' : '0 0 0 3px rgba(48,200,211,0.16)') : 'none',
        transition:'all 0.2s ease',
        cursor: disabled ? 'not-allowed' : 'text',
      }}
    />
  );
}

function SelectInput({ id, value, onChange, options, error }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ position:'relative' }}>
      <select
        id={id} value={value} onChange={onChange}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{
          width:'100%', boxSizing:'border-box',
          padding:'12px 36px 12px 14px', borderRadius:'10px',
          border:`1.5px solid ${error ? C.errorBorder : focused ? C.cyan : C.border}`,
          outline:'none', fontFamily:'"DM Sans", sans-serif',
          fontSize:'16px', // évite zoom iOS
          color: value ? C.azureDark : C.mutedLight,
          background: focused ? C.white : C.offWhite,
          boxShadow: focused ? '0 0 0 3px rgba(48,200,211,0.16)' : 'none',
          transition:'all 0.2s ease', cursor:'pointer', appearance:'none',
        }}
      >
        {options.map(o => (
          <option key={o.value} value={o.value} disabled={!o.value} style={{ color: o.value ? C.azureDark : C.mutedLight }}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown size={15} style={{ position:'absolute', right:'12px', top:'50%', transform:'translateY(-50%)', color:C.mutedLight, pointerEvents:'none' }} />
    </div>
  );
}

function TextareaInput({ id, placeholder, value, onChange, error, rows=6 }) {
  const [focused, setFocused] = useState(false);
  return (
    <textarea
      id={id} placeholder={placeholder} value={value} onChange={onChange} rows={rows}
      onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
      style={{
        width:'100%', boxSizing:'border-box',
        padding:'12px 14px', borderRadius:'10px',
        border:`1.5px solid ${error ? C.errorBorder : focused ? C.cyan : C.border}`,
        outline:'none', fontFamily:'"DM Sans", sans-serif',
        fontSize:'16px',
        color:C.azureDark, background: focused ? C.white : C.offWhite,
        boxShadow: focused ? '0 0 0 3px rgba(48,200,211,0.16)' : 'none',
        transition:'all 0.2s ease', resize:'vertical', minHeight:'120px',
      }}
    />
  );
}

// ──────────────────────────────────────────────────────────────
// COLONNE GAUCHE — motivation + avantages
// ──────────────────────────────────────────────────────────────
function LeftColumn() {
  const ref    = useRef(null);
  const inView = useInView(ref, { once:true, amount:0.1 });

  return (
    <motion.div
      ref={ref}
      variants={slidePanel.left}
      initial="hidden"
      animate={inView ? 'show' : 'hidden'}
      style={{
        display:'flex', flexDirection:'column', gap:'32px',
      }}
    >
      {/* En-tête gauche */}
      <div>
        <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'14px' }}>
          <span style={{ display:'block', width:'28px', height:'2px', borderRadius:'2px', background:`linear-gradient(90deg, ${C.azure}, ${C.cyan})` }} />
          <span style={{ fontFamily:'"DM Sans", sans-serif', fontSize:'11px', fontWeight:700, letterSpacing:'0.2em', textTransform:'uppercase', color:C.cyanDark }}>
            Candidature ouverte
          </span>
        </div>

        <h1 style={{
          fontFamily:'"Playfair Display", Georgia, serif',
          fontSize:'clamp(1.7rem, 4vw, 2.6rem)',
          fontWeight:800, lineHeight:1.15, color:C.azureDark,
          margin:'0 0 16px', letterSpacing:'-0.01em',
        }}>
          Rejoignez{' '}
          <em style={{ fontStyle:'italic', color:C.azure }}>l'aventure</em>
          {' '}ININ
        </h1>

        <p style={{ fontFamily:'"DM Sans", sans-serif', fontSize:'15px', lineHeight:1.78, color:C.muted, margin:0 }}>
          Professionnel de santé, étudiant, ou simplement passionné par la cause
          de la jeunesse africaine — il y a une place pour vous dans notre réseau.
        </p>
      </div>

      {/* Avantages */}
      <motion.div
        variants={staggerParent(0.08)}
        initial="hidden"
        animate={inView ? 'show' : 'hidden'}
        style={{ display:'flex', flexDirection:'column', gap:'14px' }}
      >
        <div style={{ fontFamily:'"DM Sans"', fontSize:'11px', fontWeight:700, letterSpacing:'0.14em', textTransform:'uppercase', color:C.mutedLight, marginBottom:'2px' }}>
          Ce que vous gagnez
        </div>
        {AVANTAGES.map(({ icon:Icon, titre, desc }) => (
          <motion.div
            key={titre}
            variants={fadeUp}
            style={{ display:'flex', alignItems:'flex-start', gap:'13px' }}
          >
            <div style={{
              width:'36px', height:'36px', borderRadius:'10px', flexShrink:0,
              background:C.azureLight, display:'flex', alignItems:'center', justifyContent:'center',
            }}>
              <Icon size={17} style={{ color:C.azure }} strokeWidth={1.75} />
            </div>
            <div>
              <div style={{ fontFamily:'"DM Sans"', fontSize:'13.5px', fontWeight:700, color:C.azureDark, marginBottom:'2px' }}>{titre}</div>
              <div style={{ fontFamily:'"DM Sans"', fontSize:'12.5px', lineHeight:1.58, color:C.muted }}>{desc}</div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Citation */}
      <div style={{
        background:C.azureLight, borderLeft:`4px solid ${C.azure}`,
        borderRadius:'0 14px 14px 0', padding:'18px 20px',
      }}>
        <p style={{ fontFamily:'"Playfair Display", serif', fontSize:'14px', fontStyle:'italic', color:C.azureDark, margin:'0 0 8px', lineHeight:1.7 }}>
          "Ensemble, nous pouvons bâtir une génération africaine en pleine santé."
        </p>
        <span style={{ fontFamily:'"DM Sans"', fontSize:'11px', color:C.mutedLight, textTransform:'uppercase', letterSpacing:'0.1em' }}>
          — L'équipe ININ
        </span>
      </div>
    </motion.div>
  );
}

// ──────────────────────────────────────────────────────────────
// STEPPER MOBILE — compact
// ──────────────────────────────────────────────────────────────
function StepperMobile({ step }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'0', marginBottom:'20px' }}>
      {ETAPES_LABELS.map((label, i) => (
        <React.Fragment key={label}>
          {/* Cercle */}
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'4px' }}>
            <div style={{
              width:'32px', height:'32px', borderRadius:'50%',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontFamily:'"DM Sans"', fontSize:'12px', fontWeight:700,
              background: i < step ? C.azure : i === step ? C.azure : C.border,
              color:      i <= step ? C.white : C.mutedLight,
              transition:'all 0.3s',
              flexShrink:0,
            }}>
              {i < step ? <CheckCircle2 size={14} /> : i + 1}
            </div>
            <span style={{
              fontFamily:'"DM Sans"', fontSize:'10px',
              fontWeight: i === step ? 700 : 400,
              color:      i === step ? C.azureDark : C.mutedLight,
              whiteSpace:'nowrap',
            }}>
              {label}
            </span>
          </div>
          {/* Ligne entre étapes */}
          {i < ETAPES_LABELS.length - 1 && (
            <div style={{
              flex:1, height:'2px', margin:'0 6px', marginBottom:'18px',
              background: i < step
                ? `linear-gradient(90deg, ${C.azure}, ${C.cyanDark})`
                : C.border,
              transition:'background 0.4s',
            }} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// STEPPER DESKTOP — original
// ──────────────────────────────────────────────────────────────
function StepperDesktop({ step }) {
  return (
    <div style={{ background:C.azureLight, padding:'22px 28px 0' }}>
      <div style={{ display:'flex', gap:'8px', marginBottom:'18px' }}>
        {ETAPES_LABELS.map((label, i) => (
          <div key={label} style={{ flex:1 }}>
            <div style={{ display:'flex', alignItems:'center', gap:'6px', marginBottom:'7px' }}>
              <div style={{
                width:'24px', height:'24px', borderRadius:'50%', flexShrink:0,
                display:'flex', alignItems:'center', justifyContent:'center',
                fontFamily:'"DM Sans"', fontSize:'11px', fontWeight:700,
                background: i < step ? C.azure : i === step ? C.azure : C.border,
                color:      i <= step ? C.white : C.mutedLight,
                transition:'all 0.3s',
              }}>
                {i < step ? <CheckCircle2 size={13} /> : i + 1}
              </div>
              <span style={{
                fontFamily:'"DM Sans"', fontSize:'11.5px',
                fontWeight: i === step ? 700 : 400,
                color:      i === step ? C.azureDark : C.mutedLight,
                transition:'all 0.3s',
              }}>
                {label}
              </span>
            </div>
            <div style={{
              height:'3px', borderRadius:'4px',
              background: i < step
                ? `linear-gradient(90deg, ${C.azure}, ${C.cyanDark})`
                : i === step
                  ? `linear-gradient(90deg, ${C.azure}, ${C.cyan}80)`
                  : C.border,
              transition:'background 0.4s',
            }} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// ÉTAPE 1 — Informations personnelles
// ──────────────────────────────────────────────────────────────
function Step1({ form, setForm, errors }) {
  const upd = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <motion.div key="s1" variants={stepAnim} initial="enter" animate="center" exit="exit"
      transition={{ duration:0.32, ease:[0.22,1,0.36,1] }}
      style={{ display:'flex', flexDirection:'column', gap:'16px' }}
    >
      {/* Rôle */}
      <FieldWrap id="role" label="Je souhaite devenir" required error={errors.role} icon={Users}>
        <SelectInput id="role" value={form.role} onChange={upd('role')} options={ROLES} error={errors.role} />
      </FieldWrap>

      {/* Prénom + Nom */}
      <div className="dm-grid-2">
        <FieldWrap id="prenom" label="Prénom" required error={errors.prenom} icon={User}>
          <TextInput id="prenom" placeholder="Aminata" value={form.prenom} onChange={upd('prenom')} error={errors.prenom} autoComplete="given-name" />
        </FieldWrap>
        <FieldWrap id="nom" label="Nom" required error={errors.nom} icon={User}>
          <TextInput id="nom" placeholder="Koné" value={form.nom} onChange={upd('nom')} error={errors.nom} autoComplete="family-name" />
        </FieldWrap>
      </div>

      {/* Date naissance + Email */}
      <div className="dm-grid-2">
        <FieldWrap id="date_naissance" label="Date de naissance" icon={User} hint="optionnel">
          <TextInput id="date_naissance" type="date" value={form.date_naissance} onChange={upd('date_naissance')} />
        </FieldWrap>
        <FieldWrap id="email" label="Email" required error={errors.email} icon={Mail}>
          <TextInput id="email" type="email" placeholder="vous@exemple.com" value={form.email} onChange={upd('email')} error={errors.email} autoComplete="email" />
        </FieldWrap>
      </div>

      {/* Téléphone */}
      <FieldWrap id="telephone" label="Téléphone" error={errors.telephone} icon={Phone} hint="optionnel">
        <TextInput id="telephone" type="tel" placeholder="+221 77 000 00 00" value={form.telephone} onChange={upd('telephone')} error={errors.telephone} autoComplete="tel" />
      </FieldWrap>

      {/* Adresse */}
      <FieldWrap id="adresse" label="Ville / Pays" required error={errors.adresse} icon={MapPin}>
        <TextInput id="adresse" placeholder="Dakar, Sénégal" value={form.adresse} onChange={upd('adresse')} error={errors.adresse} />
      </FieldWrap>
    </motion.div>
  );
}

// ──────────────────────────────────────────────────────────────
// ÉTAPE 2 — Profil + Upload
// ──────────────────────────────────────────────────────────────
function Step2({ form, setForm, errors }) {
  const upd     = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  const [drag, setDrag] = useState(false);

  const acceptFile = (file) => {
    if (!file) return;
    const ok = ['application/pdf','image/jpeg','image/png'];
    if (!ok.includes(file.type))      { alert('Formats acceptés : PDF, JPG, PNG'); return; }
    if (file.size > 5 * 1024 * 1024) { alert('Taille maximale : 5 Mo');           return; }
    setForm(f => ({ ...f, fichier:file }));
  };

  return (
    <motion.div key="s2" variants={stepAnim} initial="enter" animate="center" exit="exit"
      transition={{ duration:0.32, ease:[0.22,1,0.36,1] }}
      style={{ display:'flex', flexDirection:'column', gap:'16px' }}
    >
      {/* Domaine */}
      <FieldWrap id="domaine" label="Domaine d'expertise" required error={errors.domaine} icon={Briefcase}>
        <SelectInput id="domaine" value={form.domaine} onChange={upd('domaine')} options={DOMAINES} error={errors.domaine} />
      </FieldWrap>

      {/* LinkedIn */}
      <FieldWrap id="linkedin" label="Profil LinkedIn" icon={Linkedin} hint="optionnel">
        <div style={{ position:'relative' }}>
          <span style={{
            position:'absolute', left:'13px', top:'50%', transform:'translateY(-50%)',
            fontFamily:'"DM Sans"', fontSize:'13px', color:C.mutedLight, whiteSpace:'nowrap',
            pointerEvents:'none',
          }}>
            linkedin.com/in/
          </span>
          <input
            id="linkedin"
            type="text"
            placeholder="votre-profil"
            value={form.linkedin}
            onChange={upd('linkedin')}
            style={{
              width:'100%', boxSizing:'border-box',
              padding:'12px 14px 12px 128px', borderRadius:'10px',
              border:`1.5px solid ${C.border}`,
              outline:'none', fontFamily:'"DM Sans"', fontSize:'16px',
              color:C.azureDark, background:C.offWhite,
              transition:'all 0.2s ease',
            }}
            onFocus={e => { e.target.style.borderColor=C.cyan; e.target.style.background=C.white; e.target.style.boxShadow='0 0 0 3px rgba(48,200,211,0.16)'; }}
            onBlur={e  => { e.target.style.borderColor=C.border; e.target.style.background=C.offWhite; e.target.style.boxShadow='none'; }}
          />
        </div>
      </FieldWrap>

      {/* Upload */}
      <FieldWrap id="fichier" label="CV ou Photo de profil" icon={FileText} hint="PDF, JPG, PNG — max 5 Mo">
        <div
          onDragOver={e => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={e => { e.preventDefault(); setDrag(false); acceptFile(e.dataTransfer.files[0]); }}
          onClick={() => !form.fichier && document.getElementById('fichier-hidden').click()}
          style={{
            border:`2px dashed ${drag ? C.cyan : form.fichier ? C.azure : C.border}`,
            borderRadius:'12px', padding:'24px 16px', textAlign:'center',
            cursor: form.fichier ? 'default' : 'pointer',
            background: drag ? C.cyanLight : form.fichier ? C.azureLight : C.offWhite,
            transition:'all 0.25s ease',
            display:'flex', flexDirection:'column', alignItems:'center', gap:'10px',
          }}
        >
          {form.fichier ? (
            <>
              <CheckCircle2 size={32} style={{ color:C.azure }} />
              <div style={{ fontFamily:'"DM Sans"', fontSize:'13.5px', fontWeight:700, color:C.azure, wordBreak:'break-all' }}>
                {form.fichier.name}
              </div>
              <div style={{ fontFamily:'"DM Sans"', fontSize:'11.5px', color:C.mutedLight }}>
                {(form.fichier.size / 1024).toFixed(0)} Ko
              </div>
              <button
                type="button"
                onClick={e => { e.stopPropagation(); setForm(f => ({ ...f, fichier:null })); }}
                style={{
                  display:'flex', alignItems:'center', gap:'4px',
                  padding:'5px 12px', borderRadius:'100px',
                  background:C.errorBg, border:`1px solid ${C.errorBorder}`,
                  color:C.error, fontSize:'12px', fontFamily:'"DM Sans"',
                  fontWeight:600, cursor:'pointer',
                }}
              >
                <X size={11} /> Supprimer
              </button>
            </>
          ) : (
            <>
              <div style={{ width:'48px', height:'48px', borderRadius:'50%', background:C.border, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Upload size={20} style={{ color:C.mutedLight }} />
              </div>
              <div>
                <div style={{ fontFamily:'"DM Sans"', fontSize:'13.5px', fontWeight:600, color:C.azureDark }}>
                  {drag ? 'Déposez ici ↓' : 'Glissez-déposez ou cliquez'}
                </div>
                <div style={{ fontFamily:'"DM Sans"', fontSize:'12px', color:C.mutedLight, marginTop:'4px' }}>
                  PDF, JPG ou PNG · max 5 Mo
                </div>
              </div>
            </>
          )}
        </div>
        <input
          id="fichier-hidden" type="file" accept=".pdf,.jpg,.jpeg,.png"
          style={{ display:'none' }}
          onChange={e => acceptFile(e.target.files[0])}
        />
      </FieldWrap>
    </motion.div>
  );
}

// ──────────────────────────────────────────────────────────────
// ÉTAPE 3 — Motivation + engagement
// ──────────────────────────────────────────────────────────────
function Step3({ form, setForm, errors }) {
  const charsLeft = 1000 - form.motivation.length;

  return (
    <motion.div key="s3" variants={stepAnim} initial="enter" animate="center" exit="exit"
      transition={{ duration:0.32, ease:[0.22,1,0.36,1] }}
      style={{ display:'flex', flexDirection:'column', gap:'18px' }}
    >
      {/* Motivation */}
      <FieldWrap id="motivation" label="Pourquoi souhaitez-vous nous rejoindre ?" required error={errors.motivation}>
        <TextareaInput
          id="motivation"
          placeholder="Décrivez votre parcours, vos motivations et comment vous souhaitez contribuer à la mission d'ININ…"
          value={form.motivation}
          onChange={e => { if (e.target.value.length <= 1000) setForm(f => ({ ...f, motivation:e.target.value })); }}
          error={errors.motivation}
          rows={6}
        />
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:'4px' }}>
          <span style={{ fontFamily:'"DM Sans"', fontSize:'11px', color:C.mutedLight }}>
            Minimum 80 caractères
          </span>
          <span style={{ fontFamily:'"DM Sans"', fontSize:'11px', color: charsLeft < 100 ? C.error : C.mutedLight }}>
            {charsLeft} restant{charsLeft > 1 ? 's' : ''}
          </span>
        </div>
      </FieldWrap>

      {/* Récap */}
      <div style={{ background:C.azureLight, borderRadius:'14px', padding:'16px 18px', border:`1px solid rgba(22,64,200,0.12)` }}>
        <div style={{ fontFamily:'"DM Sans"', fontSize:'12px', fontWeight:700, color:C.azureDark, marginBottom:'10px', textTransform:'uppercase', letterSpacing:'0.08em' }}>
          📋 Récapitulatif
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'auto 1fr', gap:'5px 12px' }}>
          {[
            ['Rôle',    ROLES.find(r => r.value === form.role)?.label?.replace(/^\S+\s+/, '') || '—'],
            ['Identité',`${form.prenom} ${form.nom}`.trim() || '—'],
            ['Email',   form.email    || '—'],
            ['Domaine', DOMAINES.find(d => d.value === form.domaine)?.label || '—'],
            ['Fichier', form.fichier?.name || 'Aucun'],
          ].map(([k, v]) => (
            <React.Fragment key={k}>
              <span style={{ fontFamily:'"DM Sans"', fontSize:'12px', fontWeight:700, color:C.muted }}>{k} :</span>
              <span style={{ fontFamily:'"DM Sans"', fontSize:'12px', color:C.azureDark, wordBreak:'break-all' }}>{v}</span>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Checkbox engagement */}
      <div>
        <label style={{ display:'flex', alignItems:'flex-start', gap:'12px', cursor:'pointer' }}>
          <div
            role="checkbox"
            aria-checked={form.engagement}
            tabIndex={0}
            onClick={() => setForm(f => ({ ...f, engagement:!f.engagement }))}
            onKeyDown={e => e.key === ' ' && setForm(f => ({ ...f, engagement:!f.engagement }))}
            style={{
              width:'22px', height:'22px', borderRadius:'6px', flexShrink:0, marginTop:'2px',
              border:`2px solid ${errors.engagement ? C.error : form.engagement ? C.azure : C.border}`,
              background: form.engagement ? C.azure : C.white,
              display:'flex', alignItems:'center', justifyContent:'center',
              transition:'all 0.2s', cursor:'pointer',
            }}
          >
            {form.engagement && (
              <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
                <path d="M1 4.5L4 7.5L10 1" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </div>
          <span style={{ fontFamily:'"DM Sans"', fontSize:'13px', color:C.muted, lineHeight:1.65 }}>
            Je certifie que les informations fournies sont exactes et m'engage à contribuer
            respectueusement à la communauté ININ.
            <span style={{ color:C.cyan }}> *</span>
          </span>
        </label>
        {errors.engagement && (
          <div style={{ display:'flex', alignItems:'center', gap:'4px', marginTop:'5px', fontFamily:'"DM Sans"', fontSize:'11.5px', color:C.error }}>
            <AlertCircle size={11} /> Vous devez cocher cette case pour continuer.
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ──────────────────────────────────────────────────────────────
// CARTE SUCCÈS
// ──────────────────────────────────────────────────────────────
function SuccessCard({ email }) {
  return (
    <motion.div
      initial={{ opacity:0, scale:0.95 }}
      animate={{ opacity:1, scale:1 }}
      transition={{ duration:0.5, ease:[0.22,1,0.36,1] }}
      style={{
        background:C.white, borderRadius:'24px',
        boxShadow:'0 8px 48px rgba(22,64,200,0.10)',
        border:`1.5px solid ${C.border}`,
        padding:'48px 24px', textAlign:'center',
        display:'flex', flexDirection:'column', alignItems:'center', gap:'20px',
      }}
    >
      <motion.div
        initial={{ scale:0 }} animate={{ scale:1 }}
        transition={{ type:'spring', stiffness:220, damping:14, delay:0.25 }}
        style={{ width:'80px', height:'80px', borderRadius:'50%', background:C.successBg, border:`2px solid ${C.successBorder}`, display:'flex', alignItems:'center', justifyContent:'center' }}
      >
        <CheckCircle2 size={40} style={{ color:C.success }} />
      </motion.div>

      <div>
        <h2 style={{ fontFamily:'"Playfair Display", serif', fontSize:'clamp(1.4rem,4vw,1.7rem)', fontWeight:800, color:C.azureDark, margin:'0 0 12px', letterSpacing:'-0.01em' }}>
          Candidature transmise !
        </h2>
        <p style={{ fontFamily:'"DM Sans"', fontSize:'15px', lineHeight:1.75, color:C.muted, margin:'0 0 6px' }}>
          Merci ! Votre candidature a été transmise au responsable RH de l'association ININ.
        </p>
        <p style={{ fontFamily:'"DM Sans"', fontSize:'13px', color:C.mutedLight, margin:0 }}>
          Une réponse sera envoyée à{' '}
          <strong style={{ color:C.azure }}>{email}</strong>{' '}
          sous 5 à 7 jours ouvrés.
        </p>
      </div>

      <div style={{ display:'flex', flexWrap:'wrap', gap:'12px', justifyContent:'center', marginTop:'8px', width:'100%' }}>
        <Link to="/" style={{
          display:'inline-flex', alignItems:'center', gap:'7px',
          padding:'12px 24px', borderRadius:'100px',
          background:`linear-gradient(135deg, ${C.azure}, ${C.cyanDark})`,
          color:C.white, fontSize:'14px', fontWeight:600, fontFamily:'"DM Sans"',
          textDecoration:'none', boxShadow:`0 6px 20px rgba(22,64,200,0.28)`,
          flex:'1 1 auto', justifyContent:'center',
        }}>
          Retour à l'accueil
        </Link>
        <Link to="/membres" style={{
          display:'inline-flex', alignItems:'center', gap:'7px',
          padding:'12px 24px', borderRadius:'100px',
          border:`1.5px solid ${C.border}`, background:C.white,
          color:C.azure, fontSize:'14px', fontWeight:600, fontFamily:'"DM Sans"',
          textDecoration:'none', flex:'1 1 auto', justifyContent:'center',
        }}>
          Voir l'équipe
        </Link>
      </div>
    </motion.div>
  );
}

// ──────────────────────────────────────────────────────────────
// COLONNE DROITE — formulaire multi-étapes
// ──────────────────────────────────────────────────────────────
function RightColumn() {
  const [step,    setStep]    = useState(0);
  const [form,    setForm]    = useState(FORM_INIT);
  const [errors,  setErrors]  = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [apiError,setApiError]= useState('');

  const ref    = useRef(null);
  const inView = useInView(ref, { once:true, amount:0.08 });

  const validate = (n) => {
    const e = {};
    if (n === 0) {
      if (!form.role)                         e.role      = 'Sélectionnez un rôle';
      if (!form.prenom.trim())                e.prenom    = 'Requis';
      if (!form.nom.trim())                   e.nom       = 'Requis';
      if (!form.email.trim())                 e.email     = 'Requis';
      else if (!emailOk(form.email))          e.email     = 'Email invalide';
      if (!phoneOk(form.telephone))           e.telephone = 'Numéro invalide';
      if (!form.adresse.trim())               e.adresse   = 'Requis';
    }
    if (n === 1) {
      if (!form.domaine)                      e.domaine   = 'Sélectionnez un domaine';
    }
    if (n === 2) {
      if (form.motivation.trim().length < 80) e.motivation= `Minimum 80 caractères (${form.motivation.trim().length} actuellement)`;
      if (!form.engagement)                   e.engagement= true;
    }
    return e;
  };

  const nextStep = () => {
    const errs = validate(step);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setStep(s => s + 1);
    // Scroll vers le haut du formulaire sur mobile
    ref.current?.scrollIntoView({ behavior:'smooth', block:'start' });
  };

  const prevStep = () => { setErrors({}); setStep(s => s - 1); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate(2);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({}); setLoading(true); setApiError('');

    const payload = new FormData();
    payload.append('type_membre_souhaite', form.role);
    payload.append('prenom',              form.prenom);
    payload.append('nom',                 form.nom);
    payload.append('telephone',           form.telephone);
    payload.append('email',               form.email);
    payload.append('adresse',             form.adresse);
    payload.append('domaine_expertise',   form.domaine);
    payload.append('motivation',          form.motivation);
    if (form.fichier instanceof File)   payload.append('document', form.fichier, form.fichier.name);
    if (form.date_naissance)            payload.append('date_naissance', form.date_naissance);
    if (form.linkedin) {
      const raw = form.linkedin.trim();
      payload.append('profil_linkedin', raw.startsWith('http') ? raw : `https://www.linkedin.com/in/${raw}`);
    }

    try {
      await api.post('demandes/', payload, { headers: { 'Content-Type': undefined } });
      setSuccess(true);
    } catch (err) {
      setApiError(
        err.response?.data?.detail ||
        err.response?.data?.non_field_errors?.[0] ||
        'Une erreur est survenue. Réessayez ou écrivez-nous directement.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (success) return <SuccessCard email={form.email} />;

  return (
    <motion.div
      ref={ref}
      variants={slidePanel.right}
      initial="hidden"
      animate={inView ? 'show' : 'hidden'}
    >
      <div style={{
        background:C.white, borderRadius:'24px',
        boxShadow:'0 8px 48px rgba(22,64,200,0.10)',
        border:`1.5px solid ${C.border}`, overflow:'hidden',
      }}>

        {/* Stepper desktop — masqué sur mobile via CSS */}
        <div className="dm-stepper-desktop">
          <StepperDesktop step={step} />
        </div>

        {/* Corps formulaire */}
        <form onSubmit={handleSubmit} style={{ padding:'24px' }}>

          {/* Stepper mobile — affiché uniquement sur petit écran */}
          <div className="dm-stepper-mobile">
            <StepperMobile step={step} />
          </div>

          <h2 style={{
            fontFamily:'"Playfair Display", serif',
            fontSize:'clamp(1.1rem, 3vw, 1.25rem)',
            fontWeight:700, color:C.azureDark, margin:'0 0 20px', letterSpacing:'-0.01em',
          }}>
            {['Informations personnelles', 'Votre profil professionnel', 'Votre motivation'][step]}
          </h2>

          {/* Erreur API */}
          <AnimatePresence>
            {apiError && (
              <motion.div
                initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
                style={{
                  display:'flex', gap:'10px', alignItems:'flex-start',
                  background:C.errorBg, border:`1.5px solid ${C.errorBorder}`,
                  borderRadius:'12px', padding:'13px 16px', marginBottom:'18px',
                }}
              >
                <AlertCircle size={17} style={{ color:C.error, flexShrink:0, marginTop:'1px' }} />
                <span style={{ fontFamily:'"DM Sans"', fontSize:'13.5px', color:C.error, lineHeight:1.55 }}>{apiError}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Étape active */}
          <AnimatePresence mode="wait">
            {step === 0 && <Step1 key="s1" form={form} setForm={setForm} errors={errors} />}
            {step === 1 && <Step2 key="s2" form={form} setForm={setForm} errors={errors} />}
            {step === 2 && <Step3 key="s3" form={form} setForm={setForm} errors={errors} />}
          </AnimatePresence>

          {/* Boutons navigation */}
          <div style={{
            display:'flex', justifyContent:'space-between', gap:'12px',
            marginTop:'28px', paddingTop:'22px', borderTop:`1px solid ${C.border}`,
            flexWrap:'wrap',
          }}>
            {step > 0 ? (
              <button type="button" onClick={prevStep}
                className="dm-btn-prev"
                style={{
                  display:'inline-flex', alignItems:'center', gap:'6px',
                  padding:'12px 20px', borderRadius:'100px',
                  border:`1.5px solid ${C.border}`, background:C.white,
                  color:C.muted, fontSize:'14px', fontWeight:600,
                  fontFamily:'"DM Sans"', cursor:'pointer', transition:'all 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor=C.azure; e.currentTarget.style.color=C.azure; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor=C.border; e.currentTarget.style.color=C.muted; }}
              >
                <ArrowLeft size={14} /> Précédent
              </button>
            ) : <div />}

            {step < 2 ? (
              <button type="button" onClick={nextStep}
                className="dm-btn-next"
                style={{
                  display:'inline-flex', alignItems:'center', justifyContent:'center', gap:'6px',
                  padding:'12px 22px', borderRadius:'100px', border:'none',
                  background:`linear-gradient(135deg, ${C.azure}, ${C.cyanDark})`,
                  color:C.white, fontSize:'14px', fontWeight:700,
                  fontFamily:'"DM Sans"', cursor:'pointer',
                  boxShadow:`0 4px 16px rgba(22,64,200,0.28)`,
                  transition:'all 0.25s ease',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow=`0 8px 22px rgba(22,64,200,0.38)`; }}
                onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow=`0 4px 16px rgba(22,64,200,0.28)`; }}
              >
                Suivant <ArrowRight size={14} />
              </button>
            ) : (
              <button type="submit" disabled={loading}
                className="dm-btn-next"
                style={{
                  display:'inline-flex', alignItems:'center', justifyContent:'center', gap:'8px',
                  padding:'12px 26px', borderRadius:'100px', border:'none',
                  background: loading ? C.border : `linear-gradient(135deg, ${C.azure}, ${C.cyanDark})`,
                  color: loading ? C.mutedLight : C.white,
                  fontSize:'14px', fontWeight:700, fontFamily:'"DM Sans"',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: loading ? 'none' : `0 6px 20px rgba(22,64,200,0.30)`,
                  transition:'all 0.25s',
                }}
              >
                {loading
                  ? <><Loader2 size={15} style={{ animation:'spin 0.8s linear infinite' }} /> Envoi…</>
                  : <><Send size={14} /> Envoyer ma candidature</>
                }
              </button>
            )}
          </div>
        </form>
      </div>
    </motion.div>
  );
}

// ──────────────────────────────────────────────────────────────
// PAGE PRINCIPALE
// ──────────────────────────────────────────────────────────────
export default function DevenirMembre() {
  return (
    <div style={{ fontFamily:'"DM Sans", sans-serif', background:C.offWhite, minHeight:'100vh' }}>

      {/* Hero compact */}
      <div style={{
        paddingTop:    `${NAV_HEIGHT + 40}px`,
        paddingBottom: '48px',
        paddingLeft:   '20px',
        paddingRight:  '20px',
        background:    `linear-gradient(160deg, ${C.azureLight} 0%, #e0f2fe 55%, #f0fdf4 100%)`,
        position:      'relative',
        overflow:      'hidden',
        textAlign:     'center',
      }}>
        {/* Décoration — overflow:hidden sur le parent la coupe proprement */}
        <div style={{ position:'absolute', top:'-60px', right:'-60px', width:'240px', height:'240px', borderRadius:'50%', background:`radial-gradient(circle, ${C.azure}0C 0%, transparent 70%)`, pointerEvents:'none' }} />

        <motion.div
          initial={{ opacity:0, y:18 }}
          animate={{ opacity:1, y:0 }}
          transition={{ duration:0.65, ease:[0.22,1,0.36,1] }}
          style={{ maxWidth:'600px', margin:'0 auto', position:'relative' }}
        >
          <div style={{
            display:'inline-flex', alignItems:'center', gap:'8px',
            background:C.white, border:`1px solid ${C.border}`,
            borderRadius:'100px', padding:'6px 16px', marginBottom:'16px',
          }}>
            <div style={{ width:'7px', height:'7px', borderRadius:'50%', background:C.success, animation:'pulse 2s ease infinite' }} />
            <span style={{ fontFamily:'"DM Sans"', fontSize:'12px', fontWeight:600, color:C.muted }}>
              Candidatures ouvertes
            </span>
          </div>

          <h1 style={{
            fontFamily:'"Playfair Display", serif',
            fontSize:'clamp(1.75rem, 5vw, 3rem)',
            fontWeight:800, color:C.azureDark, margin:'0 0 14px',
            letterSpacing:'-0.01em', lineHeight:1.12,
          }}>
            Faites partie de{' '}
            <em style={{ fontStyle:'italic', color:C.azure }}>l'aventure</em>
          </h1>

          <p style={{ fontFamily:'"DM Sans"', fontSize:'clamp(13px,2.5vw,16px)', color:C.muted, maxWidth:'480px', margin:'0 auto', lineHeight:1.75 }}>
            Remplissez le formulaire — notre équipe RH examinera votre candidature sous 5 à 7 jours ouvrés.
          </p>
        </motion.div>
      </div>

      {/* Layout 2 colonnes → 1 colonne sur mobile */}
      <div className="dm-layout">
        <LeftColumn />
        <RightColumn />
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity:1; transform:scale(1); }
          50%       { opacity:0.55; transform:scale(1.25); }
        }
        @keyframes spin {
          from { transform:rotate(0deg); }
          to   { transform:rotate(360deg); }
        }

        /* ── Layout principal ── */
        .dm-layout {
          max-width: 1280px;
          margin: 0 auto;
          padding: 56px 20px 80px;
          display: grid;
          grid-template-columns: 1fr 1.1fr;
          gap: 60px;
          align-items: start;
        }

        /* ── Sticky colonne gauche — desktop seulement ── */
        .dm-layout > *:first-child {
          position: sticky;
          top: ${NAV_HEIGHT + 28}px;
          align-self: start;
        }

        /* ── Stepper ── */
        .dm-stepper-desktop { display: block; }
        .dm-stepper-mobile  { display: none; }

        /* ── Grille 2 cols dans les étapes ── */
        .dm-grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        /* ── Boutons pleine largeur sur mobile ── */
        .dm-btn-prev,
        .dm-btn-next {
          flex: 1 1 auto;
        }

        /* ════════════════════════════════
           TABLETTE  (≤ 1024px)
        ════════════════════════════════ */
        @media (max-width: 1024px) {
          .dm-layout {
            grid-template-columns: 1fr;
            gap: 36px;
            padding: 40px 20px 60px;
          }
          /* Désactive sticky sur tablette/mobile */
          .dm-layout > *:first-child {
            position: static;
          }
        }

        /* ════════════════════════════════
           MOBILE  (≤ 640px)
        ════════════════════════════════ */
        @media (max-width: 640px) {
          .dm-layout {
            padding: 28px 16px 56px;
            gap: 28px;
          }

          /* Remplace le stepper desktop par le compact */
          .dm-stepper-desktop { display: none; }
          .dm-stepper-mobile  { display: block; }

          /* Champs côte à côte → empilés */
          .dm-grid-2 {
            grid-template-columns: 1fr;
          }

          /* Boutons pleine largeur */
          .dm-btn-prev,
          .dm-btn-next {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
}