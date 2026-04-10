// LOKASI: internal/repository/postgres/exam_session_repo.go
package postgres

import (
	"context"
	"errors"
	"strings"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
	"banikarimmekarjaya.id/cbt-backend/internal/domain"
	"banikarimmekarjaya.id/cbt-backend/pkg/utils"
)

type examSessionRepo struct {
	DB *gorm.DB
}

func NewExamSessionRepository(db *gorm.DB) domain.ExamSessionRepository {
	return &examSessionRepo{DB: db}
}

func (r *examSessionRepo) CreateSession(ctx context.Context, s *domain.ExamSession) error {
	return r.DB.WithContext(ctx).Create(s).Error
}

func (r *examSessionRepo) GetSessionByID(ctx context.Context, id string) (*domain.ExamSession, error) {
	var session domain.ExamSession

	// [PERBAIKAN KRITIS]: Menghapus .Profile dari Preload Pengawas dan Proktor
	// karena relasi Teacher sudah berjenis Profile di dalam entitas GORM Anda.
	err := r.DB.WithContext(ctx).
		Preload("ExamEvent").           // Menarik Nama Kegiatan (Event)
		Preload("Supervisors").         // Preload Pengawas
		Preload("Supervisors.Teacher"). // Preload Akun Pengawas (yang sudah bertipe Profile)
		Preload("Proctors").            // Preload Proktor
		Preload("Proctors.Teacher").    // Preload Akun Proktor (yang sudah bertipe Profile)
		Preload("Institution").
		First(&session, "id = ?", id).Error

	if err != nil {
		return nil, err
	}

	var count int64
	r.DB.WithContext(ctx).Model(&domain.ExamParticipant{}).Where("exam_session_id = ?", id).Count(&count)
	session.ParticipantCount = int(count)

	return &session, nil
}

func (r *examSessionRepo) FetchSessions(ctx context.Context, filter domain.SessionFilter) ([]domain.ExamSession, int64, error) {
	var sessions []domain.ExamSession
	var total int64

	query := r.DB.WithContext(ctx).Model(&domain.ExamSession{})

	// --- 1. Filter Dasar ---
	if filter.InstitutionID != "" {
		query = query.Where("exam_sessions.institution_id = ?", filter.InstitutionID)
	}

	if filter.ExamEventID != "" {
		query = query.Where("exam_sessions.exam_event_id = ?", filter.ExamEventID)
	}

	if filter.Search != "" {
		s := "%" + strings.ToLower(filter.Search) + "%"
		query = query.Where("LOWER(exam_sessions.title) LIKE ?", s)
	}

	// --- 2. Filter Otorisasi Guru (Pengawas ATAU Proktor) ---
	if filter.Role == "TEACHER" {
		query = query.Where("EXISTS (SELECT 1 FROM exam_supervisors WHERE exam_supervisors.exam_session_id = exam_sessions.id AND exam_supervisors.teacher_id = ?) OR EXISTS (SELECT 1 FROM exam_proctors WHERE exam_proctors.exam_session_id = exam_sessions.id AND exam_proctors.teacher_id = ?)", filter.UserID, filter.UserID)
	}

	if filter.Status != "" {
		now := utils.NowWIB()
		status := strings.ToUpper(filter.Status)
		switch status {
		case "ACTIVE":
			query = query.Where("exam_sessions.start_time <= ? AND exam_sessions.end_time >= ? AND exam_sessions.is_active = ?", now, now, true)
		case "UPCOMING":
			query = query.Where("exam_sessions.start_time > ? AND exam_sessions.is_active = ?", now, true)
		case "FINISHED":
			query = query.Where("exam_sessions.end_time < ? OR exam_sessions.is_active = ?", now, false)
		}
	}

	query.Count(&total)

	// --- 3. Standarisasi Paginasi & Sorting ---
	if filter.Page <= 0 {
		filter.Page = 1
	}
	if filter.Limit <= 0 {
		filter.Limit = 10
	}
	offset := (filter.Page - 1) * filter.Limit

	sortOrder := "ASC"
	if strings.ToUpper(filter.SortOrder) == "DESC" {
		sortOrder = "DESC"
	}

	sortBy := "exam_sessions.start_time"
	allowedSorts := map[string]string{
		"title":        "exam_sessions.title",
		"start_time":   "exam_sessions.start_time",
		"end_time":     "exam_sessions.end_time",
		"duration_min": "exam_sessions.duration_min",
	}
	if val, ok := allowedSorts[filter.SortBy]; ok {
		sortBy = val
	}

	// --- 4. Eksekusi Query ---
	err := query.
		Select("exam_sessions.*, COUNT(exam_participants.student_id) as participant_count").
		Joins("LEFT JOIN exam_participants ON exam_participants.exam_session_id = exam_sessions.id").
		Group("exam_sessions.id").
		Preload("Institution").
		Preload("Supervisors").         // [PERBAIKAN]
		Preload("Supervisors.Teacher"). // [PERBAIKAN]
		Preload("Proctors").            // [PERBAIKAN]
		Preload("Proctors.Teacher").    // [PERBAIKAN]
		Order(sortBy + " " + sortOrder).
		Limit(filter.Limit).
		Offset(offset).
		Find(&sessions).Error

	return sessions, total, err
}

