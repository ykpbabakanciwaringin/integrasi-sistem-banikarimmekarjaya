// LOKASI: internal/service/exporter/journal_exporter.go
package exporter

import (
	"bytes"
	"fmt"
	"sort"
	"strings"
	"time"

	"github.com/xuri/excelize/v2"
	"ykpbabakanciwaringin.id/cbt-backend/internal/domain"
	"ykpbabakanciwaringin.id/cbt-backend/pkg/utils/excel_helper"
	"ykpbabakanciwaringin.id/cbt-backend/pkg/utils/pdf_helper"
)

type JournalExporter interface {
	GenerateJournalRecapExcel(monthStr string, journals []domain.Journal, holidays []domain.Holiday, teacherAttendances []domain.TeacherAttendance) (*bytes.Buffer, error)
	GenerateJournalRecapPDF(monthStr string, journals []domain.Journal, holidays []domain.Holiday, teacherAttendances []domain.TeacherAttendance, kopData pdf_helper.KopSuratData) (*bytes.Buffer, error)
}

type journalExporter struct{}

func NewJournalExporter() JournalExporter {
	return &journalExporter{}
}

// Helper: Ubah "2023-10" menjadi "OKTOBER 2023"
func getIndonesianMonth(monthStr string) string {
	parts := strings.Split(monthStr, "-")
	if len(parts) != 2 {
		return monthStr
	}
	months := map[string]string{
		"01": "JANUARI", "02": "FEBRUARI", "03": "MARET",
		"04": "APRIL", "05": "MEI", "06": "JUNI",
		"07": "JULI", "08": "AGUSTUS", "09": "SEPTEMBER",
		"10": "OKTOBER", "11": "NOVEMBER", "12": "DESEMBER",
	}
	m, ok := months[parts[1]]
	if !ok {
		return parts[1]
	}
	return fmt.Sprintf("%s %s", m, parts[0])
}

// Helper: Meracik data mentah menjadi Matriks Guru per Tanggal
type teacherRecap struct {
	TeacherID   string
	TeacherName string
	Matrix      map[int]string // Tanggal (1-31) -> Nilai (Count, "S", "I", "T")
	TotalHadir  int
}

func buildRecapMatrix(journals []domain.Journal, teacherAttendances []domain.TeacherAttendance) []*teacherRecap {
	tm := make(map[string]*teacherRecap)

	// 1. Mapping Jurnal (Hitung Kehadiran/Mengajar)
	for _, j := range journals {
		if j.Allocation.Teacher == nil {
			continue
		}
		tID := j.Allocation.TeacherID
		if _, ok := tm[tID]; !ok {
			tm[tID] = &teacherRecap{
				TeacherID:   tID,
				TeacherName: j.Allocation.Teacher.FullName,
				Matrix:      make(map[int]string),
			}
		}
		day := j.Date.Day()
		// Jika sudah ada isinya (misal "1"), tambahkan
		curr := 0
		if val, exists := tm[tID].Matrix[day]; exists {
			fmt.Sscanf(val, "%d", &curr)
		}
		tm[tID].Matrix[day] = fmt.Sprintf("%d", curr+1)
		tm[tID].TotalHadir++
	}

	// 2. Mapping Kehadiran Manual / Izin / Sakit
	for _, ta := range teacherAttendances {
		tID := ta.TeacherID
		if _, ok := tm[tID]; !ok {
			name := "Unknown"
			if ta.Teacher != nil {
				name = ta.Teacher.FullName
			}
			tm[tID] = &teacherRecap{
				TeacherID:   tID,
				TeacherName: name,
				Matrix:      make(map[int]string),
			}
		}
		day := ta.Date.Day()

		// Jangan timpa jika guru tersebut ternyata punya jurnal di hari yang sama
		if _, hasJournal := tm[tID].Matrix[day]; !hasJournal {
			switch ta.Status {
			case "SAKIT":
				tm[tID].Matrix[day] = "S"
			case "IZIN":
				tm[tID].Matrix[day] = "I"
			case "HADIR_MANUAL":
				tm[tID].Matrix[day] = "T"
				tm[tID].TotalHadir++
			}
		}
	}

	// 3. Konversi map ke slice dan urutkan berdasarkan Nama Guru (A-Z)
	var recaps []*teacherRecap
	for _, v := range tm {
		recaps = append(recaps, v)
	}
	sort.Slice(recaps, func(i, j int) bool {
		return recaps[i].TeacherName < recaps[j].TeacherName
	})

	return recaps
}

