// LOKASI: internal/usecase/exam_result_usecase.go
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

type examResultUsecase struct {
	repo     domain.ExamResultRepository
	exporter exporter.ExamResultExporter
}

func NewExamResultUsecase(r domain.ExamResultRepository, e exporter.ExamResultExporter) domain.ExamResultUsecase {
	return &examResultUsecase{
		repo:     r,
		exporter: e,
	}
}

func (uc *examResultUsecase) GetCBTResults(ctx context.Context, sessionID, userID, role string) ([]domain.CBTResultDetail, error) {
	session, err := uc.repo.GetSessionInfoForExport(ctx, sessionID)
	if err != nil {
		return nil, err
	}

	// Verifikasi hak akses jika role adalah GURU
	if role == "TEACHER" {
		isAuthorized := false
		for _, p := range session.Proctors {
			if p.TeacherID == userID {
				isAuthorized = true
				break
			}
		}
		if !isAuthorized {
			return nil, fmt.Errorf("akses ditolak")
		}
	}
	return uc.repo.GetCBTResults(ctx, sessionID)
}

// =======================================================
// DELEGASI EXPORT EXCEL
// =======================================================
func (uc *examResultUsecase) ExportCBTResultsExcel(ctx context.Context, sessionID, userID, role string) (*bytes.Buffer, string, error) {
	results, err := uc.GetCBTResults(ctx, sessionID, userID, role)
	if err != nil {
		return nil, "", err
	}

	session, err := uc.repo.GetSessionInfoForExport(ctx, sessionID)
	if err != nil {
		return nil, "", err
	}

	buf, err := uc.exporter.GenerateCBTResultExcel(*session, results)
	if err != nil {
		return nil, "", err
	}

	filename := fmt.Sprintf("Rekapitulasi_Hasil_Ujian_%s", strings.ReplaceAll(session.Title, " ", "_"))
	return buf, filename, nil
}

// =======================================================
// DELEGASI EXPORT PDF (MERACIK KOP SURAT)
// =======================================================
func (uc *examResultUsecase) ExportCBTResultsPDF(ctx context.Context, sessionID, userID, role string) (*bytes.Buffer, string, error) {
	results, err := uc.GetCBTResults(ctx, sessionID, userID, role)
	if err != nil {
		return nil, "", err
	}

	session, err := uc.repo.GetSessionInfoForExport(ctx, sessionID)
	if err != nil {
		return nil, "", err
	}

	var kopData pdf_helper.KopSuratData
	if session.Institution != nil {
		kopData = pdf_helper.KopSuratData{
			Name:          session.Institution.Name,
			Header1:       session.Institution.Header1,
			Header2:       session.Institution.Header2,
			AddressDetail: session.Institution.AddressDetail,
			AddressCity:   session.Institution.AddressCity,
			ContactPhone:  session.Institution.ContactPhone,
			ContactEmail:  session.Institution.ContactEmail,
			Website:       session.Institution.Website,
			LogoUrl:       session.Institution.LogoUrl,
		}
	}

	buf, err := uc.exporter.GenerateCBTResultPDF(*session, results, kopData)
	if err != nil {
		return nil, "", err
	}

	filename := fmt.Sprintf("Rekap_Nilai_CBT_%s", strings.ReplaceAll(session.Title, " ", "_"))
	return buf, filename, nil
}
