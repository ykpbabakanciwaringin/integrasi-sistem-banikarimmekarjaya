// LOKASI: internal/domain/exam_entity.go
package domain

import (
	"time"
)

// --- ENTITIES (DATABASE MODELS) ---

// Induk Kegiatan Ujian (Misal: PAS Ganjil 2024)
type ExamEvent struct {
	BaseEntity
	InstitutionID string    `gorm:"type:uuid;not null;index" json:"institution_id"`
	Title         string    `gorm:"type:varchar(255);not null" json:"title"`
	Description   string    `gorm:"type:text" json:"description"`
	StartDate     time.Time `gorm:"not null" json:"start_date"`
	EndDate       time.Time `gorm:"not null" json:"end_date"`
	RoomCount     int       `gorm:"default:1;not null" json:"room_count"`
	SubjectCount  int       `gorm:"default:1;not null" json:"subject_count"`
	IsActive      bool      `gorm:"default:true" json:"is_active"`
	IsSEBRequired bool      `gorm:"default:false" json:"is_seb_required"`
	Status        string    `gorm:"type:varchar(50);default:'DRAFT'" json:"status"`

	Institution *Institution  `gorm:"foreignKey:InstitutionID" json:"institution,omitempty"`
	Sessions    []ExamSession `gorm:"foreignKey:ExamEventID" json:"sessions,omitempty"`
}

type ExamSession struct {
	BaseEntity
	ExamEventID      string    `gorm:"type:uuid;index;not null" json:"exam_event_id"`
	InstitutionID    string    `gorm:"type:uuid;index" json:"institution_id"`
	Title            string    `json:"title"`
	Token            string    `gorm:"size:6;index" json:"token"`
	StartTime        time.Time `json:"start_time"`
	EndTime          time.Time `json:"end_time"`
	DurationMin      int       `json:"duration_min"`
	SubjectList      string    `gorm:"type:text" json:"subject_list"`
	IsActive         bool      `gorm:"default:false" json:"is_active"`
	ParticipantCount int       `gorm:"->;column:participant_count" json:"participant_count"`

	Institution *Institution `gorm:"foreignKey:InstitutionID" json:"institution,omitempty"`
	ExamEvent   *ExamEvent   `gorm:"foreignKey:ExamEventID" json:"exam_event,omitempty"`

	// [PEMISAHAN PENGAWAS DAN PROKTOR]
	Supervisors []ExamSupervisor `gorm:"foreignKey:ExamSessionID;constraint:OnDelete:CASCADE;" json:"supervisors,omitempty"`
	Proctors    []ExamProctor    `gorm:"foreignKey:ExamSessionID;constraint:OnDelete:CASCADE;" json:"proctors,omitempty"`
}

// Entitas Khusus PENGAWAS RUANGAN
type ExamSupervisor struct {
	ID            string   `gorm:"type:uuid;default:uuid_generate_v4();primaryKey" json:"id"`
	ExamSessionID string   `gorm:"type:uuid;index;not null" json:"exam_session_id"`
	TeacherID     string   `gorm:"type:uuid;index;not null" json:"teacher_id"`
	Teacher       *Profile `gorm:"foreignKey:TeacherID;references:UserID" json:"teacher,omitempty"`
}

// Entitas Khusus PROKTOR / TEKNISI
type ExamProctor struct {
	ID            string   `gorm:"type:uuid;default:uuid_generate_v4();primaryKey" json:"id"`
	ExamSessionID string   `gorm:"type:uuid;index;not null" json:"exam_session_id"`
	TeacherID     string   `gorm:"type:uuid;index;not null" json:"teacher_id"`
	Teacher       *Profile `gorm:"foreignKey:TeacherID;references:UserID" json:"teacher,omitempty"`
}

type ExamParticipant struct {
	ID              string     `gorm:"primaryKey;type:uuid;default:uuid_generate_v4()" json:"id"`
	ExamSessionID   string     `gorm:"type:uuid;not null;uniqueIndex:idx_session_student" json:"exam_session_id"`
	StudentID       string     `gorm:"type:uuid;not null;uniqueIndex:idx_session_student" json:"student_id"`
	ExamNumber      string     `gorm:"type:varchar(50)" json:"exam_number"`
	Status          string     `gorm:"type:varchar(20);default:'REGISTERED'" json:"status"`
	IPAddress       string     `gorm:"type:varchar(45)" json:"ip_address"`
	LastHeartbeatAt *time.Time `json:"last_heartbeat_at"`
	StartedAt       *time.Time `json:"started_at"`
	FinishedAt      *time.Time `json:"finished_at"`
	FinalScore      float64    `gorm:"default:0" json:"final_score"`
	CreatedAt       time.Time  `gorm:"autoCreateTime" json:"created_at"`

	Student *User `gorm:"foreignKey:StudentID" json:"student,omitempty"`

	Subtests []ParticipantSubtest `gorm:"foreignKey:ExamParticipantID;constraint:OnDelete:CASCADE;" json:"subtests,omitempty"`
}

type ParticipantSubtest struct {
	ID                string     `gorm:"primaryKey;type:uuid;default:uuid_generate_v4()" json:"id"`
	ExamParticipantID string     `gorm:"type:uuid;index;not null" json:"exam_participant_id"`
	QuestionBankID    string     `gorm:"type:uuid;index;not null" json:"question_bank_id"`
	OrderNum          int        `gorm:"not null;default:1" json:"order_num"`
	DurationMin       int        `gorm:"default:0" json:"duration_min"`
	Status            string     `gorm:"type:varchar(20);default:'LOCKED'" json:"status"`
	StartedAt         *time.Time `json:"started_at"`
	FinishedAt        *time.Time `json:"finished_at"`
	Score             float64    `gorm:"default:0" json:"score"`

	QuestionBank *QuestionBank `gorm:"foreignKey:QuestionBankID" json:"question_bank,omitempty"`
}

type StudentAnswer struct {
	ID                   string    `gorm:"type:uuid;default:uuid_generate_v4();primaryKey" json:"id"`
	ExamSessionID        string    `gorm:"type:uuid;index;uniqueIndex:idx_student_answer_unique" json:"exam_session_id"`
	StudentID            string    `gorm:"type:uuid;index;uniqueIndex:idx_student_answer_unique" json:"student_id"`
	QuestionID           string    `gorm:"type:uuid;index;uniqueIndex:idx_student_answer_unique" json:"question_id"`
	ParticipantSubtestID string    `gorm:"type:uuid;index;not null" json:"participant_subtest_id"`
	AnswerGiven          string    `json:"answer_given"`
	IsCorrect            bool      `json:"is_correct"`
	Score                float64   `json:"score"`
	CreatedAt            time.Time `json:"created_at"`
}

type ExamViolationLog struct {
	ID            string    `gorm:"type:uuid;default:uuid_generate_v4();primaryKey" json:"id"`
	ExamSessionID string    `gorm:"type:uuid;index;not null" json:"exam_session_id"`
	StudentID     string    `gorm:"type:uuid;index;not null" json:"student_id"`
	ViolationType string    `gorm:"type:varchar(100)" json:"violation_type"`
	SnapshotUrl   string    `gorm:"type:text" json:"snapshot_url"`
	CreatedAt     time.Time `gorm:"autoCreateTime" json:"created_at"`
}
