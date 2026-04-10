// LOKASI: internal/repository/postgres/master_data_repo.go
package postgres

import (
	"context"
	"errors"
	"strings"

	"gorm.io/gorm"
	"ykpbabakanciwaringin.id/cbt-backend/internal/domain"
)

type masterDataRepo struct {
	DB *gorm.DB
}

func NewMasterDataRepository(db *gorm.DB) domain.MasterDataRepository {
	return &masterDataRepo{DB: db}
}

// Helper untuk menyamarkan error SQL (Masking Error)
func (r *masterDataRepo) handleSQLError(err error, entityName string) error {
	if err == nil {
		return nil
	}
	if strings.Contains(err.Error(), "duplicate key value") {
		return errors.New("gagal: nama " + entityName + " sudah terdaftar, silakan gunakan nama lain")
	}
	return errors.New("terjadi kesalahan pada sistem saat menyimpan " + entityName)
}

// --- ASRAMA (DORM) ---
func (r *masterDataRepo) GetDorms(ctx context.Context, instID string) ([]domain.Dorm, error) {
	var dorms []domain.Dorm
	// Preload ("Rooms") akan otomatis menarik data kamar di dalam asrama tersebut
	err := r.DB.WithContext(ctx).Preload("Rooms").Where("institution_id = ?", instID).Order("name ASC").Find(&dorms).Error
	return dorms, err
}

func (r *masterDataRepo) CreateDorm(ctx context.Context, dorm *domain.Dorm) error {
	err := r.DB.WithContext(ctx).Create(dorm).Error
	return r.handleSQLError(err, "asrama")
}

// --- KAMAR (ROOM) ---
func (r *masterDataRepo) GetRooms(ctx context.Context, dormID string) ([]domain.Room, error) {
	var rooms []domain.Room
	err := r.DB.WithContext(ctx).Where("dorm_id = ?", dormID).Order("name ASC").Find(&rooms).Error
	return rooms, err
}

func (r *masterDataRepo) CreateRoom(ctx context.Context, room *domain.Room) error {
	err := r.DB.WithContext(ctx).Create(room).Error
	return r.handleSQLError(err, "kamar")
}

// --- PROGRAM ---
func (r *masterDataRepo) GetPrograms(ctx context.Context, instID string) ([]domain.Program, error) {
	var programs []domain.Program
	// Preload ("ClassPrograms") otomatis mengambil kelas-kelas turunan program ini
	err := r.DB.WithContext(ctx).Preload("ClassPrograms").Where("institution_id = ?", instID).Order("name ASC").Find(&programs).Error
	return programs, err
}

func (r *masterDataRepo) CreateProgram(ctx context.Context, program *domain.Program) error {
	err := r.DB.WithContext(ctx).Create(program).Error
	return r.handleSQLError(err, "program pengajian")
}

// --- KELAS PROGRAM (CLASS PROGRAM) ---
func (r *masterDataRepo) GetClassPrograms(ctx context.Context, programID string) ([]domain.ClassProgram, error) {
	var classPrograms []domain.ClassProgram
	err := r.DB.WithContext(ctx).Where("program_id = ?", programID).Order("name ASC").Find(&classPrograms).Error
	return classPrograms, err
}

func (r *masterDataRepo) CreateClassProgram(ctx context.Context, cp *domain.ClassProgram) error {
	err := r.DB.WithContext(ctx).Create(cp).Error
	return r.handleSQLError(err, "kelas program")
}
