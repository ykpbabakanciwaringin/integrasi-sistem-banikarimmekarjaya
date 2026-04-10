// LOKASI: internal/service/exporter/exam_berita_pdf_exporter.go
package exporter

import (
	"bytes"
	"fmt"
	"strings"
	"time"

	"github.com/jung-kurt/gofpdf"
	"ykpbabakanciwaringin.id/cbt-backend/internal/domain"
	"ykpbabakanciwaringin.id/cbt-backend/pkg/utils/pdf_helper"
)

type ExamResultPdfExporter interface {
	GenerateBeritaAcaraPDF(session domain.ExamSession, participants []domain.ExamParticipant, kopData pdf_helper.KopSuratData) (*bytes.Buffer, error)
	GenerateExamCardsPDF(session domain.ExamSession, cardData []map[string]interface{}, kopData pdf_helper.KopSuratData) (*bytes.Buffer, error)
}

type examResultPdfExporter struct{}

func NewExamResultPdfExporter() ExamResultPdfExporter {
	return &examResultPdfExporter{}
}

// Helper untuk format tanggal Indonesia
func getIndoDate(t time.Time) string {
	months := []string{"", "Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"}
	days := []string{"Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"}
	return fmt.Sprintf("%s, %02d %s %d", days[t.Weekday()], t.Day(), months[t.Month()], t.Year())
}

