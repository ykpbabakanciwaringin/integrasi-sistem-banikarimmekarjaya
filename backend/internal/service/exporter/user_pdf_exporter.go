// LOKASI: internal/service/exporter/user_pdf_exporter.go
package exporter

import (
	"bytes"
	"fmt"
	"net/url"
	"time"

	"ykpbabakanciwaringin.id/cbt-backend/internal/domain"
	"ykpbabakanciwaringin.id/cbt-backend/pkg/utils"
	"ykpbabakanciwaringin.id/cbt-backend/pkg/utils/pdf_helper"
)

type UserExporter interface {
	GenerateStudentListPDF(students []domain.User, kopData pdf_helper.KopSuratData) (*bytes.Buffer, error)
	GenerateTeacherListPDF(teachers []domain.User, kopData pdf_helper.KopSuratData) (*bytes.Buffer, error)
}

type userExporter struct{}

func NewUserExporter() UserExporter {
	return &userExporter{}
}

// =========================================================================
// EKSPOR PDF DATA SISWA
// =========================================================================
func (e *userExporter) GenerateStudentListPDF(students []domain.User, kopData pdf_helper.KopSuratData) (*bytes.Buffer, error) {
	pdf := pdf_helper.SetupPDF("L")
	pdf.SetMargins(10, 15, 10)
	pdf.SetAutoPageBreak(true, 10)
	pdf.AddPage()

	frontendHost := "https://ykpbabakanciwaringin.id"
	dateStr := time.Now().Format("02-01-2006")
	safeInstName := url.QueryEscape(kopData.Name)
	qrPayload := fmt.Sprintf("%s/verify-document?type=DATA_SISWA&inst_id=%s&date=%s", frontendHost, safeInstName, dateStr)

	pdf_helper.RenderKopSurat(pdf, kopData, qrPayload, true)

	pdf.SetFont("Cambria", "B", 12)
	pdf.CellFormat(0, 6, "LAPORAN DATA BIODATA SISWA LENGKAP", "", 1, "C", false, 0, "")
	pdf.SetFont("Cambria", "", 9)
	pdf.CellFormat(0, 6, fmt.Sprintf("Dicetak pada: %s", utils.FormatDateIndo(time.Now())), "", 1, "C", false, 0, "")
	pdf.Ln(5)

	pdf.SetFillColor(5, 150, 105)
	pdf.SetTextColor(255, 255, 255)
	pdf.SetFont("Cambria", "B", 9)

	headers := []string{"NO", "NISN / NIK", "NAMA LENGKAP", "JK", "KELAS", "PONDOK & KAMAR", "KABUPATEN/KOTA", "STATUS"}
	widths := []float64{10, 35, 60, 10, 35, 55, 45, 27}

	for i, h := range headers {
		pdf.CellFormat(widths[i], 8, h, "1", 0, "C", true, 0, "")
	}
	pdf.Ln(-1)

	pdf.SetTextColor(0, 0, 0)
	pdf.SetFont("Cambria", "", 8)
	pdf.SetFillColor(245, 245, 245)
	fill := false

	for i, s := range students {
		if s.Profile == nil {
			continue
		}

		identitas := s.Profile.NISN
		if identitas == "" {
			identitas = s.Profile.NIK
		}
		if identitas == "" {
			identitas = "-"
		}

		nama := s.Profile.FullName
		if len(nama) > 35 {
			nama = nama[:32] + "..."
		}

		className := "-"
		if s.Profile.Class != nil {
			className = s.Profile.Class.Name
		}

		pondok := s.Profile.Pondok
		if s.Profile.Kamar != "" {
			pondok += " (" + s.Profile.Kamar + ")"
		}
		if pondok == "" {
			pondok = "-"
		}
		if len(pondok) > 30 {
			pondok = pondok[:27] + "..."
		}

		kabupaten := s.Profile.Regency
		if kabupaten == "" {
			kabupaten = "-"
		}
		if len(kabupaten) > 25 {
			kabupaten = kabupaten[:22] + "..."
		}

		status := "ACTIVE"
		if len(s.Enrollments) > 0 && s.Enrollments[0].Status != "" {
			status = s.Enrollments[0].Status
		}

		pdf.CellFormat(widths[0], 7, fmt.Sprintf("%d", i+1), "1", 0, "C", fill, 0, "")
		pdf.CellFormat(widths[1], 7, identitas, "1", 0, "C", fill, 0, "")
		pdf.CellFormat(widths[2], 7, nama, "1", 0, "L", fill, 0, "")
		pdf.CellFormat(widths[3], 7, s.Profile.Gender, "1", 0, "C", fill, 0, "")
		pdf.CellFormat(widths[4], 7, className, "1", 0, "C", fill, 0, "")
		pdf.CellFormat(widths[5], 7, pondok, "1", 0, "L", fill, 0, "")
		pdf.CellFormat(widths[6], 7, kabupaten, "1", 0, "L", fill, 0, "")
		pdf.CellFormat(widths[7], 7, status, "1", 1, "C", fill, 0, "")

		fill = !fill
	}

	var buf bytes.Buffer
	if err := pdf.Output(&buf); err != nil {
		return nil, err
	}
	return &buf, nil
}

