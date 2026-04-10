// LOKASI: internal/service/exporter/class_exporter.go
package exporter

import (
	"bytes"
	"fmt"

	"github.com/xuri/excelize/v2"
	"banikarimmekarjaya.id/cbt-backend/internal/domain"
	"banikarimmekarjaya.id/cbt-backend/pkg/utils/excel_helper"
)

type ClassExporter interface {
	GenerateClassListExcel(classes []domain.Class) (*bytes.Buffer, error)
}

type classExporter struct{}

func NewClassExporter() ClassExporter {
	return &classExporter{}
}

// GenerateClassListExcel menghasilkan laporan Excel yang formatnya identik dengan Template Import (Backup-Ready)
func (e *classExporter) GenerateClassListExcel(classes []domain.Class) (*bytes.Buffer, error) {
	f := excelize.NewFile()
	sheet := "Data Kelas"
	f.SetSheetName("Sheet1", sheet)

	styles := excel_helper.InitStandardStyles(f)

	// UNIFIED SCHEMA: 6 Kolom Mutlak (A sampai F)
	headers := []string{
		"NO", "NAMA KELAS *", "TINGKAT *", "JURUSAN *", "NAMA WALI KELAS", "ID LEMBAGA TARGET *",
	}

	// 1. Set Header & Lebar Kolom
	for i, h := range headers {
		colName, _ := excelize.ColumnNumberToName(i + 1)
		cell := colName + "1"
		f.SetCellValue(sheet, cell, h)
		f.SetCellStyle(sheet, cell, cell, styles.Header)

		// Penyesuaian Lebar Kolom
		width := 25.0
		if h == "NO" {
			width = 6
		}
		if h == "NAMA WALI KELAS" {
			width = 35
		}
		if h == "ID LEMBAGA TARGET *" {
			width = 45
		}
		f.SetColWidth(sheet, colName, colName, width)
	}

	// 2. Isi Data
	for i, class := range classes {
		row := i + 2

		f.SetCellValue(sheet, fmt.Sprintf("A%d", row), i+1)
		f.SetCellValue(sheet, fmt.Sprintf("B%d", row), class.Name)
		f.SetCellValue(sheet, fmt.Sprintf("C%d", row), class.Level)
		f.SetCellValue(sheet, fmt.Sprintf("D%d", row), class.Major)

		// Smart Mapping: Ambil nama lengkap guru jika ada relasinya
		teacherName := "-"
		if class.Teacher != nil {
			teacherName = class.Teacher.FullName
		}
		f.SetCellValue(sheet, fmt.Sprintf("E%d", row), teacherName)

		// ID Lembaga sangat penting untuk keperluan RESTORE/BACKUP massal
		f.SetCellValue(sheet, fmt.Sprintf("F%d", row), class.InstitutionID)

		// Set Style Baris Data
		for j := 1; j <= 6; j++ {
			colName, _ := excelize.ColumnNumberToName(j)
			style := styles.DataLeft
			if j == 1 {
				style = styles.DataCenter
			}
			f.SetCellStyle(sheet, colName+fmt.Sprintf("%d", row), colName+fmt.Sprintf("%d", row), style)
		}
	}

	// Freeze Header agar nyaman dibaca
	f.SetPanes(sheet, &excelize.Panes{Freeze: true, XSplit: 0, YSplit: 1, TopLeftCell: "A2", ActivePane: "bottomLeft"})

	return f.WriteToBuffer()
}
