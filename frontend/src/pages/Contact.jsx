/**
 * src/pages/Contact.jsx
 * ─────────────────────────────────────────────────────────────
 * Page Contact — ININ Association
 * 100% styles inline — zéro Tailwind.
 * Framer Motion pour animations au scroll.
 *
 * Sections :
 *  1. PageHero      — titre + sous-titre accueillant
 *  2. CoordSection  — cartes réseaux sociaux + coordonnées directes
 *  3. FormSection   — formulaire Nom/Email/Message + réassurance
 *  4. MapSection    — iframe Google Maps stylisée
 * ─────────────────────────────────────────────────────────────
 */

import { useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import {
  Mail, Phone, MessageCircle, MapPin,
  Send, CheckCircle2, ChevronDown,
  Clock, Shield, Heart,
  Instagram, Linkedin, Facebook,
  Music2,  // TikTok placeholder (lucide n'a pas TikTok)
} from 'lucide-react';

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
};

const NAV_HEIGHT = 85;

// ── Variants Framer ───────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};
const fadeLeft = {
  hidden: { opacity: 0, x: -32 },
  show:   { opacity: 1, x: 0,  transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] } },
};
const fadeRight = {
  hidden: { opacity: 0, x: 32 },
  show:   { opacity: 1, x: 0,  transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] } },
};
const stagger = (d = 0.1) => ({
  hidden: {},
  show:   { transition: { staggerChildren: d } },
});

// ── Wrapper inView ────────────────────────────────────────────
function FadeIn({ children, variant = fadeUp, style = {}, amount = 0.15 }) {
  const ref    = useRef(null);
  const inView = useInView(ref, { once: true, amount });
  return (
    <motion.div
      ref={ref} variants={variant}
      initial="hidden" animate={inView ? 'show' : 'hidden'}
      style={style}
    >
      {children}
    </motion.div>
  );
}

// ── Kicker ────────────────────────────────────────────────────
function Kicker({ label, centered = true }) {
  return (
    <div style={{
      display:'flex', alignItems:'center', gap:'10px', marginBottom:'14px',
      justifyContent: centered ? 'center' : 'flex-start',
    }}>
      <span style={{ display:'block', width:'28px', height:'2px', borderRadius:'2px', background:`linear-gradient(90deg, ${C.azure}, ${C.cyan})` }} />
      <span style={{ fontFamily:'"DM Sans", sans-serif', fontSize:'11px', fontWeight:700, letterSpacing:'0.2em', textTransform:'uppercase', color:C.cyanDark }}>
        {label}
      </span>
      {centered && <span style={{ display:'block', width:'28px', height:'2px', borderRadius:'2px', background:`linear-gradient(90deg, ${C.cyan}, ${C.azure})` }} />}
    </div>
  );
}

// ── Données ───────────────────────────────────────────────────
const RESEAUX = [
  {
    id:     'instagram',
    label:  'Instagram',
    handle: '@inin_association',
    desc:   'Notre quotidien en images',
    url:    'https://instagram.com',
    Icon:   Instagram,
    iconBg: 'linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)',
    textColor: '#fff',
  },
  {
    id:     'facebook',
    label:  'Facebook',
    handle: 'ININ Association',
    desc:   'Rejoignez la communauté',
    url:    'https://facebook.com',
    Icon:   Facebook,
    iconBg: '#1877F2',
    textColor: '#fff',
  },
  {
    id:     'tiktok',
    label:  'TikTok',
    handle: '@inin_asso',
    desc:   'Nos actions en vidéo',
    url:    'https://tiktok.com',
    Icon:   Music2,
    iconBg: 'linear-gradient(135deg, #010101 0%, #69C9D0 100%)',
    textColor: '#fff',
  },
  {
    id:     'linkedin',
    label:  'LinkedIn',
    handle: 'ININ Association',
    desc:   'Actualités & partenariats',
    url:    'https://linkedin.com',
    Icon:   Linkedin,
    iconBg: '#0A66C2',
    textColor: '#fff',
  },
];

