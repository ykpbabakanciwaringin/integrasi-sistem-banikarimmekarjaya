// LOKASI: internal/repository/postgres/class_repo.go
package postgres

import (
	"context"
	"errors"

	"gorm.io/gorm"
	"banikarimmekarjaya.id/cbt-backend/internal/domain"
)

var (
	ErrNotFound = errors.New("data tidak ditemukan")
	ErrConflict = errors.New("data sudah ada atau terjadi konflik")
)

// ==========================================
// --- CLASS REPOSITORY IMPLEMENTATION ---
// ==========================================

type classRepo struct {
	DB *gorm.DB
}

func NewClassRepository(db *gorm.DB) domain.ClassRepository {
	return &classRepo{DB: db}
}

// Fetch: Update agar memuat data Wali Kelas (Preload Teacher)
func (r *classRepo) Fetch(ctx context.Context, instID string, filter domain.ClassFilter) ([]domain.Class, error) {
	var classes []domain.Class

	query := r.DB.WithContext(ctx).
		Preload("Institution").
		Preload("Teacher") // Load data Wali Kelas

	if instID != "" && instID != "ALL" {
		query = query.Where("institution_id = ?", instID)
	}

	if filter.Level != "" && filter.Level != "ALL" {
		query = query.Where("level = ?", filter.Level)
	}

	if filter.Major != "" {
		query = query.Where("major ILIKE ?", "%"+filter.Major+"%")
	}

	if filter.Search != "" {
		query = query.Where("name ILIKE ?", "%"+filter.Search+"%")
	}

	err := query.Order("level ASC, major ASC, name ASC").Find(&classes).Error
	return classes, err
}

func (r *classRepo) GetByID(ctx context.Context, id string) (*domain.Class, error) {
	var c domain.Class
	err := r.DB.WithContext(ctx).
		Preload("Institution").
		Preload("Teacher").
		First(&c, "id = ?", id).Error
	if err != nil {
		return nil, domain.ErrNotFound
	}
	return &c, nil
}

func (r *classRepo) Create(ctx context.Context, c *domain.Class) error {
	if c.InstitutionID == "" {
		return errors.New("lembaga (institution_id) wajib dipilih")
	}

	var count int64
	err := r.DB.WithContext(ctx).Model(&domain.Class{}).
		Where("institution_id = ? AND name = ?", c.InstitutionID, c.Name).
		Count(&count).Error

	if err != nil {
		return err
	}

	if count > 0 {
		return domain.ErrConflict
	}

	return r.DB.WithContext(ctx).Create(c).Error
}

func (r *classRepo) Update(ctx context.Context, c *domain.Class) error {
	return r.DB.WithContext(ctx).Save(c).Error
}

// AssignHomeroom: Set Wali Kelas
func (r *classRepo) AssignHomeroom(ctx context.Context, classID, teacherID string) error {
	return r.DB.WithContext(ctx).Model(&domain.Class{}).
		Where("id = ?", classID).
		Update("teacher_id", teacherID).Error
}

// [SEMPURNA] Pelindung Hapus Data Kelas
// [SEMPURNA] Pelindung Hapus Data Kelas
func (r *classRepo) Delete(ctx context.Context, id string) error {
	// 1. Cek apakah masih ada siswa di kelas ini
	var studentCount int64
	r.DB.WithContext(ctx).Model(&domain.Profile{}).Where("class_id = ?", id).Count(&studentCount)
	if studentCount > 0 {
		return errors.New("gagal: tidak dapat menghapus kelas yang masih memiliki siswa")
	}

	// 2. Cek apakah kelas ini masih memiliki jadwal/penugasan mata pelajaran
	var assignmentCount int64
	r.DB.WithContext(ctx).Model(&domain.TeachingAllocation{}).Where("class_id = ?", id).Count(&assignmentCount)
	if assignmentCount > 0 {
		return errors.New("gagal: kelas tidak dapat dihapus karena masih terkait dengan jadwal/penugasan guru")
	}

	// Jika aman, baru kelas dihapus
	return r.DB.WithContext(ctx).Delete(&domain.Class{}, "id = ?", id).Error
}

func (r *classRepo) ImportBatch(ctx context.Context, classes []domain.Class) error {
	return r.DB.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		for _, c := range classes {
			var count int64
			tx.Model(&domain.Class{}).Where("institution_id = ? AND name = ?", c.InstitutionID, c.Name).Count(&count)
			if count == 0 {
				if err := tx.Create(&c).Error; err != nil {
					return err
				}
			}
		}
		return nil
	})
}
