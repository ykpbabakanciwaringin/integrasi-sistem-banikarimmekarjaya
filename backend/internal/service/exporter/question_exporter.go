// LOKASI: internal/service/exporter/question_exporter.go
package exporter

import (
	"bytes"
	"fmt"
	"strings"

	"github.com/xuri/excelize/v2"
	"ykpbabakanciwaringin.id/cbt-backend/internal/domain"
	"ykpbabakanciwaringin.id/cbt-backend/pkg/utils/excel_helper"
)

type QuestionExporter interface {
	GenerateQuestionExcel(packet domain.QuestionBank) (*bytes.Buffer, error)
	// Template Dinamis & Export Laporan
	GenerateQuestionPacketTemplate(classes []domain.Class, subjects []domain.Subject, teachers []domain.User) (*bytes.Buffer, error)
	GeneratePacketListExcel(packets []domain.QuestionBank) (*bytes.Buffer, error)
}

type questionExporter struct{}

func NewQuestionExporter() QuestionExporter {
	return &questionExporter{}
}

// -------------------------------------------------------------------------
// 1. FUNGSI EXPORT TEMPLATE BUTIR SOAL (SUDAH ADA)
// -------------------------------------------------------------------------
func (e *questionExporter) GenerateQuestionExcel(packet domain.QuestionBank) (*bytes.Buffer, error) {
	f := excelize.NewFile()
	sheet := "Template Soal"
	f.SetSheetName("Sheet1", sheet)

	styles := excel_helper.InitStandardStyles(f)

	headers := []string{
		"NO", "TIPE_SOAL *", "PERTANYAAN *", "OPSI_A", "OPSI_B",
		"OPSI_C", "OPSI_D", "OPSI_E", "JAWABAN_BENAR *", "BOBOT *",
	}

	for i, h := range headers {
		cell, _ := excelize.CoordinatesToCellName(i+1, 1)
		f.SetCellValue(sheet, cell, h)
		f.SetCellStyle(sheet, cell, cell, styles.Header)
	}

	f.SetColWidth(sheet, "B", "B", 15)
	f.SetColWidth(sheet, "C", "C", 60)
	f.SetColWidth(sheet, "D", "H", 25)
	f.SetColWidth(sheet, "I", "I", 20)
	f.SetColWidth(sheet, "J", "J", 10)

	rowIdx := 2
	globalCounter := 1

	for _, item := range packet.Items {
		f.SetCellValue(sheet, fmt.Sprintf("A%d", rowIdx), globalCounter)
		f.SetCellValue(sheet, fmt.Sprintf("B%d", rowIdx), item.Type)
		f.SetCellValue(sheet, fmt.Sprintf("C%d", rowIdx), item.Content.Question)

		if item.Type == domain.QuestionTypePG {
			f.SetCellValue(sheet, fmt.Sprintf("D%d", rowIdx), item.Content.Options["A"])
			f.SetCellValue(sheet, fmt.Sprintf("E%d", rowIdx), item.Content.Options["B"])
			f.SetCellValue(sheet, fmt.Sprintf("F%d", rowIdx), item.Content.Options["C"])
			f.SetCellValue(sheet, fmt.Sprintf("G%d", rowIdx), item.Content.Options["D"])
			f.SetCellValue(sheet, fmt.Sprintf("H%d", rowIdx), item.Content.Options["E"])
		}

		f.SetCellValue(sheet, fmt.Sprintf("I%d", rowIdx), item.AnswerKey)
		f.SetCellValue(sheet, fmt.Sprintf("J%d", rowIdx), item.ScoreWeight)
		rowIdx++
		globalCounter++
	}

	return f.WriteToBuffer()
}

