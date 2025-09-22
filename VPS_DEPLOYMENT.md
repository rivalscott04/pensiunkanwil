# VPS Deployment Guide - supensi.rivaldev.site

Panduan lengkap untuk deployment aplikasi Pensiun Flow di VPS dengan domain `supensi.rivaldev.site`.

## 🚀 Frontend Deployment

### 1. Build Production
```bash
# Build untuk production
npm run build:production

# Atau build otomatis (akan detect domain)
npm run build
```

### 2. Upload ke VPS
```bash
# Upload folder dist/ ke VPS
# Contoh dengan scp:
scp -r dist/* user@your-vps:/var/www/supensi.rivaldev.site/

# Atau dengan rsync:
rsync -avz dist/ user@your-vps:/var/www/supensi.rivaldev.site/
```

### 3. Web Server Configuration (Nginx)
```nginx
server {
    listen 80;
    listen 443 ssl;
    server_name supensi.rivaldev.site;
    
    root /var/www/supensi.rivaldev.site;
    index index.html;
    
    # SSL Configuration (jika menggunakan SSL)
    ssl_certificate /path/to/ssl/cert.pem;
    ssl_certificate_key /path/to/ssl/private.key;
    
    # Frontend routing
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
    
    # Static files caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

## 🔧 Backend Laravel Deployment

### 1. Upload Backend ke VPS
```bash
# Upload backend Laravel
scp -r pensiun-flow-backend/* user@your-vps:/var/www/supensi-backend/
```

### 2. Environment Configuration
Buat file `.env` di VPS:
```env
APP_NAME="Pensiun Flow"
APP_ENV=production
APP_KEY=base64:your-generated-key
APP_DEBUG=false
APP_URL=https://supensi.rivaldev.site

LOG_CHANNEL=stack
LOG_LEVEL=error

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=pensiun_flow
DB_USERNAME=your_db_user
DB_PASSWORD=your_db_password

BROADCAST_DRIVER=log
CACHE_DRIVER=file
FILESYSTEM_DISK=local
QUEUE_CONNECTION=sync
SESSION_DRIVER=file
SESSION_LIFETIME=120

# Sanctum configuration
SANCTUM_STATEFUL_DOMAINS=supensi.rivaldev.site,localhost,127.0.0.1

# Mail configuration (sesuaikan dengan provider)
MAIL_MAILER=smtp
MAIL_HOST=your-smtp-host
MAIL_PORT=587
MAIL_USERNAME=your-email
MAIL_PASSWORD=your-password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS="noreply@rivaldev.site"
MAIL_FROM_NAME="${APP_NAME}"
```

### 3. Laravel Setup Commands
```bash
# Di VPS, jalankan:
cd /var/www/supensi-backend

# Install dependencies
composer install --optimize-autoloader --no-dev

# Generate app key
php artisan key:generate

# Run migrations
php artisan migrate --force

# Seed database
php artisan db:seed

# Clear and cache config
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Set permissions
chown -R www-data:www-data storage bootstrap/cache
chmod -R 775 storage bootstrap/cache
```

### 4. Process Manager (PM2 atau Supervisor)
```bash
# Install PM2
npm install -g pm2

# Create ecosystem file
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'pensiun-flow-api',
    script: 'artisan',
    args: 'serve --host=0.0.0.0 --port=8000',
    cwd: '/var/www/supensi-backend',
    interpreter: 'php',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production'
    }
  }]
}
EOF

# Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## 🔒 SSL Certificate (Let's Encrypt)
```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d supensi.rivaldev.site

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

## 🗄️ Database Setup
```sql
-- Create database
CREATE DATABASE pensiun_flow CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create user
CREATE USER 'pensiun_user'@'localhost' IDENTIFIED BY 'secure_password';
GRANT ALL PRIVILEGES ON pensiun_flow.* TO 'pensiun_user'@'localhost';
FLUSH PRIVILEGES;
```

## 🔧 Konfigurasi Khusus untuk VPS

### 1. CORS Configuration
Backend sudah dikonfigurasi untuk menerima request dari:
- `https://supensi.rivaldev.site`
- `http://supensi.rivaldev.site`
- Pattern: `*.rivaldev.site`

### 2. Sanctum Configuration
Backend sudah dikonfigurasi untuk stateful domains:
- `supensi.rivaldev.site`

### 3. File Permissions
```bash
# Set proper permissions
sudo chown -R www-data:www-data /var/www/supensi-backend
sudo chmod -R 755 /var/www/supensi-backend
sudo chmod -R 775 /var/www/supensi-backend/storage
sudo chmod -R 775 /var/www/supensi-backend/bootstrap/cache
```

## 🚀 Deployment Script
Buat script deployment otomatis:

```bash
#!/bin/bash
# deploy.sh

echo "🚀 Starting deployment..."

# Build frontend
echo "📦 Building frontend..."
npm run build:production

# Upload frontend
echo "📤 Uploading frontend..."
rsync -avz dist/ user@your-vps:/var/www/supensi.rivaldev.site/

# Upload backend
echo "📤 Uploading backend..."
rsync -avz pensiun-flow-backend/ user@your-vps:/var/www/supensi-backend/

# Run backend commands
echo "🔧 Setting up backend..."
ssh user@your-vps << 'EOF'
cd /var/www/supensi-backend
composer install --optimize-autoloader --no-dev
php artisan config:cache
php artisan route:cache
php artisan view:cache
pm2 restart pensiun-flow-api
EOF

echo "✅ Deployment completed!"
```

## 🐛 Troubleshooting

### CORS Issues
```bash
# Clear Laravel cache
php artisan config:clear
php artisan cache:clear
```

### SSL Issues
```bash
# Check SSL certificate
sudo certbot certificates

# Renew certificate
sudo certbot renew
```

### Database Issues
```bash
# Check database connection
php artisan tinker
# Then: DB::connection()->getPdo();
```

### File Permission Issues
```bash
# Fix permissions
sudo chown -R www-data:www-data /var/www/supensi-backend
sudo chmod -R 775 /var/www/supensi-backend/storage
```

## 📝 Environment Variables Summary

### Frontend (.env.production)
```env
VITE_API_BASE_URL=https://supensi.rivaldev.site/api
```

### Backend (.env)
```env
APP_URL=https://supensi.rivaldev.site
SANCTUM_STATEFUL_DOMAINS=supensi.rivaldev.site
```

## 🔄 Update Process
```bash
# 1. Build frontend
npm run build:production

# 2. Upload files
rsync -avz dist/ user@your-vps:/var/www/supensi.rivaldev.site/

# 3. Update backend (jika ada perubahan)
rsync -avz pensiun-flow-backend/ user@your-vps:/var/www/supensi-backend/

# 4. Restart services
ssh user@your-vps "cd /var/www/supensi-backend && php artisan config:cache && pm2 restart pensiun-flow-api"
```
