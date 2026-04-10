// LOKASI: internal/service/exporter/assignment_exporter.go
package exporter

import (
	"bytes"
	"fmt"
	"strings"
	"time"

	"github.com/xuri/excelize/v2"
	"ykpbabakanciwaringin.id/cbt-backend/internal/domain"
	"ykpbabakanciwaringin.id/cbt-backend/pkg/utils/excel_helper"
)

type AssignmentExporter interface {
	GenerateRekapExcel(detail *domain.AssignmentDetail, grades []domain.StudentGrade) (*bytes.Buffer, error)
	GenerateAssignmentTemplate(classes []domain.Class, subjects []domain.Subject, teachers []domain.User, sessions []domain.ClassSession) (*bytes.Buffer, error)
	GenerateAssignmentListExcel(assignments []domain.Assignment) (*bytes.Buffer, error)
}

type assignmentExporter struct{}

func NewAssignmentExporter() AssignmentExporter {
	return &assignmentExporter{}
}

func (e *assignmentExporter) GenerateRekapExcel(detail *domain.AssignmentDetail, grades []domain.StudentGrade) (*bytes.Buffer, error) {
	f := excelize.NewFile()
	sheet := "Daftar Nilai"
	f.SetSheetName("Sheet1", sheet)

	styles := excel_helper.InitStandardStyles(f)
	styleTitle, _ := f.NewStyle(&excelize.Style{
		Font:      &excelize.Font{Bold: true, Size: 14},
		Alignment: &excelize.Alignment{Horizontal: "center"},
	})
	styleSubHeader, _ := f.NewStyle(&excelize.Style{
		Font:      &excelize.Font{Bold: true},
		Alignment: &excelize.Alignment{Horizontal: "left"},
	})

	f.SetCellValue(sheet, "A1", "REKAP PENILAIAN BELAJAR PESERTA DIDIK")
	f.MergeCell(sheet, "A1", "H1")
	f.SetCellStyle(sheet, "A1", "A1", styleTitle)

	f.SetCellValue(sheet, "A3", "NAMA LEMBAGA")
	f.SetCellValue(sheet, "C3", ": "+detail.InstitutionName)
	f.SetCellValue(sheet, "A4", "MATA PELAJARAN")
	f.SetCellValue(sheet, "C4", ": "+detail.SubjectName)
	f.SetCellValue(sheet, "A5", "KELAS")
	f.SetCellValue(sheet, "C5", ": "+detail.ClassName)
	f.SetCellValue(sheet, "A6", "GURU PENGAMPU")
	f.SetCellValue(sheet, "C6", ": "+detail.TeacherName)

	f.SetCellValue(sheet, "F3", "TANGGAL CETAK")
	f.SetCellValue(sheet, "H3", ": "+time.Now().Format("02 Januari 2006"))
	f.SetCellValue(sheet, "F4", "NILAI KKM")
	f.SetCellValue(sheet, "H4", ": "+fmt.Sprintf("%.0f", detail.KKM))
	f.SetCellValue(sheet, "F5", "TOTAL SISWA")
	f.SetCellValue(sheet, "H5", ": "+fmt.Sprintf("%d Siswa", len(grades)))

	f.SetCellStyle(sheet, "A3", "A6", styleSubHeader)
	f.SetCellStyle(sheet, "F3", "F5", styleSubHeader)

	headers := []string{"NO", "USERNAME / NISN", "NAMA LENGKAP", "L/P", "BENAR", "SALAH", "NILAI", "KET"}
	cols := []string{"A", "B", "C", "D", "E", "F", "G", "H"}
	for i, h := range headers {
		cell := cols[i] + "8"
		f.SetCellValue(sheet, cell, h)
		f.SetCellStyle(sheet, cell, cell, styles.Header)
	}

	for i, g := range grades {
		row := 9 + i
		f.SetCellValue(sheet, fmt.Sprintf("A%d", row), i+1)
		f.SetCellValue(sheet, fmt.Sprintf("B%d", row), g.StudentUsername)
		f.SetCellValue(sheet, fmt.Sprintf("C%d", row), g.StudentName)
		f.SetCellValue(sheet, fmt.Sprintf("D%d", row), g.StudentGender)
		f.SetCellValue(sheet, fmt.Sprintf("E%d", row), g.CorrectCount)
		f.SetCellValue(sheet, fmt.Sprintf("F%d", row), g.WrongCount)
		f.SetCellValue(sheet, fmt.Sprintf("G%d", row), g.FinalScore)

		ket := "TIDAK TUNTAS"
		if g.FinalScore >= detail.KKM {
			ket = "TUNTAS"
		}
		if g.ExamStatus == "BELUM UJIAN" {
			ket = "BELUM UJIAN"
		}
		f.SetCellValue(sheet, fmt.Sprintf("H%d", row), ket)

		for _, col := range cols {
			cell := fmt.Sprintf("%s%d", col, row)
			if col == "C" {
				f.SetCellStyle(sheet, cell, cell, styles.DataLeft)
			} else {
				f.SetCellStyle(sheet, cell, cell, styles.DataCenter)
			}
		}
	}

	f.SetColWidth(sheet, "A", "A", 6)
	f.SetColWidth(sheet, "B", "B", 25)
	f.SetColWidth(sheet, "C", "C", 40)
	f.SetColWidth(sheet, "D", "D", 10)
	f.SetColWidth(sheet, "E", "G", 12)
	f.SetColWidth(sheet, "H", "H", 20)

	return f.WriteToBuffer()
}

