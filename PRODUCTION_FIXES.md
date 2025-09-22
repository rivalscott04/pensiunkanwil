# Production Fixes - supensi.rivaldev.site

## 🐛 Masalah yang Ditemukan dan Diperbaiki

### 1. Error 405 (Not Allowed) pada Login
**Masalah**: API call ke `/api/auth/login` mengembalikan error 405
**Penyebab**: Duplikasi `/api` dalam URL
- `VITE_API_BASE_URL` sudah diset ke `https://supensi.rivaldev.site/api`
- Tapi kode masih menambahkan `/api/auth/login`
- Hasil: `https://supensi.rivaldev.site/api/api/auth/login` ❌

**Solusi**: 
- Update `Login.tsx` untuk menggunakan `API_BASE_URL` dari config
- Pastikan semua API calls menggunakan `API_BASE_URL` yang sudah dikonfigurasi

### 2. Fallback ke 404
**Masalah**: Aplikasi fallback ke 404 untuk semua route
**Penyebab**: Konfigurasi API URL yang salah menyebabkan routing gagal

**Solusi**: 
- Perbaiki konfigurasi API URL
- Pastikan SPA routing berjalan dengan benar

## ✅ Perbaikan yang Dilakukan

### 1. Update Login.tsx
```typescript
// Sebelum (❌)
const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/api/auth/login`, {

// Sesudah (✅)
const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
```

### 2. Update config.ts
```typescript
// Sebelum (❌)
if (hostname === 'supensi.rivaldev.site') {
  return 'https://supensi.rivaldev.site/api';
}

// Sesudah (✅)
if (hostname === 'supensi.rivaldev.site') {
  return 'https://supensi.rivaldev.site';
}
```

### 3. Re-export API_BASE_URL
```typescript
// Di api.ts
import { API_BASE_URL } from './config';
export { API_BASE_URL }; // Untuk backward compatibility
```

## 🚀 Build Commands

### Production Build
```bash
npm run build:production
```
- Menggunakan `VITE_API_BASE_URL=https://supensi.rivaldev.site/api`
- Semua API calls akan menggunakan URL yang benar

### Test Build
```bash
npm run preview
```
- Test production build secara lokal

## 🔧 Konfigurasi VPS

### Nginx Configuration
```nginx
server {
    listen 80;
    listen 443 ssl;
    server_name supensi.rivaldev.site;
    
    root /var/www/supensi.rivaldev.site;
    index index.html;
    
    # SPA routing - semua route fallback ke index.html
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # API proxy ke Laravel backend
    location /api {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Laravel Backend
```bash
# Pastikan backend berjalan di port 8000
php artisan serve --host=0.0.0.0 --port=8000

# Atau dengan PM2
pm2 start ecosystem.config.js
```

## 🧪 Testing

### 1. Test API Endpoints
```bash
# Test login endpoint
curl -X POST https://supensi.rivaldev.site/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"adminkanwil@kemenag.go.id","password":"password"}'
```

### 2. Test Frontend Routing
- Akses `https://supensi.rivaldev.site/login`
- Akses `https://supensi.rivaldev.site/dashboard`
- Semua route harus berfungsi tanpa 404

### 3. Test CORS
- Pastikan tidak ada CORS error di browser console
- API calls harus berhasil dari frontend

## 📝 Checklist Deployment

- [ ] Build production dengan `npm run build:production`
- [ ] Upload `dist/` folder ke VPS
- [ ] Konfigurasi Nginx dengan SPA routing
- [ ] Pastikan Laravel backend berjalan di port 8000
- [ ] Test login functionality
- [ ] Test semua route frontend
- [ ] Cek browser console untuk error

## 🐛 Troubleshooting

### Masih Error 405?
1. Cek apakah backend Laravel berjalan
2. Cek apakah route `/api/auth/login` ada di Laravel
3. Cek CORS configuration

### Masih 404?
1. Cek Nginx configuration untuk SPA routing
2. Pastikan `try_files $uri $uri/ /index.html;` ada
3. Restart Nginx: `sudo systemctl restart nginx`

### CORS Error?
1. Cek `config/cors.php` di Laravel
2. Pastikan domain ada di `allowed_origins`
3. Clear cache: `php artisan config:clear`
