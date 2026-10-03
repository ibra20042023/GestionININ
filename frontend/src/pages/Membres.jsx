/**
 * src/pages/Membres.jsx
 * ─────────────────────────────────────────────────────────────
 * VERSION FINALE — 5 règles de sécurité appliquées :
 *
 * RÈGLE 1 — resolvePhotoUrl : URL absolue détectée en premier,
 *   null géré, fallback Unsplash cyclé sur l'index.
 *
 * RÈGLE 2 — Mapping explicite des props : nom, role, image
 *   extraits de nom_affiche, role_display, photo_url à la source.
 *
 * RÈGLE 3 — États sécurisés : data.equipe || [] et
 *   data.benevoles || [] — jamais undefined.
 *
 * RÈGLE 4 — Fallback visible : EmptyState affiché si liste vide,
 *   jamais d'écran blanc silencieux.
 *
 * RÈGLE 5 — Debug console : catch(error) avec console.error
 *   explicite indiquant la cause probable (CORS, réseau, etc.)
 * ─────────────────────────────────────────────────────────────
 */

import { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import axios from 'axios';
import {
  Linkedin, Instagram, UserCheck,
  ArrowRight, Heart, Users,
} from 'lucide-react';

// ── Config API ────────────────────────────────────────────────
const API_BASE    = import.meta.env.VITE_API_URL;
const API_MEMBRES = `${API_BASE}/api/liste-membres/`;
const API_STATS   = `${API_BASE}/api/stats-membres/`;

// ── Fallbacks Unsplash (cyclés sur l'index) ───────────────────
const FALLBACK_PHOTOS = [
  'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=400&q=80&auto=format&fit=crop&facepad=3&crop=faces',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&q=80&auto=format&fit=crop&facepad=3&crop=faces',
  'https://images.unsplash.com/photo-1589156280159-27698a70f29e?w=400&q=80&auto=format&fit=crop&facepad=3&crop=faces',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80&auto=format&fit=crop&facepad=3&crop=faces',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&q=80&auto=format&fit=crop&facepad=3&crop=faces',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&q=80&auto=format&fit=crop&facepad=3&crop=faces',
];

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
};

const NAV_HEIGHT = 85;

// ── Framer Motion variants ────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};
const stagger = (delay = 0.11) => ({
  hidden: {},
  show:   { transition: { staggerChildren: delay } },
});

// ─────────────────────────────────────────────────────────────
// RÈGLE 1 — resolvePhotoUrl (une seule fonction, utilisée partout)
// Priorité : URL absolue → URL relative → null → fallback Unsplash
// ─────────────────────────────────────────────────────────────
function resolvePhotoUrl(photoUrl, fallbackIndex = 0) {
  // null / undefined / chaîne vide → fallback immédiat
  if (!photoUrl) {
    return FALLBACK_PHOTOS[fallbackIndex % FALLBACK_PHOTOS.length];
  }
  // URL absolue (http:// ou https://) → retourner telle quelle
  if (photoUrl.startsWith('http://') || photoUrl.startsWith('https://')) {
    return photoUrl;
  }
  // URL relative Django (/media/membres/photos/xxx.jpg)
  if (photoUrl.startsWith('/')) {
    return `${API_BASE}${photoUrl}`;
  }
  // Cas edge : chemin sans slash leading
  return `${API_BASE}/${photoUrl}`;
}

// ── Helpers ───────────────────────────────────────────────────
function FadeSection({ children, style = {}, amount = 0.15 }) {
  const ref    = useRef(null);
  const inView = useInView(ref, { once: true, amount });
  return (
    <motion.div
      ref={ref}
      variants={fadeUp}
      initial="hidden"
      animate={inView ? 'show' : 'hidden'}
      style={style}
    >
      {children}
    </motion.div>
  );
}

function Kicker({ label }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'10px', marginBottom:'14px' }}>
      <span style={{ display:'block', width:'28px', height:'2px', borderRadius:'2px', background:`linear-gradient(90deg, ${C.azure}, ${C.cyan})` }} />
      <span style={{ fontFamily:'"DM Sans", sans-serif', fontSize:'11px', fontWeight:700, letterSpacing:'0.2em', textTransform:'uppercase', color:C.cyanDark }}>{label}</span>
      <span style={{ display:'block', width:'28px', height:'2px', borderRadius:'2px', background:`linear-gradient(90deg, ${C.cyan}, ${C.azure})` }} />
    </div>
  );
}

