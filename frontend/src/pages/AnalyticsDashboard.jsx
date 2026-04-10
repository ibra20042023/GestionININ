/**
 * src/pages/AnalyticsDashboard.jsx
 * ─────────────────────────────────────────────────────────────
 * Page Analytics — Tableau de bord analytique Admin ININ
 *
 * Sections :
 *   1. KPIs globaux (trésorerie, utilisateurs, membres, demandes)
 *   2. Pie Chart    — Répartition des types de membres
 *   3. Line Chart   — Évolution membres & bénévoles dans le temps
 *   4. Bar Chart    — Évolution des dons par semaine/mois
 *   5. Bar Chart    — Projets par statut
 *   6. Line Chart   — Partenaires actifs vs inactifs par mois
 *
 * Dépendances : recharts (npm install recharts)
 * ─────────────────────────────────────────────────────────────
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Area, AreaChart,
  BarChart, Bar, LabelList,
} from 'recharts';
import {
  ArrowLeft, Loader2, RefreshCw, AlertCircle,
  Wallet, Users, UserPlus, AlertTriangle,
  TrendingUp, PieChart as PieIcon, BarChart3, Handshake,
  Calendar, ChevronDown, Download, Sparkles,
} from 'lucide-react';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';

// ── Palette — identique à DashboardAdmin ─────────────────────
const C = {
  ink:           '#08090c',
  inkDeep:       '#05060a',
  inkSoft:       '#111318',
  inkMid:        '#1a1d26',
  inkCard:       '#1e2130',
  inkBorder:     '#2a2f40',
  inkHover:      '#242840',
  gold:          '#c9a84c',
  goldLight:     '#f0d080',
  goldDark:      '#9a7a2a',
  goldBg:        'rgba(201,168,76,.08)',
  goldBorder:    'rgba(201,168,76,.18)',
  emerald:       '#10b981',
  emeraldBg:     'rgba(16,185,129,.08)',
  emeraldBorder: 'rgba(16,185,129,.18)',
  sapphire:      '#3b82f6',
  sapphireBg:    'rgba(59,130,246,.08)',
  sapphireBorder:'rgba(59,130,246,.18)',
  rose:          '#f43f5e',
  roseBg:        'rgba(244,63,94,.08)',
  roseBorder:    'rgba(244,63,94,.18)',
  violet:        '#8b5cf6',
  violetBg:      'rgba(139,92,246,.08)',
  amber:         '#f59e0b',
  amberBg:       'rgba(245,158,11,.08)',
  teal:          '#14b8a6',
  cyan:          '#06b6d4',
  pink:          '#ec4899',
  white:         '#ffffff',
  offWhite:      '#e8eaf0',
  muted:         '#8892a4',
  mutedDark:     '#5a6478',
  dim:           '#3a4055',
  success:       '#10b981',
  successBg:     'rgba(16,185,129,.1)',
  warning:       '#f59e0b',
  warningBg:     'rgba(245,158,11,.1)',
  danger:        '#f43f5e',
  dangerBg:      'rgba(244,63,94,.1)',
};

const NAV_HEIGHT = 85;

// ── Endpoints ─────────────────────────────────────────────────
const API = {
  overview:             (p) => `analytics/overview/?period=${p}`,
  membresTypes:         (p) => `analytics/membres-types/?period=${p}`,
  membresEvolution:     (p) => `analytics/membres-evolution/?period=${p}`,
  donsEvolution:        (p) => `analytics/dons-evolution/?period=${p}`,
  projetsStatuts:       ()  => `analytics/projets-statuts/`,
  partenairesEvolution: (p) => `analytics/partenaires-evolution/?period=${p}`,
};

const fmtMontant = (v) => v != null
  ? Number(v).toLocaleString('fr-FR') + ' FCFA'
  : '—';

// ── Périodes disponibles ──────────────────────────────────────
const PERIODS = [
  { key: 'week',  label: 'Cette semaine'  },
  { key: 'month', label: 'Ce mois'        },
  { key: 'year',  label: 'Cette année'    },
  { key: 'all',   label: 'Tout le temps'  },
];

// ── Couleurs charts ───────────────────────────────────────────
const PIE_COLORS = [
  C.gold, C.emerald, C.sapphire, C.violet, C.rose,
  C.amber, C.teal, C.cyan, C.pink, '#a78bfa',
];

// ── Animations ────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};
const stagger = (d = 0.07) => ({
  hidden: {},
  show:   { transition: { staggerChildren: d } },
});

// ════════════════════════════════════════════════════════════════
// HOOK : chargement d'un endpoint analytique
// ════════════════════════════════════════════════════════════════
function useAnalytics(urlFn, period) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const { data: d } = await api.get(urlFn(period));
      setData(d);
    } catch (e) {
      setError(e.response?.data?.detail || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, [urlFn, period]);

  useEffect(() => { fetch(); }, [fetch]);
  return { data, loading, error, refetch: fetch };
}

// ════════════════════════════════════════════════════════════════
// COMPOSANTS UI PARTAGÉS
// ════════════════════════════════════════════════════════════════

function KpiCard({ icon: Icon, label, value, sub, accentColor, loading }) {
  return (
    <motion.div variants={fadeUp}
      style={{ background: C.inkCard, borderRadius: '16px',
        border: `1px solid ${C.inkBorder}`, padding: '20px',
        position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '90px',
        height: '90px', borderRadius: '50%', background: accentColor,
        opacity: .06, filter: 'blur(20px)', pointerEvents: 'none' }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
        <div style={{ width: '38px', height: '38px', borderRadius: '10px',
          background: accentColor + '18', display: 'flex', alignItems: 'center',
          justifyContent: 'center', border: `1px solid ${accentColor}25` }}>
          <Icon size={17} style={{ color: accentColor }} />
        </div>
        <span style={{ fontFamily: '"DM Sans",sans-serif', fontSize: '10.5px', fontWeight: 700,
          color: C.muted, textTransform: 'uppercase', letterSpacing: '0.09em' }}>
          {label}
        </span>
      </div>
      <div style={{ fontFamily: '"Cormorant Garamond",serif', fontSize: '2rem',
        fontWeight: 700, color: C.offWhite, lineHeight: 1, marginBottom: '5px' }}>
        {loading
          ? <Loader2 size={20} style={{ animation: 'spin 1s linear infinite', color: accentColor }} />
          : value}
      </div>
      {sub && (
        <div style={{ fontFamily: '"DM Sans",sans-serif', fontSize: '11px',
          fontWeight: 600, color: accentColor, opacity: .8 }}>{sub}</div>
      )}
    </motion.div>
  );
}

function ChartCard({ title, subtitle, icon: Icon, accentColor = C.gold, loading, error, children, tall }) {
  return (
    <motion.div variants={fadeUp}
      style={{ background: C.inkCard, borderRadius: '16px',
        border: `1px solid ${C.inkBorder}`, overflow: 'hidden',
        ...(tall ? { gridColumn: '1 / -1' } : {}) }}>
      <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.inkBorder}`,
        display: 'flex', alignItems: 'center', gap: '10px',
        background: `linear-gradient(135deg,${C.inkMid},${C.inkCard})` }}>
        <div style={{ width: '32px', height: '32px', borderRadius: '9px',
          background: accentColor + '15', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={15} style={{ color: accentColor }} />
        </div>
        <div>
          <h3 style={{ fontFamily: '"Cormorant Garamond",serif', fontSize: '1.05rem',
            fontWeight: 600, color: C.offWhite, margin: 0 }}>{title}</h3>
          {subtitle && (
            <p style={{ fontFamily: '"DM Sans",sans-serif', fontSize: '11.5px',
              color: C.mutedDark, margin: 0 }}>{subtitle}</p>
          )}
        </div>
      </div>
      <div style={{ padding: '20px', minHeight: '280px', display: 'flex',
        alignItems: loading || error ? 'center' : 'stretch',
        justifyContent: loading || error ? 'center' : 'stretch' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', color: C.muted,
            fontFamily: '"DM Sans",sans-serif', fontSize: '13px' }}>
            <Loader2 size={22} style={{ animation: 'spin 1s linear infinite', color: accentColor }} />
            Chargement des données…
          </div>
        ) : error ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
            color: C.rose, fontFamily: '"DM Sans",sans-serif', fontSize: '13px', textAlign: 'center' }}>
            <AlertCircle size={20} />
            {error}
          </div>
        ) : (
          <div style={{ width: '100%' }}>{children}</div>
        )}
      </div>
    </motion.div>
  );
}

// ── Tooltip custom ────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label, formatter }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: C.inkMid, border: `1px solid ${C.inkBorder}`,
      borderRadius: '10px', padding: '10px 14px', fontFamily: '"DM Sans",sans-serif' }}>
      {label && <p style={{ fontSize: '11px', color: C.muted, margin: '0 0 6px',
        fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ fontSize: '12.5px', color: p.color, margin: '2px 0', fontWeight: 600 }}>
          {p.name} : {formatter ? formatter(p.value, p.name) : p.value}
        </p>
      ))}
    </div>
  );
};

const CustomLegend = ({ payload }) => (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center',
    marginTop: '8px', fontFamily: '"DM Sans",sans-serif' }}>
    {payload?.map((entry, i) => (
      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: entry.color }} />
        <span style={{ fontSize: '11px', color: C.muted, fontWeight: 600 }}>{entry.value}</span>
      </div>
    ))}
  </div>
);

// ════════════════════════════════════════════════════════════════
// GRAPHIQUES INDIVIDUELS
// ════════════════════════════════════════════════════════════════

function PieMembreTypes({ data }) {
  if (!data?.length) return (
    <div style={{ textAlign: 'center', color: C.mutedDark, fontFamily: '"DM Sans",sans-serif',
      fontSize: '13px', paddingTop: '40px' }}>Aucune donnée disponible</div>
  );
  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="45%"
          outerRadius={100} innerRadius={50} paddingAngle={2}
          label={({ name, percent }) => percent > 0.04 ? `${(percent * 100).toFixed(0)}%` : ''}
          labelLine={false}>
          {data.map((entry, index) => (
            <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]}
              stroke={C.inkCard} strokeWidth={2} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip formatter={(v) => `${v} membre${v > 1 ? 's' : ''}`} />} />
        <Legend content={<CustomLegend />} />
      </PieChart>
    </ResponsiveContainer>
  );
}

function LineMembreEvolution({ data }) {
  if (!data?.length) return (
    <div style={{ textAlign: 'center', color: C.mutedDark, fontFamily: '"DM Sans",sans-serif',
      fontSize: '13px', paddingTop: '40px' }}>Aucune donnée disponible</div>
  );
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id="gradMembres" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor={C.emerald} stopOpacity={0.2} />
            <stop offset="95%" stopColor={C.emerald} stopOpacity={0.02} />
          </linearGradient>
          <linearGradient id="gradBenevoles" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor={C.sapphire} stopOpacity={0.2} />
            <stop offset="95%" stopColor={C.sapphire} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={C.inkBorder} strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="label" tick={{ fill: C.muted, fontSize: 11, fontFamily: '"DM Sans",sans-serif' }}
          axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: C.muted, fontSize: 11, fontFamily: '"DM Sans",sans-serif' }}
          axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip content={<CustomTooltip formatter={(v) => v} />} />
        <Legend content={<CustomLegend />} />
        <Area type="monotone" dataKey="membres" name="Membres" stroke={C.emerald}
          strokeWidth={2.5} fill="url(#gradMembres)" dot={false} activeDot={{ r: 4, fill: C.emerald }} />
        <Area type="monotone" dataKey="benevoles" name="Bénévoles" stroke={C.sapphire}
          strokeWidth={2.5} fill="url(#gradBenevoles)" dot={false} activeDot={{ r: 4, fill: C.sapphire }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function BarDonsEvolution({ data }) {
  if (!data?.length) return (
    <div style={{ textAlign: 'center', color: C.mutedDark, fontFamily: '"DM Sans",sans-serif',
      fontSize: '13px', paddingTop: '40px' }}>Aucune donnée disponible</div>
  );
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id="gradDons" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={C.gold}     stopOpacity={1} />
            <stop offset="100%" stopColor={C.goldDark} stopOpacity={0.7} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={C.inkBorder} strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="label" tick={{ fill: C.muted, fontSize: 11, fontFamily: '"DM Sans",sans-serif' }}
          axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: C.muted, fontSize: 11, fontFamily: '"DM Sans",sans-serif' }}
          axisLine={false} tickLine={false}
          tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
        <Tooltip content={<CustomTooltip formatter={(v) => fmtMontant(v)} />} />
        <Bar dataKey="total" name="Total Dons" fill="url(#gradDons)"
          radius={[5, 5, 0, 0]} maxBarSize={50} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function BarProjetsStatuts({ data }) {
  if (!data?.length) return (
    <div style={{ textAlign: 'center', color: C.mutedDark, fontFamily: '"DM Sans",sans-serif',
      fontSize: '13px', paddingTop: '40px' }}>Aucune donnée disponible</div>
  );
  const COLOR_MAP = {
    'En cours':   C.emerald,
    'Planifiée':  C.sapphire,
    'Clôturée':   C.muted,
    'Annulée':    C.rose,
  };
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
        <CartesianGrid stroke={C.inkBorder} strokeDasharray="3 3" horizontal={false} />
        <XAxis type="number" tick={{ fill: C.muted, fontSize: 11, fontFamily: '"DM Sans",sans-serif' }}
          axisLine={false} tickLine={false} allowDecimals={false} />
        <YAxis type="category" dataKey="name" width={80}
          tick={{ fill: C.offWhite, fontSize: 12, fontFamily: '"DM Sans",sans-serif', fontWeight: 600 }}
          axisLine={false} tickLine={false} />
        <Tooltip content={<CustomTooltip formatter={(v) => `${v} action${v > 1 ? 's' : ''}`} />} />
        <Bar dataKey="value" name="Actions" radius={[0, 5, 5, 0]} maxBarSize={28}>
          {data.map((entry, index) => (
            <Cell key={index} fill={COLOR_MAP[entry.name] || C.violet} />
          ))}
          <LabelList dataKey="value" position="right"
            style={{ fill: C.muted, fontSize: '11px', fontFamily: '"DM Sans",sans-serif', fontWeight: 700 }} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function LinePartenairesEvolution({ data }) {
  if (!data?.length) return (
    <div style={{ textAlign: 'center', color: C.mutedDark, fontFamily: '"DM Sans",sans-serif',
      fontSize: '13px', paddingTop: '40px' }}>Aucune donnée disponible</div>
  );
  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <CartesianGrid stroke={C.inkBorder} strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="label" tick={{ fill: C.muted, fontSize: 11, fontFamily: '"DM Sans",sans-serif' }}
          axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: C.muted, fontSize: 11, fontFamily: '"DM Sans",sans-serif' }}
          axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip content={<CustomTooltip formatter={(v) => v} />} />
        <Legend content={<CustomLegend />} />
        <Line type="monotone" dataKey="actifs" name="Actifs" stroke={C.emerald}
          strokeWidth={2.5} dot={{ fill: C.emerald, r: 3 }} activeDot={{ r: 5 }} />
        <Line type="monotone" dataKey="inactifs" name="Inactifs" stroke={C.rose}
          strokeWidth={2.5} strokeDasharray="5 3"
          dot={{ fill: C.rose, r: 3 }} activeDot={{ r: 5 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ════════════════════════════════════════════════════════════════
// SÉLECTEUR DE PÉRIODE
// ════════════════════════════════════════════════════════════════
function PeriodSelector({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const current = PERIODS.find(p => p.key === value) || PERIODS[1];

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={() => setOpen(p => !p)}
        style={{ display: 'inline-flex', alignItems: 'center', gap: '7px',
          padding: '9px 14px', borderRadius: '9px',
          background: C.inkMid, border: `1.5px solid ${C.inkBorder}`,
          color: C.offWhite, fontSize: '13px', fontWeight: 600,
          fontFamily: '"DM Sans",sans-serif', cursor: 'pointer',
          transition: 'all .2s' }}>
        <Calendar size={13} style={{ color: C.gold }} />
        {current.label}
        <ChevronDown size={12} style={{ color: C.muted, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }} transition={{ duration: .15 }}
            style={{ position: 'absolute', top: 'calc(100% + 6px)', right: 0,
              background: C.inkCard, border: `1px solid ${C.inkBorder}`,
              borderRadius: '10px', boxShadow: '0 20px 50px rgba(0,0,0,.5)',
              overflow: 'hidden', zIndex: 100, minWidth: '170px' }}>
            {PERIODS.map(p => (
              <button key={p.key} onClick={() => { onChange(p.key); setOpen(false); }}
                style={{ display: 'block', width: '100%', padding: '10px 14px',
                  textAlign: 'left', fontFamily: '"DM Sans",sans-serif',
                  fontSize: '13px', fontWeight: p.key === value ? 700 : 400,
                  color: p.key === value ? C.gold : C.muted,
                  background: p.key === value ? C.goldBg : 'transparent',
                  border: 'none', cursor: 'pointer', transition: 'all .15s' }}
                onMouseEnter={e => { if (p.key !== value) { e.currentTarget.style.background = C.inkHover; e.currentTarget.style.color = C.offWhite; }}}
                onMouseLeave={e => { if (p.key !== value) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.muted; }}}>
                {p.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// PAGE PRINCIPALE — AnalyticsDashboard
// ════════════════════════════════════════════════════════════════
export default function AnalyticsDashboard() {
  const { user }  = useAuth();
  const navigate  = useNavigate();
  const [period, setPeriod] = useState('month');

  // Toutes les données chargées en parallèle
  const overview    = useAnalytics(API.overview,             period);
  const memTypes    = useAnalytics(API.membresTypes,         period);
  const memEvol     = useAnalytics(API.membresEvolution,     period);
  const donsEvol    = useAnalytics(API.donsEvolution,        period);
  const projStatuts = useAnalytics(API.projetsStatuts,       period);
  const partEvol    = useAnalytics(API.partenairesEvolution, period);

  const kpis = [
    { icon: Wallet,       label: 'Trésorerie Nette',   accentColor: C.gold,
      value: overview.data ? fmtMontant(overview.data.tresorerie_nette) : '—',
      sub: 'Solde net' },
    { icon: Users,        label: 'Total Utilisateurs', accentColor: C.sapphire,
      value: overview.data?.nb_utilisateurs ?? '—',
      sub: 'Comptes actifs' },
    { icon: UserPlus,     label: 'Membres Actifs',     accentColor: C.emerald,
      value: overview.data?.nb_membres_actifs ?? '—',
      sub: 'Adhérents' },
    { icon: AlertTriangle,label: 'Demandes à Traiter', accentColor: C.amber,
      value: overview.data?.nb_demandes_en_attente ?? '—',
      sub: 'En attente' },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap');
        @keyframes spin  { to { transform: rotate(360deg); } }
        .recharts-tooltip-wrapper { outline: none !important; }
      `}</style>

      <div style={{ fontFamily: '"DM Sans",sans-serif', background: C.ink,
        minHeight: '100vh', paddingTop: `${NAV_HEIGHT}px` }}>

        {/* ── HEADER ─────────────────────────────────────────── */}
        <div style={{ background: `linear-gradient(135deg,${C.inkDeep} 0%,${C.inkSoft} 40%,${C.inkMid} 100%)`,
          padding: '32px 24px', borderBottom: `1px solid ${C.inkBorder}`,
          position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-60px', right: '-40px', width: '300px',
            height: '300px', borderRadius: '50%', background: C.gold, opacity: .03,
            filter: 'blur(60px)', pointerEvents: 'none' }} />
          <div style={{ maxWidth: '1280px', margin: '0 auto',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <button onClick={() => navigate('/dashboard')}
                style={{ width: '38px', height: '38px', borderRadius: '10px',
                  background: C.inkMid, border: `1.5px solid ${C.inkBorder}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: C.muted, transition: 'all .2s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = C.gold; e.currentTarget.style.color = C.gold; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = C.inkBorder; e.currentTarget.style.color = C.muted; }}>
                <ArrowLeft size={16} />
              </button>
              <div>
                <div style={{ fontFamily: '"DM Sans",sans-serif', fontSize: '10px',
                  fontWeight: 700, color: C.gold, letterSpacing: '0.2em',
                  textTransform: 'uppercase', marginBottom: '4px', opacity: .7 }}>
                  Analytics
                </div>
                <h1 style={{ fontFamily: '"Cormorant Garamond",serif',
                  fontSize: 'clamp(1.4rem,2.5vw,1.9rem)', fontWeight: 700,
                  color: C.offWhite, margin: 0, letterSpacing: '0.02em' }}>
                  Tableau de bord analytique
                </h1>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <PeriodSelector value={period} onChange={setPeriod} />
              <button
                onClick={() => {
                  overview.refetch(); memTypes.refetch(); memEvol.refetch();
                  donsEvol.refetch(); projStatuts.refetch(); partEvol.refetch();
                }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px',
                  padding: '9px 14px', borderRadius: '9px',
                  background: 'transparent', border: `1.5px solid ${C.inkBorder}`,
                  color: C.muted, fontSize: '13px', fontWeight: 600,
                  fontFamily: '"DM Sans",sans-serif', cursor: 'pointer', transition: 'all .2s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = C.gold; e.currentTarget.style.color = C.gold; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = C.inkBorder; e.currentTarget.style.color = C.muted; }}>
                <RefreshCw size={13} /> Actualiser
              </button>
            </div>
          </div>
        </div>

        {/* ── CONTENU ─────────────────────────────────────────── */}
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px 24px 80px' }}>

          {/* KPIs */}
          <motion.div variants={stagger(.07)} initial="hidden" animate="show"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(210px,1fr))',
              gap: '14px', marginBottom: '28px' }}>
            {kpis.map((k) => <KpiCard key={k.label} loading={overview.loading} {...k} />)}
          </motion.div>

          {/* Rang 1 : Pie + Line membres */}
          <motion.div variants={stagger(.08)} initial="hidden" animate="show"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(400px,1fr))',
              gap: '20px', marginBottom: '20px' }}>

            <ChartCard title="Répartition des types de membres"
              subtitle="Distribution par rôle dans l'association"
              icon={PieIcon} accentColor={C.gold}
              loading={memTypes.loading} error={memTypes.error}>
              <PieMembreTypes data={memTypes.data} />
            </ChartCard>

            <ChartCard title="Évolution des membres & bénévoles"
              subtitle="Croissance sur la période sélectionnée"
              icon={TrendingUp} accentColor={C.emerald}
              loading={memEvol.loading} error={memEvol.error}>
              <LineMembreEvolution data={memEvol.data} />
            </ChartCard>
          </motion.div>

          {/* Rang 2 : Dons + Projets */}
          <motion.div variants={stagger(.08)} initial="hidden" animate="show"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(400px,1fr))',
              gap: '20px', marginBottom: '20px' }}>

            <ChartCard title="Évolution des dons reçus"
              subtitle="Montants cumulés par période"
              icon={BarChart3} accentColor={C.gold}
              loading={donsEvol.loading} error={donsEvol.error}>
              <BarDonsEvolution data={donsEvol.data} />
            </ChartCard>

            <ChartCard title="Projets par statut"
              subtitle="État d'avancement de toutes les actions"
              icon={Sparkles} accentColor={C.sapphire}
              loading={projStatuts.loading} error={projStatuts.error}>
              <BarProjetsStatuts data={projStatuts.data} />
            </ChartCard>
          </motion.div>

          {/* Rang 3 : Partenaires pleine largeur */}
          <motion.div variants={stagger(.08)} initial="hidden" animate="show">
            <ChartCard title="Activité des partenariats"
              subtitle="Évolution des partenaires actifs vs inactifs"
              icon={Handshake} accentColor={C.violet}
              loading={partEvol.loading} error={partEvol.error} tall>
              <LinePartenairesEvolution data={partEvol.data} />
            </ChartCard>
          </motion.div>

        </div>
      </div>
    </>
  );
}