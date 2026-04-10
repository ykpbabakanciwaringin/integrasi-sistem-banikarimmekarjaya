// LOKASI: internal/repository/postgres/subject_repo.go
package postgres

import (
	"context"

	"gorm.io/gorm"
	"ykpbabakanciwaringin.id/cbt-backend/internal/domain"
)

type subjectRepo struct {
	DB *gorm.DB
}

func NewSubjectRepository(db *gorm.DB) domain.SubjectRepository {
	return &subjectRepo{DB: db}
}

func (r *subjectRepo) Fetch(ctx context.Context, filter domain.SubjectFilter) ([]domain.Subject, int64, error) {
	var subjects []domain.Subject
	var total int64

	query := r.DB.WithContext(ctx).Model(&domain.Subject{}).
		Preload("Institution").
		Preload("Curriculum").
		Preload("SubjectGroup")

	// 1. Filter Lembaga
	if filter.InstitutionID != "" && filter.InstitutionID != "ALL" {
		query = query.Where("institution_id = ?", filter.InstitutionID)
	}

	// 2. Pencarian Cerdas (Kode atau Nama)
	if filter.Search != "" {
		searchTerm := "%" + filter.Search + "%"
		query = query.Where("name ILIKE ? OR code ILIKE ?", searchTerm, searchTerm)
	}

	// 3. Hitung Total Data (sebelum dipotong limit)
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// 4. Terapkan Paginasi
	if filter.Limit > 0 {
		offset := (filter.Page - 1) * filter.Limit
		query = query.Offset(offset).Limit(filter.Limit)
	}

	err := query.Order("code ASC, name ASC").Find(&subjects).Error
	return subjects, total, err
}

func (r *subjectRepo) GetByID(ctx context.Context, id string) (*domain.Subject, error) {
	var subject domain.Subject
	err := r.DB.WithContext(ctx).
		Preload("Institution").
		Preload("Curriculum").
		Preload("SubjectGroup").
		First(&subject, "id = ?", id).Error
	return &subject, err
}

func (r *subjectRepo) Create(ctx context.Context, s *domain.Subject) error {
	return r.DB.WithContext(ctx).Create(s).Error
}

func (r *subjectRepo) Update(ctx context.Context, s *domain.Subject) error {
	return r.DB.WithContext(ctx).Save(s).Error
}

func (r *subjectRepo) Delete(ctx context.Context, id string) error {
	return r.DB.WithContext(ctx).Delete(&domain.Subject{}, "id = ?", id).Error
}
