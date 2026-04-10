package usecase

import (
	"context"
	"errors"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/google/uuid"
	"banikarimmekarjaya.id/cbt-backend/internal/domain"
	"banikarimmekarjaya.id/cbt-backend/pkg/utils"
)

type AccountUsecase interface {
	GetAccounts(ctx context.Context, filter domain.AccountFilter) ([]domain.User, int64, error)
	GetAccountByID(ctx context.Context, id string) (*domain.User, error)
	CreateAccount(ctx context.Context, input domain.AccountCreateInput, actorRole string) error
	UpdateAccount(ctx context.Context, targetID string, actorRole string, input domain.AccountUpdateInput) error
	DeleteAccount(ctx context.Context, id string, actorRole string) error
	// Enrollment Management
	AddUserEnrollment(ctx context.Context, userID string, input domain.AddEnrollmentInput) error
	UpdateUserEnrollment(ctx context.Context, userID, enrollmentID, role, position string) error
	DeleteUserEnrollment(ctx context.Context, userID, enrollmentID string) error
}

type accountUsecase struct {
	accountRepo domain.AccountRepository
}

func NewAccountUsecase(repo domain.AccountRepository) AccountUsecase {
	return &accountUsecase{accountRepo: repo}
}

func (uc *accountUsecase) GetAccounts(ctx context.Context, filter domain.AccountFilter) ([]domain.User, int64, error) {
	// Beri default value jika kosong
	if filter.Page <= 0 {
		filter.Page = 1
	}
	if filter.Limit <= 0 {
		filter.Limit = 10
	}

	return uc.accountRepo.FetchAll(ctx, filter)
}

func (uc *accountUsecase) CreateAccount(ctx context.Context, input domain.AccountCreateInput, actorRole string) error {
	// Validasi Hak Akses: Hanya Super Admin yang bisa membuat Super Admin baru
	if input.Role == domain.RoleSuperAdmin && actorRole != domain.RoleSuperAdmin {
		return errors.New("akses ditolak: hanya Super Admin yang dapat membuat Super Admin baru")
	}

	hashedPassword, err := utils.HashPassword(input.Password)
	if err != nil {
		return errors.New("gagal memproses kata sandi")
	}

	userID := uuid.New()
	user := &domain.User{
		BaseEntity: domain.BaseEntity{
			ID:        userID,
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		},
		Username: input.Username,
		Password: hashedPassword,
		Role:     input.Role,
		IsActive: true,
		Profile: &domain.Profile{
			UserID:      userID,
			FullName:    input.FullName,
			Type:        input.Role,
			Gender:      input.Gender,
			PhoneNumber: input.PhoneNumber,
			Email:       input.Email,
		},
	}

	// Jika ada Institusi ID, buatkan penugasannya
	if input.InstitutionID != "" && input.Role != domain.RoleSuperAdmin {
		instUUID, err := uuid.Parse(input.InstitutionID)

		// Set default position berdasarkan role
		defaultPosition := "STAFF"
		if input.Role == domain.RoleTeacher {
			defaultPosition = "GURU MAPEL"
		}

		if err == nil {
			user.Enrollments = []domain.Enrollment{{
				ID:            uuid.New(),
				UserID:        userID,
				InstitutionID: instUUID,
				Role:          input.Role,
				Position:      defaultPosition,
				Status:        "ACTIVE",
			}}
		}
	}

	return uc.accountRepo.Create(ctx, user)
}

