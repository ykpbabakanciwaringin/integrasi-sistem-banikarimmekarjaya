// LOKASI: pkg/utils/excel_helper/excel_helper.go
package excel_helper

import (
	"github.com/xuri/excelize/v2"
)

// StandardStyles menampung ID Style dari excelize agar bisa dipakai ulang
type StandardStyles struct {
	Header         int
	DataCenter     int
	DataLeft       int
	TemplateHeader int
	DropdownHeader int
	CurrencyRupiah int
}

// InitStandardStyles mendaftarkan semua format sel Excel yang sering digunakan
func InitStandardStyles(f *excelize.File) StandardStyles {
	var styles StandardStyles

	// Style Header Laporan Standar (Hijau Emerald)
	styles.Header, _ = f.NewStyle(&excelize.Style{
		Font:      &excelize.Font{Bold: true, Color: "FFFFFF", Size: 10},
		Fill:      excelize.Fill{Type: "pattern", Color: []string{"059669"}, Pattern: 1}, // Hijau Emerald
		Alignment: &excelize.Alignment{Horizontal: "center", Vertical: "center", WrapText: true},
		Border: []excelize.Border{
			{Type: "left", Color: "000000", Style: 1}, {Type: "top", Color: "000000", Style: 1},
			{Type: "bottom", Color: "000000", Style: 1}, {Type: "right", Color: "000000", Style: 1},
		},
	})

	// Style Data Rata Tengah
	styles.DataCenter, _ = f.NewStyle(&excelize.Style{
		Font:      &excelize.Font{Size: 9},
		Alignment: &excelize.Alignment{Horizontal: "center", Vertical: "center", WrapText: true},
		Border: []excelize.Border{
			{Type: "left", Color: "000000", Style: 1}, {Type: "top", Color: "000000", Style: 1},
			{Type: "bottom", Color: "000000", Style: 1}, {Type: "right", Color: "000000", Style: 1},
		},
	})

	// Style Data Rata Kiri
	styles.DataLeft, _ = f.NewStyle(&excelize.Style{
		Font:      &excelize.Font{Size: 9},
		Alignment: &excelize.Alignment{Horizontal: "left", Vertical: "center", WrapText: true},
		Border: []excelize.Border{
			{Type: "left", Color: "000000", Style: 1}, {Type: "top", Color: "000000", Style: 1},
			{Type: "bottom", Color: "000000", Style: 1}, {Type: "right", Color: "000000", Style: 1},
		},
	})

	// Style Header khusus Template Import
	styles.TemplateHeader, _ = f.NewStyle(&excelize.Style{
		Font:      &excelize.Font{Bold: true, Color: "FFFFFF", Size: 10},
		Fill:      excelize.Fill{Type: "pattern", Color: []string{"#015a3e"}, Pattern: 1}, // Kuning
		Alignment: &excelize.Alignment{Horizontal: "center", Vertical: "center"},
		Border: []excelize.Border{
			{Type: "left", Color: "000000", Style: 1}, {Type: "top", Color: "000000", Style: 1},
			{Type: "bottom", Color: "000000", Style: 1}, {Type: "right", Color: "000000", Style: 1},
		},
	})

	// Style Header khusus Kolom Dropdown di Template (Biru)
	styles.DropdownHeader, _ = f.NewStyle(&excelize.Style{
		Font:      &excelize.Font{Bold: true, Color: "FFFFFF", Size: 10},
		Fill:      excelize.Fill{Type: "pattern", Color: []string{"#046d4c"}, Pattern: 1}, // Biru
		Alignment: &excelize.Alignment{Horizontal: "center", Vertical: "center"},
		Border: []excelize.Border{
			{Type: "left", Color: "000000", Style: 1}, {Type: "top", Color: "000000", Style: 1},
			{Type: "bottom", Color: "000000", Style: 1}, {Type: "right", Color: "000000", Style: 1},
		},
	})

	// Style Format Uang (Akuntansi)
	styles.CurrencyRupiah, _ = f.NewStyle(&excelize.Style{
		Font:      &excelize.Font{Size: 9},
		NumFmt:    43, // ID bawaan Excel untuk format Akuntansi lokal
		Alignment: &excelize.Alignment{Vertical: "center"},
		Border: []excelize.Border{
			{Type: "left", Color: "000000", Style: 1}, {Type: "top", Color: "000000", Style: 1},
			{Type: "bottom", Color: "000000", Style: 1}, {Type: "right", Color: "000000", Style: 1},
		},
	})

	return styles
}

// CreateDropdown menerapkan validasi data Dropdown pada sebuah range sel (misal: "C2:C1000")
func CreateDropdown(f *excelize.File, sheetName, cellRange string, options []string) error {
	dv := excelize.NewDataValidation(true)
	dv.Sqref = cellRange
	dv.SetDropList(options)
	return f.AddDataValidation(sheetName, dv)
}
