// LOKASI: internal/repository/postgres/report_repo.go
package postgres

import (
	"context"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
	"ykpbabakanciwaringin.id/cbt-backend/internal/domain"
)

type reportRepo struct {
	DB *gorm.DB
}

func NewReportRepository(db *gorm.DB) domain.ReportRepository {
	return &reportRepo{DB: db}
}

func (r *reportRepo) Upsert(ctx context.Context, rp *domain.StudentReport) error {
	return r.DB.WithContext(ctx).
		Clauses(clause.OnConflict{
			Columns:   []clause.Column{{Name: "student_id"}, {Name: "class_id"}}, // Kunci Unik: Pelajar di Kelas Tertentu
			DoUpdates: clause.AssignmentColumns([]string{"sick", "permission", "absent", "note", "is_promoted", "updated_at"}),
		}).
		Create(rp).Error
}

func (r *reportRepo) GetByClass(ctx context.Context, classID string) ([]domain.StudentReport, error) {
	var reports []domain.StudentReport
	err := r.DB.WithContext(ctx).
		Where("class_id = ?", classID).
		Find(&reports).Error
	return reports, err
}

func (r *reportRepo) GetClassGradesSummary(ctx context.Context, classID string) ([]domain.GradeSummaryRaw, error) {
	var results []domain.GradeSummaryRaw

	query := `
		SELECT 
			p.user_id AS student_id,
			p.full_name AS student_name,
			u.username,
			COALESCE(p.nisn, '-') AS nisn,
			COALESCE(NULLIF(es.subject_list, ''), es.title) AS subject_name,
			COALESCE(MAX(ep.final_score), 0) AS final_score
		FROM profiles p
		JOIN users u ON p.user_id = u.id
		LEFT JOIN exam_participants ep ON ep.student_id = u.id AND ep.status != 'BELUM UJIAN'
		LEFT JOIN exam_sessions es ON ep.exam_session_id = es.id
		WHERE p.class_id = ?
		GROUP BY p.user_id, p.full_name, u.username, p.nisn, subject_name
		ORDER BY p.full_name ASC
	`

	err := r.DB.WithContext(ctx).Raw(query, classID).Scan(&results).Error
	return results, err
}