func (r *examSessionRepo) UpdateSession(ctx context.Context, s *domain.ExamSession) error {
	return r.DB.WithContext(ctx).Model(s).
		Select("title", "token", "start_time", "end_time", "duration_min", "subject_list").
		Updates(s).Error
}

func (r *examSessionRepo) DeleteSession(ctx context.Context, id string) error {
	return r.DB.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("exam_session_id = ?", id).Delete(&domain.StudentAnswer{}).Error; err != nil {
			return err
		}
		if err := tx.Where("exam_session_id = ?", id).Delete(&domain.ExamParticipant{}).Error; err != nil {
			return err
		}
		if err := tx.Where("exam_session_id = ?", id).Delete(&domain.ExamSupervisor{}).Error; err != nil { // [PERBAIKAN]
			return err
		}
		if err := tx.Where("exam_session_id = ?", id).Delete(&domain.ExamProctor{}).Error; err != nil {
			return err
		}
		return tx.Delete(&domain.ExamSession{}, "id = ?", id).Error
	})
}

func (r *examSessionRepo) UpdateSessionStatus(ctx context.Context, id string, isActive bool) error {
	return r.DB.WithContext(ctx).Model(&domain.ExamSession{}).
		Where("id = ?", id).
		Update("is_active", isActive).Error
}

func (r *examSessionRepo) RegisterParticipant(ctx context.Context, p *domain.ExamParticipant) error {
	return r.DB.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		// 1. Simpan atau Perbarui Data Peserta Induk (Upsert)
		if err := tx.Clauses(clause.OnConflict{
			Columns:   []clause.Column{{Name: "exam_session_id"}, {Name: "student_id"}},
			DoUpdates: clause.AssignmentColumns([]string{"question_bank_id", "exam_number", "status"}),
		}).Create(p).Error; err != nil {
			return err
		}

		// 2. Tarik ulang ID Peserta dari Database secara presisi
		var saved domain.ExamParticipant
		if err := tx.Where("exam_session_id = ? AND student_id = ?", p.ExamSessionID, p.StudentID).First(&saved).Error; err != nil {
			return err
		}

		// 3. Hapus Subtes lama & Masukkan yang baru (Anti-Duplikasi jika didaftarkan ulang)
		if len(p.Subtests) > 0 {
			if err := tx.Where("exam_participant_id = ?", saved.ID).Delete(&domain.ParticipantSubtest{}).Error; err != nil {
				return err
			}
			for i := range p.Subtests {
				p.Subtests[i].ExamParticipantID = saved.ID
			}
			if err := tx.Create(&p.Subtests).Error; err != nil {
				return err
			}
		}
		return nil
	})
}

func (r *examSessionRepo) RegisterBulkParticipants(ctx context.Context, participants []domain.ExamParticipant) error {
	return r.DB.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		// 1. Upsert Data Peserta Massal
		if err := tx.Clauses(clause.OnConflict{
			Columns:   []clause.Column{{Name: "exam_session_id"}, {Name: "student_id"}},
			DoUpdates: clause.AssignmentColumns([]string{"question_bank_id", "exam_number", "status"}),
		}).CreateInBatches(&participants, 100).Error; err != nil {
			return err
		}

		// 2. Tarik ulang ID Peserta secara presisi untuk pengamanan relasi
		var studentIDs []string
		sessionID := participants[0].ExamSessionID
		for _, p := range participants {
			studentIDs = append(studentIDs, p.StudentID)
		}

		var savedParticipants []domain.ExamParticipant
		if err := tx.Where("exam_session_id = ? AND student_id IN ?", sessionID, studentIDs).
			Find(&savedParticipants).Error; err != nil {
			return err
		}

		// 3. Mapping ID Induk ke Tabel Pivot
		var pIDs []string
		var allSubtests []domain.ParticipantSubtest
		subtestMap := make(map[string][]domain.ParticipantSubtest)

		for _, p := range participants {
			subtestMap[p.StudentID] = p.Subtests
		}

		for _, sp := range savedParticipants {
			pIDs = append(pIDs, sp.ID)
			if subs, ok := subtestMap[sp.StudentID]; ok {
				for _, s := range subs {
					s.ExamParticipantID = sp.ID
					allSubtests = append(allSubtests, s)
				}
			}
		}

		// Hapus subtes lama dan Insert secara massal
		if len(pIDs) > 0 {
			if err := tx.Where("exam_participant_id IN ?", pIDs).Delete(&domain.ParticipantSubtest{}).Error; err != nil {
				return err
			}
		}
		if len(allSubtests) > 0 {
			if err := tx.CreateInBatches(&allSubtests, 500).Error; err != nil {
				return err
			}
		}
		return nil
	})
}

