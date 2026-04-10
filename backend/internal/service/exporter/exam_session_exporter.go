// LOKASI: internal/service/exporter/exam_session_exporter.go
package exporter

import (
	"bytes"
	"fmt"
	"strings"

	"github.com/xuri/excelize/v2"
	"ykpbabakanciwaringin.id/cbt-backend/internal/domain"
	"ykpbabakanciwaringin.id/cbt-backend/pkg/utils"
	"ykpbabakanciwaringin.id/cbt-backend/pkg/utils/excel_helper"
	"ykpbabakanciwaringin.id/cbt-backend/pkg/utils/pdf_helper"
)

type ExamSessionExporter interface {
	GenerateSessionScheduleExcel(sessions []domain.ExamSession) (*bytes.Buffer, error)
	GenerateSessionSchedulePDF(sessions []domain.ExamSession, kopData pdf_helper.KopSuratData) (*bytes.Buffer, error)
	GeneratePhotoReferenceExcel(participants []domain.ExamParticipant) (*bytes.Buffer, error)
	GenerateParticipantTemplate(sessionTitle string, subjectCount int, packets []domain.QuestionBank, students []domain.User) (*bytes.Buffer, error)
}

type examSessionExporter struct{}

func NewExamSessionExporter() ExamSessionExporter {
	return &examSessionExporter{}
}

// 1. EXCEL JADWAL SESI
func (e *examSessionExporter) GenerateSessionScheduleExcel(sessions []domain.ExamSession) (*bytes.Buffer, error) {
	f := excelize.NewFile()
	sheet := "Jadwal Sesi Ujian"
	f.SetSheetName("Sheet1", sheet)
	styles := excel_helper.InitStandardStyles(f)

	// [PERBAIKAN] Menambahkan kolom PROKTOR
	headers := []string{"NO", "NAMA SESI", "TOKEN", "WAKTU MULAI", "WAKTU SELESAI", "DURASI", "MATA PELAJARAN", "GURU PENGAWAS", "PROKTOR", "JML PESERTA", "STATUS"}
	for i, h := range headers {
		cell, _ := excelize.CoordinatesToCellName(i+1, 1)
		f.SetCellValue(sheet, cell, h)
		f.SetCellStyle(sheet, cell, cell, styles.Header)
	}

	for i, s := range sessions {
		row := i + 2

		// [PERBAIKAN] Mengambil nama Pengawas
		supervisorName := "-"
		if len(s.Supervisors) > 0 && s.Supervisors[0].Teacher != nil {
			supervisorName = s.Supervisors[0].Teacher.FullName
		}

		// [PERBAIKAN] Mengambil nama Proktor
		proctorName := "-"
		if len(s.Proctors) > 0 && s.Proctors[0].Teacher != nil {
			proctorName = s.Proctors[0].Teacher.FullName
		}

		status := "SELESAI"
		now := utils.NowWIB()
		if s.IsActive {
			if now.Before(s.StartTime) {
				status = "AKAN DATANG"
			} else if now.After(s.EndTime) {
				status = "SELESAI"
			} else {
				status = "BERJALAN"
			}
		} else {
			status = "DIHENTIKAN"
		}

		f.SetCellValue(sheet, fmt.Sprintf("A%d", row), i+1)
		f.SetCellValue(sheet, fmt.Sprintf("B%d", row), s.Title)
		f.SetCellValue(sheet, fmt.Sprintf("C%d", row), s.Token)
		f.SetCellValue(sheet, fmt.Sprintf("D%d", row), s.StartTime.Format("02-01-2006 15:04"))
		f.SetCellValue(sheet, fmt.Sprintf("E%d", row), s.EndTime.Format("02-01-2006 15:04"))
		f.SetCellValue(sheet, fmt.Sprintf("F%d", row), fmt.Sprintf("%d Menit", s.DurationMin))
		f.SetCellValue(sheet, fmt.Sprintf("G%d", row), s.SubjectList)
		f.SetCellValue(sheet, fmt.Sprintf("H%d", row), supervisorName)
		f.SetCellValue(sheet, fmt.Sprintf("I%d", row), proctorName)
		f.SetCellValue(sheet, fmt.Sprintf("J%d", row), s.ParticipantCount)
		f.SetCellValue(sheet, fmt.Sprintf("K%d", row), status)
		f.SetCellStyle(sheet, fmt.Sprintf("A%d", row), fmt.Sprintf("K%d", row), styles.DataCenter)
	}
	f.SetColWidth(sheet, "B", "B", 30)
	f.SetColWidth(sheet, "G", "G", 30)
	f.SetColWidth(sheet, "H", "I", 25)

	return f.WriteToBuffer()
}

