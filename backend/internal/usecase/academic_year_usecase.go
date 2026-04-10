package usecase

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
	"ykpbabakanciwaringin.id/cbt-backend/internal/domain"
)

type academicYearUsecase struct {
	repo domain.AcademicYearRepository
}

func NewAcademicYearUsecase(r domain.AcademicYearRepository) domain.AcademicYearUsecase {
	return &academicYearUsecase{repo: r}
}

func (uc *academicYearUsecase) GetAcademicYears(ctx context.Context, filter domain.AcademicYearFilter) (domain.PaginationResult, error) {
	if filter.Page <= 0 {
		filter.Page = 1
	}
	if filter.Limit <= 0 {
		filter.Limit = 10
	}

	data, total, err := uc.repo.FetchAll(ctx, filter)
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

func (uc *academicYearUsecase) GetActiveAcademicYear(ctx context.Context, instID string) (*domain.AcademicYear, error) {
	return uc.repo.GetActive(ctx, instID)
}

// LOKASI: internal/usecase/academic_year_usecase.go

func (uc *academicYearUsecase) CreateAcademicYear(ctx context.Context, instID, operator string, input domain.AcademicYearInput) (*domain.AcademicYear, error) {
	if instID == "" || instID == "ALL" {
		return nil, errors.New("lembaga (institution_id) wajib valid")
	}

	newID := uuid.New()
	ay := domain.AcademicYear{
		BaseEntity: domain.BaseEntity{
			ID:        newID,
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
			CreatedBy: operator,
		},
		InstitutionID: instID,
		Name:          input.Name,
		Semester:      input.Semester,
		IsActive:      false,
	}

	if err := uc.repo.Create(ctx, &ay); err != nil {
		return nil, err
	}
	return uc.repo.GetByID(ctx, newID.String())
}

func (uc *academicYearUsecase) UpdateAcademicYear(ctx context.Context, id string, input domain.AcademicYearInput) (*domain.AcademicYear, error) {
	ay, err := uc.repo.GetByID(ctx, id)
	if err != nil {
		return nil, errors.New("tahun ajaran tidak ditemukan")
	}

	ay.Name = input.Name
	ay.Semester = input.Semester
	ay.UpdatedAt = time.Now()

	if err := uc.repo.Update(ctx, ay); err != nil {
		return nil, err
	}
	return uc.repo.GetByID(ctx, id)
}

func (uc *academicYearUsecase) SetActiveAcademicYear(ctx context.Context, id string, instID string) (*domain.AcademicYear, error) {
	ay, err := uc.repo.GetByID(ctx, id)
	if err != nil {
		return nil, errors.New("tahun ajaran tidak ditemukan")
	}

	if err := uc.repo.SetActive(ctx, id, ay.InstitutionID); err != nil {
		return nil, err
	}
	return uc.repo.GetByID(ctx, id)
}

func (uc *academicYearUsecase) DeleteAcademicYear(ctx context.Context, id string) error {
	ay, err := uc.repo.GetByID(ctx, id)
	if err != nil {
		return err
	}
	if ay.IsActive {
		return errors.New("tidak dapat menghapus tahun ajaran yang sedang aktif")
	}
	return uc.repo.Delete(ctx, id)
}
