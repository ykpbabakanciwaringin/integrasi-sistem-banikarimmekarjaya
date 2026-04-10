// LOKASI: internal/repository/postgres/exam_result_repo.go
package postgres

import (
	"context"

	"gorm.io/gorm"
	"ykpbabakanciwaringin.id/cbt-backend/internal/domain"
)

type examResultRepo struct {
	DB *gorm.DB
}

func NewExamResultRepository(db *gorm.DB) domain.ExamResultRepository {
	return &examResultRepo{DB: db}
}

// [PEMBAHARUAN FASE 4] Mengambil Hasil Ujian dalam Bentuk Matriks Multi-Mapel
func (r *examResultRepo) GetCBTResults(ctx context.Context, sessionID string) ([]domain.CBTResultDetail, error) {
	var participants []domain.ExamParticipant

	// Menggunakan Preload untuk menarik seluruh relasi data secara presisi
	err := r.DB.WithContext(ctx).
		Preload("Student").
		Preload("Student.Profile").
		Preload("Student.Profile.Class").
		Preload("Subtests", func(db *gorm.DB) *gorm.DB {
			return db.Order("order_num ASC") // Urutkan mapel 1, 2, dst
		}).
		Preload("Subtests.QuestionBank").
		Preload("Subtests.QuestionBank.Subject").
		Where("exam_session_id = ?", sessionID).
		Find(&participants).Error

	if err != nil {
		return nil, err
	}

	var results []domain.CBTResultDetail
	for _, p := range participants {
		var subtestScores []domain.SubtestScore
		var totalScore float64 = 0

		// Identitas Dasar Siswa
		studentName := "Siswa Tidak Dikenal"
		nisn := "-"
		gender := "-"
		className := "-"

		if p.Student != nil {
			studentName = p.Student.Username
			if p.Student.Profile != nil {
				studentName = p.Student.Profile.FullName
				nisn = p.Student.Profile.NISN
				gender = p.Student.Profile.Gender
				if p.Student.Profile.Class != nil {
					className = p.Student.Profile.Class.Name
				}
			}
		}

		// Memetakan Nilai per Mata Pelajaran (Subtes)
		for _, st := range p.Subtests {
			subjName := "Mata Pelajaran"
			if st.QuestionBank != nil {
				if st.QuestionBank.Subject != nil {
					subjName = st.QuestionBank.Subject.Name
				} else {
					subjName = st.QuestionBank.Title
				}
			}

			subtestScores = append(subtestScores, domain.SubtestScore{
				SubjectName: subjName,
				Score:       st.Score,
				Status:      st.Status,
			})
			totalScore += st.Score
		}

		// Kalkulasi Nilai Rata-Rata Sesi
		finalAvg := 0.0
		if len(p.Subtests) > 0 {
			finalAvg = totalScore / float64(len(p.Subtests))
		}

		results = append(results, domain.CBTResultDetail{
			StudentID:   p.StudentID,
			StudentName: studentName,
			Username:    p.Student.Username,
			NISN:        nisn,
			Gender:      gender,
			ExamNumber:  p.ExamNumber,
			ClassName:   className,
			Status:      p.Status,
			StartedAt:   p.StartedAt,
			FinishedAt:  p.FinishedAt,
			FinalScore:  finalAvg,
			Subtests:    subtestScores,
		})
	}
	return results, nil
}

// [PEMBAHARUAN] Mengambil Informasi Sesi Lengkap dengan Data Kegiatan & Petugas
func (r *examResultRepo) GetSessionInfoForExport(ctx context.Context, sessionID string) (*domain.ExamSession, error) {
	var session domain.ExamSession

	// [PERBAIKAN KRITIS]: Menghapus relasi .Profile pada Supervisor dan Proctor
	// agar selaras dengan skema GORM terbaru dan mencegah Error 500.
	err := r.DB.WithContext(ctx).
		Preload("ExamEvent").           // Untuk Nama Kegiatan
		Preload("Institution").         // Untuk Kop Surat
		Preload("Supervisors.Teacher"). // [PERBAIKAN] Cukup sampai .Teacher
		Preload("Proctors.Teacher").    // [PERBAIKAN] Cukup sampai .Teacher
		First(&session, "id = ?", sessionID).Error

	return &session, err
}
