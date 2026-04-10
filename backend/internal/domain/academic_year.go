package domain

import (
	"context"
)

// AcademicYear merepresentasikan periode tahun ajaran aktif di sekolah
type AcademicYear struct {
	BaseEntity
	InstitutionID string       `gorm:"type:uuid;index;not null" json:"institution_id"`
	Name          string       `gorm:"type:varchar(50);not null" json:"name"`     // Contoh: "2024/2025"
	Semester      string       `gorm:"type:varchar(20);not null" json:"semester"` // Contoh: "Ganjil" atau "Genap"
	IsActive      bool         `gorm:"default:false" json:"is_active"`            // Hanya boleh ada 1 yang aktif per Lembaga
	Institution   *Institution `gorm:"foreignKey:InstitutionID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"institution,omitempty"`
}

// DTO untuk pencarian / filter
type AcademicYearFilter struct {
	InstitutionID string
	Search        string
	Page          int
	Limit         int
}

// Kontrak Repository
type AcademicYearRepository interface {
	FetchAll(ctx context.Context, filter AcademicYearFilter) ([]AcademicYear, int64, error)
	GetByID(ctx context.Context, id string) (*AcademicYear, error)
	GetActive(ctx context.Context, instID string) (*AcademicYear, error)
	Create(ctx context.Context, ay *AcademicYear) error
	Update(ctx context.Context, ay *AcademicYear) error
	Delete(ctx context.Context, id string) error
	SetActive(ctx context.Context, id string, instID string) error // Fungsi khusus mengaktifkan tahun ajaran
}

// DTO untuk input dari Frontend
type AcademicYearInput struct {
	Name     string `json:"name" binding:"required"`
	Semester string `json:"semester" binding:"required,oneof=Ganjil Genap"`
}

// Kontrak Usecase
type AcademicYearUsecase interface {
	GetAcademicYears(ctx context.Context, filter AcademicYearFilter) (PaginationResult, error)
	GetActiveAcademicYear(ctx context.Context, instID string) (*AcademicYear, error)
	CreateAcademicYear(ctx context.Context, instID, operator string, input AcademicYearInput) (*AcademicYear, error)
	UpdateAcademicYear(ctx context.Context, id string, input AcademicYearInput) (*AcademicYear, error)
	DeleteAcademicYear(ctx context.Context, id string) error
	SetActiveAcademicYear(ctx context.Context, id string, instID string) (*AcademicYear, error)
}
