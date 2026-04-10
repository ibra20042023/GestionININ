/**
 * src/components/ProtectedRoute.jsx
 * ─────────────────────────────────────────────────────────────
 * Garde de route — redirige vers /login si non authentifié.
 *
 * Usage dans App.jsx :
 *   <Route path="/dashboard" element={
 *     <ProtectedRoute><DashboardMembre /></ProtectedRoute>
 *   } />
 * ─────────────────────────────────────────────────────────────
 */

import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    // Sauvegarde la route demandée pour rediriger après login si besoin
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}