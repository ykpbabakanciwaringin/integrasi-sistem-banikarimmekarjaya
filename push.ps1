# Pastikan simpan file ini dengan encoding "UTF-8" di VS Code
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "   MENGUNGGAH KODE KE GITHUB BANI KARIM   " -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# 1. Menambahkan semua perubahan
Write-Host "[1/4] Menambahkan perubahan file..." -ForegroundColor Yellow
git add .

# 2. Meminta input pesan commit
$commitMessage = Read-Host "Masukkan pesan perubahan (Tekan Enter untuk default)"

# Jika pesan kosong, gunakan waktu saat ini
if ([string]::IsNullOrWhiteSpace($commitMessage)) {
    $date = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $commitMessage = "Update rutin web Bani Karim pada $date"
}

# 3. Melakukan Commit
Write-Host "[2/4] Menyimpan perubahan secara lokal..." -ForegroundColor Yellow
git commit -m "$commitMessage"

# 4. Melakukan Push ke branch main
Write-Host "[3/4] Mengunggah ke GitHub Bani Karim..." -ForegroundColor Yellow
git push origin main

Write-Host "[4/4] SELESAI!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Berhasil dipush ke: integrasi-sistem-banikarimmekarjaya" -ForegroundColor Green
Write-Host "Sekarang silakan jalankan skrip deploy di VPS Anda." -ForegroundColor White
Write-Host "==========================================" -ForegroundColor Cyan