// LOKASI: internal/usecase/pdf_usecase.go
package usecase

import (
	"bytes"
	"context"
	"fmt"
	"strings"

	"banikarimmekarjaya.id/cbt-backend/internal/domain"
	"banikarimmekarjaya.id/cbt-backend/internal/service/exporter"
	"banikarimmekarjaya.id/cbt-backend/pkg/utils/pdf_helper"
)

type PdfUsecase interface {
	// Kartu Ujian
	GenerateExamCards(ctx context.Context, sessionID string) (*bytes.Buffer, string, error)

	// Laporan PDF dengan Konteks Kop Surat Dinamis
	GenerateStudentListPDF(ctx context.Context, students []domain.User, instID string) (*bytes.Buffer, error)
	GenerateTeacherListPDF(ctx context.Context, teachers []domain.User, instID string) (*bytes.Buffer, error)
}

type pdfUsecase struct {
	sessionRepo  domain.ExamSessionRepository
	instRepo     domain.InstitutionRepository
	userExporter exporter.UserExporter
}

func NewPdfUsecase(r domain.ExamSessionRepository, ir domain.InstitutionRepository, e exporter.UserExporter) PdfUsecase {
	return &pdfUsecase{
		sessionRepo:  r,
		instRepo:     ir,
		userExporter: e,
	}
}

// =========================================================================
// HELPER INTERNAL: Pembangun Kop Surat Dinamis
// =========================================================================
func (u *pdfUsecase) buildKopSuratData(ctx context.Context, instID string) pdf_helper.KopSuratData {
	// 1. Data Default (Fallback) jika yang mengunduh adalah Super Admin untuk SEMUA data
	kopData := pdf_helper.KopSuratData{
		Name:          "YAYASAN KEBAJIKAN PESANTREN",
		Header1:       "SK KEMENKUMHAM : AHU-0000028.AH.01.05.TAHUN 2023",
		AddressDetail: "Jl. Gondang Manis No. 52 Desa Babakan Kecamatan Ciwaringin Kabupaten Cirebon",
		AddressCity:   "Jawa Barat Kode Pos 45167 Telp/WA 082 260 246 434 Email: banikarimmekarjaya@gmail.com",
	}

	// 2. Tarik Data Nyata dari Database jika instID spesifik diberikan
	if instID != "" && instID != "ALL" {
		inst, err := u.instRepo.GetByID(ctx, instID)
		if err == nil && inst != nil {
			kopData.Name = inst.Name
			kopData.Header1 = inst.Header1
			kopData.Header2 = inst.Header2
			kopData.AddressDetail = inst.AddressDetail
			kopData.AddressCity = inst.AddressCity
			kopData.ContactPhone = inst.ContactPhone
			kopData.ContactEmail = inst.ContactEmail
			kopData.Website = inst.Website
			kopData.LogoUrl = inst.LogoUrl // Path logo dari server
		}
	}
	return kopData
}

// =========================================================================
// EKSPOR PDF
// =========================================================================

func (u *pdfUsecase) GenerateStudentListPDF(ctx context.Context, students []domain.User, instID string) (*bytes.Buffer, error) {
	// Panggil Helper Bounding Kop Surat
	kopData := u.buildKopSuratData(ctx, instID)
	return u.userExporter.GenerateStudentListPDF(students, kopData)
}

func (u *pdfUsecase) GenerateTeacherListPDF(ctx context.Context, teachers []domain.User, instID string) (*bytes.Buffer, error) {
	// Panggil Helper Bounding Kop Surat
	kopData := u.buildKopSuratData(ctx, instID)
	return u.userExporter.GenerateTeacherListPDF(teachers, kopData)
}

func (u *pdfUsecase) GenerateExamCards(ctx context.Context, sessionID string) (*bytes.Buffer, string, error) {
	session, err := u.sessionRepo.GetSessionByID(ctx, sessionID)
	if err != nil {
		return nil, "", err
	}

	safeTitle := strings.ReplaceAll(session.Title, " ", "_")
	filename := fmt.Sprintf("Kartu_Ujian_%s.pdf", safeTitle)

	// TODO: Integrasikan dengan ExamExporter jika logika kartu ujian sudah dipindahkan
	var buf bytes.Buffer
	return &buf, filename, nil
}