const CONTACTS_DIRECTS = [
  {
    Icon:   Mail,
    label:  'Email',
    value:  'contact@inin-association.org',
    href:   'mailto:contact@inin-association.org',
    btn:    'Envoyer un email',
    color:  C.azure,
    bg:     C.azureLight,
    shadow: 'rgba(22,64,200,0.18)',
  },
  {
    Icon:   MessageCircle,
    label:  'WhatsApp',
    value:  '+221 77 000 00 00',
    href:   'https://wa.me/221770000000',
    btn:    'Ouvrir WhatsApp',
    color:  '#16a34a',
    bg:     '#f0fdf4',
    shadow: 'rgba(22,163,74,0.18)',
  },
  {
    Icon:   Phone,
    label:  'Téléphone',
    value:  '+221 33 000 00 00',
    href:   'tel:+221330000000',
    btn:    'Appeler',
    color:  C.cyanDark,
    bg:     C.cyanLight,
    shadow: 'rgba(23,168,181,0.18)',
  },
];

const REASSURANCES = [
  { Icon: Clock,        text: 'Réponse garantie sous 48h en semaine' },
  { Icon: Shield,       text: 'Vos données restent strictement confidentielles' },
  { Icon: Heart,        text: 'Chaque message est lu avec attention' },
  { Icon: CheckCircle2, text: 'Aucune sollicitation commerciale' },
];

// ──────────────────────────────────────────────────────────────
// 1. PAGE HERO
// ──────────────────────────────────────────────────────────────
function PageHero() {
  return (
    <section style={{
      paddingTop:    `${NAV_HEIGHT + 72}px`,
      paddingBottom: '80px',
      paddingLeft:   '24px',
      paddingRight:  '24px',
      background:    `linear-gradient(160deg, ${C.azureLight} 0%, #e0f2fe 55%, #f0fdf4 100%)`,
      position:      'relative',
      overflow:      'hidden',
    }}>
      {/* Cercles décoratifs */}
      <div style={{ position:'absolute', top:'-80px', right:'-80px', width:'360px', height:'360px', borderRadius:'50%', background:`radial-gradient(circle, ${C.azure}10 0%, transparent 70%)`, pointerEvents:'none' }} />
      <div style={{ position:'absolute', bottom:'-60px', left:'-60px', width:'280px', height:'280px', borderRadius:'50%', background:`radial-gradient(circle, ${C.cyan}12 0%, transparent 70%)`, pointerEvents:'none' }} />

      <div style={{ maxWidth:'1280px', margin:'0 auto', position:'relative', textAlign:'center' }}>
        <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5 }}>
          <Kicker label="Parlons-nous" />
        </motion.div>

        <motion.h1
          initial={{ opacity:0, y:22 }}
          animate={{ opacity:1, y:0 }}
          transition={{ duration:0.65, delay:0.12, ease:[0.22,1,0.36,1] }}
          style={{
            fontFamily:   '"Playfair Display", Georgia, serif',
            fontSize:     'clamp(2.4rem, 5vw, 3.8rem)',
            fontWeight:   800,
            lineHeight:   1.1,
            color:        C.azureDark,
            margin:       '0 0 20px',
            letterSpacing:'-0.01em',
          }}
        >
          Contactez-<em style={{ fontStyle:'italic', color:C.azure }}>nous</em>
        </motion.h1>

        <motion.p
          initial={{ opacity:0, y:18 }}
          animate={{ opacity:1, y:0 }}
          transition={{ duration:0.65, delay:0.24, ease:[0.22,1,0.36,1] }}
          style={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize:   '17px',
            lineHeight: 1.78,
            color:      C.muted,
            margin:     '0 auto 40px',
            maxWidth:   '520px',
          }}
        >
          Une question, une idée de partenariat, ou simplement envie d'en savoir plus ?
          Nous sommes là et ravis de vous répondre.
        </motion.p>

        {/* Flèche scroll */}
        <motion.div
          initial={{ opacity:0 }}
          animate={{ opacity:1 }}
          transition={{ duration:0.6, delay:0.5 }}
          style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'6px' }}
        >
          <ChevronDown size={20} style={{ color:C.mutedLight }} />
        </motion.div>
      </div>
    </section>
  );
}

