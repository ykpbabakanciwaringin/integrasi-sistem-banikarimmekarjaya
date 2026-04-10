// LOKASI: internal/usecase/curriculum_usecase.go
package usecase

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
	"ykpbabakanciwaringin.id/cbt-backend/internal/domain"
)

type curriculumUsecase struct {
	repo domain.CurriculumRepository
}

func NewCurriculumUsecase(r domain.CurriculumRepository) domain.CurriculumUsecase {
	return &curriculumUsecase{repo: r}
}

func (uc *curriculumUsecase) GetCurriculums(ctx context.Context, filter domain.CurriculumFilter) (domain.PaginationResult, error) {
	if filter.Page <= 0 {
		filter.Page = 1
	}
	if filter.Limit <= 0 {
		filter.Limit = 10
	}

	data, total, err := uc.repo.FetchCurriculums(ctx, filter)
	if err != nil {
		return domain.PaginationResult{}, err
	}

	totalPages := int((total + int64(filter.Limit) - 1) / int64(filter.Limit))

	return domain.PaginationResult{
		Data:       data,
		Total:      total,
		Page:       filter.Page,
		Limit:      filter.Limit,
		TotalPages: totalPages,
	}, nil
}

func (uc *curriculumUsecase) CreateCurriculum(ctx context.Context, instID, operator string, input domain.CurriculumInput) (*domain.Curriculum, error) {
	if instID == "" || instID == "ALL" {
		return nil, errors.New("lembaga (institution_id) wajib dipilih")
	}

	newID := uuid.New()
	c := domain.Curriculum{
		BaseEntity:    domain.BaseEntity{ID: newID, CreatedAt: time.Now(), UpdatedAt: time.Now(), CreatedBy: operator},
		InstitutionID: instID,
		Name:          input.Name,
		IsActive:      input.IsActive,
	}

	if err := uc.repo.CreateCurriculum(ctx, &c); err != nil {
		return nil, err
	}
	return uc.repo.GetByID(ctx, newID.String())
}

func (uc *curriculumUsecase) UpdateCurriculum(ctx context.Context, id string, input domain.CurriculumInput) (*domain.Curriculum, error) {
	updateData := map[string]interface{}{"name": input.Name, "is_active": input.IsActive}
	if err := uc.repo.UpdateCurriculum(ctx, id, updateData); err != nil {
		return nil, err
	}
	return uc.repo.GetByID(ctx, id)
}

func (uc *curriculumUsecase) DeleteCurriculum(ctx context.Context, id string) error {
	return uc.repo.DeleteCurriculum(ctx, id)
}

func (uc *curriculumUsecase) GetSubjectGroups(ctx context.Context, curriculumID string) ([]domain.SubjectGroup, error) {
	return uc.repo.FetchSubjectGroups(ctx, curriculumID)
}

func (uc *curriculumUsecase) CreateSubjectGroup(ctx context.Context, curriculumID, operator string, input domain.SubjectGroupInput) (*domain.SubjectGroup, error) {
	newID := uuid.New()
	sg := domain.SubjectGroup{
		BaseEntity:   domain.BaseEntity{ID: newID, CreatedAt: time.Now(), UpdatedAt: time.Now(), CreatedBy: operator},
		CurriculumID: curriculumID,
		Name:         input.Name,
	}
	if err := uc.repo.CreateSubjectGroup(ctx, &sg); err != nil {
		return nil, err
	}
	return uc.repo.GetGroupByID(ctx, newID.String())
}

func (uc *curriculumUsecase) DeleteSubjectGroup(ctx context.Context, id string) error {
	return uc.repo.DeleteSubjectGroup(ctx, id)
}

func (uc *curriculumUsecase) GetHolidays(ctx context.Context, filter domain.HolidayFilter) (domain.PaginationResult, error) {
	if filter.Page <= 0 {
		filter.Page = 1
	}
	if filter.Limit <= 0 {
		filter.Limit = 10
	}

	data, total, err := uc.repo.FetchHolidays(ctx, filter)
	if err != nil {
		return domain.PaginationResult{}, err
	}

	totalPages := int((total + int64(filter.Limit) - 1) / int64(filter.Limit))

	return domain.PaginationResult{
		Data:       data,
		Total:      total,
		Page:       filter.Page,
		Limit:      filter.Limit,
		TotalPages: totalPages,
	}, nil
}

func (uc *curriculumUsecase) CreateHoliday(ctx context.Context, instID string, input domain.HolidayInput) (*domain.Holiday, error) {
	parsedDate, err := time.Parse("2006-01-02", input.Date)
	if err != nil {
		return nil, errors.New("format tanggal tidak valid, gunakan YYYY-MM-DD")
	}

	h := domain.Holiday{
		BaseEntity: domain.BaseEntity{
			ID:        uuid.New(),
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		},
		Date:     parsedDate,
		Name:     input.Name,
		IsGlobal: input.IsGlobal,
	}

	if !input.IsGlobal && instID != "" {
		idCopy := instID
		h.InstitutionID = &idCopy
	} else {
		h.InstitutionID = nil
	}

	if err := uc.repo.CreateHoliday(ctx, &h); err != nil {
		return nil, err
	}
	return &h, nil
}

func (uc *curriculumUsecase) DeleteHoliday(ctx context.Context, id string) error {
	return uc.repo.DeleteHoliday(ctx, id)
}

// LOKASI: internal/usecase/curriculum_usecase.go
// ... (biarkan fungsi lainnya tetap sama) ...

func (uc *curriculumUsecase) UpdateHoliday(ctx context.Context, id string, input domain.HolidayInput) (*domain.Holiday, error) {
	parsedDate, err := time.Parse("2006-01-02", input.Date)
	if err != nil {
		return nil, errors.New("format tanggal tidak valid, gunakan YYYY-MM-DD")
	}

	h := domain.Holiday{
		BaseEntity: domain.BaseEntity{ID: uuid.MustParse(id)},
	}

	h.Date = parsedDate
	h.Name = input.Name
	h.IsGlobal = input.IsGlobal
	h.UpdatedAt = time.Now()

	if !input.IsGlobal && input.InstitutionID != "" {
		idCopy := input.InstitutionID
		h.InstitutionID = &idCopy
	} else {
		h.InstitutionID = nil
	}

	if err := uc.repo.UpdateHoliday(ctx, &h); err != nil {
		return nil, err
	}
	return &h, nil
}
