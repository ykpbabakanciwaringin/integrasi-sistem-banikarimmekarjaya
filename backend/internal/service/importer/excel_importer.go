// LOKASI: internal/service/importer/excel_importer.go
package importer

import (
	"errors"
	"mime/multipart"
	"strings"

	"github.com/xuri/excelize/v2"
)

type ParsedStudent struct {
	NISN, NIK, FullName, Username, PasswordPlain, ClassName, Gender, BirthPlace, BirthDate, Pondok, Asrama, Kamar, Program, KelasProgram, Address, Village, Subdistrict, Regency, Province, PostalCode, FatherName, MotherName, GuardianPhone, Status string
}

type ParsedTeacher struct {
	NIP, NIK, FullName, Username, PasswordPlain, Gender, WhatsApp, Position string
}

type ParsedInstitution struct {
	Code, Name, FoundationName, Level, Category, Address, City, Phone, Email, Website, Header1, Header2, Logo, DayOff, StatusPqSync string
}

type ParsedClass struct {
	Name, Level, Major, TeacherName, TargetInstID string
}

type ParsedSubject struct {
	Code, Name, Type, CurriculumName string
}

type ParsedQuestionPacket struct {
	Title       string
	GradeLevel  string
	SubjectName string
	TeacherName string
}

type ParsedAssignment struct {
	Row         int
	SubjectName string
	ClassName   string
	TeacherName string
	KKM         string
	Day         string
	SessionName string
}

type ExcelImporter interface {
	ParseStudentExcel(file multipart.File) ([]ParsedStudent, error)
	ParseTeacherExcel(file multipart.File) ([]ParsedTeacher, error)
	ParseInstitutionExcel(file multipart.File) ([]ParsedInstitution, error)
	ParseClassExcel(file multipart.File) ([]ParsedClass, error)
	ParseSubjectExcel(file multipart.File) ([]ParsedSubject, error)
	ParseQuestionPacketExcel(file multipart.File) ([]ParsedQuestionPacket, error)
	ParseAssignmentExcel(file multipart.File) ([]ParsedAssignment, error)
}

type excelImporter struct{}

func NewExcelImporter() ExcelImporter {
	return &excelImporter{}
}

func safeGetCol(row []string, idx int) string {
	if idx < len(row) {
		return strings.TrimSpace(row[idx])
	}
	return ""
}

func (i *excelImporter) ParseStudentExcel(file multipart.File) ([]ParsedStudent, error) {
	f, err := excelize.OpenReader(file)
	if err != nil {
		return nil, err
	}
	defer f.Close()
	rows, err := f.GetRows(f.GetSheetList()[0])
	if err != nil || len(rows) < 2 {
		return nil, errors.New("file excel kosong")
	}
	var result []ParsedStudent
	for idx, row := range rows {
		if idx == 0 || len(row) < 4 {
			continue
		}
		parsed := ParsedStudent{
			NISN: safeGetCol(row, 1), NIK: safeGetCol(row, 2), FullName: safeGetCol(row, 3),
			Username: safeGetCol(row, 4), PasswordPlain: safeGetCol(row, 5), ClassName: safeGetCol(row, 6),
			Gender: safeGetCol(row, 7), BirthPlace: safeGetCol(row, 8), BirthDate: safeGetCol(row, 9),
			Pondok: safeGetCol(row, 10), Asrama: safeGetCol(row, 11), Kamar: safeGetCol(row, 12),
			Program: safeGetCol(row, 13), KelasProgram: safeGetCol(row, 14), Address: safeGetCol(row, 15),
			Village: safeGetCol(row, 16), Subdistrict: safeGetCol(row, 17), Regency: safeGetCol(row, 18),
			Province: safeGetCol(row, 19), PostalCode: safeGetCol(row, 20), FatherName: safeGetCol(row, 21),
			MotherName: safeGetCol(row, 22), GuardianPhone: safeGetCol(row, 23), Status: safeGetCol(row, 24),
		}
		if parsed.Username == "" || parsed.FullName == "" {
			continue
		}
		result = append(result, parsed)
	}
	return result, nil
}

