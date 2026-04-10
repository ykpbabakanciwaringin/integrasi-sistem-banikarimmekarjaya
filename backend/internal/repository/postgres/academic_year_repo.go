package postgres

import (
	"context"

	"gorm.io/gorm"
	"banikarimmekarjaya.id/cbt-backend/internal/domain"
)

type academicYearRepo struct {
	DB *gorm.DB
}

func NewAcademicYearRepository(db *gorm.DB) domain.AcademicYearRepository {
	return &academicYearRepo{DB: db}
}

func (r *academicYearRepo) FetchAll(ctx context.Context, filter domain.AcademicYearFilter) ([]domain.AcademicYear, int64, error) {
	var ays []domain.AcademicYear
	var total int64

	query := r.DB.WithContext(ctx).Model(&domain.AcademicYear{})

	if filter.InstitutionID != "" && filter.InstitutionID != "ALL" {
		query = query.Where("institution_id = ?", filter.InstitutionID)
	}

	if filter.Search != "" {
		searchTerm := "%" + filter.Search + "%"
		query = query.Where("name ILIKE ? OR semester ILIKE ?", searchTerm, searchTerm)
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	if filter.Limit > 0 {
		offset := (filter.Page - 1) * filter.Limit
		query = query.Offset(offset).Limit(filter.Limit)
	}

	err := query.Order("created_at DESC").Find(&ays).Error
	return ays, total, err
}

func (r *academicYearRepo) GetByID(ctx context.Context, id string) (*domain.AcademicYear, error) {
	var ay domain.AcademicYear
	err := r.DB.WithContext(ctx).First(&ay, "id = ?", id).Error
	return &ay, err
}

func (r *academicYearRepo) GetActive(ctx context.Context, instID string) (*domain.AcademicYear, error) {
	var ay domain.AcademicYear
	err := r.DB.WithContext(ctx).Where("institution_id = ? AND is_active = ?", instID, true).First(&ay).Error
	return &ay, err
}

func (r *academicYearRepo) Create(ctx context.Context, ay *domain.AcademicYear) error {
	return r.DB.WithContext(ctx).Create(ay).Error
}

func (r *academicYearRepo) Update(ctx context.Context, ay *domain.AcademicYear) error {
	return r.DB.WithContext(ctx).Save(ay).Error
}

func (r *academicYearRepo) Delete(ctx context.Context, id string) error {
	return r.DB.WithContext(ctx).Delete(&domain.AcademicYear{}, "id = ?", id).Error
}

// Logika penting: Hanya boleh ada 1 Tahun Ajaran Aktif per Lembaga
func (r *academicYearRepo) SetActive(ctx context.Context, id string, instID string) error {
	return r.DB.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		// 1. Set semua tahun ajaran di lembaga tersebut jadi non-aktif
		if err := tx.Model(&domain.AcademicYear{}).
			Where("institution_id = ?", instID).
			Update("is_active", false).Error; err != nil {
			return err
		}

		// 2. Set tahun ajaran yang dipilih menjadi aktif
		if err := tx.Model(&domain.AcademicYear{}).
			Where("id = ? AND institution_id = ?", id, instID).
			Update("is_active", true).Error; err != nil {
			return err
		}

		return nil
	})
}
