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
  }
}

export async function listLetters(): Promise<StoredLetter[]> {
  if (!useApi) return getLocalLetters()
  // Request non-paginated list for simplicity
  const items = await http<any[]>(`/api/letters?paginate=0`)
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


