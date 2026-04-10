// LOKASI: pkg/utils/pdf_helper/pdf_helper.go
package pdf_helper

import (
	"os"
	"path/filepath"
	"strings"

	"github.com/jung-kurt/gofpdf"
	"github.com/skip2/go-qrcode"
)

// KopSuratData adalah struktur data netral
type KopSuratData struct {
	Name           string
	FoundationName string
	Header1        string
	Header2        string
	AddressDetail  string
	AddressCity    string
	ContactPhone   string
	ContactEmail   string
	Website        string
	LogoUrl        string
}

// SetupPDF menginisialisasi PDF dengan font Cambria (fallback ke Arial/Times)
func SetupPDF(orientation string) *gofpdf.Fpdf {
	pdf := gofpdf.New(orientation, "mm", "A4", "")

	// Registrasi Font Cambria
	fontPath := filepath.Join("static", "fonts")
	if _, err := os.Stat(filepath.Join(fontPath, "cambria.json")); err == nil {
		pdf.AddFont("Cambria", "", filepath.Join(fontPath, "cambria.json"))
		pdf.AddFont("Cambria", "B", filepath.Join(fontPath, "cambriab.json"))
		// FIX 1: Pemanggilan cambriai.json (Italic) dihapus agar tidak crash (Error 500)
	}

	return pdf
}

// RenderKopSurat menggambar Kop Surat Resmi dengan batas margin yang aman.
func RenderKopSurat(pdf *gofpdf.Fpdf, data KopSuratData, qrContent string, showQR bool) {
	pageW, _ := pdf.GetPageSize()
	leftMargin, _, rightMargin, _ := pdf.GetMargins()

	fontFamily := "Arial"
	if !pdf.Err() {
		fontFamily = "Cambria"
	}

	startY := pdf.GetY()

	// ==========================================
	// 1. GAMBAR LOGO (Kiri)
	// ==========================================
	logoWidth := 30.0
	if data.LogoUrl != "" {
		// FIX 2: Hapus query parameter cache-buster (?t=12345) agar OS bisa menemukan file-nya
		rawUrl := data.LogoUrl
		if idx := strings.Index(rawUrl, "?"); idx != -1 {
			rawUrl = rawUrl[:idx]
		}

		cleanLogoPath := filepath.Join("static", strings.TrimPrefix(rawUrl, "/"))
		if _, err := os.Stat(cleanLogoPath); err == nil {
			pdf.ImageOptions(cleanLogoPath, leftMargin, startY, logoWidth, 0, false, gofpdf.ImageOptions{}, 0, "")
		}
	}

	// ==========================================
	// 2. GAMBAR QR CODE (Kanan - Opsional)
	// ==========================================
	qrWidth := 30.0
	if showQR && qrContent != "" {
		qrPath := filepath.Join(os.TempDir(), "temp_qr_"+qrContent+".png")
		err := qrcode.WriteFile(qrContent, qrcode.Medium, 256, qrPath)
		if err == nil {
			pdf.ImageOptions(qrPath, pageW-rightMargin-qrWidth, startY, qrWidth, 0, false, gofpdf.ImageOptions{}, 0, "")
			defer os.Remove(qrPath)
		}
	}

	// ==========================================
	// 3. TEKS KOP SURAT (Matematika Simetris)
	// ==========================================
	textMargin := 36.0
	textZoneW := pageW - (textMargin * 2)

	pdf.SetLeftMargin(textMargin)
	pdf.SetRightMargin(textMargin)

	// BARIS 1: NAMA YAYASAN DINAMIS
	if data.FoundationName != "" {
		pdf.SetFont("Cambria", "B", 14)
		pdf.SetTextColor(4, 52, 37) // Warna Hijau Gelap
		pdf.CellFormat(textZoneW, 6, strings.ToUpper(data.FoundationName), "", 1, "C", false, 0, "")
	}

	// BARIS 2: NAMA LEMBAGA
	pdf.SetFont("Cambria", "B", 18)
	pdf.SetTextColor(0, 0, 0) // Warna Hitam
	pdf.CellFormat(textZoneW, 7, strings.ToUpper(data.Name), "", 1, "C", false, 0, "")

	// BARIS 3: HEADER 1 & 2
	headerCombined := ""
	if data.Header1 != "" {
		headerCombined += strings.ToUpper(data.Header1)
	}
	if data.Header2 != "" {
		if headerCombined != "" {
			headerCombined += " - "
		}
		headerCombined += strings.ToUpper(data.Header2)
	}
	if headerCombined != "" {
		pdf.SetFont(fontFamily, "B", 10)
		pdf.CellFormat(textZoneW, 5, headerCombined, "", 1, "C", false, 0, "")
	}

	// BARIS 4: ALAMAT & TELEPON

	pdf.SetFont(fontFamily, "", 9)
	pdf.CellFormat(textZoneW, 5, data.AddressDetail, "", 1, "C", false, 0, "")

	pdf.SetFont(fontFamily, "", 9)
	addressLine := data.AddressCity

	if data.ContactPhone != "" {
		addressLine += " | Telp/WA: " + data.ContactPhone
	}
	pdf.MultiCell(textZoneW, 4.5, addressLine, "", "C", false)

	// BARIS 5: EMAIL & WEBSITE
	contactLine := ""
	if data.ContactEmail != "" {
		contactLine += "Email: " + data.ContactEmail
	}
	if data.Website != "" {
		if contactLine != "" {
			contactLine += " \x95 "
		}
		contactLine += "Website: " + data.Website
	}
	if contactLine != "" {
		// FIX 3: Kembalikan ke Normal Font ("", bukan "I") agar tidak mencari cambriai.json
		pdf.SetFont(fontFamily, "", 9)
		pdf.CellFormat(textZoneW, 4.5, contactLine, "", 1, "C", false, 0, "")
	}

	pdf.SetLeftMargin(leftMargin)
	pdf.SetRightMargin(rightMargin)

	// ==========================================
	// 4. GARIS PEMBATAS RESMI (DOUBLE-LINE)
	// ==========================================
	currentY := pdf.GetY() + 3.5

	pdf.SetLineWidth(0.8)
	pdf.Line(leftMargin, currentY, pageW-rightMargin, currentY)

	pdf.SetLineWidth(0.3)
	pdf.Line(leftMargin, currentY+1.2, pageW-rightMargin, currentY+1.2)

	pdf.SetLineWidth(0.2)
	pdf.SetY(currentY + 6)
}
