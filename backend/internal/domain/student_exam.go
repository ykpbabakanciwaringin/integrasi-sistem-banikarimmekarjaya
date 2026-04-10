// LOKASI: internal/domain/student_exam.go
package domain

import (
	"context"
	"time"
)

// [PEMBARUAN] DTO untuk Metadata Subtes (Mata Pelajaran) untuk navigasi UI siswa
type SubtestInfo struct {
	ID          string     `json:"id"`
	SubjectName string     `json:"subject_name"`
	OrderNum    int        `json:"order_num"`
	DurationMin int        `json:"duration_min"`
	Status      string     `json:"status"` // LOCKED, ONGOING, FINISHED
	StartedAt   *time.Time `json:"started_at"`
}

// [PEMBARUAN] Bundle dipecah menjadi Meta dan Soal Aktif (Lazy Loading)
type StudentExamBundle struct {
	SessionID     string    `json:"session_id"`
	Title         string    `json:"title"`
	SessionEnd    time.Time `json:"session_end"`
	IsSEBRequired bool      `json:"is_seb_required"`
	Status        string    `json:"status"`

	// Daftar lengkap mata pelajaran untuk navigasi siswa di Sidebar
	Subtests []SubtestInfo `json:"subtests"`

	// Hanya memuat data untuk mapel yang sedang dikerjakan saat ini
	ActiveSubtestID string                `json:"active_subtest_id"`
	ActiveSubject   string                `json:"active_subject"`
	TimeRemaining   int                   `json:"time_remaining"` // Sisa waktu spesifik untuk mapel ini atau global
	Questions       []StudentQuestionItem `json:"questions"`
	LastAnswers     map[string]string     `json:"last_answers"`
}

type StudentQuestionItem struct {
	ID       string          `json:"id"`
	Type     string          `json:"type"`
	Content  QuestionContent `json:"content"`
	OrderNum int             `json:"order_num"`
}

// [PEMBARUAN] Penambahan SubtestID agar spesifik per mapel
type StudentAnswerItem struct {
	QuestionID string `json:"question_id" binding:"required"`
	SubtestID  string `json:"subtest_id" binding:"required"` // Wajib ada agar tahu ini jawaban mapel mana
	Answer     string `json:"answer"`
}

type BulkSubmitAnswerInput struct {
	SessionID string              `json:"session_id" binding:"required"`
	Answers   []StudentAnswerItem `json:"answers" binding:"required,dive"`
}

type ExamHeartbeatInput struct {
	SessionID      string `json:"session_id" binding:"required"`
	ActiveSubtest  string `json:"active_subtest"` // Melacak mapel apa yang sedang dibuka siswa
	ViolationCount int    `json:"violation_count"`
	SnapshotBase64 string `json:"snapshot_base64,omitempty"`
	ViolationType  string `json:"violation_type,omitempty"`
}

type ExamHeartbeatResponse struct {
	Action        string `json:"action"`
	TimeRemaining int    `json:"time_remaining"`
	Message       string `json:"message"`
}

type StudentExamHistoryResponse struct {
	SessionID    string     `json:"session_id"`
	Title        string     `json:"title"`
	SubjectName  string     `json:"subject_name"`
	StartedAt    *time.Time `json:"started_at"`
	FinishedAt   *time.Time `json:"finished_at"`
	DurationUsed int        `json:"duration_used"`
	Score        *float64   `json:"score"`
	PassingGrade float64    `json:"passing_grade"`
	Status       string     `json:"status"`
}

// --- INTERFACES ---

type StudentExamRepository interface {
	VerifyStudentAccess(ctx context.Context, sessionID, studentID string) (*ExamSession, *ExamParticipant, error)
	GetQuestionsForStudent(ctx context.Context, questionBankID string) ([]QuestionBank, error)
	BulkSaveAnswers(ctx context.Context, sessionID, studentID string, answers []StudentAnswer) error
	UpdateParticipantState(ctx context.Context, sessionID, studentID, status string) error
	UpdateParticipantActivity(ctx context.Context, sessionID, studentID, ip string) error
	GetSEBStatusBySession(ctx context.Context, sessionID string) (bool, error)
	GetStudentHistory(ctx context.Context, studentID string) ([]StudentExamHistoryResponse, error)
	LogViolation(ctx context.Context, log ExamViolationLog) error
	SetSubtestOngoing(ctx context.Context, subtestID string) error

	// [PEMBARUAN] Menghapus fungsi CalculateAndFinish yang lama dari Interface,
	// diganti menjadi fungsi murni Update saja untuk mencegah kebocoran logika bisnis
	UpdateSubtestScoreAndFinish(ctx context.Context, subtestID string, score float64) error
	UpdateParticipantFinalScoreAndFinish(ctx context.Context, sessionID, studentID string, finalScore float64) error

	// [PEMBARUAN] Menarik kunci jawaban secara mentah untuk keperluan komputasi di Usecase
	GetAnswerKeysByQuestionBank(ctx context.Context, questionBankID string) (map[string]QuestionBank, error)
}

type StudentExamUsecase interface {
	// [PEMBARUAN] StartAndDownloadExam sekarang membutuhkan ID Subtes (targetSubtestID) jika siswa berpindah mapel
	StartAndDownloadExam(ctx context.Context, token, studentID, targetSubtestID string) (*StudentExamBundle, error)
	SyncBulkAnswers(ctx context.Context, studentID string, input BulkSubmitAnswerInput) error
	HeartbeatPing(ctx context.Context, studentID string, input ExamHeartbeatInput) (*ExamHeartbeatResponse, error)
	GetHistory(ctx context.Context, studentID string) ([]StudentExamHistoryResponse, error)

	// [PEMBARUAN] Memungkinkan penyelesaian parsial (per mapel) atau final (seluruh sesi)
	FinishExam(ctx context.Context, sessionID, studentID, subtestID string) error
}
