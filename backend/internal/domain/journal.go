// LOKASI: internal/domain/journal.go
package domain

import (
	"bytes"
	"context"
	"time"

	"gorm.io/gorm"
)

type Journal struct {
	ID                   string         `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	TeachingAllocationID string         `gorm:"type:uuid;not null" json:"teaching_allocation_id"`
	Date                 time.Time      `gorm:"type:date;not null" json:"date"`
	Topic                string         `gorm:"type:varchar(255);not null" json:"topic"`
	Description          string         `gorm:"type:text" json:"description"`
	AttachmentLink       string         `gorm:"type:varchar(500)" json:"attachment_link"`
	HasAssignment        bool           `gorm:"default:false" json:"has_assignment"`
	AssignmentDetail     string         `gorm:"type:text" json:"assignment_detail"`
	StartedAt            *time.Time     `json:"started_at"`
	EndedAt              *time.Time     `json:"ended_at"`
	Status               string         `gorm:"type:varchar(50);default:'ONGOING'" json:"status"` // ONGOING, SUBMITTED, VERIFIED
	VerifiedBy           *string        `gorm:"type:uuid" json:"verified_by"`
	CreatedAt            time.Time      `json:"created_at"`
	UpdatedAt            time.Time      `json:"updated_at"`
	DeletedAt            gorm.DeletedAt `gorm:"index" json:"deleted_at,omitempty"`

	Allocation  *TeachingAllocation `gorm:"foreignKey:TeachingAllocationID" json:"allocation,omitempty"`
	Attendances []Attendance        `gorm:"foreignKey:JournalID" json:"attendances,omitempty"`
}

type Attendance struct {
	ID                 string         `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	JournalID          string         `gorm:"type:uuid;not null" json:"journal_id"`
	StudentID          string         `gorm:"type:uuid;not null" json:"student_id"`
	Status             string         `gorm:"type:varchar(20);not null" json:"status"`
	Note               string         `gorm:"type:varchar(255)" json:"note"`
	Behavior           string         `gorm:"type:varchar(255)" json:"behavior"`
	SyncedToThirdParty bool           `gorm:"default:false" json:"synced_to_third_party"`
	SyncErrorMessage   string         `gorm:"type:text" json:"sync_error_message"`
	CreatedAt          time.Time      `json:"created_at"`
	UpdatedAt          time.Time      `json:"updated_at"`
	DeletedAt          gorm.DeletedAt `gorm:"index" json:"deleted_at,omitempty"`

	Student *JournalStudent `gorm:"foreignKey:StudentID;references:ID" json:"student,omitempty"`
}

type JournalFilter struct {
	BaseFilter
	Month                string
	InstitutionID        string
	TeacherID            string
	ClassID              string
	TeachingAllocationID string
	Status               string
	StartDate            string
	EndDate              string
	Limit                int
}

type ExportRecapRequest struct {
	Type                 string `form:"type" binding:"required"`
	Month                string `form:"month"`
	Format               string `form:"format" binding:"required"`
	InstitutionID        string `form:"institution_id"`
	ClassID              string `form:"class_id"`
	TeachingAllocationID string `form:"teaching_allocation_id"`
}

type CreateJournalInput struct {
	TeachingAllocationID string     `json:"teaching_allocation_id" binding:"required"`
	Date                 string     `json:"date" binding:"required"`
	Topic                string     `json:"topic" binding:"required"`
	Description          string     `json:"description"`
	AttachmentLink       string     `json:"attachment_link"`
	HasAssignment        bool       `json:"has_assignment"`
	AssignmentDetail     string     `json:"assignment_detail"`
	StartedAt            *time.Time `json:"started_at"`
}

type UpdateJournalInput struct {
	Topic            string     `json:"topic"`
	Description      string     `json:"description"`
	AttachmentLink   string     `json:"attachment_link"`
	HasAssignment    bool       `json:"has_assignment"`
	AssignmentDetail string     `json:"assignment_detail"`
	StartedAt        *time.Time `json:"started_at"`
	EndedAt          *time.Time `json:"ended_at"`
}

type SubmitAttendanceInput struct {
	StudentID string `json:"student_id" binding:"required"`
	Status    string `json:"status" binding:"required"`
	Note      string `json:"note"`
	Behavior  string `json:"behavior"`
}

type JournalRepository interface {
	Create(ctx context.Context, journal *Journal) error
	GetByID(ctx context.Context, id string) (*Journal, error)
	GetAll(ctx context.Context, filter JournalFilter) ([]Journal, error)
	Update(ctx context.Context, journal *Journal) error
	Delete(ctx context.Context, id string) error
	SubmitAttendances(ctx context.Context, journalID string, attendances []Attendance) error
	GetAttendances(ctx context.Context, journalID string) ([]Attendance, error)
	GetStudentUsernames(ctx context.Context, studentIDs []string) (map[string]string, error)
	UpdateAttendanceSyncStatus(ctx context.Context, attendanceID string, isSynced bool, errorMessage string) error
	GetEventIDForJournal(ctx context.Context, allocationID string, dayOfWeek string) (int, error)
	GetJournalsByClassAndMonth(ctx context.Context, classID, yearMonth string) ([]Journal, error)
	GetJournalsByInstitutionAndMonth(ctx context.Context, institutionID, yearMonth string) ([]Journal, error)

	GetHolidays(ctx context.Context, instID, monthStr string) ([]Holiday, error)
	GetTeacherAttendances(ctx context.Context, instID, monthStr string) ([]TeacherAttendance, error)
	GetAllocationsByInstitution(ctx context.Context, instID string) ([]TeachingAllocation, error)
	GetInstitutionSettings(ctx context.Context, instID string) (*Institution, error)
}

type JournalUsecase interface {
	CreateJournal(ctx context.Context, operatorID string, input CreateJournalInput) (*Journal, error)
	GetJournalByID(ctx context.Context, id string) (*Journal, error)
	GetJournals(ctx context.Context, filter JournalFilter) ([]Journal, error)
	UpdateJournal(ctx context.Context, id string, input UpdateJournalInput) (*Journal, error)
	DeleteJournal(ctx context.Context, id string) error
	SubmitAttendances(ctx context.Context, journalID string, inputs []SubmitAttendanceInput) error
	GetAttendances(ctx context.Context, journalID string) ([]Attendance, error)
	VerifyJournal(ctx context.Context, journalID string, adminID string) error

	RetrySyncAttendance(ctx context.Context, journalID string) error

	ExportRecap(ctx context.Context, req ExportRecapRequest) (*bytes.Buffer, string, string, error)
}

type JournalProfile struct {
	UserID   string `gorm:"column:user_id;type:uuid;primaryKey"`
	Nisn     string `gorm:"column:nisn"`
	FullName string `gorm:"column:full_name"`
	Gender   string `gorm:"column:gender"`
}

func (JournalProfile) TableName() string {
	return "profiles"
}

type JournalStudent struct {
	ID       string          `gorm:"column:id;type:uuid;primaryKey"`
	Username string          `gorm:"column:username"`
	Profile  *JournalProfile `gorm:"foreignKey:UserID;references:ID"`
}

func (JournalStudent) TableName() string {
	return "users"
}
