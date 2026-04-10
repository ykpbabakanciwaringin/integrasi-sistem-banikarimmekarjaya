package usecase

import (
	"context"
	"errors"

	"banikarimmekarjaya.id/cbt-backend/internal/domain"
	"banikarimmekarjaya.id/cbt-backend/pkg/utils"
)

type examExecutionUsecase struct {
	repo domain.ExamExecutionRepository
}

func NewExamExecutionUsecase(r domain.ExamExecutionRepository) domain.ExamExecutionUsecase {
	return &examExecutionUsecase{repo: r}
}

func (uc *examExecutionUsecase) JoinExam(ctx context.Context, token string, studentID string) (*domain.JoinExamResponse, error) {
	session, err := uc.repo.GetActiveSessionByToken(ctx, token)
	if err != nil {
		return nil, errors.New("Sesi ujian tidak ditemukan, atau sedang DIJEDA oleh Pengawas")
	}

	now := utils.NowWIB()

	if now.Before(session.StartTime) {
		return nil, errors.New("Ujian belum dimulai. Silakan tunggu jadwalnya tiba")
	}
	if now.After(session.EndTime) {
		return nil, errors.New("Waktu ujian telah berakhir")
	}

	return &domain.JoinExamResponse{
		SessionID:     session.ID.String(),
		Title:         session.Title,
		DurationMin:   session.DurationMin,
		Status:        "ONGOING",
		IsSEBRequired: session.ExamEvent.IsSEBRequired,
	}, nil
}

func (uc *examExecutionUsecase) SubmitAnswer(ctx context.Context, input domain.SubmitAnswerInput) error {
	session, err := uc.repo.GetSessionByID(ctx, input.SessionID)
	if err != nil {
		return err
	}

	now := utils.NowWIB()
	if now.After(session.EndTime) {
		return errors.New("WAKTU_HABIS: Jawaban ditolak karena sesi ujian telah berakhir")
	}

	participant, err := uc.repo.GetParticipant(ctx, input.SessionID, input.StudentID)
	if err != nil {
		return err
	}
	if participant.Status == "FINISHED" || participant.Status == "BLOCKED" {
		return errors.New("AKSES_DITOLAK: Status pengerjaan Anda telah dikunci")
	}

	ans := &domain.StudentAnswer{
		ExamSessionID: input.SessionID,
		StudentID:     input.StudentID,
		QuestionID:    input.QuestionID,
		AnswerGiven:   input.Answer,
	}

	return uc.repo.SaveAnswer(ctx, ans)
}

// LOKASI: internal/usecase/exam_execution_usecase.go

func (uc *examExecutionUsecase) FinishExam(ctx context.Context, sessionID, studentID string) (*domain.ExamResultResponse, error) {
	answers, err := uc.repo.GetAnswersBySession(ctx, sessionID, studentID)
	if err != nil {
		return nil, err
	}

	totalSoal := len(answers)
	benar := 0
	for _, a := range answers {
		if a.IsCorrect {
			benar++
		}
	}

	score := 0.0
	if totalSoal > 0 {
		score = (float64(benar) / float64(totalSoal)) * 100
	}
	salah := totalSoal - benar

	// Simpan nilai ke database
	_ = uc.repo.UpdateParticipantScore(ctx, sessionID, studentID, score)

	return &domain.ExamResultResponse{
		Score:      score,
		TotalRight: benar,
		TotalWrong: salah,
		Status:     "FINISHED",
	}, nil
}