func (r *examSessionRepo) GetParticipantByExamNumber(ctx context.Context, examNumber string) (*domain.ExamParticipant, error) {
	var p domain.ExamParticipant
	err := r.DB.WithContext(ctx).Where("exam_number = ?", examNumber).First(&p).Error
	return &p, err
}

func (r *examSessionRepo) FetchCardData(ctx context.Context, sessionID string) ([]map[string]interface{}, error) {
	var results []map[string]interface{}
	query := `
		SELECT 
			ep.student_id,
			p.full_name as student_name,
			p.nisn as student_nisn,
			p.image as photo_url,
			p.birth_place,
			p.birth_date,
			u.username as student_username,
			u.password_plain as student_password,
			c.name as class_name,
			ep.exam_number,
			inst.name as institution_name,
			inst.logo_url,
			inst.header1, 
			inst.header2, 
			inst.address_detail,
			inst.address_city,
			inst.contact_phone,
			inst.contact_email,
			inst.website
		FROM exam_participants ep
		JOIN users u ON ep.student_id = u.id
		JOIN profiles p ON u.id = p.user_id
		LEFT JOIN classes c ON p.class_id = c.id
		JOIN exam_sessions es ON ep.exam_session_id = es.id
		JOIN institutions inst ON es.institution_id = inst.id
		WHERE ep.exam_session_id = ?
	`
	err := r.DB.WithContext(ctx).Raw(query, sessionID).Scan(&results).Error
	return results, err
}

func (r *examSessionRepo) DeleteParticipant(ctx context.Context, sessionID, studentID string) error {
	return r.DB.WithContext(ctx).
		Where("exam_session_id = ? AND student_id = ?", sessionID, studentID).
		Delete(&domain.ExamParticipant{}).Error
}

func (r *examSessionRepo) FetchParticipants(ctx context.Context, sessionID string, filter domain.ParticipantFilter) ([]domain.ExamParticipant, int64, error) {
	var participants []domain.ExamParticipant
	var total int64

	// [PERBAIKAN FASE MULTI-MAPEL]: Mengubah Preload agar memuat data dari pivot Subtests
	query := r.DB.WithContext(ctx).Model(&domain.ExamParticipant{}).
		Joins("JOIN users ON users.id = exam_participants.student_id").
		Joins("LEFT JOIN profiles ON profiles.user_id = users.id").
		Preload("Student").
		Preload("Student.Profile").
		Preload("Student.Profile.Class").
		Preload("Subtests", func(db *gorm.DB) *gorm.DB {
			return db.Order("order_num ASC") // Urutkan mapel 1, 2, dst
		}).
		Preload("Subtests.QuestionBank").
		Preload("Subtests.QuestionBank.Subject").
		Where("exam_session_id = ?", sessionID)

	if filter.Search != "" {
		s := "%" + strings.ToLower(filter.Search) + "%"
		query = query.Where("LOWER(profiles.full_name) LIKE ? OR LOWER(users.username) LIKE ?", s, s)
	}

	if filter.Status != "" {
		query = query.Where("exam_participants.status = ?", filter.Status)
	}

	if filter.Gender != "" {
		query = query.Where("profiles.gender = ?", filter.Gender)
	}
	if filter.ClassID != "" {
		query = query.Where("profiles.class_id = ?", filter.ClassID)
	}

	query.Count(&total)

	if filter.Page <= 0 {
		filter.Page = 1
	}
	if filter.Limit <= 0 {
		filter.Limit = 10
	}
	offset := (filter.Page - 1) * filter.Limit

	sortOrder := "ASC"
	if strings.ToUpper(filter.SortOrder) == "DESC" {
		sortOrder = "DESC"
	}

	sortBy := "profiles.full_name"
	allowedSorts := map[string]string{
		"name":       "profiles.full_name",
		"username":   "users.username",
		"status":     "exam_participants.status",
		"score":      "exam_participants.final_score",
		"created_at": "exam_participants.created_at",
	}
	if val, ok := allowedSorts[filter.SortBy]; ok {
		sortBy = val
	}

	err := query.Order(sortBy + " " + sortOrder).Limit(filter.Limit).Offset(offset).Find(&participants).Error

	return participants, total, err
}

