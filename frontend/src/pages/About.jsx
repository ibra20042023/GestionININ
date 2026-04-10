/**
 * src/pages/About.jsx
 * ─────────────────────────────────────────────────────────────
 * Page "Qui sommes-nous ?" — style storytelling très aéré.
 * 100% inline styles (zéro dépendance Tailwind).
 * Framer Motion pour les animations au scroll.
 * Tous les hooks importés en haut — zéro require() dans le JSX.
 *
 * Sections :
 *  1. PageHero       — titre + sous-titre fond dégradé léger
 *  2. VisionSection  — 2 colonnes image / texte
 *  3. ValeursSection — grille 4 cartes icônes Lucide
 *  4. EquipeSection  — rangée cartes membres
 *  5. CTASection     — bandeau "Envie de contribuer ?"
 * ─────────────────────────────────────────────────────────────
 */

import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import {
  Zap, Eye, Users, Star,
  ArrowRight, Quote, Heart, CheckCircle2,
} from 'lucide-react';

// ── Palette ININ ──────────────────────────────────────────────
const C = {
  azure:      '#1640c8',
  azureDark:  '#0f172a',
  azureDeep:  '#0f2060',
  azureLight: '#eef5ff',
  azureMid:   'rgba(22,64,200,0.08)',
  cyan:       '#30c8d3',
  cyanDark:   '#17a8b5',
  cyanLight:  '#ecfeff',
  white:      '#ffffff',
  offWhite:   '#f8fafc',
  muted:      '#64748b',
  mutedLight: '#94a3b8',
  border:     '#e2e8f0',
};

const NAV_HEIGHT = 85;

// ── Variants Framer Motion ────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] } },
};
const fadeLeft = {
  hidden: { opacity: 0, x: -40 },
  show:   { opacity: 1, x: 0,  transition: { duration: 0.7,  ease: [0.22, 1, 0.36, 1] } },
};
const fadeRight = {
  hidden: { opacity: 0, x: 40 },
  show:   { opacity: 1, x: 0,  transition: { duration: 0.7,  ease: [0.22, 1, 0.36, 1] } },
};
const stagger = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.13 } },
};

// ── Wrapper FadeIn générique ──────────────────────────────────
function FadeIn({ children, variant = fadeUp, style = {}, amount = 0.2 }) {
  const ref    = useRef(null);
  const inView = useInView(ref, { once: true, amount });
  return (
    <motion.div
      ref={ref}
      variants={variant}
      initial="hidden"
      animate={inView ? 'show' : 'hidden'}
      style={style}
    >
      {children}
    </motion.div>
  );
}

// ── Kicker réutilisable ───────────────────────────────────────
function Kicker({ label, centered = false }) {
  return (
    <div style={{
      display:        'flex',
      alignItems:     'center',
      justifyContent: centered ? 'center' : 'flex-start',
      gap:            '10px',
      marginBottom:   '14px',
    }}>
      <span style={{ display:'block', width:'28px', height:'2px', borderRadius:'2px', background:`linear-gradient(90deg, ${C.azure}, ${C.cyan})` }} />
      <span style={{ fontFamily:'"DM Sans", sans-serif', fontSize:'11px', fontWeight:700, letterSpacing:'0.2em', textTransform:'uppercase', color:C.cyanDark }}>
        {label}
      </span>
      {centered && <span style={{ display:'block', width:'28px', height:'2px', borderRadius:'2px', background:`linear-gradient(90deg, ${C.cyan}, ${C.azure})` }} />}
    </div>
  );
}

// ── Data ──────────────────────────────────────────────────────
const VALEURS = [
  {
    icon:    Zap,
    titre:   'Impact',
    texte:   'Chaque action est mesurée, documentée et orientée vers un résultat tangible pour la jeunesse africaine.',
    color:   C.azure,
    bg:      C.azureLight,
  },
  {
    icon:    Eye,
    titre:   'Transparence',
    texte:   'Nos financements, nos résultats et nos méthodes sont accessibles à toutes nos parties prenantes.',
    color:   C.cyanDark,
    bg:      C.cyanLight,
  },
  {
    icon:    Users,
    titre:   'Solidarité',
    texte:   'Nous croyons en la force du collectif. Chaque bénévole, donateur ou partenaire est un maillon essentiel.',
    color:   C.azure,
    bg:      C.azureLight,
  },
  {
    icon:    Star,
    titre:   'Excellence',
    texte:   'Nos programmes s\'appuient sur des recherches validées et des professionnels de santé qualifiés.',
    color:   C.cyanDark,
    bg:      C.cyanLight,
  },
];

