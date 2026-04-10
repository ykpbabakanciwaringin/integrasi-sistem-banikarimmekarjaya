// LOKASI: internal/usecase/auth_usecase.go
package usecase

import (
	"context"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/google/uuid"
	"ykpbabakanciwaringin.id/cbt-backend/internal/domain"
	"ykpbabakanciwaringin.id/cbt-backend/pkg/utils"
	"ykpbabakanciwaringin.id/cbt-backend/pkg/whatsapp"
)

type AuthUsecase interface {
	Login(ctx context.Context, req domain.LoginRequest) (domain.LoginResponse, error)
	RegisterPublic(ctx context.Context, input domain.RegisterPublicInput) error
	RequestResetPassword(ctx context.Context, input domain.ResetPasswordInput) error
	ChangePassword(ctx context.Context, userID string, oldPass, newPass string) error
	ResetTeacherPassword(ctx context.Context, nip string) error
	IsSetupRequired(ctx context.Context) (bool, error)
	RegisterFirstSuperAdmin(ctx context.Context, input domain.RegisterAdminInput) error
	GetAccounts(ctx context.Context, page, limit int, search, role, instID, status string) ([]domain.User, int64, error)
	CreateAccount(ctx context.Context, input domain.RegisterAdminInput, role, instID string) error
	UpdateAccount(ctx context.Context, targetID string, actorRole string, data map[string]interface{}) error
	DeleteAccount(ctx context.Context, id string) error
	GetMe(ctx context.Context, id string) (*domain.User, error)
	SwitchInstitution(ctx context.Context, userID, targetInstID string) (domain.SwitchInstitutionResponse, error)
}

type authUsecase struct {
	userRepo   domain.UserRepository
	jwtSecret  string
	jwtExp     int
	waClient   *whatsapp.StarSenderClient
	smtpConfig utils.SMTPConfig
}

func NewAuthUsecase(u domain.UserRepository, secret string, exp int, wa *whatsapp.StarSenderClient, smtpCfg utils.SMTPConfig) AuthUsecase {
	return &authUsecase{
		userRepo:   u,
		jwtSecret:  secret,
		jwtExp:     exp,
		waClient:   wa,
		smtpConfig: smtpCfg,
	}
}

func (uc *authUsecase) Login(ctx context.Context, req domain.LoginRequest) (domain.LoginResponse, error) {
	var user *domain.User
	var err error

	user, err = uc.userRepo.FetchByUsername(ctx, req.Username)
	if err != nil || user == nil {
		user, err = uc.userRepo.FetchByNISN(ctx, req.Username)
		if err != nil || user == nil {
			user, err = uc.userRepo.FetchByNIP(ctx, req.Username)
			if err != nil || user == nil {
				return domain.LoginResponse{}, errors.New("identitas atau kata sandi salah")
			}
		}
	}

	if user.LockoutUntil != nil && user.LockoutUntil.After(time.Now()) {
		sisaWaktu := int(time.Until(*user.LockoutUntil).Minutes())
		return domain.LoginResponse{}, fmt.Errorf("akun terkunci karena terlalu banyak percobaan. Coba lagi dalam %d menit", sisaWaktu)
	}

	if !utils.CheckPasswordHash(req.Password, user.Password) {
		user.FailedLoginAttempts++
		if user.FailedLoginAttempts >= 5 {
			lockoutTime := time.Now().Add(15 * time.Minute)
			user.LockoutUntil = &lockoutTime
		}
		_ = uc.userRepo.Update(ctx, user)

		if user.FailedLoginAttempts >= 5 {
			return domain.LoginResponse{}, errors.New("terlalu banyak percobaan gagal. Akun dikunci selama 15 menit")
		}
		return domain.LoginResponse{}, errors.New("identitas atau kata sandi salah")
	}

	if !user.IsActive {
		return domain.LoginResponse{}, errors.New("akun Anda belum aktif. Silakan hubungi admin")
	}

	user.FailedLoginAttempts = 0
	user.LockoutUntil = nil
	user.TokenVersion++
	_ = uc.userRepo.Update(ctx, user)

	if user.Profile == nil {
		user.Profile = &domain.Profile{
			UserID:   user.ID,
			FullName: user.Username,
			Type:     user.Role,
		}
	}

	institutionID := ""
	if len(user.Enrollments) > 0 {
		institutionID = user.Enrollments[0].InstitutionID.String()
	}
	classID := ""
	if user.Profile.ClassID != nil {
		classID = *user.Profile.ClassID
	}

	token, err := utils.GenerateToken(
		user.ID.String(),
		user.Username,
		institutionID,
		user.Role,
		classID,
		user.TokenVersion,
		uc.jwtSecret,
		time.Duration(uc.jwtExp)*time.Hour,
	)
	if err != nil {
		return domain.LoginResponse{}, fmt.Errorf("gagal sinkronisasi sesi: %w", err)
	}

	return domain.LoginResponse{
		Token: token,
		User: map[string]interface{}{
			"id":             user.ID,
			"username":       user.Username,
			"role":           user.Role,
			"institution_id": institutionID,
			"class_id":       classID,
			"last_login":     time.Now().Format(time.RFC3339),
			"enrollments":    user.Enrollments,
			"profile":        user.Profile,
		},
	}, nil
}

