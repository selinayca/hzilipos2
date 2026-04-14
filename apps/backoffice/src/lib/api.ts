import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

// In local dev there's no subdomain, so we inject the tenant ID as a header.
const DEV_TENANT_ID = process.env.NEXT_PUBLIC_DEV_TENANT_ID;

export const apiClient = axios.create({
  baseURL: `${API_URL}/api/v1`,
  withCredentials: true,
  timeout: 15_000,
  headers: {
    ...(DEV_TENANT_ID ? { 'X-Tenant-ID': DEV_TENANT_ID } : {}),
  },
});

let _token: string | null = null;

export const setToken = (t: string) => { _token = t; };
export const clearToken = () => { _token = null; };

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (_token) config.headers.Authorization = `Bearer ${_token}`;
  return config;
});

let refreshing = false;
let queue: Array<(t: string) => void> = [];

apiClient.interceptors.response.use(
  (r) => r,
  async (err: AxiosError) => {
    const orig = err.config as InternalAxiosRequestConfig & { _retry?: boolean };
    if (err.response?.status === 401 && !orig._retry) {
      if (refreshing) {
        return new Promise((res) => queue.push((t) => { orig.headers.Authorization = `Bearer ${t}`; res(apiClient(orig)); }));
      }
      orig._retry = true;
      refreshing = true;
      try {
        const { data } = await axios.post(`${API_URL}/api/v1/auth/refresh`, {}, { withCredentials: true });
        const token = data.data.accessToken as string;
        setToken(token);
        queue.forEach((cb) => cb(token));
        queue = [];
        orig.headers.Authorization = `Bearer ${token}`;
        return apiClient(orig);
      } catch {
        clearToken();
        if (typeof window !== 'undefined') window.location.href = '/login';
        return Promise.reject(err);
      } finally {
        refreshing = false;
      }
    }
    return Promise.reject(err);
  },
);
