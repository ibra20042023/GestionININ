/**
 * src/components/StatsSection.jsx
 * ─────────────────────────────────────────────────────────────
 * VERSION DYNAMIQUE
 * Appelle :
 *   GET /api/stats-membres/  → nb_membres_officiels, nb_benevoles_actifs, nb_pays
 *   GET /api/actions/        → nb actions clôturées (réalisées)
 *   GET /api/dons/           → total dons (optionnel, pour enrichir)
 *
 * Les 4 cartes correspondent aux 4 stats originales mais avec
 * les vraies valeurs issues de Django.
 * Design 100% identique à la version statique.
 * ─────────────────────────────────────────────────────────────
 */

import { useRef, useState, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Users, Lightbulb, Globe, HeartHandshake } from 'lucide-react';
import axios from 'axios';

const API_BASE    = 'http://127.0.0.1:8000';
const API_STATS   = `${API_BASE}/api/stats-membres/`;
const API_ACTIONS = `${API_BASE}/api/actions/`;

// ── Palette ───────────────────────────────────────────────────
const C = {
  azure:     '#1640c8',
  azureDark: '#0f172a',
  cyan:      '#30c8d3',
  cyanDark:  '#17a8b5',
  bg:        '#f8fafc',
  white:     '#ffffff',
  muted:     '#64748b',
  border:    '#e2e8f0',
  light:     '#eef5ff',
  cyanLight: '#ecfeff',
};

// ── Compteur animé 0 → target ─────────────────────────────────
function useCountUp(target, duration = 1600, triggered = false) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!triggered || target === null || target === undefined) return;
    // Si la valeur est 0 ou non-numérique, on l'affiche directement
    if (typeof target !== 'number' || target === 0) {
      setCount(target);
      return;
    }
    let current = 0;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(current));
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration, triggered]);

  return count;
}

// ── Carte statistique individuelle ────────────────────────────
function StatCard({ stat, index, triggered }) {
  const [hovered, setHovered] = useState(false);
  const count = useCountUp(
    typeof stat.value === 'number' ? stat.value : 0,
    1500,
    triggered
  );
  const Icon = stat.icon;

  // Si la valeur est encore en chargement (null), afficher '…'
  const displayValue = stat.value === null
    ? '…'
    : (typeof stat.value === 'number' ? count.toLocaleString('fr-FR') : stat.value);

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 32 },
        show:   { opacity: 1, y: 0, transition: { duration: 0.6, delay: index * 0.12, ease: [0.22, 1, 0.36, 1] } },
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background:    C.white,
        borderRadius:  '20px',
        border:        `1.5px solid ${hovered ? stat.accent + '50' : C.border}`,
        padding:       '36px 28px 28px',
        display:       'flex',
        flexDirection: 'column',
        gap:           '16px',
        boxShadow:     hovered
          ? `0 16px 48px ${stat.accent}18, 0 2px 8px rgba(0,0,0,0.04)`
          : '0 2px 12px rgba(0,0,0,0.04)',
        transform:     hovered ? 'translateY(-6px)' : 'translateY(0)',
        transition:    'all 0.35s cubic-bezier(0.34,1.56,0.64,1)',
        cursor:        'default',
        position:      'relative',
        overflow:      'hidden',
      }}
    >
      {/* Pastille décorative fond */}
      <div style={{
        position:     'absolute',
        top:          '-20px',
        right:        '-20px',
        width:        '80px',
        height:       '80px',
        borderRadius: '50%',
        background:   stat.iconBg,
        opacity:      hovered ? 0.8 : 0.4,
        transition:   'opacity 0.3s',
      }} />

      {/* Icône */}
      <div style={{
        width:          '48px',
        height:         '48px',
        borderRadius:   '14px',
        background:     stat.iconBg,
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        flexShrink:     0,
        transition:     'transform 0.3s ease',
        transform:      hovered ? 'scale(1.12)' : 'scale(1)',
      }}>
        <Icon size={22} style={{ color: stat.accent }} strokeWidth={1.75} />
      </div>

      {/* Chiffre principal */}
      <div>
        <div style={{
          fontFamily:    '"Playfair Display", Georgia, serif',
          fontSize:      'clamp(2.8rem, 4vw, 3.6rem)',
          fontWeight:    800,
          lineHeight:    1,
          color:         stat.accent,
          letterSpacing: '-0.02em',
          marginBottom:  '10px',
          // Opacité réduite pendant le chargement
          opacity:       stat.value === null ? 0.35 : 1,
          transition:    'opacity 0.4s',
        }}>
          {displayValue}
          {stat.value !== null && stat.suffix && (
            <span style={{ fontSize: '0.75em' }}>{stat.suffix}</span>
          )}
        </div>

        {/* Label */}
        <div style={{
          fontFamily:   '"DM Sans", sans-serif',
          fontSize:     '15px',
          fontWeight:   700,
          color:        C.azureDark,
          marginBottom: '4px',
        }}>
          {stat.label}
        </div>

        {/* Sous-label */}
        <div style={{
          fontFamily:   '"DM Sans", sans-serif',
          fontSize:     '11px',
          fontWeight:   500,
          color:        C.muted,
          textTransform:'uppercase',
          letterSpacing:'0.1em',
          lineHeight:   1.5,
        }}>
          {stat.sublabel}
        </div>
      </div>

      {/* Trait décoratif */}
      <div style={{
        height:      '3px',
        borderRadius:'10px',
        background:  `linear-gradient(90deg, ${stat.accent}, transparent)`,
        width:       hovered ? '70%' : '28px',
        transition:  'width 0.4s ease',
        marginTop:   'auto',
      }} />
    </motion.div>
  );
}