func (uc *authUsecase) RegisterPublic(ctx context.Context, input domain.RegisterPublicInput) error {
	existing, _ := uc.userRepo.FetchByUsername(ctx, input.Username)
	if existing != nil {
		return errors.New("username sudah terdaftar")
	}

	hashedPassword, _ := utils.HashPassword(input.Password)
	userID := uuid.New()
	instUUID, _ := uuid.Parse(input.InstitutionID)

	user := &domain.User{
		BaseEntity: domain.BaseEntity{
			ID:        userID,
			CreatedAt: time.Now(),
			CreatedBy: "SELF_REGISTER",
		},
		Username: input.Username,
		Password: hashedPassword,
		Role:     input.Role,
		IsActive: false,
		Profile: &domain.Profile{
			UserID:      userID,
			FullName:    input.FullName,
			Type:        input.Role,
			PhoneNumber: input.PhoneNumber,
			Email:       input.Email,
			NISN:        input.NISN,
			NIP:         input.NIP,
		},
		Enrollments: []domain.Enrollment{
			{
				ID:            uuid.New(),
				UserID:        userID,
				InstitutionID: instUUID,
				Role:          input.Role,
				Status:        "PENDING",
			},
		},
	}

	if err := uc.userRepo.CreateOne(ctx, user); err != nil {
		return err
	}

	user.IsActive = false
	return uc.userRepo.Update(ctx, user)
}

func (uc *authUsecase) UpdateAccount(ctx context.Context, targetID string, actorRole string, data map[string]interface{}) error {
	user, err := uc.userRepo.FetchByID(ctx, targetID)
	if err != nil || user == nil {
		return errors.New("akun tidak ditemukan")
	}

	if actorRole != domain.RoleSuperAdmin && actorRole != domain.RoleAdmin && actorRole != domain.RoleAdminAcademic {
		delete(data, "role")
		delete(data, "is_active")
		delete(data, "username")
		delete(data, "full_name")
		delete(data, "nik")
		delete(data, "nisn")
		delete(data, "nip")
	}

	if val, ok := data["password"].(string); ok && val != "" {
		newHash, _ := utils.HashPassword(val)
		user.Password = newHash
	}

	if val, ok := data["is_active"].(bool); ok {
		user.IsActive = val
		if val == true {
			for i := range user.Enrollments {
				if user.Enrollments[i].Status == "PENDING" {
					user.Enrollments[i].Status = "ACTIVE"
					_ = uc.userRepo.UpdateEnrollment(ctx, &user.Enrollments[i])
				}
			}
		}
	}

	if user.Profile == nil {
		user.Profile = &domain.Profile{UserID: user.ID}
	}

	if val, ok := data["full_name"].(string); ok {
		user.Profile.FullName = val
	}
	if val, ok := data["image"].(string); ok {
		if user.Profile.Image != "" && user.Profile.Image != val {
			oldPath := filepath.Join("static", strings.TrimPrefix(user.Profile.Image, "/"))
			_ = os.Remove(oldPath)
		}
		user.Profile.Image = val
	}
	if val, ok := data["phone_number"].(string); ok {
		user.Profile.PhoneNumber = val
	}
	if val, ok := data["email"].(string); ok {
		user.Profile.Email = val
	}
	if val, ok := data["gender"].(string); ok {
		user.Profile.Gender = val
	}
	if val, ok := data["nik"].(string); ok {
		user.Profile.NIK = val
	}

	user.UpdatedAt = time.Now()
	return uc.userRepo.Update(ctx, user)
}

