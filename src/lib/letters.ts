export type StoredLetter = {
  id: string
  nomorSurat: string
  tanggalSurat: string
  namaPegawai: string
  nipPegawai?: string
  posisiPegawai?: string
  unitPegawai?: string
  namaPenandatangan: string
  nipPenandatangan?: string
  jabatanPenandatangan?: string
  signaturePlace: string
  signatureDateInput: string // yyyy-mm-dd
  signatureMode: "manual" | "tte"
  signatureAnchor: "^" | "$" | "#"
}

const STORAGE_KEY = "pensiun_flow_letters_v1"

function readAll(): StoredLetter[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as StoredLetter[]) : []
  } catch {
    return []
  }
}

function writeAll(data: StoredLetter[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function getLetters(): StoredLetter[] {
  return readAll()
}

export function getLetter(id: string): StoredLetter | undefined {
  return readAll().find((l) => l.id === id)
}

export function saveLetter(letter: StoredLetter) {
  const all = readAll()
  const idx = all.findIndex((l) => l.id === letter.id)
  if (idx >= 0) {
    all[idx] = letter
  } else {
    all.unshift(letter)
  }
  writeAll(all)
}

export function deleteLetter(id: string) {
  const all = readAll().filter((l) => l.id !== id)
  writeAll(all)
}


