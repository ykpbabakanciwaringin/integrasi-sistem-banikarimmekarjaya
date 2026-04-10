// LOKASI: internal/domain/report.go
package domain

import (
	"context"
	"errors"
	"time"

	"gorm.io/gorm"
)

var (
	ErrForbiddenReportAccess = errors.New("AKSES DITOLAK: Anda bukan wali kelas untuk kelas ini")
)

type StudentReport struct {
	ID string `gorm:"type:uuid;primary_key;default:uuid_generate_v4()" json:"id"`

	StudentID string `gorm:"type:uuid;not null;uniqueIndex:idx_student_class_report" json:"student_id"`
	ClassID   string `gorm:"type:uuid;not null;uniqueIndex:idx_student_class_report" json:"class_id"`

	Sick       int    `json:"sick" gorm:"default:0"`
	Permission int    `json:"permission" gorm:"default:0"`
	Absent     int    `json:"absent" gorm:"default:0"`
	Note       string `json:"note" gorm:"type:text"`
	IsPromoted bool   `json:"is_promoted" gorm:"default:true"`

	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	Student *User  `gorm:"foreignKey:StudentID" json:"-"`
	Class   *Class `gorm:"foreignKey:ClassID" json:"-"`
}

// =======================================================
// DTO & STRUKTUR RESPON MATANG UNTUK LEGER & RAPOR
// =======================================================

type ClassLegerResponse struct {
	ClassInfo   ClassInfo      `json:"class_info"`
	SubjectList []string       `json:"subject_list"`
	Students    []StudentLeger `json:"students"`
}

type ClassInfo struct {
	ID              string `json:"id"`
	Name            string `json:"name"`
	Level           string `json:"level"`
	TeacherName     string `json:"teacher_name"`
	InstitutionName string `json:"institution_name"`
}

type StudentLeger struct {
	StudentID   string             `json:"student_id"`
	StudentName string             `json:"student_name"`
	Username    string             `json:"username"`
	NISN        string             `json:"nisn"`
	Attendance  *StudentReport     `json:"attendance"`
	Grades      map[string]float64 `json:"grades"`
}

type GradeSummaryRaw struct {
	StudentID   string  `gorm:"column:student_id"`
	StudentName string  `gorm:"column:student_name"`
	Username    string  `gorm:"column:username"`
	NISN        string  `gorm:"column:nisn"`
	SubjectName string  `gorm:"column:subject_name"`
	FinalScore  float64 `gorm:"column:final_score"`
}

// =======================================================
// KONTRAK REPOSITORY
// =======================================================

type ReportRepository interface {
	Upsert(ctx context.Context, r *StudentReport) error
	GetByClass(ctx context.Context, classID string) ([]StudentReport, error)
	GetClassGradesSummary(ctx context.Context, classID string) ([]GradeSummaryRaw, error)
}