const EQUIPE = [
  {
    initiales: 'AK',
    nom:       'Aminata Koné',
    role:      'Présidente fondatrice',
    bio:       'Psychologue clinicienne, 12 ans de terrain en santé mentale communautaire en Afrique de l\'Ouest.',
    gradient:  `linear-gradient(135deg, ${C.azure}, ${C.cyanDark})`,
  },
  {
    initiales: 'ID',
    nom:       'Ibrahima Diallo',
    role:      'Directeur des Programmes',
    bio:       'Expert en santé publique, coordinateur de +30 projets communautaires en zones sahéliennes.',
    gradient:  `linear-gradient(135deg, ${C.cyanDark}, ${C.cyan})`,
  },
  {
    initiales: 'FM',
    nom:       'Fatou Mbaye',
    role:      'Responsable Communication',
    bio:       'Journaliste et militante, elle amplifie la voix des jeunes africains sur la scène internationale.',
    gradient:  `linear-gradient(135deg, #7e22ce, ${C.azure})`,
  },
  {
    initiales: 'SO',
    nom:       'Seydou Ouédraogo',
    role:      'Responsable Partenariats',
    bio:       'Entrepreneur social, il tisse le réseau de partenaires institutionnels et privés d\'ININ.',
    gradient:  `linear-gradient(135deg, ${C.azure}, #7e22ce)`,
  },
];

const ENGAGEMENTS = [
  'Programmes basés sur des données scientifiques validées',
  'Bénévoles présents dans 8 pays africains',
  'Approche culturellement adaptée à chaque communauté',
  'Suivi individuel et rapports d\'impact annuels',
];

// ──────────────────────────────────────────────────────────────
// 1. PAGE HERO
// ──────────────────────────────────────────────────────────────
function PageHero() {
  return (
    <section style={{
      paddingTop:    `${NAV_HEIGHT + 72}px`,
      paddingBottom: '88px',
      paddingLeft:   '24px',
      paddingRight:  '24px',
      background:    `linear-gradient(160deg, ${C.azureLight} 0%, #e0f2fe 50%, #f0fdf4 100%)`,
      position:      'relative',
      overflow:      'hidden',
    }}>
      <div style={{ position:'absolute', top:'-80px', right:'-80px', width:'360px', height:'360px', borderRadius:'50%', background:`radial-gradient(circle, ${C.azure}10 0%, transparent 70%)`, pointerEvents:'none' }} />
      <div style={{ position:'absolute', bottom:'-60px', left:'-60px', width:'280px', height:'280px', borderRadius:'50%', background:`radial-gradient(circle, ${C.cyan}12 0%, transparent 70%)`, pointerEvents:'none' }} />

      <div style={{ maxWidth:'1280px', margin:'0 auto', position:'relative' }}>
        <div style={{ maxWidth:'680px', margin:'0 auto', textAlign:'center' }}>

          <motion.div
            initial={{ opacity:0, y:14 }}
            animate={{ opacity:1, y:0 }}
            transition={{ duration:0.5 }}
          >
            <Kicker label="À propos de nous" centered />
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
            Qui sommes-nous ?
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
              margin:     '0 auto 36px',
              maxWidth:   '560px',
            }}
          >
            ININ est une association dédiée à l'épanouissement de la jeunesse africaine,
            convaincue qu'une jeunesse en bonne santé — mentalement et physiquement —
            est le fondement d'un avenir prospère pour tout le continent.
          </motion.p>

          <motion.div
            initial={{ scaleX:0 }}
            animate={{ scaleX:1 }}
            transition={{ duration:0.8, delay:0.4, ease:[0.22,1,0.36,1] }}
            style={{ width:'80px', height:'4px', borderRadius:'4px', background:`linear-gradient(90deg, ${C.azure}, ${C.cyan})`, margin:'0 auto' }}
          />
        </div>
      </div>
    </section>
  );
}

