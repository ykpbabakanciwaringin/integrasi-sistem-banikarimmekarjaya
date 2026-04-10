# Deployment Guide

## Quick Start

```bash
# 1. Clone repository
git clone <repo-url>
cd banikarimmekarjaya

# 2. Setup environment
cp .env.example .env
nano .env  # Edit dengan production values

# 3. Build dan deploy
docker-compose build
docker-compose up -d

# 4. Check status
docker-compose ps
docker-compose logs -f
```

## Environment Variables

Pastikan file `.env` berisi:

```bash
# Database
POSTGRES_USER=postgres
POSTGRES_PASSWORD=<strong-password>
POSTGRES_DB=new_ykp_system

# JWT (GENERATE BARU untuk production!)
JWT_SECRET_KEY=<generate-dengan-openssl-rand-hex-32>
JWT_EXPIRATION_HOURS=24

# WhatsApp (optional)
WHATSAPP_API_KEY=<your-api-key>
```

## SSL/HTTPS Setup

### Menggunakan Let's Encrypt (Recommended)

```bash
# 1. Install certbot
sudo apt install certbot python3-certbot-nginx

# 2. Stop nginx container sementara
docker-compose stop nginx

# 3. Get certificate
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# 4. Copy certificate ke nginx/ssl
sudo mkdir -p nginx/ssl
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem nginx/ssl/
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem nginx/ssl/
sudo chmod 644 nginx/ssl/*.pem

# 5. Update nginx.conf dengan SSL config (lihat nginx-ssl.conf.example)

# 6. Restart nginx
docker-compose up -d nginx

# 7. Setup auto-renewal
sudo crontab -e
# Tambahkan:
0 0 * * * certbot renew --quiet && docker-compose restart nginx
```

## Database Backup

### Manual Backup
```bash
./scripts/backup-db.sh
```

### Automated Backup (Cron)
```bash
# Edit crontab
crontab -e

# Tambahkan (backup setiap hari jam 2 pagi)
0 2 * * * cd /var/www/banikarimmekarjaya && ./scripts/backup-db.sh
```

### Restore Database
```bash
./scripts/restore-db.sh backups/backup_new_ykp_system_20260221_020000.sql.gz
```

## Monitoring

### Check Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f nginx
docker-compose logs -f postgres
```

### Check Resource Usage
```bash
# Container stats
docker stats

# Disk usage
docker system df

# Volume usage
docker volume ls
docker volume inspect banikarimmekarjaya_postgres_data
```

### Health Checks
```bash
# API health
curl http://localhost/api/v1/auth/setup-check

# Frontend
curl http://localhost/

# Database
docker-compose exec postgres pg_isready -U postgres
```

## Maintenance

### Update Application
```bash
# Pull latest code
git pull

# Rebuild images
docker-compose build

# Restart services
docker-compose up -d

# Check logs
docker-compose logs -f
```

### Clean Up
```bash
# Remove unused images
docker image prune -a

# Remove unused volumes (HATI-HATI!)
docker volume prune

# Full cleanup (HATI-HATI: hapus semua!)
docker system prune -a --volumes
```

## Troubleshooting

### Service tidak start
```bash
# Check logs
docker-compose logs [service-name]

# Check container status
docker-compose ps

# Restart service
docker-compose restart [service-name]
```

### Database connection error
```bash
# Check postgres logs
docker-compose logs postgres

# Test connection
docker-compose exec postgres psql -U postgres -d new_ykp_system

# Check network
docker-compose exec backend ping postgres
```

### Frontend tidak load
```bash
# Check build
docker-compose logs frontend

# Rebuild frontend
docker-compose build --no-cache frontend
docker-compose up -d frontend
```

### Nginx error
```bash
# Test config
docker-compose exec nginx nginx -t

# Reload config
docker-compose exec nginx nginx -s reload

# Check logs
docker-compose logs nginx
```

## Security Checklist

- [ ] JWT_SECRET_KEY sudah diganti dengan random string kuat
- [ ] POSTGRES_PASSWORD sudah diganti dengan password kuat
- [ ] SSL/HTTPS sudah dikonfigurasi
- [ ] Firewall rules sudah dikonfigurasi (hanya port 80, 443 terbuka)
- [ ] Database port (5432) tidak exposed ke public
- [ ] .env file tidak ter-commit ke git
- [ ] Regular security updates untuk Docker images
- [ ] Backup database dilakukan secara rutin
- [ ] Logs di-monitor untuk suspicious activity

## Performance Optimization

### Database
- Monitor query performance
- Setup indexes jika perlu
- Regular VACUUM dan ANALYZE

### Nginx
- Monitor cache hit rate
- Adjust buffer sizes jika perlu
- Enable HTTP/2 (sudah ada di SSL config)

### Application
- Monitor memory usage
- Adjust resource limits di docker-compose.yml jika perlu
- Setup CDN untuk static assets (optional)
