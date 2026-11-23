import Constants from 'expo-constants';

const ENV = Constants.expoConfig?.extra ?? {};
export const API_BASE = process.env.EXPO_PUBLIC_API_BASE || ENV.API_BASE || 'http://localhost:38799';

let mockToken: string | null = null;

export function setToken(t: string | null) { mockToken = t; }
export function getToken() { return mockToken; }

function headers(extra: Record<string,string> = {}) {
  const h: Record<string,string> = { 'Content-Type': 'application/json', ...extra };
  if (mockToken) h.Authorization = `Bearer ${mockToken}`;
  return h;
}

export async function api<T>(path: string, opts: { method?: string; body?: any; signal?: AbortSignal } = {}): Promise<T> {
  const res = await fetch(`${API_BASE}/api${path}`, {
    method: opts.method ?? 'GET',
    headers: headers(),
    body: opts.body ? JSON.stringify(opts.body) : undefined,
    signal: opts.signal,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `Request failed (${res.status})`);
  }
  return res.json();
}

export function mock<T>(data: T): T { return data; }

export default api;