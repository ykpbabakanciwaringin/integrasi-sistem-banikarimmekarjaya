// LOKASI: internal/usecase/report_usecase.go
package usecase

import (
	"context"
	"errors"
	"sort"

	"ykpbabakanciwaringin.id/cbt-backend/internal/domain"
)

type ReportUsecase interface {
	InputReport(ctx context.Context, teacherID, role string, input InputReportDTO) error
	GenerateClassLeger(ctx context.Context, classID, userID, role string) (*domain.ClassLegerResponse, error)
}

type reportUsecase struct {
	reportRepo domain.ReportRepository
	classRepo  domain.ClassRepository
}

func NewReportUsecase(r domain.ReportRepository, c domain.ClassRepository) ReportUsecase {
	return &reportUsecase{reportRepo: r, classRepo: c}
}

type InputReportDTO struct {
	ClassID    string `json:"class_id"`
	StudentID  string `json:"student_id"`
	Sick       int    `json:"sick"`
	Permission int    `json:"permission"`
	Absent     int    `json:"absent"`
	Note       string `json:"note"`
	IsPromoted bool   `json:"is_promoted"`
}

// =======================================================
// INPUT RAPOR OLEH WALI KELAS
// =======================================================
func (uc *reportUsecase) InputReport(ctx context.Context, teacherID, role string, input InputReportDTO) error {
	// 1. PENGAMANAN KETAT (RBAC)
	if role == domain.RoleTeacher {
		classDetail, err := uc.classRepo.GetByID(ctx, input.ClassID)
		if err != nil || classDetail.TeacherID == nil || *classDetail.TeacherID != teacherID {
			return domain.ErrForbiddenReportAccess
		}
	}

	report := domain.StudentReport{
		StudentID:  input.StudentID,
		ClassID:    input.ClassID,
		Sick:       input.Sick,
		Permission: input.Permission,
		Absent:     input.Absent,
		Note:       input.Note,
		IsPromoted: input.IsPromoted,
	}

	return uc.reportRepo.Upsert(ctx, &report)
}

// =======================================================
// PENJAHIT LEGER (Super Cepat & Bebas Memori Bocor)
// =======================================================
func (uc *reportUsecase) GenerateClassLeger(ctx context.Context, classID, userID, role string) (*domain.ClassLegerResponse, error) {
	// 1. Ambil Informasi Kelas & Wali Kelas (Sekaligus Preload Institusi)
	classDetail, err := uc.classRepo.GetByID(ctx, classID)
	if err != nil {
		return nil, errors.New("data kelas tidak ditemukan")
	}

	// 2. PENGAMANAN KETAT (RBAC)
	if role == domain.RoleTeacher {
		if classDetail.TeacherID == nil || *classDetail.TeacherID != userID {
			return nil, domain.ErrForbiddenReportAccess
		}
	}

	teacherName := "Belum Ditentukan"
	if classDetail.Teacher != nil {
		teacherName = classDetail.Teacher.FullName
	}

	institutionName := "YAYASAN KEBAJIKAN PESANTREN" // Default Fallback
	if classDetail.Institution != nil {
		institutionName = classDetail.Institution.Name
	}

	// 3. Ambil Catatan Kehadiran & Rapor
	reports, err := uc.reportRepo.GetByClass(ctx, classID)
	if err != nil {
		return nil, errors.New("gagal mengambil data catatan kehadiran")
	}

	reportMap := make(map[string]domain.StudentReport)
	for _, r := range reports {
		reportMap[r.StudentID] = r
	}

	// 4. Ambil Rangkuman Seluruh Nilai Ujian
	gradesSummary, err := uc.reportRepo.GetClassGradesSummary(ctx, classID)
	if err != nil {
		return nil, errors.New("gagal mengambil rekapitulasi nilai ujian")
	}

	// 5. Penjahitan Data Dinamis (Tanpa fmt.Sprintf overhead)
	studentMap := make(map[string]*domain.StudentLeger)
	subjectSet := make(map[string]bool)
	var subjectList []string

	for _, row := range gradesSummary {
		if row.SubjectName != "" && row.SubjectName != "<nil>" {
			if !subjectSet[row.SubjectName] {
				subjectSet[row.SubjectName] = true
				subjectList = append(subjectList, row.SubjectName)
			}
		}

		if _, exists := studentMap[row.StudentID]; !exists {
			studentMap[row.StudentID] = &domain.StudentLeger{
				StudentID:   row.StudentID,
				StudentName: row.StudentName,
				Username:    row.Username,
				NISN:        row.NISN,
				Grades:      make(map[string]float64),
			}
		}

		if row.SubjectName != "" && row.SubjectName != "<nil>" {
			studentMap[row.StudentID].Grades[row.SubjectName] = row.FinalScore
		}
	}

	var studentList []domain.StudentLeger
	for sID, student := range studentMap {
		if rep, found := reportMap[sID]; found {
			student.Attendance = &rep
		} else {
			student.Attendance = &domain.StudentReport{
				Sick: 0, Permission: 0, Absent: 0, Note: "", IsPromoted: true,
			}
		}
		studentList = append(studentList, *student)
	}

	sort.Slice(studentList, func(i, j int) bool {
		return studentList[i].StudentName < studentList[j].StudentName
	})
	sort.Strings(subjectList)

	response := &domain.ClassLegerResponse{
		ClassInfo: domain.ClassInfo{
			ID:              classDetail.ID.String(),
			Name:            classDetail.Name,
			Level:           classDetail.Level,
			TeacherName:     teacherName,
			InstitutionName: institutionName,
		},
		SubjectList: subjectList,
		Students:    studentList,
	}

	return response, nil
}
