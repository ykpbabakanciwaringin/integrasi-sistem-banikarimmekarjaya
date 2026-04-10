// LOKASI: internal/domain/exam_interface.go
package domain

import (
	"bytes"
	"context"
	"mime/multipart"
)

// --- INTERFACES (CONTRACTS) ---

type ExamEventRepository interface {
	CreateEvent(ctx context.Context, e *ExamEvent) error
	GetEventByID(ctx context.Context, id string) (*ExamEvent, error)
	FetchEvents(ctx context.Context, filter EventFilter) ([]ExamEvent, int64, error)
	UpdateEvent(ctx context.Context, e *ExamEvent) error
	DeleteEvent(ctx context.Context, id string) error

	// [FITUR BARU] Menarik data peserta yang unik untuk cetak kartu di level Event
	FetchEventCardData(ctx context.Context, eventID string) ([]map[string]interface{}, error)
}

type ExamEventUsecase interface {
	CreateEvent(ctx context.Context, instID string, input CreateEventInput) error
	GetEvents(ctx context.Context, filter EventFilter) ([]ExamEvent, int64, int, error)
	GetEventDetail(ctx context.Context, id string) (*ExamEvent, error)
	UpdateEvent(ctx context.Context, id string, input CreateEventInput) error
	DeleteEvent(ctx context.Context, id string) error
	GenerateSEBConfig(ctx context.Context, id string) (*bytes.Buffer, error)

	// [FITUR BARU] Usecase untuk mengunduh/mencetak kartu di level Event
	DownloadEventExamCards(ctx context.Context, eventID string) ([]map[string]interface{}, error)
}

type ExamExecutionRepository interface {
	GetActiveSessionByToken(ctx context.Context, token string) (*ExamSession, error)
	GetSessionByID(ctx context.Context, id string) (*ExamSession, error)
	GetParticipant(ctx context.Context, sessionID string, studentID string) (*ExamParticipant, error)
	SaveAnswer(ctx context.Context, ans *StudentAnswer) error
	GetAnswersBySession(ctx context.Context, sessionID, studentID string) ([]StudentAnswer, error)
	UpdateParticipantScore(ctx context.Context, sessionID, studentID string, score float64) error
	UpdateParticipantStatus(ctx context.Context, sessionID, studentID string, status string) error
}

type ExamExecutionUsecase interface {
	JoinExam(ctx context.Context, token string, studentID string) (*JoinExamResponse, error)
	SubmitAnswer(ctx context.Context, input SubmitAnswerInput) error
	FinishExam(ctx context.Context, sessionID, studentID string) (*ExamResultResponse, error)
}

type ExamSessionRepository interface {
	CreateSession(ctx context.Context, s *ExamSession) error
	GetSessionByID(ctx context.Context, id string) (*ExamSession, error)
	FetchSessions(ctx context.Context, filter SessionFilter) ([]ExamSession, int64, error)
	UpdateSession(ctx context.Context, s *ExamSession) error
	DeleteSession(ctx context.Context, id string) error
	UpdateSessionStatus(ctx context.Context, id string, isActive bool) error
	RegisterParticipant(ctx context.Context, p *ExamParticipant) error
	RegisterBulkParticipants(ctx context.Context, participants []ExamParticipant) error
	GetParticipantByExamNumber(ctx context.Context, examNumber string) (*ExamParticipant, error)
	FetchParticipants(ctx context.Context, sessionID string, filter ParticipantFilter) ([]ExamParticipant, int64, error)
	GetParticipantStats(ctx context.Context, sessionID string) (*ParticipantStats, error)
	UpdateParticipantStatus(ctx context.Context, sessionID string, studentID string, newStatus string) error
	GetParticipant(ctx context.Context, sessionID string, studentID string) (*ExamParticipant, error)

	AssignProctors(ctx context.Context, supervisors []ExamSupervisor, proctors []ExamProctor) error

	RemoveProctor(ctx context.Context, sessionID, teacherID string) error
	ClearProctors(ctx context.Context, sessionID string) error
	GetStudentIDsByUsernames(ctx context.Context, usernames []string) (map[string]string, error)
	UpdateStudentPassword(ctx context.Context, studentID string, hash string, plain string) error
	UpdateStudentPhoto(ctx context.Context, identifier string, photoPath string) error
	FetchCardData(ctx context.Context, sessionID string) ([]map[string]interface{}, error)
	DeleteParticipant(ctx context.Context, sessionID, studentID string) error
	CreateBulkSessions(ctx context.Context, sessions []ExamSession) error
}

type ExamSessionUsecase interface {
	CreateSession(ctx context.Context, teacherID, instID string, input CreateSessionInput) error
	GetTeacherSessions(ctx context.Context, filter SessionFilter) ([]ExamSession, int64, int, error)
	GetSessionDetail(ctx context.Context, id string) (*ExamSession, error)
	UpdateSession(ctx context.Context, id string, input CreateSessionInput) error
	DeleteSession(ctx context.Context, id string) error
	StopSession(ctx context.Context, id string) error
	ResumeSession(ctx context.Context, id string) error
	FetchParticipants(ctx context.Context, sessionID string, filter ParticipantFilter) ([]ExamParticipant, int64, *ParticipantStats, error)
	GetSessionParticipants(ctx context.Context, sessionID, userID, role string, filter ParticipantFilter) ([]ExamParticipant, int64, *ParticipantStats, error)
	AddParticipant(ctx context.Context, sessionID string, input AddParticipantInput) error
	AddBulkParticipants(ctx context.Context, sessionID string, input AddBulkParticipantsInput) error
	ImportParticipants(ctx context.Context, sessionID string, file *multipart.FileHeader) (int, error)
	RemoveParticipant(ctx context.Context, sessionID, studentID string) error

	ManageProctors(ctx context.Context, sessionID string, supervisorIDs []string, proctorIDs []string) error

	BulkUploadPhotos(fileHeader *multipart.FileHeader) (int, []string, error)
	GeneratePhotoReferenceExcel(ctx context.Context, sessionID string) (*bytes.Buffer, error)
	GetParticipantsForCards(ctx context.Context, sessionID string) ([]map[string]interface{}, error)
	DownloadExamCards(ctx context.Context, sessionID string) ([]map[string]interface{}, error)
	ResetParticipantLogin(ctx context.Context, sessionID string, studentID string) error
	GenerateNewPassword(ctx context.Context, studentID string) error
	GenerateBulkNewPassword(ctx context.Context, sessionID string, studentIDs []string) error
	ToggleBlockParticipant(ctx context.Context, sessionID string, studentID string) error
	ImportSessionsFromExcel(ctx context.Context, eventID string, instID string, file *multipart.FileHeader) (int, []string, error)
	ExportSessionsExcel(ctx context.Context, filter SessionFilter) (*bytes.Buffer, error)
	ExportSessionsPDF(ctx context.Context, filter SessionFilter) (*bytes.Buffer, error)
	DownloadBeritaAcaraPDF(ctx context.Context, sessionID string) (*bytes.Buffer, string, error)
	DownloadParticipantTemplate(ctx context.Context, sessionID string) (*bytes.Buffer, error)
}