// ── Composant principal ───────────────────────────────────────
export default function StatsSection() {
  const ref    = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.2 });

  // ── State données dynamiques ──────────────────────────────
  const [membresStats, setMembresStats] = useState(null);  // { nb_membres_officiels, nb_benevoles_actifs, nb_pays }
  const [nbActions,    setNbActions]    = useState(null);  // nombre d'actions clôturées

  useEffect(() => {
    // Stats membres
    axios.get(API_STATS)
      .then(({ data }) => setMembresStats(data))
      .catch(() => setMembresStats({ nb_membres_officiels: 0, nb_benevoles_actifs: 0, nb_pays: 0 }));

    // Actions réalisées (clôturées)
    axios.get(API_ACTIONS)
      .then(({ data }) => {
        const list      = Array.isArray(data) ? data : (data.results ?? []);
        const cloturees = list.filter(a => a.statut === 'CLOTUREE').length;
        const total     = list.length;
        setNbActions({ cloturees, total });
      })
      .catch(() => setNbActions({ cloturees: 0, total: 0 }));
  }, []);

  // ── Construction des 4 cartes avec valeurs dynamiques ──────
  const STATS = [
    {
      icon:     Users,
      // Nombre de bénévoles actifs depuis l'API
      value:    membresStats?.nb_benevoles_actifs ?? null,
      suffix:   '',
      label:    'Bénévoles actifs',
      sublabel: 'engagés dans nos programmes',
      accent:   C.azure,
      iconBg:   C.light,
    },
    {
      icon:     Lightbulb,
      // Nombre d'actions clôturées = projets réalisés
      value:    nbActions?.cloturees ?? null,
      suffix:   '',
      label:    'Projets réalisés',
      sublabel: 'de sensibilisation & éducation',
      accent:   C.cyanDark,
      iconBg:   C.cyanLight,
    },
    {
      icon:     Globe,
      // Nombre de pays couverts
      value:    membresStats?.nb_pays ?? null,
      suffix:   '',
      label:    'Pays touchés',
      sublabel: 'en Afrique subsaharienne',
      accent:   C.azure,
      iconBg:   C.light,
    },
    {
      icon:     HeartHandshake,
      // Nombre de membres officiels
      value:    membresStats?.nb_membres_officiels ?? null,
      suffix:   '',
      label:    'Membres officiels',
      sublabel: "au cœur de l'association",
      accent:   C.cyanDark,
      iconBg:   C.cyanLight,
    },
  ];

  return (
    <section
      id="stats"
      style={{
        background: C.bg,
        padding:    '96px 24px',
        position:   'relative',
        overflow:   'hidden',
      }}
    >
      {/* Décorations fond */}
      <div style={{ position:'absolute', top:'-100px', right:'-100px', width:'400px', height:'400px', borderRadius:'50%', background:`radial-gradient(circle, ${C.azure}08 0%, transparent 70%)`, pointerEvents:'none' }} />
      <div style={{ position:'absolute', bottom:'-80px', left:'-80px', width:'320px', height:'320px', borderRadius:'50%', background:`radial-gradient(circle, ${C.cyan}0A 0%, transparent 70%)`, pointerEvents:'none' }} />

      <div style={{ maxWidth:'1280px', margin:'0 auto', position:'relative' }}>

        {/* En-tête */}
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          style={{
            display:        'flex',
            flexDirection:  'row',
            justifyContent: 'space-between',
            alignItems:     'flex-end',
            gap:            '24px',
            marginBottom:   '56px',
            flexWrap:       'wrap',
          }}
        >
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'12px' }}>
              <span style={{ display:'block', width:'28px', height:'2px', borderRadius:'2px', background:`linear-gradient(90deg, ${C.azure}, ${C.cyan})` }} />
              <span style={{ fontFamily:'"DM Sans", sans-serif', fontSize:'11px', fontWeight:700, letterSpacing:'0.2em', textTransform:'uppercase', color: C.cyanDark }}>
                Notre impact
              </span>
            </div>
            <h2 style={{
              fontFamily:  '"Playfair Display", Georgia, serif',
              fontSize:    'clamp(1.8rem, 3vw, 2.6rem)',
              fontWeight:  700,
              lineHeight:  1.15,
              color:       C.azureDark,
              margin:      0,
            }}>
              Des chiffres qui parlent{' '}
              <em style={{ fontStyle:'italic', color: C.azure }}>d'eux-mêmes</em>
            </h2>
          </div>

          <Link
            to="/actions"
            style={{
              display:        'inline-flex',
              alignItems:     'center',
              gap:            '6px',
              fontSize:       '14px',
              fontWeight:     600,
              fontFamily:     '"DM Sans", sans-serif',
              color:          C.azure,
              textDecoration: 'none',
              borderBottom:   `2px solid rgba(22,64,200,0.2)`,
              paddingBottom:  '2px',
              whiteSpace:     'nowrap',
              transition:     'border-color 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = C.azure}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(22,64,200,0.2)'}
          >
            Voir toutes nos actions →
          </Link>
        </motion.div>

        {/* Grille 4 cartes */}
        <motion.div
          variants={{
            hidden: {},
            show:   { transition: { staggerChildren: 0.12 } },
          }}
          initial="hidden"
          animate={inView ? 'show' : 'hidden'}
          style={{
            display:             'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap:                 '24px',
          }}
        >
          {STATS.map((stat, i) => (
            <StatCard key={stat.label} stat={stat} index={i} triggered={inView} />
          ))}
        </motion.div>

        {/* Citation */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.6 }}
          style={{
            marginTop:     '64px',
            paddingTop:    '40px',
            borderTop:     `1px solid ${C.border}`,
            display:       'flex',
            flexDirection: 'column',
            alignItems:    'center',
            textAlign:     'center',
            gap:           '10px',
          }}
        >
          <div style={{ fontFamily:'"Playfair Display", serif', fontSize:'3rem', lineHeight:0.6, color:C.azure, opacity:0.2, userSelect:'none' }}>"</div>
          <p style={{ fontFamily:'"Playfair Display", Georgia, serif', fontSize:'1rem', fontStyle:'italic', color:C.muted, maxWidth:'480px', margin:0, lineHeight:1.7 }}>
            Chaque jeune accompagné est une victoire pour toute la communauté.
          </p>
          <span style={{ fontFamily:'"DM Sans", sans-serif', fontSize:'11px', letterSpacing:'0.14em', textTransform:'uppercase', color:'#94a3b8', marginTop:'4px' }}>
            — Fondateurs de l'association ININ
          </span>
        </motion.div>

      </div>
    </section>
  );
}