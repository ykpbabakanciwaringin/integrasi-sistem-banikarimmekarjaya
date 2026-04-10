// LOKASI: internal/repository/postgres/student_exam_repo.go
package postgres

import (
	"context"
	"time"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
	"banikarimmekarjaya.id/cbt-backend/internal/domain"
)

type studentExamRepo struct {
	DB *gorm.DB
}

func NewStudentExamRepository(db *gorm.DB) domain.StudentExamRepository {
	return &studentExamRepo{DB: db}
}

func (r *studentExamRepo) VerifyStudentAccess(ctx context.Context, sessionID, studentID string) (*domain.ExamSession, *domain.ExamParticipant, error) {
	var session domain.ExamSession
	var participant domain.ExamParticipant

	if err := r.DB.WithContext(ctx).First(&session, "id = ?", sessionID).Error; err != nil {
		return nil, nil, err
	}

	err := r.DB.WithContext(ctx).
		Preload("Subtests", func(db *gorm.DB) *gorm.DB {
			return db.Order("order_num ASC") // Mengurutkan dari Mapel 1, 2, dst
		}).
		Preload("Subtests.QuestionBank"). // Menarik detail Mapel
		Where("exam_session_id = ? AND student_id = ?", sessionID, studentID).
		First(&participant).Error

	if err != nil {
		return &session, nil, err
	}
	return &session, &participant, nil
}

func (r *studentExamRepo) GetQuestionsForStudent(ctx context.Context, questionBankID string) ([]domain.QuestionBank, error) {
	var items []domain.QuestionBank
	err := r.DB.WithContext(ctx).
		Where("parent_id = ?", questionBankID).
		Order("created_at ASC").
		Find(&items).Error
	return items, err
}

func (r *studentExamRepo) BulkSaveAnswers(ctx context.Context, sessionID, studentID string, answers []domain.StudentAnswer) error {
	return r.DB.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if len(answers) > 0 {
			// [PEMBARUAN] Memastikan participant_subtest_id ikut di-update
			err := tx.Clauses(clause.OnConflict{
				Columns:   []clause.Column{{Name: "exam_session_id"}, {Name: "student_id"}, {Name: "question_id"}},
				DoUpdates: clause.AssignmentColumns([]string{"answer_given", "participant_subtest_id"}),
			}).Create(&answers).Error
			if err != nil {
				return err
			}
		}
		return nil
	})
}

func (r *studentExamRepo) UpdateParticipantState(ctx context.Context, sessionID, studentID, status string) error {
	return r.DB.WithContext(ctx).Model(&domain.ExamParticipant{}).
		Where("exam_session_id = ? AND student_id = ?", sessionID, studentID).
		Update("status", status).Error
}

func (r *studentExamRepo) UpdateParticipantActivity(ctx context.Context, sessionID, studentID, ip string) error {
	return r.DB.WithContext(ctx).Model(&domain.ExamParticipant{}).
		Where("exam_session_id = ? AND student_id = ?", sessionID, studentID).
		Updates(map[string]interface{}{
			"ip_address":        ip,
			"last_heartbeat_at": time.Now(),
		}).Error
}

func (r *studentExamRepo) GetSEBStatusBySession(ctx context.Context, sessionID string) (bool, error) {
	var isSEB bool
	err := r.DB.WithContext(ctx).Table("exam_events").
		Joins("JOIN exam_sessions ON exam_sessions.exam_event_id = exam_events.id").
		Where("exam_sessions.id = ?", sessionID).
		Pluck("exam_events.is_seb_required", &isSEB).Error
	return isSEB, err
}

func (r *studentExamRepo) GetStudentHistory(ctx context.Context, studentID string) ([]domain.StudentExamHistoryResponse, error) {
	var history []domain.StudentExamHistoryResponse
	// [PEMBARUAN] Menghapus JOIN ke question_bank karena field tersebut sudah dihapus di root peserta
	err := r.DB.WithContext(ctx).Table("exam_participants ep").
		Select(`
			ep.exam_session_id as session_id,
			es.title as title,
			'Ujian Multi-Mapel' as subject_name,
			ep.started_at,
			ep.finished_at,
			EXTRACT(EPOCH FROM (ep.finished_at - ep.started_at))/60 as duration_used,
			ep.final_score as score,
			75.0 as passing_grade,
			ep.status
		`).
		Joins("JOIN exam_sessions es ON ep.exam_session_id = es.id").
		Where("ep.student_id = ?", studentID).
		Where("ep.status = ?", "FINISHED").
		Order("ep.finished_at DESC").
		Scan(&history).Error
	return history, err
}

func (r *studentExamRepo) LogViolation(ctx context.Context, log domain.ExamViolationLog) error {
	return r.DB.WithContext(ctx).Create(&log).Error
}

func (r *studentExamRepo) SetSubtestOngoing(ctx context.Context, subtestID string) error {
	return r.DB.WithContext(ctx).Model(&domain.ParticipantSubtest{}).
		Where("id = ?", subtestID).
		Updates(map[string]interface{}{
			"status":     "ONGOING",
			"started_at": time.Now(),
		}).Error
}

// =========================================================================
// [PEMBARUAN FUNGSI BARU] - Murni Akses Data, Tanpa Logika Kalkulasi Berat
// =========================================================================

// Menarik Kunci Jawaban dengan sangat ringan (Hanya kolom yang dibutuhkan)
func (r *studentExamRepo) GetAnswerKeysByQuestionBank(ctx context.Context, questionBankID string) (map[string]domain.QuestionBank, error) {
	var items []domain.QuestionBank
	if err := r.DB.WithContext(ctx).
		Select("id", "answer_key", "score_weight").
		Where("parent_id = ?", questionBankID).
		Find(&items).Error; err != nil {
		return nil, err
	}

	keyMap := make(map[string]domain.QuestionBank)
	for _, it := range items {
		keyMap[it.ID.String()] = it
	}
	return keyMap, nil
}

// Update status subtes (Satu Mapel Selesai)
func (r *studentExamRepo) UpdateSubtestScoreAndFinish(ctx context.Context, subtestID string, score float64) error {
	return r.DB.WithContext(ctx).Model(&domain.ParticipantSubtest{}).
		Where("id = ?", subtestID).
		Updates(map[string]interface{}{
			"status":      "FINISHED",
			"score":       score,
			"finished_at": time.Now(),
		}).Error
}

// Update status ujian keseluruhan (Semua Mapel Selesai)
func (r *studentExamRepo) UpdateParticipantFinalScoreAndFinish(ctx context.Context, sessionID, studentID string, finalScore float64) error {
	return r.DB.WithContext(ctx).Model(&domain.ExamParticipant{}).
		Where("exam_session_id = ? AND student_id = ?", sessionID, studentID).
		Updates(map[string]interface{}{
			"status":      "FINISHED",
			"final_score": finalScore,
			"finished_at": time.Now(),
		}).Error
}