// =======================================================
// 1. EXCEL: REKAPITULASI JURNAL
// =======================================================
func (e *journalExporter) GenerateJournalRecapExcel(monthStr string, journals []domain.Journal, holidays []domain.Holiday, teacherAttendances []domain.TeacherAttendance) (*bytes.Buffer, error) {
	f := excelize.NewFile()
	sheet := "Rekap Bulanan"
	f.SetSheetName("Sheet1", sheet)
	styles := excel_helper.InitStandardStyles(f)

	t, _ := time.Parse("2006-01", monthStr)
	year, month := t.Year(), t.Month()
	daysInMonth := time.Date(year, month+1, 0, 0, 0, 0, 0, time.UTC).Day()

	// Header Laporan
	f.SetCellValue(sheet, "A1", "REKAPITULASI JURNAL MENGAJAR GURU")
	f.SetCellValue(sheet, "A2", "Bulan: "+getIndonesianMonth(monthStr))

	// Header Tabel
	f.SetCellValue(sheet, "A4", "NO")
	f.SetCellValue(sheet, "B4", "NAMA GURU")

	colIdx := 3
	for d := 1; d <= daysInMonth; d++ {
		cell, _ := excelize.CoordinatesToCellName(colIdx, 4)
		f.SetCellValue(sheet, cell, d)
		f.SetColWidth(sheet, strings.TrimRight(cell, "4"), strings.TrimRight(cell, "4"), 4)
		colIdx++
	}
	totalCol, _ := excelize.CoordinatesToCellName(colIdx, 4)
	f.SetCellValue(sheet, totalCol, "TOTAL")

	f.SetColWidth(sheet, "A", "A", 5)
	f.SetColWidth(sheet, "B", "B", 35)
	f.SetColWidth(sheet, strings.TrimRight(totalCol, "4"), strings.TrimRight(totalCol, "4"), 10)

	// Terapkan style header
	for c := 1; c <= colIdx; c++ {
		cell, _ := excelize.CoordinatesToCellName(c, 4)
		f.SetCellStyle(sheet, cell, cell, styles.Header)
	}

	recaps := buildRecapMatrix(journals, teacherAttendances)

	// Pemrosesan Baris Data
	row := 5
	for i, recap := range recaps {
		f.SetCellValue(sheet, fmt.Sprintf("A%d", row), i+1)
		f.SetCellValue(sheet, fmt.Sprintf("B%d", row), recap.TeacherName)

		cIdx := 3
		for d := 1; d <= daysInMonth; d++ {
			cell, _ := excelize.CoordinatesToCellName(cIdx, row)
			val := recap.Matrix[d]
			if val != "" {
				f.SetCellValue(sheet, cell, val)
			}
			f.SetCellStyle(sheet, cell, cell, styles.DataCenter)
			cIdx++
		}

		totCell, _ := excelize.CoordinatesToCellName(cIdx, row)
		f.SetCellValue(sheet, totCell, recap.TotalHadir)

		f.SetCellStyle(sheet, fmt.Sprintf("A%d", row), fmt.Sprintf("A%d", row), styles.DataCenter)
		f.SetCellStyle(sheet, fmt.Sprintf("B%d", row), fmt.Sprintf("B%d", row), styles.DataLeft)
		f.SetCellStyle(sheet, totCell, totCell, styles.DataCenter)
		row++
	}

	return f.WriteToBuffer()
}