// -------------------------------------------------------------------------
// GENERATE TEMPLATE PAKET SOAL (DYNAMIC DROPDOWN)
// -------------------------------------------------------------------------
func (e *questionExporter) GenerateQuestionPacketTemplate(classes []domain.Class, subjects []domain.Subject, teachers []domain.User) (*bytes.Buffer, error) {
	f := excelize.NewFile()
	sheet := "Template Paket Soal"
	f.SetSheetName("Sheet1", sheet)

	validationSheet := "Data_Validation"
	f.NewSheet(validationSheet)
	f.SetSheetVisible(validationSheet, false)

	levelMap := make(map[string]bool)
	var uniqueLevels []string
	for _, c := range classes {
		if c.Level != "" && !levelMap[strings.ToUpper(c.Level)] {
			levelMap[strings.ToUpper(c.Level)] = true
			uniqueLevels = append(uniqueLevels, strings.ToUpper(c.Level))
		}
	}

	// Tulis Data ke Sheet Tersembunyi
	for i, subj := range subjects {
		f.SetCellValue(validationSheet, fmt.Sprintf("A%d", i+1), strings.ToUpper(subj.Name))
	}
	for i, t := range teachers {
		if t.Profile != nil {
			f.SetCellValue(validationSheet, fmt.Sprintf("B%d", i+1), strings.ToUpper(t.Profile.FullName))
		}
	}

	for i, lvl := range uniqueLevels {
		f.SetCellValue(validationSheet, fmt.Sprintf("C%d", i+1), lvl)
	}

	styles := excel_helper.InitStandardStyles(f)

	headers := []string{"NO", "JUDUL_PAKET *", "KELAS/TINGKAT *", "MATA_PELAJARAN *", "GURU_PEMBUAT (Opsional)"}
	for i, h := range headers {
		cell, _ := excelize.CoordinatesToCellName(i+1, 1)
		f.SetCellValue(sheet, cell, h)

		if i >= 2 && i <= 4 {
			f.SetCellStyle(sheet, cell, cell, styles.DropdownHeader)
		} else {
			f.SetCellStyle(sheet, cell, cell, styles.TemplateHeader)
		}
	}

	f.SetColWidth(sheet, "B", "B", 40)
	f.SetColWidth(sheet, "C", "C", 20)
	f.SetColWidth(sheet, "D", "E", 35)

	if len(uniqueLevels) > 0 {
		dvLevel := excelize.NewDataValidation(true)
		dvLevel.Sqref = "C2:C2000"
		dvLevel.SetSqrefDropList(fmt.Sprintf("'%s'!$C$1:$C$%d", validationSheet, len(uniqueLevels)))
		f.AddDataValidation(sheet, dvLevel)
	}

	// Suntikkan Validasi Dropdown untuk Mapel (Kolom D)
	if len(subjects) > 0 {
		dvSubj := excelize.NewDataValidation(true)
		dvSubj.Sqref = "D2:D2000"
		dvSubj.SetSqrefDropList(fmt.Sprintf("'%s'!$A$1:$A$%d", validationSheet, len(subjects)))
		f.AddDataValidation(sheet, dvSubj)
	}

	// Suntikkan Validasi Dropdown untuk Guru (Kolom E)
	if len(teachers) > 0 {
		dvTeacher := excelize.NewDataValidation(true)
		dvTeacher.Sqref = "E2:E2000"
		dvTeacher.SetSqrefDropList(fmt.Sprintf("'%s'!$B$1:$B$%d", validationSheet, len(teachers)))
		f.AddDataValidation(sheet, dvTeacher)
	}

	return f.WriteToBuffer()
}

// -------------------------------------------------------------------------
// 3. FUNGSI BARU: GENERATE LAPORAN DAFTAR PAKET SOAL
// -------------------------------------------------------------------------
func (e *questionExporter) GeneratePacketListExcel(packets []domain.QuestionBank) (*bytes.Buffer, error) {
	f := excelize.NewFile()
	sheet := "Daftar Paket Soal"
	f.SetSheetName("Sheet1", sheet)

	styles := excel_helper.InitStandardStyles(f)

	headers := []string{"NO", "JUDUL PAKET", "KELAS", "MATA PELAJARAN", "GURU PEMBUAT", "JUMLAH SOAL", "TANGGAL DIBUAT"}
	for i, h := range headers {
		cell, _ := excelize.CoordinatesToCellName(i+1, 1)
		f.SetCellValue(sheet, cell, h)
		f.SetCellStyle(sheet, cell, cell, styles.Header)
	}

	f.SetColWidth(sheet, "B", "B", 45)
	f.SetColWidth(sheet, "C", "C", 15)
	f.SetColWidth(sheet, "D", "E", 35)
	f.SetColWidth(sheet, "F", "F", 15)
	f.SetColWidth(sheet, "G", "G", 20)

	for i, p := range packets {
		row := i + 2
		f.SetCellValue(sheet, fmt.Sprintf("A%d", row), i+1)
		f.SetCellValue(sheet, fmt.Sprintf("B%d", row), p.Title)
		f.SetCellValue(sheet, fmt.Sprintf("C%d", row), p.GradeLevel)

		subj := "-"
		if p.Subject != nil {
			subj = p.Subject.Name
		}
		f.SetCellValue(sheet, fmt.Sprintf("D%d", row), subj)

		teacher := "-"
		if p.Teacher != nil && p.Teacher.Profile != nil {
			teacher = p.Teacher.Profile.FullName
		}
		f.SetCellValue(sheet, fmt.Sprintf("E%d", row), teacher)

		f.SetCellValue(sheet, fmt.Sprintf("F%d", row), p.ItemCount)
		f.SetCellValue(sheet, fmt.Sprintf("G%d", row), p.CreatedAt.Format("02-01-2006 15:04"))
	}

	return f.WriteToBuffer()
}
