// LOKASI: internal/repository/postgres/journal_repo.go
package postgres

import (
	"context"

	"gorm.io/gorm"
	"ykpbabakanciwaringin.id/cbt-backend/internal/domain"
)

type journalRepo struct {
	DB *gorm.DB
}

func NewJournalRepository(db *gorm.DB) domain.JournalRepository {
	return &journalRepo{DB: db}
}

func (r *journalRepo) Create(ctx context.Context, journal *domain.Journal) error {
	return r.DB.WithContext(ctx).Create(journal).Error
}

func (r *journalRepo) GetByID(ctx context.Context, id string) (*domain.Journal, error) {
	var journal domain.Journal
	err := r.DB.WithContext(ctx).
		Preload("Allocation.Teacher").
		Preload("Allocation.Subject").
		Preload("Allocation.Class").
		First(&journal, "id = ?", id).Error
	return &journal, err
}

func (r *journalRepo) GetAll(ctx context.Context, filter domain.JournalFilter) ([]domain.Journal, error) {
	var journals []domain.Journal
	db := r.DB.WithContext(ctx).Model(&domain.Journal{}).
		Preload("Allocation.Teacher").
		Preload("Allocation.Subject").
		Preload("Allocation.Class").
		Preload("Allocation.Institution").
		Preload("Allocation.AcademicYear").
		Preload("Attendances").
		Preload("Attendances.Student").
		Preload("Attendances.Student.Profile")

	// Filter cerdas berdasarkan relasi Allocation
	if filter.TeacherID != "" {
		db = db.Joins("JOIN teaching_allocations on journals.teaching_allocation_id = teaching_allocations.id").
			Where("teaching_allocations.teacher_id = ?", filter.TeacherID)
	}
	if filter.InstitutionID != "" && filter.TeacherID == "" {
		db = db.Joins("JOIN teaching_allocations on journals.teaching_allocation_id = teaching_allocations.id").
			Where("teaching_allocations.institution_id = ?", filter.InstitutionID)
	}
	if filter.Status != "" {
		db = db.Where("journals.status = ?", filter.Status)
	}

	if filter.Month != "" {
		db = db.Where("to_char(journals.date, 'YYYY-MM') = ?", filter.Month)
	}

	err := db.Order("journals.date DESC, journals.created_at DESC").Find(&journals).Error
	return journals, err
}

func (r *journalRepo) Update(ctx context.Context, journal *domain.Journal) error {
	return r.DB.WithContext(ctx).Save(journal).Error
}

func (r *journalRepo) Delete(ctx context.Context, id string) error {
	return r.DB.WithContext(ctx).Delete(&domain.Journal{}, "id = ?", id).Error
}

func (r *journalRepo) SubmitAttendances(ctx context.Context, journalID string, attendances []domain.Attendance) error {
	return r.DB.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		// Hapus absensi lama untuk jurnal ini (agar bersih sebelum replace)
		if err := tx.Where("journal_id = ?", journalID).Delete(&domain.Attendance{}).Error; err != nil {
			return err
		}
		// Insert absensi baru secara bulk (Mass Insert)
		if len(attendances) > 0 {
			if err := tx.Create(&attendances).Error; err != nil {
				return err
			}
		}

		// Update status jurnal menjadi SUBMITTED setelah diabsen
		if err := tx.Model(&domain.Journal{}).Where("id = ?", journalID).Update("status", "SUBMITTED").Error; err != nil {
			return err
		}
		return nil
	})
}

func (r *journalRepo) GetAttendances(ctx context.Context, journalID string) ([]domain.Attendance, error) {
	var attendances []domain.Attendance
	err := r.DB.WithContext(ctx).
		Preload("Student.Profile").
		Where("journal_id = ?", journalID).
		Find(&attendances).Error
	return attendances, err
}

func (r *journalRepo) GetStudentUsernames(ctx context.Context, studentIDs []string) (map[string]string, error) {
	if len(studentIDs) == 0 {
		return nil, nil
	}

	type Result struct {
		ID       string
		Username string
	}
	var results []Result

	// Mengambil username langsung dari tabel users berdasarkan UUID siswa
	err := r.DB.WithContext(ctx).Table("users").
		Select("id, username").
		Where("id IN ?", studentIDs).
		Find(&results).Error

	if err != nil {
		return nil, err
	}

	// Ubah ke Map agar mudah dicari di Usecase
	userMap := make(map[string]string)
	for _, res := range results {
		userMap[res.ID] = res.Username
	}

	return userMap, nil
}

