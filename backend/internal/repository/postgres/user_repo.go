package postgres

import (
	"context"

	"gorm.io/gorm"
	"ykpbabakanciwaringin.id/cbt-backend/internal/domain"
)

type userRepo struct {
	DB *gorm.DB
}

func NewUserRepository(db *gorm.DB) domain.UserRepository {
	return &userRepo{DB: db}
}

func (r *userRepo) FetchByUsername(ctx context.Context, username string) (*domain.User, error) {
	var users []domain.User
	err := r.DB.WithContext(ctx).
		Preload("Profile").
		Preload("Profile.Class").
		Preload("Enrollments").
		Preload("Enrollments.Institution").
		Where("username = ?", username).
		Limit(1).Find(&users).Error

	if err != nil {
		return nil, err
	}
	if len(users) == 0 {
		return nil, nil
	}
	return &users[0], nil
}

func (r *userRepo) FetchByNISN(ctx context.Context, nisn string) (*domain.User, error) {
	var users []domain.User
	err := r.DB.WithContext(ctx).
		Preload("Profile").
		Preload("Profile.Class").
		Preload("Enrollments").
		Preload("Enrollments.Institution").
		Joins("JOIN profiles ON profiles.user_id = users.id").
		Where("profiles.nisn = ?", nisn).
		Limit(1).Find(&users).Error

	if err != nil {
		return nil, err
	}
	if len(users) == 0 {
		return nil, nil
	}
	return &users[0], nil
}

func (r *userRepo) FetchByNIP(ctx context.Context, nip string) (*domain.User, error) {
	var users []domain.User
	err := r.DB.WithContext(ctx).
		Preload("Profile").
		Preload("Profile.Class").
		Preload("Enrollments").
		Preload("Enrollments.Institution").
		Joins("JOIN profiles ON profiles.user_id = users.id").
		Where("profiles.n_ip = ?", nip). // Pastikan nama kolom db untuk NIP sesuai (n_ip atau nip)
		Limit(1).Find(&users).Error

	if err != nil {
		return nil, err
	}
	if len(users) == 0 {
		return nil, nil
	}
	return &users[0], nil
}

func (r *userRepo) FetchByID(ctx context.Context, id string) (*domain.User, error) {
	var user domain.User
	err := r.DB.WithContext(ctx).
		Preload("Profile").
		Preload("Profile.Class").
		Preload("Enrollments").
		Preload("Enrollments.Institution").
		Where("id = ?", id).
		First(&user).Error
	return &user, err
}

func (r *userRepo) Update(ctx context.Context, user *domain.User) error {
	return r.DB.WithContext(ctx).
		Session(&gorm.Session{FullSaveAssociations: true}).
		Save(user).Error
}

func (r *userRepo) CreateOne(ctx context.Context, user *domain.User) error {
	return r.DB.WithContext(ctx).Create(user).Error
}

func (r *userRepo) BulkCreate(ctx context.Context, users []*domain.User) error {
	return r.DB.WithContext(ctx).CreateInBatches(users, 100).Error
}

func (r *userRepo) CountSuperAdmins(ctx context.Context) (int64, error) {
	var count int64
	err := r.DB.WithContext(ctx).Model(&domain.User{}).
		Where("role = ?", domain.RoleSuperAdmin).
		Count(&count).Error
	return count, err
}

func (r *userRepo) FetchAll(ctx context.Context, limit, offset int, search, role, instID, status string) ([]domain.User, int64, error) {
	var users []domain.User
	var total int64

	query := r.DB.WithContext(ctx).Model(&domain.User{}).
		Preload("Profile").
		Preload("Profile.Class").
		Preload("Enrollments.Institution")

	if search != "" {
		query = query.Joins("LEFT JOIN profiles ON profiles.user_id = users.id").
			Where("users.username ILIKE ? OR profiles.full_name ILIKE ?", "%"+search+"%", "%"+search+"%")
	}

	if role != "" && role != "ALL" {
		query = query.Where("users.role = ?", role)
	}

	if instID != "" && instID != "ALL" {
		query = query.Joins("JOIN enrollments ON enrollments.user_id = users.id").
			Where("enrollments.institution_id = ?", instID)
	}

	switch status {
	case "ACTIVE":
		query = query.Where("users.is_active = ?", true)
	case "PENDING":
		query = query.Where("users.is_active = ?", false)
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	err := query.Limit(limit).Offset(offset).Order("created_at DESC").Find(&users).Error
	return users, total, err
}

func (r *userRepo) Delete(ctx context.Context, id string) error {
	return r.DB.WithContext(ctx).Unscoped().Delete(&domain.User{}, "id = ?", id).Error
}

func (r *userRepo) AddEnrollment(ctx context.Context, enrollment *domain.Enrollment) error {
	return r.DB.WithContext(ctx).Create(enrollment).Error
}

func (r *userRepo) FetchEnrollmentByID(ctx context.Context, id string) (*domain.Enrollment, error) {
	var en domain.Enrollment
	err := r.DB.WithContext(ctx).First(&en, "id = ?", id).Error
	return &en, err
}

func (r *userRepo) UpdateEnrollment(ctx context.Context, enrollment *domain.Enrollment) error {
	return r.DB.WithContext(ctx).Save(enrollment).Error
}

func (r *userRepo) DeleteEnrollment(ctx context.Context, id string) error {
	return r.DB.WithContext(ctx).Delete(&domain.Enrollment{}, "id = ?", id).Error
}

func (r *userRepo) FetchAccountDetail(ctx context.Context, id string) (*domain.User, error) {
	var user domain.User
	err := r.DB.WithContext(ctx).
		Preload("Profile").
		Preload("Profile.Class").
		Preload("Enrollments").
		Preload("Enrollments.Institution").
		First(&user, "id = ?", id).Error

	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &user, nil
}