function SkeletonCard({ height = '320px' }) {
  return (
    <div style={{
      background:   C.border,
      borderRadius: '24px',
      height,
      animation:    'pulse 1.6s ease-in-out infinite',
    }} />
  );
}

// RÈGLE 4 — Composant fallback visible (jamais d'écran blanc)
function EmptyState({ message }) {
  return (
    <div style={{
      textAlign:    'center',
      padding:      '64px 24px',
      fontFamily:   '"DM Sans", sans-serif',
      fontSize:     '15px',
      color:        C.mutedLight,
      background:   C.offWhite,
      borderRadius: '16px',
      border:       `1px dashed ${C.border}`,
    }}>
      <div style={{ fontSize:'2rem', marginBottom:'12px' }}>👥</div>
      <p style={{ margin:0 }}>{message}</p>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// PAGE HERO
// ──────────────────────────────────────────────────────────────
function PageHero({ stats, loadingStats }) {
  const statItems = [
    { n: loadingStats ? '—' : (stats?.nb_membres_officiels ?? '—'), label: 'Membres officiels' },
    { n: loadingStats ? '—' : (stats?.nb_benevoles_actifs  ?? '—'), label: 'Bénévoles actifs'  },
    { n: loadingStats ? '—' : (stats?.nb_pays              ?? '—'), label: 'Pays couverts'      },
  ];
  return (
    <section style={{
      paddingTop: `${NAV_HEIGHT + 72}px`, paddingBottom:'80px',
      paddingLeft:'24px', paddingRight:'24px',
      background:`linear-gradient(160deg, ${C.azureLight} 0%, #e0f2fe 50%, #f0fdf4 100%)`,
      position:'relative', overflow:'hidden',
    }}>
      <div style={{ position:'absolute', top:'-80px', right:'-80px', width:'360px', height:'360px', borderRadius:'50%', background:`radial-gradient(circle, ${C.azure}10 0%, transparent 70%)`, pointerEvents:'none' }} />
      <div style={{ position:'absolute', bottom:'-60px', left:'-60px', width:'280px', height:'280px', borderRadius:'50%', background:`radial-gradient(circle, ${C.cyan}12 0%, transparent 70%)`, pointerEvents:'none' }} />
      <div style={{ maxWidth:'1280px', margin:'0 auto', textAlign:'center', position:'relative' }}>
        <motion.div initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5 }}>
          <Kicker label="L'association ININ" />
        </motion.div>
        <motion.h1
          initial={{ opacity:0, y:22 }} animate={{ opacity:1, y:0 }}
          transition={{ duration:0.65, delay:0.12, ease:[0.22,1,0.36,1] }}
          style={{ fontFamily:'"Playfair Display", Georgia, serif', fontSize:'clamp(2.4rem, 5vw, 3.8rem)', fontWeight:800, lineHeight:1.1, color:C.azureDark, margin:'0 0 20px', letterSpacing:'-0.01em' }}
        >
          Notre équipe &{' '}
          <em style={{ fontStyle:'italic', color:C.azure }}>nos bénévoles</em>
        </motion.h1>
        <motion.p
          initial={{ opacity:0, y:18 }} animate={{ opacity:1, y:0 }}
          transition={{ duration:0.65, delay:0.24, ease:[0.22,1,0.36,1] }}
          style={{ fontFamily:'"DM Sans", sans-serif', fontSize:'17px', lineHeight:1.78, color:C.muted, margin:'0 auto', maxWidth:'560px' }}
        >
          Derrière ININ, des femmes et des hommes engagés qui donnent de leur temps,
          de leur énergie et de leur expertise pour la jeunesse africaine.
        </motion.p>
        <motion.div
          initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }}
          transition={{ duration:0.6, delay:0.38, ease:[0.22,1,0.36,1] }}
          style={{ display:'flex', justifyContent:'center', gap:'40px', flexWrap:'wrap', marginTop:'40px' }}
        >
          {statItems.map(({ n, label }) => (
            <div key={label} style={{ textAlign:'center' }}>
              <div style={{ fontFamily:'"Playfair Display", serif', fontSize:'2.4rem', fontWeight:800, color:C.azure, lineHeight:1, minWidth:'48px', opacity: loadingStats ? 0.4 : 1, transition:'opacity .4s' }}>
                {n}
              </div>
              <div style={{ fontFamily:'"DM Sans", sans-serif', fontSize:'12px', fontWeight:500, color:C.muted, marginTop:'4px', textTransform:'uppercase', letterSpacing:'0.1em' }}>
                {label}
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ──────────────────────────────────────────────────────────────
// RÈGLE 2 — MembreCard : props normalisées (nom, role, image)
// Le mapping depuis l'API se fait dans MembresSection.map()
// ──────────────────────────────────────────────────────────────
function MembreCard({ nom, prenom, role, image, adresse, linkedin, instagram }) {
  const [hov,      setHov]      = useState(false);
  const [imgError, setImgError] = useState(false);

  const src = imgError ? FALLBACK_PHOTOS[0] : image;

  return (
    <motion.div
      variants={fadeUp}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background:C.white, borderRadius:'24px',
        border:`1.5px solid ${hov ? C.azure + '55' : C.border}`,
        overflow:'hidden',
        boxShadow: hov ? `0 20px 56px ${C.azure}18` : '0 4px 20px rgba(0,0,0,0.06)',
        transform: hov ? 'translateY(-8px)' : 'translateY(0)',
        transition:'all 0.4s cubic-bezier(0.34,1.56,0.64,1)',
        display:'flex', flexDirection:'column',
      }}
    >
      <div style={{ position:'relative', aspectRatio:'1/1', overflow:'hidden' }}>
        <img
          src={src}
          alt={`${prenom} ${nom}`}
          onError={() => setImgError(true)}
          style={{ width:'100%', height:'100%', objectFit:'cover', display:'block', transition:'transform 0.5s ease', transform: hov ? 'scale(1.06)' : 'scale(1)' }}
        />
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top, rgba(15,32,96,0.5) 0%, transparent 60%)' }} />
        <div style={{ position:'absolute', bottom:'14px', left:'14px', background:'rgba(255,255,255,0.15)', backdropFilter:'blur(8px)', border:'1px solid rgba(255,255,255,0.3)', borderRadius:'100px', padding:'5px 12px', fontFamily:'"DM Sans", sans-serif', fontSize:'11px', fontWeight:700, color:C.white, letterSpacing:'0.06em', textTransform:'uppercase' }}>
          {role}
        </div>
        <div style={{ position:'absolute', top:'14px', right:'14px', display:'flex', gap:'8px', opacity: hov ? 1 : 0, transform: hov ? 'translateY(0)' : 'translateY(-8px)', transition:'all 0.3s ease' }}>
          {linkedin && (
            <a href={linkedin} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
              style={{ width:'34px', height:'34px', borderRadius:'50%', background:'rgba(255,255,255,0.2)', backdropFilter:'blur(8px)', border:'1px solid rgba(255,255,255,0.35)', display:'flex', alignItems:'center', justifyContent:'center', textDecoration:'none' }}>
              <Linkedin size={15} style={{ color:C.white }} />
            </a>
          )}
          {instagram && (
            <a href={instagram} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
              style={{ width:'34px', height:'34px', borderRadius:'50%', background:'rgba(255,255,255,0.2)', backdropFilter:'blur(8px)', border:'1px solid rgba(255,255,255,0.35)', display:'flex', alignItems:'center', justifyContent:'center', textDecoration:'none' }}>
              <Instagram size={15} style={{ color:C.white }} />
            </a>
          )}
        </div>
      </div>
      <div style={{ padding:'24px 24px 28px', flex:1, display:'flex', flexDirection:'column', gap:'12px' }}>
        <h3 style={{ fontFamily:'"Playfair Display", Georgia, serif', fontSize:'1.2rem', fontWeight:700, color:C.azureDark, margin:0, lineHeight:1.2 }}>
          {prenom} {nom}
        </h3>
        {adresse && (
          <p style={{ fontFamily:'"DM Sans", sans-serif', fontSize:'12px', color:C.mutedLight, margin:0 }}>
            📍 {adresse}
          </p>
        )}
        <div style={{ height:'2px', borderRadius:'10px', background:`linear-gradient(90deg, ${C.azure}, ${C.cyan})`, width: hov ? '60%' : '24px', transition:'width 0.4s ease', marginTop:'auto' }} />
      </div>
    </motion.div>
  );
}

