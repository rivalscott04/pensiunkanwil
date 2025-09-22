# Nginx Configuration untuk Backend Domain

## 🎯 Opsi 1: Subdomain Terpisah (Recommended)

### Frontend (supensi.rivaldev.site)
```nginx
server {
    listen 80;
    listen 443 ssl;
    server_name supensi.rivaldev.site;
    
    root /var/www/supensi.rivaldev.site;
    index index.html;
    
    # SSL Configuration
    ssl_certificate /path/to/ssl/supensi.rivaldev.site.crt;
    ssl_certificate_key /path/to/ssl/supensi.rivaldev.site.key;
    
    # SPA routing - semua route fallback ke index.html
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Static files caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### Backend API (api.supensi.rivaldev.site)
```nginx
server {
    listen 80;
    listen 443 ssl;
    server_name api.supensi.rivaldev.site;
    
    # SSL Configuration
    ssl_certificate /path/to/ssl/api.supensi.rivaldev.site.crt;
    ssl_certificate_key /path/to/ssl/api.supensi.rivaldev.site.key;
    
    # Laravel backend
    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;
    }
}
```

## 🎯 Opsi 2: Path-based (Current Setup)

### Single Domain (supensi.rivaldev.site)
```nginx
server {
    listen 80;
    listen 443 ssl;
    server_name supensi.rivaldev.site;
    
    root /var/www/supensi.rivaldev.site;
    index index.html;
    
    # SSL Configuration
    ssl_certificate /path/to/ssl/supensi.rivaldev.site.crt;
    ssl_certificate_key /path/to/ssl/supensi.rivaldev.site.key;
    
    # API routes - proxy ke Laravel backend
    location /api {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;
        
        # CORS headers (jika diperlukan)
        add_header Access-Control-Allow-Origin *;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
        add_header Access-Control-Allow-Headers "Authorization, Content-Type, X-Requested-With";
        
        # Handle preflight requests
        if ($request_method = 'OPTIONS') {
            add_header Access-Control-Allow-Origin *;
            add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
            add_header Access-Control-Allow-Headers "Authorization, Content-Type, X-Requested-With";
            add_header Access-Control-Max-Age 1728000;
            add_header Content-Type 'text/plain charset=UTF-8';
            add_header Content-Length 0;
            return 204;
        }
    }
    
    # SPA routing - semua route fallback ke index.html
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Static files caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

## 🔧 SSL Certificate Setup

### Untuk Subdomain (Opsi 1)
```bash
# Generate SSL certificate untuk subdomain
sudo certbot --nginx -d supensi.rivaldev.site -d api.supensi.rivaldev.site
```

### Untuk Single Domain (Opsi 2)
```bash
# Generate SSL certificate untuk single domain
sudo certbot --nginx -d supensi.rivaldev.site
```

## 🚀 Deployment Steps

### Opsi 1: Subdomain
1. **Setup DNS**: Tambahkan A record untuk `api.supensi.rivaldev.site`
2. **SSL Certificate**: Generate untuk kedua domain
3. **Nginx Config**: Gunakan konfigurasi subdomain
4. **Frontend Build**: `npm run build:production` (sudah dikonfigurasi)

### Opsi 2: Path-based
1. **SSL Certificate**: Generate untuk single domain
2. **Nginx Config**: Gunakan konfigurasi path-based
3. **Frontend Build**: Update ke path-based
4. **Laravel Routes**: Pastikan semua route ada di `/api/*`

## 🧪 Testing

### Test API Endpoints
```bash
# Opsi 1: Subdomain
curl -X POST https://api.supensi.rivaldev.site/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"adminkanwil@kemenag.go.id","password":"password"}'

# Opsi 2: Path-based
curl -X POST https://supensi.rivaldev.site/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"adminkanwil@kemenag.go.id","password":"password"}'
```

## 🔄 Switch Between Options

### Switch ke Path-based (Opsi 2)
```typescript
// Di src/lib/config.ts
if (hostname === 'supensi.rivaldev.site') {
  return 'https://supensi.rivaldev.site';
}
```

```bash
# Build script
npm run build:production:path
```

### Switch ke Subdomain (Opsi 1)
```typescript
// Di src/lib/config.ts
if (hostname === 'supensi.rivaldev.site') {
  return 'https://api.supensi.rivaldev.site';
}
```

```bash
# Build script
npm run build:production
```

## 📝 Recommendation

**Gunakan Opsi 1 (Subdomain)** karena:
- ✅ Lebih clean dan professional
- ✅ Mudah untuk scaling
- ✅ Separation of concerns
- ✅ Lebih mudah untuk monitoring
- ✅ Tidak ada konflik dengan SPA routing
