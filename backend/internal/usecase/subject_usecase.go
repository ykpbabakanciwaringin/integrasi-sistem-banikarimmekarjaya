// LOKASI: internal/usecase/subject_usecase.go
package usecase

import (
	"context"
	"errors"
	"mime/multipart"
	"strings"
	"time"

	"github.com/google/uuid"
	"ykpbabakanciwaringin.id/cbt-backend/internal/domain"
	"ykpbabakanciwaringin.id/cbt-backend/internal/service/importer"
)

type subjectUsecase struct {
	repo     domain.SubjectRepository
	currRepo domain.CurriculumRepository
	importer importer.ExcelImporter
}

// ⚠️ PERINGATAN: Constructor ini berubah, router.go harus di-update nanti
func NewSubjectUsecase(r domain.SubjectRepository, c domain.CurriculumRepository) domain.SubjectUsecase {
	return &subjectUsecase{
		repo:     r,
		currRepo: c,
		importer: importer.NewExcelImporter(),
	}
}

func (uc *subjectUsecase) GetSubjects(ctx context.Context, filter domain.SubjectFilter) (domain.PaginationResult, error) {
	if filter.Page <= 0 {
		filter.Page = 1
	}
	if filter.Limit <= 0 {
		filter.Limit = 10
	}
	data, total, err := uc.repo.Fetch(ctx, filter)
	if err != nil {
		return domain.PaginationResult{}, err
	}
	totalPages := int((total + int64(filter.Limit) - 1) / int64(filter.Limit))
	return domain.PaginationResult{Data: data, Total: total, Page: filter.Page, Limit: filter.Limit, TotalPages: totalPages}, nil
}

func (uc *subjectUsecase) CreateSubject(ctx context.Context, input domain.SubjectInput, operatorID string) (*domain.Subject, error) {
	if input.InstitutionID == "" {
		return nil, errors.New("lembaga wajib diisi")
	}
	newID := uuid.New()
	subject := domain.Subject{
		BaseEntity:    domain.BaseEntity{ID: newID, CreatedAt: time.Now(), UpdatedAt: time.Now(), CreatedBy: operatorID},
		InstitutionID: input.InstitutionID, Code: input.Code, Name: input.Name, Type: input.Type, CurriculumID: input.CurriculumID, SubjectGroupID: input.SubjectGroupID,
	}
	if err := uc.repo.Create(ctx, &subject); err != nil {
		return nil, err
	}
	return uc.repo.GetByID(ctx, newID.String())
}

func (uc *subjectUsecase) UpdateSubject(ctx context.Context, id string, input domain.SubjectInput) (*domain.Subject, error) {
	subject, err := uc.repo.GetByID(ctx, id)
	if err != nil {
		return nil, errors.New("mapel tidak ditemukan")
	}
	subject.Code = input.Code
	subject.Name = input.Name
	subject.Type = input.Type
	subject.CurriculumID = input.CurriculumID
	subject.SubjectGroupID = input.SubjectGroupID
	subject.UpdatedAt = time.Now()
	if err := uc.repo.Update(ctx, subject); err != nil {
		return nil, err
	}
	return uc.repo.GetByID(ctx, id)
}

func (uc *subjectUsecase) DeleteSubject(ctx context.Context, id string) error {
	return uc.repo.Delete(ctx, id)
}

func (uc *subjectUsecase) ImportSubjects(ctx context.Context, instID string, file multipart.File) (int, error) {
	parsedData, err := uc.importer.ParseSubjectExcel(file)
	if err != nil {
		return 0, err
	}

	existingList, _, _ := uc.repo.Fetch(ctx, domain.SubjectFilter{InstitutionID: instID, Limit: 10000})
	existingMap := make(map[string]*domain.Subject)
	for _, v := range existingList {
		vCopy := v
		existingMap[strings.ToUpper(v.Code)] = &vCopy
	}

	curriculums, _, _ := uc.currRepo.FetchCurriculums(ctx, domain.CurriculumFilter{InstitutionID: instID, Limit: 1000})
	currMap := make(map[string]string)
	for _, c := range curriculums {
		currMap[strings.ToUpper(c.Name)] = c.ID.String()
	}

	now := time.Now()
	successCount := 0

	for _, parsed := range parsedData {
		var currIDPtr *string
		if cid, exists := currMap[strings.ToUpper(parsed.CurriculumName)]; exists {
			currIDPtr = &cid
		}

		if existing, exists := existingMap[strings.ToUpper(parsed.Code)]; exists {
			existing.Name = parsed.Name
			existing.Type = parsed.Type
			existing.CurriculumID = currIDPtr
			existing.UpdatedAt = now
			_ = uc.repo.Update(ctx, existing)
			successCount++
			continue
		}

		subject := domain.Subject{
			BaseEntity:    domain.BaseEntity{ID: uuid.New(), CreatedAt: now, UpdatedAt: now, CreatedBy: "IMPORT"},
			InstitutionID: instID, Code: strings.ToUpper(parsed.Code), Name: parsed.Name, Type: parsed.Type, CurriculumID: currIDPtr,
		}
		if err := uc.repo.Create(ctx, &subject); err == nil {
			successCount++
		}
	}

	return successCount, nil
}