// =======================================================
// 1. GENERATE BERITA ACARA PDF (FORMAT DUA HALAMAN)
// =======================================================
func (e *examResultPdfExporter) GenerateBeritaAcaraPDF(session domain.ExamSession, participants []domain.ExamParticipant, kopData pdf_helper.KopSuratData) (*bytes.Buffer, error) {

	// Klasifikasi kehadiran
	var hadir []domain.ExamParticipant
	var nomorTidakHadir []string
	for _, p := range participants {
		if p.Status == "WORKING" || p.Status == "FINISHED" || p.Status == "BLOCKED" || p.Status == "ONGOING" {
			hadir = append(hadir, p)
		} else {
			nomorTidakHadir = append(nomorTidakHadir, p.ExamNumber)
		}
	}

	txtTidakHadir := "-"
	if len(nomorTidakHadir) > 0 {
		txtTidakHadir = strings.Join(nomorTidakHadir, ", ")
	}

	// [PERBAIKAN] Menghapus pemanggilan .Profile karena Teacher sudah bertipe Profile
	pengawas1 := "_______________________"
	if len(session.Supervisors) > 0 && session.Supervisors[0].Teacher != nil {
		pengawas1 = session.Supervisors[0].Teacher.FullName
	}

	proktor1 := "_______________________"
	if len(session.Proctors) > 0 && session.Proctors[0].Teacher != nil {
		proktor1 = session.Proctors[0].Teacher.FullName
	}

	pdf := pdf_helper.SetupPDF("P")
	qrPayload := fmt.Sprintf("https://ykpbabakanciwaringin.id/verify?type=BA&id=%s", session.ID.String())

	// --- HALAMAN 1: BERITA ACARA ---
	pdf.AddPage()
	pdf_helper.RenderKopSurat(pdf, kopData, qrPayload, true)

	pdf.SetFont("Times", "B", 14)
	pdf.CellFormat(0, 7, "BERITA ACARA PELAKSANAAN UJIAN", "", 1, "C", false, 0, "")
	pdf.Ln(6)

	pdf.SetFont("Times", "", 11)
	pdf.MultiCell(0, 6, fmt.Sprintf("Pada hari ini, %s, telah diselenggarakan Ujian / Asesmen Berbasis Komputer dengan rincian sebagai berikut:", getIndoDate(session.StartTime)), "", "J", false)
	pdf.Ln(3)

	eventName := "KEGIATAN UJIAN"
	if session.ExamEvent != nil {
		eventName = session.ExamEvent.Title
	}

	pdf.CellFormat(40, 6, "Nama Kegiatan", "", 0, "L", false, 0, "")
	pdf.CellFormat(0, 6, ": "+strings.ToUpper(eventName), "", 1, "L", false, 0, "")
	pdf.CellFormat(40, 6, "Sesi / Ruang", "", 0, "L", false, 0, "")
	pdf.CellFormat(0, 6, ": "+session.Title, "", 1, "L", false, 0, "")
	pdf.CellFormat(40, 6, "Mata Pelajaran", "", 0, "L", false, 0, "")
	pdf.CellFormat(0, 6, ": "+session.SubjectList, "", 1, "L", false, 0, "")
	pdf.CellFormat(40, 6, "Waktu Ujian", "", 0, "L", false, 0, "")
	pdf.CellFormat(0, 6, fmt.Sprintf(": Pukul %s s.d %s WIB", session.StartTime.Format("15:04"), session.EndTime.Format("15:04")), "", 1, "L", false, 0, "")
	pdf.Ln(5)

	pdf.CellFormat(0, 6, "Rincian kehadiran peserta:", "", 1, "L", false, 0, "")
	pdf.CellFormat(40, 6, "Jumlah Seharusnya", "", 0, "L", false, 0, "")
	pdf.CellFormat(0, 6, fmt.Sprintf(": %d Orang", len(participants)), "", 1, "L", false, 0, "")
	pdf.CellFormat(40, 6, "Jumlah Hadir", "", 0, "L", false, 0, "")
	pdf.CellFormat(0, 6, fmt.Sprintf(": %d Orang", len(hadir)), "", 1, "L", false, 0, "")
	pdf.CellFormat(40, 6, "Jumlah Tidak Hadir", "", 0, "L", false, 0, "")
	pdf.CellFormat(0, 6, fmt.Sprintf(": %d Orang", len(participants)-len(hadir)), "", 1, "L", false, 0, "")
	pdf.Ln(2)

	pdf.SetFont("Times", "B", 10)
	pdf.CellFormat(0, 6, "Nomor Peserta Tidak Hadir :", "", 1, "L", false, 0, "")
	pdf.SetFont("Times", "", 10)
	pdf.MultiCell(0, 6, txtTidakHadir, "1", "L", false)
	pdf.Ln(5)

	pdf.SetFont("Times", "B", 10)
	pdf.CellFormat(0, 6, "Catatan selama pelaksanaan Ujian:", "", 1, "L", false, 0, "")
	pdf.MultiCell(0, 6, "\n\n\n", "1", "L", false)
	pdf.Ln(10)

	pdf.SetFont("Times", "", 11)
	pdf.CellFormat(0, 6, "Berita acara ini dibuat dengan sesungguhnya untuk dipergunakan sebagaimana mestinya.", "", 1, "L", false, 0, "")
	pdf.Ln(15)

	pdf.CellFormat(90, 6, "Mengetahui / Proktor,", "", 0, "C", false, 0, "")
	pdf.CellFormat(90, 6, "Pengawas Ruang,", "", 1, "C", false, 0, "")
	pdf.Ln(20)
	pdf.SetFont("Times", "B", 11)
	pdf.CellFormat(90, 6, proktor1, "", 0, "C", false, 0, "")
	pdf.CellFormat(90, 6, pengawas1, "", 1, "C", false, 0, "")

	// --- HALAMAN 2: DAFTAR HADIR ---
	pdf.AddPage()
	pdf_helper.RenderKopSurat(pdf, kopData, qrPayload, true)

	pdf.SetFont("Times", "B", 14)
	pdf.CellFormat(0, 7, "DAFTAR HADIR PESERTA UJIAN", "", 1, "C", false, 0, "")
	pdf.Ln(6)

	w := []float64{12, 35, 63, 30, 40}
	pdf.SetFont("Times", "B", 9)
	pdf.SetFillColor(230, 230, 230)
	headers := []string{"NO", "NOMOR PESERTA", "NAMA PESERTA", "KELAS", "TANDA TANGAN"}
	for i, h := range headers {
		pdf.CellFormat(w[i], 8, h, "1", 0, "C", true, 0, "")
	}
	pdf.Ln(8)

	pdf.SetFont("Times", "", 9)
	for i, p := range participants {
		nama := "Siswa"
		kelas := "-"
		if p.Student != nil && p.Student.Profile != nil {
			nama = p.Student.Profile.FullName
			if p.Student.Profile.Class != nil {
				kelas = p.Student.Profile.Class.Name
			}
		}

		if len(nama) > 35 {
			nama = nama[:32] + "..."
		}

		h := 10.0
		pdf.CellFormat(w[0], h, fmt.Sprintf("%d", i+1), "1", 0, "C", false, 0, "")
		pdf.CellFormat(w[1], h, p.ExamNumber, "1", 0, "C", false, 0, "")
		pdf.CellFormat(w[2], h, " "+nama, "1", 0, "L", false, 0, "")
		pdf.CellFormat(w[3], h, kelas, "1", 0, "C", false, 0, "")

		ttd := fmt.Sprintf("%d. ......", i+1)
		if i%2 != 0 {
			ttd = fmt.Sprintf("        %d. ......", i+1)
		}
		pdf.CellFormat(w[4], h, ttd, "1", 0, "L", false, 0, "")
		pdf.Ln(h)
	}

	var buf bytes.Buffer
	err := pdf.Output(&buf)
	if err != nil {
		return nil, err
	}
	return &buf, nil
}

