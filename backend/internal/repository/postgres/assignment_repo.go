// LOKASI: internal/repository/postgres/assignment_repo.go
package postgres

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
	"banikarimmekarjaya.id/cbt-backend/internal/domain"
)

type assignmentRepo struct {
	DB *gorm.DB
}

func NewAssignmentRepository(db *gorm.DB) domain.AssignmentRepository {
	return &assignmentRepo{DB: db}
}

func (r *assignmentRepo) autoSyncFromAllocation(ctx context.Context, id string) {
	syncQuery := `
		INSERT INTO assignments (id, institution_id, teacher_id, subject_id, class_id, kkm, created_at, updated_at)
		SELECT id, institution_id, teacher_id, subject_id, class_id, 75, NOW(), NOW()
		FROM teaching_allocations
		WHERE id = ?
		ON CONFLICT (id) DO NOTHING;
	`
	r.DB.WithContext(ctx).Exec(syncQuery, id)
}

func (r *assignmentRepo) autoSyncBulk(ctx context.Context, institutionID string) {
	syncQuery := `
		INSERT INTO assignments (id, institution_id, teacher_id, subject_id, class_id, kkm, created_at, updated_at)
		SELECT id, institution_id, teacher_id, subject_id, class_id, 75, NOW(), NOW()
		FROM teaching_allocations
		WHERE 1=1
	`
	var args []interface{}
	if institutionID != "" {
		syncQuery += " AND institution_id = ?"
		args = append(args, institutionID)
	}
	syncQuery += " ON CONFLICT (id) DO NOTHING;"

	r.DB.WithContext(ctx).Exec(syncQuery, args...)
}

