/**
 * src/context/AuthContext.jsx
 * ─────────────────────────────────────────────────────────────
 * Contexte d'authentification global — Association ININ
 *
 * Expose via useAuth() :
 *   isLoggedIn  → boolean
 *   user        → objet enrichi par le backend (email, role, etc.)
 *   login(data, remember) → stocke tokens + met à jour l'état
 *   logout()    → efface tokens + reset état
 *
 * Correction v2 :
 *   ✅ Un seul setUser() dans login() — fin du double appel qui
 *      écrasait le rôle avec les données du JWT décodé
 *   ✅ Rehydratation depuis le storage (rechargement page) via
 *      un champ user_data séparé, pas depuis le JWT
 *   ✅ console.log de débogage sur le rôle reçu
 * ─────────────────────────────────────────────────────────────
 */

import {
  createContext, useContext,
  useState, useCallback, useEffect,
} from 'react';
import axios from 'axios';

axios.defaults.headers.common['Content-Type'] = 'application/json';

const AuthContext = createContext(null);

// ── Helpers storage ───────────────────────────────────────────

function getStoredToken() {
  return (
    localStorage.getItem('access_token') ||
    sessionStorage.getItem('access_token') ||
    null
  );
}

/** Lit l'objet user sérialisé (écrit par login()) */
function getStoredUser() {
  try {
    const raw =
      localStorage.getItem('user_data') ||
      sessionStorage.getItem('user_data');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/** Décode le payload JWT pour vérifier l'expiration uniquement */
function decodeToken(token) {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
  } catch {
    return null;
  }
}

function isExpired(token) {
  const decoded = decodeToken(token);
  if (!decoded?.exp) return true;
  return decoded.exp * 1000 < Date.now();
}

// ── Provider ──────────────────────────────────────────────────

export function AuthProvider({ children }) {
  const [isReady, setIsReady] = useState(false);

  // Initialisation depuis le storage (rechargement de page)
  const [accessToken, setAccessToken] = useState(() => {
    const t = getStoredToken();
    return t && !isExpired(t) ? t : null;
  });

  const [user, setUser] = useState(() => {
    const t = getStoredToken();
    if (!t || isExpired(t)) return null;
    // ✅ On lit l'objet user_data (pas le payload JWT)
    return getStoredUser();
  });
  
  // ✅ Marque le contexte comme prêt après le premier rendu
  useEffect(() => {
    setIsReady(true);
  }, []);

  // Synchronise le header axios à chaque changement de token
  useEffect(() => {
    if (accessToken) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [accessToken]);

  /**
   * login(data, remember)
   *
   * @param {object}  data     — réponse complète de /api/auth/token/
   *                             { access, refresh, email, first_name,
   *                               last_name, role, role_label, photo_profil }
   * @param {boolean} remember — true = localStorage, false = sessionStorage
   */
  const login = useCallback((data, remember = false) => {
    // ── 1. Débogage : affiche le rôle reçu ──────────────────
    console.log('🔑 Rôle reçu du backend :', data.role);
    console.log('👤 Données utilisateur   :', {
      email:      data.email,
      first_name: data.first_name,
      last_name:  data.last_name,
      role:       data.role,
    });

    // ── 2. Stockage des tokens ───────────────────────────────
    const store = remember ? localStorage : sessionStorage;
    store.setItem('access_token',  data.access);
    store.setItem('refresh_token', data.refresh);

    // ── 3. Objet user enrichi (construit UNE SEULE FOIS) ─────
    //    ⚠️  Ne jamais appeler decodeToken() ici : le payload JWT
    //    ne contient que user_id/exp/iat, pas first_name ni role.
    const userObj = {
      email:        data.email        ?? '',
      first_name:   data.first_name   ?? '',
      last_name:    data.last_name    ?? '',
      role:         data.role         ?? 'MEMBRE',
      role_label:   data.role_label   ?? '',
      photo_profil: data.photo_profil ?? null,
    };

    // ── 4. Persistance de l'objet user (survit au rechargement)
    store.setItem('user_data', JSON.stringify(userObj));

    // ── 5. Mise à jour du state React ────────────────────────
    axios.defaults.headers.common['Authorization'] = `Bearer ${data.access}`;
    setAccessToken(data.access);
    setUser(userObj);  // ✅ UN SEUL setUser — pas de double appel
  }, []);

  const logout = useCallback(() => {
    ['access_token', 'refresh_token', 'user_data'].forEach(k => {
      localStorage.removeItem(k);
      sessionStorage.removeItem(k);
    });
    delete axios.defaults.headers.common['Authorization'];
    setAccessToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{
      isReady,        // ← EXPOSÉ
      isLoggedIn: Boolean(accessToken),
      user,
      accessToken,
      login,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth() doit être utilisé dans <AuthProvider>');
  return ctx;
}