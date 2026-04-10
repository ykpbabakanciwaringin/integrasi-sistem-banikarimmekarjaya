package domain

import (
	"context"
)

// StudentFilter diperbarui untuk mendukung filter dinamis dari UI
type StudentFilter struct {
	ClassID        string
	InstitutionID  string
	Search         string
	Page           int
	Limit          int
	Status         string // ACTIVE / PENDING (Tab Status)
	Gender         string // L / P
	AcademicStatus string // AKTIF / NON AKTIF / ALUMNI / PINDAH
}

// StudentCreateInput diselaraskan dengan StudentFormDialog.tsx
type StudentCreateInput struct {
	// Kredensial Akun
	Username string `json:"username" binding:"required"`
	Password string `json:"password"`

	// Identitas Pribadi
	FullName    string `json:"full_name" binding:"required"`
	NISN        string `json:"nisn" binding:"required"`
	NIK         string `json:"nik"`
	Gender      string `json:"gender" binding:"required,oneof=L P"`
	BirthPlace  string `json:"birth_place"`
	BirthDate   string `json:"birth_date"`
	Email       string `json:"email"`
	PhoneNumber string `json:"phone_number"`

	// Akademik & Lembaga
	InstitutionID string `json:"institution_id" binding:"required"`
	ClassID       string `json:"class_id"`
	Status        string `json:"status"`

	// Data Pesantren
	Pondok       string `json:"pondok"`
	Asrama       string `json:"asrama"`
	Kamar        string `json:"kamar"`
	Program      string `json:"program"`
	KelasProgram string `json:"kelas_program"`

	// Domisili & Orang Tua
	Address       string `json:"address"`
	Village       string `json:"village"`
	Subdistrict   string `json:"subdistrict"`
	Regency       string `json:"regency"`
	Province      string `json:"province"`
	PostalCode    string `json:"postal_code"`
	FatherName    string `json:"father_name"`
	MotherName    string `json:"mother_name"`
	GuardianPhone string `json:"guardian_phone"`

	Image string `json:"image"`
}

// StudentUpdateInput menggunakan field yang sama agar Update bersifat utuh
type StudentUpdateInput struct {
	Username    string `json:"username"`
	Password    string `json:"password"`
	FullName    string `json:"full_name"`
	NISN        string `json:"nisn"`
	NIK         string `json:"nik"`
	Gender      string `json:"gender"`
	BirthPlace  string `json:"birth_place"`
	BirthDate   string `json:"birth_date"`
	Email       string `json:"email"`
	PhoneNumber string `json:"phone_number"`

	ClassID      string `json:"class_id"`
	Status       string `json:"status"`
	Pondok       string `json:"pondok"`
	Asrama       string `json:"asrama"`
	Kamar        string `json:"kamar"`
	Program      string `json:"program"`
	KelasProgram string `json:"kelas_program"`

	Address       string `json:"address"`
	Village       string `json:"village"`
	Subdistrict   string `json:"subdistrict"`
	Regency       string `json:"regency"`
	Province      string `json:"province"`
	PostalCode    string `json:"postal_code"`
	FatherName    string `json:"father_name"`
	MotherName    string `json:"mother_name"`
	GuardianPhone string `json:"guardian_phone"`

	Image string `json:"image"`
}

type StudentRepository interface {
	Fetch(ctx context.Context, filter StudentFilter) ([]User, int64, error)
	CreateOne(ctx context.Context, user *User) error
	BulkCreate(ctx context.Context, users []*User) error
	GetByID(ctx context.Context, id string) (*User, error)
	Update(ctx context.Context, user *User) error
	Delete(ctx context.Context, id string) error
}
