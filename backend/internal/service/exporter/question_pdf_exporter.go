package exporter

import (
	"bytes"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"github.com/jung-kurt/gofpdf"
	"github.com/skip2/go-qrcode"
	"banikarimmekarjaya.id/cbt-backend/internal/domain"
	"banikarimmekarjaya.id/cbt-backend/pkg/utils/pdf_helper"
)

type QuestionPdfExporter interface {
	GenerateQuestionPDF(packet domain.QuestionBank, kopData pdf_helper.KopSuratData, activeYear string, assignedTeacher string) (*bytes.Buffer, error)
}

type questionPdfExporter struct{}

func NewQuestionPdfExporter() QuestionPdfExporter {
	return &questionPdfExporter{}
}

func (e *questionPdfExporter) GenerateQuestionPDF(packet domain.QuestionBank, kopData pdf_helper.KopSuratData, activeYear string, assignedTeacher string) (*bytes.Buffer, error) {
	pdf := pdf_helper.SetupPDF("P")

	// 1. Persiapan Data Awal (Agar bisa digunakan di Footer closure)
	fontFamily := "Arial"
	if _, err := os.Stat(filepath.Join("static", "fonts", "cambria.json")); err == nil {
		fontFamily = "Cambria"
	}

	subjName := "-"
	if packet.Subject != nil {
		subjName = packet.Subject.Name
	}

	// 2. Registrasi QR Code
	qrContent := fmt.Sprintf("OFFLINE-EXAM|ID:%s|INST:%s", packet.ID.String(), kopData.Name)
	qrBytes, err := qrcode.Encode(qrContent, qrcode.Medium, 256)
	imgRegistered := false
	if err == nil {
		imgOpt := gofpdf.ImageOptions{ImageType: "PNG", ReadDpi: true}
		pdf.RegisterImageOptionsReader("qrcode_footer", imgOpt, bytes.NewReader(qrBytes))
		imgRegistered = true
	}

	// 3. SET FOOTER OTOMATIS
	pdf.SetFooterFunc(func() {
		pageW, pageH := pdf.GetPageSize()

		pdf.SetY(-15)
		pdf.SetDrawColor(200, 200, 200)
		pdf.Line(10, pageH-15, pageW-10, pageH-15)
		pdf.SetDrawColor(0, 0, 0)

		// Baris 1 Footer: Status Dokumen
		pdf.SetFont(fontFamily, "B", 8)
		pdf.SetXY(10, pageH-12)
		pdf.CellFormat(0, 4, "DOKUMEN NEGARA - RAHASIA", "", 0, "L", false, 0, "")

		// Baris 2 Footer: Info Mata Pelajaran (Y diturunkan ke -9 agar tidak tumpang tindih)
		pdf.SetFont(fontFamily, "", 6)
		pdf.SetXY(10, pageH-9)
		pdf.CellFormat(0, 3, "Lembar Soal - Mata Pelajaran: "+strings.ToUpper(subjName), "", 0, "L", false, 0, "")

		// Baris 3 Footer: ID Verifikasi (Y diturunkan ke -6)
		pdf.SetXY(10, pageH-6)
		pdf.CellFormat(0, 3, "Verifikasi Digital: "+packet.ID.String(), "", 0, "L", false, 0, "")

		// QR Code di Pojok Kanan Bawah
		if imgRegistered {
			pdf.ImageOptions("qrcode_footer", pageW-20, pageH-14, 10, 10, false, gofpdf.ImageOptions{ImageType: "PNG"}, 0, "")
		}

		// Nomor Halaman di Tengah
		pdf.SetFont(fontFamily, "", 8)
		pdf.SetXY(0, pageH-10)
		pdf.CellFormat(pageW, 10, fmt.Sprintf("Halaman %d", pdf.PageNo()), "", 0, "C", false, 0, "")
	})

	pdf.AddPage()

	// 4. Render Kop Surat
	pdf_helper.RenderKopSurat(pdf, kopData, "", false)

	// 5. Header Judul
	pdf.SetFont(fontFamily, "B", 11)
	pdf.CellFormat(190, 6, "LEMBAR SOAL PENILAIAN BELAJAR PESERTA DIDIK", "", 1, "C", false, 0, "")
	pdf.CellFormat(190, 6, strings.ToUpper(kopData.Name), "", 1, "C", false, 0, "")

	yearText := "TAHUN PELAJARAN " + strings.ToUpper(activeYear)
	if activeYear == "" {
		yearText = "TAHUN PELAJARAN 2024/2025"
	}
	pdf.CellFormat(190, 6, yearText, "", 1, "C", false, 0, "")
	pdf.Ln(4)

	// 6. Identitas Siswa
	teacherName := assignedTeacher
	if teacherName == "" {
		if packet.Teacher != nil && packet.Teacher.Profile != nil {
			teacherName = packet.Teacher.Profile.FullName
		} else {
			teacherName = "-"
		}
	}

	pdf.SetFont(fontFamily, "", 9)
	pdf.CellFormat(30, 5, "Hari / Tanggal", "", 0, "L", false, 0, "")
	pdf.CellFormat(65, 5, ": ...................................................................", "", 0, "L", false, 0, "")
	pdf.CellFormat(30, 5, "Nama Siswa", "", 0, "L", false, 0, "")
	pdf.CellFormat(65, 5, ": ...................................................................", "", 1, "L", false, 0, "")

	pdf.CellFormat(30, 5, "Waktu", "", 0, "L", false, 0, "")
	pdf.CellFormat(65, 5, ": ...................................................................", "", 0, "L", false, 0, "")
	pdf.CellFormat(30, 5, "NIS", "", 0, "L", false, 0, "")
	pdf.CellFormat(65, 5, ": ...................................................................", "", 1, "L", false, 0, "")

	pdf.CellFormat(30, 5, "Mata Pelajaran", "", 0, "L", false, 0, "")
	pdf.CellFormat(65, 5, ": "+strings.ToUpper(subjName), "", 0, "L", false, 0, "")
	pdf.CellFormat(30, 5, "Kelas", "", 0, "L", false, 0, "")
	pdf.CellFormat(65, 5, ": "+strings.ToUpper(packet.GradeLevel), "", 1, "L", false, 0, "")

	pdf.CellFormat(30, 5, "Nama Guru Pengampu", "", 0, "L", false, 0, "")
	pdf.CellFormat(65, 5, ": "+teacherName, "", 1, "L", false, 0, "")

	pdf.Ln(2)
	pdf.Line(10, pdf.GetY(), 200, pdf.GetY())
	pdf.Ln(4)
	pdf.SetFont(fontFamily, "B", 9)
	pdf.CellFormat(190, 5, "Kerjakan Soal di Bawah ini Dengan Benar dan Tepat.", "", 1, "L", false, 0, "")
	pdf.Ln(4)

	// 7. Render Butir Soal
	for i, item := range packet.Items {
		if pdf.GetY() > 245 { // Dikurangi sedikit agar tidak menabrak footer
			pdf.AddPage()
		}
		pdf.SetFont(fontFamily, "B", 10)
		pdf.CellFormat(8, 5, fmt.Sprintf("%d.", i+1), "", 0, "L", false, 0, "")
		pdf.SetFont(fontFamily, "", 10)
		pdf.MultiCell(182, 5, item.Content.Question, "", "L", false)
		pdf.Ln(1)

		if item.Type == domain.QuestionTypePG {
			labels := []string{"A", "B", "C", "D", "E"}
			for _, opt := range labels {
				if val, ok := item.Content.Options[opt]; ok && val != "" {
					if pdf.GetY() > 265 {
						pdf.AddPage()
					}
					pdf.SetX(18)
					pdf.SetFont(fontFamily, "B", 10)
					pdf.CellFormat(6, 5, opt+".", "", 0, "L", false, 0, "")
					pdf.SetFont(fontFamily, "", 10)
					pdf.MultiCell(166, 5, val, "", "L", false)
				}
			}
		} else {
			pdf.Ln(2)
		}
		pdf.Ln(3)
	}

	buf := new(bytes.Buffer)
	err = pdf.Output(buf)
	return buf, err
}