// ──────────────────────────────────────────────────────────────
// SECTION MEMBRES
// ──────────────────────────────────────────────────────────────
function MembresSection({ membres, loading }) {
  const ref    = useRef(null);
  const inView = useInView(ref, { once:true, amount:0.1 });
  return (
    <section style={{ background:C.white, padding:'104px 24px' }}>
      <div style={{ maxWidth:'1280px', margin:'0 auto' }}>
        <FadeSection style={{ textAlign:'center', marginBottom:'56px' }}>
          <Kicker label="L'équipe officielle" />
          <h2 style={{ fontFamily:'"Playfair Display", Georgia, serif', fontSize:'clamp(1.9rem, 3vw, 2.6rem)', fontWeight:700, color:C.azureDark, margin:'0 0 14px' }}>
            Notre <em style={{ fontStyle:'italic', color:C.azure }}>équipe</em>
          </h2>
          <p style={{ fontFamily:'"DM Sans", sans-serif', fontSize:'16px', color:C.muted, maxWidth:'480px', margin:'0 auto', lineHeight:1.72 }}>
            Les membres fondateurs qui portent la vision et la stratégie de l'association au quotidien.
          </p>
        </FadeSection>

        {loading ? (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(260px, 1fr))', gap:'28px' }}>
            {[1,2,3,4].map(i => <SkeletonCard key={i} height="380px" />)}
          </div>
        ) : membres.length === 0 ? (
          <EmptyState message="Aucun membre officiel trouvé. Vérifiez que des membres actifs sont enregistrés en base de données." />
        ) : (
          <motion.div
            ref={ref}
            variants={stagger(0.12)}
            initial="hidden"
            animate="show"
            style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(260px, 1fr))', gap:'28px' }}
          >
            {membres.map((m, i) => (
              // RÈGLE 2 — Mapping explicite : nom_affiche → nom, etc.
              <MembreCard
                key={m.id}
                nom={m.nom_affiche       || ''}
                prenom={m.prenom_affiche || ''}
                role={m.role_display     || m.type_membre || ''}
                image={resolvePhotoUrl(m.photo_url, i)}
                adresse={m.adresse       || null}
                linkedin={m.linkedin     || null}
                instagram={m.instagram   || null}
              />
            ))}
          </motion.div>
        )}
      </div>
    </section>
  );
}

