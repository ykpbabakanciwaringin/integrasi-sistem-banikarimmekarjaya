# ========================================================
# TAHAP 1: Build Aplikasi (AS builder)
# ========================================================
# Menggunakan Go 1.26-alpine untuk mendukung syarat go.mod >= 1.25.6
FROM golang:1.26-alpine AS builder

# Install git untuk dependensi yang ditarik langsung dari VCS
RUN apk add --no-cache git

# Set folder kerja di dalam kontainer
WORKDIR /app

# Strategi Caching: Copy dependensi dulu agar tidak download ulang jika kode berubah
COPY go.mod go.sum ./
RUN go mod download

# Copy seluruh source code backend
COPY . .

# Build binary Go secara statis (CGO_ENABLED=0)
# Output binary diberi nama "server"
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o server cmd/api/main.go

# ========================================================
# TAHAP 2: Runner (Image Produksi yang Ringan)
# ========================================================
FROM alpine:latest

# Install tzdata agar waktu di server sinkron dengan Asia/Jakarta
RUN apk add --no-cache tzdata
ENV TZ=Asia/Jakarta

WORKDIR /app

# Copy binary dari tahap 'builder' (Ini alasan kita butuh alias AS builder)
COPY --from=builder /app/server .

# Copy folder konfigurasi dan aset statis yang dibutuhkan saat runtime
COPY --from=builder /app/config ./config
COPY --from=builder /app/static ./static
COPY --from=builder /app/docs ./docs

# Buat direktori logs dan uploads dengan izin yang tepat
RUN mkdir -p logs static/uploads

# Port yang digunakan oleh aplikasi Golang Anda
EXPOSE 8080

# Jalankan aplikasi
CMD ["./server"]