// ──────────────────────────────────────────────────────────────
// 2. SECTION RÉSEAUX & COORDONNÉES
// ──────────────────────────────────────────────────────────────
function ReseauCard({ reseau }) {
  const [hov, setHov] = useState(false);
  const { Icon, label, handle, desc, url, iconBg, textColor } = reseau;

  return (
    <motion.a
      variants={fadeUp}
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display:        'flex',
        flexDirection:  'column',
        gap:            '12px',
        background:     C.white,
        borderRadius:   '18px',
        border:         `1.5px solid ${hov ? C.azure + '40' : C.border}`,
        padding:        '24px 20px',
        textDecoration: 'none',
        boxShadow:      hov ? `0 14px 40px rgba(22,64,200,0.12)` : '0 2px 12px rgba(0,0,0,0.04)',
        transform:      hov ? 'translateY(-5px)' : 'translateY(0)',
        transition:     'all 0.35s cubic-bezier(0.34,1.56,0.64,1)',
        cursor:         'pointer',
      }}
    >
      {/* Icône */}
      <div style={{
        width:'48px', height:'48px', borderRadius:'14px',
        background: iconBg,
        display:'flex', alignItems:'center', justifyContent:'center',
        flexShrink: 0,
        boxShadow: hov ? '0 6px 18px rgba(0,0,0,0.2)' : 'none',
        transition: 'box-shadow 0.3s',
      }}>
        <Icon size={22} style={{ color: textColor }} strokeWidth={1.8} />
      </div>

      <div>
        <div style={{ fontFamily:'"DM Sans", sans-serif', fontSize:'15px', fontWeight:700, color:C.azureDark, marginBottom:'3px' }}>{label}</div>
        <div style={{ fontFamily:'"DM Sans", sans-serif', fontSize:'13px', fontWeight:500, color:C.azure, marginBottom:'5px' }}>{handle}</div>
        <div style={{ fontFamily:'"DM Sans", sans-serif', fontSize:'12px', color:C.muted }}>{desc}</div>
      </div>

      {/* Flèche apparition hover */}
      <div style={{
        display:'flex', alignItems:'center', gap:'4px',
        fontFamily:'"DM Sans", sans-serif', fontSize:'12px', fontWeight:600,
        color: C.azure,
        opacity: hov ? 1 : 0,
        transform: hov ? 'translateX(0)' : 'translateX(-6px)',
        transition: 'all 0.25s ease',
        marginTop: 'auto',
      }}>
        Visiter →
      </div>
    </motion.a>
  );
}

function ContactDirectCard({ contact }) {
  const [hov, setHov] = useState(false);
  const { Icon, label, value, href, btn, color, bg, shadow } = contact;

  return (
    <motion.div
      variants={fadeUp}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background:   C.white,
        borderRadius: '18px',
        border:       `1.5px solid ${hov ? color + '40' : C.border}`,
        padding:      '28px 24px',
        display:      'flex',
        flexDirection:'column',
        gap:          '16px',
        boxShadow:    hov ? `0 14px 40px ${shadow}` : '0 2px 12px rgba(0,0,0,0.04)',
        transform:    hov ? 'translateY(-5px)' : 'translateY(0)',
        transition:   'all 0.35s cubic-bezier(0.34,1.56,0.64,1)',
      }}
    >
      <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
        <div style={{ width:'44px', height:'44px', borderRadius:'12px', background:bg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          <Icon size={20} style={{ color }} strokeWidth={1.8} />
        </div>
        <div>
          <div style={{ fontFamily:'"DM Sans", sans-serif', fontSize:'11px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.12em', color:C.mutedLight, marginBottom:'2px' }}>{label}</div>
          <div style={{ fontFamily:'"DM Sans", sans-serif', fontSize:'14px', fontWeight:600, color:C.azureDark }}>{value}</div>
        </div>
      </div>

      <a
        href={href}
        target={href.startsWith('http') ? '_blank' : '_self'}
        rel="noopener noreferrer"
        style={{
          display:        'inline-flex',
          alignItems:     'center',
          justifyContent: 'center',
          gap:            '6px',
          padding:        '10px 18px',
          borderRadius:   '100px',
          background:     hov ? color : bg,
          color:          hov ? C.white : color,
          fontSize:       '13px',
          fontWeight:     600,
          fontFamily:     '"DM Sans", sans-serif',
          textDecoration: 'none',
          border:         `1.5px solid ${color + '30'}`,
          transition:     'all 0.25s ease',
          marginTop:      'auto',
        }}
      >
        {btn}
      </a>
    </motion.div>
  );
}