// ──────────────────────────────────────────────────────────────
// CTA BANDEAU
// ──────────────────────────────────────────────────────────────
function CTABandeau() {
  const [hov, setHov] = useState(false);
  return (
    <section style={{ background:`linear-gradient(135deg, ${C.azureDeep} 0%, ${C.azure} 55%, ${C.cyanDark} 100%)`, padding:'72px 24px', position:'relative', overflow:'hidden' }}>
      <FadeSection style={{ maxWidth:'720px', margin:'0 auto', textAlign:'center', position:'relative' }}>
        <div style={{ width:'56px', height:'56px', borderRadius:'50%', background:'rgba(255,255,255,0.12)', border:'1px solid rgba(255,255,255,0.2)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px' }}>
          <Users size={24} style={{ color:C.cyan }} />
        </div>
        <h2 style={{ fontFamily:'"Playfair Display", Georgia, serif', fontSize:'clamp(1.7rem, 3vw, 2.4rem)', fontWeight:700, color:C.white, margin:'0 0 14px' }}>
          Envie de nous rejoindre ?{' '}
          <em style={{ fontStyle:'italic', color:C.cyan }}>Devenez bénévole</em>
        </h2>
        <p style={{ fontFamily:'"DM Sans", sans-serif', fontSize:'16px', lineHeight:1.75, color:'rgba(255,255,255,0.72)', margin:'0 0 32px', maxWidth:'500px', marginLeft:'auto', marginRight:'auto' }}>
          Rejoignez notre réseau de bénévoles et contribuez directement sur le terrain, à votre rythme et selon vos compétences.
        </p>
        <Link to="/contact"
          onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
          style={{ display:'inline-flex', alignItems:'center', gap:'8px', padding:'14px 32px', borderRadius:'100px', background:C.cyan, color:'#0f2060', fontSize:'15px', fontWeight:700, fontFamily:'"DM Sans", sans-serif', textDecoration:'none', boxShadow: hov ? '0 14px 36px rgba(48,200,211,0.45)' : '0 8px 28px rgba(48,200,211,0.35)', transform: hov ? 'translateY(-3px)' : 'translateY(0)', transition:'all 0.3s cubic-bezier(0.34,1.56,0.64,1)' }}
        >
          <Heart size={16} fill="#0f2060" />
          Candidater maintenant
          <ArrowRight size={16} />
        </Link>
      </FadeSection>
    </section>
  );
}

