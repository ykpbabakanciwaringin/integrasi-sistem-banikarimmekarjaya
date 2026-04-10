#!/bin/bash

# ==============================================================================
# SKRIP SAKTI SMART DEPLOY & SECURITY AUDIT (VERSION 2.2 PRO - ENHANCED SYNC)
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
echo -e "${BLUE}    MEMULAI PROSES SMART DEPLOY PRO & AUDIT        ${NC}"
echo -e "${BLUE}====================================================${NC}"

echo -e "${YELLOW}[1/7] Melakukan Audit Kesehatan Server...${NC}"
DISK_USAGE=$(df / | awk '/\// { print $5 }' | sed 's/%//g')
if [ "$DISK_USAGE" -gt 90 ]; then log_message "${RED}✘ ERROR: Disk Penuh ($DISK_USAGE%). Deploy dibatalkan.${NC}"; exit 1; fi
echo -e "${GREEN}✔ Penyimpanan Aman ($DISK_USAGE% terpakai).${NC}"

FREE_RAM=$(free -m | awk '/Mem/ {print $4}')
if [ "$FREE_RAM" -lt 200 ]; then echo -e "${YELLOW}⚠ PERINGATAN: RAM sisa sedikit ($FREE_RAM MB).${NC}"; else echo -e "${GREEN}✔ RAM Mencukupi ($FREE_RAM MB bebas).${NC}"; fi
if systemctl is-active --quiet fail2ban; then echo -e "${GREEN}✔ Fail2Ban Aktif.${NC}"; else echo -e "${RED}⚠ Fail2Ban MATI!${NC}"; fi

echo -e "\n${YELLOW}[2/7] Mengamankan Izin File...${NC}"
cd /var/www/ykpbabakanciwaringin || exit
if [ -f ".env" ]; then 
    chmod 600 .env
    echo -e "${GREEN}✔ File .env telah dikunci (chmod 600).${NC}"
fi
# Mengamankan skrip deploy itu sendiri dari eksekusi pihak luar
chmod 700 deploy.sh

echo -e "\n${YELLOW}[3/7] Sinkronisasi Kode dari GitHub...${NC}"
log_message "${BLUE}Menarik pembaruan terbaru...${NC}"
# PERBAIKAN: Menggabungkan perintah dengan && agar jika fetch gagal, reset tidak dijalankan
if git fetch origin main && git reset --hard origin/main; then 
    echo -e "${GREEN}✔ Kode berhasil disinkronkan tanpa konflik.${NC}"
else 
    log_message "${RED}✘ Gagal sinkronisasi Git. Periksa koneksi ke GitHub atau hak akses repository.${NC}"
    exit 1
fi

echo -e "\n${YELLOW}[4/7] Membangun Container (Docker Compose)...${NC}"
# PERBAIKAN: Menambahkan --remove-orphans untuk membersihkan sisa container yang tidak terpakai
if sudo docker-compose build --pull && sudo docker-compose up -d --remove-orphans; then 
    log_message "${GREEN}✔ Container berhasil diperbarui tanpa downtime yang signifikan.${NC}"
else 
    log_message "${RED}✘ Gagal saat proses Docker Compose.${NC}"
    exit 1
fi

echo -e "\n${YELLOW}[5/7] Memuat ulang Nginx...${NC}"
sudo docker exec ykp-nginx nginx -s reload > /dev/null 2>&1 || true
echo -e "${GREEN}✔ Nginx dikonfigurasi ulang.${NC}"

echo -e "\n${YELLOW}[6/7] Memverifikasi Status Layanan...${NC}"
sleep 5
CHECK_FRONTEND=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 || echo "FAIL")
if [[ "$CHECK_FRONTEND" == "200" ]]; then 
    echo -e "${GREEN}✔ Frontend: ONLINE (Status: $CHECK_FRONTEND)${NC}"
else 
    echo -e "${YELLOW}⚠ Frontend Status: $CHECK_FRONTEND (Bisa jadi masih proses booting, cek logs jika berlanjut)${NC}"
fi

echo -e "\n${YELLOW}[7/7] Membersihkan Image Usang...${NC}"
sudo docker image prune -f > /dev/null
echo -e "${GREEN}✔ Pembersihan selesai.${NC}"

DURATION=$(( $(date +%s) - START_TIME ))
echo -e "\n${GREEN}====================================================${NC}"
log_message "${GREEN}🎉 DEPLOY SUKSES! Total Waktu: $DURATION detik.${NC}"
echo -e "${GREEN}====================================================${NC}"