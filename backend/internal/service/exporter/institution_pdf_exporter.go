// LOKASI: internal/service/exporter/institution_pdf_exporter.go
package exporter

import (
	"bytes"
	"fmt"
	"net/url"
	"time"

	"banikarimmekarjaya.id/cbt-backend/internal/domain"
	"banikarimmekarjaya.id/cbt-backend/pkg/utils/pdf_helper"
)

type InstitutionPdfExporter interface {
	GenerateInstitutionListPDF(institutions []domain.Institution, kopData pdf_helper.KopSuratData) (*bytes.Buffer, error)
}

type institutionPdfExporter struct{}

func NewInstitutionPdfExporter() InstitutionPdfExporter {
	return &institutionPdfExporter{}
}

func (e *institutionPdfExporter) GenerateInstitutionListPDF(institutions []domain.Institution, kopData pdf_helper.KopSuratData) (*bytes.Buffer, error) {
	// Menggunakan orientasi Landscape (L) karena datanya panjang ke samping
	pdf := pdf_helper.SetupPDF("L")
	pdf.SetMargins(10, 15, 10)
	pdf.SetAutoPageBreak(true, 10)
	pdf.AddPage()

	// Pembuatan QR Code untuk validasi dokumen
	frontendHost := "https://banikarimmekarjaya.id"
	dateStr := time.Now().Format("02-01-2006")
	qrPayload := fmt.Sprintf("%s/verify-document?type=INSTITUTION_LIST&date=%s", frontendHost, url.QueryEscape(dateStr))

	// Merender Kop Surat standar dari pdf_helper
	pdf_helper.RenderKopSurat(pdf, kopData, qrPayload, true)

	// Judul Laporan
	pdf.SetFont("Cambria", "B", 12)
	pdf.CellFormat(0, 7, "DAFTAR LEMBAGA PENDIDIKAN", "", 1, "C", false, 0, "")
	pdf.Ln(4)

	// Set Lebar Kolom (Total = 277mm untuk A4 Landscape margin 10mm)
	widths := []float64{10, 25, 75, 40, 50, 40, 37}
	headers := []string{"NO", "KODE", "NAMA LEMBAGA & YAYASAN", "JENJANG", "KOTA/KAB", "KONTAK", "PQ SYNC"}

	// Header Tabel (Warna Hijau)
	pdf.SetFont("Cambria", "B", 9)
	pdf.SetFillColor(5, 150, 105) // Hijau Emerald
	pdf.SetTextColor(255, 255, 255)
	for i, h := range headers {
		pdf.CellFormat(widths[i], 8, h, "1", 0, "C", true, 0, "")
	}
	pdf.Ln(-1)

	// Isi Tabel
	pdf.SetTextColor(0, 0, 0)
	pdf.SetFont("Cambria", "", 8)

	for i, inst := range institutions {
		// Menggabungkan Nama Lembaga dan Yayasan jika ada
		namaGabungan := inst.Name
		if inst.FoundationName != "" {
			namaGabungan += "\n" + inst.FoundationName
		}

		pqStatus := "Non-Aktif"
		if inst.IsPqIntegrationEnabled {
			pqStatus = "Aktif (SYNC)"
		}

		kota := inst.AddressCity
		if kota == "" {
			kota = "-"
		}

		kontak := inst.ContactPhone
		if kontak == "" {
			kontak = "-"
		}

		// Karena nama bisa panjang dan butuh multi-baris, kita hitung tinggi sel
		cellHeight := 7.0

		// Render Kolom
		pdf.CellFormat(widths[0], cellHeight, fmt.Sprintf("%d", i+1), "1", 0, "C", false, 0, "")
		pdf.CellFormat(widths[1], cellHeight, inst.Code, "1", 0, "C", false, 0, "")

		// X saat ini sebelum multiCell
		x := pdf.GetX()
		y := pdf.GetY()
		pdf.MultiCell(widths[2], cellHeight/2, namaGabungan, "1", "L", false)
		// Reset posisi Y agar kolom selanjutnya berada di baris yang sama
		pdf.SetXY(x+widths[2], y)

		pdf.CellFormat(widths[3], cellHeight, inst.LevelCode, "1", 0, "C", false, 0, "")
		pdf.CellFormat(widths[4], cellHeight, " "+kota, "1", 0, "L", false, 0, "")
		pdf.CellFormat(widths[5], cellHeight, " "+kontak, "1", 0, "L", false, 0, "")
		pdf.CellFormat(widths[6], cellHeight, pqStatus, "1", 0, "C", false, 0, "")
		pdf.Ln(-1)
	}

	buf := new(bytes.Buffer)
	err := pdf.Output(buf)
	if err != nil {
		return nil, err
	}

	return buf, nil
}
