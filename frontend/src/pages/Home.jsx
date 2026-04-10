/**
 * src/pages/Home.jsx
 * ─────────────────────────────────────────────────────────────
 * Page d'accueil de l'association ININ.
 * Assemble : HeroSection → StatsSection → MissionSection → ActionsPreview → CTASection
 *
 * DYNAMISATION — Section "Actions à la une" :
 *   - useEffect + axios.get vers /api/last-actions/
 *   - ACTIONS_PREVIEW statique supprimée
 *   - Limitation à 3 actions (.slice(0, 3))
 *   - État loading avec squelettes animés
 *   - Fallback visible si liste vide
 *   - Bouton "Voir tout" conservé
 * ─────────────────────────────────────────────────────────────
 */

import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
  ArrowRight, Heart, CheckCircle2,
  Users, Lightbulb, Globe,
  ExternalLink, MapPin, Calendar, TrendingUp,
} from 'lucide-react';

import HeroSection  from '../components/HeroSection';
import StatsSection from '../components/StatsSection';

// ── Config API ────────────────────────────────────────────────
const API_BASE         = 'http://127.0.0.1:8000';
const API_LAST_ACTIONS = `${API_BASE}/api/last-actions/`;

// ── Configs couleur par type / statut ────────────────────────
const TYPE_CONFIG = {
  SENSIBILISATION: { color: '#1640c8', bg: '#eef5ff', dot: '#5a9bff' },
  EDUCATION:       { color: '#0e7490', bg: '#ecfeff', dot: '#22d3ee' },
  ACCOMPAGNEMENT:  { color: '#15803d', bg: '#f0fdf4', dot: '#4ade80' },
  SOLIDARITE:      { color: '#b45309', bg: '#fffbeb', dot: '#fbbf24' },
  FORMATION:       { color: '#7e22ce', bg: '#faf5ff', dot: '#a78bfa' },
  AUTRE:           { color: '#4b5563', bg: '#f9fafb', dot: '#9ca3af' },
};

const STATUT_CONFIG = {
  EN_COURS:  { label: 'En cours',  color: '#16a34a', bg: '#f0fdf4' },
  PLANIFIEE: { label: 'Planifiée', color: '#2563eb', bg: '#eff6ff' },
  CLOTUREE:  { label: 'Clôturée', color: '#6b7280', bg: '#f3f4f6' },
};

const ENGAGEMENTS = [
  { icon: Users,     text: 'Des bénévoles présents sur le terrain dans 8 pays africains' },
  { icon: Lightbulb, text: 'Des programmes basés sur des recherches scientifiques validées' },
  { icon: Globe,     text: 'Une approche culturellement adaptée à chaque communauté' },
];

// ── Utilitaires ───────────────────────────────────────────────
const formatDate = (str) =>
  str
    ? new Date(str).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—';

const calcPct = (prevu, restant) => {
  const p = parseFloat(prevu);
  const r = parseFloat(restant) ?? p;
  if (!p) return 0;
  return Math.min(100, Math.round(((p - r) / p) * 100));
};

// ──────────────────────────────────────────────────────────────
// Hook IntersectionObserver (animations au scroll)
// ──────────────────────────────────────────────────────────────
function useInView(threshold = 0.2) {
  const ref             = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);

  return [ref, visible];
}

