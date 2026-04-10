// LOKASI: internal/service/exporter/class_pdf_exporter.go
package exporter

import (
	"bytes"
	"fmt"
	"time"

	"ykpbabakanciwaringin.id/cbt-backend/internal/domain"
	"ykpbabakanciwaringin.id/cbt-backend/pkg/utils/pdf_helper"
)

type ClassPdfExporter interface {
	GenerateClassListPDF(classes []domain.Class, kop pdf_helper.KopSuratData) (*bytes.Buffer, error)
}

type classPdfExporter struct{}

func NewClassPdfExporter() ClassPdfExporter {
	return &classPdfExporter{}
}

func (e *classPdfExporter) GenerateClassListPDF(classes []domain.Class, kop pdf_helper.KopSuratData) (*bytes.Buffer, error) {
	// 1. Inisialisasi PDF (Portrait, A4)
	pdf := pdf_helper.SetupPDF("P")
	pdf.AddPage()

	// 2. Render Kop Surat (Dinamis)
	// PERBAIKAN: Menambahkan argumen "" (qrContent) dan false (showQR) agar sesuai dengan pdf_helper.go
	pdf_helper.RenderKopSurat(pdf, kop, "", false)

	// 3. Judul Laporan
	pdf.SetFont("Cambria", "B", 12)
	pdf.Ln(2)
	pdf.CellFormat(0, 7, "LAPORAN DAFTAR KELAS", "", 1, "C", false, 0, "")
	pdf.SetFont("Cambria", "", 10)
	pdf.CellFormat(0, 5, fmt.Sprintf("Dicetak pada: %s", domain.FormatDateIndo(time.Now())), "", 1, "C", false, 0, "")
	pdf.Ln(5)

	// 4. Tabel Header
	// Total Lebar A4 efektif = 190mm
	// Distribusi: No(10), Nama Kelas(60), Tingkat(30), Jurusan(40), Wali Kelas(50)
	pdf.SetFillColor(240, 240, 240) // Abu-abu muda untuk header
	pdf.SetFont("Cambria", "B", 10)

	pdf.CellFormat(10, 8, "NO", "1", 0, "C", true, 0, "")
	pdf.CellFormat(60, 8, "NAMA KELAS", "1", 0, "C", true, 0, "")
	pdf.CellFormat(30, 8, "TINGKAT", "1", 0, "C", true, 0, "")
	pdf.CellFormat(40, 8, "JURUSAN", "1", 0, "C", true, 0, "")
	pdf.CellFormat(50, 8, "WALI KELAS", "1", 1, "C", true, 0, "")

	// 5. Tabel Body
	pdf.SetFont("Cambria", "", 10)
	if len(classes) == 0 {
		pdf.CellFormat(190, 10, "Data kelas tidak ditemukan", "1", 1, "C", false, 0, "")
	}

	for i, class := range classes {
		teacherName := "-"
		if class.Teacher != nil {
			teacherName = class.Teacher.FullName
		}

		// Zebra Striping untuk keterbacaan (baris ganjil diberi warna tipis)
		fill := false
		if i%2 == 1 {
			pdf.SetFillColor(252, 252, 252)
			fill = true
		}

		pdf.CellFormat(10, 7, fmt.Sprintf("%d", i+1), "1", 0, "C", fill, 0, "")
		pdf.CellFormat(60, 7, "  "+class.Name, "1", 0, "L", fill, 0, "")
		pdf.CellFormat(30, 7, class.Level, "1", 0, "C", fill, 0, "")
		pdf.CellFormat(40, 7, class.Major, "1", 0, "C", fill, 0, "")
		pdf.CellFormat(50, 7, "  "+teacherName, "1", 1, "L", fill, 0, "")
	}

	// 6. Footer Signature (Kanan Bawah)
	pdf.Ln(10)
	pdf.SetFont("Cambria", "", 10)

	// Tentukan posisi X untuk kolom tanda tangan (sekitar 130mm dari kiri)
	footerX := 130.0
	pdf.SetX(footerX)
	pdf.CellFormat(60, 5, "Cirebon, "+domain.FormatDateIndo(time.Now()), "", 1, "L", false, 0, "")
	pdf.SetX(footerX)
	pdf.CellFormat(60, 5, "Mengetahui,", "", 1, "L", false, 0, "")
	pdf.Ln(15)

	pdf.SetX(footerX)
	pdf.SetFont("Cambria", "B", 10)
	pdf.CellFormat(60, 5, "Kepala Lembaga", "", 1, "L", false, 0, "")

	// 7. Output ke Buffer
	var buf bytes.Buffer
	err := pdf.Output(&buf)
	if err != nil {
		return nil, err
	}

	return &buf, nil
}
