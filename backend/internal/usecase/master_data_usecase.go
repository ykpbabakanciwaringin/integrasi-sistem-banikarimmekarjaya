// LOKASI: internal/usecase/master_data_usecase.go
package usecase

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
	"banikarimmekarjaya.id/cbt-backend/internal/domain"
)

// MasterDataUsecase Kontrak Interface
type MasterDataUsecase interface {
	GetDorms(ctx context.Context, instID string) ([]domain.Dorm, error)
	CreateDorm(ctx context.Context, instID string, input domain.CreateDormInput) error
	GetRooms(ctx context.Context, dormID string) ([]domain.Room, error)
	CreateRoom(ctx context.Context, dormID string, input domain.CreateRoomInput) error

	GetPrograms(ctx context.Context, instID string) ([]domain.Program, error)
	CreateProgram(ctx context.Context, instID string, input domain.CreateProgramInput) error
	GetClassPrograms(ctx context.Context, programID string) ([]domain.ClassProgram, error)
	CreateClassProgram(ctx context.Context, programID string, input domain.CreateClassProgramInput) error
}

type masterDataUsecase struct {
	repo domain.MasterDataRepository
}

func NewMasterDataUsecase(r domain.MasterDataRepository) MasterDataUsecase {
	return &masterDataUsecase{repo: r}
}

// --- ASRAMA & KAMAR ---
func (uc *masterDataUsecase) GetDorms(ctx context.Context, instID string) ([]domain.Dorm, error) {
	if instID == "" {
		return nil, errors.New("ID Lembaga diperlukan")
	}
	return uc.repo.GetDorms(ctx, instID)
}

func (uc *masterDataUsecase) CreateDorm(ctx context.Context, instID string, input domain.CreateDormInput) error {
	dorm := &domain.Dorm{
		BaseEntity: domain.BaseEntity{
			ID:        uuid.New(),
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		},
		InstitutionID: instID,
		Name:          input.Name,
	}
	return uc.repo.CreateDorm(ctx, dorm)
}

func (uc *masterDataUsecase) GetRooms(ctx context.Context, dormID string) ([]domain.Room, error) {
	return uc.repo.GetRooms(ctx, dormID)
}

func (uc *masterDataUsecase) CreateRoom(ctx context.Context, dormID string, input domain.CreateRoomInput) error {
	room := &domain.Room{
		BaseEntity: domain.BaseEntity{
			ID:        uuid.New(),
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		},
		DormID: dormID,
		Name:   input.Name,
	}
	return uc.repo.CreateRoom(ctx, room)
}

// --- PROGRAM & KELAS PROGRAM ---
func (uc *masterDataUsecase) GetPrograms(ctx context.Context, instID string) ([]domain.Program, error) {
	if instID == "" {
		return nil, errors.New("ID Lembaga diperlukan")
	}
	return uc.repo.GetPrograms(ctx, instID)
}

func (uc *masterDataUsecase) CreateProgram(ctx context.Context, instID string, input domain.CreateProgramInput) error {
	prog := &domain.Program{
		BaseEntity: domain.BaseEntity{
			ID:        uuid.New(),
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		},
		InstitutionID: instID,
		Name:          input.Name,
	}
	return uc.repo.CreateProgram(ctx, prog)
}

func (uc *masterDataUsecase) GetClassPrograms(ctx context.Context, programID string) ([]domain.ClassProgram, error) {
	return uc.repo.GetClassPrograms(ctx, programID)
}

func (uc *masterDataUsecase) CreateClassProgram(ctx context.Context, programID string, input domain.CreateClassProgramInput) error {
	cp := &domain.ClassProgram{
		BaseEntity: domain.BaseEntity{
			ID:        uuid.New(),
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		},
		ProgramID: programID,
		Name:      input.Name,
	}
	return uc.repo.CreateClassProgram(ctx, cp)
}