// ──────────────────────────────────────────────────────────────
// 2. SECTION VISION
// ──────────────────────────────────────────────────────────────
function VisionSection() {
  const ref    = useRef(null);
  const inView = useInView(ref, { once:true, amount:0.12 });

  return (
    <section ref={ref} style={{ background:C.white, padding:'108px 24px' }}>
      <div style={{
        maxWidth:            '1280px',
        margin:              '0 auto',
        display:             'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap:                 '72px',
        alignItems:          'center',
      }}>

        {/* ── Colonne image (gauche) ── */}
        <motion.div
          variants={fadeLeft}
          initial="hidden"
          animate={inView ? 'show' : 'hidden'}
          style={{ position:'relative' }}
        >
          {/* Image principale */}
          <div style={{
            borderRadius: '24px',
            overflow:     'hidden',
            aspectRatio:  '4/5',
            boxShadow:    `0 28px 72px ${C.azure}18`,
            position:     'relative',
          }}>
            <img
              src="https://images.unsplash.com/photo-1509099836639-18ba1795216d?w=800&q=85&auto=format&fit=crop"
              alt="Jeunes africains en atelier"
              style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}
            />
            <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top, rgba(15,32,96,0.35) 0%, transparent 55%)' }} />
          </div>

          {/* Badge haut-gauche */}
          <div style={{
            position:'absolute', top:'24px', left:'-18px',
            background:C.white, borderRadius:'16px',
            padding:'14px 18px',
            boxShadow:'0 8px 28px rgba(0,0,0,0.1)',
            border:`1px solid ${C.border}`,
            display:'flex', alignItems:'center', gap:'10px',
          }}>
            <div style={{ width:'38px', height:'38px', borderRadius:'50%', background:C.azureLight, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Users size={18} style={{ color:C.azure }} />
            </div>
            <div>
              <div style={{ fontFamily:'"Playfair Display", serif', fontSize:'1.5rem', fontWeight:800, color:C.azure, lineHeight:1 }}>1 200+</div>
              <div style={{ fontFamily:'"DM Sans", sans-serif', fontSize:'11px', color:C.mutedLight, marginTop:'2px' }}>jeunes accompagnés</div>
            </div>
          </div>

          {/* Badge bas-droite */}
          <div style={{
            position:'absolute', bottom:'28px', right:'-14px',
            background:`linear-gradient(135deg, ${C.azure}, ${C.cyanDark})`,
            borderRadius:'16px', padding:'14px 20px',
            boxShadow:`0 8px 24px ${C.azure}40`,
          }}>
            <div style={{ fontFamily:'"Playfair Display", serif', fontSize:'1.5rem', fontWeight:800, color:C.white, lineHeight:1 }}>8 pays</div>
            <div style={{ fontFamily:'"DM Sans", sans-serif', fontSize:'11px', color:'rgba(255,255,255,0.7)', marginTop:'3px' }}>d'intervention</div>
          </div>

          {/* Pastilles déco */}
          <div style={{ position:'absolute', bottom:'-14px', left:'24px', width:'72px', height:'72px', borderRadius:'50%', background:C.azureLight, zIndex:-1 }} />
          <div style={{ position:'absolute', top:'-10px', right:'28px', width:'44px', height:'44px', borderRadius:'50%', background:C.cyanLight, zIndex:-1 }} />
        </motion.div>

        {/* ── Colonne texte (droite) ── */}
        <motion.div
          variants={fadeRight}
          initial="hidden"
          animate={inView ? 'show' : 'hidden'}
          style={{ display:'flex', flexDirection:'column', gap:'24px' }}
        >
          <Kicker label="Notre vision" />

          <h2 style={{
            fontFamily:   '"Playfair Display", Georgia, serif',
            fontSize:     'clamp(1.9rem, 3vw, 2.6rem)',
            fontWeight:   700,
            lineHeight:   1.15,
            color:        C.azureDark,
            margin:       0,
            letterSpacing:'-0.01em',
          }}>
            Ensemble pour une jeunesse{' '}
            <em style={{ fontStyle:'italic', color:C.azure }}>en bonne santé</em>
          </h2>

          <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
            <p style={{ fontFamily:'"DM Sans", sans-serif', fontSize:'16px', lineHeight:1.8, color:C.muted, margin:0 }}>
              Fondée par des professionnels de santé et des militants engagés, ININ est née d'un constat :
              les jeunes africains manquent cruellement d'accompagnement sur les questions de santé mentale
              et physique, deux dimensions pourtant indissociables de leur épanouissement.
            </p>
            <p style={{ fontFamily:'"DM Sans", sans-serif', fontSize:'16px', lineHeight:1.8, color:C.muted, margin:0 }}>
              Notre vision est celle d'une Afrique où chaque jeune, qu'il vive en milieu urbain ou rural,
              a accès à des ressources, des espaces d'écoute et des programmes adaptés à sa réalité.
            </p>
          </div>

          {/* Engagements */}
          <div style={{ display:'flex', flexDirection:'column', gap:'11px', paddingTop:'4px' }}>
            {ENGAGEMENTS.map((item, i) => (
              <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:'10px' }}>
                <CheckCircle2 size={18} style={{ color:C.cyan, flexShrink:0, marginTop:'2px' }} />
                <span style={{ fontFamily:'"DM Sans", sans-serif', fontSize:'14px', color:C.muted, lineHeight:1.6 }}>{item}</span>
              </div>
            ))}
          </div>

          {/* Citation */}
          <div style={{
            background:   C.azureLight,
            borderLeft:   `4px solid ${C.azure}`,
            borderRadius: '0 12px 12px 0',
            padding:      '16px 20px',
            marginTop:    '4px',
          }}>
            <Quote size={16} style={{ color:C.azure, marginBottom:'8px' }} />
            <p style={{ fontFamily:'"Playfair Display", serif', fontSize:'15px', fontStyle:'italic', color:C.azureDark, margin:0, lineHeight:1.65 }}>
              "Une jeunesse épanouie est la promesse d'un continent fort."
            </p>
          </div>
        </motion.div>

      </div>
    </section>
  );
}

