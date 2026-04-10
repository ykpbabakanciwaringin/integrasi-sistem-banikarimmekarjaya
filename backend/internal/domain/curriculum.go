// LOKASI: internal/domain/curriculum.go
package domain

import (
	"context"
	"time"
)

type Curriculum struct {
	BaseEntity
	InstitutionID string       `gorm:"type:uuid;index;not null" json:"institution_id"`
	Name          string       `gorm:"type:varchar(100);not null" json:"name"`
	IsActive      bool         `gorm:"default:true" json:"is_active"`
	Institution   *Institution `gorm:"foreignKey:InstitutionID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"institution,omitempty"`
}

type SubjectGroup struct {
	BaseEntity
	CurriculumID string      `gorm:"type:uuid;index;not null" json:"curriculum_id"`
	Name         string      `gorm:"type:varchar(100);not null" json:"name"`
	Curriculum   *Curriculum `gorm:"foreignKey:CurriculumID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"curriculum,omitempty"`
}

type Holiday struct {
	BaseEntity
	InstitutionID *string   `gorm:"type:uuid;index" json:"institution_id"`
	Date          time.Time `gorm:"type:date;not null" json:"date"`
	Name          string    `gorm:"type:varchar(255);not null" json:"name"`
	IsGlobal      bool      `gorm:"default:false" json:"is_global"`
}

type CurriculumInput struct {
	Name     string `json:"name" binding:"required"`
	IsActive bool   `json:"is_active"`
}

type SubjectGroupInput struct {
	Name string `json:"name" binding:"required"`
}

type HolidayInput struct {
	InstitutionID string `json:"institution_id"`
	Date          string `json:"date" binding:"required"`
	Name          string `json:"name" binding:"required"`
	IsGlobal      bool   `json:"is_global"`
}

type CurriculumFilter struct {
	InstitutionID string
	Search        string
	Page          int
	Limit         int
}

type HolidayFilter struct {
	InstitutionID string
	YearMonth     string
	Search        string
	Page          int
	Limit         int
}

type CurriculumRepository interface {
	FetchCurriculums(ctx context.Context, filter CurriculumFilter) ([]Curriculum, int64, error)
	GetByID(ctx context.Context, id string) (*Curriculum, error)
	CreateCurriculum(ctx context.Context, c *Curriculum) error
	UpdateCurriculum(ctx context.Context, id string, data map[string]interface{}) error
	DeleteCurriculum(ctx context.Context, id string) error

	FetchSubjectGroups(ctx context.Context, curriculumID string) ([]SubjectGroup, error)
	GetGroupByID(ctx context.Context, id string) (*SubjectGroup, error)
	CreateSubjectGroup(ctx context.Context, sg *SubjectGroup) error
	DeleteSubjectGroup(ctx context.Context, id string) error

	FetchHolidays(ctx context.Context, filter HolidayFilter) ([]Holiday, int64, error)
	CreateHoliday(ctx context.Context, h *Holiday) error
	UpdateHoliday(ctx context.Context, h *Holiday) error
	DeleteHoliday(ctx context.Context, id string) error
}

type CurriculumUsecase interface {
	GetCurriculums(ctx context.Context, filter CurriculumFilter) (PaginationResult, error)
	CreateCurriculum(ctx context.Context, instID, operator string, input CurriculumInput) (*Curriculum, error)
	UpdateCurriculum(ctx context.Context, id string, input CurriculumInput) (*Curriculum, error)
	DeleteCurriculum(ctx context.Context, id string) error

	GetSubjectGroups(ctx context.Context, curriculumID string) ([]SubjectGroup, error)
	CreateSubjectGroup(ctx context.Context, curriculumID, operator string, input SubjectGroupInput) (*SubjectGroup, error)
	DeleteSubjectGroup(ctx context.Context, id string) error

	GetHolidays(ctx context.Context, filter HolidayFilter) (PaginationResult, error)
	CreateHoliday(ctx context.Context, instID string, input HolidayInput) (*Holiday, error)
	UpdateHoliday(ctx context.Context, id string, input HolidayInput) (*Holiday, error)
	DeleteHoliday(ctx context.Context, id string) error
}
