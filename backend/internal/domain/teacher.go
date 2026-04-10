// LOKASI: internal/domain/teacher.go
package domain

import (
	"context"
	"time"
)

type TeacherFilter struct {
	InstitutionID string
	Search        string
	Page          int
	Limit         int
	Gender        string
	Status        string
}

type TeacherCreateInput struct {
	FullName      string `json:"full_name" binding:"required"`
	NIK           string `json:"nik" binding:"required"`
	NIP           string `json:"nip"`
	Gender        string `json:"gender"`
	Username      string `json:"username" binding:"required"`
	Password      string `json:"password"`
	PhoneNumber   string `json:"phone_number"`
	Email         string `json:"email"`
	BirthPlace    string `json:"birth_place"`
	BirthDate     string `json:"birth_date"`
	InstitutionID string `json:"institution_id"`
	Position      string `json:"position"`
	Status        string `json:"status"`
	Image         string `json:"image"`
	CreatedBy     string `json:"-"`
}

type TeacherUpdateInput struct {
	FullName    string `json:"full_name"`
	NIK         string `json:"nik"`
	NIP         string `json:"nip"`
	Gender      string `json:"gender"`
	Username    string `json:"username"`
	Password    string `json:"password"`
	PhoneNumber string `json:"phone_number"`
	Email       string `json:"email"`
	BirthPlace  string `json:"birth_place"`
	BirthDate   string `json:"birth_date"`
	Position    string `json:"position"`
	Status      string `json:"status"`
	Image       string `json:"image"`
}

type TeacherAttendance struct {
	BaseEntity
	InstitutionID string    `gorm:"type:uuid;index;not null" json:"institution_id"`
	TeacherID     string    `gorm:"type:uuid;index;not null" json:"teacher_id"`
	Date          time.Time `gorm:"type:date;not null" json:"date"`
	Status        string    `gorm:"type:varchar(20);not null" json:"status"` // SAKIT, IZIN, CUTI, HADIR_MANUAL
	Notes         string    `gorm:"type:text" json:"notes"`
	CreatedBy     string    `gorm:"type:uuid" json:"created_by"`

	Teacher *Profile `gorm:"foreignKey:TeacherID;references:UserID" json:"teacher,omitempty"`
}

type TeacherAttendanceInput struct {
	TeacherID string `json:"teacher_id" binding:"required"`
	Date      string `json:"date" binding:"required"` // YYYY-MM-DD
	Status    string `json:"status" binding:"required"`
	Notes     string `json:"notes"`
}

type TeacherRepository interface {
	Fetch(ctx context.Context, filter TeacherFilter) ([]User, int64, error)
	CreateOne(ctx context.Context, user *User) error
	BulkCreate(ctx context.Context, users []*User) error
	GetByID(ctx context.Context, id string) (*User, error)
	Update(ctx context.Context, user *User) error
	Delete(ctx context.Context, id string) error

	CreateAttendance(ctx context.Context, ta *TeacherAttendance) error
	FetchAttendances(ctx context.Context, instID string, yearMonth string) ([]TeacherAttendance, error)
	DeleteAttendance(ctx context.Context, id string) error
}

type TeacherUsecase interface {
	GetTeachers(ctx context.Context, filter TeacherFilter) ([]User, int64, error)
	GetTeacherByID(ctx context.Context, id string) (*User, error)
	CreateTeacher(ctx context.Context, input TeacherCreateInput) error
	UpdateTeacher(ctx context.Context, id string, input TeacherUpdateInput) error
	DeleteTeacher(ctx context.Context, id string) error

	SubmitAttendance(ctx context.Context, instID, operatorID string, input TeacherAttendanceInput) error
	GetAttendances(ctx context.Context, instID string, yearMonth string) ([]TeacherAttendance, error)
}
