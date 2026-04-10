/**
 * src/components/HeroSection.jsx
 * ─────────────────────────────────────────────────────────────
 * VERSION DYNAMIQUE
 * Appelle GET /api/stats-membres/ pour afficher les vrais chiffres
 * dans le badge "5+ ans" et les compteurs.
 * Design 100% identique à la version statique.
 * ─────────────────────────────────────────────────────────────
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Play } from 'lucide-react';
import axios from 'axios';

const API_BASE       = 'http://127.0.0.1:8000';
const API_STATS      = `${API_BASE}/api/stats-membres/`;
const API_ACTIONS    = `${API_BASE}/api/actions/`;

const HERO_IMG = 'https://images.unsplash.com/photo-1529390079861-591de354faf5?w=1920&q=80&auto=format&fit=crop';

const C = {
  cyan:      '#30c8d3',
  azureDark: '#0f2060',
  white:     '#ffffff',
};

export default function HeroSection() {
  const [stats,   setStats]   = useState(null);
  const [nbActions, setNbActions] = useState(null);

  useEffect(() => {
    // Stats membres (nb_membres_officiels, nb_benevoles_actifs, nb_pays)
    axios.get(API_STATS)
      .then(({ data }) => setStats(data))
      .catch(() => {}); // Silencieux : fallback sur '--'

    // Nombre d'actions réalisées
    axios.get(API_ACTIONS)
      .then(({ data }) => {
        // data peut être un tableau ou { results: [...] } si paginé
        const list = Array.isArray(data) ? data : (data.results ?? []);
        const cloturees = list.filter(a => a.statut === 'CLOTUREE').length;
        setNbActions(cloturees);
      })
      .catch(() => {});
  }, []);

  const scrollToAbout = () => {
    const el = document.getElementById('about');
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 72, behavior: 'smooth' });
  };

  // Valeurs affichées — réelles ou placeholder
  const nbMembres  = stats?.nb_membres_officiels ?? '--';
  const nbBenevoles = stats?.nb_benevoles_actifs  ?? '--';
  const nbPays     = stats?.nb_pays              ?? '--';

  return (
    <>
      <style>{`
        @keyframes h-fadeUp {
          0%   { opacity: 0; transform: translateY(24px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes h-fadeIn {
          0%   { opacity: 0; }
          100% { opacity: 1; }
        }
        .h-kicker   { animation: h-fadeIn 0.5s 0.1s ease both; }
        .h-title    { animation: h-fadeUp 0.65s 0.2s ease both; }
        .h-subtitle { animation: h-fadeUp 0.65s 0.33s ease both; }
        .h-buttons  { animation: h-fadeUp 0.65s 0.46s ease both; }
        .h-scroll   { animation: h-fadeIn 1s 1s ease both; }
        .h-badge    { animation: h-fadeIn 0.8s 0.8s ease both; }
        .h-stats    { animation: h-fadeUp 0.65s 0.55s ease both; }

        .hero-cta-primary:hover  { transform: translateY(-3px) !important; box-shadow: 0 12px 30px rgba(48,200,211,0.45) !important; }
        .hero-cta-secondary:hover{ background: rgba(255,255,255,0.18) !important; border-color: rgba(255,255,255,0.65) !important; }

        .hero-stat-item {
          text-align: center;
          padding: 0 20px;
          border-right: 1px solid rgba(255,255,255,0.15);
        }
        .hero-stat-item:last-child { border-right: none; }
      `}</style>

      <section
        id="home"
        style={{
          position:   'relative',
          display:    'flex',
          alignItems: 'center',
          width:      '100%',
          minHeight:  '100svh',
          overflow:   'hidden',
        }}
      >
        {/* Image plein écran */}
        <img
          src={HERO_IMG}
          alt="Jeunes africains — Association ININ"
          style={{
            position:       'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            width:          '100%',
            height:         '100%',
            objectFit:      'cover',
            objectPosition: 'center top',
            zIndex:         0,
          }}
          loading="eager"
        />

        {/* Overlay */}
        <div style={{
          position:   'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          zIndex:     1,
          background: 'linear-gradient(105deg, rgba(10,20,70,0.87) 0%, rgba(10,20,70,0.55) 50%, rgba(10,20,70,0.1) 100%)',
        }} />

        {/* Décoration lumineuse */}
        <div style={{
          position:     'absolute',
          top:          '20%',
          right:        '8%',
          width:        '320px',
          height:       '320px',
          borderRadius: '50%',
          background:   'radial-gradient(circle, rgba(48,200,211,0.10) 0%, transparent 70%)',
          zIndex:       1,
          pointerEvents:'none',
        }} />

        {/* Conteneur texte */}
        <div style={{
          position: 'relative',
          zIndex:   2,
          width:    '100%',
          maxWidth: '1280px',
          margin:   '0 auto',
          padding:  '120px 24px 80px',
        }}>
          <div style={{ maxWidth: '640px' }}>

            {/* Kicker */}
            <div className="h-kicker" style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'22px' }}>
              <span style={{ display:'block', width:'32px', height:'1.5px', background: C.cyan, flexShrink:0 }} />
              <span style={{ fontFamily:'"DM Sans", sans-serif', fontSize:'11px', fontWeight:700, letterSpacing:'0.2em', textTransform:'uppercase', color: C.cyan }}>
                Association ININ
              </span>
            </div>

            {/* H1 */}
            <h1 className="h-title" style={{
              fontFamily:   '"Playfair Display", Georgia, serif',
              fontSize:     'clamp(2.4rem, 5.5vw, 4.2rem)',
              fontWeight:   800,
              lineHeight:   1.08,
              letterSpacing:'-0.01em',
              color:        C.white,
              margin:       '0 0 24px',
            }}>
              Ensemble pour une{' '}
              <em style={{ fontStyle:'italic', color: C.cyan }}>jeunesse</em>{' '}
              en bonne santé
            </h1>

            {/* Sous-titre */}
            <p className="h-subtitle" style={{
              fontFamily: '"DM Sans", sans-serif',
              fontSize:   'clamp(1rem, 1.5vw, 1.15rem)',
              lineHeight: 1.75,
              color:      'rgba(255,255,255,0.75)',
              margin:     '0 0 40px',
              maxWidth:   '520px',
            }}>
              Nous accompagnons la jeunesse africaine sur les questions de santé
              mentale et physique à travers des actions de sensibilisation,
              d'éducation et d'accompagnement.
            </p>

            {/* Boutons CTA */}
            <div className="h-buttons" style={{ display:'flex', flexWrap:'wrap', alignItems:'center', gap:'16px' }}>
              <Link
                to="/actions"
                className="hero-cta-primary"
                style={{
                  display:'inline-flex', alignItems:'center', gap:'8px',
                  padding:'14px 28px', borderRadius:'100px',
                  background: C.cyan, color: C.azureDark,
                  fontSize:'15px', fontWeight:700,
                  fontFamily:'"DM Sans", sans-serif',
                  textDecoration:'none',
                  boxShadow:'0 6px 22px rgba(48,200,211,0.38)',
                  transition:'all 0.3s cubic-bezier(0.34,1.56,0.64,1)',
                  whiteSpace:'nowrap',
                }}
              >
                Découvrir nos actions
                <ArrowRight size={17} />
              </Link>

              <button
                onClick={scrollToAbout}
                className="hero-cta-secondary"
                style={{
                  display:'inline-flex', alignItems:'center', gap:'8px',
                  padding:'13px 26px', borderRadius:'100px',
                  background:'rgba(255,255,255,0.1)',
                  border:'1.5px solid rgba(255,255,255,0.35)',
                  color: C.white, fontSize:'15px', fontWeight:500,
                  fontFamily:'"DM Sans", sans-serif',
                  cursor:'pointer',
                  transition:'all 0.2s ease',
                  backdropFilter:'blur(8px)',
                  whiteSpace:'nowrap',
                }}
              >
                <Play size={15} fill="white" />
                Notre mission
              </button>
            </div>

            {/* ── STATS DYNAMIQUES sous les boutons ── */}
            <div className="h-stats" style={{
              display:    'flex',
              flexWrap:   'wrap',
              marginTop:  '48px',
              background: 'rgba(255,255,255,0.06)',
              backdropFilter: 'blur(12px)',
              border:     '1px solid rgba(255,255,255,0.12)',
              borderRadius: '16px',
              padding:    '20px 0',
              maxWidth:   '480px',
            }}>
              {[
                { value: nbMembres,   label: 'Membres officiels' },
                { value: nbBenevoles, label: 'Bénévoles actifs' },
                { value: nbPays,      label: 'Pays couverts' },
              ].map(({ value, label }) => (
                <div key={label} className="hero-stat-item" style={{ flex: '1 1 0' }}>
                  <div style={{
                    fontFamily:   '"Playfair Display", serif',
                    fontSize:     '1.9rem',
                    fontWeight:   800,
                    color:        C.cyan,
                    lineHeight:   1,
                    marginBottom: '4px',
                    // Légère animation de "chargement"
                    opacity:      value === '--' ? 0.4 : 1,
                    transition:   'opacity 0.4s',
                  }}>
                    {value}
                  </div>
                  <div style={{
                    fontFamily:   '"DM Sans", sans-serif',
                    fontSize:     '10px',
                    fontWeight:   600,
                    color:        'rgba(255,255,255,0.55)',
                    textTransform:'uppercase',
                    letterSpacing:'0.1em',
                  }}>
                    {label}
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>

        {/* Indicateur scroll */}
        <div className="h-scroll" style={{
          position:  'absolute',
          bottom:    '32px',
          left:      '50%',
          transform: 'translateX(-50%)',
          zIndex:    2,
          display:   'flex',
          flexDirection:'column',
          alignItems:'center',
          gap:       '8px',
        }}>
          <span style={{ fontFamily:'"DM Sans"', fontSize:'9px', letterSpacing:'0.2em', textTransform:'uppercase', color:'rgba(255,255,255,0.4)' }}>
            Défiler
          </span>
          <div style={{ width:'1px', height:'40px', background:'linear-gradient(to bottom, rgba(255,255,255,0.4), transparent)' }} />
        </div>

        {/* Badge dynamique bas-droite */}
        <div className="h-badge" style={{
          position:       'absolute',
          bottom:         '40px',
          right:          '32px',
          zIndex:         2,
          background:     'rgba(255,255,255,0.08)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border:         '1px solid rgba(255,255,255,0.18)',
          borderRadius:   '18px',
          padding:        '16px 22px',
          textAlign:      'right',
        }}>
          <div style={{
            fontFamily: '"Playfair Display",serif',
            fontSize:   '2.2rem',
            fontWeight: 700,
            color:      C.cyan,
            lineHeight: 1,
            marginBottom:'4px',
          }}>
            {/* Nombre d'actions clôturées, ou '5+' par défaut */}
            {nbActions !== null ? (nbActions > 0 ? `${nbActions}` : '0') : '5+'}
          </div>
          <div style={{ fontFamily:'"DM Sans",sans-serif', fontSize:'12px', color:'rgba(255,255,255,0.6)' }}>
            {nbActions !== null ? "actions réalisées" : "années d'engagement"}
          </div>
        </div>

      </section>
    </>
  );
}