import { API_BASE_URL, getAuthHeaders } from "./api"
import { StoredLetter, getLetters as getLocalLetters, getLetter as getLocalLetter, saveLetter as saveLocalLetter, deleteLetter as deleteLocalLetter } from "./letters"

const useApi = Boolean(API_BASE_URL)

type ApiResponse<T> = { success?: boolean; data?: T }

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    ...init,
  })
  const ct = res.headers.get('content-type') || ''
  const payload = ct.includes('application/json') ? await res.json() : await res.text()
  if (!res.ok) {
    const msg = typeof payload === 'string' ? payload : payload?.message || 'Request failed'
    throw new Error(msg)
  }
  const data = (payload as ApiResponse<T>)?.data ?? (payload as T)
  return data as T
}

// Mapping helpers between API (snake_case) and UI (camelCase)
function fromApi(api: any): StoredLetter {
  return {
    id: api.id,
    nomorSurat: api.nomor_surat,
    tanggalSurat: api.tanggal_surat,
    namaPegawai: api.nama_pegawai,
    nipPegawai: api.nip_pegawai ?? undefined,
    posisiPegawai: api.posisi_pegawai ?? undefined,
    unitPegawai: api.unit_pegawai ?? undefined,
    namaPenandatangan: api.nama_penandatangan,
    nipPenandatangan: api.nip_penandatangan ?? undefined,
    jabatanPenandatangan: api.jabatan_penandatangan ?? undefined,
    signaturePlace: api.signature_place ?? "",
    signatureDateInput: api.signature_date_input,
    signatureMode: api.signature_mode,
    signatureAnchor: api.signature_anchor,
    // @ts-ignore extend
    type: api.type,
    // @ts-ignore extend
    perihal: api.perihal,
    // @ts-ignore extend
    addresseeJabatan: api.addressee_jabatan,
    // @ts-ignore extend
    addresseeKota: api.addressee_kota,
  }
}

function toApi(ui: StoredLetter): any {
  return {
    id: ui.id,
    nomor_surat: ui.nomorSurat,
    tanggal_surat: ui.tanggalSurat,
    nama_pegawai: ui.namaPegawai,
    nip_pegawai: ui.nipPegawai ?? null,
    posisi_pegawai: ui.posisiPegawai ?? null,
    unit_pegawai: ui.unitPegawai ?? null,
    nama_penandatangan: ui.namaPenandatangan,
    nip_penandatangan: ui.nipPenandatangan ?? null,
    jabatan_penandatangan: ui.jabatanPenandatangan ?? null,
    signature_place: ui.signaturePlace,
    signature_date_input: ui.signatureDateInput,
    signature_mode: ui.signatureMode,
    signature_anchor: ui.signatureAnchor,
    template_version: 'v1',
    // extra meta when provided via type assertion
    type: (ui as any).type ?? null,
    perihal: (ui as any).perihal ?? null,
    addressee_jabatan: (ui as any).addresseeJabatan ?? null,
    addressee_kota: (ui as any).addresseeKota ?? null,
  }
}

export async function listLetters(): Promise<StoredLetter[]> {
  if (!useApi) return getLocalLetters()
  // Request non-paginated list for simplicity
  const items = await http<any[]>(`/api/letters?paginate=0`)
  return items.map(fromApi)
}

export async function listLettersByType(type?: 'pengantar_gelar' | 'pengantar_pensiun'): Promise<StoredLetter[]> {
  if (!useApi) {
    // Fallback to local list without type filtering
    return getLocalLetters()
  }
  const qs = type ? `?paginate=0&type=${encodeURIComponent(type)}` : `?paginate=0`
  const items = await http<any[]>(`/api/letters${qs}`)
  return items.map(fromApi)
}

export type LettersQuery = {
  q?: string
  type?: string
  startDate?: string // yyyy-mm-dd
  endDate?: string   // yyyy-mm-dd
}

export async function listLettersQuery(params: LettersQuery): Promise<StoredLetter[]> {
  if (!useApi) return getLocalLetters()
  const url = new URL(`${API_BASE_URL}/api/letters`)
  url.searchParams.set('paginate', '0')
  if (params.q) url.searchParams.set('q', params.q)
  if (params.type) url.searchParams.set('type', params.type)
  if (params.startDate) url.searchParams.set('start_date', params.startDate)
  if (params.endDate) url.searchParams.set('end_date', params.endDate)
  const items = await http<any[]>(url.pathname + url.search)
  return items.map(fromApi)
}

export async function getLetterById(id: string): Promise<StoredLetter | undefined> {
  if (!useApi) return getLocalLetter(id)
  const item = await http<any>(`/api/letters/${id}`)
  return fromApi(item)
}

export async function saveLetterService(letter: StoredLetter): Promise<StoredLetter> {
  if (!useApi) {
    saveLocalLetter(letter)
    return letter
  }
  // Try create first; if nomor_surat unique conflict, fall back to update by id
  const payload = toApi(letter)
  if (!letter.id) {
    const created = await http<any>(`/api/letters`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    return fromApi(created)
  }
  const updated = await http<any>(`/api/letters/${letter.id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
  return fromApi(updated)
}

export async function deleteLetterService(id: string): Promise<void> {
  if (!useApi) return void deleteLocalLetter(id)
  await http<void>(`/api/letters/${id}`, { method: 'DELETE' })
}