// ──────────────────────────────────────────────────────────────
// 3. SECTION VALEURS
// ──────────────────────────────────────────────────────────────
function ValeurCard({ icon: Icon, titre, texte, color, bg, index }) {
  const [hov, setHov] = useState(false);
  return (
    <motion.div
      variants={fadeUp}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background:   C.white,
        borderRadius: '20px',
        border:       `1.5px solid ${hov ? color + '50' : C.border}`,
        padding:      '32px 28px',
        display:      'flex',
        flexDirection:'column',
        gap:          '16px',
        boxShadow:    hov ? `0 16px 48px ${color}15` : '0 2px 12px rgba(0,0,0,0.04)',
        transform:    hov ? 'translateY(-6px)' : 'translateY(0)',
        transition:   'all 0.35s cubic-bezier(0.34,1.56,0.64,1)',
        position:     'relative',
        overflow:     'hidden',
        cursor:       'default',
      }}
    >
      {/* Numéro éditorial */}
      <span style={{
        position:   'absolute', top:'14px', right:'18px',
        fontFamily: '"Playfair Display", serif',
        fontSize:   '3.2rem', fontWeight:800,
        color:      color + '12', lineHeight:1,
        userSelect: 'none', letterSpacing:'-0.04em',
      }}>
        {String(index + 1).padStart(2, '0')}
      </span>

      {/* Icône */}
      <div style={{
        width:'52px', height:'52px', borderRadius:'14px', background:bg,
        display:'flex', alignItems:'center', justifyContent:'center',
        transition:'transform 0.3s ease',
        transform: hov ? 'scale(1.1)' : 'scale(1)',
      }}>
        <Icon size={24} style={{ color }} strokeWidth={1.75} />
      </div>

      <div>
        <h3 style={{ fontFamily:'"Playfair Display", serif', fontSize:'1.15rem', fontWeight:700, color:C.azureDark, margin:'0 0 8px' }}>{titre}</h3>
        <p style={{ fontFamily:'"DM Sans", sans-serif', fontSize:'14px', lineHeight:1.72, color:C.muted, margin:0 }}>{texte}</p>
      </div>

      {/* Trait décoratif */}
      <div style={{ height:'3px', borderRadius:'10px', background:`linear-gradient(90deg, ${color}, transparent)`, width: hov ? '68%' : '28px', transition:'width 0.4s ease', marginTop:'auto' }} />
    </motion.div>
  );
}

