# Integrasi Sistem - Bani Karim Mekarjaya

Sistem Ujian Berbasis Komputer (CBT) untuk YKP Babakan Ciwaringin.

## 🚀 Quick Start

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

# 4. Akses aplikasi
# Frontend: http://localhost/
# API: http://localhost/api/v1/
```

## 📁 Struktur Project

```
banikarimmekarjaya/
├── backend/              # Go backend API
│   ├── cmd/api/         # Main application
│   ├── internal/        # Internal packages
│   ├── pkg/             # Shared packages
│   └── config/          # Configuration files
├── frontend/            # Next.js frontend
│   └── src/
│       ├── app/         # Next.js app router
│       ├── components/  # React components
│       └── services/    # API services
├── nginx/               # Nginx configuration
├── scripts/             # Utility scripts
├── docker-compose.yml   # Docker Compose configuration
└── .env                 # Environment variables (buat sendiri)
```

## 🔧 Prerequisites

- Docker & Docker Compose
- Git
- Domain name (untuk production dengan SSL)

## 📚 Dokumentasi

- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Panduan deployment lengkap
- **[PRODUCTION-CHECKLIST.md](PRODUCTION-CHECKLIST.md)** - Checklist production readiness
- **[README-DOCKER.md](README-DOCKER.md)** - Panduan Docker Compose

## 🔐 Security

**PENTING untuk Production:**

1. **Generate JWT Secret Key:**
   ```bash
   openssl rand -hex 32
   ```
   Update di `.env`: `JWT_SECRET_KEY=<generated-key>`

2. **Generate Database Password:**
   ```bash
   openssl rand -base64 24
   ```
   Update di `.env`: `POSTGRES_PASSWORD=<generated-password>`

3. **Setup SSL/HTTPS:**
   - Lihat `nginx/nginx-ssl.conf.example`
   - Setup Let's Encrypt certificate
   - Update nginx configuration

## 🗄️ Database Backup

```bash
# Manual backup
./scripts/backup-db.sh

# Restore
./scripts/restore-db.sh backups/backup_file.sql.gz
```

## 📊 Monitoring

```bash
# Check logs
docker-compose logs -f

# Check status
docker-compose ps

# Resource usage
docker stats
```

## 🛠️ Development

### Backend
```bash
cd backend
go mod download
go run cmd/api/main.go
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## 📝 Features

- ✅ Manajemen Lembaga
- ✅ Manajemen Guru & Siswa
- ✅ Manajemen Kelas & Mata Pelajaran
- ✅ Bank Soal & Paket Soal
- ✅ Manajemen Sesi Ujian
- ✅ Monitoring Ujian Real-time
- ✅ Laporan & Hasil Ujian
- ✅ Import/Export Excel
- ✅ Upload & Download File

## 🔄 Updates

```bash
# Pull latest code
git pull

# Rebuild dan restart
docker-compose build
docker-compose up -d
```

## 📞 Support

Untuk pertanyaan atau masalah, silakan buat issue di repository.

## 📄 License

[Your License Here]