func (i *excelImporter) ParseTeacherExcel(file multipart.File) ([]ParsedTeacher, error) {
	f, err := excelize.OpenReader(file)
	if err != nil {
		return nil, err
	}
	defer f.Close()
	rows, err := f.GetRows(f.GetSheetList()[0])
	if err != nil || len(rows) < 2 {
		return nil, errors.New("file excel kosong")
	}
	var result []ParsedTeacher
	for idx, row := range rows {
		if idx == 0 || len(row) < 4 {
			continue
		}
		parsed := ParsedTeacher{
			NIP: safeGetCol(row, 1), NIK: safeGetCol(row, 2), FullName: safeGetCol(row, 3),
			Username: safeGetCol(row, 4), PasswordPlain: safeGetCol(row, 5), Gender: safeGetCol(row, 6),
			WhatsApp: safeGetCol(row, 7), Position: safeGetCol(row, 8),
		}
		if parsed.Username == "" || parsed.FullName == "" {
			continue
		}
		result = append(result, parsed)
	}
	return result, nil
}

func (i *excelImporter) ParseInstitutionExcel(file multipart.File) ([]ParsedInstitution, error) {
	f, err := excelize.OpenReader(file)
	if err != nil {
		return nil, errors.New("format file excel tidak didukung")
	}
	defer f.Close()

	sheet := f.GetSheetList()[0]
	rows, err := f.GetRows(sheet)
	if err != nil || len(rows) < 2 {
		return nil, errors.New("file excel kosong")
	}

	var result []ParsedInstitution
	for idx, row := range rows {
		if idx == 0 || len(row) < 3 {
			continue
		}

		parsed := ParsedInstitution{
			Code:           strings.ToUpper(safeGetCol(row, 1)),  // Kolom B
			Name:           safeGetCol(row, 2),                   // Kolom C
			FoundationName: safeGetCol(row, 3),                   // Kolom D
			Level:          strings.ToUpper(safeGetCol(row, 4)),  // Kolom E
			Category:       strings.ToUpper(safeGetCol(row, 5)),  // Kolom F
			Address:        safeGetCol(row, 6),                   // Kolom G
			City:           safeGetCol(row, 7),                   // Kolom H
			Phone:          safeGetCol(row, 8),                   // Kolom I
			Email:          strings.ToLower(safeGetCol(row, 9)),  // Kolom J
			Website:        strings.ToLower(safeGetCol(row, 10)), // Kolom K
			Header1:        safeGetCol(row, 11),                  // Kolom L
			Header2:        safeGetCol(row, 12),                  // Kolom M
			Logo:           safeGetCol(row, 13),                  // Kolom N
			DayOff:         strings.ToUpper(safeGetCol(row, 14)), // Kolom O
			StatusPqSync:   strings.ToUpper(safeGetCol(row, 15)), // Kolom P [BARU]
		}

		if parsed.Code == "" || parsed.Name == "" {
			continue
		}
		result = append(result, parsed)
	}
	return result, nil
}

func (i *excelImporter) ParseClassExcel(file multipart.File) ([]ParsedClass, error) {
	f, err := excelize.OpenReader(file)
	if err != nil {
		return nil, errors.New("format file excel tidak didukung")
	}
	defer f.Close()

	sheet := f.GetSheetList()[0]
	rows, err := f.GetRows(sheet)
	if err != nil || len(rows) < 2 {
		return nil, errors.New("file excel kosong atau tidak valid")
	}

	var result []ParsedClass
	for idx, row := range rows {
		// Skip header (idx 0)
		if idx == 0 || len(row) < 3 {
			continue
		}

		// PEMETAAN PRESISI (Kolom A adalah NO, maka mulai dari index 1)
		parsed := ParsedClass{
			Name:         strings.ToUpper(safeGetCol(row, 1)), // Kolom B: NAMA KELAS
			Level:        strings.ToUpper(safeGetCol(row, 2)), // Kolom C: TINGKAT
			Major:        strings.ToUpper(safeGetCol(row, 3)), // Kolom D: JURUSAN
			TeacherName:  safeGetCol(row, 4),                  // Kolom E: NAMA WALI KELAS
			TargetInstID: safeGetCol(row, 5),                  // Kolom F: ID LEMBAGA TARGET
		}

		if parsed.Name == "" {
			continue
		}
		result = append(result, parsed)
	}
	return result, nil
}

