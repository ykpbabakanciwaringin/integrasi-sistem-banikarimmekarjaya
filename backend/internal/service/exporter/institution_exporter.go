// LOKASI: internal/service/exporter/institution_exporter.go
package exporter

import (
	"bytes"
	"fmt"

	"github.com/xuri/excelize/v2"
	"ykpbabakanciwaringin.id/cbt-backend/internal/domain"
	"ykpbabakanciwaringin.id/cbt-backend/pkg/utils/excel_helper"
)

type InstitutionExporter interface {
	GenerateInstitutionTemplate() (*bytes.Buffer, error)
	GenerateInstitutionListExcel(institutions []domain.Institution) (*bytes.Buffer, error)
}

type institutionExporter struct{}

func NewInstitutionExporter() InstitutionExporter {
	return &institutionExporter{}
}

// =========================================================================
// 1. TEMPLATE IMPORT EXCEL LEMBAGA
// =========================================================================
func (e *institutionExporter) GenerateInstitutionTemplate() (*bytes.Buffer, error) {
	f := excelize.NewFile()
	sheet := "Template Lembaga"
	f.SetSheetName("Sheet1", sheet)
	styles := excel_helper.InitStandardStyles(f)

	headers := []struct {
		Title string
		Width float64
		Style int
	}{
		{"NO", 6, styles.DataCenter},
		{"KODE LEMBAGA *", 25, styles.DataLeft},
		{"NAMA LEMBAGA *", 40, styles.DataLeft},
		{"NAMA YAYASAN", 40, styles.DataLeft},
		{"JENJANG *", 30, styles.DropdownHeader},
		{"KATEGORI *", 20, styles.DropdownHeader},
		{"ALAMAT JALAN", 45, styles.DataLeft},
		{"KOTA / KABUPATEN", 25, styles.DataLeft},
		{"NO TELEPON", 20, styles.DataLeft},
		{"EMAIL", 30, styles.DataLeft},
		{"WEBSITE", 30, styles.DataLeft},
		{"HEADER KOP SURAT 1", 40, styles.DataLeft},
		{"HEADER KOP SURAT 2", 40, styles.DataLeft},
		{"NAMA FILE LOGO", 25, styles.DataLeft},
		{"HARI LIBUR *", 20, styles.DropdownHeader},
		{"STATUS PQ SYNC", 20, styles.DropdownHeader},
	}

	for i, h := range headers {
		colName, _ := excelize.ColumnNumberToName(i + 1)
		cellHeader := colName + "1"

		f.SetCellValue(sheet, cellHeader, h.Title)
		f.SetColWidth(sheet, colName, colName, h.Width)

		if h.Style == styles.DropdownHeader {
			f.SetCellStyle(sheet, cellHeader, cellHeader, styles.DropdownHeader)
		} else {
			f.SetCellStyle(sheet, cellHeader, cellHeader, styles.TemplateHeader)
		}

		bodyStyle := styles.DataLeft
		if h.Title == "NO" {
			bodyStyle = styles.DataCenter
		}
		f.SetCellStyle(sheet, colName+"2", colName+"500", bodyStyle)
	}

	f.SetPanes(sheet, &excelize.Panes{Freeze: true, XSplit: 0, YSplit: 1, TopLeftCell: "A2", ActivePane: "bottomLeft"})

	return f.WriteToBuffer()
}

// =========================================================================
// 2. EXPORT DATA LIST EXCEL LEMBAGA (Identik dengan Template agar bisa di-Import Ulang)
// =========================================================================
func (e *institutionExporter) GenerateInstitutionListExcel(institutions []domain.Institution) (*bytes.Buffer, error) {
	f := excelize.NewFile()
	sheet := "Data Lembaga"
	f.SetSheetName("Sheet1", sheet)

	styles := excel_helper.InitStandardStyles(f)

	// HEADERS: Sama persis 16 kolom dengan Template agar valid saat diupload ulang
	headers := []string{
		"NO", "KODE LEMBAGA *", "NAMA LEMBAGA *", "NAMA YAYASAN", "JENJANG *",
		"KATEGORI *", "ALAMAT JALAN", "KOTA / KABUPATEN", "NO TELEPON",
		"EMAIL", "WEBSITE", "HEADER KOP SURAT 1", "HEADER KOP SURAT 2",
		"NAMA FILE LOGO", "HARI LIBUR *", "STATUS PQ SYNC",
	}

	for i, h := range headers {
		colName, _ := excelize.ColumnNumberToName(i + 1)
		cell := colName + "1"
		f.SetCellValue(sheet, cell, h)
		f.SetCellStyle(sheet, cell, cell, styles.Header)

		// Set Lebar (Menyamakan dengan template)
		width := 25.0
		if h == "NO" {
			width = 6
		}
		if h == "NAMA LEMBAGA *" || h == "NAMA YAYASAN" || h == "HEADER KOP SURAT 1" || h == "HEADER KOP SURAT 2" {
			width = 40
		}
		if h == "ALAMAT JALAN" {
			width = 45
		}
		if h == "EMAIL" || h == "WEBSITE" || h == "JENJANG *" {
			width = 30
		}
		f.SetColWidth(sheet, colName, colName, width)
	}

	for i, inst := range institutions {
		row := i + 2

		f.SetCellValue(sheet, fmt.Sprintf("A%d", row), i+1)
		f.SetCellValue(sheet, fmt.Sprintf("B%d", row), inst.Code)
		f.SetCellValue(sheet, fmt.Sprintf("C%d", row), inst.Name)
		f.SetCellValue(sheet, fmt.Sprintf("D%d", row), inst.FoundationName)
		f.SetCellValue(sheet, fmt.Sprintf("E%d", row), inst.LevelCode)
		f.SetCellValue(sheet, fmt.Sprintf("F%d", row), inst.Category)
		f.SetCellValue(sheet, fmt.Sprintf("G%d", row), inst.AddressDetail)
		f.SetCellValue(sheet, fmt.Sprintf("H%d", row), inst.AddressCity)
		f.SetCellValue(sheet, fmt.Sprintf("I%d", row), inst.ContactPhone)
		f.SetCellValue(sheet, fmt.Sprintf("J%d", row), inst.ContactEmail)
		f.SetCellValue(sheet, fmt.Sprintf("K%d", row), inst.Website)
		f.SetCellValue(sheet, fmt.Sprintf("L%d", row), inst.Header1)
		f.SetCellValue(sheet, fmt.Sprintf("M%d", row), inst.Header2)
		f.SetCellValue(sheet, fmt.Sprintf("N%d", row), inst.LogoUrl)
		f.SetCellValue(sheet, fmt.Sprintf("O%d", row), inst.WeeklyDayOff)

		pqStatus := "NON-AKTIF"
		if inst.IsPqIntegrationEnabled {
			pqStatus = "AKTIF"
		}
		f.SetCellValue(sheet, fmt.Sprintf("P%d", row), pqStatus)
	}

	return f.WriteToBuffer()
}
