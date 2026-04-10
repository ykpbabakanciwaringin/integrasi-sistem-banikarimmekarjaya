// LOKASI: internal/service/exporter/template_user_exporter.go
package exporter

import (
	"bytes"
	"fmt"

	"github.com/xuri/excelize/v2"
	"ykpbabakanciwaringin.id/cbt-backend/internal/domain"
	"ykpbabakanciwaringin.id/cbt-backend/pkg/utils/excel_helper"
)

// =========================================================================
// SISWA
// =========================================================================

func (e *templateExporter) GenerateStudentTemplate(inst *domain.Institution, classes []domain.Class) (*bytes.Buffer, error) {
	// 1. Tentukan Nilai Default Dropdown
	pondokList := []string{
		"PESANTREN PUTRA ASSALAFIE", "PESANTREN PUTRI ASSALAFIAT I", "PESANTREN PUTRI ASSALAFIAT II",
		"PESANTREN PUTRI ASSALAFIAT III", "PESANTREN PUTRI ASSALAFIAT IV", "PESANTREN PUTRI ASSALAFIAT V",
		"TIDAK MUKIM DI PESANTREN",
	}

	programList := []string{
		"MADRASAH DINIYAH ASSALAFIE", "MADRASAH AL-HIKAMUS SALAFIYAH PUTRI", "METODE AUZAN LIL BANIN",
		"METODE AUZAN LIL BANAT", "METODE ILHAMQU LIL BANIN", "METODE ILHAMQU LIL BANAT",
		"TAHFIDZ AL-QUR'AN REGULER", "TIDAK IKUT PROGRAM",
	}

	// 2. LOGIKA DINAMIS: Timpa daftar jika lembaga memiliki aturan spesifik
	if inst != nil && inst.Category == "UMUM" {
		pondokList = []string{"TIDAK MUKIM DI PESANTREN"}
	}

	// --- PROSES EXCELIZE ---
	f := excelize.NewFile()
	sheet := "Template Siswa"
	index, _ := f.NewSheet(sheet)
	f.SetActiveSheet(index)
	f.DeleteSheet("Sheet1")

	styles := excel_helper.InitStandardStyles(f)

	headers := []struct {
		Title string
		Width float64
		Style int
	}{
		{"NO", 6, styles.DataCenter}, {"NISN *", 22, styles.DataLeft}, {"NIK", 22, styles.DataLeft},
		{"NAMA LENGKAP *", 35, styles.DataLeft}, {"USERNAME *", 22, styles.DataLeft}, {"PASSWORD *", 18, styles.DataLeft},
		{"NAMA KELAS *", 25, styles.DropdownHeader}, {"JENIS KELAMIN *", 18, styles.DropdownHeader},
		{"TEMPAT LAHIR", 20, styles.DataLeft}, {"TANGGAL LAHIR (dd-mm-yyyy)", 25, styles.DataLeft},
		{"PONDOK", 30, styles.DropdownHeader}, {"ASRAMA", 20, styles.DataLeft}, {"KAMAR", 15, styles.DataLeft},
		{"PROGRAM", 35, styles.DropdownHeader}, {"KELAS PROGRAM", 20, styles.DataLeft},
		{"ALAMAT LENGKAP", 40, styles.DataLeft}, {"DESA", 20, styles.DataLeft}, {"KECAMATAN", 20, styles.DataLeft},
		{"KABUPATEN/KOTA", 20, styles.DataLeft}, {"PROVINSI", 20, styles.DataLeft}, {"KODE POS", 15, styles.DataLeft},
		{"NAMA AYAH *", 35, styles.DataLeft}, {"NAMA IBU *", 35, styles.DataLeft}, {"NOMOR WALI", 20, styles.DataLeft},
		{"STATUS", 20, styles.DropdownHeader},
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
		f.SetCellStyle(sheet, colName+"2", colName+"5000", bodyStyle)
	}

	f.SetPanes(sheet, &excelize.Panes{Freeze: true, XSplit: 0, YSplit: 1, TopLeftCell: "A2", ActivePane: "bottomLeft"})

	dvGender := excelize.NewDataValidation(true)
	dvGender.Sqref = "H2:H5000"
	dvGender.SetDropList([]string{"L", "P"})
	f.AddDataValidation(sheet, dvGender)

	dvPondok := excelize.NewDataValidation(true)
	dvPondok.Sqref = "K2:K5000"
	dvPondok.SetDropList(pondokList)
	f.AddDataValidation(sheet, dvPondok)

	dvProgram := excelize.NewDataValidation(true)
	dvProgram.Sqref = "N2:N5000"
	dvProgram.SetDropList(programList)
	f.AddDataValidation(sheet, dvProgram)

	dvStatus := excelize.NewDataValidation(true)
	dvStatus.Sqref = "Y2:Y5000"
	dvStatus.SetDropList([]string{"AKTIF", "NON AKTIF", "PINDAH", "ALUMNI"})
	f.AddDataValidation(sheet, dvStatus)

	// 3. MEMBUAT SHEET REFERENSI KELAS DINAMIS (DISEMBUNYIKAN)
	const refSheet = "Referensi"
	if len(classes) > 0 {
		f.NewSheet(refSheet)
		f.SetCellValue(refSheet, "A1", "NAMA KELAS")
		for i, c := range classes {
			f.SetCellValue(refSheet, fmt.Sprintf("A%d", i+2), c.Name)
		}
		f.SetColWidth(refSheet, "A", "A", 30)

		formula := fmt.Sprintf("'%s'!$A$2:$A$%d", refSheet, len(classes)+1)
		dvClass := excelize.NewDataValidation(true)
		dvClass.Sqref = "G2:G5000"
		dvClass.SetSqrefDropList(formula)
		f.AddDataValidation(sheet, dvClass)

		f.SetSheetVisible(refSheet, false)
	}

	return f.WriteToBuffer()
}