// 2. PDF JADWAL SESI
func (e *examSessionExporter) GenerateSessionSchedulePDF(sessions []domain.ExamSession, kopData pdf_helper.KopSuratData) (*bytes.Buffer, error) {
	pdf := pdf_helper.SetupPDF("L") // Landscape
	pdf.AddPage()

	pdf_helper.RenderKopSurat(pdf, kopData, "JADWAL_SESI_CBT", true)

	pdf.SetFont("Cambria", "B", 12)
	pdf.CellFormat(0, 7, "DAFTAR JADWAL PELAKSANAAN UJIAN (CBT)", "", 1, "C", false, 0, "")
	pdf.Ln(4)

	w := []float64{10, 45, 40, 15, 60, 45, 20, 25} // Total = 260
	headers := []string{"NO", "NAMA SESI", "WAKTU PELAKSANAAN", "DURASI", "MATA PELAJARAN", "PENGAWAS", "PESERTA", "STATUS"}

	pdf.SetFont("Cambria", "B", 8)
	pdf.SetFillColor(5, 150, 105) // Emerald
	pdf.SetTextColor(255, 255, 255)
	for i, h := range headers {
		pdf.CellFormat(w[i], 8, h, "1", 0, "C", true, 0, "")
	}
	pdf.Ln(8)

	pdf.SetFont("Cambria", "", 8)
	pdf.SetTextColor(0, 0, 0)
	for i, s := range sessions {
		// [PERBAIKAN] Mengambil nama Pengawas
		supervisor := "-"
		if len(s.Supervisors) > 0 && s.Supervisors[0].Teacher != nil {
			supervisor = s.Supervisors[0].Teacher.FullName
		}
		if len(supervisor) > 25 {
			supervisor = supervisor[:22] + "..."
		}

		mapel := s.SubjectList
		if len(mapel) > 35 {
			mapel = mapel[:32] + "..."
		}

		waktu := s.StartTime.Format("02/01/06 15:04") + " - " + s.EndTime.Format("15:04")

		status := "SELESAI"
		now := utils.NowWIB()
		if s.IsActive {
			if now.Before(s.StartTime) {
				status = "AKAN DATANG"
			} else if now.After(s.EndTime) {
				status = "SELESAI"
			} else {
				status = "BERJALAN"
			}
		} else {
			status = "DIHENTIKAN"
		}

		pdf.CellFormat(w[0], 7, fmt.Sprintf("%d", i+1), "1", 0, "C", false, 0, "")
		pdf.CellFormat(w[1], 7, " "+s.Title, "1", 0, "L", false, 0, "")
		pdf.CellFormat(w[2], 7, waktu, "1", 0, "C", false, 0, "")
		pdf.CellFormat(w[3], 7, fmt.Sprintf("%d Min", s.DurationMin), "1", 0, "C", false, 0, "")
		pdf.CellFormat(w[4], 7, " "+mapel, "1", 0, "L", false, 0, "")
		pdf.CellFormat(w[5], 7, " "+supervisor, "1", 0, "L", false, 0, "")
		pdf.CellFormat(w[6], 7, fmt.Sprintf("%d Siswa", s.ParticipantCount), "1", 0, "C", false, 0, "")
		pdf.CellFormat(w[7], 7, status, "1", 1, "C", false, 0, "")
	}

	var buf bytes.Buffer
	err := pdf.Output(&buf)
	return &buf, err
}

// 3. EXCEL REFERENSI UPLOAD FOTO
func (e *examSessionExporter) GeneratePhotoReferenceExcel(participants []domain.ExamParticipant) (*bytes.Buffer, error) {
	f := excelize.NewFile()
	sheet := "Referensi Foto"
	f.SetSheetName("Sheet1", sheet)
	styles := excel_helper.InitStandardStyles(f)

	headers := []string{"NO", "NAMA SISWA", "USERNAME", "NISN", "SARAN NAMA FILE FOTO (.jpg)"}
	for i, h := range headers {
		cell, _ := excelize.CoordinatesToCellName(i+1, 1)
		f.SetCellValue(sheet, cell, h)
		f.SetCellStyle(sheet, cell, cell, styles.Header)
	}

	for i, p := range participants {
		row := i + 2
		var name, username, nisn string
		if p.Student != nil {
			username = p.Student.Username
			if p.Student.Profile != nil {
				name = p.Student.Profile.FullName
				nisn = p.Student.Profile.NISN
			}
		}
		saranFile := nisn + ".jpg"
		if nisn == "" || nisn == "-" {
			saranFile = username + ".jpg"
		}

		f.SetCellValue(sheet, fmt.Sprintf("A%d", row), i+1)
		f.SetCellValue(sheet, fmt.Sprintf("B%d", row), name)
		f.SetCellValue(sheet, fmt.Sprintf("C%d", row), username)
		f.SetCellValue(sheet, fmt.Sprintf("D%d", row), nisn)
		f.SetCellValue(sheet, fmt.Sprintf("E%d", row), saranFile)
		f.SetCellStyle(sheet, fmt.Sprintf("A%d", row), fmt.Sprintf("E%d", row), styles.DataCenter)
		f.SetCellStyle(sheet, fmt.Sprintf("B%d", row), fmt.Sprintf("B%d", row), styles.DataLeft)
	}

	f.SetColWidth(sheet, "B", "B", 40)
	f.SetColWidth(sheet, "C", "D", 20)
	f.SetColWidth(sheet, "E", "E", 35)

	return f.WriteToBuffer()
}

