// LOKASI: internal/service/exporter/exam_result_exporter.go
package exporter

import (
	"bytes"
	"fmt"
	"strings"
	"time"

	"github.com/xuri/excelize/v2"
	"banikarimmekarjaya.id/cbt-backend/internal/domain"
	"banikarimmekarjaya.id/cbt-backend/pkg/utils/excel_helper"
	"banikarimmekarjaya.id/cbt-backend/pkg/utils/pdf_helper"
)

type ExamResultExporter interface {
	GenerateCBTResultExcel(session domain.ExamSession, results []domain.CBTResultDetail) (*bytes.Buffer, error)
	GenerateCBTResultPDF(session domain.ExamSession, results []domain.CBTResultDetail, kopData pdf_helper.KopSuratData) (*bytes.Buffer, error)
}

type examResultExporter struct{}

func NewExamResultExporter() ExamResultExporter {
	return &examResultExporter{}
}

// =======================================================
// 1. REKAP NILAI EXCEL (MATRIKS DINAMIS MULTI-MAPEL)
// =======================================================
func (e *examResultExporter) GenerateCBTResultExcel(session domain.ExamSession, results []domain.CBTResultDetail) (*bytes.Buffer, error) {
	f := excelize.NewFile()
	sheet := "Rekap Nilai CBT"
	f.SetSheetName("Sheet1", sheet)

	styles := excel_helper.InitStandardStyles(f)

	// A. Header Laporan & Informasi Kegiatan
	f.SetCellValue(sheet, "A1", "REKAPITULASI HASIL UJIAN (MATRIKS)")
	f.MergeCell(sheet, "A1", "H1")
	f.SetCellStyle(sheet, "A1", "A1", styles.Header)

	eventName := "KEGIATAN UJIAN"
	if session.ExamEvent != nil {
		eventName = session.ExamEvent.Title
	}

	f.SetCellValue(sheet, "A3", "Kegiatan")
	f.SetCellValue(sheet, "C3", ": "+strings.ToUpper(eventName))
	f.SetCellValue(sheet, "A4", "Sesi Ujian")
	f.SetCellValue(sheet, "C4", ": "+session.Title)
	f.SetCellValue(sheet, "A5", "Waktu Unduh")
	f.SetCellValue(sheet, "C5", ": "+time.Now().Format("02 Jan 2006, 15:04 WIB"))

	// B. Menentukan Jumlah Maksimal Subtes untuk Header Dinamis
	maxSubtests := 0
	for _, r := range results {
		if len(r.Subtests) > maxSubtests {
			maxSubtests = len(r.Subtests)
		}
	}

	// C. Definisi Header Tabel
	// Header Dasar
	headers := []string{"NO", "NISN", "NOMOR PESERTA", "NAMA SISWA", "L/P", "KELAS"}

	// Tambahkan Kolom Mapel & Skor secara dinamis ke samping
	for i := 1; i <= maxSubtests; i++ {
		headers = append(headers, fmt.Sprintf("MAPEL %d", i))
		headers = append(headers, fmt.Sprintf("SKOR %d", i))
	}

	// Header Penutup
	headers = append(headers, "RATA-RATA", "STATUS")

	for i, h := range headers {
		cell, _ := excelize.CoordinatesToCellName(i+1, 7)
		f.SetCellValue(sheet, cell, h)
		f.SetCellStyle(sheet, cell, cell, styles.Header)
	}

	// D. Pengisian Data Baris
	row := 8
	for i, r := range results {
		f.SetCellValue(sheet, fmt.Sprintf("A%d", row), i+1)
		f.SetCellValue(sheet, fmt.Sprintf("B%d", row), r.NISN)
		f.SetCellValue(sheet, fmt.Sprintf("C%d", row), r.ExamNumber)
		f.SetCellValue(sheet, fmt.Sprintf("D%d", row), r.StudentName)
		f.SetCellValue(sheet, fmt.Sprintf("E%d", row), r.Gender)
		f.SetCellValue(sheet, fmt.Sprintf("F%d", row), r.ClassName)

		// Isi data subtes (mapel dan skor masing-masing)
		colIdx := 7
		for _, st := range r.Subtests {
			cMapel, _ := excelize.CoordinatesToCellName(colIdx, row)
			f.SetCellValue(sheet, cMapel, st.SubjectName)

			cSkor, _ := excelize.CoordinatesToCellName(colIdx+1, row)
			f.SetCellValue(sheet, cSkor, st.Score)

			colIdx += 2
		}

		// Geser ke kolom rata-rata dan status berdasarkan jumlah maxSubtests
		avgColIdx := 7 + (maxSubtests * 2)
		cAvg, _ := excelize.CoordinatesToCellName(avgColIdx, row)
		f.SetCellValue(sheet, cAvg, r.FinalScore)

		cStatus, _ := excelize.CoordinatesToCellName(avgColIdx+1, row)
		f.SetCellValue(sheet, cStatus, r.Status)

		// Styling Baris
		lastColName, _ := excelize.CoordinatesToCellName(len(headers), row)
		f.SetCellStyle(sheet, fmt.Sprintf("A%d", row), fmt.Sprintf("%s%d", lastColName, row), styles.DataCenter)
		f.SetCellStyle(sheet, fmt.Sprintf("D%d", row), fmt.Sprintf("D%d", row), styles.DataLeft)

		row++
	}

	// Atur Lebar Kolom Utama
	f.SetColWidth(sheet, "A", "A", 5)
	f.SetColWidth(sheet, "B", "C", 18)
	f.SetColWidth(sheet, "D", "D", 35)
	f.SetColWidth(sheet, "F", "F", 15)

	return f.WriteToBuffer()
}

