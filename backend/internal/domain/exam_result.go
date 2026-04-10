// LOKASI: internal/domain/exam_result.go
package domain

import (
	"bytes"
	"context"
	"time"
)

// [PEMBAHARUAN FASE 4] Struktur Matriks Nilai (Mendukung Multi-Mapel)
type CBTResultDetail struct {
	StudentID   string         `json:"student_id"`
	StudentName string         `json:"student_name"`
	Username    string         `json:"student_username"`
	NISN        string         `json:"nisn"`
	Gender      string         `json:"gender"`
	ExamNumber  string         `json:"exam_number"`
	ClassName   string         `json:"class_name"`
	Status      string         `json:"exam_status"`
	StartedAt   *time.Time     `json:"started_at"`
	FinishedAt  *time.Time     `json:"finished_at"`
	FinalScore  float64        `json:"final_score"` // Rata-rata Total Sesi
	Subtests    []SubtestScore `json:"subtests"`    // [TAMBAHAN] Nilai per Mata Pelajaran
}

// [TAMBAHAN FASE 4] Entitas pendukung struktur Matriks
type SubtestScore struct {
	SubjectName string  `json:"subject_name"`
	Score       float64 `json:"score"`
	Status      string  `json:"status"`
}

// =====================================================================
// INTERFACE (KONTRAK) TETAP DIPERTAHANKAN SESUAI ASLINYA
// =====================================================================

type ExamResultRepository interface {
	GetCBTResults(ctx context.Context, sessionID string) ([]CBTResultDetail, error)
	GetSessionInfoForExport(ctx context.Context, sessionID string) (*ExamSession, error)
}

type ExamResultUsecase interface {
	GetCBTResults(ctx context.Context, sessionID, userID, role string) ([]CBTResultDetail, error)
	ExportCBTResultsExcel(ctx context.Context, sessionID, userID, role string) (*bytes.Buffer, string, error)
	ExportCBTResultsPDF(ctx context.Context, sessionID, userID, role string) (*bytes.Buffer, string, error)
}