func (e *templateExporter) GenerateStudentExport(students []domain.User, inst *domain.Institution, classes []domain.Class) (*bytes.Buffer, error) {
	buffer, err := e.GenerateStudentTemplate(inst, classes)
	if err != nil {
		return nil, err
	}

	f, err := excelize.OpenReader(buffer)
	if err != nil {
		return nil, err
	}
	defer f.Close()

	sheet := "Template Siswa"

	for i, user := range students {
		if user.Profile == nil {
			continue
		}

		row := i + 2
		className := ""
		if user.Profile.Class != nil {
			className = user.Profile.Class.Name
		}

		birthDateStr := ""
		if !user.Profile.BirthDate.IsZero() {
			birthDateStr = user.Profile.BirthDate.Format("02-01-2006") // Sesuai format (dd-mm-yyyy)
		}

		f.SetCellValue(sheet, fmt.Sprintf("A%d", row), i+1)
		f.SetCellStr(sheet, fmt.Sprintf("B%d", row), user.Profile.NISN)
		f.SetCellStr(sheet, fmt.Sprintf("C%d", row), user.Profile.NIK)
		f.SetCellValue(sheet, fmt.Sprintf("D%d", row), user.Profile.FullName)
		f.SetCellStr(sheet, fmt.Sprintf("E%d", row), user.Username)
		f.SetCellStr(sheet, fmt.Sprintf("F%d", row), user.PasswordPlain)
		f.SetCellValue(sheet, fmt.Sprintf("G%d", row), className)
		f.SetCellValue(sheet, fmt.Sprintf("H%d", row), user.Profile.Gender)
		f.SetCellValue(sheet, fmt.Sprintf("I%d", row), user.Profile.BirthPlace)
		f.SetCellStr(sheet, fmt.Sprintf("J%d", row), birthDateStr)
		f.SetCellValue(sheet, fmt.Sprintf("K%d", row), user.Profile.Pondok)
		f.SetCellValue(sheet, fmt.Sprintf("L%d", row), user.Profile.Asrama)
		f.SetCellValue(sheet, fmt.Sprintf("M%d", row), user.Profile.Kamar)
		f.SetCellValue(sheet, fmt.Sprintf("N%d", row), user.Profile.Program)
		f.SetCellValue(sheet, fmt.Sprintf("O%d", row), user.Profile.KelasProgram)
		f.SetCellValue(sheet, fmt.Sprintf("P%d", row), user.Profile.Address)
		f.SetCellValue(sheet, fmt.Sprintf("Q%d", row), user.Profile.Village)
		f.SetCellValue(sheet, fmt.Sprintf("R%d", row), user.Profile.Subdistrict)
		f.SetCellValue(sheet, fmt.Sprintf("S%d", row), user.Profile.Regency)
		f.SetCellValue(sheet, fmt.Sprintf("T%d", row), user.Profile.Province)
		f.SetCellStr(sheet, fmt.Sprintf("U%d", row), user.Profile.PostalCode)
		f.SetCellValue(sheet, fmt.Sprintf("V%d", row), user.Profile.FatherName)
		f.SetCellValue(sheet, fmt.Sprintf("W%d", row), user.Profile.MotherName)
		f.SetCellStr(sheet, fmt.Sprintf("X%d", row), user.Profile.GuardianPhone)
		f.SetCellValue(sheet, fmt.Sprintf("Y%d", row), user.Profile.Status)
	}

	return f.WriteToBuffer()
}

