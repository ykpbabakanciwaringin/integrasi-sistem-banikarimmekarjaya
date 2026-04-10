package postgres

import (
	"context"

	"gorm.io/gorm"
	"banikarimmekarjaya.id/cbt-backend/internal/domain"
)

type studentRepo struct {
	DB *gorm.DB
}

func NewStudentRepository(db *gorm.DB) domain.StudentRepository {
	return &studentRepo{DB: db}
}

func (r *studentRepo) Fetch(ctx context.Context, filter domain.StudentFilter) ([]domain.User, int64, error) {
	var users []domain.User
	var total int64

	// Base Query: Pastikan hanya mengambil user dengan Role Student
	query := r.DB.WithContext(ctx).Model(&domain.User{}).
		Joins("JOIN enrollments ON enrollments.user_id = users.id").
		Joins("JOIN profiles ON profiles.user_id = users.id").
		Where("enrollments.role = ?", domain.RoleStudent)

	// Filter Lembaga
	if filter.InstitutionID != "" && filter.InstitutionID != "ALL" {
		query = query.Where("enrollments.institution_id = ?", filter.InstitutionID)
	}

	// Filter Kelas
	if filter.ClassID != "" && filter.ClassID != "ALL" {
		query = query.Where("profiles.class_id = ?", filter.ClassID)
	}

	if filter.Gender != "" && filter.Gender != "ALL" {
		query = query.Where("profiles.gender = ?", filter.Gender)
	}

	if filter.AcademicStatus != "" && filter.AcademicStatus != "ALL" {
		query = query.Where("profiles.status = ?", filter.AcademicStatus)
	}

	// Filter Pencarian (Nama, NISN, atau Username)
	if filter.Search != "" {
		search := "%" + filter.Search + "%"
		query = query.Where("(profiles.full_name ILIKE ? OR profiles.nisn ILIKE ? OR users.username ILIKE ?)", search, search, search)
	}

	// Filter Tab Status (ACTIVE / PENDING untuk verifikasi)
	switch filter.Status {
	case "PENDING":
		query = query.Where("users.is_active = ?", false)
	case "ACTIVE":
		query = query.Where("users.is_active = ?", true)
	}

	// Hitung total data sebelum limit/offset untuk keperluan paginasi di UI
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Pengaturan Paginasi
	if filter.Page <= 0 {
		filter.Page = 1
	}
	if filter.Limit <= 0 {
		filter.Limit = 10
	}
	offset := (filter.Page - 1) * filter.Limit

	// Eksekusi Query dengan Eager Loading relasi lengkap
	err := query.
		Preload("Profile").
		Preload("Profile.Class").
		Preload("Enrollments.Institution").
		Offset(offset).
		Limit(filter.Limit).
		Order("users.created_at DESC").
		Find(&users).Error

	return users, total, err
}

func (r *studentRepo) CreateOne(ctx context.Context, user *domain.User) error {
	return r.DB.WithContext(ctx).Create(user).Error
}

func (r *studentRepo) BulkCreate(ctx context.Context, users []*domain.User) error {
	return r.DB.WithContext(ctx).CreateInBatches(users, 100).Error
}

func (r *studentRepo) GetByID(ctx context.Context, id string) (*domain.User, error) {
	var user domain.User
	result := r.DB.WithContext(ctx).
		Preload("Profile").
		Preload("Profile.Class").
		Preload("Enrollments.Institution").
		Where("id = ? AND role = ?", id, domain.RoleStudent).
		Limit(1).Find(&user)

	if result.Error != nil {
		return nil, result.Error
	}
	if result.RowsAffected == 0 {
		return nil, gorm.ErrRecordNotFound
	}

	return &user, nil
}

func (r *studentRepo) Update(ctx context.Context, user *domain.User) error {
	return r.DB.WithContext(ctx).Transaction(func(tx *gorm.DB) error {

		// 1. 🔥 HACK GORM: Hapus memori cache relasi class agar ID baru bisa tertulis (termasuk NULL)
		if user.Profile != nil {
			user.Profile.Class = nil
		}

		// 2. Simpan data utama User (username, password, dsb)
		if err := tx.Model(user).Omit("Profile", "Enrollments").Updates(user).Error; err != nil {
			return err
		}

		// 3. Simpan data Profile secara Mutlak (OVERWRITE)
		if user.Profile != nil {
			// Select("*") memaksa semua kolom diperbarui sesuai isi Profile terbaru dari Usecase
			if err := tx.Model(&domain.Profile{}).
				Where("user_id = ?", user.ID).
				Select("*").
				Updates(user.Profile).Error; err != nil {
				return err
			}
		}

		return nil
	})
}

func (r *studentRepo) Delete(ctx context.Context, id string) error {
	return r.DB.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("user_id = ?", id).Delete(&domain.Profile{}).Error; err != nil {
			return err
		}
		if err := tx.Where("user_id = ?", id).Delete(&domain.Enrollment{}).Error; err != nil {
			return err
		}
		if err := tx.Where("id = ?", id).Delete(&domain.User{}).Error; err != nil {
			return err
		}
		return nil
	})
}