// ──────────────────────────────────────────────────────────────
// RÈGLE 2 — BenevoleCard : props normalisées
// ──────────────────────────────────────────────────────────────
function BenevoleCard({ nom, prenom, role, image, adresse, statut }) {
  const [hov,      setHov]      = useState(false);
  const [imgError, setImgError] = useState(false);

  const src      = imgError ? FALLBACK_PHOTOS[0] : image;
  const estActif = statut === 'ACTIF';

  return (
    <motion.div
      variants={fadeUp}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background:C.white, borderRadius:'18px',
        border:`1.5px solid ${hov ? C.cyanDark + '55' : C.border}`,
        overflow:'hidden',
        boxShadow: hov ? `0 14px 40px ${C.cyanDark}16` : '0 2px 12px rgba(0,0,0,0.05)',
        transform: hov ? 'translateY(-6px)' : 'translateY(0)',
        transition:'all 0.35s cubic-bezier(0.34,1.56,0.64,1)',
        display:'flex', flexDirection:'column',
      }}
    >
      <div style={{ position:'relative', aspectRatio:'1/1', overflow:'hidden' }}>
        <img
          src={src}
          alt={`${prenom} ${nom}`}
          onError={() => setImgError(true)}
          style={{ width:'100%', height:'100%', objectFit:'cover', display:'block', transition:'transform 0.5s ease', transform: hov ? 'scale(1.07)' : 'scale(1)' }}
        />
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top, rgba(15,32,96,0.4) 0%, transparent 55%)' }} />
        <div style={{
          position:'absolute', top:'10px', left:'10px',
          display:'flex', alignItems:'center', gap:'5px',
          background: estActif ? 'rgba(21,128,61,0.85)' : 'rgba(100,116,139,0.75)',
          backdropFilter:'blur(6px)',
          border:`1px solid ${estActif ? 'rgba(74,222,128,0.4)' : 'rgba(148,163,184,0.3)'}`,
          borderRadius:'100px', padding:'4px 10px',
          fontFamily:'"DM Sans", sans-serif', fontSize:'10px',
          fontWeight:700, color:C.white, letterSpacing:'0.06em', textTransform:'uppercase',
        }}>
          <UserCheck size={11} />
          {estActif ? 'Actif' : 'Inactif'}
        </div>
      </div>
      <div style={{ padding:'18px 18px 20px', flex:1, display:'flex', flexDirection:'column', gap:'6px' }}>
        <h3 style={{ fontFamily:'"Playfair Display", Georgia, serif', fontSize:'1rem', fontWeight:700, color:C.azureDark, margin:0 }}>
          {prenom} {nom}
        </h3>
        <p style={{ fontFamily:'"DM Sans", sans-serif', fontSize:'12.5px', color:C.muted, margin:0, lineHeight:1.55 }}>
          {role}
          {adresse && <span style={{ color:C.mutedLight }}> — {adresse}</span>}
        </p>
        <div style={{ height:'2px', borderRadius:'10px', background:`linear-gradient(90deg, ${C.cyanDark}, ${C.cyan})`, width: hov ? '50%' : '18px', transition:'width 0.35s ease', marginTop:'6px' }} />
      </div>
    </motion.div>
  );
}

