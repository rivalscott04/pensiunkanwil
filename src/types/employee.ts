export interface Employee {
  id: string;
  nip: string;
  nama: string;
  golongan: string;
  tmtPensiun: string;
  unitKerja: string;
  status: 'eligible' | 'pending' | 'processed';
}

export const mockEmployees: Employee[] = [
  {
    id: '1',
    nip: '197001011991031001',
    nama: 'Drs. Ahmad Santoso, M.Pd',
    golongan: 'IV/a',
    tmtPensiun: '2024-01-01',
    unitKerja: 'Dinas Pendidikan',
    status: 'eligible'
  },
  {
    id: '2',
    nip: '197105152000032002',
    nama: 'Dr. Siti Nurhaliza, S.Pd, M.Pd',
    golongan: 'IV/b',
    tmtPensiun: '2024-05-15',
    unitKerja: 'SMAN 1 Jakarta',
    status: 'eligible'
  },
  {
    id: '3',
    nip: '196812101990031003',
    nama: 'Ir. Bambang Wijaya, MT',
    golongan: 'IV/a',
    tmtPensiun: '2024-12-10',
    unitKerja: 'Dinas PU',
    status: 'eligible'
  },
  {
    id: '4',
    nip: '197203201995032004',
    nama: 'Dra. Indira Sari, M.M',
    golongan: 'III/d',
    tmtPensiun: '2025-03-20',
    unitKerja: 'Bagian Keuangan',
    status: 'pending'
  },
  {
    id: '5',
    nip: '197708081999031005',
    nama: 'H. Muhammad Rizki, S.H',
    golongan: 'III/c',
    tmtPensiun: '2024-08-08',
    unitKerja: 'Bagian Hukum',
    status: 'eligible'
  },
  {
    id: '6',
    nip: '196905051994032006',
    nama: 'Dra. Kartini Dewi, M.Pd',
    golongan: 'IV/a',
    tmtPensiun: '2024-05-05',
    unitKerja: 'SMPN 5 Jakarta',
    status: 'processed'
  }
];

export const golonganOptions = ['Semua Golongan', 'III/a', 'III/b', 'III/c', 'III/d', 'IV/a', 'IV/b', 'IV/c', 'IV/d'];
export const unitKerjaOptions = ['Semua Unit Kerja', 'Dinas Pendidikan', 'SMAN 1 Jakarta', 'Dinas PU', 'Bagian Keuangan', 'Bagian Hukum', 'SMPN 5 Jakarta'];
export const statusOptions = ['Semua Status', 'eligible', 'pending', 'processed'];