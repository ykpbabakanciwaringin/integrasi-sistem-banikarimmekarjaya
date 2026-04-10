// LOKASI: internal/domain/subject.go
package domain

import "context"

type Subject struct {
	BaseEntity
	InstitutionID  string        `gorm:"type:uuid;index" json:"institution_id"`
	CurriculumID   *string       `gorm:"type:uuid;index" json:"curriculum_id"`
	SubjectGroupID *string       `gorm:"type:uuid;index" json:"subject_group_id"`
	Code           string        `gorm:"not null" json:"code"`
	Name           string        `gorm:"not null" json:"name"`
	Type           string        `json:"type"`
	Institution    *Institution  `gorm:"foreignKey:InstitutionID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"institution,omitempty"`
	Curriculum     *Curriculum   `gorm:"foreignKey:CurriculumID;constraint:OnUpdate:CASCADE,OnDelete:SET NULL;" json:"curriculum,omitempty"`
	SubjectGroup   *SubjectGroup `gorm:"foreignKey:SubjectGroupID;constraint:OnUpdate:CASCADE,OnDelete:SET NULL;" json:"subject_group,omitempty"`
}

type SubjectInput struct {
	Code           string  `json:"code" binding:"required"`
	Name           string  `json:"name" binding:"required"`
	Type           string  `json:"type"`
	CurriculumID   *string `json:"curriculum_id"`
	SubjectGroupID *string `json:"subject_group_id"`
	InstitutionID  string  `json:"institution_id"`
}

type SubjectFilter struct {
	InstitutionID string
	Search        string
	Page          int
	Limit         int
}

type SubjectRepository interface {
	Fetch(ctx context.Context, filter SubjectFilter) ([]Subject, int64, error)
	GetByID(ctx context.Context, id string) (*Subject, error)
	Create(ctx context.Context, s *Subject) error
	Update(ctx context.Context, s *Subject) error
	Delete(ctx context.Context, id string) error
}

type SubjectUsecase interface {
	GetSubjects(ctx context.Context, filter SubjectFilter) (PaginationResult, error)
	CreateSubject(ctx context.Context, input SubjectInput, operatorID string) (*Subject, error)
	UpdateSubject(ctx context.Context, id string, input SubjectInput) (*Subject, error)
	DeleteSubject(ctx context.Context, id string) error
}
