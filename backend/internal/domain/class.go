// LOKASI: internal/domain/class.go
package domain

import "context"

type Class struct {
	BaseEntity
	InstitutionID string       `gorm:"type:uuid;index" json:"institution_id"`
	Name          string       `gorm:"not null" json:"name"`
	Level         string       `json:"level"`
	Major         string       `json:"major"`
	TeacherID     *string      `gorm:"type:uuid;index" json:"teacher_id"`
	Institution   *Institution `gorm:"foreignKey:InstitutionID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"institution,omitempty"`
	Teacher       *Profile     `gorm:"foreignKey:TeacherID;references:UserID;constraint:OnUpdate:CASCADE,OnDelete:SET NULL;" json:"teacher,omitempty"`
}

// DTO untuk input form kelas
type CreateClassInput struct {
	Name          string `json:"name" binding:"required"`
	Level         string `json:"level" binding:"required"`
	Major         string `json:"major" binding:"required"`
	InstitutionID string `json:"institution_id"`
}

type ClassFilter struct {
	Level  string
	Major  string
	Search string
}

type ClassRepository interface {
	Fetch(ctx context.Context, instID string, filter ClassFilter) ([]Class, error)
	GetByID(ctx context.Context, id string) (*Class, error)
	Create(ctx context.Context, c *Class) error
	Update(ctx context.Context, c *Class) error
	Delete(ctx context.Context, id string) error
	ImportBatch(ctx context.Context, classes []Class) error
	AssignHomeroom(ctx context.Context, classID, teacherID string) error
}
