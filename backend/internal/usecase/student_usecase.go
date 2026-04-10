// LOKASI: internal/usecase/student_usecase.go
package usecase

import (
	"context"
	"crypto/rand"
	"fmt"
	"mime/multipart"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
	"banikarimmekarjaya.id/cbt-backend/internal/domain"
	"banikarimmekarjaya.id/cbt-backend/internal/service/importer"
)

type StudentUsecase interface {
	GetStudents(ctx context.Context, filter domain.StudentFilter) ([]domain.User, int64, error)
	GetStudentByID(ctx context.Context, id string) (*domain.User, error)
	CreateStudent(ctx context.Context, input domain.StudentCreateInput) error
	UpdateStudent(ctx context.Context, id string, input domain.StudentUpdateInput) error
	DeleteStudent(ctx context.Context, id string) error
	ImportStudents(ctx context.Context, instID string, file multipart.File) (int, error)
	ResetStudentPassword(ctx context.Context, id string, newPassword string) error
}

type studentUsecase struct {
	studentRepo domain.StudentRepository
	classRepo   domain.ClassRepository
	importer    importer.ExcelImporter
}

func NewStudentUsecase(r domain.StudentRepository, c domain.ClassRepository) StudentUsecase {
	return &studentUsecase{
		studentRepo: r,
		classRepo:   c,
		importer:    importer.NewExcelImporter(),
	}
}

func (uc *studentUsecase) GetStudents(ctx context.Context, filter domain.StudentFilter) ([]domain.User, int64, error) {
	return uc.studentRepo.Fetch(ctx, filter)
}