func (uc *authUsecase) ChangePassword(ctx context.Context, userID string, oldPass, newPass string) error {
	user, err := uc.userRepo.FetchByID(ctx, userID)
	if err != nil {
		return errors.New("user tidak ditemukan")
	}
	if !utils.CheckPasswordHash(oldPass, user.Password) {
		return errors.New("kata sandi lama tidak sesuai")
	}
	newHash, _ := utils.HashPassword(newPass)
	user.Password = newHash
	return uc.userRepo.Update(ctx, user)
}

func (uc *authUsecase) ResetTeacherPassword(ctx context.Context, nip string) error {
	user, err := uc.userRepo.FetchByNIP(ctx, nip)
	if err != nil || user == nil {
		return errors.New("NIP tidak terdaftar")
	}
	if user.Profile == nil || user.Profile.PhoneNumber == "" {
		return errors.New("nomor WhatsApp tidak tersedia di profil")
	}

	tempPass := utils.GenerateRandomString(8)
	hashedPass, _ := utils.HashPassword(tempPass)
	user.Password = hashedPass

	if err := uc.userRepo.Update(ctx, user); err != nil {
		return err
	}

	msg := fmt.Sprintf("*AKSES BARU CBT*\nNama: %s\nSandi Baru: %s\nSegera ganti setelah masuk.", user.Profile.FullName, tempPass)
	go uc.waClient.SendMessage(user.Profile.PhoneNumber, msg)
	return nil
}

func (uc *authUsecase) IsSetupRequired(ctx context.Context) (bool, error) {
	count, err := uc.userRepo.CountSuperAdmins(ctx)
	return count == 0, err
}

func (uc *authUsecase) RegisterFirstSuperAdmin(ctx context.Context, input domain.RegisterAdminInput) error {
	count, _ := uc.userRepo.CountSuperAdmins(ctx)
	if count > 0 {
		return errors.New("sistem sudah terkonfigurasi")
	}

	hashedPassword, _ := utils.HashPassword(input.Password)
	adminID := uuid.New()
	admin := &domain.User{
		BaseEntity: domain.BaseEntity{ID: adminID},
		Username:   input.Username,
		Password:   hashedPassword,
		Role:       domain.RoleSuperAdmin,
		IsActive:   true,
		Profile: &domain.Profile{
			UserID:   adminID,
			FullName: input.FullName,
			Type:     "ADMIN",
		},
	}
	return uc.userRepo.CreateOne(ctx, admin)
}

func (uc *authUsecase) GetAccounts(ctx context.Context, page, limit int, search, role, instID, status string) ([]domain.User, int64, error) {
	offset := (page - 1) * limit
	return uc.userRepo.FetchAll(ctx, limit, offset, search, role, instID, status)
}

func (uc *authUsecase) CreateAccount(ctx context.Context, input domain.RegisterAdminInput, role, instID string) error {
	hashedPassword, _ := utils.HashPassword(input.Password)
	userID := uuid.New()
	user := &domain.User{
		BaseEntity: domain.BaseEntity{ID: userID},
		Username:   input.Username,
		Password:   hashedPassword,
		Role:       role,
		IsActive:   true,
		Profile: &domain.Profile{
			UserID:   userID,
			FullName: input.FullName,
			Type:     role,
		},
	}

	if instID != "" {
		instUUID, _ := uuid.Parse(instID)
		user.Enrollments = []domain.Enrollment{{
			ID:            uuid.New(),
			UserID:        userID,
			InstitutionID: instUUID,
			Status:        "ACTIVE",
		}}
	}
	return uc.userRepo.CreateOne(ctx, user)
}

func (uc *authUsecase) DeleteAccount(ctx context.Context, id string) error {
	return uc.userRepo.Delete(ctx, id)
}

func (uc *authUsecase) GetMe(ctx context.Context, id string) (*domain.User, error) {
	return uc.userRepo.FetchByID(ctx, id)
}

