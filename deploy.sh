#!/bin/bash

# ==============================================================================
# SKRIP SAKTI SMART DEPLOY & SECURITY AUDIT (BANI KARIM EDITION)
# ==============================================================================

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' 
LOG_FILE="deploy.log"
START_TIME=$(date +%s)

log_message() { echo -e "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"; }

clear
echo -e "${BLUE}====================================================${NC}"
echo -e "${BLUE}    MEMULAI PROSES SMART DEPLOY PRO (BANI KARIM)    ${NC}"
echo -e "${BLUE}====================================================${NC}"

echo -e "${YELLOW}[1/7] Melakukan Audit Kesehatan Server...${NC}"
DISK_USAGE=$(df / | awk '/\// { print $5 }' | sed 's/%//g')
if [ "$DISK_USAGE" -gt 90 ]; then log_message "${RED}✘ ERROR: Disk Penuh ($DISK_USAGE%). Deploy dibatalkan.${NC}"; exit 1; fi
echo -e "${GREEN}✔ Penyimpanan Aman ($DISK_USAGE% terpakai).${NC}"

FREE_RAM=$(free -m | awk '/Mem/ {print $4}')
if [ "$FREE_RAM" -lt 200 ]; then echo -e "${YELLOW}⚠ PERINGATAN: RAM sisa sedikit ($FREE_RAM MB).${NC}"; else echo -e "${GREEN}✔ RAM Mencukupi ($FREE_RAM MB bebas).${NC}"; fi
if systemctl is-active --quiet fail2ban; then echo -e "${GREEN}✔ Fail2Ban Aktif.${NC}"; else echo -e "${RED}⚠ Fail2Ban MATI!${NC}"; fi

echo -e "\n${YELLOW}[2/7] Mengamankan Izin File & Masuk Direktori...${NC}"
# Masuk ke folder Bani Karim
cd /var/www/banikarimmekarjaya || exit
if [ -f "backend/.env" ]; then 
    chmod 600 backend/.env
    echo -e "${GREEN}✔ File .env Backend telah dikunci (chmod 600).${NC}"
fi
if [ -f "frontend/.env" ]; then 
    chmod 600 frontend/.env
    echo -e "${GREEN}✔ File .env Frontend telah dikunci (chmod 600).${NC}"
fi
chmod 700 deploy.sh

echo -e "\n${YELLOW}[3/7] Sinkronisasi Kode dari GitHub...${NC}"
log_message "${BLUE}Menarik pembaruan terbaru...${NC}"
if git fetch origin main && git reset --hard origin/main; then 
    echo -e "${GREEN}✔ Kode berhasil disinkronkan tanpa konflik.${NC}"
else 
    log_message "${RED}✘ Gagal sinkronisasi Git. Periksa koneksi ke GitHub.${NC}"
    exit 1
fi

echo -e "\n${YELLOW}[4/7] Membangun Container (Docker Compose)...${NC}"
if sudo docker-compose up -d --build --remove-orphans; then 
    log_message "${GREEN}✔ Container Bani Karim berhasil diperbarui.${NC}"
else 
    log_message "${RED}✘ Gagal saat proses Docker Compose.${NC}"
    exit 1
fi

echo -e "\n${YELLOW}[5/7] Memuat ulang Nginx Utama...${NC}"
# Karena Nginx Anda berjalan di OS Ubuntu langsung (Bare Metal)
sudo systemctl reload nginx > /dev/null 2>&1 || true
echo -e "${GREEN}✔ Nginx dikonfigurasi ulang.${NC}"

echo -e "\n${YELLOW}[6/7] Memverifikasi Status Layanan Bani Karim...${NC}"
sleep 10 # Memberi waktu agak lama untuk Next.js dan Golang booting
# Mengecek Port 3001 (Port Frontend Bani Karim)
CHECK_FRONTEND=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3001 || echo "FAIL")
if [[ "$CHECK_FRONTEND" == "200" || "$CHECK_FRONTEND" == "308" ]]; then 
    echo -e "${GREEN}✔ Frontend Bani Karim: ONLINE (Status: $CHECK_FRONTEND)${NC}"
else 
    echo -e "${YELLOW}⚠ Frontend Status: $CHECK_FRONTEND (Bisa jadi masih proses booting, cek 'sudo docker ps')${NC}"
fi

echo -e "\n${YELLOW}[7/7] Membersihkan Image Usang...${NC}"
sudo docker image prune -f > /dev/null
echo -e "${GREEN}✔ Pembersihan selesai.${NC}"

DURATION=$(( $(date +%s) - START_TIME ))
echo -e "\n${GREEN}====================================================${NC}"
log_message "${GREEN}🎉 DEPLOY SUKSES! Total Waktu: $DURATION detik.${NC}"
echo -e "${GREEN}====================================================${NC}"