// =======================================================
// 2. PDF: REKAPITULASI JURNAL (Matrix 31 Hari + Kop)
// =======================================================
func (e *journalExporter) GenerateJournalRecapPDF(monthStr string, journals []domain.Journal, holidays []domain.Holiday, teacherAttendances []domain.TeacherAttendance, kopData pdf_helper.KopSuratData) (*bytes.Buffer, error) {
	pdf := pdf_helper.SetupPDF("L") // Landscape sangat penting untuk 31 kolom
	pdf.AddPage()

	qrPayload := fmt.Sprintf("https://ykpbabakanciwaringin.id/verify-document?type=JOURNAL&month=%s", monthStr)
	pdf_helper.RenderKopSurat(pdf, kopData, qrPayload, true)

	pdf.SetFont("Cambria", "B", 12)
	pdf.CellFormat(0, 6, "REKAPITULASI JURNAL MENGAJAR GURU", "", 1, "C", false, 0, "")
	pdf.SetFont("Cambria", "", 10)
	pdf.CellFormat(0, 6, "Bulan: "+getIndonesianMonth(monthStr), "", 1, "C", false, 0, "")
	pdf.Ln(4)

	t, _ := time.Parse("2006-01", monthStr)
	year, month := t.Year(), t.Month()
	daysInMonth := time.Date(year, month+1, 0, 0, 0, 0, 0, time.UTC).Day()

	// Header Tabel
	pdf.SetFont("Cambria", "B", 7)
	pdf.SetFillColor(5, 150, 105) // Emerald
	pdf.SetTextColor(255, 255, 255)

	pdf.CellFormat(8, 7, "NO", "1", 0, "C", true, 0, "")
	pdf.CellFormat(45, 7, "NAMA GURU", "1", 0, "C", true, 0, "")

	dayW := 6.0
	for d := 1; d <= daysInMonth; d++ {
		pdf.CellFormat(dayW, 7, fmt.Sprintf("%d", d), "1", 0, "C", true, 0, "")
	}
	pdf.CellFormat(12, 7, "TOTAL", "1", 1, "C", true, 0, "")

	// Body Tabel
	pdf.SetFont("Cambria", "", 7)
	recaps := buildRecapMatrix(journals, teacherAttendances)

	for i, recap := range recaps {
		pdf.SetTextColor(0, 0, 0)
		pdf.CellFormat(8, 6, fmt.Sprintf("%d", i+1), "1", 0, "C", false, 0, "")

		name := recap.TeacherName
		if len(name) > 28 {
			name = name[:25] + "..."
		}
		pdf.CellFormat(45, 6, " "+name, "1", 0, "L", false, 0, "")

		for d := 1; d <= daysInMonth; d++ {
			// Deteksi Hari Libur (Minggu atau Libur Nasional)
			currDate := time.Date(year, month, d, 0, 0, 0, 0, time.UTC)
			isHoliday := currDate.Weekday() == time.Sunday
			if !isHoliday {
				for _, h := range holidays {
					if h.Date.Day() == d {
						isHoliday = true
						break
					}
				}
			}

			val := recap.Matrix[d]
			fill := false

			// Logika Pewarnaan PDF sesuai skrip lama Anda
			if isHoliday {
				fill = true
				pdf.SetFillColor(78, 52, 46) // Coklat Tua
				pdf.SetTextColor(255, 255, 255)
			} else if val == "S" {
				fill = true
				pdf.SetFillColor(255, 230, 153) // Kuning Pucat
				pdf.SetTextColor(0, 0, 0)
			} else if val == "I" {
				fill = true
				pdf.SetFillColor(221, 235, 247) // Biru Muda
				pdf.SetTextColor(0, 0, 0)
			} else if val != "" && val != "T" {
				fill = true
				pdf.SetFillColor(255, 242, 204) // Kuning Keemasan (Ada Jurnal)
				pdf.SetTextColor(0, 0, 0)
			} else {
				pdf.SetTextColor(0, 0, 0)
			}

			pdf.CellFormat(dayW, 6, val, "1", 0, "C", fill, 0, "")
			pdf.SetTextColor(0, 0, 0) // Reset warna teks
		}

		pdf.CellFormat(12, 6, fmt.Sprintf("%d", recap.TotalHadir), "1", 1, "C", false, 0, "")
	}

	var buf bytes.Buffer
	err := pdf.Output(&buf)
	return &buf, err
}