// =======================================================
// 2. GENERATE KARTU UJIAN (GRID 2x5)
// =======================================================
func (e *examResultPdfExporter) GenerateExamCardsPDF(session domain.ExamSession, cardData []map[string]interface{}, kopData pdf_helper.KopSuratData) (*bytes.Buffer, error) {
	pdf := gofpdf.New("P", "mm", "A4", "")
	pdf.SetMargins(10, 10, 10)

	cardW, cardH := 92.0, 56.0
	margin := 5.0

	for i, d := range cardData {
		if i%10 == 0 {
			pdf.AddPage()
		}

		col := float64(i % 2)
		row := float64((i % 10) / 2)
		x := 10.0 + (col * (cardW + margin))
		y := 10.0 + (row * (cardH + margin))

		pdf.Rect(x, y, cardW, cardH, "D")

		pdf.SetFont("Cambria", "B", 8)
		pdf.SetXY(x, y+2)
		pdf.CellFormat(cardW, 4, "YAYASAN KEBAJIKAN PESANTREN", "", 1, "C", false, 0, "")
		pdf.SetXY(x, y+5)
		pdf.SetFont("Cambria", "B", 7)
		pdf.CellFormat(cardW, 4, kopData.Name, "", 1, "C", false, 0, "")

		pdf.SetLineWidth(0.3)
		pdf.Line(x+2, y+9, x+cardW-2, y+9)

		pdf.SetFont("Cambria", "B", 8)
		pdf.SetXY(x, y+10)
		pdf.CellFormat(cardW, 5, "KARTU PESERTA UJIAN (CBT)", "", 1, "C", false, 0, "")

		pdf.SetFont("Cambria", "", 7)
		fields := [][]string{
			{"Nama", ": " + fmt.Sprintf("%v", d["student_name"])},
			{"No. Peserta", ": " + fmt.Sprintf("%v", d["exam_number"])},
			{"Username", ": " + fmt.Sprintf("%v", d["student_username"])},
			{"Password", ": " + fmt.Sprintf("%v", d["student_password"])},
			{"Sesi / Mapel", ": " + session.Title},
		}

		curY := y + 16
		for _, f := range fields {
			pdf.SetXY(x+5, curY)
			pdf.CellFormat(20, 4, f[0], "", 0, "L", false, 0, "")
			pdf.CellFormat(0, 4, f[1], "", 1, "L", false, 0, "")
			curY += 4.5
		}

		pdf.SetFont("Cambria", "I", 6)
		pdf.SetXY(x, y+cardH-6)
		pdf.CellFormat(cardW, 4, "* Simpan kartu ini sebagai bukti absensi ujian", "", 0, "C", false, 0, "")
	}

	var buf bytes.Buffer
	err := pdf.Output(&buf)
	if err != nil {
		return nil, err
	}
	return &buf, nil
}
