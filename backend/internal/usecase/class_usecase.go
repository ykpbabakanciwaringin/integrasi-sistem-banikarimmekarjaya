// LOKASI: internal/usecase/class_usecase.go
package usecase

import (
	"context"
	"mime/multipart"
	"strings"
	"time"

	"github.com/google/uuid"
	"ykpbabakanciwaringin.id/cbt-backend/internal/domain"
	"ykpbabakanciwaringin.id/cbt-backend/internal/service/importer"
)

type ClassUsecase interface {
	GetClasses(ctx context.Context, instID string, filter domain.ClassFilter) ([]domain.Class, error)
	CreateClass(ctx context.Context, input domain.CreateClassInput, operatorID string) (*domain.Class, error)
	UpdateClass(ctx context.Context, id string, input domain.CreateClassInput) (*domain.Class, error)
	DeleteClass(ctx context.Context, id string) error
	ImportClasses(ctx context.Context, instID string, file multipart.File) error
	SetClassHomeroom(ctx context.Context, classID, teacherID string) (*domain.Class, error)
}

type classUsecase struct {
	classRepo   domain.ClassRepository
	teacherRepo domain.TeacherRepository
	importer    importer.ExcelImporter
}

// ⚠️ PERINGATAN: Constructor ini berubah, router.go harus di-update nanti
func NewClassUsecase(r domain.ClassRepository, t domain.TeacherRepository) ClassUsecase {
	return &classUsecase{
		classRepo:   r,
		teacherRepo: t,
		importer:    importer.NewExcelImporter(),
	}
}

func (uc *classUsecase) GetClasses(ctx context.Context, instID string, filter domain.ClassFilter) ([]domain.Class, error) {
	return uc.classRepo.Fetch(ctx, instID, filter)
}

func (uc *classUsecase) CreateClass(ctx context.Context, input domain.CreateClassInput, operatorID string) (*domain.Class, error) {
	newID := uuid.New()
	class := domain.Class{
		BaseEntity:    domain.BaseEntity{ID: newID, CreatedAt: time.Now(), UpdatedAt: time.Now(), CreatedBy: operatorID},
		InstitutionID: input.InstitutionID, Name: input.Name, Level: input.Level, Major: input.Major,
	}
	if err := uc.classRepo.Create(ctx, &class); err != nil {
		return nil, err
	}
	return uc.classRepo.GetByID(ctx, newID.String())
}

func (uc *classUsecase) UpdateClass(ctx context.Context, id string, input domain.CreateClassInput) (*domain.Class, error) {
	class, err := uc.classRepo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	class.Name = input.Name
	class.Level = input.Level
	class.Major = input.Major
	class.UpdatedAt = time.Now()
	if err := uc.classRepo.Update(ctx, class); err != nil {
		return nil, err
	}
	return uc.classRepo.GetByID(ctx, id)
}

func (uc *classUsecase) SetClassHomeroom(ctx context.Context, classID, teacherID string) (*domain.Class, error) {
	if err := uc.classRepo.AssignHomeroom(ctx, classID, teacherID); err != nil {
		return nil, err
	}
	return uc.classRepo.GetByID(ctx, classID)
}

func (uc *classUsecase) DeleteClass(ctx context.Context, id string) error {
	return uc.classRepo.Delete(ctx, id)
}

func (uc *classUsecase) ImportClasses(ctx context.Context, instID string, file multipart.File) error {
	parsedData, err := uc.importer.ParseClassExcel(file)
	if err != nil {
		return err
	}

	existingClasses, _ := uc.classRepo.Fetch(ctx, instID, domain.ClassFilter{})
	existingMap := make(map[string]*domain.Class)
	for _, v := range existingClasses {
		vCopy := v
		existingMap[strings.ToUpper(v.Name)] = &vCopy
	}

	teachers, _, _ := uc.teacherRepo.Fetch(ctx, domain.TeacherFilter{InstitutionID: instID, Limit: 10000})
	teacherMap := make(map[string]string)
	for _, t := range teachers {
		if t.Profile != nil {
			teacherMap[strings.ToUpper(t.Profile.FullName)] = t.ID.String()
		}
	}

	var newClasses []domain.Class
	now := time.Now()

	for _, parsed := range parsedData {
		targetInstID := instID
		if parsed.TargetInstID != "" {
			targetInstID = parsed.TargetInstID
		}

		var teacherIDPtr *string
		if tid, exists := teacherMap[strings.ToUpper(parsed.TeacherName)]; exists {
			teacherIDPtr = &tid
		}

		if existing, exists := existingMap[strings.ToUpper(parsed.Name)]; exists {
			existing.Level = parsed.Level
			existing.Major = parsed.Major
			existing.TeacherID = teacherIDPtr
			existing.UpdatedAt = now
			_ = uc.classRepo.Update(ctx, existing)
			continue
		}

		class := domain.Class{
			BaseEntity:    domain.BaseEntity{ID: uuid.New(), CreatedAt: now, UpdatedAt: now, CreatedBy: "IMPORT"},
			InstitutionID: targetInstID, Name: parsed.Name, Level: parsed.Level, Major: parsed.Major, TeacherID: teacherIDPtr,
		}
		newClasses = append(newClasses, class)
	}

	if len(newClasses) > 0 {
		return uc.classRepo.ImportBatch(ctx, newClasses)
	}
	return nil
}