// =========================================================================================
// [PEMBARUAN] GENERATE TEMPLATE PESERTA (AUTO-FILL DATA SISWA & DROPDOWN BANK SOAL)
// =========================================================================================

func (e *examSessionExporter) GenerateParticipantTemplate(sessionTitle string, subjectCount int, packets []domain.QuestionBank, students []domain.User) (*bytes.Buffer, error) {
	f := excelize.NewFile()
	sheet := "Template Peserta"
	f.SetSheetName("Sheet1", sheet)
	styles := excel_helper.InitStandardStyles(f)

	// A. SHEET REFERENSI BANK SOAL
	refSheet := "Ref_BankSoal"
	f.NewSheet(refSheet)
	f.SetCellValue(refSheet, "A1", "JUDUL_PAKET_SOAL")
	var dropList []string
	for i, p := range packets {
		title := strings.TrimSpace(p.Title)
		f.SetCellValue(refSheet, fmt.Sprintf("A%d", i+2), title)
		dropList = append(dropList, title)
	}
	f.SetColWidth(refSheet, "A", "A", 50)

	// B. HEADER DINAMIS
	headers := []string{"NO", "NOMOR UJIAN", "NISN", "NAMA SISWA", "KELAS", "USERNAME_SISWA *"}
	// Membuat kolom "PAKET SOAL 1", "PAKET SOAL 2", dst. sesuai SubjectCount
	for i := 1; i <= subjectCount; i++ {
		headers = append(headers, fmt.Sprintf("PAKET SOAL %d", i))
	}

	for i, h := range headers {
		colName, _ := excelize.ColumnNumberToName(i + 1)
		cell := fmt.Sprintf("%s1", colName)
		f.SetCellValue(sheet, cell, h)
		f.SetCellStyle(sheet, cell, cell, styles.TemplateHeader)

		width := 20.0
		if h == "NO" {
			width = 6.0
		} else if h == "NAMA SISWA" {
			width = 35.0
		} else if h == "USERNAME_SISWA *" {
			width = 25.0
		} else if strings.HasPrefix(h, "PAKET SOAL") {
			width = 45.0
		}
		f.SetColWidth(sheet, colName, colName, width)
	}

	// C. AUTO-FILL DATA SISWA
	for i, student := range students {
		row := i + 2
		nisn := "-"
		nama := student.Username
		kelas := "-"

		if student.Profile != nil {
			if student.Profile.NISN != "" {
				nisn = student.Profile.NISN
			}
			if student.Profile.FullName != "" {
				nama = student.Profile.FullName
			}
			if student.Profile.Class != nil && student.Profile.Class.Name != "" {
				kelas = student.Profile.Class.Name
			}
		}

		f.SetCellValue(sheet, fmt.Sprintf("A%d", row), i+1)
		f.SetCellValue(sheet, fmt.Sprintf("C%d", row), nisn)
		f.SetCellValue(sheet, fmt.Sprintf("D%d", row), nama)
		f.SetCellValue(sheet, fmt.Sprintf("E%d", row), kelas)
		f.SetCellValue(sheet, fmt.Sprintf("F%d", row), student.Username)
	}

	// D. DATA VALIDATION (DROPDOWN) UNTUK SETIAP KOLOM PAKET SOAL
	if len(dropList) > 0 {
		dv := excelize.NewDataValidation(true)

		// Terapkan dropdown mulai dari kolom ke-7 (G) hingga kolom terakhir paket soal
		startCol, _ := excelize.ColumnNumberToName(7)
		endCol, _ := excelize.ColumnNumberToName(6 + subjectCount)
		dv.Sqref = fmt.Sprintf("%s2:%s10000", startCol, endCol)

		// Rujukan ke sheet referensi
		dv.SetSqrefDropList(fmt.Sprintf("'%s'!$A$2:$A$%d", refSheet, len(packets)+1))
		f.AddDataValidation(sheet, dv)
	}

	return f.WriteToBuffer()
}
