// LOKASI: internal/usecase/assignment_usecase.go
package usecase

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"mime/multipart"
	"strconv"
	"strings"
	"time"

	"github.com/google/uuid"
	"banikarimmekarjaya.id/cbt-backend/internal/domain"
	"banikarimmekarjaya.id/cbt-backend/internal/service/exporter"
	"banikarimmekarjaya.id/cbt-backend/internal/service/importer"
	"banikarimmekarjaya.id/cbt-backend/pkg/utils/pdf_helper"
)

type assignmentUsecase struct {
	repo        domain.AssignmentRepository
	exporter    exporter.AssignmentExporter
	pdfExporter exporter.AssignmentPdfExporter
	importer    importer.ExcelImporter
}

func NewAssignmentUsecase(
	r domain.AssignmentRepository,
	e exporter.AssignmentExporter,
	pe exporter.AssignmentPdfExporter,
	imp importer.ExcelImporter,
) domain.AssignmentUsecase {
	return &assignmentUsecase{
		repo:        r,
		exporter:    e,
		pdfExporter: pe,
		importer:    imp,
	}
}

func (uc *assignmentUsecase) GetAssignments(ctx context.Context, filter domain.AssignmentFilter) (domain.PaginationResult, error) {
	if filter.Page <= 0 {
		filter.Page = 1
	}
	if filter.Limit <= 0 {
		filter.Limit = 10
	}

	data, total, err := uc.repo.Fetch(ctx, filter)
	if err != nil {
		return domain.PaginationResult{}, err
	}

	totalPages := int((total + int64(filter.Limit) - 1) / int64(filter.Limit))
	return domain.PaginationResult{Data: data, Total: total, Page: filter.Page, Limit: filter.Limit, TotalPages: totalPages}, nil
}

func (uc *assignmentUsecase) GetAssignmentDetail(ctx context.Context, id string) (*domain.AssignmentDetail, error) {
	asg, err := uc.repo.GetByID(ctx, id)
	if err != nil {
		return nil, errors.New("data penugasan tidak ditemukan")
	}

	return &domain.AssignmentDetail{
		ID:              asg.ID.String(),
		SubjectName:     asg.Subject.Name,
		ClassName:       asg.Class.Name,
		TeacherName:     asg.Teacher.FullName,
		InstitutionName: asg.Class.Institution.Name,
		KKM:             asg.KKM,
	}, nil
}

func (uc *assignmentUsecase) CreateAssignment(ctx context.Context, input domain.CreateAssignmentInput, operatorID string) (*domain.Assignment, error) {
	if input.KKM == 0 {
		input.KKM = 75
	}

	assignment := &domain.Assignment{
		BaseEntity: domain.BaseEntity{
			ID: uuid.New(), CreatedAt: time.Now(), UpdatedAt: time.Now(), CreatedBy: operatorID,
		},
		InstitutionID: input.InstitutionID, TeacherID: input.TeacherID, SubjectID: input.SubjectID, ClassID: input.ClassID, KKM: input.KKM,
	}

	if err := uc.repo.Create(ctx, assignment); err != nil {
		return nil, err
	}
	return assignment, nil
}

func (uc *assignmentUsecase) UpdateKKM(ctx context.Context, id string, input domain.UpdateKKMInput) error {
	return uc.repo.UpdateKKM(ctx, id, input.KKM)
}

func (uc *assignmentUsecase) DeleteAssignment(ctx context.Context, id string) error {
	return uc.repo.Delete(ctx, id)
}

func (uc *assignmentUsecase) GetAssignmentGrades(ctx context.Context, assignmentID string) ([]domain.StudentGrade, error) {
	return uc.repo.GetStudentGrades(ctx, assignmentID)
}

func (uc *assignmentUsecase) DownloadRekap(ctx context.Context, assignmentID string) (*bytes.Buffer, error) {
	detail, err := uc.GetAssignmentDetail(ctx, assignmentID)
	if err != nil {
		return nil, err
	}
	grades, err := uc.repo.GetStudentGrades(ctx, assignmentID)
	if err != nil {
		return nil, err
	}
	return uc.exporter.GenerateRekapExcel(detail, grades)
}

