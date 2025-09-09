export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

export const getAuthToken = (): string | null => {
  try {
    return localStorage.getItem('auth_token');
  } catch {
    return null;
  }
};

export const getAuthHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = { 'Accept': 'application/json' };
  const token = getAuthToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
};

export async function fetchJson(input: RequestInfo | URL, init: RequestInit = {}) {
  const res = await fetch(input, {
    ...init,
    headers: { ...(init.headers || {}), ...getAuthHeaders() },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(json?.message || 'Request failed'), { status: res.status, json });
  return json;
}

// Convenience API helpers
export async function apiLogout(): Promise<void> {
  if (!API_BASE_URL) {
    try { localStorage.removeItem('auth_token') } catch {}
    return;
  }
  try {
    await fetchJson(`${API_BASE_URL}/api/auth/logout`, { method: 'POST', headers: { 'Accept': 'application/json' } });
  } catch {}
  try { localStorage.removeItem('auth_token') } catch {}
}

export async function apiImpersonate(userId: string): Promise<void> {
  if (!API_BASE_URL) return;
  await fetchJson(`${API_BASE_URL}/api/auth/impersonate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({ user_id: userId })
  });
}

export async function apiStopImpersonate(): Promise<void> {
  if (!API_BASE_URL) return;
  await fetchJson(`${API_BASE_URL}/api/auth/stop-impersonate`, { method: 'POST', headers: { 'Accept': 'application/json' } });
}

export async function apiMe(): Promise<{ user: any; impersonation?: any }> {
  if (!API_BASE_URL) return { user: null } as any
  const res = await fetchJson(`${API_BASE_URL}/api/auth/me`, { headers: { 'Accept': 'application/json' } })
  return (res as any).data
}

export async function apiListUsers(params: { search?: string; role?: string; perPage?: number; page?: number }): Promise<{ items: any[]; meta?: any }> {
  const qs = new URLSearchParams()
  if (params.search) qs.set('search', params.search)
  if (params.role) qs.set('role', params.role)
  qs.set('paginate', '1')
  qs.set('per_page', String(params.perPage || 10))
  if (params.page) qs.set('page', String(params.page))
  const res = await fetchJson(`${API_BASE_URL}/api/users?${qs.toString()}`, { headers: { 'Accept': 'application/json' } })
  const data = (res as any).data
  // Laravel paginator returns { data, meta } style or nested; normalize
  const items = data?.data ?? data
  const meta = data?.meta ?? undefined
  return { items, meta }
}


// Dashboard helpers
export type DashboardPengajuanStats = {
  total: number
  draft: number
  submitted: number
  approved: number
  rejected: number
  this_month: number
  this_year: number
}

export async function apiDashboardStats(): Promise<DashboardPengajuanStats> {
  const res = await fetchJson(`${API_BASE_URL}/api/dashboard/stats`, { headers: { 'Accept': 'application/json' } })
  return (res as any).data as DashboardPengajuanStats
}

export type SyncStatus = {
  last_sync_at?: string | null
  employees_count: number
}

export async function apiSyncStatus(): Promise<SyncStatus> {
  const res = await fetchJson(`${API_BASE_URL}/api/sync/status`, { headers: { 'Accept': 'application/json' } })
  // This endpoint returns flat keys, not wrapped in { data }
  return res as SyncStatus
}

