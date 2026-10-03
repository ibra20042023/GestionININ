/**
 * src/api/api.js
 * ─────────────────────────────────────────────────────────────
 * Instance Axios centrale pour toutes les requêtes vers l'API Django.
 *
 * Corrections v2 :
 *  ✅ Intercepteur de réponse intelligent — ne redirige que si
 *     le token est réellement absent (session expirée), pas sur
 *     tout 401 métier (inscription, permissions, etc.)
 *  ✅ Lecture du token dans localStorage ET sessionStorage
 *     (cohérent avec AuthContext qui supporte les deux)
 *  ✅ Routes métier exclues de la redirection automatique
 * ─────────────────────────────────────────────────────────────
 */

import axios from 'axios';

const BASE_URL = `${import.meta.env.VITE_API_URL}/api/`;

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept':       'application/json',
  },
});

// ── Helpers storage ───────────────────────────────────────────
const getToken  = (key) =>
  localStorage.getItem(key) || sessionStorage.getItem(key);

const setTokens = (access, refresh) => {
  // Détecte quel storage est actif (remember me = localStorage)
  const store = localStorage.getItem('access_token')
    ? localStorage
    : sessionStorage;
  store.setItem('access_token',  access);
  if (refresh) store.setItem('refresh_token', refresh);
};

const clearTokens = () => {
  ['access_token', 'refresh_token', 'user_data'].forEach((k) => {
    localStorage.removeItem(k);
    sessionStorage.removeItem(k);
  });
};

// ── Routes métier — ne déclenchent PAS de déconnexion ────────
const ROUTES_METIER = ['/inscrire/', '/demandes/'];
const estRouteMetier = (url = '') =>
  ROUTES_METIER.some((r) => url.includes(r));

// ── Flag anti-boucle infinie ──────────────────────────────────
// Empêche de retenter le refresh si le refresh lui-même échoue
let isRefreshing       = false;
let refreshSubscribers = []; // file d'attente des requêtes en attente

const onRefreshed = (newToken) => {
  refreshSubscribers.forEach((cb) => cb(newToken));
  refreshSubscribers = [];
};

const addSubscriber = (cb) => {
  refreshSubscribers.push(cb);
};

// ── Intercepteur de REQUÊTE ───────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = getToken('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Ne pas forcer JSON si c'est du multipart
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Intercepteur de RÉPONSE ───────────────────────────────────
api.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;
    const status          = error.response?.status;
    const code            = error.response?.data?.code;   // 'token_not_valid'
    const url             = originalRequest?.url ?? '';

    // ── Cas 1 : Token expiré → on tente le refresh ───────────
    // Conditions :
    //   - 401 avec code 'token_not_valid'
    //   - Pas une route métier
    //   - Pas déjà une tentative de retry (_retry flag)
    if (
      status === 401 &&
      code === 'token_not_valid' &&
      !estRouteMetier(url) &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true; // marque la requête pour éviter la boucle

      const refreshToken = getToken('refresh_token');

      // Pas de refresh token → déconnexion immédiate
      if (!refreshToken) {
        clearTokens();
        window.location.href = '/login';
        return Promise.reject(error);
      }

      // Si un refresh est déjà en cours, on met la requête en file d'attente
      if (isRefreshing) {
        return new Promise((resolve) => {
          addSubscriber((newToken) => {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            resolve(api(originalRequest));
          });
        });
      }

      // On lance le refresh
      isRefreshing = true;

      try {
        const { data } = await axios.post(
          `${BASE_URL}auth/token/refresh/`,
          { refresh: refreshToken },
          { headers: { 'Content-Type': 'application/json' } }
        );

        const newAccessToken = data.access;

        // Sauvegarde du nouveau token
        setTokens(newAccessToken, data.refresh ?? null);

        // Met à jour le header axios global
        axios.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;

        // Notifie les requêtes en attente
        onRefreshed(newAccessToken);
        isRefreshing = false;

        // Relance la requête originale avec le nouveau token
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);

      } catch (refreshError) {
        // Le refresh a échoué (token expiré ou révoqué) → déconnexion
        isRefreshing       = false;
        refreshSubscribers = [];
        clearTokens();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // ── Cas 2 : 401 métier (inscrire, etc.) → le composant gère ─
    // On laisse passer sans rediriger ni rafraîchir
    if (status === 401 && estRouteMetier(url)) {
      return Promise.reject(error);
    }

    // ── Cas 3 : Autre 401 sans refresh token disponible ──────
    if (status === 401 && !getToken('refresh_token')) {
      clearTokens();
      window.location.href = '/login';
      return Promise.reject(error);
    }

    // ── Tous les autres cas → le composant gère ──────────────
    return Promise.reject(error);
  }
);

export default api;