func (r *assignmentRepo) Fetch(ctx context.Context, filter domain.AssignmentFilter) ([]domain.Assignment, int64, error) {
	r.autoSyncBulk(ctx, filter.InstitutionID)

	var assignments []domain.Assignment
	var total int64

	query := r.DB.WithContext(ctx).Model(&domain.Assignment{}).
		Preload("Teacher").
		Preload("Subject").
		Preload("Class").
		Preload("Class.Institution")

	if filter.InstitutionID != "" {
		query = query.Where("assignments.institution_id = ?", filter.InstitutionID)
	}
	if filter.TeacherID != "" {
		query = query.Where("assignments.teacher_id = ?", filter.TeacherID)
	}
	if filter.ClassID != "" {
		query = query.Where("assignments.class_id = ?", filter.ClassID)
	}

	if filter.Search != "" {
		searchTerm := "%" + filter.Search + "%"
		query = query.Joins("JOIN subjects ON subjects.id = assignments.subject_id").
			Joins("JOIN classes ON classes.id = assignments.class_id").
			Where("subjects.name ILIKE ? OR classes.name ILIKE ?", searchTerm, searchTerm)
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset := (filter.Page - 1) * filter.Limit
	err := query.Limit(filter.Limit).Offset(offset).Order("assignments.created_at DESC").Find(&assignments).Error

	return assignments, total, err
}

func (r *assignmentRepo) GetByID(ctx context.Context, id string) (*domain.Assignment, error) {
	var assignment domain.Assignment
	err := r.DB.WithContext(ctx).
		Preload("Teacher").
		Preload("Subject").
		Preload("Class").
		Preload("Class.Institution").
		First(&assignment, "id = ?", id).Error

	if err != nil {
		r.autoSyncFromAllocation(ctx, id)
		err = r.DB.WithContext(ctx).
			Preload("Teacher").
			Preload("Subject").
			Preload("Class").
			Preload("Class.Institution").
			First(&assignment, "id = ?", id).Error
	}
	return &assignment, err
}

func (r *assignmentRepo) Create(ctx context.Context, assignment *domain.Assignment) error {
	return r.DB.WithContext(ctx).Create(assignment).Error
}

func (r *assignmentRepo) UpdateKKM(ctx context.Context, id string, kkm float64) error {
	return r.DB.WithContext(ctx).Model(&domain.Assignment{}).
		Where("id = ?", id).
		Update("kkm", kkm).Error
}

func (r *assignmentRepo) Delete(ctx context.Context, id string) error {
	return r.DB.WithContext(ctx).Delete(&domain.Assignment{}, "id = ?", id).Error
}

func (r *assignmentRepo) GetStudentGrades(ctx context.Context, assignmentID string) ([]domain.StudentGrade, error) {
	var results []domain.StudentGrade
	var assignment domain.Assignment
	err := r.DB.WithContext(ctx).Preload("Subject").First(&assignment, "id = ?", assignmentID).Error

	if err != nil {
		r.autoSyncFromAllocation(ctx, assignmentID)
		err = r.DB.WithContext(ctx).Preload("Subject").First(&assignment, "id = ?", assignmentID).Error
		if err != nil {
			return nil, err
		}
	}

	query := `
		SELECT 
			u.id AS student_id,
			p.full_name AS student_name,
			u.username AS student_username,
			p.gender AS student_gender,
			COALESCE(ep.status, 'BELUM UJIAN') AS exam_status,
			COALESCE(ep.final_score, 0) AS final_score,
			0 AS correct_count, 
			0 AS wrong_count
		FROM profiles p
		JOIN users u ON p.user_id = u.id
		LEFT JOIN exam_participants ep ON ep.student_id = u.id
		LEFT JOIN exam_sessions es ON ep.exam_session_id = es.id 
			AND (es.subject_list ILIKE ? OR es.title ILIKE ?)
		WHERE p.class_id = ?
		ORDER BY p.full_name ASC
	`
	subjectPattern := "%" + assignment.Subject.Name + "%"
	err = r.DB.WithContext(ctx).Raw(query, subjectPattern, subjectPattern, assignment.ClassID).Scan(&results).Error

	return results, err
}

// =======================================================
// MENGAMBIL REFERENSI UNTUK TEMPLATE & IMPORT
// =======================================================
func (r *assignmentRepo) FetchReferencesForTemplate(ctx context.Context, instID string) ([]domain.Class, []domain.Subject, []domain.User, []domain.ClassSession, error) {
	var classes []domain.Class
	var subjects []domain.Subject
	var teachers []domain.User
	var sessions []domain.ClassSession

	// 1. Ambil Kelas
	r.DB.WithContext(ctx).Where("institution_id = ?", instID).Order("name ASC").Find(&classes)

	// 2. Ambil Mapel
	r.DB.WithContext(ctx).Where("institution_id = ?", instID).Order("name ASC").Find(&subjects)

	// 3. Ambil Guru (FIX UTAMA: Join menggunakan tabel enrollments)
	r.DB.WithContext(ctx).
		Joins("JOIN enrollments ON enrollments.user_id = users.id").
		Where("enrollments.institution_id = ? AND users.role = 'TEACHER'", instID).
		Preload("Profile").
		Find(&teachers)

	// 4. Ambil Sesi KBM
	r.DB.WithContext(ctx).Where("institution_id = ?", instID).Order("start_time ASC").Find(&sessions)

	return classes, subjects, teachers, sessions, nil
}

// =======================================================
// FITUR BARU: ATOMIC BATCH IMPORT (JADWAL & PENUGASAN)
// =======================================================
func (r *assignmentRepo) BatchImportMasterSchedule(ctx context.Context, instID string, payload []domain.MasterScheduleDTO) error {
	tx := r.DB.WithContext(ctx).Begin()
	if tx.Error != nil {
		return tx.Error
	}
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	var activeAyID string
	tx.Table("academic_years").
		Where("institution_id = ? AND is_active = true AND deleted_at IS NULL", instID).
		Select("id").Scan(&activeAyID)

	if activeAyID == "" {
		tx.Rollback()
		return errors.New("tidak ada tahun ajaran aktif di lembaga ini, gagal menyimpan jadwal")
	}

	for _, item := range payload {
		// A. PLOTTING GURU (teaching_allocations)
		var allocID string
		var existingAlloc struct{ ID string }

		tx.Table("teaching_allocations").
			Where("institution_id = ? AND academic_year_id = ? AND teacher_id = ? AND subject_id = ? AND class_id = ? AND deleted_at IS NULL",
				instID, activeAyID, item.TeacherID, item.SubjectID, item.ClassID).
			Select("id").Scan(&existingAlloc)

		if existingAlloc.ID != "" {
			allocID = existingAlloc.ID
		} else {
			allocID = uuid.New().String()
			err := tx.Table("teaching_allocations").Create(map[string]interface{}{
				"id": allocID, "institution_id": instID, "academic_year_id": activeAyID,
				"teacher_id": item.TeacherID, "subject_id": item.SubjectID, "class_id": item.ClassID,
				"created_at": time.Now(), "updated_at": time.Now(),
			}).Error
			if err != nil {
				tx.Rollback()
				return err
			}
		}

		// B. JADWAL HARIAN (class_schedules) - Hanya dieksekusi jika Hari & Sesi diisi
		if item.Day != "" && item.StartTime != "" {
			var schedCount int64
			tx.Table("class_schedules").
				Where("teaching_allocation_id = ? AND day_of_week = ? AND start_time = ? AND deleted_at IS NULL", allocID, item.Day, item.StartTime).
				Count(&schedCount)

			if schedCount == 0 {
				err := tx.Table("class_schedules").Create(map[string]interface{}{
					"id": uuid.New().String(), "teaching_allocation_id": allocID,
					"day_of_week": item.Day, "start_time": item.StartTime, "end_time": item.EndTime,
					"created_at": time.Now(), "updated_at": time.Now(),
				}).Error
				if err != nil {
					tx.Rollback()
					return err
				}
			}
		}

		// C. PENUGASAN KKM (assignments)
		var asgCount int64
		tx.Table("assignments").
			Where("institution_id = ? AND teacher_id = ? AND subject_id = ? AND class_id = ?", instID, item.TeacherID, item.SubjectID, item.ClassID).
			Count(&asgCount)

		if asgCount > 0 {
			err := tx.Table("assignments").
				Where("institution_id = ? AND teacher_id = ? AND subject_id = ? AND class_id = ?", instID, item.TeacherID, item.SubjectID, item.ClassID).
				Update("kkm", item.KKM).Error
			if err != nil {
				tx.Rollback()
				return err
			}
		} else {
			err := tx.Table("assignments").Create(map[string]interface{}{
				"id": uuid.New().String(), "institution_id": instID, "teacher_id": item.TeacherID,
				"subject_id": item.SubjectID, "class_id": item.ClassID, "kkm": item.KKM,
				"created_at": time.Now(), "updated_at": time.Now(), "created_by": "IMPORT_MASTER",
			}).Error
			if err != nil {
				tx.Rollback()
				return err
			}
		}
	}

	return tx.Commit().Error
}