func (uc *accountUsecase) UpdateAccount(ctx context.Context, targetID string, actorRole string, input domain.AccountUpdateInput) error {
	user, err := uc.accountRepo.GetByID(ctx, targetID)
	if err != nil || user == nil {
		return errors.New("akun tidak ditemukan")
	}

	// Proteksi: Admin biasa tidak boleh mengedit akun Super Admin
	if user.Role == domain.RoleSuperAdmin && actorRole != domain.RoleSuperAdmin {
		return errors.New("akses ditolak: anda tidak berhak mengedit akun Super Admin")
	}

	// Update Password (Jika Diisi)
	if input.Password != "" {
		newHash, _ := utils.HashPassword(input.Password)
		user.Password = newHash
	}

	// Update Status Aktif
	if input.IsActive != nil {
		user.IsActive = *input.IsActive
	}

	// Update Profile
	if user.Profile == nil {
		user.Profile = &domain.Profile{UserID: user.ID}
	}

	// Update Dasar
	if input.FullName != "" {
		user.Profile.FullName = input.FullName
	}
	if input.Gender != "" {
		user.Profile.Gender = input.Gender
	}
	if input.PhoneNumber != "" {
		user.Profile.PhoneNumber = input.PhoneNumber
	}

	// Memasukkan Data Lengkap
	if input.Email != "" {
		user.Profile.Email = input.Email
	}
	if input.NIK != "" {
		user.Profile.NIK = input.NIK
	}
	if input.NISN != "" {
		user.Profile.NISN = input.NISN
	}
	if input.NIP != "" {
		user.Profile.NIP = input.NIP
	}
	if input.BirthPlace != "" {
		user.Profile.BirthPlace = input.BirthPlace
	}
	if input.Address != "" {
		user.Profile.Address = input.Address
	}
	if input.Pondok != "" {
		user.Profile.Pondok = input.Pondok
	}
	if input.Asrama != "" {
		user.Profile.Asrama = input.Asrama
	}

	// Parsing Tanggal Lahir jika ada (Asumsi format YYYY-MM-DD dari frontend)
	if input.BirthDate != "" {
		parsedDate, err := time.Parse("2006-01-02", input.BirthDate)
		if err == nil {
			user.Profile.BirthDate = parsedDate
		}
	}

	if input.Image != "" {
		// (Biarkan logika Garbage Collection yang sebelumnya sudah kita buat tetap di sini)
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

	user.UpdatedAt = time.Now()
	return uc.accountRepo.Update(ctx, user)
}

func (uc *accountUsecase) DeleteAccount(ctx context.Context, id string, actorRole string) error {
	user, err := uc.accountRepo.GetByID(ctx, id)
	if err != nil {
		return errors.New("akun tidak ditemukan")
	}
	if user.Role == domain.RoleSuperAdmin && actorRole != domain.RoleSuperAdmin {
		return errors.New("akses ditolak: anda tidak berhak menghapus akun Super Admin")
	}
	return uc.accountRepo.Delete(ctx, id)
}

// --- IMPLEMENTASI ENROLLMENT ---

func (uc *accountUsecase) AddUserEnrollment(ctx context.Context, userID string, input domain.AddEnrollmentInput) error {
	user, err := uc.accountRepo.GetByID(ctx, userID)
	if err != nil || user == nil {
		return errors.New("akun tidak ditemukan")
	}

	// Cegah duplikasi sekolah
	for _, en := range user.Enrollments {
		if en.InstitutionID.String() == input.InstitutionID {
			return errors.New("pengguna ini sudah ditugaskan di lembaga tersebut")
		}
	}

	instUUID, _ := uuid.Parse(input.InstitutionID)
	userUUID, _ := uuid.Parse(userID)

	newEnrollment := &domain.Enrollment{
		ID:            uuid.New(),
		UserID:        userUUID,
		InstitutionID: instUUID,
		Role:          input.Role,
		Position:      input.Position,
		Status:        "ACTIVE",
	}

	return uc.accountRepo.AddEnrollment(ctx, newEnrollment)
}

func (uc *accountUsecase) UpdateUserEnrollment(ctx context.Context, userID, enrollmentID, role, position string) error {
	en, err := uc.accountRepo.GetEnrollmentByID(ctx, enrollmentID)
	if err != nil || en == nil {
		return errors.New("data penugasan tidak ditemukan")
	}
	if en.UserID.String() != userID {
		return errors.New("akses ditolak: penugasan tidak cocok dengan pengguna")
	}

	en.Role = role
	en.Position = position
	return uc.accountRepo.UpdateEnrollment(ctx, en)
}

func (uc *accountUsecase) DeleteUserEnrollment(ctx context.Context, userID, enrollmentID string) error {
	en, err := uc.accountRepo.GetEnrollmentByID(ctx, enrollmentID)
	if err != nil || en == nil {
		return errors.New("data penugasan tidak ditemukan")
	}
	if en.UserID.String() != userID {
		return errors.New("akses ditolak: penugasan tidak cocok dengan pengguna")
	}

	return uc.accountRepo.DeleteEnrollment(ctx, enrollmentID)
}

func (uc *accountUsecase) GetAccountByID(ctx context.Context, id string) (*domain.User, error) {
	return uc.accountRepo.GetByID(ctx, id)
}