// ──────────────────────────────────────────────────────────────
// SECTION BÉNÉVOLES
// ──────────────────────────────────────────────────────────────
function BenevolesSection({ benevoles, loading }) {
  const ref    = useRef(null);
  const inView = useInView(ref, { once:true, amount:0.08 });

  const actifs   = benevoles.filter(b => b.statut === 'ACTIF');
  const inactifs = benevoles.filter(b => b.statut !== 'ACTIF');

  return (
    <section style={{ background:C.offWhite, padding:'104px 24px' }}>
      <div style={{ maxWidth:'1280px', margin:'0 auto' }}>
        <FadeSection style={{ textAlign:'center', marginBottom:'56px' }}>
          <Kicker label="Sur le terrain" />
          <h2 style={{ fontFamily:'"Playfair Display", Georgia, serif', fontSize:'clamp(1.9rem, 3vw, 2.6rem)', fontWeight:700, color:C.azureDark, margin:'0 0 14px' }}>
            Nos <em style={{ fontStyle:'italic', color:C.cyanDark }}>bénévoles</em>
          </h2>
          <p style={{ fontFamily:'"DM Sans", sans-serif', fontSize:'16px', color:C.muted, maxWidth:'480px', margin:'0 auto', lineHeight:1.72 }}>
            Ils donnent de leur temps et de leurs compétences sur le terrain, dans plusieurs pays africains.
          </p>
          {!loading && benevoles.length > 0 && (
            <div style={{ display:'flex', justifyContent:'center', gap:'16px', marginTop:'24px', flexWrap:'wrap' }}>
              {[
                { count: actifs.length,   label: 'actif',   color: C.cyanDark, bg: C.cyanLight },
                { count: inactifs.length, label: 'inactif', color: C.muted,    bg: '#f1f5f9'   },
              ].filter(item => item.count > 0).map(({ count, label, color, bg }) => (
                <span key={label} style={{ fontFamily:'"DM Sans", sans-serif', fontSize:'12px', fontWeight:600, color, background:bg, padding:'5px 14px', borderRadius:'100px', border:`1px solid ${color}30` }}>
                  {count} {label}{count > 1 ? 's' : ''}
                </span>
              ))}
            </div>
          )}
        </FadeSection>

        {loading ? (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:'20px' }}>
            {[1,2,3,4,5,6].map(i => <SkeletonCard key={i} height="280px" />)}
          </div>
        ) : benevoles.length === 0 ? (
          <EmptyState message="Aucun bénévole trouvé. Vérifiez que des membres de type BENEVOLE ou MEMBRE_ACTIF sont actifs en base." />
        ) : (
          <motion.div
            ref={ref}
            variants={stagger(0.09)}
            initial="hidden"
            animate="show"
            style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:'20px' }}
          >
            {benevoles.map((b, i) => (
              // RÈGLE 2 — Mapping explicite
              <BenevoleCard
                key={b.id}
                nom={b.nom_affiche       || ''}
                prenom={b.prenom_affiche || ''}
                role={b.role_display     || b.type_membre || ''}
                image={resolvePhotoUrl(b.photo_url, i)}
                adresse={b.adresse       || null}
                statut={b.statut         || 'INACTIF'}
              />
            ))}
          </motion.div>
        )}
      </div>
    </section>
  );
}

// ──────────────────────────────────────────────────────────────
// CTA FINALE
// ──────────────────────────────────────────────────────────────
function CTAFinale() {
  const [hov1, setHov1] = useState(false);
  const [hov2, setHov2] = useState(false);
  return (
    <section style={{ background:`linear-gradient(135deg, #0f2060 0%, ${C.azure} 55%, ${C.cyanDark} 100%)`, padding:'88px 24px', position:'relative', overflow:'hidden' }}>
      <FadeSection style={{ maxWidth:'600px', margin:'0 auto', textAlign:'center', position:'relative' }}>
        <div style={{ width:'60px', height:'60px', borderRadius:'50%', background:'rgba(255,255,255,0.12)', border:'1px solid rgba(255,255,255,0.2)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 22px' }}>
          <Heart size={26} style={{ color:C.cyan }} fill={C.cyan} />
        </div>
        <h2 style={{ fontFamily:'"Playfair Display", Georgia, serif', fontSize:'clamp(1.8rem, 3.5vw, 2.5rem)', fontWeight:700, color:C.white, lineHeight:1.15, margin:'0 0 14px' }}>
          Rejoignez le mouvement ININ
        </h2>
        <p style={{ fontFamily:'"DM Sans", sans-serif', fontSize:'16px', lineHeight:1.75, color:'rgba(255,255,255,0.7)', margin:'0 0 36px' }}>
          Bénévole, partenaire ou donateur — il y a une place pour vous dans notre réseau.
        </p>
        <div style={{ display:'flex', flexWrap:'wrap', gap:'14px', justifyContent:'center' }}>
          <Link to="/contact"
            onMouseEnter={() => setHov1(true)} onMouseLeave={() => setHov1(false)}
            style={{ display:'inline-flex', alignItems:'center', gap:'8px', padding:'13px 28px', borderRadius:'100px', background:C.cyan, color:'#0f2060', fontSize:'15px', fontWeight:700, fontFamily:'"DM Sans", sans-serif', textDecoration:'none', boxShadow: hov1 ? '0 14px 36px rgba(48,200,211,0.45)' : '0 8px 28px rgba(48,200,211,0.35)', transform: hov1 ? 'translateY(-3px)' : 'translateY(0)', transition:'all 0.3s cubic-bezier(0.34,1.56,0.64,1)' }}
          >
            Nous contacter <ArrowRight size={16} />
          </Link>
          <Link to="/actions"
            onMouseEnter={() => setHov2(true)} onMouseLeave={() => setHov2(false)}
            style={{ display:'inline-flex', alignItems:'center', gap:'8px', padding:'12px 26px', borderRadius:'100px', background: hov2 ? 'rgba(255,255,255,0.1)' : 'transparent', border:`2px solid ${hov2 ? 'rgba(255,255,255,0.65)' : 'rgba(255,255,255,0.35)'}`, color:C.white, fontSize:'15px', fontWeight:600, fontFamily:'"DM Sans", sans-serif', textDecoration:'none', transition:'all 0.2s ease' }}
          >
            Voir nos actions
          </Link>
        </div>
      </FadeSection>
    </section>
  );
}