// =======================================================
// FITUR BARU: GENERATE TEMPLATE EXCEL (DENGAN DROPDOWN JADWAL)
// =======================================================
func (e *assignmentExporter) GenerateAssignmentTemplate(classes []domain.Class, subjects []domain.Subject, teachers []domain.User, sessions []domain.ClassSession) (*bytes.Buffer, error) {
	f := excelize.NewFile()
	sheet := "Template Penugasan"
	f.SetSheetName("Sheet1", sheet)

	validationSheet := "Data_Validation"
	f.NewSheet(validationSheet)
	f.SetSheetVisible(validationSheet, false)

	// Tulis Data ke Sheet Tersembunyi (Untuk Sumber Dropdown)
	for i, subj := range subjects {
		f.SetCellValue(validationSheet, fmt.Sprintf("A%d", i+1), strings.ToUpper(subj.Name))
	}
	for i, c := range classes {
		f.SetCellValue(validationSheet, fmt.Sprintf("B%d", i+1), strings.ToUpper(c.Name))
	}
	for i, t := range teachers {
		if t.Profile != nil {
			f.SetCellValue(validationSheet, fmt.Sprintf("C%d", i+1), strings.ToUpper(t.Profile.FullName))
		}
	}
	for i, s := range sessions {
		f.SetCellValue(validationSheet, fmt.Sprintf("D%d", i+1), strings.ToUpper(s.Name))
	}

	days := []string{"SENIN", "SELASA", "RABU", "KAMIS", "JUMAT", "SABTU", "AHAD"}
	for i, d := range days {
		f.SetCellValue(validationSheet, fmt.Sprintf("E%d", i+1), d)
	}

	styles := excel_helper.InitStandardStyles(f)

	// DYNAMIC HEADERS: Ubah tanda bintang sesuai konfigurasi Sesi di database
	dayHeader := "HARI (Opsional)"
	sessionHeader := "SESI (Opsional)"
	if len(sessions) > 0 {
		dayHeader = "HARI *"
		sessionHeader = "SESI *"
	}

	headers := []string{"NO", "MATA_PELAJARAN *", "KELAS *", "GURU_PENGAMPU *", "KKM (Opsional)", dayHeader, sessionHeader}

	for i, h := range headers {
		cell, _ := excelize.CoordinatesToCellName(i+1, 1)
		f.SetCellValue(sheet, cell, h)

		// Beri warna Biru (Wajib) jika Header mengandung tanda bintang '*'
		if strings.Contains(h, "*") {
			f.SetCellStyle(sheet, cell, cell, styles.DropdownHeader)
		} else {
			f.SetCellStyle(sheet, cell, cell, styles.TemplateHeader)
		}
	}

	f.SetColWidth(sheet, "B", "B", 35)
	f.SetColWidth(sheet, "C", "C", 15)
	f.SetColWidth(sheet, "D", "D", 40)
	f.SetColWidth(sheet, "E", "E", 15)
	f.SetColWidth(sheet, "F", "F", 18)
	f.SetColWidth(sheet, "G", "G", 25)

	// SUNTIKKAN VALIDASI DROPDOWN DARI SHEET TERSEMBUNYI
	if len(subjects) > 0 {
		dv := excelize.NewDataValidation(true)
		dv.Sqref = "B2:B2000"
		dv.SetSqrefDropList(fmt.Sprintf("'%s'!$A$1:$A$%d", validationSheet, len(subjects)))
		f.AddDataValidation(sheet, dv)
	}
	if len(classes) > 0 {
		dv := excelize.NewDataValidation(true)
		dv.Sqref = "C2:C2000"
		dv.SetSqrefDropList(fmt.Sprintf("'%s'!$B$1:$B$%d", validationSheet, len(classes)))
		f.AddDataValidation(sheet, dv)
	}
	if len(teachers) > 0 {
		dv := excelize.NewDataValidation(true)
		dv.Sqref = "D2:D2000"
		dv.SetSqrefDropList(fmt.Sprintf("'%s'!$C$1:$C$%d", validationSheet, len(teachers)))
		f.AddDataValidation(sheet, dv)
	}

	// Jika Sesi Opsional / Belum diatur, Dropdown HARI dan SESI tidak di-inject agar leluasa
	if len(sessions) > 0 {
		dvSesi := excelize.NewDataValidation(true)
		dvSesi.Sqref = "G2:G2000"
		dvSesi.SetSqrefDropList(fmt.Sprintf("'%s'!$D$1:$D$%d", validationSheet, len(sessions)))
		f.AddDataValidation(sheet, dvSesi)

		dvDays := excelize.NewDataValidation(true)
		dvDays.Sqref = "F2:F2000"
		dvDays.SetSqrefDropList(fmt.Sprintf("'%s'!$E$1:$E$7", validationSheet))
		f.AddDataValidation(sheet, dvDays)
	}

	return f.WriteToBuffer()
}

