package postgres

import (
	"context"

	"gorm.io/gorm"
	"ykpbabakanciwaringin.id/cbt-backend/internal/domain"
)

type accountRepo struct {
	DB *gorm.DB
}

// NewAccountRepository adalah constructor untuk Account Repository
func NewAccountRepository(db *gorm.DB) domain.AccountRepository {
	return &accountRepo{DB: db}
}

// FetchAll mengambil data akun dengan filter, relasi lengkap, dan mencegah duplikasi
func (r *accountRepo) FetchAll(ctx context.Context, filter domain.AccountFilter) ([]domain.User, int64, error) {
	var users []domain.User
	var total int64

	query := r.DB.WithContext(ctx).Model(&domain.User{})

	// Filter Pencarian (Username atau Nama Lengkap)
	if filter.Search != "" {
		search := "%" + filter.Search + "%"
		query = query.Joins("LEFT JOIN profiles ON profiles.user_id = users.id").
			Where("users.username ILIKE ? OR profiles.full_name ILIKE ?", search, search)
	}

	// Filter Role
	if filter.Role != "" && filter.Role != "ALL" {
		query = query.Where("users.role = ?", filter.Role)
	}

	// Filter Lembaga (Mencegah duplikasi dengan EXISTS)
	if filter.InstitutionID != "" && filter.InstitutionID != "ALL" {
		query = query.Where("EXISTS (SELECT 1 FROM enrollments WHERE enrollments.user_id = users.id AND enrollments.institution_id = ?)", filter.InstitutionID)
	}

	// Filter Status
	switch filter.Status {
	case "ACTIVE":
		query = query.Where("users.is_active = ?", true)
	case "PENDING":
		query = query.Where("users.is_active = ?", false)
	}

	// Hitung total data untuk Pagination
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Limit dan Offset
	if filter.Limit > 0 {
		offset := (filter.Page - 1) * filter.Limit
		query = query.Limit(filter.Limit).Offset(offset)
	}

	// Eager Loading Data Relasi (Sangat penting agar Frontend mendapat data utuh)
	err := query.
		Preload("Profile").
		Preload("Profile.Class").
		Preload("Enrollments").
		Preload("Enrollments.Institution").
		Order("users.created_at DESC").
		Find(&users).Error

	return users, total, err
}

// GetByID mengambil detail satu akun
func (r *accountRepo) GetByID(ctx context.Context, id string) (*domain.User, error) {
	var user domain.User
	err := r.DB.WithContext(ctx).
		Preload("Profile").
		Preload("Profile.Class").
		Preload("Enrollments").
		Preload("Enrollments.Institution").
		Where("id = ?", id).
		Limit(1).Find(&user).Error

	if err != nil {
		return nil, err
	}
	if user.ID.String() == "00000000-0000-0000-0000-000000000000" { // Cek jika kosong
		return nil, gorm.ErrRecordNotFound
	}
	return &user, nil
}

// Create menyimpan User dan Profile secara atomik (Transaction)
func (r *accountRepo) Create(ctx context.Context, user *domain.User) error {
	return r.DB.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(user).Error; err != nil {
			return err
		}
		return nil
	})
}

// Update memperbarui data akun dengan aman tanpa merusak relasi lain
func (r *accountRepo) Update(ctx context.Context, user *domain.User) error {
	return r.DB.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		// Update tabel users
		if err := tx.Save(user).Error; err != nil {
			return err
		}
		// Update tabel profiles jika ada
		if user.Profile != nil {
			if err := tx.Save(user.Profile).Error; err != nil {
				return err
			}
		}
		return nil
	})
}

// Delete menghapus akun secara permanen (Hard Delete)
func (r *accountRepo) Delete(ctx context.Context, id string) error {
	return r.DB.WithContext(ctx).Unscoped().Delete(&domain.User{}, "id = ?", id).Error
}

// --- FUNGSI MANAJEMEN PENUGASAN LEMBAGA (ENROLLMENTS) ---

func (r *accountRepo) AddEnrollment(ctx context.Context, enrollment *domain.Enrollment) error {
	return r.DB.WithContext(ctx).Create(enrollment).Error
}

func (r *accountRepo) UpdateEnrollment(ctx context.Context, enrollment *domain.Enrollment) error {
	return r.DB.WithContext(ctx).Save(enrollment).Error
}

func (r *accountRepo) DeleteEnrollment(ctx context.Context, id string) error {
	return r.DB.WithContext(ctx).Delete(&domain.Enrollment{}, "id = ?", id).Error
}

func (r *accountRepo) GetEnrollmentByID(ctx context.Context, id string) (*domain.Enrollment, error) {
	var en domain.Enrollment
	err := r.DB.WithContext(ctx).First(&en, "id = ?", id).Error
	return &en, err
}