// =======================================================
// 2. REKAP NILAI PDF (LANDSCAPE MATRIKS)
// =======================================================
func (e *examResultExporter) GenerateCBTResultPDF(session domain.ExamSession, results []domain.CBTResultDetail, kopData pdf_helper.KopSuratData) (*bytes.Buffer, error) {
	pdf := pdf_helper.SetupPDF("L") // Landscape
	pdf.SetMargins(10, 15, 10)
	pdf.AddPage()

	qrPayload := fmt.Sprintf("https://banikarimmekarjaya.id/verify?session_id=%s", session.ID.String())
	pdf_helper.RenderKopSurat(pdf, kopData, qrPayload, true)

	// Judul Laporan & Nama Kegiatan
	eventName := "KEGIATAN UJIAN"
	if session.ExamEvent != nil {
		eventName = session.ExamEvent.Title
	}

	pdf.SetFont("Cambria", "B", 12)
	pdf.CellFormat(0, 7, "REKAPITULASI HASIL NILAI: "+strings.ToUpper(eventName), "", 1, "C", false, 0, "")
	pdf.SetFont("Cambria", "", 9)
	pdf.CellFormat(0, 5, "Sesi Ujian: "+session.Title+" | Waktu Unduh: "+time.Now().Format("02-01-2006 15:04"), "", 1, "C", false, 0, "")
	pdf.Ln(5)

	// Header Tabel Matriks
	// Lebar kolom: No(8), NoPeserta(25), Nama(50), Kelas(20), Rincian Nilai(125), Rata(25), Status(25)
	w := []float64{8, 25, 50, 20, 125, 25, 25}
	headers := []string{"NO", "NO PESERTA", "NAMA SISWA", "KELAS", "RINCIAN NILAI (MAPEL: SKOR)", "RATA-RATA", "STATUS"}

	pdf.SetFont("Cambria", "B", 8)
	pdf.SetFillColor(5, 150, 105) // Emerald Green
	pdf.SetTextColor(255, 255, 255)

	for i, h := range headers {
		pdf.CellFormat(w[i], 8, h, "1", 0, "C", true, 0, "")
	}
	pdf.Ln(8)

	pdf.SetFont("Cambria", "", 8)
	pdf.SetTextColor(0, 0, 0)

	for i, r := range results {
		// Merakit Rincian Nilai menjadi satu string
		var details []string
		for _, st := range r.Subtests {
			details = append(details, fmt.Sprintf("%s: %.1f", st.SubjectName, st.Score))
		}
		rincianStr := strings.Join(details, " | ")

		// Hitung tinggi baris dinamis jika rincian sangat panjang
		cellHeight := 7.0
		lines := pdf.SplitText(rincianStr, w[4])
		if len(lines) > 1 {
			cellHeight = float64(len(lines)) * 4.5
		}

		// Render Baris Data
		pdf.CellFormat(w[0], cellHeight, fmt.Sprintf("%d", i+1), "1", 0, "C", false, 0, "")
		pdf.CellFormat(w[1], cellHeight, r.ExamNumber, "1", 0, "C", false, 0, "")
		pdf.CellFormat(w[2], cellHeight, " "+r.StudentName, "1", 0, "L", false, 0, "")
		pdf.CellFormat(w[3], cellHeight, r.ClassName, "1", 0, "C", false, 0, "")

		// Kolom Rincian (Multi-line)
		curX, curY := pdf.GetX(), pdf.GetY()
		pdf.MultiCell(w[4], cellHeight/float64(len(lines)), rincianStr, "1", "L", false)
		pdf.SetXY(curX+w[4], curY)

		pdf.CellFormat(w[5], cellHeight, fmt.Sprintf("%.2f", r.FinalScore), "1", 0, "C", false, 0, "")
		pdf.CellFormat(w[6], cellHeight, r.Status, "1", 1, "C", false, 0, "")
	}

	// Footer Petugas (Opsional - Bisa ditambahkan jika diperlukan)

	var buf bytes.Buffer
	err := pdf.Output(&buf)
	if err != nil {
		return nil, err
	}
	return &buf, nil
}