func (uc *authUsecase) RequestResetPassword(ctx context.Context, input domain.ResetPasswordInput) error {
	user, err := uc.userRepo.FetchByUsername(ctx, input.Identifier)
	if err != nil || user == nil {
		user, err = uc.userRepo.FetchByNISN(ctx, input.Identifier)
		if err != nil || user == nil {
			user, err = uc.userRepo.FetchByNIP(ctx, input.Identifier)
			if err != nil || user == nil {
				return errors.New("pengguna tidak ditemukan")
			}
		}
	}

	newPassword := utils.GenerateRandomString(8)
	hashedPassword, _ := utils.HashPassword(newPassword)

	user.Password = hashedPassword
	user.UpdatedAt = time.Now()

	if err := uc.userRepo.Update(ctx, user); err != nil {
		return errors.New("gagal mereset kata sandi di database")
	}

	go func(targetUser *domain.User, targetMethod, plainPassword string) {
		defer func() {
			if r := recover(); r != nil {
				fmt.Printf("[CRITICAL ERROR] Recovered dari panic saat mengirim %s: %v\n", targetMethod, r)
			}
		}()

		message := fmt.Sprintf("Halo %s,\n\nKata sandi akun Anda di Sistem Yayasan Kebajikan Pesantren telah direset.\n\nUsername: %s\nPassword Baru: %s\n\nSilakan login dan segera ganti kata sandi Anda demi keamanan.",
			targetUser.Profile.FullName, targetUser.Username, plainPassword)

		switch targetMethod {
		case "whatsapp":
			if targetUser.Profile.PhoneNumber == "" {
				return
			}
			uc.waClient.SendMessage(targetUser.Profile.PhoneNumber, message)
		case "email":
			if targetUser.Profile.Email == "" {
				return
			}
			utils.SendEmail(targetUser.Profile.Email, "Reset Kata Sandi Portal Yayasan Kebajikan Pesantren", message, uc.smtpConfig)
		}
	}(user, input.Method, newPassword)

	return nil
}

func (uc *authUsecase) SwitchInstitution(ctx context.Context, userID, targetInstID string) (domain.SwitchInstitutionResponse, error) {
	targetInstID = strings.TrimSpace(targetInstID)
	if targetInstID == "ALL" || targetInstID == "Pusat" {
		targetInstID = ""
	}

	user, err := uc.userRepo.FetchByID(ctx, userID)
	if err != nil || user == nil {
		return domain.SwitchInstitutionResponse{}, errors.New("user tidak ditemukan")
	}

	if user.Role == domain.RoleSuperAdmin {
		token, err := utils.GenerateToken(user.ID.String(), user.Username, targetInstID, domain.RoleSuperAdmin, "", user.TokenVersion, uc.jwtSecret, time.Duration(uc.jwtExp)*time.Hour)
		instName := "Mode Pusat (Semua Lembaga)"
		if targetInstID != "" {
			instName = "Mode Cabang Lembaga"
		}
		return domain.SwitchInstitutionResponse{Token: token, InstitutionName: instName, Role: domain.RoleSuperAdmin}, err
	}

	if targetInstID == "" {
		return domain.SwitchInstitutionResponse{}, errors.New("Akses ditolak: Hanya Super Admin yang bisa melihat Semua Lembaga")
	}

	var targetEnrollment *domain.Enrollment
	var enrolledSchoolNames []string

	for i, en := range user.Enrollments {
		if en.Institution != nil {
			enrolledSchoolNames = append(enrolledSchoolNames, en.Institution.Name)
		}
		if en.InstitutionID.String() == targetInstID {
			targetEnrollment = &user.Enrollments[i]
			break
		}
	}

	if targetEnrollment == nil {
		var errMsg string
		if len(enrolledSchoolNames) > 0 {
			errMsg = fmt.Sprintf("Akses Ditolak: Anda tidak ditugaskan di lembaga ini. Anda hanya terdaftar di: %s.", strings.Join(enrolledSchoolNames, ", "))
		} else {
			errMsg = "Akses Ditolak: Anda belum memiliki penugasan di lembaga manapun. Hubungi Admin."
		}
		return domain.SwitchInstitutionResponse{}, errors.New(errMsg)
	}

	classID := ""
	if user.Profile != nil && user.Profile.ClassID != nil {
		classID = *user.Profile.ClassID
	}

	token, err := utils.GenerateToken(
		user.ID.String(),
		user.Username,
		targetInstID,
		targetEnrollment.Role,
		classID,
		user.TokenVersion,
		uc.jwtSecret,
		time.Duration(uc.jwtExp)*time.Hour,
	)

	instName := "Lembaga"
	if targetEnrollment.Institution != nil {
		instName = targetEnrollment.Institution.Name
	}

	return domain.SwitchInstitutionResponse{
		Token:           token,
		InstitutionName: instName,
		Role:            targetEnrollment.Role,
	}, err
}
