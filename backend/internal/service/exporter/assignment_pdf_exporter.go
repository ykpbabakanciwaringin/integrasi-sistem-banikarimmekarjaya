// LOKASI: internal/service/exporter/assignment_pdf_exporter.go
package exporter

import (
	"bytes"
	"fmt"
	"net/url"
	"time"

	"ykpbabakanciwaringin.id/cbt-backend/internal/domain"
	"ykpbabakanciwaringin.id/cbt-backend/pkg/utils/pdf_helper"
)

type AssignmentPdfExporter interface {
	GenerateRekapPDF(detail *domain.AssignmentDetail, grades []domain.StudentGrade, kopData pdf_helper.KopSuratData) (*bytes.Buffer, error)
	GenerateAssignmentListPDF(assignments []domain.Assignment, kopData pdf_helper.KopSuratData) (*bytes.Buffer, error)
}

type assignmentPdfExporter struct{}

func NewAssignmentPdfExporter() AssignmentPdfExporter {
	return &assignmentPdfExporter{}
}

func (e *assignmentPdfExporter) GenerateRekapPDF(detail *domain.AssignmentDetail, grades []domain.StudentGrade, kopData pdf_helper.KopSuratData) (*bytes.Buffer, error) {
	pdf := pdf_helper.SetupPDF("P")
	pdf.SetMargins(10, 15, 10)
	pdf.SetAutoPageBreak(true, 10)
	pdf.AddPage()

	frontendHost := "https://ykpbabakanciwaringin.id"
	dateStr := time.Now().Format("02-01-2006")
	safeInstName := url.QueryEscape(kopData.Name)
	qrPayload := fmt.Sprintf("%s/verify-document?type=REKAP_NILAI_PENUGASAN&inst_id=%s&date=%s", frontendHost, safeInstName, dateStr)

	pdf_helper.RenderKopSurat(pdf, kopData, qrPayload, true)

	pdf.SetFont("Cambria", "", 9)
	pdf.CellFormat(40, 5, "Mata Pelajaran", "", 0, "L", false, 0, "")
	pdf.CellFormat(60, 5, ": "+detail.SubjectName, "", 0, "L", false, 0, "")
	pdf.SetX(120)
	pdf.CellFormat(40, 5, "Tanggal Cetak", "", 0, "L", false, 0, "")
	pdf.CellFormat(30, 5, ": "+time.Now().Format("02 Jan 2006"), "", 1, "L", false, 0, "")

	pdf.CellFormat(40, 5, "Kelas", "", 0, "L", false, 0, "")
	pdf.CellFormat(60, 5, ": "+detail.ClassName, "", 0, "L", false, 0, "")
	pdf.SetX(120)
	pdf.CellFormat(40, 5, "Nilai KKM", "", 0, "L", false, 0, "")
	pdf.CellFormat(30, 5, ": "+fmt.Sprintf("%.0f", detail.KKM), "", 1, "L", false, 0, "")

	pdf.CellFormat(40, 5, "Guru Pengampu", "", 0, "L", false, 0, "")
	pdf.CellFormat(60, 5, ": "+detail.TeacherName, "", 1, "L", false, 0, "")

	pdf.Ln(8)
	pdf.SetFont("Cambria", "B", 11)
	pdf.CellFormat(0, 7, "REKAP PENILAIAN HASIL BELAJAR PESERTA DIDIK", "", 1, "C", false, 0, "")
	pdf.Ln(3)

	pdf.SetFillColor(235, 235, 235)
	pdf.SetFont("Cambria", "B", 8)
	widths := []float64{10, 30, 60, 10, 15, 15, 20, 30}
	headers := []string{"NO", "USERNAME", "NAMA LENGKAP", "L/P", "BENAR", "SALAH", "NILAI", "KET"}
	for i, h := range headers {
		pdf.CellFormat(widths[i], 8, h, "1", 0, "C", true, 0, "")
	}
	pdf.Ln(8)

	pdf.SetFont("Cambria", "", 8)
	for i, g := range grades {
		ket := "TUNTAS"
		if g.FinalScore < detail.KKM {
			ket = "REMEDIAL"
		}
		if g.ExamStatus == "BELUM UJIAN" {
			ket = "BELUM UJIAN"
		}

		pdf.CellFormat(widths[0], 7, fmt.Sprintf("%d", i+1), "1", 0, "C", false, 0, "")
		pdf.CellFormat(widths[1], 7, g.StudentUsername, "1", 0, "C", false, 0, "")

		nama := g.StudentName
		if len(nama) > 35 {
			nama = nama[:32] + "..."
		}
		pdf.CellFormat(widths[2], 7, " "+nama, "1", 0, "L", false, 0, "")

		pdf.CellFormat(widths[3], 7, g.StudentGender, "1", 0, "C", false, 0, "")
		pdf.CellFormat(widths[4], 7, fmt.Sprintf("%d", g.CorrectCount), "1", 0, "C", false, 0, "")
		pdf.CellFormat(widths[5], 7, fmt.Sprintf("%d", g.WrongCount), "1", 0, "C", false, 0, "")
		pdf.CellFormat(widths[6], 7, fmt.Sprintf("%.1f", g.FinalScore), "1", 0, "C", false, 0, "")
		pdf.CellFormat(widths[7], 7, ket, "1", 1, "C", false, 0, "")
	}

	pdf.Ln(15)
	pdf.SetX(140)
	pdf.SetFont("Cambria", "", 9)
	pdf.CellFormat(50, 5, "Cirebon, "+time.Now().Format("02 Jan 2006"), "", 1, "C", false, 0, "")
	pdf.SetX(140)
	pdf.CellFormat(50, 5, "Guru Pengampu,", "", 1, "C", false, 0, "")
	pdf.Ln(22)
	pdf.SetX(140)
	pdf.SetFont("Cambria", "BU", 10)
	pdf.CellFormat(50, 5, detail.TeacherName, "", 1, "C", false, 0, "")

	var buf bytes.Buffer
	if err := pdf.Output(&buf); err != nil {
		return nil, err
	}
	return &buf, nil
}

