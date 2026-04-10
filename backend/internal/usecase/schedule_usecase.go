// LOKASI: internal/usecase/schedule_usecase.go
package usecase

import (
	"bytes"
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
	"ykpbabakanciwaringin.id/cbt-backend/internal/domain"
	"ykpbabakanciwaringin.id/cbt-backend/internal/service/exporter"
	"ykpbabakanciwaringin.id/cbt-backend/pkg/utils/pdf_helper"
)

type scheduleUsecase struct {
	repo     domain.ScheduleRepository
	exporter exporter.ScheduleExporter
}

func NewScheduleUsecase(r domain.ScheduleRepository, e exporter.ScheduleExporter) domain.ScheduleUsecase {
	return &scheduleUsecase{
		repo:     r,
		exporter: e,
	}
}

// --- LOGIKA ALOKASI MENGAJAR ---

func (uc *scheduleUsecase) GetAllocations(ctx context.Context, filter domain.AllocationFilter) ([]domain.TeachingAllocation, error) {
	return uc.repo.FetchAllocations(ctx, filter)
}

func (uc *scheduleUsecase) CreateAllocation(ctx context.Context, instID string, operator string, input domain.CreateAllocationInput) (*domain.TeachingAllocation, error) {
	newID := uuid.New()
	allocation := domain.TeachingAllocation{
		BaseEntity: domain.BaseEntity{
			ID:        newID,
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		},
		InstitutionID:  instID,
		AcademicYearID: input.AcademicYearID,
		TeacherID:      input.TeacherID,
		SubjectID:      input.SubjectID,
		ClassID:        input.ClassID,
	}

	if err := uc.repo.CreateAllocation(ctx, &allocation); err != nil {
		return nil, err
	}
	return uc.repo.GetByID(ctx, newID.String())
}

func (uc *scheduleUsecase) DeleteAllocation(ctx context.Context, id string) error {
	return uc.repo.DeleteAllocation(ctx, id)
}

// --- LOGIKA JADWAL MINGGUAN (MATRIKS) ---

func (uc *scheduleUsecase) AddSchedule(ctx context.Context, allocationID, operator string, input domain.AddScheduleInput) error {
	if allocationID == "" {
		return errors.New("id alokasi mengajar wajib ada")
	}

	alloc, err := uc.repo.GetByID(ctx, allocationID)
	if err != nil || alloc == nil {
		return errors.New("data alokasi tidak ditemukan")
	}

	// Validasi Bentrok Guru (Business Logic tetap di sini)
	isConflict, err := uc.repo.CheckTeacherConflict(ctx, alloc.TeacherID, alloc.AcademicYearID, input.DayOfWeek, input.StartTime, input.EndTime)
	if err != nil {
		return errors.New("terjadi kesalahan saat memvalidasi jadwal")
	}
	if isConflict {
		return errors.New("BENTROK: Guru tersebut sudah memiliki jadwal mengajar di tempat lain pada hari dan jam yang sama")
	}

	cs := domain.ClassSchedule{
		BaseEntity: domain.BaseEntity{
			ID:        uuid.New(),
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
			CreatedBy: operator,
		},
		TeachingAllocationID: allocationID,
		DayOfWeek:            input.DayOfWeek,
		StartTime:            input.StartTime,
		EndTime:              input.EndTime,
		RoomName:             input.RoomName,
		PesantrenquEventID:   input.PesantrenquEventID,
	}
	return uc.repo.AddSchedule(ctx, &cs)
}

func (uc *scheduleUsecase) DeleteSchedule(ctx context.Context, id string) error {
	return uc.repo.DeleteSchedule(ctx, id)
}

// ========================================================================================
// MESIN EKSPOR (LOGIKA VISUAL DELEGASIKAN KE EXPORTER)
// ========================================================================================

func (uc *scheduleUsecase) ExportScheduleMatrixExcel(ctx context.Context, instID, academicYearID string) (*bytes.Buffer, error) {
	classes, _ := uc.repo.FetchAllClassesForMatrix(ctx, instID)
	sessions, _ := uc.repo.FetchSessions(ctx, instID)

	// Gunakan jadwal asli yang terdaftar sebagai master sesi untuk matriks
	allocations, _ := uc.repo.FetchAllocations(ctx, domain.AllocationFilter{
		InstitutionID:  instID,
		AcademicYearID: academicYearID,
	})

	// Konversi session ke format schedule (sesuai kontrak exporter)
	var matrixSessions []domain.ClassSchedule
	for _, s := range sessions {
		matrixSessions = append(matrixSessions, domain.ClassSchedule{
			StartTime: s.StartTime,
			EndTime:   s.EndTime,
		})
	}

	return uc.exporter.GenerateScheduleMatrixExcel(classes, matrixSessions, allocations)
}

func (uc *scheduleUsecase) ExportScheduleMatrixPDF(ctx context.Context, instID, academicYearID string) (*bytes.Buffer, error) {
	classes, _ := uc.repo.FetchAllClassesForMatrix(ctx, instID)
	sessions, _ := uc.repo.FetchSessions(ctx, instID)
	allocations, _ := uc.repo.FetchAllocations(ctx, domain.AllocationFilter{
		InstitutionID:  instID,
		AcademicYearID: academicYearID,
	})

	// Setup Kop Surat dinamis dari Institusi
	var kopData pdf_helper.KopSuratData
	if len(classes) > 0 && classes[0].Institution != nil {
		inst := classes[0].Institution
		kopData = pdf_helper.KopSuratData{
			Name: inst.Name, Header1: inst.Header1, Header2: inst.Header2,
			AddressDetail: inst.AddressDetail, AddressCity: inst.AddressCity,
			ContactPhone: inst.ContactPhone, ContactEmail: inst.ContactEmail,
			Website: inst.Website, LogoUrl: inst.LogoUrl,
		}
	}

	var matrixSessions []domain.ClassSchedule
	for _, s := range sessions {
		matrixSessions = append(matrixSessions, domain.ClassSchedule{
			StartTime: s.StartTime,
			EndTime:   s.EndTime,
		})
	}

	return uc.exporter.GenerateScheduleMatrixPDF(classes, matrixSessions, allocations, kopData)
}

// --- MASTER SESI (KEPERLUAN INTEGRASI) ---

func (uc *scheduleUsecase) GetSessions(ctx context.Context, instID string) ([]domain.ClassSession, error) {
	return uc.repo.FetchSessions(ctx, instID)
}

func (uc *scheduleUsecase) CreateSession(ctx context.Context, instID string, input domain.CreateClassSessionInput) (*domain.ClassSession, error) {
	session := &domain.ClassSession{
		BaseEntity: domain.BaseEntity{
			ID:        uuid.New(),
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		},
		InstitutionID:      instID,
		Name:               input.Name,
		StartTime:          input.StartTime,
		EndTime:            input.EndTime,
		PesantrenquEventID: input.PesantrenquEventID,
	}

	if err := uc.repo.CreateSession(ctx, session); err != nil {
		return nil, err
	}
	return session, nil
}

func (uc *scheduleUsecase) DeleteSession(ctx context.Context, id string) error {
	return uc.repo.DeleteSession(ctx, id)
}
