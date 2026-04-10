# Production Readiness Checklist

## ✅ Konfigurasi Infrastructure

### Docker & Compose
- [x] Docker Compose file sudah dibuat
- [x] Nginx reverse proxy dikonfigurasi
- [x] Health checks untuk PostgreSQL
- [x] Volume persistence untuk database dan uploads
- [x] Environment variables untuk konfigurasi

### Nginx Configuration
- [x] Gzip compression enabled
- [x] Cache headers untuk static assets
- [x] Proxy buffering configured
- [x] Keepalive connections
- [ ] SSL/HTTPS configuration (perlu setup certificate)

## ✅ Backend Configuration

### Environment Variables
- [x] Database connection via env vars
- [x] JWT secret key via env vars
- [x] WhatsApp API key via env vars
- [x] Mikrotik config dihapus (tidak digunakan lagi)

### Security
- [x] CORS configured untuk production domains
- [x] Rate limiting middleware
- [x] JWT authentication
- [ ] Review dan update JWT_SECRET_KEY untuk production
- [ ] Review database password strength

## ✅ Frontend Configuration

### API Integration
- [x] Relative API path (`/api/v1`)
- [x] Single source STORAGE_URL
- [x] Consolidated downloadBlob helper
- [x] All services menggunakan downloadBlob

### Performance
- [x] Next.js standalone build
- [x] Static asset optimization
- [x] Image optimization ready

## ⚠️ Yang Perlu Dilakukan Sebelum Production

### 1. Security Hardening
```bash
# Generate strong JWT secret (minimal 64 karakter)
openssl rand -hex 32

# Update di .env
JWT_SECRET_KEY=<generated-secret>

# Generate strong database password
openssl rand -base64 24
POSTGRES_PASSWORD=<generated-password>
```

### 2. SSL/HTTPS Setup
- Setup SSL certificate (Let's Encrypt recommended)
- Update nginx config untuk HTTPS
- Redirect HTTP ke HTTPS
- Update CORS origins jika perlu

### 3. Database Backup
- Setup automated backup untuk volume `postgres_data`
- Test restore procedure
- Document backup retention policy

### 4. Monitoring & Logging
- Setup log rotation
- Configure monitoring (optional: Prometheus/Grafana)
- Setup alerting untuk critical errors

### 5. Resource Limits
- Update docker-compose.yml dengan resource limits
- Monitor memory dan CPU usage
- Setup auto-restart policies

### 6. Environment Variables
- Pastikan `.env` tidak ter-commit ke git
- Setup `.env` di production server
- Document semua required env vars

## 📋 Pre-Deployment Checklist

- [ ] Review dan update semua passwords/secrets
- [ ] Test build lokal: `docker-compose build`
- [ ] Test run lokal: `docker-compose up`
- [ ] Verify semua endpoints bekerja
- [ ] Test login flow
- [ ] Test file upload/download
- [ ] Verify database migrations
- [ ] Setup SSL certificate
- [ ] Configure firewall rules
- [ ] Setup database backups
- [ ] Test restore procedure
- [ ] Document deployment process
- [ ] Setup monitoring
- [ ] Review error logs

## 🚀 Deployment Steps

1. **Prepare Server**
   ```bash
   # Install Docker & Docker Compose
   sudo apt update
   sudo apt install docker.io docker-compose
   
   # Clone repository
   git clone <repo-url>
   cd banikarimmekarjaya
   ```

2. **Setup Environment**
   ```bash
   # Copy dan edit .env
   cp .env.example .env
   nano .env  # Update dengan production values
   ```

3. **Build & Deploy**
   ```bash
   # Build images
   docker-compose build
   
   # Start services
   docker-compose up -d
   
   # Check logs
   docker-compose logs -f
   ```

4. **Verify**
   ```bash
   # Check all services running
   docker-compose ps
   
   # Test endpoints
   curl http://localhost/api/v1/auth/setup-check
   curl http://localhost/
   ```

5. **Setup SSL (Optional)**
   ```bash
   # Install certbot
   sudo apt install certbot python3-certbot-nginx
   
   # Get certificate
   sudo certbot --nginx -d yourdomain.com
   ```

## 🔧 Maintenance

### Regular Tasks
- Monitor logs: `docker-compose logs -f`
- Check disk space: `docker system df`
- Backup database: `docker-compose exec postgres pg_dump -U postgres new_ykp_system > backup.sql`
- Update images: `docker-compose pull && docker-compose up -d`

### Troubleshooting
- View logs: `docker-compose logs [service-name]`
- Restart service: `docker-compose restart [service-name]`
- Rebuild: `docker-compose build --no-cache [service-name]`
- Clean up: `docker-compose down -v` (HATI-HATI: hapus volumes!)
