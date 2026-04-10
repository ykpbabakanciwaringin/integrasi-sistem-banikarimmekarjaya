// LOKASI: internal/usecase/teacher_usecase.go
package usecase

import (
	"context"
	"fmt"
	"mime/multipart"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/google/uuid"
	"ykpbabakanciwaringin.id/cbt-backend/internal/domain"
	"ykpbabakanciwaringin.id/cbt-backend/internal/service/importer"
	"ykpbabakanciwaringin.id/cbt-backend/pkg/utils"
)

type TeacherUsecase interface {
	GetTeachers(ctx context.Context, filter domain.TeacherFilter) ([]domain.User, int64, error)
	GetTeacherByID(ctx context.Context, id string) (*domain.User, error)
	CreateTeacher(ctx context.Context, input domain.TeacherCreateInput) error
	UpdateTeacher(ctx context.Context, id string, input domain.TeacherUpdateInput) error
	DeleteTeacher(ctx context.Context, id string) error
	ImportTeachers(ctx context.Context, instID string, file multipart.File) (int, error)

	SubmitAttendance(ctx context.Context, instID, operatorID string, input domain.TeacherAttendanceInput) error
	GetAttendances(ctx context.Context, instID string, yearMonth string) ([]domain.TeacherAttendance, error)
}

type teacherUsecase struct {
	teacherRepo domain.TeacherRepository
	importer    importer.ExcelImporter
}

func NewTeacherUsecase(r domain.TeacherRepository) TeacherUsecase {
	return &teacherUsecase{
		teacherRepo: r,
		importer:    importer.NewExcelImporter(),
	}
}

func (uc *teacherUsecase) GetTeachers(ctx context.Context, filter domain.TeacherFilter) ([]domain.User, int64, error) {
	if filter.Limit <= 0 {
		filter.Limit = 10
	}
	if filter.Page <= 0 {
		filter.Page = 1
	}
	return uc.teacherRepo.Fetch(ctx, filter)
}

func (uc *teacherUsecase) CreateTeacher(ctx context.Context, input domain.TeacherCreateInput) error {
	if input.Password == "" {
		input.Password = "123456"
	}
	hashedPass, err := utils.HashPassword(input.Password)
	if err != nil {
		return err
	}

	userID := uuid.New()
	now := time.Now()

	instUUID, err := uuid.Parse(input.InstitutionID)
	if err != nil {
		return fmt.Errorf("invalid institution id")
	}

	var birthDate time.Time
	if input.BirthDate != "" {
		parsedDate, err := time.Parse("2006-01-02", input.BirthDate)
		if err == nil {
			birthDate = parsedDate
		}
	}

	user := domain.User{
		BaseEntity: domain.BaseEntity{ID: userID, CreatedBy: input.CreatedBy, CreatedAt: now, UpdatedAt: now},
		Username:   input.Username,
		Password:   hashedPass,
		Role:       domain.RoleTeacher,
		IsActive:   true,
	}

	profile := domain.Profile{
		UserID:      userID,
		FullName:    input.FullName,
		NIK:         input.NIK,
		NIP:         input.NIP,
		Position:    input.Position,
		Gender:      input.Gender,
		PhoneNumber: input.PhoneNumber,
		Email:       input.Email,
		BirthPlace:  input.BirthPlace,
		BirthDate:   birthDate,
		Type:        "TEACHER",
		Image:       input.Image,
		Status:      input.Status,
	}
	if profile.Status == "" {
		profile.Status = "ACTIVE"
	}
	user.Profile = &profile

	user.Enrollments = []domain.Enrollment{{
		ID:            uuid.New(),
		UserID:        userID,
		InstitutionID: instUUID,
		Role:          domain.RoleTeacher,
		Status:        "ACTIVE",
	}}

	return uc.teacherRepo.CreateOne(ctx, &user)
}

func (uc *teacherUsecase) UpdateTeacher(ctx context.Context, id string, input domain.TeacherUpdateInput) error {
	user, err := uc.teacherRepo.GetByID(ctx, id)
	if err != nil {
		return err
	}

	if input.Username != "" {
		user.Username = input.Username
	}
	if input.Password != "" {
		hashedPass, _ := utils.HashPassword(input.Password)
		user.Password = hashedPass
	}

	if user.Profile != nil {
		if input.FullName != "" {
			user.Profile.FullName = input.FullName
		}
		if input.NIK != "" {
			user.Profile.NIK = input.NIK
		}
		if input.NIP != "" {
			user.Profile.NIP = input.NIP
		}
		if input.Gender != "" {
			user.Profile.Gender = input.Gender
		}
		if input.PhoneNumber != "" {
			user.Profile.PhoneNumber = input.PhoneNumber
		}
		if input.Email != "" {
			user.Profile.Email = input.Email
		}
		if input.BirthPlace != "" {
			user.Profile.BirthPlace = input.BirthPlace
		}
		if input.Position != "" {
			user.Profile.Position = input.Position
		}
		if input.Status != "" {
			user.Profile.Status = input.Status
		}

		if input.BirthDate != "" {
			parsedDate, err := time.Parse("2006-01-02", input.BirthDate)
			if err == nil {
				user.Profile.BirthDate = parsedDate
			}
		}

		if input.Image != "" {
			if user.Profile.Image != "" && user.Profile.Image != input.Image {
				oldImageURL := user.Profile.Image
				var relativePath string
				if strings.HasPrefix(oldImageURL, "http") {
					parts := strings.Split(oldImageURL, "/")
					if len(parts) >= 4 {
						relativePath = strings.Join(parts[3:], "/")
					}
				} else {
					relativePath = strings.TrimPrefix(oldImageURL, "/")
				}
				if relativePath != "" {
					oldPath := filepath.Join("static", relativePath)
					_ = os.Remove(oldPath)
				}
			}
			user.Profile.Image = input.Image
		}
	}
	return uc.teacherRepo.Update(ctx, user)
}