// ──────────────────────────────────────────────────────────────
// PAGE MEMBRES — assemblage + fetch sécurisé (5 règles)
// ──────────────────────────────────────────────────────────────
export default function Membres() {
  const [membres,      setMembres]      = useState([]);
  const [benevoles,    setBenevoles]    = useState([]);
  const [stats,        setStats]        = useState(null);
  const [loadingData,  setLoadingData]  = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [error,        setError]        = useState(null);

  useEffect(() => {
    // ── Requête membres ───────────────────────────────────────
    axios.get(API_MEMBRES)
      .then(({ data }) => {
        console.log('👥 [Membres] Données reçues :', data);

        // RÈGLE 3 — Alimentation sécurisée : || [] garantit un tableau
        setMembres(data.equipe    || []);
        setBenevoles(data.benevoles || []);

        // Avertissement si clés manquantes (mauvais format API)
        if (!Array.isArray(data.equipe)) {
          console.warn('⚠️ [Membres] data.equipe absent ou non-tableau :', data);
        }
        if (!Array.isArray(data.benevoles)) {
          console.warn('⚠️ [Membres] data.benevoles absent ou non-tableau :', data);
        }
      })
      // RÈGLE 5 — catch explicite avec diagnostic CORS
      .catch(error => {
        console.error('❌ [Membres] Erreur de récupération (Peut-être CORS) :', error);
        console.error('   → URL appelée :', API_MEMBRES);
        console.error('   → Status HTTP :', error.response?.status ?? 'Pas de réponse (réseau/CORS)');
        console.error('   → Message     :', error.message);
        setError(
          !error.response
            ? 'Impossible de joindre le serveur. Veuillez réessayer dans quelques instants.'
            : `Erreur serveur ${error.response.status} — ${error.message}`
        );
      })
      .finally(() => setLoadingData(false));

    // ── Requête stats (silencieuse en cas d'échec) ────────────
    axios.get(API_STATS)
      .then(({ data }) => {
        console.log('📊 [Stats] Données reçues :', data);
        setStats(data);
      })
      .catch(error => {
        console.warn('⚠️ [Stats] Impossible de charger les stats :', error.message);
      })
      .finally(() => setLoadingStats(false));
  }, []);

  return (
    <>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.4; }
        }
      `}</style>

      <div style={{ fontFamily:'"DM Sans", sans-serif', background:C.white }}>
        <PageHero stats={stats} loadingStats={loadingStats} />

        {/* RÈGLE 4 — Erreur réseau visible (jamais d'écran blanc) */}
        {error && (
          <div style={{
            background:'#fef2f2', border:'1px solid rgba(220,38,38,0.25)',
            borderRadius:'12px', padding:'16px 24px',
            margin:'24px auto', maxWidth:'680px',
            fontFamily:'"DM Sans", sans-serif', fontSize:'14px',
            color:'#dc2626', textAlign:'center', lineHeight:1.6,
          }}>
            <strong>Erreur de chargement</strong><br />
            {error}
          </div>
        )}

        <MembresSection membres={membres} loading={loadingData} />
        <CTABandeau />
        <BenevolesSection benevoles={benevoles} loading={loadingData} />
        <CTAFinale />
      </div>
    </>
  );
}