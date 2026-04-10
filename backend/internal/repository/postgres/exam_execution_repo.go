package postgres

import (
	"context"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
	"banikarimmekarjaya.id/cbt-backend/internal/domain"
)

type examExecutionRepo struct {
	DB *gorm.DB
}

func NewExamExecutionRepository(db *gorm.DB) domain.ExamExecutionRepository {
	return &examExecutionRepo{DB: db}
}

func (r *examExecutionRepo) GetActiveSessionByToken(ctx context.Context, token string) (*domain.ExamSession, error) {
	var session domain.ExamSession
	err := r.DB.WithContext(ctx).
		Preload("ExamEvent").
		Where("token = ? AND is_active = ?", token, true).
		First(&session).Error
	return &session, err
}

func (r *examExecutionRepo) GetSessionByID(ctx context.Context, id string) (*domain.ExamSession, error) {
	var session domain.ExamSession
	err := r.DB.WithContext(ctx).First(&session, "id = ?", id).Error
	return &session, err
}

func (r *examExecutionRepo) GetParticipant(ctx context.Context, sessionID string, studentID string) (*domain.ExamParticipant, error) {
	var p domain.ExamParticipant
	err := r.DB.WithContext(ctx).
		Where("exam_session_id = ? AND student_id = ?", sessionID, studentID).
		First(&p).Error
	return &p, err
}

func (r *examExecutionRepo) SaveAnswer(ctx context.Context, ans *domain.StudentAnswer) error {
	// REKAYASA ATOMIK: Upsert kebal terhadap dobel klik dari siswa
	return r.DB.WithContext(ctx).Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "exam_session_id"}, {Name: "student_id"}, {Name: "question_id"}},
		DoUpdates: clause.AssignmentColumns([]string{"answer_given", "is_correct", "updated_at"}),
	}).Create(ans).Error
}

func (r *examExecutionRepo) GetAnswersBySession(ctx context.Context, sessionID, studentID string) ([]domain.StudentAnswer, error) {
	var answers []domain.StudentAnswer
	err := r.DB.WithContext(ctx).
		Where("exam_session_id = ? AND student_id = ?", sessionID, studentID).
		Find(&answers).Error
	return answers, err
}

func (r *examExecutionRepo) UpdateParticipantScore(ctx context.Context, sessionID, studentID string, score float64) error {
	return r.DB.WithContext(ctx).Model(&domain.ExamParticipant{}).
		Where("exam_session_id = ? AND student_id = ?", sessionID, studentID).
		Update("final_score", score).Error
}

func (r *examExecutionRepo) FinishExamAtomic(ctx context.Context, sessionID, studentID string) error {
	return r.DB.WithContext(ctx).Model(&domain.ExamParticipant{}).
		Where("exam_session_id = ? AND student_id = ?", sessionID, studentID).
		Updates(map[string]interface{}{
			"status":      "FINISHED",
			"finished_at": gorm.Expr("NOW()"),
		}).Error
}

func (r *examExecutionRepo) UpdateParticipantStatus(ctx context.Context, sessionID, studentID string, status string) error {
	return r.DB.WithContext(ctx).Model(&domain.ExamParticipant{}).
		Where("exam_session_id = ? AND student_id = ?", sessionID, studentID).
		Update("status", status).Error
}