func (uc *assignmentUsecase) DownloadRekapPDF(ctx context.Context, assignmentID string) (*bytes.Buffer, error) {
	detail, err := uc.GetAssignmentDetail(ctx, assignmentID)
	if err != nil {
		return nil, err
	}
	grades, err := uc.repo.GetStudentGrades(ctx, assignmentID)
	if err != nil {
		return nil, err
	}
	asg, err := uc.repo.GetByID(ctx, assignmentID)
	if err != nil {
		return nil, err
	}

	var kopData pdf_helper.KopSuratData
	if asg.Class != nil && asg.Class.Institution != nil {
		kopData = pdf_helper.KopSuratData{
			Name:           asg.Class.Institution.Name,
			FoundationName: asg.Class.Institution.FoundationName, // FITUR BARU DI SINI
			Header1:        asg.Class.Institution.Header1,
			Header2:        asg.Class.Institution.Header2,
			AddressDetail:  asg.Class.Institution.AddressDetail,
			AddressCity:    asg.Class.Institution.AddressCity,
			ContactPhone:   asg.Class.Institution.ContactPhone,
			ContactEmail:   asg.Class.Institution.ContactEmail,
			Website:        asg.Class.Institution.Website,
			LogoUrl:        asg.Class.Institution.LogoUrl,
		}
	}
	return uc.pdfExporter.GenerateRekapPDF(detail, grades, kopData)
}

func (uc *assignmentUsecase) DownloadAssignmentTemplate(ctx context.Context, instID string) (*bytes.Buffer, error) {
	classes, subjects, teachers, sessions, err := uc.repo.FetchReferencesForTemplate(ctx, instID)
	if err != nil {
		return nil, errors.New("gagal mengambil data referensi untuk template")
	}
	return uc.exporter.GenerateAssignmentTemplate(classes, subjects, teachers, sessions)
}

func (uc *assignmentUsecase) ExportAssignmentsExcel(ctx context.Context, filter domain.AssignmentFilter) (*bytes.Buffer, error) {
	filter.Limit = 10000
	filter.Page = 1
	data, _, err := uc.repo.Fetch(ctx, filter)
	if err != nil {
		return nil, errors.New("gagal mengambil data penugasan")
	}
	return uc.exporter.GenerateAssignmentListExcel(data)
}

func (uc *assignmentUsecase) ExportAssignmentsPDF(ctx context.Context, filter domain.AssignmentFilter) (*bytes.Buffer, error) {
	filter.Limit = 10000
	filter.Page = 1
	data, _, err := uc.repo.Fetch(ctx, filter)
	if err != nil {
		return nil, errors.New("gagal mengambil data penugasan")
	}

	var kopData pdf_helper.KopSuratData
	if len(data) > 0 && data[0].Class != nil && data[0].Class.Institution != nil {
		inst := data[0].Class.Institution
		kopData = pdf_helper.KopSuratData{
			Name:           inst.Name,
			FoundationName: inst.FoundationName, // FITUR BARU DI SINI
			Header1:        inst.Header1,
			Header2:        inst.Header2,
			AddressDetail:  inst.AddressDetail,
			AddressCity:    inst.AddressCity,
			ContactPhone:   inst.ContactPhone,
			ContactEmail:   inst.ContactEmail,
			Website:        inst.Website,
			LogoUrl:        inst.LogoUrl,
		}
	}
	return uc.pdfExporter.GenerateAssignmentListPDF(data, kopData)
}

