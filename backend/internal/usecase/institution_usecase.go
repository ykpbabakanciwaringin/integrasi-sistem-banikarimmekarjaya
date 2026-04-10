// LOKASI: internal/usecase/institution_usecase.go
package usecase

import (
	"bytes"
	"context"
	"mime/multipart"
	"strings"
	"time"

	"banikarimmekarjaya.id/cbt-backend/internal/domain"
	"banikarimmekarjaya.id/cbt-backend/internal/service/exporter"
	"banikarimmekarjaya.id/cbt-backend/internal/service/importer"
	"banikarimmekarjaya.id/cbt-backend/pkg/utils/pdf_helper"
)

type InstitutionUsecase interface {
	GetAll(ctx context.Context, filter domain.InstitutionFilter) (domain.PaginationResult, error)
	Create(ctx context.Context, input domain.CreateInstitutionInput) (*domain.Institution, error)
	Update(ctx context.Context, id string, input domain.CreateInstitutionInput) (*domain.Institution, error)
	Delete(ctx context.Context, id string) error
	Import(ctx context.Context, file multipart.File) (int, error)
	UpdateWeeklyDayOff(ctx context.Context, id string, day string) error
	UpdatePqSettings(ctx context.Context, id string, enabled bool, partnerKey string) error

	// === FUNGSI EXPORT ===
	ExportExcel(ctx context.Context, filter domain.InstitutionFilter) (*bytes.Buffer, error)
	ExportPDF(ctx context.Context, filter domain.InstitutionFilter, kopData pdf_helper.KopSuratData) (*bytes.Buffer, error)
}

type institutionUsecase struct {
	instRepo    domain.InstitutionRepository
	importer    importer.ExcelImporter
	exporter    exporter.InstitutionExporter
	pdfExporter exporter.InstitutionPdfExporter
}

func NewInstitutionUsecase(r domain.InstitutionRepository) InstitutionUsecase {
	return &institutionUsecase{
		instRepo:    r,
		importer:    importer.NewExcelImporter(),
		exporter:    exporter.NewInstitutionExporter(),
		pdfExporter: exporter.NewInstitutionPdfExporter(),
	}
}

func (uc *institutionUsecase) GetAll(ctx context.Context, filter domain.InstitutionFilter) (domain.PaginationResult, error) {
	if filter.Page <= 0 {
		filter.Page = 1
	}
	if filter.Limit <= 0 {
		filter.Limit = 10
	}

	data, total, err := uc.instRepo.FetchAll(ctx, filter)
	if err != nil {
		return domain.PaginationResult{}, err
	}

	totalPages := int((total + int64(filter.Limit) - 1) / int64(filter.Limit))
	if totalPages == 0 {
		totalPages = 1
	}

	return domain.PaginationResult{Data: data, Total: total, Page: filter.Page, Limit: filter.Limit, TotalPages: totalPages}, nil
}

func (uc *institutionUsecase) Create(ctx context.Context, input domain.CreateInstitutionInput) (*domain.Institution, error) {
	now := time.Now()
	// Strategi Jangka Panjang: ID akan otomatis di-generate oleh BeforeCreate di BaseEntity jika kosong
	inst := &domain.Institution{
		BaseEntity: domain.BaseEntity{
			CreatedAt: now,
			UpdatedAt: now,
			CreatedBy: "SYSTEM",
		},
		Code:                   strings.ToUpper(input.Code),
		Name:                   input.Name,
		FoundationName:         input.FoundationName,
		Category:               strings.ToUpper(input.Category),
		LevelCode:              strings.ToUpper(input.LevelCode),
		AddressCity:            input.AddressCity,
		AddressDetail:          input.AddressDetail,
		ContactPhone:           input.ContactPhone,
		ContactEmail:           strings.ToLower(input.ContactEmail),
		Website:                strings.ToLower(input.Website),
		Header1:                input.Header1,
		Header2:                input.Header2,
		LogoUrl:                input.LogoUrl,
		IsPqIntegrationEnabled: input.IsPqIntegrationEnabled,
		PqPartnerKey:           input.PqPartnerKey,
	}

	if err := uc.instRepo.Create(ctx, inst); err != nil {
		return nil, err
	}

	return inst, nil
}

func (uc *institutionUsecase) Update(ctx context.Context, id string, input domain.CreateInstitutionInput) (*domain.Institution, error) {
	existingInst, err := uc.instRepo.GetByID(ctx, id)
	if err != nil {
		return nil, domain.ErrInstitutionNotFound
	}

	existingInst.Code = strings.ToUpper(input.Code)
	existingInst.Name = input.Name
	existingInst.FoundationName = input.FoundationName
	existingInst.Category = strings.ToUpper(input.Category)
	existingInst.LevelCode = strings.ToUpper(input.LevelCode)
	existingInst.AddressCity = input.AddressCity
	existingInst.AddressDetail = input.AddressDetail
	existingInst.ContactPhone = input.ContactPhone
	existingInst.ContactEmail = strings.ToLower(input.ContactEmail)
	existingInst.Website = strings.ToLower(input.Website)
	existingInst.Header1 = input.Header1
	existingInst.Header2 = input.Header2
	existingInst.IsPqIntegrationEnabled = input.IsPqIntegrationEnabled
	existingInst.PqPartnerKey = input.PqPartnerKey

	if input.LogoUrl != "" {
		existingInst.LogoUrl = input.LogoUrl
	}
	existingInst.UpdatedAt = time.Now()

	if err := uc.instRepo.Update(ctx, existingInst); err != nil {
		return nil, err
	}

	return existingInst, nil
}

