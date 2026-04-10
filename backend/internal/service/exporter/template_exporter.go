// LOKASI: internal/service/exporter/template_exporter.go
package exporter

import (
	"bytes"
	"fmt"
	"strings"

	"github.com/xuri/excelize/v2"
	"banikarimmekarjaya.id/cbt-backend/internal/domain"
	"banikarimmekarjaya.id/cbt-backend/pkg/utils/excel_helper"
)

type TemplateExporter interface {
	GenerateInstitutionTemplate() (*bytes.Buffer, error)
	GenerateClassTemplate(isSuperAdmin bool, institutions []domain.Institution, teachers []domain.User) (*bytes.Buffer, error)
	GenerateSubjectTemplate(curriculums []domain.Curriculum) (*bytes.Buffer, error)
	GenerateQuestionTemplate() (*bytes.Buffer, error)
	GenerateExamSessionTemplate(teachers []domain.User, subjects []domain.Subject, event domain.ExamEvent) (*bytes.Buffer, error)
	GenerateExamParticipantTemplate() (*bytes.Buffer, error)

	GenerateStudentTemplate(inst *domain.Institution, classes []domain.Class) (*bytes.Buffer, error)
	GenerateStudentExport(students []domain.User, inst *domain.Institution, classes []domain.Class) (*bytes.Buffer, error)

	GenerateTeacherTemplate() (*bytes.Buffer, error)
	GenerateTeacherExport(teachers []domain.User) (*bytes.Buffer, error)
}

type templateExporter struct{}

func NewTemplateExporter() TemplateExporter {
	return &templateExporter{}
}

// =========================================================================
// MASTER DATA & AKADEMIK (DAPODIK STANDARD)
// =========================================================================

