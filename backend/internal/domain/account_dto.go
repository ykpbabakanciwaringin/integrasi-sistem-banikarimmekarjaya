package domain

import "context"

type AccountFilter struct {
	Page          int
	Limit         int
	Search        string
	Role          string
	InstitutionID string
	Status        string
}

type AccountCreateInput struct {
	Username      string `json:"username" binding:"required"`
	Password      string `json:"password" binding:"required,min=6"`
	FullName      string `json:"full_name" binding:"required"`
	Role          string `json:"role" binding:"required"`
	InstitutionID string `json:"institution_id"`
	Gender        string `json:"gender" binding:"omitempty,oneof=L P"`
	PhoneNumber   string `json:"phone_number"`
	Email         string `json:"email" binding:"omitempty,email"`
	// Tambahan Opsional saat Create
	NIK  string `json:"nik"`
	NISN string `json:"nisn"`
	NIP  string `json:"nip"`
}

type AccountUpdateInput struct {
	FullName    string `json:"full_name"`
	Password    string `json:"password"`
	IsActive    *bool  `json:"is_active"`
	Gender      string `json:"gender"`
	PhoneNumber string `json:"phone_number"`
	Image       string `json:"image"`

	Email      string `json:"email"`
	NIK        string `json:"nik"`
	NISN       string `json:"nisn"`
	NIP        string `json:"nip"`
	BirthPlace string `json:"birth_place"`
	BirthDate  string `json:"birth_date"`
	Address    string `json:"address"`
	Pondok     string `json:"pondok"`
	Asrama     string `json:"asrama"`
}

type AccountRepository interface {
	FetchAll(ctx context.Context, filter AccountFilter) ([]User, int64, error)
	GetByID(ctx context.Context, id string) (*User, error)
	Create(ctx context.Context, user *User) error
	Update(ctx context.Context, user *User) error
	Delete(ctx context.Context, id string) error
	AddEnrollment(ctx context.Context, enrollment *Enrollment) error
	GetEnrollmentByID(ctx context.Context, id string) (*Enrollment, error)
	UpdateEnrollment(ctx context.Context, enrollment *Enrollment) error
	DeleteEnrollment(ctx context.Context, id string) error
}

// AddEnrollmentInput digunakan untuk menambah penugasan guru/admin ke lembaga baru
type AddEnrollmentInput struct {
	InstitutionID string `json:"institution_id" binding:"required"`
	Role          string `json:"role" binding:"required"`
	Position      string `json:"position"`
}