function ValeursSection() {
  const ref    = useRef(null);
  const inView = useInView(ref, { once:true, amount:0.12 });

  return (
    <section style={{ background:C.offWhite, padding:'108px 24px' }}>
      <div style={{ maxWidth:'1280px', margin:'0 auto' }}>

        <FadeIn style={{ textAlign:'center', marginBottom:'64px' }}>
          <Kicker label="Ce qui nous guide" centered />
          <h2 style={{ fontFamily:'"Playfair Display", Georgia, serif', fontSize:'clamp(1.9rem, 3vw, 2.6rem)', fontWeight:700, lineHeight:1.15, color:C.azureDark, margin:'0 0 14px', letterSpacing:'-0.01em' }}>
            Nos <em style={{ fontStyle:'italic', color:C.azure }}>valeurs fondatrices</em>
          </h2>
          <p style={{ fontFamily:'"DM Sans", sans-serif', fontSize:'16px', color:C.muted, maxWidth:'500px', margin:'0 auto', lineHeight:1.72 }}>
            Quatre piliers qui structurent chacune de nos actions et guident notre engagement au quotidien.
          </p>
        </FadeIn>

        <motion.div
          ref={ref}
          variants={stagger}
          initial="hidden"
          animate={inView ? 'show' : 'hidden'}
          style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(240px, 1fr))', gap:'24px' }}
        >
          {VALEURS.map((v, i) => (
            <ValeurCard key={v.titre} {...v} index={i} />
          ))}
        </motion.div>

      </div>
    </section>
  );
}

// ──────────────────────────────────────────────────────────────
// 4. SECTION ÉQUIPE
// ──────────────────────────────────────────────────────────────
function MembreCard({ membre }) {
  const [hov, setHov] = useState(false);
  return (
    <motion.div
      variants={fadeUp}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background:           'rgba(255,255,255,0.8)',
        backdropFilter:       'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRadius:   '24px',
        border:         `1.5px solid ${hov ? C.azure + '40' : C.border}`,
        padding:        '36px 28px 28px',
        display:        'flex',
        flexDirection:  'column',
        alignItems:     'center',
        textAlign:      'center',
        gap:            '10px',
        boxShadow:      hov ? `0 20px 48px ${C.azure}14` : '0 4px 20px rgba(0,0,0,0.05)',
        transform:      hov ? 'translateY(-8px)' : 'translateY(0)',
        transition:     'all 0.35s cubic-bezier(0.34,1.56,0.64,1)',
        cursor:         'default',
      }}
    >
      {/* Avatar */}
      <div style={{
        width:'76px', height:'76px', borderRadius:'50%',
        background: membre.gradient,
        display:'flex', alignItems:'center', justifyContent:'center',
        boxShadow:`0 8px 24px ${C.azure}30`,
        marginBottom:'6px',
        transition:'transform 0.3s ease',
        transform: hov ? 'scale(1.08)' : 'scale(1)',
      }}>
        <span style={{ fontFamily:'"Playfair Display", serif', fontSize:'1.4rem', fontWeight:700, color:C.white }}>
          {membre.initiales}
        </span>
      </div>

      <h3 style={{ fontFamily:'"Playfair Display", serif', fontSize:'1.1rem', fontWeight:700, color:C.azureDark, margin:0 }}>
        {membre.nom}
      </h3>
      <span style={{ fontFamily:'"DM Sans", sans-serif', fontSize:'10px', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.14em', color:C.cyanDark }}>
        {membre.role}
      </span>
      <p style={{ fontFamily:'"DM Sans", sans-serif', fontSize:'13.5px', lineHeight:1.68, color:C.muted, margin:'4px 0 0', maxWidth:'200px' }}>
        {membre.bio}
      </p>

      {/* Trait */}
      <div style={{ width: hov ? '56px' : '22px', height:'3px', borderRadius:'10px', background:membre.gradient, transition:'width 0.35s ease', marginTop:'8px' }} />
    </motion.div>
  );
}