func (i *excelImporter) ParseSubjectExcel(file multipart.File) ([]ParsedSubject, error) {
	f, err := excelize.OpenReader(file)
	if err != nil {
		return nil, err
	}
	defer f.Close()
	rows, err := f.GetRows(f.GetSheetList()[0])
	if err != nil || len(rows) < 2 {
		return nil, errors.New("file excel kosong")
	}

	var result []ParsedSubject
	for idx, row := range rows {
		if idx == 0 || len(row) < 4 {
			continue
		}
		parsed := ParsedSubject{
			Code:           strings.ToUpper(safeGetCol(row, 1)),
			Name:           safeGetCol(row, 2),
			Type:           strings.ToUpper(safeGetCol(row, 3)),
			CurriculumName: safeGetCol(row, 4),
		}
		if parsed.Code == "" || parsed.Name == "" {
			continue
		}
		result = append(result, parsed)
	}
	return result, nil
}

func (i *excelImporter) ParseQuestionPacketExcel(file multipart.File) ([]ParsedQuestionPacket, error) {
	f, err := excelize.OpenReader(file)
	if err != nil {
		return nil, err
	}
	defer f.Close()

	sheets := f.GetSheetList()
	if len(sheets) == 0 {
		return nil, errors.New("file excel tidak memiliki sheet")
	}

	rows, err := f.GetRows(sheets[0])
	if err != nil || len(rows) < 2 {
		return nil, errors.New("file excel kosong atau tidak valid")
	}

	var result []ParsedQuestionPacket
	for idx, row := range rows {
		if idx == 0 {
			continue
		}

		title := safeGetCol(row, 1)
		grade := safeGetCol(row, 2)
		subject := safeGetCol(row, 3)
		teacher := safeGetCol(row, 4)

		if title == "" || grade == "" || subject == "" {
			continue
		}

		result = append(result, ParsedQuestionPacket{
			Title:       title,
			GradeLevel:  grade,
			SubjectName: subject,
			TeacherName: teacher,
		})
	}

	return result, nil
}

func (i *excelImporter) ParseAssignmentExcel(file multipart.File) ([]ParsedAssignment, error) {
	f, err := excelize.OpenReader(file)
	if err != nil {
		return nil, err
	}
	defer f.Close()

	sheets := f.GetSheetList()
	if len(sheets) == 0 {
		return nil, errors.New("file excel tidak memiliki sheet")
	}

	rows, err := f.GetRows(sheets[0])
	if err != nil || len(rows) < 2 {
		return nil, errors.New("file excel kosong atau tidak valid")
	}

	var result []ParsedAssignment
	for idx, row := range rows {
		if idx == 0 {
			continue
		}

		subject := safeGetCol(row, 1)
		className := safeGetCol(row, 2)
		teacher := safeGetCol(row, 3)
		kkm := safeGetCol(row, 4)
		day := safeGetCol(row, 5)
		session := safeGetCol(row, 6)

		if subject == "" && className == "" && teacher == "" && day == "" && session == "" {
			continue
		}

		result = append(result, ParsedAssignment{
			Row:         idx + 1,
			SubjectName: subject,
			ClassName:   className,
			TeacherName: teacher,
			KKM:         kkm,
			Day:         day,
			SessionName: session,
		})
	}

	return result, nil
}