function CoordSection() {
  const refReseaux = useRef(null);
  const inViewR    = useInView(refReseaux, { once:true, amount:0.1 });
  const refDirect  = useRef(null);
  const inViewD    = useInView(refDirect, { once:true, amount:0.1 });

  return (
    <section style={{ background:C.offWhite, padding:'104px 24px' }}>
      <div style={{ maxWidth:'1280px', margin:'0 auto' }}>

        {/* ── Réseaux sociaux ── */}
        <FadeIn style={{ textAlign:'center', marginBottom:'48px' }}>
          <Kicker label="Nos réseaux" />
          <h2 style={{ fontFamily:'"Playfair Display", Georgia, serif', fontSize:'clamp(1.8rem, 2.8vw, 2.4rem)', fontWeight:700, color:C.azureDark, margin:'0 0 12px', letterSpacing:'-0.01em' }}>
            Suivez-nous sur les <em style={{ fontStyle:'italic', color:C.azure }}>réseaux</em>
          </h2>
        </FadeIn>

        <motion.div
          ref={refReseaux}
          variants={stagger(0.1)}
          initial="hidden"
          animate={inViewR ? 'show' : 'hidden'}
          style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(220px, 1fr))', gap:'20px', marginBottom:'72px' }}
        >
          {RESEAUX.map(r => <ReseauCard key={r.id} reseau={r} />)}
        </motion.div>

        {/* ── Contacts directs ── */}
        <FadeIn style={{ textAlign:'center', marginBottom:'48px' }}>
          <Kicker label="Contact direct" />
          <h2 style={{ fontFamily:'"Playfair Display", Georgia, serif', fontSize:'clamp(1.8rem, 2.8vw, 2.4rem)', fontWeight:700, color:C.azureDark, margin:'0 0 12px', letterSpacing:'-0.01em' }}>
            Écrivez-nous <em style={{ fontStyle:'italic', color:C.cyanDark }}>directement</em>
          </h2>
        </FadeIn>

        <motion.div
          ref={refDirect}
          variants={stagger(0.12)}
          initial="hidden"
          animate={inViewD ? 'show' : 'hidden'}
          style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(260px, 1fr))', gap:'24px' }}
        >
          {CONTACTS_DIRECTS.map(c => <ContactDirectCard key={c.label} contact={c} />)}
        </motion.div>

      </div>
    </section>
  );
}

// ──────────────────────────────────────────────────────────────
// 3. SECTION FORMULAIRE
// ──────────────────────────────────────────────────────────────

// Composant champ stylisé avec focus ring cyan
function Field({ label, id, type = 'text', placeholder, value, onChange, multiline = false, required = false }) {
  const [focused, setFocused] = useState(false);
  const sharedStyle = {
    width:           '100%',
    padding:         '14px 16px',
    borderRadius:    '12px',
    border:          `1.5px solid ${focused ? C.cyan : C.border}`,
    outline:         'none',
    fontFamily:      '"DM Sans", sans-serif',
    fontSize:        '15px',
    color:           C.azureDark,
    background:      focused ? C.white : C.offWhite,
    boxShadow:       focused ? `0 0 0 3px rgba(48,200,211,0.18)` : 'none',
    transition:      'border-color 0.2s, box-shadow 0.2s, background 0.2s',
    resize:          multiline ? 'vertical' : 'none',
    boxSizing:       'border-box',
    display:         'block',
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'7px' }}>
      <label htmlFor={id} style={{
        fontFamily:   '"DM Sans", sans-serif',
        fontSize:     '13px',
        fontWeight:   600,
        color:        focused ? C.cyanDark : C.azureDark,
        transition:   'color 0.2s',
        letterSpacing:'0.02em',
      }}>
        {label}{required && <span style={{ color:C.cyan, marginLeft:'3px' }}>*</span>}
      </label>
      {multiline ? (
        <textarea
          id={id}
          rows={5}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{ ...sharedStyle, minHeight:'120px' }}
        />
      ) : (
        <input
          id={id}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={sharedStyle}
        />
      )}
    </div>
  );
}