// =========================================================================
// EKSPOR PDF DATA GURU
// =========================================================================
func (e *userExporter) GenerateTeacherListPDF(teachers []domain.User, kopData pdf_helper.KopSuratData) (*bytes.Buffer, error) {
	pdf := pdf_helper.SetupPDF("L")
	pdf.SetMargins(10, 15, 10)
	pdf.SetAutoPageBreak(true, 10)
	pdf.AddPage()

	frontendHost := "https://ykpbabakanciwaringin.id"
	dateStr := time.Now().Format("02-01-2006")
	safeInstName := url.QueryEscape(kopData.Name)
	qrPayload := fmt.Sprintf("%s/verify-document?type=DATA_GURU&inst_id=%s&date=%s", frontendHost, safeInstName, dateStr)

	pdf_helper.RenderKopSurat(pdf, kopData, qrPayload, true)

	pdf.SetFont("Cambria", "B", 12)
	pdf.CellFormat(0, 6, "LAPORAN DATA BIODATA GURU LENGKAP", "", 1, "C", false, 0, "")
	pdf.SetFont("Cambria", "", 9)
	pdf.CellFormat(0, 6, fmt.Sprintf("Dicetak pada: %s", utils.FormatDateIndo(time.Now())), "", 1, "C", false, 0, "")
	pdf.Ln(5)

	pdf.SetFillColor(5, 150, 105)
	pdf.SetTextColor(255, 255, 255)
	pdf.SetFont("Cambria", "B", 9)

	headers := []string{"NO", "NIP/NIK", "NAMA LENGKAP", "JK", "JABATAN UTAMA", "NO WHATSAPP", "STATUS"}
	widths := []float64{10, 40, 70, 10, 50, 40, 30} // Total ~250mm

	for i, h := range headers {
		pdf.CellFormat(widths[i], 8, h, "1", 0, "C", true, 0, "")
	}
	pdf.Ln(-1)

	pdf.SetTextColor(0, 0, 0)
	pdf.SetFont("Cambria", "", 8)
	pdf.SetFillColor(245, 245, 245)
	fill := false

	for i, t := range teachers {
		if t.Profile == nil {
			continue
		}

		nip := t.Profile.NIP
		if nip == "" {
			nip = t.Profile.NIK
		}
		if nip == "" {
			nip = "-"
		}

		position := "GURU MAPEL"
		status := "ACTIVE"
		if len(t.Enrollments) > 0 {
			if t.Enrollments[0].Position != "" {
				position = t.Enrollments[0].Position
			}
			if t.Enrollments[0].Status != "" {
				status = t.Enrollments[0].Status
			}
		}

		wa := t.Profile.PhoneNumber
		if wa == "" {
			wa = "-"
		}

		pdf.CellFormat(widths[0], 7, fmt.Sprintf("%d", i+1), "1", 0, "C", fill, 0, "")
		pdf.CellFormat(widths[1], 7, nip, "1", 0, "C", fill, 0, "")
		pdf.CellFormat(widths[2], 7, t.Profile.FullName, "1", 0, "L", fill, 0, "")
		pdf.CellFormat(widths[3], 7, t.Profile.Gender, "1", 0, "C", fill, 0, "")
		pdf.CellFormat(widths[4], 7, position, "1", 0, "C", fill, 0, "")
		pdf.CellFormat(widths[5], 7, wa, "1", 0, "C", fill, 0, "")
		pdf.CellFormat(widths[6], 7, status, "1", 1, "C", fill, 0, "")

		fill = !fill
	}

	var buf bytes.Buffer
	if err := pdf.Output(&buf); err != nil {
		return nil, err
	}
	return &buf, nil
}
