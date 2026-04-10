// LOKASI: internal/domain/question.go
package domain

import (
	"bytes"
	"context"
	"mime/multipart"

	"gorm.io/gorm"
)

// ============================================================================
// 1. CONSTANTS
// ============================================================================

const (
	QuestionTypePG    = "PG"
	QuestionTypeEssay = "ESSAY"
	QuestionTypeMixed = "MIXED"
)

// ============================================================================
// 2. ENTITIES (Database Models)
// ============================================================================

// QuestionContent merepresentasikan struktur JSON di dalam database
type QuestionContent struct {
	Question string            `json:"question"`
	Options  map[string]string `json:"options,omitempty"` // A, B, C, D, E (Kosong jika Essay)
	ImageURL string            `json:"image_url,omitempty"`
}

// QuestionBank adalah entitas utama untuk Paket Soal dan Butir Soal
type QuestionBank struct {
	BaseEntity
	DeletedAt     gorm.DeletedAt `gorm:"index" json:"-"`
	InstitutionID string         `gorm:"type:uuid;index" json:"institution_id"`
	TeacherID     string         `gorm:"type:uuid;index" json:"teacher_id"`
	SubjectID     string         `gorm:"type:uuid;index" json:"subject_id"`

	ParentID *string `gorm:"type:uuid;index" json:"parent_id"`

	GradeLevel string `json:"grade_level"`
	Title      string `json:"title"`
	Type       string `json:"type"`

	Content QuestionContent `gorm:"type:jsonb;serializer:json" json:"content"`

	AnswerKey   string  `gorm:"type:varchar(255)" json:"answer_key"`
	ScoreWeight float64 `gorm:"type:decimal(5,2)" json:"score_weight"`

	ItemCount int64 `gorm:"->;column:item_count" json:"item_count"`

	// Relasi
	Subject     *Subject       `gorm:"foreignKey:SubjectID" json:"subject,omitempty"`
	Teacher     *User          `gorm:"foreignKey:TeacherID" json:"teacher,omitempty"`
	Institution *Institution   `gorm:"foreignKey:InstitutionID" json:"institution,omitempty"`
	Items       []QuestionBank `gorm:"foreignKey:ParentID" json:"items,omitempty"`
}

// ============================================================================
// 3. DTOs (Data Transfer Objects) & FILTERS
// ============================================================================

type QuestionFilter struct {
	InstitutionID string
	TeacherID     string
	SubjectID     string
	Search        string
	Page          int
	Limit         int
}

type CreatePacketInput struct {
	SubjectID     string `json:"subject_id" binding:"required"`
	Title         string `json:"title" binding:"required"`
	GradeLevel    string `json:"grade_level" binding:"required"`
	InstitutionID string `json:"institution_id"`
}

type UpdatePacketInput struct {
	SubjectID  string `json:"subject_id"`
	Title      string `json:"title"`
	GradeLevel string `json:"grade_level"`
}

type CreateItemInput struct {
	ParentID    string  `json:"parent_id" binding:"required"`
	Type        string  `json:"type" binding:"required,oneof=PG ESSAY"`
	Question    string  `json:"question" binding:"required"`
	OptionA     string  `json:"option_a"`
	OptionB     string  `json:"option_b"`
	OptionC     string  `json:"option_c"`
	OptionD     string  `json:"option_d"`
	OptionE     string  `json:"option_e"`
	AnswerKey   string  `json:"answer_key" binding:"required"`
	ScoreWeight float64 `json:"score_weight" binding:"required"`
	ImageURL    string  `json:"image_url"`
}

// ============================================================================
// 4. INTERFACES (Contracts)
// ============================================================================

// Segregasi Interface untuk Manajemen Paket Soal
type QuestionPacketUsecase interface {
	GetPackets(ctx context.Context, filter QuestionFilter) ([]QuestionBank, int64, error)
	GetPacketDetail(ctx context.Context, id string) (*QuestionBank, error)
	CreatePacket(ctx context.Context, teacherID, instID string, input CreatePacketInput) error
	UpdatePacket(ctx context.Context, id, operatorID, role string, input UpdatePacketInput) error
	DeletePacket(ctx context.Context, id, operatorID, role string) error

	ExportQuestions(ctx context.Context, filter QuestionFilter) (*bytes.Buffer, error)
	ExportQuestionsPDF(ctx context.Context, filter QuestionFilter) (*bytes.Buffer, error)

	// Import Batch & Export List Paket Soal
	ImportPackets(ctx context.Context, instID, operatorID string, file multipart.File) (int, error)
	ExportPacketList(ctx context.Context, filter QuestionFilter) (*bytes.Buffer, error)
	DownloadTemplateBatch(ctx context.Context, instID string) (*bytes.Buffer, error)
}

// Segregasi Interface untuk Manajemen Butir Soal
type QuestionItemUsecase interface {
	CreateItem(ctx context.Context, teacherID, instID string, input CreateItemInput) error
	UpdateItem(ctx context.Context, id, teacherID, role string, input CreateItemInput) error
	DeleteItem(ctx context.Context, id, operatorID, role string) error
	ImportQuestions(ctx context.Context, parentID string, file multipart.File) (int, error)
}

// Interface gabungan untuk memenuhi kebutuhan Handler
type QuestionUsecase interface {
	QuestionPacketUsecase
	QuestionItemUsecase
}

// Interface akses ke database (Repository)
type QuestionRepository interface {
	FetchPackets(ctx context.Context, filter QuestionFilter) ([]QuestionBank, int64, error)
	FetchPacketsWithItems(ctx context.Context, filter QuestionFilter) ([]QuestionBank, error)
	GetPacketByID(ctx context.Context, id string) (*QuestionBank, error)
	GetItemByID(ctx context.Context, id string) (*QuestionBank, error)
	CreatePacket(ctx context.Context, q *QuestionBank) error
	CreateItem(ctx context.Context, q *QuestionBank) error

	BulkCreateItem(ctx context.Context, items []*QuestionBank) error
	// Bulk Insert untuk Paket Soal
	BulkCreatePackets(ctx context.Context, packets []*QuestionBank) error

	UpdatePacket(ctx context.Context, q *QuestionBank) error
	UpdateItem(ctx context.Context, q *QuestionBank) error
	DeletePacket(ctx context.Context, id string) error
	DeleteItem(ctx context.Context, id string) error
	IsTeacherAssignedToSubject(ctx context.Context, teacherID, subjectID string) bool
}