function FormSection() {
  const [form, setForm]       = useState({ nom:'', email:'', sujet:'', message:'' });
  const [sent, setSent]       = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors]   = useState({});

  const ref    = useRef(null);
  const inView = useInView(ref, { once:true, amount:0.1 });

  const update = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  const validate = () => {
    const errs = {};
    if (!form.nom.trim())     errs.nom     = 'Le nom est requis';
    if (!form.email.trim())   errs.email   = 'L\'email est requis';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Email invalide';
    if (!form.message.trim()) errs.message = 'Le message est requis';
    return errs;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    // Simulation envoi
    setTimeout(() => {
      console.log('📩 Formulaire ININ soumis :', form);
      setLoading(false);
      setSent(true);
      setForm({ nom:'', email:'', sujet:'', message:'' });
    }, 1000);
  };

  return (
    <section id="contact" style={{ background:C.white, padding:'104px 24px' }}>
      <div ref={ref} style={{ maxWidth:'1280px', margin:'0 auto' }}>

        <FadeIn style={{ textAlign:'center', marginBottom:'64px' }}>
          <Kicker label="Formulaire de contact" />
          <h2 style={{ fontFamily:'"Playfair Display", Georgia, serif', fontSize:'clamp(1.8rem, 2.8vw, 2.4rem)', fontWeight:700, color:C.azureDark, margin:'0 0 12px', letterSpacing:'-0.01em' }}>
            Envoyez-nous un <em style={{ fontStyle:'italic', color:C.azure }}>message</em>
          </h2>
          <p style={{ fontFamily:'"DM Sans", sans-serif', fontSize:'16px', color:C.muted, maxWidth:'460px', margin:'0 auto', lineHeight:1.7 }}>
            Remplissez le formulaire ci-dessous, nous vous répondrons sous 48h.
          </p>
        </FadeIn>

        {/* ── Grid formulaire / réassurance ── */}
        <motion.div
          variants={{ hidden:{}, show:{ transition:{ staggerChildren:0.15 } } }}
          initial="hidden"
          animate={inView ? 'show' : 'hidden'}
          style={{
            display:             'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap:                 '56px',
            alignItems:          'start',
          }}
        >
          {/* ── Formulaire (gauche) ── */}
          <motion.div variants={fadeLeft}>
            {sent ? (
              /* Message de succès */
              <div style={{
                background:   C.successBg,
                borderRadius: '20px',
                border:       `1.5px solid rgba(22,163,74,0.25)`,
                padding:      '40px 32px',
                textAlign:    'center',
                display:      'flex',
                flexDirection:'column',
                alignItems:   'center',
                gap:          '16px',
              }}>
                <div style={{ width:'64px', height:'64px', borderRadius:'50%', background:'rgba(22,163,74,0.12)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <CheckCircle2 size={32} style={{ color:C.success }} />
                </div>
                <h3 style={{ fontFamily:'"Playfair Display", serif', fontSize:'1.4rem', fontWeight:700, color:C.azureDark, margin:0 }}>
                  Message envoyé !
                </h3>
                <p style={{ fontFamily:'"DM Sans", sans-serif', fontSize:'15px', color:C.muted, margin:0, lineHeight:1.65 }}>
                  Merci pour votre message. L'équipe ININ vous répondra dans les 48h.
                </p>
                <button
                  onClick={() => setSent(false)}
                  style={{
                    padding:'10px 24px', borderRadius:'100px', border:'none',
                    background:C.azureAlpha, color:C.azure,
                    fontFamily:'"DM Sans", sans-serif', fontSize:'14px', fontWeight:600,
                    cursor:'pointer', marginTop:'8px', transition:'background 0.2s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = C.azureLight}
                  onMouseLeave={e => e.currentTarget.style.background = C.azureAlpha}
                >
                  Envoyer un autre message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate style={{ display:'flex', flexDirection:'column', gap:'22px' }}>
                <Field
                  id="nom" label="Nom complet" placeholder="Aminata Koné"
                  value={form.nom} onChange={update('nom')} required
                />
                {errors.nom && <span style={{ fontFamily:'"DM Sans"', fontSize:'12px', color:'#dc2626', marginTop:'-12px' }}>{errors.nom}</span>}

                <Field
                  id="email" label="Adresse email" type="email" placeholder="vous@exemple.com"
                  value={form.email} onChange={update('email')} required
                />
                {errors.email && <span style={{ fontFamily:'"DM Sans"', fontSize:'12px', color:'#dc2626', marginTop:'-12px' }}>{errors.email}</span>}

                <Field
                  id="sujet" label="Sujet" placeholder="Partenariat, bénévolat, information..."
                  value={form.sujet} onChange={update('sujet')}
                />

                <Field
                  id="message" label="Votre message" multiline
                  placeholder="Décrivez votre demande, projet ou question..."
                  value={form.message} onChange={update('message')} required
                />
                {errors.message && <span style={{ fontFamily:'"DM Sans"', fontSize:'12px', color:'#dc2626', marginTop:'-12px' }}>{errors.message}</span>}

                {/* Bouton submit */}
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    display:        'inline-flex',
                    alignItems:     'center',
                    justifyContent: 'center',
                    gap:            '8px',
                    padding:        '14px 28px',
                    borderRadius:   '100px',
                    border:         'none',
                    cursor:         loading ? 'not-allowed' : 'pointer',
                    background:     loading
                      ? C.border
                      : `linear-gradient(135deg, ${C.azure}, ${C.cyanDark})`,
                    color:          loading ? C.mutedLight : C.white,
                    fontSize:       '15px',
                    fontWeight:     700,
                    fontFamily:     '"DM Sans", sans-serif',
                    boxShadow:      loading ? 'none' : `0 6px 20px rgba(22,64,200,0.3)`,
                    transition:     'all 0.25s ease',
                    marginTop:      '4px',
                  }}
                  onMouseEnter={e => { if (!loading) { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow=`0 12px 28px rgba(22,64,200,0.38)`; }}}
                  onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow=loading?'none':`0 6px 20px rgba(22,64,200,0.3)`; }}
                >
                  {loading
                    ? <span style={{ display:'inline-flex', alignItems:'center', gap:'8px' }}>
                        <span style={{ width:'16px', height:'16px', borderRadius:'50%', border:'2px solid #ccc', borderTopColor:C.azure, animation:'spin 0.7s linear infinite', display:'inline-block' }} />
                        Envoi en cours...
                      </span>
                    : <><Send size={16} /> Envoyer le message</>
                  }
                </button>

                <p style={{ fontFamily:'"DM Sans", sans-serif', fontSize:'12px', color:C.mutedLight, margin:0, lineHeight:1.5 }}>
                  * Champs obligatoires. Données protégées conformément à notre politique de confidentialité.
                </p>
              </form>
            )}
          </motion.div>

          {/* ── Réassurance (droite) ── */}
          <motion.div variants={fadeRight} style={{ display:'flex', flexDirection:'column', gap:'32px' }}>

            {/* Bloc principal */}
            <div style={{
              background:   C.azureLight,
              borderRadius: '20px',
              padding:      '32px 28px',
              border:       `1.5px solid rgba(22,64,200,0.12)`,
            }}>
              <div style={{ fontFamily:'"Playfair Display", serif', fontSize:'1.2rem', fontWeight:700, color:C.azureDark, marginBottom:'16px' }}>
                Pourquoi nous contacter ?
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
                {REASSURANCES.map(({ Icon, text }) => (
                  <div key={text} style={{ display:'flex', alignItems:'flex-start', gap:'12px' }}>
                    <div style={{ width:'32px', height:'32px', borderRadius:'10px', background:C.white, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, boxShadow:'0 2px 8px rgba(22,64,200,0.1)' }}>
                      <Icon size={16} style={{ color:C.azure }} />
                    </div>
                    <span style={{ fontFamily:'"DM Sans", sans-serif', fontSize:'14px', color:C.muted, lineHeight:1.6, paddingTop:'4px' }}>
                      {text}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Adresse */}
            <div style={{
              background:   C.white,
              borderRadius: '20px',
              padding:      '28px 24px',
              border:       `1.5px solid ${C.border}`,
              display:      'flex',
              gap:          '14px',
              alignItems:   'flex-start',
            }}>
              <div style={{ width:'40px', height:'40px', borderRadius:'12px', background:C.cyanLight, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <MapPin size={18} style={{ color:C.cyanDark }} />
              </div>
              <div>
                <div style={{ fontFamily:'"DM Sans", sans-serif', fontSize:'13px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', color:C.mutedLight, marginBottom:'5px' }}>Adresse</div>
                <div style={{ fontFamily:'"DM Sans", sans-serif', fontSize:'14px', color:C.azureDark, fontWeight:600, lineHeight:1.55 }}>
                  123 Avenue de la Jeunesse<br />
                  Dakar, Sénégal
                </div>
              </div>
            </div>

          </motion.div>
        </motion.div>
      </div>

      {/* Keyframe spinner */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </section>
  );
}

// ──────────────────────────────────────────────────────────────
// 4. SECTION MAP
// ──────────────────────────────────────────────────────────────
function MapSection() {
  return (
    <section style={{ background:C.offWhite, padding:'0 0 104px' }}>
      <div style={{ maxWidth:'1280px', margin:'0 auto', padding:'0 24px' }}>

        <FadeIn style={{ textAlign:'center', padding:'64px 0 40px' }}>
          <Kicker label="Où nous trouver" />
          <h2 style={{ fontFamily:'"Playfair Display", Georgia, serif', fontSize:'clamp(1.8rem, 2.8vw, 2.4rem)', fontWeight:700, color:C.azureDark, margin:'0 0 12px', letterSpacing:'-0.01em' }}>
            Notre <em style={{ fontStyle:'italic', color:C.cyanDark }}>localisation</em>
          </h2>
          <p style={{ fontFamily:'"DM Sans", sans-serif', fontSize:'16px', color:C.muted, maxWidth:'400px', margin:'0 auto', lineHeight:1.7 }}>
            123 Avenue de la Jeunesse — Dakar, Sénégal
          </p>
        </FadeIn>

        {/* Carte Google Maps */}
        <FadeIn style={{ borderRadius:'24px', overflow:'hidden', boxShadow:`0 20px 60px rgba(22,64,200,0.1)`, border:`1.5px solid ${C.border}`, position:'relative' }}>
          <iframe
            title="Localisation ININ Association — Dakar"
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3858.791040296261!2d-17.44406068522!3d14.693425589784!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xec172f5b3c5b5b5%3A0x0!2sDakar%2C%20S%C3%A9n%C3%A9gal!5e0!3m2!1sfr!2sfr!4v1680000000000!5m2!1sfr!2sfr"
            width="100%"
            height="440"
            style={{ border:0, display:'block' }}
            allowFullScreen=""
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />

          {/* Overlay carte — info bulle stylisée */}
          <div style={{
            position:             'absolute',
            top:                  '20px',
            left:                 '20px',
            background:           'rgba(255,255,255,0.95)',
            backdropFilter:       'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            borderRadius:         '16px',
            padding:              '16px 20px',
            boxShadow:            '0 8px 28px rgba(0,0,0,0.12)',
            border:               `1px solid ${C.border}`,
            display:              'flex',
            alignItems:           'center',
            gap:                  '12px',
            maxWidth:             '280px',
          }}>
            <div style={{ width:'40px', height:'40px', borderRadius:'50%', background:`linear-gradient(135deg, ${C.azure}, ${C.cyanDark})`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <MapPin size={18} style={{ color:C.white }} />
            </div>
            <div>
              <div style={{ fontFamily:'"DM Sans", sans-serif', fontSize:'13px', fontWeight:700, color:C.azureDark }}>ININ Association</div>
              <div style={{ fontFamily:'"DM Sans", sans-serif', fontSize:'12px', color:C.muted, marginTop:'2px' }}>123 Avenue de la Jeunesse, Dakar</div>
            </div>
          </div>
        </FadeIn>

      </div>
    </section>
  );
}

// ──────────────────────────────────────────────────────────────
// PAGE CONTACT — assemblage
// ──────────────────────────────────────────────────────────────
export default function Contact() {
  return (
    <div style={{ fontFamily:'"DM Sans", sans-serif', background:C.white }}>
      <PageHero />
      <CoordSection />
      <FormSection />
      <MapSection />
    </div>
  );
}