// LOKASI: internal/domain/assignment.go
package domain

import (
	"bytes"
	"context"
	"mime/multipart"
)

// =======================================================
// 1. ENTITAS DATABASE (Tabel Assignments)
// =======================================================

type Assignment struct {
	BaseEntity
	InstitutionID string  `gorm:"type:uuid;index;not null" json:"institution_id"`
	TeacherID     string  `gorm:"type:uuid;index;not null" json:"teacher_id"`
	SubjectID     string  `gorm:"type:uuid;index;not null" json:"subject_id"`
	ClassID       string  `gorm:"type:uuid;index;not null" json:"class_id"`
	KKM           float64 `gorm:"type:decimal(5,2);default:75" json:"kkm"`

	Institution *Institution `gorm:"foreignKey:InstitutionID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"institution,omitempty"`
	Teacher     *Profile     `gorm:"foreignKey:TeacherID;references:UserID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"teacher,omitempty"`
	Subject     *Subject     `gorm:"foreignKey:SubjectID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"subject,omitempty"`
	Class       *Class       `gorm:"foreignKey:ClassID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"class,omitempty"`
}

// =======================================================
// 2. DATA TRANSFER OBJECTS (DTOs)
// =======================================================

type CreateAssignmentInput struct {
	InstitutionID string  `json:"institution_id"`
	TeacherID     string  `json:"teacher_id" binding:"required"`
	SubjectID     string  `json:"subject_id" binding:"required"`
	ClassID       string  `json:"class_id" binding:"required"`
	KKM           float64 `json:"kkm"`
}

type UpdateKKMInput struct {
	KKM float64 `json:"kkm" binding:"required,min=0,max=100"`
}

type AssignmentFilter struct {
	InstitutionID string
	TeacherID     string
	ClassID       string
	SubjectID     string
	Search        string
	Page          int
	Limit         int
}

type AssignmentDetail struct {
	ID              string  `json:"id"`
	SubjectName     string  `json:"subject_name"`
	ClassName       string  `json:"class_name"`
	TeacherName     string  `json:"teacher_name"`
	InstitutionName string  `json:"institution_name"`
	KKM             float64 `json:"kkm"`
}

type StudentGrade struct {
	StudentID       string  `json:"student_id"`
	StudentName     string  `json:"student_name"`
	StudentUsername string  `json:"student_username"`
	StudentGender   string  `json:"student_gender"`
	ExamStatus      string  `json:"exam_status"`
	CorrectCount    int     `json:"correct_count"`
	WrongCount      int     `json:"wrong_count"`
	FinalScore      float64 `json:"final_score"`
}

// DTO Khusus untuk Transaksi Master Jadwal
type MasterScheduleDTO struct {
	TeacherID string
	SubjectID string
	ClassID   string
	KKM       float64
	Day       string
	StartTime string
	EndTime   string
}

// =======================================================
// 3. KONTRAK ANTARMUKA (Interfaces)
// =======================================================

type AssignmentRepository interface {
	Fetch(ctx context.Context, filter AssignmentFilter) ([]Assignment, int64, error)
	GetByID(ctx context.Context, id string) (*Assignment, error)
	Create(ctx context.Context, assignment *Assignment) error
	UpdateKKM(ctx context.Context, id string, kkm float64) error
	Delete(ctx context.Context, id string) error
	GetStudentGrades(ctx context.Context, assignmentID string) ([]StudentGrade, error)
	FetchReferencesForTemplate(ctx context.Context, instID string) ([]Class, []Subject, []User, []ClassSession, error)
	BatchImportMasterSchedule(ctx context.Context, instID string, payload []MasterScheduleDTO) error
}

type AssignmentUsecase interface {
	GetAssignments(ctx context.Context, filter AssignmentFilter) (PaginationResult, error)
	GetAssignmentDetail(ctx context.Context, id string) (*AssignmentDetail, error)
	CreateAssignment(ctx context.Context, input CreateAssignmentInput, operatorID string) (*Assignment, error)
	UpdateKKM(ctx context.Context, id string, input UpdateKKMInput) error
	DeleteAssignment(ctx context.Context, id string) error

	GetAssignmentGrades(ctx context.Context, assignmentID string) ([]StudentGrade, error)
	DownloadRekap(ctx context.Context, assignmentID string) (*bytes.Buffer, error)
	DownloadRekapPDF(ctx context.Context, assignmentID string) (*bytes.Buffer, error)

	DownloadAssignmentTemplate(ctx context.Context, instID string) (*bytes.Buffer, error)
	ExportAssignmentsExcel(ctx context.Context, filter AssignmentFilter) (*bytes.Buffer, error)
	ExportAssignmentsPDF(ctx context.Context, filter AssignmentFilter) (*bytes.Buffer, error)
	ImportAssignments(ctx context.Context, instID string, file multipart.File) (int, error)
}