func (uc *teacherUsecase) DeleteTeacher(ctx context.Context, id string) error {
	user, err := uc.teacherRepo.GetByID(ctx, id)
	if err == nil && user != nil && user.Profile != nil && user.Profile.Image != "" {
		oldImageURL := user.Profile.Image
		var relativePath string
		if strings.HasPrefix(oldImageURL, "http") {
			parts := strings.Split(oldImageURL, "/")
			if len(parts) >= 4 {
				relativePath = strings.Join(parts[3:], "/")
			}
		} else {
			relativePath = strings.TrimPrefix(oldImageURL, "/")
		}
		if relativePath != "" {
			oldPath := filepath.Join("static", relativePath)
			_ = os.Remove(oldPath)
		}
	}
	return uc.teacherRepo.Delete(ctx, id)
}

func (uc *teacherUsecase) ImportTeachers(ctx context.Context, instID string, file multipart.File) (int, error) {
	parsedData, err := uc.importer.ParseTeacherExcel(file)
	if err != nil {
		return 0, err
	}

	instUUID, err := uuid.Parse(instID)
	if err != nil {
		return 0, fmt.Errorf("invalid institution id")
	}

	var usersToInsert []*domain.User
	successCount := 0
	now := time.Now()

	for _, parsed := range parsedData {
		rawPass := parsed.PasswordPlain
		if rawPass == "" {
			rawPass = "123456"
		}
		hashedPass, _ := utils.HashPassword(rawPass)
		userID := uuid.New()

		user := &domain.User{
			BaseEntity: domain.BaseEntity{ID: userID, CreatedBy: "IMPORT", CreatedAt: now, UpdatedAt: now},
			Username:   parsed.Username,
			Password:   hashedPass,
			Role:       domain.RoleTeacher,
			IsActive:   true,
		}

		position := parsed.Position
		if position == "" {
			position = "GURU MAPEL"
		}

		profile := domain.Profile{
			UserID:      userID,
			FullName:    parsed.FullName,
			NIP:         parsed.NIP,
			NIK:         parsed.NIK,
			Gender:      strings.ToUpper(parsed.Gender),
			PhoneNumber: parsed.WhatsApp,
			Type:        "TEACHER",
		}
		user.Profile = &profile

		user.Enrollments = []domain.Enrollment{{
			ID:            uuid.New(),
			UserID:        userID,
			InstitutionID: instUUID,
			Role:          domain.RoleTeacher,
			Position:      position,
			Status:        "ACTIVE",
		}}

		usersToInsert = append(usersToInsert, user)
		successCount++
	}

	if len(usersToInsert) > 0 {
		if err := uc.teacherRepo.BulkCreate(ctx, usersToInsert); err != nil {
			return 0, err
		}
	}

	return successCount, nil
}

func (uc *teacherUsecase) GetTeacherByID(ctx context.Context, id string) (*domain.User, error) {
	return uc.teacherRepo.GetByID(ctx, id)
}

func (uc *teacherUsecase) SubmitAttendance(ctx context.Context, instID, operatorID string, input domain.TeacherAttendanceInput) error {
	parsedDate, err := time.Parse("2006-01-02", input.Date)
	if err != nil {
		return fmt.Errorf("format tanggal tidak valid, gunakan YYYY-MM-DD")
	}

	attendance := &domain.TeacherAttendance{
		BaseEntity:    domain.BaseEntity{ID: uuid.New(), CreatedAt: time.Now(), UpdatedAt: time.Now()},
		InstitutionID: instID,
		TeacherID:     input.TeacherID,
		Date:          parsedDate,
		Status:        input.Status,
		Notes:         input.Notes,
		CreatedBy:     operatorID,
	}

	return uc.teacherRepo.CreateAttendance(ctx, attendance)
}

func (uc *teacherUsecase) GetAttendances(ctx context.Context, instID string, yearMonth string) ([]domain.TeacherAttendance, error) {
	return uc.teacherRepo.FetchAttendances(ctx, instID, yearMonth)
}