// ──────────────────────────────────────────────────────────────
// Squelette de carte (état loading)
// ──────────────────────────────────────────────────────────────
function SkeletonActionCard() {
  return (
    <div style={{
      background:   '#fff',
      borderRadius: '18px',
      border:       '1.5px solid #e5e7eb',
      overflow:     'hidden',
      fontFamily:   '"DM Sans", sans-serif',
    }}>
      {/* Bande */}
      <div style={{ height: '4px', background: '#e5e7eb', animation: 'pulse-soft 1.6s ease-in-out infinite' }} />
      <div style={{ padding: '20px 22px 16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* Badges */}
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
          <div style={{ height: '22px', width: '80px', borderRadius: '20px', background: '#f3f4f6', animation: 'pulse-soft 1.6s ease-in-out infinite' }} />
          <div style={{ height: '22px', width: '70px', borderRadius: '20px', background: '#f3f4f6', animation: 'pulse-soft 1.6s ease-in-out infinite' }} />
        </div>
        {/* Titre */}
        <div style={{ height: '18px', width: '75%', borderRadius: '6px', background: '#f3f4f6', animation: 'pulse-soft 1.6s ease-in-out infinite' }} />
        <div style={{ height: '18px', width: '55%', borderRadius: '6px', background: '#f3f4f6', animation: 'pulse-soft 1.6s ease-in-out infinite' }} />
        {/* Description */}
        <div style={{ height: '13px', width: '90%', borderRadius: '4px', background: '#f3f4f6', animation: 'pulse-soft 1.6s ease-in-out infinite' }} />
        <div style={{ height: '13px', width: '70%', borderRadius: '4px', background: '#f3f4f6', animation: 'pulse-soft 1.6s ease-in-out infinite' }} />
        {/* Méta */}
        <div style={{ height: '13px', width: '45%', borderRadius: '4px', background: '#f3f4f6', animation: 'pulse-soft 1.6s ease-in-out infinite' }} />
      </div>
      <div style={{ padding: '11px 22px', borderTop: '1px solid #f3f4f6', background: '#fafafa', display: 'flex', justifyContent: 'space-between' }}>
        <div style={{ height: '14px', width: '80px', borderRadius: '4px', background: '#f3f4f6', animation: 'pulse-soft 1.6s ease-in-out infinite' }} />
        <div style={{ height: '28px', width: '60px', borderRadius: '100px', background: '#f3f4f6', animation: 'pulse-soft 1.6s ease-in-out infinite' }} />
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Carte d'action miniature
// Props issues de ActionPreviewSerializer :
//   id, titre, type, type_display, statut, statut_display,
//   date_debut, lieu, description, budget_prevu,
//   budget_restant, nb_participants
// ──────────────────────────────────────────────────────────────
function MiniActionCard({ action, index }) {
  const [hovered, setHovered] = useState(false);

  // Mapping depuis les données API — type et statut normalisés
  const tc  = TYPE_CONFIG[action.type]    ?? TYPE_CONFIG.AUTRE;
  const sc  = STATUT_CONFIG[action.statut] ?? STATUT_CONFIG.PLANIFIEE;
  const pct = calcPct(action.budget_prevu, action.budget_restant);

  return (
    <article
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background:    '#fff',
        borderRadius:  '18px',
        border:        `1.5px solid ${hovered ? tc.color + '50' : '#e5e7eb'}`,
        overflow:      'hidden',
        display:       'flex',
        flexDirection: 'column',
        boxShadow:     hovered
          ? `0 14px 36px ${tc.color}18, 0 2px 6px rgba(0,0,0,0.05)`
          : '0 2px 10px rgba(0,0,0,0.04)',
        transform:        hovered ? 'translateY(-5px)' : 'translateY(0)',
        transition:       'all 0.3s cubic-bezier(0.34,1.56,0.64,1)',
        animationName:    'fadeUp',
        animationDuration:'0.55s',
        animationTimingFunction: 'ease',
        animationFillMode: 'both',
        animationDelay:   `${index * 0.1}s`,
        fontFamily:       '"DM Sans", sans-serif',
      }}
    >
      {/* Bande couleur */}
      <div style={{ height: '4px', background: `linear-gradient(90deg, ${tc.color}, ${tc.dot})` }} />

      <div style={{ padding: '20px 22px 16px', flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>

        {/* Badges type + statut */}
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
          <span style={{
            fontSize: '10px', fontWeight: 700, letterSpacing: '0.07em',
            textTransform: 'uppercase', padding: '3px 9px', borderRadius: '20px',
            color: tc.color, background: tc.bg,
          }}>
            {/* type_display depuis l'API */}
            {action.type_display}
          </span>
          <span style={{
            display: 'flex', alignItems: 'center', gap: '4px',
            fontSize: '10px', fontWeight: 600, padding: '3px 9px',
            borderRadius: '20px', color: sc.color, background: sc.bg,
          }}>
            <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: sc.color }} />
            {/* statut_display depuis l'API */}
            {action.statut_display ?? sc.label}
          </span>
        </div>

        {/* titre depuis l'API */}
        <h3 style={{
          fontFamily: '"Playfair Display", Georgia, serif',
          fontSize: '16px', fontWeight: 700, lineHeight: 1.3,
          color: '#111827', margin: 0,
        }}>
          {action.titre}
        </h3>

        {/* description depuis l'API (tronquée à 2 lignes) */}
        {action.description && (
          <p style={{
            fontSize: '13px', color: '#6b7280', lineHeight: 1.6, margin: 0,
            display: '-webkit-box', WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {action.description}
          </p>
        )}

        {/* Métadonnées : date_debut + lieu depuis l'API */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#9ca3af' }}>
            <Calendar size={12} />
            {formatDate(action.date_debut)}
          </span>
          {action.lieu && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#9ca3af' }}>
              <MapPin size={12} />
              {action.lieu}
            </span>
          )}
        </div>

        {/* Jauge budget — budget_prevu + budget_restant depuis l'API */}
        {parseFloat(action.budget_prevu) > 0 && (
          <div style={{ marginTop: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#9ca3af' }}>
                <TrendingUp size={11} /> Budget
              </span>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#374151' }}>{pct}%</span>
            </div>
            <div style={{ height: '5px', background: '#f3f4f6', borderRadius: '10px', overflow: 'hidden' }}>
              <div style={{
                height: '100%', width: `${pct}%`,
                background: `linear-gradient(90deg, ${tc.color}, ${tc.dot})`,
                borderRadius: '10px', transition: 'width 1s ease',
              }} />
            </div>
          </div>
        )}
      </div>

      {/* Footer carte : nb_participants depuis l'API */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '11px 22px', borderTop: '1px solid #f3f4f6', background: '#fafafa',
      }}>
        <span style={{ fontSize: '12px', color: '#9ca3af' }}>
          <Users size={12} style={{ display: 'inline', marginRight: '4px', color: tc.color }} />
          <strong style={{ color: '#374151' }}>{action.nb_participants ?? 0}</strong> participants
        </span>
        <Link
          to="/actions"
          style={{
            display: 'flex', alignItems: 'center', gap: '4px',
            fontSize: '12px', fontWeight: 600,
            textDecoration: 'none', padding: '5px 12px',
            borderRadius: '100px', border: `1.5px solid ${tc.color}`,
            background: hovered ? tc.color : 'transparent',
            color: hovered ? '#fff' : tc.color,
            transition: 'all 0.2s',
          }}
        >
          Voir <ArrowRight size={12} />
        </Link>
      </div>
    </article>
  );
}

// ──────────────────────────────────────────────────────────────
// PAGE HOME
// ──────────────────────────────────────────────────────────────
export default function Home() {
  const [missionRef, missionVisible] = useInView(0.15);
  const [actionsRef, actionsVisible] = useInView(0.1);

  // ── ÉTATS DYNAMIQUES — Section "Actions à la une" ──────────
  const [actions,     setActions]     = useState([]);   // liste API
  const [loadingActs, setLoadingActs] = useState(true); // squelettes
  const [errorActs,   setErrorActs]   = useState(null); // message d'erreur

  // ── FETCH — /api/last-actions/ ─────────────────────────────
  useEffect(() => {
    axios.get(API_LAST_ACTIONS)
      .then(({ data }) => {
        console.log('🎯 [Actions] Données reçues :', data);

        // Accepte : tableau direct OU { results: [...] } (pagination DRF)
        const liste = Array.isArray(data) ? data : (data.results ?? []);

        // Limitation à 3 actions maximum
        setActions(liste.slice(0, 3));
      })
      .catch(error => {
        console.error('❌ [Actions] Erreur de récupération (Peut-être CORS) :', error);
        console.error('   → URL appelée :', API_LAST_ACTIONS);
        console.error('   → Status HTTP :', error.response?.status ?? 'Pas de réponse');
        console.error('   → Message     :', error.message);
        setErrorActs('Impossible de charger les actions. Vérifiez que le serveur Django est démarré.');
      })
      .finally(() => setLoadingActs(false));
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,800;1,700&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap');
        * { box-sizing: border-box; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeRight {
          from { opacity: 0; transform: translateX(-28px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes fadeLeft {
          from { opacity: 0; transform: translateX(28px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes pulse-soft {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.4; }
        }

        .mission-text-block {
          opacity: 0; transform: translateX(-28px);
          transition: opacity 0.7s ease, transform 0.7s ease;
        }
        .mission-text-block.visible { opacity: 1; transform: translateX(0); }

        .mission-img-block {
          opacity: 0; transform: translateX(28px);
          transition: opacity 0.7s 0.15s ease, transform 0.7s 0.15s ease;
        }
        .mission-img-block.visible { opacity: 1; transform: translateX(0); }

        .actions-header {
          opacity: 0; transform: translateY(20px);
          transition: opacity 0.6s ease, transform 0.6s ease;
        }
        .actions-header.visible { opacity: 1; transform: translateY(0); }

        .engagement-item {
          display: flex; align-items: flex-start;
          gap: 14px; padding: 14px 0;
          border-bottom: 1px solid #e8f0fe;
        }
        .engagement-item:last-child { border-bottom: none; }

        .section-kicker { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; }
        .kicker-line { display: block; width: 28px; height: 2px; background: linear-gradient(90deg, #1640c8, #17a8b5); border-radius: 2px; }
        .kicker-text { font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; color: #17a8b5; font-weight: 700; font-family: 'DM Sans', sans-serif; }

        .cta-btn-primary {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 13px 28px; border-radius: 100px;
          background: linear-gradient(135deg, #1640c8, #17a8b5);
          color: #fff; font-size: 14px; font-weight: 700;
          text-decoration: none; font-family: 'DM Sans', sans-serif;
          box-shadow: 0 6px 24px rgba(22,64,200,0.28);
          transition: all 0.25s cubic-bezier(0.34,1.56,0.64,1);
        }
        .cta-btn-primary:hover { transform: translateY(-3px); box-shadow: 0 12px 32px rgba(22,64,200,0.36); }

        .cta-btn-outline {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 12px 26px; border-radius: 100px;
          background: transparent; border: 2px solid #1640c8;
          color: #1640c8; font-size: 14px; font-weight: 600;
          text-decoration: none; font-family: 'DM Sans', sans-serif;
          transition: all 0.2s ease;
        }
        .cta-btn-outline:hover { background: #eef5ff; }
      `}</style>

      <div style={{ background: '#fff', fontFamily: '"DM Sans", sans-serif' }}>

        {/* ══════════════════════════════════════════════════════
            1. HERO SECTION
        ══════════════════════════════════════════════════════ */}
        <HeroSection />

        {/* ══════════════════════════════════════════════════════
            2. STATS SECTION
        ══════════════════════════════════════════════════════ */}
        <StatsSection />

        {/* ══════════════════════════════════════════════════════
            3. SECTION "NOTRE MISSION"
        ══════════════════════════════════════════════════════ */}
        <section
          id="mission"
          ref={missionRef}
          style={{ background: '#fff', padding: '100px 24px' }}
        >
          <div style={{
            maxWidth: '1160px', margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '72px', alignItems: 'center',
          }}>

            {/* Bloc texte */}
            <div className={`mission-text-block ${missionVisible ? 'visible' : ''}`}>
              <div className="section-kicker">
                <span className="kicker-line" />
                <span className="kicker-text">Notre mission</span>
              </div>
              <h2 style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: 'clamp(1.8rem, 3vw, 2.6rem)', fontWeight: 700, lineHeight: 1.15, color: '#0f172a', margin: '0 0 22px' }}>
                Ensemble, nous construisons{' '}
                <em style={{ fontStyle: 'italic', color: '#1640c8' }}>un avenir plus sain</em>
              </h2>
              <p style={{ fontSize: '16px', color: '#475569', lineHeight: 1.8, margin: '0 0 20px', maxWidth: '520px' }}>
                L'association ININ croit profondément que la santé mentale et physique
                de la jeunesse africaine est la clé d'un continent prospère. À travers
                des programmes innovants et culturellement adaptés, nous accompagnons
                des milliers de jeunes vers l'épanouissement et la résilience.
              </p>
              <p style={{ fontSize: '15px', color: '#64748b', lineHeight: 1.75, margin: '0 0 32px', maxWidth: '520px' }}>
                De Dakar à Nairobi, nos équipes de bénévoles et de professionnels de
                santé travaillent main dans la main avec les communautés locales
                pour créer un impact durable et mesurable.
              </p>
              <div style={{ marginBottom: '36px' }}>
                {ENGAGEMENTS.map(({ icon: Icon, text }, i) => (
                  <div key={i} className="engagement-item">
                    <div style={{ width: '36px', height: '36px', flexShrink: 0, borderRadius: '10px', background: 'linear-gradient(135deg, #eef5ff, #e0f2fe)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon size={17} style={{ color: '#1640c8' }} />
                    </div>
                    <p style={{ fontSize: '14px', color: '#475569', lineHeight: 1.6, margin: 0 }}>{text}</p>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                <Link to="/actions" className="cta-btn-primary">
                  Découvrir nos actions <ArrowRight size={16} />
                </Link>
                <Link to="/contact" className="cta-btn-outline">
                  Nous contacter
                </Link>
              </div>
            </div>

            {/* Bloc image */}
            <div className={`mission-img-block ${missionVisible ? 'visible' : ''}`} style={{ position: 'relative' }}>
              <div style={{ borderRadius: '24px', overflow: 'hidden', boxShadow: '0 24px 64px rgba(22,64,200,0.12)', aspectRatio: '4/5' }}>
                <img
                  src="https://images.unsplash.com/photo-1544717305-2782549b5136?w=800&q=85&auto=format&fit=crop"
                  alt="Jeunes africains en atelier"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              </div>
              {/* Badge flottant haut-gauche */}
              <div style={{ position: 'absolute', top: '24px', left: '-20px', background: '#fff', borderRadius: '16px', padding: '14px 18px', boxShadow: '0 8px 28px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: '10px', fontFamily: '"DM Sans", sans-serif' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'linear-gradient(135deg, #eef5ff, #dbeafe)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Users size={18} style={{ color: '#1640c8' }} />
                </div>
                <div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#1640c8', lineHeight: 1, fontFamily: '"Playfair Display", serif' }}>1 200+</div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>jeunes accompagnés</div>
                </div>
              </div>
              {/* Badge flottant bas-droite */}
              <div style={{ position: 'absolute', bottom: '28px', right: '-16px', background: 'linear-gradient(135deg, #1640c8, #17a8b5)', borderRadius: '16px', padding: '14px 20px', boxShadow: '0 8px 24px rgba(22,64,200,0.3)', fontFamily: '"DM Sans", sans-serif' }}>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#fff', lineHeight: 1, fontFamily: '"Playfair Display", serif' }}>8 pays</div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', marginTop: '3px' }}>d'intervention</div>
              </div>
              {/* Pastilles décoratives */}
              <div style={{ position: 'absolute', bottom: '-16px', left: '20px', width: '80px', height: '80px', borderRadius: '50%', background: '#eef5ff', zIndex: -1 }} />
              <div style={{ position: 'absolute', top: '-12px', right: '24px', width: '48px', height: '48px', borderRadius: '50%', background: '#e0f2fe', zIndex: -1 }} />
            </div>

          </div>
        </section>

        {/* ══════════════════════════════════════════════════════
            4. SECTION "ACTIONS À LA UNE" — DYNAMIQUE
        ══════════════════════════════════════════════════════ */}
        <section
          id="actions-preview"
          ref={actionsRef}
          style={{ background: '#f8fafc', padding: '100px 24px' }}
        >
          <div style={{ maxWidth: '1160px', margin: '0 auto' }}>

            {/* En-tête */}
            <div
              className={`actions-header ${actionsVisible ? 'visible' : ''}`}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '24px', marginBottom: '52px', flexWrap: 'wrap' }}
            >
              <div>
                <div className="section-kicker">
                  <span className="kicker-line" />
                  <span className="kicker-text">Actions à la une</span>
                </div>
                <h2 style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: 'clamp(1.8rem, 3vw, 2.5rem)', fontWeight: 700, lineHeight: 1.2, color: '#0f172a', margin: 0 }}>
                  Ce que nous faisons{' '}
                  <em style={{ fontStyle: 'italic', color: '#17a8b5' }}>sur le terrain</em>
                </h2>
              </div>

              {/* ✅ Bouton "Voir tout" conservé — React Router Link */}
              <Link
                to="/actions"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: 600, color: '#1640c8', textDecoration: 'none', borderBottom: '2px solid #c7d7fc', paddingBottom: '2px', transition: 'border-color 0.2s, color 0.2s', whiteSpace: 'nowrap' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#1640c8'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#c7d7fc'; }}
              >
                Voir toutes les actions
                <ExternalLink size={14} />
              </Link>
            </div>

            {/* ── Erreur réseau ─────────────────────────────────── */}
            {errorActs && (
              <div style={{ background: '#fef2f2', border: '1px solid rgba(220,38,38,0.2)', borderRadius: '12px', padding: '16px 20px', marginBottom: '32px', fontFamily: '"DM Sans", sans-serif', fontSize: '14px', color: '#dc2626', textAlign: 'center' }}>
                {errorActs}
              </div>
            )}

            {/* ── Grille : squelettes → cartes → état vide ─────── */}
            {loadingActs ? (
              /* Squelettes animés pendant le fetch */
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
                {[1, 2, 3].map(i => <SkeletonActionCard key={i} />)}
              </div>
            ) : actions.length === 0 && !errorActs ? (
              /* Fallback visible si liste vide */
              <div style={{ textAlign: 'center', padding: '64px 24px', background: '#fff', borderRadius: '16px', border: '1px dashed #e5e7eb' }}>
                <div style={{ fontSize: '2rem', marginBottom: '12px' }}>📋</div>
                <p style={{ fontFamily: '"DM Sans", sans-serif', fontSize: '15px', color: '#9ca3af', margin: 0 }}>
                  Aucune action en cours pour le moment.{' '}
                  <Link to="/actions" style={{ color: '#1640c8', textDecoration: 'underline' }}>
                    Voir l'historique complet
                  </Link>
                </p>
              </div>
            ) : (
              /* Grille des 3 actions API */
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
                {actions.map((action, i) => (
                  <MiniActionCard key={action.id} action={action} index={i} />
                ))}
              </div>
            )}

            {/* CTA centré sous les cartes */}
            {!loadingActs && actions.length > 0 && (
              <div style={{ textAlign: 'center', marginTop: '52px' }}>
                <Link to="/actions" className="cta-btn-primary" style={{ fontSize: '15px', padding: '14px 34px' }}>
                  Découvrir toutes nos actions
                  <ArrowRight size={17} />
                </Link>
              </div>
            )}

          </div>
        </section>

        {/* ══════════════════════════════════════════════════════
            5. CTA DONATION (Bannière finale)
        ══════════════════════════════════════════════════════ */}
        <section style={{ background: 'linear-gradient(135deg, #0f2060 0%, #1640c8 55%, #17a8b5 100%)', padding: '90px 24px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-80px', right: '-80px', width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
          <div style={{ position: 'absolute', bottom: '-60px', left: '-60px', width: '240px', height: '240px', borderRadius: '50%', background: 'rgba(23,168,181,0.12)' }} />

          <div style={{ position: 'relative', maxWidth: '600px', margin: '0 auto' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', border: '1px solid rgba(255,255,255,0.2)' }}>
              <Heart size={28} style={{ color: '#30c8d3' }} fill="#30c8d3" />
            </div>
            <h2 style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)', fontWeight: 700, color: '#fff', lineHeight: 1.2, margin: '0 0 16px' }}>
              Rejoignez le mouvement ININ
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.72)', fontSize: '16px', lineHeight: 1.75, margin: '0 0 36px' }}>
              Que vous souhaitiez faire un don, devenir bénévole ou simplement
              partager notre mission — chaque geste compte pour la jeunesse africaine.
            </p>
            <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
                            <Link to="/don"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '14px 32px', borderRadius: '100px', background: '#30c8d3', color: '#0f2060', fontSize: '15px', fontWeight: 700, textDecoration: 'none', fontFamily: '"DM Sans", sans-serif', boxShadow: '0 8px 28px rgba(48,200,211,0.35)', transition: 'all 0.25s cubic-bezier(0.34,1.56,0.64,1)' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 14px 36px rgba(48,200,211,0.4)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(48,200,211,0.35)'; }}
              >
                <Heart size={16} fill="currentColor" /> Faire un don
              </Link>
              <Link to="/devenir-membre"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '13px 30px', borderRadius: '100px', background: 'transparent', border: '2px solid rgba(255,255,255,0.4)', color: '#fff', fontSize: '15px', fontWeight: 600, textDecoration: 'none', fontFamily: '"DM Sans", sans-serif', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.7)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)'; }}
              >
                Devenir bénévole <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════
            FOOTER
        ══════════════════════════════════════════════════════ */}
        <footer style={{ background: '#0a0f2e', padding: '24px', textAlign: 'center', fontFamily: '"DM Sans", sans-serif' }}>
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0 }}>
            © {new Date().getFullYear()} · Association{' '}
            <span style={{ color: '#30c8d3', fontWeight: 700 }}>ININ</span>
            {' '}· Ensemble pour une jeunesse en bonne santé
          </p>
        </footer>

      </div>
    </>
  );
}