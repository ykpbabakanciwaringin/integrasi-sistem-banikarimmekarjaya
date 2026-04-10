// LOKASI: internal/domain/schedule.go
package domain

import (
	"bytes"
	"context"
)

// MASTER SESI (UNTUK PESANTRENQU)
type ClassSession struct {
	BaseEntity
	InstitutionID      string `gorm:"type:uuid;index;not null" json:"institution_id"`
	Name               string `gorm:"not null" json:"name"`                 // Contoh: "Sesi 1"
	StartTime          string `gorm:"not null" json:"start_time"`           // "07:00"
	EndTime            string `gorm:"not null" json:"end_time"`             // "08:30"
	PesantrenquEventID int    `gorm:"not null" json:"pesantrenqu_event_id"` // ID Event dari PesantrenQu
}

type CreateClassSessionInput struct {
	Name               string `json:"name" binding:"required"`
	StartTime          string `json:"start_time" binding:"required"`
	EndTime            string `json:"end_time" binding:"required"`
	PesantrenquEventID int    `json:"pesantrenqu_event_id"` // <--- SUDAH DIHAPUS BINDING REQUIRED-NYA
}

type TeachingAllocation struct {
	BaseEntity
	AcademicYearID string `gorm:"type:uuid;index;not null" json:"academic_year_id"`
	InstitutionID  string `gorm:"type:uuid;index;not null" json:"institution_id"`
	TeacherID      string `gorm:"type:uuid;index;not null" json:"teacher_id"`
	SubjectID      string `gorm:"type:uuid;index;not null" json:"subject_id"`
	ClassID        string `gorm:"type:uuid;index;not null" json:"class_id"`

	// Relasi
	AcademicYear *AcademicYear   `gorm:"foreignKey:AcademicYearID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"academic_year,omitempty"`
	Institution  *Institution    `gorm:"foreignKey:InstitutionID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"institution,omitempty"`
	Teacher      *Profile        `gorm:"foreignKey:TeacherID;references:UserID" json:"teacher,omitempty"`
	Subject      *Subject        `gorm:"foreignKey:SubjectID" json:"subject,omitempty"`
	Class        *Class          `gorm:"foreignKey:ClassID" json:"class,omitempty"`
	Schedules    []ClassSchedule `gorm:"foreignKey:TeachingAllocationID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"schedules,omitempty"`
}

// ClassSchedule (Detail hari & jam, menempel pada TeachingAllocation)
type ClassSchedule struct {
	BaseEntity
	TeachingAllocationID string              `gorm:"type:uuid;index;not null" json:"teaching_allocation_id"`
	DayOfWeek            string              `gorm:"not null" json:"day_of_week"`
	StartTime            string              `gorm:"not null" json:"start_time"`
	EndTime              string              `gorm:"not null" json:"end_time"`
	RoomName             string              `json:"room_name"`
	PesantrenquEventID   int                 `json:"pesantrenqu_event_id"`
	TeachingAllocation   *TeachingAllocation `gorm:"foreignKey:TeachingAllocationID" json:"teaching_allocation,omitempty"`
}

// DTO Input & Filter
type AllocationFilter struct {
	InstitutionID  string
	AcademicYearID string
	ClassID        string
	TeacherID      string
	SubjectID      string
}

type CreateAllocationInput struct {
	AcademicYearID string `json:"academic_year_id" binding:"required"`
	TeacherID      string `json:"teacher_id" binding:"required"`
	SubjectID      string `json:"subject_id" binding:"required"`
	ClassID        string `json:"class_id" binding:"required"`
}

type AddScheduleInput struct {
	DayOfWeek          string `json:"day_of_week" binding:"required"`
	StartTime          string `json:"start_time" binding:"required"`
	EndTime            string `json:"end_time" binding:"required"`
	RoomName           string `json:"room_name"`
	PesantrenquEventID int    `json:"pesantrenqu_event_id"`
}

// Kontrak Repository
type ScheduleRepository interface {
	FetchAllocations(ctx context.Context, filter AllocationFilter) ([]TeachingAllocation, error)
	GetByID(ctx context.Context, id string) (*TeachingAllocation, error)
	CreateAllocation(ctx context.Context, a *TeachingAllocation) error
	DeleteAllocation(ctx context.Context, id string) error
	CheckTeacherConflict(ctx context.Context, teacherID, academicYearID, dayOfWeek, startTime, endTime string) (bool, error)
	AddSchedule(ctx context.Context, cs *ClassSchedule) error
	DeleteSchedule(ctx context.Context, id string) error
	FetchAllClassesForMatrix(ctx context.Context, instID string) ([]*Class, error)

	FetchSessions(ctx context.Context, instID string) ([]ClassSession, error)
	CreateSession(ctx context.Context, session *ClassSession) error
	DeleteSession(ctx context.Context, id string) error
}

// Kontrak Usecase
type ScheduleUsecase interface {
	GetAllocations(ctx context.Context, filter AllocationFilter) ([]TeachingAllocation, error)
	CreateAllocation(ctx context.Context, instID string, operator string, input CreateAllocationInput) (*TeachingAllocation, error)
	DeleteAllocation(ctx context.Context, id string) error
	ExportScheduleMatrixExcel(ctx context.Context, instID, academicYearID string) (*bytes.Buffer, error)
	ExportScheduleMatrixPDF(ctx context.Context, instID, academicYearID string) (*bytes.Buffer, error)

	AddSchedule(ctx context.Context, allocationID, operator string, input AddScheduleInput) error
	DeleteSchedule(ctx context.Context, id string) error

	GetSessions(ctx context.Context, instID string) ([]ClassSession, error)
	CreateSession(ctx context.Context, instID string, input CreateClassSessionInput) (*ClassSession, error)
	DeleteSession(ctx context.Context, id string) error
}