func (e *assignmentPdfExporter) GenerateAssignmentListPDF(assignments []domain.Assignment, kopData pdf_helper.KopSuratData) (*bytes.Buffer, error) {
	pdf := pdf_helper.SetupPDF("P")
	pdf.SetMargins(10, 15, 10)
	pdf.SetAutoPageBreak(true, 10)
	pdf.AddPage()

	qrPayload := fmt.Sprintf("https://ykpbabakanciwaringin.id/verify-document?type=ASSIGNMENT_LIST&date=%s", time.Now().Format("20060102"))
	pdf_helper.RenderKopSurat(pdf, kopData, qrPayload, true)

	pdf.SetFont("Cambria", "B", 12)
	pdf.CellFormat(0, 7, "DAFTAR PENUGASAN GURU DAN MATA PELAJARAN", "", 1, "C", false, 0, "")
	pdf.Ln(4)

	w := []float64{10, 55, 30, 75, 20}
	headers := []string{"NO", "MATA PELAJARAN", "KELAS", "GURU PENGAMPU", "KKM"}

	pdf.SetFont("Cambria", "B", 9)
	pdf.SetFillColor(5, 150, 105)
	pdf.SetTextColor(255, 255, 255)
	for i, h := range headers {
		pdf.CellFormat(w[i], 8, h, "1", 0, "C", true, 0, "")
	}
	pdf.Ln(8)

	pdf.SetFont("Cambria", "", 9)
	pdf.SetTextColor(0, 0, 0)

	for i, asg := range assignments {
		subj := "-"
		if asg.Subject != nil {
			subj = asg.Subject.Name
		}
		if len(subj) > 30 {
			subj = subj[:27] + "..."
		}

		cls := "-"
		if asg.Class != nil {
			cls = asg.Class.Name
		}

		teacher := "-"
		if asg.Teacher != nil {
			teacher = asg.Teacher.FullName
		}
		if len(teacher) > 40 {
			teacher = teacher[:37] + "..."
		}

		pdf.CellFormat(w[0], 7, fmt.Sprintf("%d", i+1), "1", 0, "C", false, 0, "")
		pdf.CellFormat(w[1], 7, " "+subj, "1", 0, "L", false, 0, "")
		pdf.CellFormat(w[2], 7, " "+cls, "1", 0, "C", false, 0, "")
		pdf.CellFormat(w[3], 7, " "+teacher, "1", 0, "L", false, 0, "")
		pdf.CellFormat(w[4], 7, fmt.Sprintf("%.0f", asg.KKM), "1", 1, "C", false, 0, "")
	}

	var buf bytes.Buffer
	err := pdf.Output(&buf)
	return &buf, err
}
