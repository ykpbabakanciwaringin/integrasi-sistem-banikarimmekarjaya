// LOKASI: internal/domain/auth_dto.go
package domain

// RegisterPublicInput digunakan untuk pendaftaran mandiri (Guru & Siswa)
type RegisterPublicInput struct {
	Role          string `json:"role" binding:"required,oneof=USER TEACHER"`
	InstitutionID string `json:"institution_id" binding:"required"`
	Username      string `json:"username" binding:"required"`
	Password      string `json:"password" binding:"required,min=6"`
	FullName      string `json:"full_name" binding:"required"`
	Gender        string `json:"gender" binding:"required,oneof=L P"`
	PhoneNumber   string `json:"phone_number" binding:"required"` // Wajib untuk WA
	Email         string `json:"email" binding:"required,email"`  // Wajib untuk Email Reset
	NISN          string `json:"nisn"`                            // Wajib jika role = USER
	NIP           string `json:"nip"`                             // Wajib jika role = TEACHER
}

// ResetPasswordInput digunakan untuk request lupa kata sandi
type ResetPasswordInput struct {
	Identifier string `json:"identifier" binding:"required"`                  // Username / NISN / NIP
	Method     string `json:"method" binding:"required,oneof=whatsapp email"` // Metode pengiriman
}

// SwitchInstitutionInput digunakan untuk request pindah konteks lembaga (Multi-Tenant)
type SwitchInstitutionInput struct {
	TargetInstitutionID string `json:"target_institution_id" binding:"required"`
}

// SwitchInstitutionResponse mengembalikan token baru dengan hak akses lembaga yang baru
type SwitchInstitutionResponse struct {
	Token           string `json:"token"`
	InstitutionName string `json:"institution_name"`
	Role            string `json:"role"`
}
