# Changelog

## [Production Ready] - 2026-02-21

### ✨ New Features
- Docker Compose setup untuk development dan production
- Nginx reverse proxy dengan gzip compression dan caching
- Environment variable override untuk backend configuration
- Relative API paths untuk single-domain deployment
- Consolidated download helper (`downloadBlob`)
- Database backup & restore scripts
- Production-ready resource limits dan restart policies

### 🔧 Improvements
- Frontend menggunakan relative path `/api/v1` untuk konsistensi
- Single source `STORAGE_URL` untuk uploads
- Semua services menggunakan `downloadBlob()` helper
- Backend config dapat di-override via environment variables
- Resource limits untuk semua containers
- Auto-restart policies untuk high availability

### 🗑️ Removed
- Semua fungsi manajemen WiFi/Mikrotik dihapus permanen
- Konfigurasi Mikrotik dari semua file config
- Dependencies terkait Mikrotik

### 📝 Documentation
- Production checklist (`PRODUCTION-CHECKLIST.md`)
- Deployment guide (`DEPLOYMENT.md`)
- Docker guide (`README-DOCKER.md`)
- Main README dengan quick start

### 🔐 Security
- `.gitignore` untuk mencegah commit secrets
- Environment variables untuk sensitive data
- SSL/HTTPS configuration example
- Security headers di nginx config

### 📦 Infrastructure
- Docker Compose dengan health checks
- Volume persistence untuk database dan uploads
- Nginx dengan gzip dan cache headers
- Resource limits untuk semua services

## Pre-Production Checklist

Sebelum deploy ke production, pastikan:

1. ✅ Generate JWT_SECRET_KEY baru (minimal 64 karakter)
2. ✅ Generate POSTGRES_PASSWORD baru yang kuat
3. ✅ Setup SSL certificate (Let's Encrypt recommended)
4. ✅ Update nginx config dengan SSL (lihat `nginx-ssl.conf.example`)
5. ✅ Test backup & restore procedure
6. ✅ Setup automated backups (cron job)
7. ✅ Review firewall rules
8. ✅ Test semua endpoints
9. ✅ Monitor logs untuk errors
