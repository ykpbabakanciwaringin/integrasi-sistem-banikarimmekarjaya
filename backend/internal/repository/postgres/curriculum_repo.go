// LOKASI: internal/repository/postgres/curriculum_repo.go
package postgres

import (
	"context"

	"gorm.io/gorm"
	"banikarimmekarjaya.id/cbt-backend/internal/domain"
)

type curriculumRepo struct {
	DB *gorm.DB
}

func NewCurriculumRepository(db *gorm.DB) domain.CurriculumRepository {
	return &curriculumRepo{DB: db}
}

func (r *curriculumRepo) GetByID(ctx context.Context, id string) (*domain.Curriculum, error) {
	var c domain.Curriculum
	err := r.DB.WithContext(ctx).First(&c, "id = ?", id).Error
	return &c, err
}

func (r *curriculumRepo) GetGroupByID(ctx context.Context, id string) (*domain.SubjectGroup, error) {
	var sg domain.SubjectGroup
	err := r.DB.WithContext(ctx).First(&sg, "id = ?", id).Error
	return &sg, err
}

func (r *curriculumRepo) FetchCurriculums(ctx context.Context, filter domain.CurriculumFilter) ([]domain.Curriculum, int64, error) {
	var results []domain.Curriculum
	var total int64
	query := r.DB.WithContext(ctx).Model(&domain.Curriculum{})

	if filter.InstitutionID != "" && filter.InstitutionID != "ALL" {
		query = query.Where("institution_id = ?", filter.InstitutionID)
	}

	if filter.Search != "" {
		searchTerm := "%" + filter.Search + "%"
		query = query.Where("name ILIKE ?", searchTerm)
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	if filter.Limit > 0 {
		offset := (filter.Page - 1) * filter.Limit
		query = query.Offset(offset).Limit(filter.Limit)
	}

	err := query.Order("created_at DESC").Find(&results).Error
	return results, total, err
}

func (r *curriculumRepo) CreateCurriculum(ctx context.Context, c *domain.Curriculum) error {
	return r.DB.WithContext(ctx).Create(c).Error
}

func (r *curriculumRepo) UpdateCurriculum(ctx context.Context, id string, data map[string]interface{}) error {
	return r.DB.WithContext(ctx).Model(&domain.Curriculum{}).Where("id = ?", id).Updates(data).Error
}

func (r *curriculumRepo) DeleteCurriculum(ctx context.Context, id string) error {
	return r.DB.WithContext(ctx).Delete(&domain.Curriculum{}, "id = ?", id).Error
}

func (r *curriculumRepo) FetchSubjectGroups(ctx context.Context, curriculumID string) ([]domain.SubjectGroup, error) {
	var results []domain.SubjectGroup
	err := r.DB.WithContext(ctx).Where("curriculum_id = ?", curriculumID).Order("created_at ASC").Find(&results).Error
	return results, err
}

func (r *curriculumRepo) CreateSubjectGroup(ctx context.Context, sg *domain.SubjectGroup) error {
	return r.DB.WithContext(ctx).Create(sg).Error
}

func (r *curriculumRepo) DeleteSubjectGroup(ctx context.Context, id string) error {
	return r.DB.WithContext(ctx).Delete(&domain.SubjectGroup{}, "id = ?", id).Error
}

func (r *curriculumRepo) FetchHolidays(ctx context.Context, filter domain.HolidayFilter) ([]domain.Holiday, int64, error) {
	var holidays []domain.Holiday
	var total int64
	query := r.DB.WithContext(ctx).Model(&domain.Holiday{})

	if filter.InstitutionID != "" && filter.InstitutionID != "ALL" {
		query = query.Where("(institution_id = ? OR is_global = true)", filter.InstitutionID)
	}

	if filter.YearMonth != "" {
		query = query.Where("to_char(date, 'YYYY-MM') = ?", filter.YearMonth)
	}

	if filter.Search != "" {
		searchTerm := "%" + filter.Search + "%"
		query = query.Where("name ILIKE ?", searchTerm)
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	if filter.Limit > 0 {
		offset := (filter.Page - 1) * filter.Limit
		query = query.Offset(offset).Limit(filter.Limit)
	}

	err := query.Order("date ASC").Find(&holidays).Error
	return holidays, total, err
}

func (r *curriculumRepo) CreateHoliday(ctx context.Context, h *domain.Holiday) error {
	return r.DB.WithContext(ctx).Create(h).Error
}

func (r *curriculumRepo) DeleteHoliday(ctx context.Context, id string) error {
	return r.DB.WithContext(ctx).Delete(&domain.Holiday{}, "id = ?", id).Error
}

func (r *curriculumRepo) UpdateHoliday(ctx context.Context, h *domain.Holiday) error {
	return r.DB.WithContext(ctx).Save(h).Error
}