func (e *assignmentExporter) GenerateAssignmentListExcel(assignments []domain.Assignment) (*bytes.Buffer, error) {
	f := excelize.NewFile()
	sheet := "Daftar Penugasan"
	f.SetSheetName("Sheet1", sheet)

	styles := excel_helper.InitStandardStyles(f)

	f.SetCellValue(sheet, "A1", "DAFTAR PENUGASAN GURU DAN MATA PELAJARAN")
	f.SetCellValue(sheet, "A2", "Diunduh pada: "+time.Now().Format("02 Jan 2006 15:04 WIB"))
	styleTitle, _ := f.NewStyle(&excelize.Style{Font: &excelize.Font{Bold: true, Size: 12}})
	f.SetCellStyle(sheet, "A1", "A1", styleTitle)

	headers := []string{"NO", "MATA PELAJARAN", "KELAS", "GURU PENGAMPU", "KKM"}
	for i, h := range headers {
		cell, _ := excelize.CoordinatesToCellName(i+1, 4)
		f.SetCellValue(sheet, cell, h)
		f.SetCellStyle(sheet, cell, cell, styles.Header)
	}

	f.SetColWidth(sheet, "A", "A", 6)
	f.SetColWidth(sheet, "B", "B", 35)
	f.SetColWidth(sheet, "C", "C", 20)
	f.SetColWidth(sheet, "D", "D", 40)
	f.SetColWidth(sheet, "E", "E", 10)

	for i, asg := range assignments {
		row := i + 5
		f.SetCellValue(sheet, fmt.Sprintf("A%d", row), i+1)

		subj := "-"
		if asg.Subject != nil {
			subj = asg.Subject.Name
		}
		f.SetCellValue(sheet, fmt.Sprintf("B%d", row), subj)

		cls := "-"
		if asg.Class != nil {
			cls = asg.Class.Name
		}
		f.SetCellValue(sheet, fmt.Sprintf("C%d", row), cls)

		teacher := "-"
		if asg.Teacher != nil {
			teacher = asg.Teacher.FullName
		}
		f.SetCellValue(sheet, fmt.Sprintf("D%d", row), teacher)

		f.SetCellValue(sheet, fmt.Sprintf("E%d", row), asg.KKM)

		f.SetCellStyle(sheet, fmt.Sprintf("A%d", row), fmt.Sprintf("E%d", row), styles.DataCenter)
		f.SetCellStyle(sheet, fmt.Sprintf("B%d", row), fmt.Sprintf("B%d", row), styles.DataLeft)
		f.SetCellStyle(sheet, fmt.Sprintf("D%d", row), fmt.Sprintf("D%d", row), styles.DataLeft)
	}

	return f.WriteToBuffer()
}