func (e *templateExporter) GenerateInstitutionTemplate() (*bytes.Buffer, error) {
	f := excelize.NewFile()
	sheet := "Template Lembaga"
	f.SetSheetName("Sheet1", sheet)
	styles := excel_helper.InitStandardStyles(f)

	headers := []struct {
		Title string
		Width float64
		Style int
	}{
		{"NO", 6, styles.DataCenter},                  // A
		{"KODE LEMBAGA *", 25, styles.DataLeft},       // B
		{"NAMA LEMBAGA *", 40, styles.DataLeft},       // C
		{"NAMA YAYASAN", 40, styles.DataLeft},         // D
		{"JENJANG *", 30, styles.DropdownHeader},      // E
		{"KATEGORI *", 20, styles.DropdownHeader},     // F
		{"ALAMAT JALAN", 45, styles.DataLeft},         // G
		{"KOTA / KABUPATEN", 25, styles.DataLeft},     // H
		{"NO TELEPON", 20, styles.DataLeft},           // I
		{"EMAIL", 30, styles.DataLeft},                // J
		{"WEBSITE", 30, styles.DataLeft},              // K
		{"HEADER KOP SURAT 1", 40, styles.DataLeft},   // L
		{"HEADER KOP SURAT 2", 40, styles.DataLeft},   // M
		{"NAMA FILE LOGO", 25, styles.DataLeft},       // N
		{"HARI LIBUR *", 20, styles.DropdownHeader},   // O
		{"STATUS PQ SYNC", 20, styles.DropdownHeader}, // P
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

	// VALIDASI DROPDOWN (Sesuai indeks kolom baru)
	dvLevel := excelize.NewDataValidation(true)
	dvLevel.Sqref = "E2:E500"
	dvLevel.SetDropList([]string{"SD/MI/SEDERAJAT", "SMP/MTs/SEDERAJAT", "SMA/MA/SMK/SEDERAJAT", "PERGURUAN TINGGI"})
	f.AddDataValidation(sheet, dvLevel)

	dvCat := excelize.NewDataValidation(true)
	dvCat.Sqref = "F2:F500"
	dvCat.SetDropList([]string{"FORMAL", "PONDOK", "PROGRAM"})
	f.AddDataValidation(sheet, dvCat)

	dvDayOff := excelize.NewDataValidation(true)
	dvDayOff.Sqref = "O2:O500"
	dvDayOff.SetDropList([]string{"SENIN", "SELASA", "RABU", "KAMIS", "JUMAT", "SABTU", "AHAD"})
	f.AddDataValidation(sheet, dvDayOff)

	dvPq := excelize.NewDataValidation(true)
	dvPq.Sqref = "P2:P500"
	dvPq.SetDropList([]string{"AKTIF", "NON-AKTIF"})
	f.AddDataValidation(sheet, dvPq)

	return f.WriteToBuffer()
}

func (e *templateExporter) GenerateClassTemplate(isSuperAdmin bool, institutions []domain.Institution, teachers []domain.User) (*bytes.Buffer, error) {
	f := excelize.NewFile()
	sheet := "Template Kelas"
	f.SetSheetName("Sheet1", sheet)
	styles := excel_helper.InitStandardStyles(f)

	// STRATEGI UNIFIED SCHEMA: 6 Kolom Mutlak (A sampai F)
	headers := []struct {
		Title string
		Width float64
		Style int
	}{
		{"NO", 6, styles.DataCenter},                       // A
		{"NAMA KELAS *", 25, styles.DataLeft},              // B
		{"TINGKAT *", 20, styles.DropdownHeader},           // C
		{"JURUSAN *", 20, styles.DropdownHeader},           // D
		{"NAMA WALI KELAS", 40, styles.DropdownHeader},     // E
		{"ID LEMBAGA TARGET *", 45, styles.DropdownHeader}, // F
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

	dvLevel := excelize.NewDataValidation(true)
	dvLevel.Sqref = "C2:C500"
	dvLevel.SetDropList([]string{"VII", "VIII", "IX", "X", "XI", "XII", "SMT-1", "SMT-2", "SMT-3", "SMT-4", "SMT-5", "SMT-6", "SMT-7", "SMT-8"})
	f.AddDataValidation(sheet, dvLevel)

	dvMajor := excelize.NewDataValidation(true)
	dvMajor.Sqref = "D2:D500"
	dvMajor.SetDropList([]string{"UMUM", "MIPA", "IIS", "IBB", "IIK", "TKJ", "RPL", "OTKP", "BDP", "TBSM"})
	f.AddDataValidation(sheet, dvMajor)

	if len(teachers) > 0 {
		refSheet := "Ref_Guru"
		f.NewSheet(refSheet)
		f.SetCellValue(refSheet, "A1", "NAMA LENGKAP GURU")
		for i, t := range teachers {
			if t.Profile != nil {
				f.SetCellValue(refSheet, fmt.Sprintf("A%d", i+2), t.Profile.FullName)
			}
		}

		formula := fmt.Sprintf("'%s'!$A$2:$A$%d", refSheet, len(teachers)+1)
		dvTeacher := excelize.NewDataValidation(true)
		dvTeacher.Sqref = "E2:E500"
		dvTeacher.SetSqrefDropList(formula)
		f.AddDataValidation(sheet, dvTeacher)
		f.SetSheetVisible(refSheet, false)
	}

	if isSuperAdmin && len(institutions) > 0 {
		refSheet := "Ref_Lembaga"
		f.NewSheet(refSheet)
		f.SetCellValue(refSheet, "A1", "ID UUID")
		f.SetCellValue(refSheet, "B1", "NAMA LEMBAGA")

		for i, inst := range institutions {
			f.SetCellValue(refSheet, fmt.Sprintf("A%d", i+2), inst.ID.String())
			f.SetCellValue(refSheet, fmt.Sprintf("B%d", i+2), inst.Name)
		}

		formula := fmt.Sprintf("'%s'!$A$2:$A$%d", refSheet, len(institutions)+1)
		dvInst := excelize.NewDataValidation(true)
		dvInst.Sqref = "F2:F500"
		dvInst.SetSqrefDropList(formula)
		f.AddDataValidation(sheet, dvInst)
		f.SetSheetVisible(refSheet, false)
	} else if len(institutions) > 0 {
		f.SetCellValue(sheet, "F2", institutions[0].ID.String())
	}

	f.SetPanes(sheet, &excelize.Panes{Freeze: true, XSplit: 0, YSplit: 1, TopLeftCell: "A2", ActivePane: "bottomLeft"})

	return f.WriteToBuffer()
}

func (e *templateExporter) GenerateSubjectTemplate(curriculums []domain.Curriculum) (*bytes.Buffer, error) {
	f := excelize.NewFile()
	sheet := "Template Mapel"
	f.SetSheetName("Sheet1", sheet)
	styles := excel_helper.InitStandardStyles(f)

	headers := []struct {
		Title string
		Width float64
		Style int
	}{
		{"NO", 6, styles.DataCenter}, {"KODE_MAPEL *", 20, styles.DataLeft},
		{"NAMA_MAPEL *", 40, styles.DataLeft}, {"TIPE_MAPEL *", 30, styles.DropdownHeader},
		{"KURIKULUM", 35, styles.DropdownHeader},
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

	dvType := excelize.NewDataValidation(true)
	dvType.Sqref = "D2:D500"
	dvType.SetDropList([]string{"UMUM", "AGAMA", "MULOK"})
	f.AddDataValidation(sheet, dvType)

	if len(curriculums) > 0 {
		refSheet := "Referensi Kurikulum"
		f.NewSheet(refSheet)
		f.SetCellValue(refSheet, "A1", "NAMA KURIKULUM")
		for i, c := range curriculums {
			f.SetCellValue(refSheet, fmt.Sprintf("A%d", i+2), c.Name)
		}
		f.SetColWidth(refSheet, "A", "A", 40)

		formula := fmt.Sprintf("'%s'!$A$2:$A$%d", refSheet, len(curriculums)+1)
		dvCurr := excelize.NewDataValidation(true)
		dvCurr.Sqref = "E2:E500"
		dvCurr.SetSqrefDropList(formula)
		f.AddDataValidation(sheet, dvCurr)
		f.SetSheetVisible(refSheet, false)
	}

	return f.WriteToBuffer()
}

// =========================================================================
// UJIAN (CBT)
// =========================================================================

func (e *templateExporter) GenerateQuestionTemplate() (*bytes.Buffer, error) {
	f := excelize.NewFile()
	sheet := "Template Soal"
	f.SetSheetName("Sheet1", sheet)
	styles := excel_helper.InitStandardStyles(f)

	headers := []string{"NO", "TIPE_SOAL *", "PERTANYAAN *", "OPSI_A", "OPSI_B", "OPSI_C", "OPSI_D", "OPSI_E", "JAWABAN_BENAR *", "BOBOT *"}
	for i, h := range headers {
		cell, _ := excelize.CoordinatesToCellName(i+1, 1)
		f.SetCellValue(sheet, cell, h)
		f.SetCellStyle(sheet, cell, cell, styles.TemplateHeader)
	}

	f.SetColWidth(sheet, "B", "B", 15)
	f.SetColWidth(sheet, "C", "C", 60)
	return f.WriteToBuffer()
}

// =========================================================================================
// [ENTERPRISE MODE] GENERATE TEMPLATE JADWAL SESI (TANGGAL, WAKTU & KOLOM DINAMIS)
// =========================================================================================
func (e *templateExporter) GenerateExamSessionTemplate(teachers []domain.User, subjects []domain.Subject, event domain.ExamEvent) (*bytes.Buffer, error) {
	f := excelize.NewFile()
	sheet := "Template Sesi Ujian"
	f.SetSheetName("Sheet1", sheet)
	styles := excel_helper.InitStandardStyles(f)

	roomCount := event.RoomCount
	if roomCount <= 0 {
		roomCount = 1 // Fallback pengaman
	}
	subjectCount := event.SubjectCount
	if subjectCount <= 0 {
		subjectCount = 1 // Fallback pengaman
	}

	// -------------------------------------------------------------
	// 1. BUAT HIDDEN SHEETS UNTUK DROPDOWN
	// -------------------------------------------------------------

	refGuru := "Ref_Guru"
	f.NewSheet(refGuru)
	f.SetSheetVisible(refGuru, false)
	for i, t := range teachers {
		f.SetCellValue(refGuru, fmt.Sprintf("A%d", i+1), t.GetFullName())
	}

	refMapel := "Ref_Mapel"
	f.NewSheet(refMapel)
	f.SetSheetVisible(refMapel, false)
	for i, s := range subjects {
		f.SetCellValue(refMapel, fmt.Sprintf("A%d", i+1), s.Name)
	}

	refTanggal := "Ref_Tanggal"
	f.NewSheet(refTanggal)
	f.SetSheetVisible(refTanggal, false)
	currDate := event.StartDate
	rowDate := 1
	for !currDate.After(event.EndDate) {
		f.SetCellValue(refTanggal, fmt.Sprintf("A%d", rowDate), currDate.Format("2006-01-02"))
		currDate = currDate.AddDate(0, 0, 1)
		rowDate++
	}

	refWaktu := "Ref_Waktu"
	f.NewSheet(refWaktu)
	f.SetSheetVisible(refWaktu, false)
	rowTime := 1
	for h := 0; h < 24; h++ {
		for m := 0; m < 60; m += 15 {
			f.SetCellValue(refWaktu, fmt.Sprintf("A%d", rowTime), fmt.Sprintf("%02d:%02d", h, m))
			rowTime++
		}
	}

	// -------------------------------------------------------------
	// 2. BANGUN HEADER KOLOM SECARA DINAMIS (PENGAWAS, PROKTOR, MAPEL)
	// -------------------------------------------------------------
	headers := []string{"NO", "NAMA_SESI *", "TANGGAL (PILIH) *", "JAM_MULAI (PILIH) *", "JAM_SELESAI (PILIH) *", "DURASI_MENIT *"}

	// Inject Kolom Pengawas
	for i := 1; i <= roomCount; i++ {
		headers = append(headers, fmt.Sprintf("PENGAWAS_%d", i))
	}
	// Inject Kolom Proktor (Baru)
	for i := 1; i <= roomCount; i++ {
		headers = append(headers, fmt.Sprintf("PROKTOR_%d", i))
	}
	// Inject Kolom Mapel (Menggunakan SubjectCount)
	for i := 1; i <= subjectCount; i++ {
		headers = append(headers, fmt.Sprintf("MAPEL_%d", i))
	}
	headers = append(headers, "KETERANGAN") // Penutup

	// Tulis Header ke Excel
	for i, h := range headers {
		colIdx := i + 1
		cell, _ := excelize.CoordinatesToCellName(colIdx, 1)
		f.SetCellValue(sheet, cell, h)

		if strings.HasPrefix(h, "PENGAWAS") || strings.HasPrefix(h, "PROKTOR") {
			f.SetCellStyle(sheet, cell, cell, styles.DropdownHeader)
		} else if strings.HasPrefix(h, "MAPEL") {
			f.SetCellStyle(sheet, cell, cell, styles.Header)
		} else {
			f.SetCellStyle(sheet, cell, cell, styles.TemplateHeader)
		}
	}

	// -------------------------------------------------------------
	// 3. PASANG DROPDOWN (DATA VALIDATION) MENGGUNAKAN MATEMATIKA INDEKS
	// -------------------------------------------------------------
	applyDropdown := func(colIdx int, sourceSheet string, sourceLen int) {
		if sourceLen == 0 {
			return
		}
		colName, _ := excelize.ColumnNumberToName(colIdx)
		dv := excelize.NewDataValidation(true)
		dv.Sqref = fmt.Sprintf("%s2:%s500", colName, colName)
		dv.SetSqrefDropList(fmt.Sprintf("'%s'!$A$1:$A$%d", sourceSheet, sourceLen))
		f.AddDataValidation(sheet, dv)
	}

	applyDropdown(3, refTanggal, rowDate-1) // Kolom C (Tanggal)
	applyDropdown(4, refWaktu, rowTime-1)   // Kolom D (Jam Mulai)
	applyDropdown(5, refWaktu, rowTime-1)   // Kolom E (Jam Selesai)

	// Indeks awal setelah 6 kolom standar (NO s.d DURASI)
	colCursor := 7

	// Pasang Dropdown Pengawas
	for i := 0; i < roomCount; i++ {
		applyDropdown(colCursor+i, refGuru, len(teachers))
	}
	colCursor += roomCount

	// Pasang Dropdown Proktor
	for i := 0; i < roomCount; i++ {
		applyDropdown(colCursor+i, refGuru, len(teachers))
	}
	colCursor += roomCount

	// Pasang Dropdown Mapel (Sekarang menggunakan subjectCount)
	for i := 0; i < subjectCount; i++ {
		applyDropdown(colCursor+i, refMapel, len(subjects))
	}

	return f.WriteToBuffer()
}

func (e *templateExporter) GenerateExamParticipantTemplate() (*bytes.Buffer, error) {
	f := excelize.NewFile()
	sheet := "Peserta Ujian"
	f.SetSheetName("Sheet1", sheet)
	styles := excel_helper.InitStandardStyles(f)

	headers := []string{"NO", "USERNAME_SISWA *"}
	for i, h := range headers {
		cell, _ := excelize.CoordinatesToCellName(i+1, 1)
		f.SetCellValue(sheet, cell, h)
		f.SetCellStyle(sheet, cell, cell, styles.TemplateHeader)
	}
	f.SetColWidth(sheet, "B", "B", 30)
	return f.WriteToBuffer()
}
