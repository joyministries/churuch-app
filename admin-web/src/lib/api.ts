const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:38799';

let _token: string | null = null;

export function setToken(t: string | null) { _token = t; }
export function getToken() { return _token; }

async function request<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}/api${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(_token ? { Authorization: `Bearer ${_token}` } : {}),
      ...opts.headers,
    },
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(txt || `Request failed (${res.status})`);
  }
  return res.json();
}

export const api = {
  get: <T>(path: string) => request<T>(path, { method: 'GET' }),
  post: <T>(path: string, body: unknown) => request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) => request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};

export const authApi = {
  login: (email: string, password: string) =>
    api.post<{ token: string; user: User }>('/auth/login', { email, password }),
  me: () => api.get<User>('/auth/me'),
};

export interface User {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  role: 'member' | 'leader' | 'ministry_admin' | 'admin';
  campus_id: number | null;
  avatar_url: string | null;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
  ministries?: { id: number; name: string; role: string }[];
}

export interface Campus {
  id: number;
  name: string;
  slug: string;
  address: string | null;
  service_times: string | null;
  phone: string | null;
  is_primary: boolean;
}

export interface AdminUser extends User {}

export interface AuditLog {
  id: number;
  actor_id: number | null;
  action: string;
  target: string | null;
  ministry_id: number | null;
  meta: string | null;
  ip: string | null;
  created_at: string;
  actor_name?: string;
}

export interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}