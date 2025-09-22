export interface Employee {
  id: string;
  nip: string;
  nama: string;
  golongan: string;
  tmtPensiun: string;
  unitKerja: string;
  status: 'eligible' | 'pending' | 'processed';
  jabatan?: string;
  tanggalLahir?: string;
  tanggalMulaiKerja?: string;
  masaKerjaTahun?: number;
  masaKerjaBulan?: number;
}

// Mock data removed - now using real API data
export const mockEmployees: Employee[] = [];

export const golonganOptions = ['Semua Golongan', 'III/a', 'III/b', 'III/c', 'III/d', 'IV/a', 'IV/b', 'IV/c', 'IV/d'];
export const unitKerjaOptions = ['Semua Unit Kerja', 'Dinas Pendidikan', 'SMAN 1 Jakarta', 'Dinas PU', 'Bagian Keuangan', 'Bagian Hukum', 'SMPN 5 Jakarta'];
export const statusOptions = ['Semua Status', 'eligible', 'pending', 'processed'];