# Panduan Setup Docker Compose

## Langkah-langkah Menjalankan Aplikasi

### 1. Install Docker & Docker Compose (jika belum terinstall)

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install docker.io docker-compose

# Start Docker service
sudo systemctl start docker
sudo systemctl enable docker

# Tambahkan user ke grup docker (opsional, agar tidak perlu sudo)
sudo usermod -aG docker $USER
# Logout dan login kembali setelah ini
```

### 2. Setup Environment Variables (Opsional)

File `.env.example` sudah tersedia. Untuk production, buat file `.env` di root:

```bash
cp .env.example .env
nano .env  # Edit dengan nilai yang sesuai
```

**Penting:** 
- Ganti `JWT_SECRET_KEY` dengan secret key yang kuat (minimal 32 karakter)
- Ganti `POSTGRES_PASSWORD` dengan password yang aman
- Jika tidak menggunakan WhatsApp, biarkan kosong

### 3. Build dan Jalankan dengan Docker Compose

```bash
cd /var/www/banikarimmekarjaya

# Build semua images
docker compose build

# Jalankan semua services
docker compose up -d

# Atau jalankan dengan output log (untuk debugging)
docker compose up
```

### 4. Verifikasi Services Berjalan

```bash
# Cek status semua container
docker compose ps

# Cek log masing-masing service
docker compose logs backend
docker compose logs frontend
docker compose logs nginx
docker compose logs postgres
```

### 5. Akses Aplikasi

Setelah semua container running:

- **Frontend:** http://localhost/
- **API:** http://localhost/api/v1/
- **Uploads:** http://localhost/uploads/
- **Swagger Docs:** http://localhost/api/v1/swagger/index.html

### 6. Verifikasi Endpoint

```bash
# Test API health (jika ada endpoint health check)
curl http://localhost/api/v1/auth/setup-check

# Test frontend
curl http://localhost/

# Test uploads (jika ada file)
curl http://localhost/uploads/test.jpg
```

### 7. Setup Database (First Time)

Jika ini pertama kali setup:

1. Akses http://localhost/
2. Jika belum ada admin, akan redirect ke `/setup`
3. Buat admin pertama melalui form setup

### 8. Troubleshooting

#### Backend tidak bisa connect ke database:
```bash
# Cek apakah postgres sudah ready
docker compose logs postgres

# Cek network connectivity
docker compose exec backend ping postgres
```

#### Frontend tidak load:
```bash
# Cek log frontend
docker compose logs frontend

# Rebuild frontend jika perlu
docker compose build frontend
docker compose up -d frontend
```

#### Nginx error:
```bash
# Test nginx config
docker compose exec nginx nginx -t

# Reload nginx
docker compose exec nginx nginx -s reload
```

#### Port sudah digunakan:
```bash
# Cek port 80
sudo lsof -i :80

# Atau ubah port di docker-compose.yml:
# ports:
#   - "8080:80"  # Akses via http://localhost:8080
```

### 9. Stop dan Cleanup

```bash
# Stop semua services
docker compose down

# Stop dan hapus volumes (HATI-HATI: akan hapus data database!)
docker compose down -v

# Rebuild dari awal
docker compose down -v
docker compose build --no-cache
docker compose up -d
```

### 10. Production Deployment

Untuk production:

1. **Gunakan HTTPS:** Setup SSL certificate dan update nginx config
2. **Environment Variables:** Pastikan semua secret di `.env` tidak commit ke git
3. **Database Backup:** Setup regular backup untuk volume `postgres_data`
4. **Monitoring:** Setup log monitoring dan health checks
5. **Resource Limits:** Tambahkan `deploy.resources` di docker-compose.yml

### Struktur File Penting

```
/var/www/banikarimmekarjaya/
├── docker-compose.yml      # Konfigurasi Docker Compose
├── .env.example           # Template environment variables
├── .env                   # Environment variables (buat sendiri, jangan commit)
├── nginx/
│   └── nginx.conf         # Konfigurasi Nginx reverse proxy
├── backend/
│   ├── Dockerfile
│   └── config/
│       └── config.yaml    # Config default (bisa di-override via env)
└── frontend/
    ├── Dockerfile
    └── .env.local         # Frontend env (sudah set ke /api/v1)
```

### Catatan Penting

- **Frontend** sudah dikonfigurasi untuk menggunakan relative path `/api/v1`
- **Backend** bisa di-override via environment variables (DATABASE_HOST, JWT_SECRET_KEY, dll)
- **Uploads** disimpan di volume `backend_uploads` dan diakses via `/uploads/`
- **Database** data disimpan di volume `postgres_data` (persistent)