function EquipeSection() {
  const ref    = useRef(null);
  const inView = useInView(ref, { once:true, amount:0.12 });

  return (
    <section style={{ background:C.white, padding:'108px 24px', position:'relative', overflow:'hidden' }}>
      <div style={{ position:'absolute', inset:0, pointerEvents:'none', background:`radial-gradient(circle at 15% 50%, ${C.azureLight} 0%, transparent 40%), radial-gradient(circle at 85% 50%, ${C.cyanLight} 0%, transparent 40%)`, opacity:0.6 }} />

      <div style={{ maxWidth:'1280px', margin:'0 auto', position:'relative' }}>
        <FadeIn style={{ textAlign:'center', marginBottom:'64px' }}>
          <Kicker label="Les visages d'ININ" centered />
          <h2 style={{ fontFamily:'"Playfair Display", Georgia, serif', fontSize:'clamp(1.9rem, 3vw, 2.6rem)', fontWeight:700, lineHeight:1.15, color:C.azureDark, margin:0, letterSpacing:'-0.01em' }}>
            L'équipe <em style={{ fontStyle:'italic', color:C.azure }}>fondatrice</em>
          </h2>
        </FadeIn>

        <motion.div
          ref={ref}
          variants={stagger}
          initial="hidden"
          animate={inView ? 'show' : 'hidden'}
          style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(230px, 1fr))', gap:'28px' }}
        >
          {EQUIPE.map(membre => (
            <MembreCard key={membre.nom} membre={membre} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ──────────────────────────────────────────────────────────────
// 5. SECTION CTA
// ──────────────────────────────────────────────────────────────
function CTASection() {
  return (
    <section style={{
      padding:    '96px 24px',
      position:   'relative',
      overflow:   'hidden',
      background: `linear-gradient(135deg, ${C.azureDeep} 0%, ${C.azure} 55%, ${C.cyanDark} 100%)`,
    }}>
      <div style={{ position:'absolute', top:'-80px', right:'-80px', width:'320px', height:'320px', borderRadius:'50%', background:'rgba(255,255,255,0.04)', pointerEvents:'none' }} />
      <div style={{ position:'absolute', bottom:'-60px', left:'-60px', width:'256px', height:'256px', borderRadius:'50%', background:'rgba(48,200,211,0.10)', pointerEvents:'none' }} />

      <FadeIn style={{ maxWidth:'600px', margin:'0 auto', textAlign:'center', position:'relative' }}>
        <div style={{ width:'64px', height:'64px', borderRadius:'50%', background:'rgba(255,255,255,0.12)', border:'1px solid rgba(255,255,255,0.2)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 24px' }}>
          <Heart size={28} style={{ color:C.cyan }} fill={C.cyan} />
        </div>

        <h2 style={{ fontFamily:'"Playfair Display", Georgia, serif', fontSize:'clamp(1.9rem, 3.5vw, 2.6rem)', fontWeight:700, color:C.white, lineHeight:1.15, margin:'0 0 16px', letterSpacing:'-0.01em' }}>
          Envie de contribuer ?
        </h2>
        <p style={{ fontFamily:'"DM Sans", sans-serif', fontSize:'17px', lineHeight:1.75, color:'rgba(255,255,255,0.72)', margin:'0 0 40px' }}>
          Que vous souhaitiez faire un don, devenir bénévole ou simplement partager
          notre mission — chaque geste compte pour la jeunesse africaine.
        </p>

        <div style={{ display:'flex', flexWrap:'wrap', gap:'14px', justifyContent:'center' }}>
          <CTALink to="/contact" primary>Nous contacter <ArrowRight size={16} /></CTALink>
          <CTALink to="/actions">Voir nos actions</CTALink>
        </div>
      </FadeIn>
    </section>
  );
}

function CTALink({ to, primary = false, children }) {
  const [hov, setHov] = useState(false);
  return (
    <Link
      to={to}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display:        'inline-flex',
        alignItems:     'center',
        gap:            '8px',
        padding:        primary ? '14px 32px' : '13px 30px',
        borderRadius:   '100px',
        background:     primary
          ? C.cyan
          : (hov ? 'rgba(255,255,255,0.1)' : 'transparent'),
        border:         primary ? 'none' : `2px solid ${hov ? 'rgba(255,255,255,0.65)' : 'rgba(255,255,255,0.35)'}`,
        color:          primary ? C.azureDeep : C.white,
        fontSize:       '15px',
        fontWeight:     primary ? 700 : 600,
        fontFamily:     '"DM Sans", sans-serif',
        textDecoration: 'none',
        boxShadow:      primary ? (hov ? '0 14px 36px rgba(48,200,211,0.45)' : '0 8px 28px rgba(48,200,211,0.35)') : 'none',
        transform:      primary && hov ? 'translateY(-3px)' : 'translateY(0)',
        transition:     'all 0.3s cubic-bezier(0.34,1.56,0.64,1)',
      }}
    >
      {children}
    </Link>
  );
}

// ──────────────────────────────────────────────────────────────
// PAGE ABOUT — assemblage
// ──────────────────────────────────────────────────────────────
export default function About() {
  return (
    <div style={{ fontFamily:'"DM Sans", sans-serif', background:C.white }}>
      <PageHero />
      <VisionSection />
      <ValeursSection />
      <EquipeSection />
      <CTASection />
    </div>
  );
}