func (r *examSessionRepo) GetParticipantStats(ctx context.Context, sessionID string) (*domain.ParticipantStats, error) {
	var stats domain.ParticipantStats
	base := r.DB.WithContext(ctx).Model(&domain.ExamParticipant{}).Where("exam_session_id = ?", sessionID)

	base.Count(&stats.Total)
	base.Where("status IN ?", []string{"ONGOING", "WORKING"}).Count(&stats.Ongoing)
	base.Where("status = ?", "FINISHED").Count(&stats.Finished)
	base.Where("status = ?", "BLOCKED").Count(&stats.Blocked)

	return &stats, nil
}

func (r *examSessionRepo) UpdateParticipantStatus(ctx context.Context, sessionID string, studentID string, newStatus string) error {
	return r.DB.WithContext(ctx).Table("exam_participants").
		Where("exam_session_id = ? AND student_id = ?", sessionID, studentID).
		Update("status", newStatus).Error
}

func (r *examSessionRepo) GetParticipant(ctx context.Context, sessionID string, studentID string) (*domain.ExamParticipant, error) {
	var p domain.ExamParticipant
	err := r.DB.WithContext(ctx).
		Where("exam_session_id = ? AND student_id = ?", sessionID, studentID).
		First(&p).Error
	return &p, err
}

// [PERBAIKAN] Menyimpan Data ke 2 Tabel Berbeda Sekaligus
func (r *examSessionRepo) AssignProctors(ctx context.Context, supervisors []domain.ExamSupervisor, proctors []domain.ExamProctor) error {
	return r.DB.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if len(supervisors) > 0 {
			if err := tx.Create(&supervisors).Error; err != nil {
				return err
			}
		}
		if len(proctors) > 0 {
			if err := tx.Create(&proctors).Error; err != nil {
				return err
			}
		}
		return nil
	})
}

// [PERBAIKAN] Menghapus guru dari relasi manapun di sesi ini
func (r *examSessionRepo) RemoveProctor(ctx context.Context, sessionID, teacherID string) error {
	return r.DB.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("exam_session_id = ? AND teacher_id = ?", sessionID, teacherID).Delete(&domain.ExamSupervisor{}).Error; err != nil {
			return err
		}
		if err := tx.Where("exam_session_id = ? AND teacher_id = ?", sessionID, teacherID).Delete(&domain.ExamProctor{}).Error; err != nil {
			return err
		}
		return nil
	})
}

// [PERBAIKAN] Mengosongkan Pengawas dan Proktor saat Sesi di-update
func (r *examSessionRepo) ClearProctors(ctx context.Context, sessionID string) error {
	return r.DB.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("exam_session_id = ?", sessionID).Delete(&domain.ExamSupervisor{}).Error; err != nil {
			return err
		}
		if err := tx.Where("exam_session_id = ?", sessionID).Delete(&domain.ExamProctor{}).Error; err != nil {
			return err
		}
		return nil
	})
}

func (r *examSessionRepo) GetStudentIDsByUsernames(ctx context.Context, usernames []string) (map[string]string, error) {
	var users []struct {
		ID       string
		Username string
	}
	err := r.DB.WithContext(ctx).Table("users").
		Select("id, username").
		Where("username IN ?", usernames).
		Scan(&users).Error

	result := make(map[string]string)
	for _, u := range users {
		result[u.Username] = u.ID
	}
	return result, err
}

func (r *examSessionRepo) UpdateStudentPassword(ctx context.Context, studentID string, hash string, plain string) error {
	return r.DB.WithContext(ctx).Table("users").
		Where("id = ?", studentID).
		Updates(map[string]interface{}{
			"password":       hash,
			"password_plain": plain,
		}).Error
}

func (r *examSessionRepo) UpdateStudentPhoto(ctx context.Context, identifier string, photoPath string) error {
	query := `
		UPDATE profiles 
		SET image = ? 
		WHERE nisn = ? OR user_id IN (SELECT id FROM users WHERE username = ?)
	`
	res := r.DB.WithContext(ctx).Exec(query, photoPath, identifier, identifier)

	if res.Error != nil {
		return res.Error
	}

	if res.RowsAffected == 0 {
		return errors.New("identitas siswa tidak ditemukan di database")
	}

	return nil
}

func (r *examSessionRepo) CreateBulkSessions(ctx context.Context, sessions []domain.ExamSession) error {
	return r.DB.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(&sessions).Error; err != nil {
			return err
		}
		return nil
	})
}
