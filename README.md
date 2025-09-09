## Pensiun Flow

Aplikasi manajemen proses pengajuan pensiun untuk instansi (Kemenag). Frontend berbasis React + Vite, backend berbasis Laravel 12 + Sanctum. Mendukung sinkronisasi data pegawai, alur pengajuan bertahap, unggah dokumen, pembuatan surat otomatis dari template HTML, serta log aktivitas dan impersonasi admin.

### ✨ Fitur Utama
- **Autentikasi & Session**: Login JWT via Sanctum, penyimpanan token aman, auto attach Authorization header.
- **Dashboard**: Statistik pengajuan (total, status, bulanan/tahunan) dan status sinkronisasi.
- **Manajemen Pegawai**: Penelusuran, filter, dan statistik data pegawai pensiun.
- **Pengajuan Pensiun**: Buat, simpan draf, kirim, review, setujui/tolak; unggah berkas pendukung.
- **Generator Surat**: Buat SPTJM, surat pengantar penyematan gelar, dan keterangan meninggal dari template HTML:
  - `sptjm_template.html`
  - `template_pengantar_penyematan_gelar.html`
  - `surat_keterangan_meninggal.html`
  - `kemenag_document_template.html`
- **Log Aktivitas**: Pelacakan aksi penting oleh pengguna.
- **Impersonasi Admin**: Admin dapat masuk sebagai pengguna lain untuk membantu troubleshooting.

### 🧱 Teknologi
- **Frontend**: React 18, Vite 5, TypeScript, TailwindCSS, Radix UI, shadcn/ui, TanStack Query, Zod, React Router.
- **Backend**: Laravel 12 (PHP 8.2+), Sanctum, Queue, Jobs, Seeder, Migration.
- **Database**: MySQL/MariaDB atau SQLite (sesuai konfigurasi `.env`).

### 🔧 Prasyarat
- Node.js 18+ dan npm 9+ (Windows disarankan PowerShell 7).
- PHP 8.2+, Composer 2.x.
- MySQL/MariaDB (atau SQLite) terpasang dan berjalan.

### 📦 Struktur Proyek Singkat
- `src/` — Frontend React (Vite).
- `pensiun-flow-backend/` — Backend Laravel.
- `public/` — Aset publik frontend.
- File template surat HTML berada di root proyek.

### ⚙️ Variabel Lingkungan
- Frontend mengambil URL backend dari `VITE_API_BASE_URL`.
  - File contoh tersedia: `.env.development`, `.env.production` (root proyek).
  - Endpoint yang diakses frontend menggunakan `API_BASE_URL` dari `src/lib/api.ts`.

Contoh `.env` frontend (root):
```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

Contoh `.env` backend (`pensiun-flow-backend/.env`):
```env
APP_KEY=base64:... # akan digenerate otomatis
APP_URL=http://127.0.0.1:8000

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=pensiun_flow
DB_USERNAME=root
DB_PASSWORD=
```

### 🚀 Menjalankan (Pengembangan)
Semua perintah di bawah ini menggunakan PowerShell (Windows).

1) Backend (Laravel)
```powershell
cd pensiun-flow-backend
copy .env.example .env
composer install
php artisan key:generate
php artisan migrate --seed
php artisan serve
```
Backend akan berjalan di `http://127.0.0.1:8000` secara default.

2) Frontend (React)
```powershell
cd ..
copy .env.development .env
npm install
npm run dev
```
Frontend akan berjalan di `http://127.0.0.1:5173` (atau port yang tersedia).

### 🛠️ Skrip Penting
- Frontend (root):
  - `npm run dev` — Menjalankan Vite dev server.
  - `npm run build` — Build produksi frontend.
  - `npm run preview` — Pratinjau hasil build.
  - `npm run lint` — Cek linting.
- Backend (`pensiun-flow-backend`):
  - `composer run dev` — Menjalankan server, queue listener, log, dan Vite secara terintegrasi (butuh Node/npm di folder backend jika digunakan skema vite Laravel). Jika memakai frontend terpisah di root, jalankan server secara terpisah seperti di atas.
  - `php artisan test` — Menjalankan test.

### 🔐 Catatan Autentikasi & Header
Frontend otomatis menambahkan header `Authorization: Bearer <token>` jika token tersimpan. Lihat `src/lib/api.ts` untuk utilitas `getAuthHeaders`, `fetchJson`, dan endpoint seperti `api/auth/me`, `api/auth/logout`, `api/auth/impersonate`.

### 📄 Pembuatan Surat
- Halaman generator surat memanfaatkan template HTML di root. Template dirender dengan data dari backend, lalu dapat diunduh/cetak.
- Pastikan data pengajuan/pegawai lengkap sebelum menghasilkan surat.

### 🔄 Sinkronisasi Data Pegawai
- Job sinkronisasi (`app/Jobs/SyncEmployeesJob.php`) dan endpoint terkait mengelola status sinkronisasi. Lihat halaman Dashboard untuk status terakhir.

### 🧪 Pengujian
Backend:
```powershell
cd pensiun-flow-backend
php artisan test
```

### 🧰 Build Produksi
- Build Frontend:
```powershell
npm run build
```
Hasil build berada di `dist/`. Deploy statis sesuai kebutuhan (Nginx/Apache) dan arahkan API ke backend.

- Backend Laravel:
```powershell
cd pensiun-flow-backend
php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan view:cache
```
Jalankan queue worker jika ada proses antrian:
```powershell
php artisan queue:work --queue=default
```

### ❓ Troubleshooting Cepat
- **403/419 saat API**: Cek `VITE_API_BASE_URL` dan CORS (`pensiun-flow-backend/config/cors.php`).
- **Token tidak terbaca**: Pastikan login menghasilkan `auth_token` di `localStorage` dan domain/port sama dengan konfigurasi CORS.
- **Gagal migrasi**: Periksa kredensial database dan hak akses.

### 📄 Lisensi
MIT (kecuali dinyatakan lain pada file tertentu).