func (r *journalRepo) UpdateAttendanceSyncStatus(ctx context.Context, attendanceID string, isSynced bool, errorMessage string) error {
	return r.DB.WithContext(ctx).Model(&domain.Attendance{}).
		Where("id = ?", attendanceID).
		Updates(map[string]interface{}{
			"synced_to_third_party": isSynced,
			"sync_error_message":    errorMessage,
		}).Error
}

func (r *journalRepo) GetEventIDForJournal(ctx context.Context, allocationID string, dayOfWeek string) (int, error) {
	var eventID int

	// Mencari Event ID di tabel class_schedules yang cocok dengan Alokasi & Hari-nya
	err := r.DB.WithContext(ctx).Table("class_schedules").
		Select("pesantrenqu_event_id").
		Where("teaching_allocation_id = ? AND UPPER(day_of_week) = UPPER(?)", allocationID, dayOfWeek).
		Limit(1).
		Scan(&eventID).Error

	if err != nil {
		return 0, err
	}

	return eventID, nil
}

func (r *journalRepo) GetJournalsByClassAndMonth(ctx context.Context, classID, yearMonth string) ([]domain.Journal, error) {
	var journals []domain.Journal

	// yearMonth formatnya "YYYY-MM", kita cari jurnal yang depannya cocok dengan bulan ini
	db := r.DB.WithContext(ctx).Model(&domain.Journal{}).
		Preload("Allocation.Teacher").
		Preload("Allocation.Subject").
		Preload("Allocation.Class").
		Preload("Allocation.Institution").
		Preload("Allocation.AcademicYear").
		Preload("Attendances").
		Preload("Attendances.Student").
		Preload("Attendances.Student.Profile").
		Joins("JOIN teaching_allocations on journals.teaching_allocation_id = teaching_allocations.id").
		Where("teaching_allocations.class_id = ?", classID).
		Where("to_char(journals.date, 'YYYY-MM') = ?", yearMonth)

	err := db.Order("journals.date ASC, journals.created_at ASC").Find(&journals).Error
	return journals, err
}

func (r *journalRepo) GetJournalsByInstitutionAndMonth(ctx context.Context, institutionID, yearMonth string) ([]domain.Journal, error) {
	var journals []domain.Journal

	err := r.DB.WithContext(ctx).Model(&domain.Journal{}).
		Preload("Allocation").
		Preload("Allocation.Teacher").
		Preload("Allocation.Institution").
		Joins("JOIN teaching_allocations on journals.teaching_allocation_id = teaching_allocations.id").
		Where("teaching_allocations.institution_id = ?", institutionID).
		Where("to_char(journals.date, 'YYYY-MM') = ?", yearMonth).
		Order("journals.date ASC").
		Find(&journals).Error

	return journals, err
}

// =========================================================================
//  FUNGSI TAMBAHAN UNTUK MESIN CETAK REKAP GURU
// =========================================================================

func (r *journalRepo) GetHolidays(ctx context.Context, instID, monthStr string) ([]domain.Holiday, error) {
	var h []domain.Holiday

	db := r.DB.WithContext(ctx).Where("to_char(date, 'YYYY-MM') = ?", monthStr)

	if instID != "" {
		db = db.Where("(institution_id = ? OR is_global = true)", instID)
	} else {
		db = db.Where("is_global = true")
	}

	err := db.Find(&h).Error
	return h, err
}

func (r *journalRepo) GetTeacherAttendances(ctx context.Context, instID, monthStr string) ([]domain.TeacherAttendance, error) {
	var t []domain.TeacherAttendance
	r.DB.WithContext(ctx).
		Where("institution_id = ? AND to_char(date, 'YYYY-MM') = ?", instID, monthStr).
		Find(&t)
	return t, nil
}

func (r *journalRepo) GetAllocationsByInstitution(ctx context.Context, instID string) ([]domain.TeachingAllocation, error) {
	var a []domain.TeachingAllocation
	// Preload "Schedules" sangat penting agar kita bisa tahu hari apa saja guru tersebut mengajar
	r.DB.WithContext(ctx).
		Preload("Schedules").
		Where("institution_id = ?", instID).
		Find(&a)
	return a, nil
}

func (r *journalRepo) GetInstitutionSettings(ctx context.Context, instID string) (*domain.Institution, error) {
	var inst domain.Institution
	err := r.DB.WithContext(ctx).First(&inst, "id = ?", instID).Error
	return &inst, err
}
