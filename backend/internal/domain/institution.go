// LOKASI: internal/domain/institution.go
package domain

import (
	"context"
	"errors"
)

var (
	ErrInstitutionInUse    = errors.New("gagal: tidak dapat menghapus lembaga karena masih memiliki kelas atau pengguna yang terdaftar")
	ErrInstitutionNotFound = errors.New("lembaga tidak ditemukan")
)

type Institution struct {
	BaseEntity
	Code                   string `gorm:"uniqueIndex;not null" json:"code"`
	Name                   string `gorm:"type:text;not null" json:"name"`
	FoundationName         string `gorm:"type:text" json:"foundation_name"`
	Category               string `gorm:"type:text" json:"category"`
	AddressCity            string `gorm:"type:text" json:"address_city"`
	AddressDetail          string `gorm:"type:text" json:"address_detail"`
	ContactPhone           string `gorm:"type:text" json:"contact_phone"`
	ContactEmail           string `gorm:"type:text" json:"contact_email"`
	Website                string `gorm:"type:text" json:"website"`
	Header1                string `gorm:"type:text" json:"header1"`
	Header2                string `gorm:"type:text" json:"header2"`
	LevelCode              string `gorm:"type:text" json:"level_code"`
	LogoUrl                string `gorm:"type:text" json:"logo_url"`
	IsPqIntegrationEnabled bool   `gorm:"default:false" json:"is_pq_integration_enabled"`
	PqPartnerKey           string `gorm:"type:varchar(255)" json:"pq_partner_key"`
	WeeklyDayOff           string `gorm:"type:text;default:'JUMAT'" json:"weekly_day_off"`

	// Virtual fields (tidak disimpan di DB)
	ClassCount   int64 `gorm:"->;-:migration" json:"class_count"`
	StudentCount int64 `gorm:"->;-:migration" json:"student_count"`
}

type InstitutionFilter struct {
	Page   int    `json:"page"`
	Limit  int    `json:"limit"`
	Search string `json:"search"`
}

type CreateInstitutionInput struct {
	Code                   string `json:"code" binding:"required"`
	Name                   string `json:"name" binding:"required"`
	FoundationName         string `json:"foundation_name"`
	Category               string `json:"category"`
	LevelCode              string `json:"level_code"`
	AddressCity            string `json:"address_city"`
	AddressDetail          string `json:"address_detail"`
	ContactPhone           string `json:"contact_phone"`
	ContactEmail           string `json:"contact_email"`
	Website                string `json:"website"`
	Header1                string `json:"header1"`
	Header2                string `json:"header2"`
	LogoUrl                string `json:"logo_url"`
	IsPqIntegrationEnabled bool   `json:"is_pq_integration_enabled"`
	PqPartnerKey           string `json:"pq_partner_key"`
}

type InstitutionRepository interface {
	FetchAll(ctx context.Context, filter InstitutionFilter) ([]Institution, int64, error)
	GetByID(ctx context.Context, id string) (*Institution, error)
	Create(ctx context.Context, i *Institution) error
	Update(ctx context.Context, i *Institution) error
	Delete(ctx context.Context, id string) error
	BulkCreate(ctx context.Context, insts []Institution) error
	UpdateWeeklyDayOff(ctx context.Context, id string, day string) error
	UpdatePqSettings(ctx context.Context, id string, enabled bool, partnerKey string) error
}
