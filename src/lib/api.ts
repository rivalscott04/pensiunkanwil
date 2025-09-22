import { API_BASE_URL } from './config';

// Re-export API_BASE_URL for backward compatibility
export { API_BASE_URL };

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
  const res = await fetchJson(`${API_BASE_URL}/api/auth/impersonate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({ user_id: userId })
  });
  
  // Update token in localStorage
  if (res?.data?.token) {
    localStorage.setItem('auth_token', res.data.token);
  }
}

export async function apiStopImpersonate(): Promise<void> {
  if (!API_BASE_URL) return;
  const res = await fetchJson(`${API_BASE_URL}/api/auth/stop-impersonate`, { method: 'POST', headers: { 'Accept': 'application/json' } });
  
  // Update token in localStorage
  if (res?.data?.token) {
    localStorage.setItem('auth_token', res.data.token);
  }
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

export async function apiCreateUser(payload: any): Promise<any> {
  const res = await fetchJson(`${API_BASE_URL}/api/users`, {
    method: 'POST',
    headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  return (res as any).data ?? res
}

export async function apiUpdateUser(id: string | number, payload: any): Promise<any> {
  const res = await fetchJson(`${API_BASE_URL}/api/users/${id}`, {
    method: 'PUT',
    headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  return (res as any).data ?? res
}

export async function apiDeleteUser(id: string | number): Promise<void> {
  await fetchJson(`${API_BASE_URL}/api/users/${id}`, { method: 'DELETE', headers: { 'Accept': 'application/json' } })
}

export async function apiListKabupaten(): Promise<Array<{ id: number; nama: string }>> {
  const res = await fetchJson(`${API_BASE_URL}/api/kabupaten/active`, { headers: { 'Accept': 'application/json' } })
  const data = (res as any).data ?? res
  return Array.isArray(data) ? data : []
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

export type Personnel = {
  id: number
  nip: string
  nama: string
  jabatan: string
  unit_kerja: string
  golongan: string
}

export async function apiSearchPersonnel(query: string): Promise<Personnel[]> {
  if (!query.trim()) return []
  const res = await fetchJson(`${API_BASE_URL}/api/personnel/search?q=${encodeURIComponent(query)}&limit=50`, { headers: { 'Accept': 'application/json' } })
  return (res as any).data ?? []
}

// Pension Application API functions
export type PensionApplication = {
  id: string
  nomor_pengajuan: string
  nip_pegawai: string
  nama_pegawai: string
  jabatan?: string
  unit_kerja?: string
  pangkat_golongan?: string
  jenis_pensiun?: string
  status: 'draft' | 'diajukan' | 'diterima' | 'ditolak'
  catatan?: string
  tanggal_pengajuan?: string
  tanggal_approval?: string
  approved_by?: number
  created_at: string
  updated_at: string
}

export type CreatePensionApplicationRequest = {
  nip_pegawai: string
  nama_pegawai: string
  jabatan?: string
  unit_kerja?: string
  pangkat_golongan?: string
  jenis_pensiun?: string
  catatan?: string
}

export async function apiCreatePensionApplication(payload: CreatePensionApplicationRequest): Promise<PensionApplication> {
  const res = await fetchJson(`${API_BASE_URL}/api/pengajuan`, {
    method: 'POST',
    headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  return (res as any).data
}

export async function apiGetPensionApplication(id: string): Promise<PensionApplication> {
  const res = await fetchJson(`${API_BASE_URL}/api/pengajuan/${id}`, { headers: { 'Accept': 'application/json' } })
  return (res as any).data
}

export async function apiUpdatePensionApplication(id: string, payload: Partial<CreatePensionApplicationRequest>): Promise<PensionApplication> {
  const res = await fetchJson(`${API_BASE_URL}/api/pengajuan/${id}`, {
    method: 'PUT',
    headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  return (res as any).data
}

export async function apiSubmitPensionApplication(id: string): Promise<PensionApplication> {
  const res = await fetchJson(`${API_BASE_URL}/api/pengajuan/${id}/submit`, {
    method: 'POST',
    headers: { 'Accept': 'application/json' }
  })
  return (res as any).data
}

export async function apiUpdatePensionApplicationStatus(id: string, status: 'diterima' | 'ditolak', catatan?: string): Promise<PensionApplication> {
  const res = await fetchJson(`${API_BASE_URL}/api/pengajuan/${id}/status`, {
    method: 'PUT',
    headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, catatan })
  })
  return (res as any).data
}

export async function apiDeletePensionApplication(id: string): Promise<void> {
  await fetchJson(`${API_BASE_URL}/api/pengajuan/${id}`, { 
    method: 'DELETE', 
    headers: { 'Accept': 'application/json' } 
  })
}

// File upload API functions
export type FileUploadResponse = {
  id: number
  pengajuan_id: number
  nama_file: string
  nama_asli: string
  path: string
  mime_type: string
  size: number
  jenis_dokumen: string
  is_required: boolean
  keterangan?: string
  created_at: string
  updated_at: string
}

export async function apiUploadFile(
  pengajuanId: string, 
  file: File, 
  jenisDokumen: string, 
  isRequired: boolean = true,
  keterangan?: string
): Promise<FileUploadResponse> {
  const formData = new FormData()
  formData.append('pengajuan_id', pengajuanId)
  formData.append('file', file)
  formData.append('jenis_dokumen', jenisDokumen)
  formData.append('is_required', isRequired.toString())
  if (keterangan) formData.append('keterangan', keterangan)

  const res = await fetch(`${API_BASE_URL}/api/files/upload`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: formData
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({}))
    throw new Error(error?.message || 'Upload failed')
  }

  const json = await res.json()
  return json.data
}

export async function apiBulkUploadFiles(
  pengajuanId: string,
  files: { file: File; jenis_dokumen: string }[]
): Promise<{ uploaded_files: FileUploadResponse[]; errors: string[] }> {
  const formData = new FormData()
  formData.append('pengajuan_id', pengajuanId)
  
  files.forEach(({ file, jenis_dokumen }, index) => {
    formData.append(`files[${index}]`, file)
    formData.append(`jenis_dokumen[${index}]`, jenis_dokumen)
  })

  const res = await fetch(`${API_BASE_URL}/api/files/bulk-upload`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: formData
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({}))
    throw new Error(error?.message || 'Bulk upload failed')
  }

  const json = await res.json()
  return json.data
}

export async function apiGetPensionApplicationFiles(pengajuanId: string): Promise<FileUploadResponse[]> {
  const res = await fetchJson(`${API_BASE_URL}/api/files/pengajuan/${pengajuanId}`, { headers: { 'Accept': 'application/json' } })
  return (res as any).data ?? []
}

export async function apiDeleteFile(fileId: string): Promise<void> {
  await fetchJson(`${API_BASE_URL}/api/files/${fileId}`, { 
    method: 'DELETE', 
    headers: { 'Accept': 'application/json' } 
  })
}