// =======================================================
// IMPORT BATCH EXCEL MASTER DENGAN LOGIKA SESI OPSIONAL
// =======================================================
func (uc *assignmentUsecase) ImportAssignments(ctx context.Context, instID string, file multipart.File) (int, error) {
	parsedData, err := uc.importer.ParseAssignmentExcel(file)
	if err != nil {
		return 0, err
	}

	classes, subjects, teachers, sessions, err := uc.repo.FetchReferencesForTemplate(ctx, instID)
	if err != nil {
		return 0, errors.New("gagal mengambil data referensi lembaga")
	}

	classMap := make(map[string]string)
	for _, c := range classes {
		classMap[strings.ToUpper(c.Name)] = c.ID.String()
	}

	subjectMap := make(map[string]string)
	for _, s := range subjects {
		subjectMap[strings.ToUpper(s.Name)] = s.ID.String()
	}

	teacherMap := make(map[string]string)
	for _, t := range teachers {
		if t.Profile != nil {
			teacherMap[strings.ToUpper(t.Profile.FullName)] = t.ID.String()
		}
	}

	sessionMap := make(map[string]domain.ClassSession)
	for _, s := range sessions {
		sessionMap[strings.ToUpper(s.Name)] = s
	}

	teacherScheduleMap := make(map[string]string)
	var validAssignments []domain.MasterScheduleDTO

	for _, p := range parsedData {
		classID, cOk := classMap[strings.ToUpper(p.ClassName)]
		subjectID, sOk := subjectMap[strings.ToUpper(p.SubjectName)]
		teacherID, tOk := teacherMap[strings.ToUpper(p.TeacherName)]
		day := strings.ToUpper(p.Day)

		if !cOk {
			return 0, fmt.Errorf("Baris %d gagal: Kelas '%s' tidak ditemukan", p.Row, p.ClassName)
		}
		if !sOk {
			return 0, fmt.Errorf("Baris %d gagal: Mapel '%s' tidak ditemukan", p.Row, p.SubjectName)
		}
		if !tOk {
			return 0, fmt.Errorf("Baris %d gagal: Guru '%s' tidak ditemukan", p.Row, p.TeacherName)
		}

		var startTime, endTime string
		var conflictSessionID string

		// LOGIKA SESI & HARI OPSIONAL
		if len(sessions) > 0 {
			// Jika lembaga punya Sesi KBM, maka Hari dan Sesi WAJIB diisi
			if day == "" {
				return 0, fmt.Errorf("Baris %d gagal: Hari wajib diisi karena lembaga ini menggunakan fitur Sesi KBM", p.Row)
			}
			if p.SessionName == "" {
				return 0, fmt.Errorf("Baris %d gagal: Sesi wajib diisi", p.Row)
			}

			sesDetail, sesOk := sessionMap[strings.ToUpper(p.SessionName)]
			if !sesOk {
				return 0, fmt.Errorf("Baris %d gagal: Sesi '%s' tidak valid", p.Row, p.SessionName)
			}

			startTime = sesDetail.StartTime
			endTime = sesDetail.EndTime
			conflictSessionID = sesDetail.ID.String()
		} else {
			// Lembaga belum mengatur Sesi KBM, jadi jadwal harian akan di-skip
			conflictSessionID = ""
		}

		// Validasi Bentrok hanya berjalan jika konflik ID sesi ada
		if conflictSessionID != "" {
			conflictKey := fmt.Sprintf("%s_%s_%s", teacherID, day, conflictSessionID)
			if existingClass, exists := teacherScheduleMap[conflictKey]; exists {
				if existingClass != p.ClassName {
					return 0, fmt.Errorf("BENTROK JADWAL (Baris %d): Guru '%s' sudah mengajar di Kelas '%s' pada %s (%s)",
						p.Row, p.TeacherName, existingClass, p.Day, p.SessionName)
				}
			} else {
				teacherScheduleMap[conflictKey] = p.ClassName
			}
		}

		kkm := 75.0
		if p.KKM != "" {
			if parsedKKM, err := strconv.ParseFloat(p.KKM, 64); err == nil {
				kkm = parsedKKM
			}
		}

		validAssignments = append(validAssignments, domain.MasterScheduleDTO{
			TeacherID: teacherID, SubjectID: subjectID, ClassID: classID,
			KKM: kkm, Day: day, StartTime: startTime, EndTime: endTime,
		})
	}

	err = uc.repo.BatchImportMasterSchedule(ctx, instID, validAssignments)
	if err != nil {
		return 0, err
	}

	return len(validAssignments), nil
}
