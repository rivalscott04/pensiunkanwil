# Environment Configuration

Aplikasi ini mendukung konfigurasi environment yang dinamis untuk berbagai skenario deployment.

## 🚀 Cara Penggunaan

### 1. Development Mode (Otomatis)
```bash
npm run dev
```
- Aplikasi akan otomatis mendeteksi hostname
- Jika akses dari `localhost` → backend `http://localhost:8000`
- Jika akses dari IP network → backend `http://[IP]:8000`

### 2. Network Mode (Eksplisit)
```bash
npm run dev:network
```
- Memaksa menggunakan backend di `http://192.168.110.28:8000`
- Cocok untuk testing dari komputer lain di jaringan

### 3. Local Mode (Eksplisit)
```bash
npm run dev:local
```
- Memaksa menggunakan backend di `http://localhost:8000`
- Cocok untuk development lokal

## 🏗️ Build Commands

### Production Build
```bash
npm run build
```

### Network Build
```bash
npm run build:network
```

### Local Build
```bash
npm run build:local
```

## 🔧 Environment Variables

### VITE_API_BASE_URL
- **Default**: Otomatis berdasarkan hostname
- **Override**: Set manual untuk environment tertentu

### Contoh Penggunaan
```bash
# Set manual untuk environment tertentu
VITE_API_BASE_URL=http://192.168.1.100:8000 npm run dev

# Atau gunakan script yang sudah disediakan
npm run dev:network
```

## 🌐 Network Configuration

### Backend Laravel
Pastikan backend Laravel berjalan dengan:
```bash
cd pensiun-flow-backend
php artisan serve --host=0.0.0.0 --port=8000
```

### CORS Configuration
Backend sudah dikonfigurasi untuk menerima request dari:
- `http://localhost:8080`
- `http://127.0.0.1:8080`
- `http://192.168.*.*:8080` (semua IP di range 192.168.x.x)

### Sanctum Configuration
Backend sudah dikonfigurasi untuk stateful domains:
- `localhost:8080`
- `127.0.0.1:8080`
- `192.168.110.28:8080`

## 🐛 Troubleshooting

### Connection Refused
1. Pastikan backend Laravel berjalan dengan `--host=0.0.0.0`
2. Cek Windows Firewall untuk port 8000
3. Pastikan kedua komputer dalam subnet yang sama

### CORS Error
1. Pastikan IP frontend ada di `config/cors.php`
2. Restart backend Laravel setelah perubahan CORS
3. Clear browser cache

### Authentication Error
1. Pastikan IP frontend ada di `config/sanctum.php`
2. Cek apakah user sudah ada di database
3. Pastikan password benar

## 📝 Logs

Aplikasi akan menampilkan log konfigurasi di console browser (development mode):
```
🔧 API Configuration: {
  hostname: "192.168.110.28",
  apiBaseUrl: "http://192.168.110.28:8000",
  viteApiBaseUrl: undefined,
  mode: "development"
}
```
