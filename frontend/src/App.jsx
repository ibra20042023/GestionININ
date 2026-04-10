/**
 * src/App.jsx — version mise à jour avec la route /admin/analytics
 * Ajouts par rapport à l'original :
 *   ✅ import AnalyticsDashboard
 *   ✅ Route protégée /admin/analytics → <AnalyticsDashboard />
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider }       from './context/AuthContext';
import { useAuth }            from './context/AuthContext';

import Navbar                 from './components/Navbar';
import ProtectedRoute         from './components/ProtectedRoute';

import Home                   from './pages/Home';
import Actions                from './pages/Actions';
import About                  from './pages/About';
import Membres                from './pages/Membres';
import Contact                from './pages/Contact';
import Login                  from './pages/Login';
import DevenirMembre          from './pages/DevenirMembre';
import PageDon                from './pages/PageDon';
import DashboardMembre        from './pages/DashboardMembre';
import DashboardChargeProjet  from './pages/DashboardChargeProjet';
import DashboardTresorier     from './pages/DashboardTresorier';
import DashboardRH            from './pages/DashboardRespoRH';
import DashboardPartenariat   from './pages/DashboardPartenariat';
import DashboardAdmin         from './pages/DashboardAdmin';
import Profil                 from './pages/Profil';
import AnalyticsDashboard     from './pages/AnalyticsDashboard'; // ✅ NOUVEAU

const KNOWN_ROLES = [
  'ADMINISTRATEUR', 'ADMIN',
  'TRESORIER', 'CHARGE_PROJET',
  'RESPONSABLE_RH', 'CHARGE_PARTENARIAT',
  'MEMBRE',
];

function DashboardRouter() {
  const { user } = useAuth();
  console.log('🖥️  DashboardRouter — rôle actuel :', user?.role);
  if (!user?.role || !KNOWN_ROLES.includes(user.role)) {
    console.warn('⚠️  Rôle inconnu ou absent :', user?.role, '→ redirection /login');
    return <Navigate to="/login" replace />;
  }
  switch (user.role) {
    case 'CHARGE_PROJET':      return <DashboardChargeProjet />;
    case 'TRESORIER':          return <DashboardTresorier />;
    case 'RESPONSABLE_RH':     return <DashboardRH />;
    case 'CHARGE_PARTENARIAT': return <DashboardPartenariat />;
    case 'ADMIN':
    case 'ADMINISTRATEUR':     return <DashboardAdmin />;
    case 'MEMBRE':
    default:                   return <DashboardMembre />;
  }
}

function PlaceholderPage({ title }) {
  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center',
      justifyContent:'center', background:'#f8fafc', paddingTop:'80px',
      fontFamily:'"DM Sans", sans-serif' }}>
      <div style={{ textAlign:'center' }}>
        <p style={{ fontSize:'11px', letterSpacing:'0.2em', textTransform:'uppercase',
          color:'#17a8b5', fontWeight:700, marginBottom:'12px' }}>En construction</p>
        <h1 style={{ fontFamily:'"Playfair Display", Georgia, serif', fontSize:'2.5rem',
          fontWeight:700, color:'#0f172a', margin:'0 0 12px' }}>{title}</h1>
        <p style={{ color:'#94a3b8', fontSize:'15px', margin:0 }}>
          Cette section sera disponible prochainement.
        </p>
      </div>
    </div>
  );
}

const NotFound = () => <PlaceholderPage title="Page introuvable (404)" />;

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,800;1,700&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap"
          rel="stylesheet"
        />
        <Navbar />
        <Routes>
          {/* ── Routes publiques ── */}
          <Route path="/"               element={<Home />} />
          <Route path="/actions"        element={<Actions />} />
          <Route path="/about"          element={<About />} />
          <Route path="/membres"        element={<Membres />} />
          <Route path="/contact"        element={<Contact />} />
          <Route path="/login"          element={<Login />} />
          <Route path="/devenir-membre" element={<DevenirMembre />} />
          <Route path="/don"            element={<PageDon />} />

          {/* ── Routes protégées ── */}
          <Route path="/dashboard" element={
            <ProtectedRoute><DashboardRouter /></ProtectedRoute>
          } />
          <Route path="/dashboard/settings" element={
            <ProtectedRoute><Profil /></ProtectedRoute>
          } />

          {/* ✅ NOUVEAU — Analytics Admin */}
          <Route path="/admin/analytics" element={
            <ProtectedRoute><AnalyticsDashboard /></ProtectedRoute>
          } />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}