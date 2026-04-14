import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { setAccessToken, clearAuth, apiClient } from '../lib/api';

// Lightweight cookie helpers — used by Next.js middleware to gate routes.
// The real auth guard is always the JWT on the backend.
function setAuthCookie() {
  if (typeof document !== 'undefined') {
    document.cookie = 'pos_authenticated=1; path=/; SameSite=Strict';
  }
}
function clearAuthCookie() {
  if (typeof document !== 'undefined') {
    document.cookie = 'pos_authenticated=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  }
}

interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hydrate: (user: AuthUser, accessToken: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,

      async login(email: string, password: string) {
        const { data } = await apiClient.post('/auth/login', { email, password });
        const { accessToken, user } = data.data;
        setAccessToken(accessToken);
        setAuthCookie();
        set({ user, isAuthenticated: true });
      },

      async logout() {
        try {
          await apiClient.post('/auth/logout');
        } finally {
          clearAuth();
          clearAuthCookie();
          set({ user: null, isAuthenticated: false });
        }
      },

      hydrate(user: AuthUser, accessToken: string) {
        setAccessToken(accessToken);
        setAuthCookie();
        set({ user, isAuthenticated: true });
      },
    }),
    {
      name: 'hizlipos-auth',
      // Only persist user info — NOT the token (token lives in memory only)
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    },
  ),
);