// =========================================================================
// GURU
// =========================================================================

func (e *templateExporter) GenerateTeacherTemplate() (*bytes.Buffer, error) {
	f := excelize.NewFile()
	sheet := "Template Guru"
	f.SetSheetName("Sheet1", sheet)
	styles := excel_helper.InitStandardStyles(f)

	headers := []struct {
		Title string
		Width float64
		Style int
	}{
		{"NO", 6, styles.DataCenter}, {"NIP/NIG *", 22, styles.DataLeft}, {"NIK", 22, styles.DataLeft},
		{"NAMA LENGKAP *", 35, styles.DataLeft}, {"USERNAME *", 22, styles.DataLeft},
		{"PASSWORD *", 18, styles.DataLeft}, {"JENIS KELAMIN *", 18, styles.DropdownHeader},
		{"NO WHATSAPP", 25, styles.DataLeft}, {"JABATAN", 25, styles.DropdownHeader},
	}

	for i, h := range headers {
		colName, _ := excelize.ColumnNumberToName(i + 1)
		cellHeader := fmt.Sprintf("%s1", colName)

		f.SetCellValue(sheet, cellHeader, h.Title)
		f.SetColWidth(sheet, colName, colName, h.Width)

		// Standardisasi Warna Header
		if h.Style == styles.DropdownHeader {
			f.SetCellStyle(sheet, cellHeader, cellHeader, styles.DropdownHeader)
		} else {
			f.SetCellStyle(sheet, cellHeader, cellHeader, styles.TemplateHeader)
		}

		// Standardisasi Body Tabel hingga 500 Baris
		bodyStyle := styles.DataLeft
		if h.Title == "NO" {
			bodyStyle = styles.DataCenter
		}
		f.SetCellStyle(sheet, colName+"2", colName+"500", bodyStyle)
	}

	dvGender := excelize.NewDataValidation(true)
	dvGender.Sqref = "G2:G500"
	dvGender.SetDropList([]string{"L", "P"})
	f.AddDataValidation(sheet, dvGender)

	dvPosition := excelize.NewDataValidation(true)
	dvPosition.Sqref = "I2:I500"
	dvPosition.SetDropList([]string{
		"GURU MAPEL", "WALI KELAS", "KEPALA SEKOLAH", "WAKA KURIKULUM",
		"KEPALA STAFF TU", "TATA USAHA", "BENDAHARA", "GURU PIKET",
	})
	f.AddDataValidation(sheet, dvPosition)

	return f.WriteToBuffer()
}

func (e *templateExporter) GenerateTeacherExport(teachers []domain.User) (*bytes.Buffer, error) {
	buffer, err := e.GenerateTeacherTemplate()
	if err != nil {
		return nil, err
	}

	f, err := excelize.OpenReader(buffer)
	if err != nil {
		return nil, err
	}
	defer f.Close()

	sheet := "Template Guru"
	for i, user := range teachers {
		if user.Profile == nil {
			continue
		}
		row := i + 2
		nipNig := user.Profile.NIP
		if nipNig == "" {
			nipNig = "-"
		}
		position := "GURU MAPEL"
		if len(user.Enrollments) > 0 && user.Enrollments[0].Position != "" {
			position = user.Enrollments[0].Position
		}

		f.SetCellValue(sheet, fmt.Sprintf("A%d", row), i+1)
		f.SetCellStr(sheet, fmt.Sprintf("B%d", row), nipNig)
		f.SetCellStr(sheet, fmt.Sprintf("C%d", row), user.Profile.NIK)
		f.SetCellValue(sheet, fmt.Sprintf("D%d", row), user.Profile.FullName)
		f.SetCellStr(sheet, fmt.Sprintf("E%d", row), user.Username)
		f.SetCellStr(sheet, fmt.Sprintf("F%d", row), user.PasswordPlain)
		f.SetCellValue(sheet, fmt.Sprintf("G%d", row), user.Profile.Gender)
		f.SetCellStr(sheet, fmt.Sprintf("H%d", row), user.Profile.PhoneNumber)
		f.SetCellValue(sheet, fmt.Sprintf("I%d", row), position)
	}
	return f.WriteToBuffer()
}