func (uc *institutionUsecase) Delete(ctx context.Context, id string) error {
	return uc.instRepo.Delete(ctx, id)
}

func (uc *institutionUsecase) UpdateWeeklyDayOff(ctx context.Context, id string, day string) error {
	if day == "" {
		day = "JUMAT"
	}
	return uc.instRepo.UpdateWeeklyDayOff(ctx, id, strings.ToUpper(day))
}

func (uc *institutionUsecase) UpdatePqSettings(ctx context.Context, id string, enabled bool, partnerKey string) error {
	return uc.instRepo.UpdatePqSettings(ctx, id, enabled, partnerKey)
}

// =======================================================
// IMPORT EXCEL LOGIC (Unified Schema & Backup Support)
// =======================================================
func (uc *institutionUsecase) Import(ctx context.Context, file multipart.File) (int, error) {
	parsedData, err := uc.importer.ParseInstitutionExcel(file)
	if err != nil {
		return 0, err
	}

	// Ambil data lama untuk pengecekan Upsert (Update or Insert)
	existingData, _, _ := uc.instRepo.FetchAll(ctx, domain.InstitutionFilter{Limit: 10000})
	existingMap := make(map[string]*domain.Institution)
	for i := range existingData {
		existingMap[existingData[i].Code] = &existingData[i]
	}

	var newInstitutions []domain.Institution
	successCount := 0
	now := time.Now()

	for _, parsed := range parsedData {
		if parsed.Code == "" || parsed.Name == "" {
			continue
		}

		// Mapping Status PQ Sync dari string Excel ke Boolean
		isPqEnabled := strings.ToUpper(parsed.StatusPqSync) == "AKTIF"

		if existingInst, exists := existingMap[parsed.Code]; exists {
			// UPDATE: Jika Kode Lembaga sudah ada
			existingInst.Name = parsed.Name
			existingInst.FoundationName = parsed.FoundationName
			existingInst.LevelCode = parsed.Level
			existingInst.Category = parsed.Category
			existingInst.AddressDetail = parsed.Address
			existingInst.AddressCity = parsed.City
			existingInst.ContactPhone = parsed.Phone
			existingInst.ContactEmail = parsed.Email
			existingInst.Website = parsed.Website
			existingInst.Header1 = parsed.Header1
			existingInst.Header2 = parsed.Header2
			existingInst.IsPqIntegrationEnabled = isPqEnabled // Restore status PQ Sync

			if parsed.Logo != "" {
				existingInst.LogoUrl = parsed.Logo
			}
			if parsed.DayOff != "" {
				existingInst.WeeklyDayOff = parsed.DayOff
			}
			existingInst.UpdatedAt = now

			_ = uc.instRepo.Update(ctx, existingInst)
			successCount++
			continue
		}

		// INSERT: Jika Lembaga Baru
		dayOff := parsed.DayOff
		if dayOff == "" {
			dayOff = "JUMAT"
		}

		inst := domain.Institution{
			// ID akan otomatis di-generate oleh BeforeCreate di BaseEntity
			BaseEntity:             domain.BaseEntity{CreatedAt: now, UpdatedAt: now, CreatedBy: "IMPORT"},
			Code:                   parsed.Code,
			Name:                   parsed.Name,
			FoundationName:         parsed.FoundationName,
			LevelCode:              parsed.Level,
			Category:               parsed.Category,
			AddressDetail:          parsed.Address,
			AddressCity:            parsed.City,
			ContactPhone:           parsed.Phone,
			ContactEmail:           parsed.Email,
			Website:                parsed.Website,
			Header1:                parsed.Header1,
			Header2:                parsed.Header2,
			LogoUrl:                parsed.Logo,
			WeeklyDayOff:           dayOff,
			IsPqIntegrationEnabled: isPqEnabled, //
		}
		newInstitutions = append(newInstitutions, inst)
		successCount++
	}

	if len(newInstitutions) > 0 {
		if err := uc.instRepo.BulkCreate(ctx, newInstitutions); err != nil {
			return successCount - len(newInstitutions), err
		}
	}

	return successCount, nil
}

// =======================================================
// FUNGSI EXPORT
// =======================================================

func (uc *institutionUsecase) ExportExcel(ctx context.Context, filter domain.InstitutionFilter) (*bytes.Buffer, error) {
	filter.Limit = 0
	institutions, _, err := uc.instRepo.FetchAll(ctx, filter)
	if err != nil {
		return nil, err
	}
	return uc.exporter.GenerateInstitutionListExcel(institutions)
}

func (uc *institutionUsecase) ExportPDF(ctx context.Context, filter domain.InstitutionFilter, kopData pdf_helper.KopSuratData) (*bytes.Buffer, error) {
	filter.Limit = 0
	institutions, _, err := uc.instRepo.FetchAll(ctx, filter)
	if err != nil {
		return nil, err
	}
	return uc.pdfExporter.GenerateInstitutionListPDF(institutions, kopData)
}