func (uc *studentUsecase) CreateStudent(ctx context.Context, input domain.StudentCreateInput) error {
	rawPass := input.Password
	if rawPass == "" {
		rawPass = generateSecurePassword(8)
	}

	hashedPass, err := bcrypt.GenerateFromPassword([]byte(rawPass), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	userID := uuid.New()
	now := time.Now()

	instUUID, err := uuid.Parse(input.InstitutionID)
	if err != nil {
		return fmt.Errorf("invalid institution id")
	}

	user := domain.User{
		BaseEntity:    domain.BaseEntity{ID: userID, CreatedBy: "ADMIN", CreatedAt: now, UpdatedAt: now},
		Username:      input.Username,
		Password:      string(hashedPass),
		PasswordPlain: rawPass,
		Role:          domain.RoleStudent,
		IsActive:      true,
	}

	var classIDPtr *string
	if input.ClassID != "" && input.ClassID != "none" {
		classIDPtr = &input.ClassID
	}

	var birthDate time.Time
	if input.BirthDate != "" {
		parsedDate, _ := time.Parse("2006-01-02", input.BirthDate)
		birthDate = parsedDate
	}

	profile := domain.Profile{
		UserID:        userID,
		FullName:      input.FullName,
		NISN:          input.NISN,
		NIK:           input.NIK,
		Gender:        input.Gender,
		PhoneNumber:   input.PhoneNumber,
		Email:         input.Email,
		ClassID:       classIDPtr,
		BirthPlace:    input.BirthPlace,
		BirthDate:     birthDate,
		Pondok:        input.Pondok,
		Asrama:        input.Asrama,
		Kamar:         input.Kamar,
		Program:       input.Program,
		KelasProgram:  input.KelasProgram,
		Address:       input.Address,
		Village:       input.Village,
		Subdistrict:   input.Subdistrict,
		Regency:       input.Regency,
		Province:      input.Province,
		PostalCode:    input.PostalCode,
		FatherName:    input.FatherName,
		MotherName:    input.MotherName,
		GuardianPhone: input.GuardianPhone,
		Status:        input.Status,
		Image:         input.Image,
		Type:          "STUDENT",
	}

	if profile.Status == "" {
		profile.Status = "ACTIVE"
	}
	user.Profile = &profile

	user.Enrollments = []domain.Enrollment{{
		ID:            uuid.New(),
		UserID:        userID,
		InstitutionID: instUUID,
		Role:          domain.RoleStudent,
		Status:        "ACTIVE",
	}}

	return uc.studentRepo.CreateOne(ctx, &user)
}

func (uc *studentUsecase) UpdateStudent(ctx context.Context, id string, input domain.StudentUpdateInput) error {
	user, err := uc.studentRepo.GetByID(ctx, id)
	if err != nil {
		return err
	}

	if input.Username != "" {
		user.Username = input.Username
	}
	if input.Password != "" {
		hashedPass, _ := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
		user.Password = string(hashedPass)
		user.PasswordPlain = input.Password
	}

	if user.Profile != nil {
		if input.FullName != "" {
			user.Profile.FullName = input.FullName
		}
		if input.NISN != "" {
			user.Profile.NISN = input.NISN
		}
		if input.NIK != "" {
			user.Profile.NIK = input.NIK
		}
		if input.Email != "" {
			user.Profile.Email = input.Email
		}
		if input.Gender != "" {
			user.Profile.Gender = input.Gender
		}
		if input.PhoneNumber != "" {
			user.Profile.PhoneNumber = input.PhoneNumber
		}
		if input.BirthPlace != "" {
			user.Profile.BirthPlace = input.BirthPlace
		}
		if input.Status != "" {
			user.Profile.Status = input.Status
		}

		if input.Pondok != "" {
			user.Profile.Pondok = input.Pondok
		}
		if input.Asrama != "" {
			user.Profile.Asrama = input.Asrama
		}
		if input.Kamar != "" {
			user.Profile.Kamar = input.Kamar
		}
		if input.Program != "" {
			user.Profile.Program = input.Program
		}
		if input.KelasProgram != "" {
			user.Profile.KelasProgram = input.KelasProgram
		}

		if input.Address != "" {
			user.Profile.Address = input.Address
		}
		if input.Village != "" {
			user.Profile.Village = input.Village
		}
		if input.Subdistrict != "" {
			user.Profile.Subdistrict = input.Subdistrict
		}
		if input.Regency != "" {
			user.Profile.Regency = input.Regency
		}
		if input.Province != "" {
			user.Profile.Province = input.Province
		}
		if input.PostalCode != "" {
			user.Profile.PostalCode = input.PostalCode
		}
		if input.FatherName != "" {
			user.Profile.FatherName = input.FatherName
		}
		if input.MotherName != "" {
			user.Profile.MotherName = input.MotherName
		}
		if input.GuardianPhone != "" {
			user.Profile.GuardianPhone = input.GuardianPhone
		}

		if input.BirthDate != "" {
			t, _ := time.Parse("2006-01-02", input.BirthDate)
			user.Profile.BirthDate = t
		}

		if input.ClassID != "" {
			if input.ClassID == "none" || input.ClassID == "null" {
				user.Profile.ClassID = nil
			} else {
				cid := input.ClassID
				user.Profile.ClassID = &cid
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
			user.Profile.PhotoURL = input.Image
		}
	}
	return uc.studentRepo.Update(ctx, user)
}

func (uc *studentUsecase) DeleteStudent(ctx context.Context, id string) error {
	user, err := uc.studentRepo.GetByID(ctx, id)
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
	return uc.studentRepo.Delete(ctx, id)
}

func (uc *studentUsecase) GetStudentByID(ctx context.Context, id string) (*domain.User, error) {
	return uc.studentRepo.GetByID(ctx, id)
}

func generateSecurePassword(length int) string {
	const charset = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
	b := make([]byte, length)
	rand.Read(b)
	for i := range b {
		b[i] = charset[int(b[i])%len(charset)]
	}
	return string(b)
}

func (uc *studentUsecase) ImportStudents(ctx context.Context, instID string, file multipart.File) (int, error) {
	// 1. Serahkan pembacaan file ke Importer
	parsedData, err := uc.importer.ParseStudentExcel(file)
	if err != nil {
		return 0, err
	}

	instUUID, err := uuid.Parse(instID)
	if err != nil {
		return 0, fmt.Errorf("invalid institution id")
	}

	classes, _ := uc.classRepo.Fetch(ctx, instID, domain.ClassFilter{})
	classMap := make(map[string]string)
	for _, c := range classes {
		classMap[strings.ToUpper(c.Name)] = c.ID.String()
	}

	existingStudents, _, _ := uc.studentRepo.Fetch(ctx, domain.StudentFilter{InstitutionID: instID, Limit: 10000})
	existingMap := make(map[string]*domain.User)
	for _, s := range existingStudents {
		if s.Profile != nil && s.Profile.NISN != "" {
			existingMap[s.Profile.NISN] = &s
		}
	}

	var usersToInsert []*domain.User
	successCount := 0
	now := time.Now()

	// 2. Loop Data Matang (DTO)
	for _, parsed := range parsedData {
		rawPass := parsed.PasswordPlain
		if rawPass == "" {
			rawPass = "123456"
		}
		hashedPass, _ := bcrypt.GenerateFromPassword([]byte(rawPass), bcrypt.DefaultCost)

		var classIDPtr *string
		if cid, exists := classMap[strings.ToUpper(parsed.ClassName)]; exists {
			classIDPtr = &cid
		}

		var birthDate time.Time
		if parsed.BirthDate != "" {
			t, err := time.Parse("02-01-2006", parsed.BirthDate)
			if err == nil {
				birthDate = t
			}
		}

		statusStr := parsed.Status
		if statusStr == "" {
			statusStr = "ACTIVE"
		}

		if existingUser, exists := existingMap[parsed.NISN]; exists {
			existingUser.Username = parsed.Username
			if parsed.PasswordPlain != "" {
				existingUser.Password = string(hashedPass)
				existingUser.PasswordPlain = rawPass
			}

			if existingUser.Profile != nil {
				existingUser.Profile.FullName = parsed.FullName
				existingUser.Profile.NIK = parsed.NIK
				existingUser.Profile.Gender = strings.ToUpper(parsed.Gender)
				existingUser.Profile.ClassID = classIDPtr
				existingUser.Profile.Status = statusStr

				existingUser.Profile.BirthPlace = parsed.BirthPlace
				existingUser.Profile.BirthDate = birthDate
				existingUser.Profile.Pondok = parsed.Pondok
				existingUser.Profile.Asrama = parsed.Asrama
				existingUser.Profile.Kamar = parsed.Kamar
				existingUser.Profile.Program = parsed.Program
				existingUser.Profile.KelasProgram = parsed.KelasProgram

				existingUser.Profile.Address = parsed.Address
				existingUser.Profile.Village = parsed.Village
				existingUser.Profile.Subdistrict = parsed.Subdistrict
				existingUser.Profile.Regency = parsed.Regency
				existingUser.Profile.Province = parsed.Province
				existingUser.Profile.PostalCode = parsed.PostalCode

				existingUser.Profile.FatherName = parsed.FatherName
				existingUser.Profile.MotherName = parsed.MotherName
				existingUser.Profile.GuardianPhone = parsed.GuardianPhone
			}

			_ = uc.studentRepo.Update(ctx, existingUser)
			successCount++
			continue
		}

		userID := uuid.New()
		user := &domain.User{
			BaseEntity:    domain.BaseEntity{ID: userID, CreatedBy: "IMPORT", CreatedAt: now, UpdatedAt: now},
			Username:      parsed.Username,
			Password:      string(hashedPass),
			PasswordPlain: rawPass,
			Role:          domain.RoleStudent,
			IsActive:      true,
			Profile: &domain.Profile{
				UserID:        userID,
				FullName:      parsed.FullName,
				NISN:          parsed.NISN,
				NIK:           parsed.NIK,
				Gender:        strings.ToUpper(parsed.Gender),
				ClassID:       classIDPtr,
				Type:          "STUDENT",
				Status:        statusStr,
				BirthPlace:    parsed.BirthPlace,
				BirthDate:     birthDate,
				Pondok:        parsed.Pondok,
				Asrama:        parsed.Asrama,
				Kamar:         parsed.Kamar,
				Program:       parsed.Program,
				KelasProgram:  parsed.KelasProgram,
				Address:       parsed.Address,
				Village:       parsed.Village,
				Subdistrict:   parsed.Subdistrict,
				Regency:       parsed.Regency,
				Province:      parsed.Province,
				PostalCode:    parsed.PostalCode,
				FatherName:    parsed.FatherName,
				MotherName:    parsed.MotherName,
				GuardianPhone: parsed.GuardianPhone,
			},
			Enrollments: []domain.Enrollment{{
				ID:            uuid.New(),
				UserID:        userID,
				InstitutionID: instUUID,
				Role:          domain.RoleStudent,
				Status:        "ACTIVE",
			}},
		}

		usersToInsert = append(usersToInsert, user)
		successCount++
	}

	if len(usersToInsert) > 0 {
		if err := uc.studentRepo.BulkCreate(ctx, usersToInsert); err != nil {
			return 0, err
		}
	}
	return successCount, nil
}

func (uc *studentUsecase) ResetStudentPassword(ctx context.Context, id string, newPassword string) error {
	user, err := uc.studentRepo.GetByID(ctx, id)
	if err != nil {
		return err
	}
	hashedPass, _ := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	user.Password = string(hashedPass)
	user.PasswordPlain = newPassword
	return uc.studentRepo.Update(ctx, user)
}
