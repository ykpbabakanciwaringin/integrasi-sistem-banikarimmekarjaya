// LOKASI: internal/domain/exam_dto.go
package domain

import "time"

// --- FILTER & DATA TRANSFER OBJECT (DTO) ---

// BaseFilter Universal untuk Paginasi & Sorting standar
type BaseFilter struct {
	Page      int
	Limit     int
	Search    string
	SortBy    string
	SortOrder string
}

type EventFilter struct {
	BaseFilter
	InstitutionID string
	IsActive      *bool
}

type CreateEventInput struct {
	InstitutionID string `json:"institution_id" binding:"required,uuid"`
	Title         string `json:"title" binding:"required,max=255"`
	Description   string `json:"description"`
	StartDate     string `json:"start_date" binding:"required"`
	EndDate       string `json:"end_date" binding:"required"`
	RoomCount     int    `json:"room_count" binding:"required,min=1"`
	SubjectCount  int    `json:"subject_count" binding:"required,min=1"`
	IsActive      *bool  `json:"is_active"`
	IsSEBRequired *bool  `json:"is_seb_required"`
	Status        string `json:"status" binding:"omitempty,oneof=DRAFT ACTIVE COMPLETED"`
}

type UpdateEventInput struct {
	Title         string `json:"title" binding:"omitempty,max=255"`
	Description   string `json:"description"`
	StartDate     string `json:"start_date"`
	EndDate       string `json:"end_date"`
	RoomCount     int    `json:"room_count" binding:"omitempty,min=1"`
	SubjectCount  int    `json:"subject_count" binding:"omitempty,min=1"`
	IsActive      *bool  `json:"is_active"`
	IsSEBRequired *bool  `json:"is_seb_required"`
	Status        string `json:"status" binding:"omitempty,oneof=DRAFT ACTIVE COMPLETED"`
}

type SessionFilter struct {
	BaseFilter
	InstitutionID string
	ExamEventID   string
	Role          string
	UserID        string
	Status        string
}

type ParticipantFilter struct {
	BaseFilter
	Status  string
	Gender  string
	ClassID string
}

type ParticipantStats struct {
	Total    int64 `json:"total"`
	Ongoing  int64 `json:"ongoing"`
	Finished int64 `json:"finished"`
	Blocked  int64 `json:"blocked"`
}

type CreateSessionInput struct {
	ExamEventID   string   `json:"exam_event_id" binding:"required"`
	InstitutionID string   `json:"institution_id"`
	Title         string   `json:"title" binding:"required"`
	Token         string   `json:"token"`
	StartTime     string   `json:"start_time" binding:"required"`
	EndTime       string   `json:"end_time" binding:"required"`
	DurationMin   int      `json:"duration_min" binding:"required"`
	SubjectList   string   `json:"subject_list"`
	SupervisorIDs []string `json:"supervisor_ids"`
	ProctorIDs    []string `json:"proctor_ids"`
}

type AddParticipantInput struct {
	StudentID       string   `json:"student_id" binding:"required"`
	ExamNumber      string   `json:"exam_number" binding:"required"`
	QuestionBankID  string   `json:"question_bank_id"`
	QuestionBankIDs []string `json:"question_bank_ids"`
}

type AddBulkParticipantsInput struct {
	StudentIDs      []string `json:"student_ids" binding:"required"`
	QuestionBankID  string   `json:"question_bank_id"`
	QuestionBankIDs []string `json:"question_bank_ids"`
}

type AssignProctorsInput struct {
	TeacherIDs []string `json:"teacher_ids" binding:"required"`
}

type JoinExamResponse struct {
	SessionID     string                    `json:"session_id"`
	Title         string                    `json:"title"`
	DurationMin   int                       `json:"duration_min"`
	Status        string                    `json:"status"`
	StartedAt     *time.Time                `json:"started_at"`
	IsSEBRequired bool                      `json:"is_seb_required"`
	Questions     []StudentQuestionResponse `json:"questions"`
	LastAnswers   map[string]string         `json:"last_answers"`
}

type StudentQuestionResponse struct {
	ID      string          `json:"id"`
	Type    string          `json:"type"`
	Content QuestionContent `json:"content"`
}

type ExamResultResponse struct {
	Score      float64 `json:"score"`
	TotalRight int     `json:"total_right"`
	TotalWrong int     `json:"total_wrong"`
	Status     string  `json:"status"`
}

type SubmitAnswerInput struct {
	SessionID  string `json:"session_id" binding:"required"`
	StudentID  string `json:"student_id"`
	QuestionID string `json:"question_id" binding:"required"`
	Answer     string `json:"answer"`
}
