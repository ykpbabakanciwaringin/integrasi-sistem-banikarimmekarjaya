package domain

// RegisterAdminInput adalah struktur untuk validasi input saat setup admin pertama kali.
// Digunakan pada endpoint POST /auth/setup untuk membuat super admin pertama.
type RegisterAdminInput struct {
	Username string `json:"username" binding:"required"`       // Username untuk admin (harus unik)
	Password string `json:"password" binding:"required,min=8"` // Password minimal 6 karakter
	FullName string `json:"full_name" binding:"required"`      // Nama lengkap admin
}

// SetupStatusResponse adalah struktur response untuk endpoint GET /auth/setup-check.
// Menunjukkan apakah sistem masih memerlukan setup admin pertama atau tidak.
type SetupStatusResponse struct {
	IsSetupRequired bool `json:"is_setup_required"` // true jika belum ada super admin, false jika sudah ada
}
