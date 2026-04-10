// LOKASI: internal/repository/postgres/institution_repo.go
package postgres

import (
	"context"
	"errors"

	"gorm.io/gorm"
	"banikarimmekarjaya.id/cbt-backend/internal/domain"
)

type institutionRepo struct {
	DB *gorm.DB
}

func NewInstitutionRepository(db *gorm.DB) domain.InstitutionRepository {
	return &institutionRepo{DB: db}
}

func (r *institutionRepo) FetchAll(ctx context.Context, filter domain.InstitutionFilter) ([]domain.Institution, int64, error) {
	var insts []domain.Institution
	var total int64

	query := r.DB.WithContext(ctx).Model(&domain.Institution{}).
		Select("institutions.*, " +
			"(SELECT count(*) FROM classes WHERE classes.institution_id = institutions.id) as class_count, " +
			"(SELECT count(*) FROM enrollments WHERE enrollments.institution_id = institutions.id AND enrollments.role = 'USER') as student_count")

	if filter.Search != "" {
		searchTerm := "%" + filter.Search + "%"
		query = query.Where("name ILIKE ? OR code ILIKE ? OR address_city ILIKE ?", searchTerm, searchTerm, searchTerm)
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	if filter.Limit > 0 {
		offset := (filter.Page - 1) * filter.Limit
		query = query.Offset(offset).Limit(filter.Limit)
	}

	err := query.Order("created_at DESC").Find(&insts).Error
	return insts, total, err
}

func (r *institutionRepo) GetByID(ctx context.Context, id string) (*domain.Institution, error) {
	if id == "" {
		return nil, domain.ErrInstitutionNotFound
	}

	var inst domain.Institution
	err := r.DB.WithContext(ctx).First(&inst, "id = ?", id).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, domain.ErrInstitutionNotFound
		}
		return nil, err
	}
	return &inst, nil
}

func (r *institutionRepo) Create(ctx context.Context, i *domain.Institution) error {
	return r.DB.WithContext(ctx).Create(i).Error
}

func (r *institutionRepo) Update(ctx context.Context, i *domain.Institution) error {
	return r.DB.WithContext(ctx).Save(i).Error
}

func (r *institutionRepo) Delete(ctx context.Context, id string) error {
	// 1. Cek apakah masih ada Kelas di lembaga ini
	var classCount int64
	r.DB.WithContext(ctx).Model(&domain.Class{}).Where("institution_id = ?", id).Count(&classCount)
	if classCount > 0 {
		return errors.New("gagal: lembaga masih memiliki data kelas aktif")
	}

	// 2. Cek apakah masih ada Mata Pelajaran di lembaga ini
	var subjectCount int64
	r.DB.WithContext(ctx).Model(&domain.Subject{}).Where("institution_id = ?", id).Count(&subjectCount)
	if subjectCount > 0 {
		return errors.New("gagal: lembaga masih memiliki data mata pelajaran aktif")
	}

	// 3. Cek apakah masih ada Pengguna (Siswa/Guru/Admin Unit) di lembaga ini
	var userCount int64
	r.DB.WithContext(ctx).Model(&domain.Profile{}).Where("institution_id = ?", id).Count(&userCount)
	if userCount > 0 {
		return errors.New("gagal: lembaga masih memiliki data pengguna (siswa/guru)")
	}

	// Jika semua aman (kosong), baru boleh dihapus
	return r.DB.WithContext(ctx).Delete(&domain.Institution{}, "id = ?", id).Error
}

func (r *institutionRepo) BulkCreate(ctx context.Context, insts []domain.Institution) error {
	return r.DB.WithContext(ctx).CreateInBatches(insts, 100).Error
}

func (r *institutionRepo) UpdateWeeklyDayOff(ctx context.Context, id string, day string) error {
	return r.DB.WithContext(ctx).Model(&domain.Institution{}).Where("id = ?", id).Update("weekly_day_off", day).Error
}

func (r *institutionRepo) UpdatePqSettings(ctx context.Context, id string, enabled bool, partnerKey string) error {
	return r.DB.WithContext(ctx).Model(&domain.Institution{}).
		Where("id = ?", id).
		Updates(map[string]interface{}{
			"is_pq_integration_enabled": enabled,
			"pq_partner_key":            partnerKey,
		}).Error
}
