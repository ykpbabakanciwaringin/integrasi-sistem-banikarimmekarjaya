package postgres

import (
	"context"

	"gorm.io/gorm"
	"ykpbabakanciwaringin.id/cbt-backend/internal/domain"
)

type teacherRepo struct {
	DB *gorm.DB
}

func NewTeacherRepository(db *gorm.DB) domain.TeacherRepository {
	return &teacherRepo{DB: db}
}

func (r *teacherRepo) Fetch(ctx context.Context, filter domain.TeacherFilter) ([]domain.User, int64, error) {
	var users []domain.User
	var total int64

	// Query Base: Ambil User yang punya Role 'TEACHER'
	query := r.DB.WithContext(ctx).Model(&domain.User{}).
		Joins("JOIN profiles ON profiles.user_id = users.id").
		Where("users.role = ?", domain.RoleTeacher)

	// Filter Search (Nama, NIP, atau Username)
	if filter.Search != "" {
		search := "%" + filter.Search + "%"
		query = query.Where("profiles.full_name ILIKE ? OR profiles.n_ip ILIKE ? OR users.username ILIKE ?", search, search, search)
	}

	if filter.InstitutionID != "" && filter.InstitutionID != "ALL" {
		query = query.Where("EXISTS (SELECT 1 FROM enrollments WHERE enrollments.user_id = users.id AND enrollments.institution_id = ?)", filter.InstitutionID)
	}

	// Filter Gender
	if filter.Gender != "" && filter.Gender != "ALL" {
		query = query.Where("profiles.gender = ?", filter.Gender)
	}

	// Filter Status (Aktif / Menunggu Verifikasi)
	switch filter.Status {
	case "ACTIVE":
		query = query.Where("users.is_active = ?", true)
	case "PENDING":
		query = query.Where("users.is_active = ?", false)
	}

	// Hitung total data keseluruhan (untuk Pagination di Frontend)
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Terapkan Limit dan Offset
	if filter.Limit > 0 {
		offset := (filter.Page - 1) * filter.Limit
		query = query.Limit(filter.Limit).Offset(offset)
	}

	// Eksekusi data dengan melampirkan seluruh sekolah tempat ia mengajar
	err := query.
		Preload("Profile").
		Preload("Enrollments").
		Preload("Enrollments.Institution").
		Order("profiles.full_name ASC").
		Find(&users).Error

	return users, total, err
}

func (r *teacherRepo) CreateOne(ctx context.Context, user *domain.User) error {
	return r.DB.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(user).Error; err != nil {
			return err
		}
		return nil
	})
}

func (r *teacherRepo) BulkCreate(ctx context.Context, users []*domain.User) error {
	return r.DB.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		for _, u := range users {
			if err := tx.Create(u).Error; err != nil {
				return err
			}
		}
		return nil
	})
}

// GetByID mengambil data guru detail
func (r *teacherRepo) GetByID(ctx context.Context, id string) (*domain.User, error) {
	var user domain.User

	// [PERBAIKAN] Menggunakan Limit(1).Find() agar GORM tidak mencetak log merah saat data tidak ada
	result := r.DB.WithContext(ctx).
		Preload("Profile").
		Preload("Enrollments.Institution").
		Where("id = ? AND role = ?", id, domain.RoleTeacher).
		Limit(1).Find(&user)

	if result.Error != nil {
		return nil, result.Error
	}
	if result.RowsAffected == 0 {
		return nil, gorm.ErrRecordNotFound // Tetap kembalikan error ke handler (tanpa log terminal)
	}

	return &user, nil
}

// Update menyimpan perubahan data guru (User, Profile, dan Relasi Lembaga)
func (r *teacherRepo) Update(ctx context.Context, user *domain.User) error {
	return r.DB.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		// 1. Update tabel users (seperti username, password, status)
		if err := tx.Save(user).Error; err != nil {
			return err
		}

		// 2. Update tabel profiles (seperti nama, NIP, gender, kontak)
		if user.Profile != nil {
			if err := tx.Save(user.Profile).Error; err != nil {
				return err
			}
		}

		return nil
	})
}

// Delete menghapus guru secara PERMANEN (Hard Delete)
func (r *teacherRepo) Delete(ctx context.Context, id string) error {
	return r.DB.WithContext(ctx).Unscoped().Delete(&domain.User{}, "id = ?", id).Error
}

func (r *teacherRepo) CreateAttendance(ctx context.Context, ta *domain.TeacherAttendance) error {
	return r.DB.WithContext(ctx).Create(ta).Error
}

func (r *teacherRepo) FetchAttendances(ctx context.Context, instID string, yearMonth string) ([]domain.TeacherAttendance, error) {
	var attendances []domain.TeacherAttendance

	query := r.DB.WithContext(ctx).Model(&domain.TeacherAttendance{}).
		Preload("Teacher").
		Where("institution_id = ?", instID)

	if yearMonth != "" {
		query = query.Where("to_char(date, 'YYYY-MM') = ?", yearMonth)
	}

	err := query.Order("date ASC").Find(&attendances).Error
	return attendances, err
}

func (r *teacherRepo) DeleteAttendance(ctx context.Context, id string) error {
	return r.DB.WithContext(ctx).Delete(&domain.TeacherAttendance{}, "id = ?", id).Error
}
