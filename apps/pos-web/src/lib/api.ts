/**
 * Axios instance for POS API calls.
 *
 * - Automatically attaches the JWT access token from Zustand auth store.
 * - On 401, attempts a token refresh via the httpOnly cookie endpoint.
 * - If refresh fails, clears auth state and redirects to login.
 */
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

// In local dev there's no subdomain, so we inject the tenant ID as a header.
const DEV_TENANT_ID = process.env.NEXT_PUBLIC_DEV_TENANT_ID;

export const apiClient = axios.create({
  baseURL: `${API_URL}/api/v1`,
  withCredentials: true, // needed for refresh token cookie
  timeout: 10_000,
  headers: {
    'Content-Type': 'application/json',
    ...(DEV_TENANT_ID ? { 'X-Tenant-ID': DEV_TENANT_ID } : {}),
  },
});

// ── Request interceptor: inject access token ──────────────────────────────

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (typeof window !== 'undefined') {
    // Access token is stored in memory (Zustand), not localStorage
    // Import lazily to avoid circular deps
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// ── Response interceptor: handle 401 / token refresh ──────────────────────

let isRefreshing = false;
let refreshQueue: Array<(token: string) => void> = [];

apiClient.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        // Queue the request until refresh completes
        return new Promise((resolve) => {
          refreshQueue.push((token) => {
            original.headers.Authorization = `Bearer ${token}`;
            resolve(apiClient(original));
          });
        });
      }

      original._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post(
          `${API_URL}/api/v1/auth/refresh`,
          {},
          { withCredentials: true },
        );
        const newToken: string = data.data.accessToken;
        setAccessToken(newToken);
        refreshQueue.forEach((cb) => cb(newToken));
        refreshQueue = [];
        original.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(original);
      } catch {
        clearAuth();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

// ── Token management (in-memory, avoids XSS via localStorage) ─────────────

let _accessToken: string | null = null;

export function getAccessToken(): string | null {
  return _accessToken;
}

export function setAccessToken(token: string) {
  _accessToken = token;
}

export function clearAuth() {
  _accessToken = null;
}
