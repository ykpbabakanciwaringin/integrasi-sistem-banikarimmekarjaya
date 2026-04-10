// LOKASI: internal/usecase/template_usecase.go
package usecase

import (
	"bytes"
	"context"
	"errors"

	"banikarimmekarjaya.id/cbt-backend/internal/domain"
	"banikarimmekarjaya.id/cbt-backend/internal/service/exporter"
)

type TemplateUsecase interface {
	GenerateInstitutionTemplate() (*bytes.Buffer, error)
	GenerateClassTemplate(isSuperAdmin bool, instID string) (*bytes.Buffer, error)
	GenerateSubjectTemplate(instID string) (*bytes.Buffer, error)
	GenerateQuestionTemplate() (*bytes.Buffer, error)
	GenerateExamParticipantTemplate(instID string) (*bytes.Buffer, error)

	// [PERBAIKAN] Interface ditambahkan parameter eventID
	GenerateExamSessionTemplate(instID string, eventID string) (*bytes.Buffer, error)

	GenerateStudentTemplate(instID string) (*bytes.Buffer, error)
	GenerateStudentExportExcel(students []domain.User, instID string) (*bytes.Buffer, error)
	GenerateTeacherTemplate(instID string) (*bytes.Buffer, error)
	GenerateTeacherExportExcel(teachers []domain.User, instID string) (*bytes.Buffer, error)
}

type templateUsecase struct {
	classRepo   domain.ClassRepository
	instRepo    domain.InstitutionRepository
	subjectRepo domain.SubjectRepository
	studentRepo domain.StudentRepository
	teacherRepo domain.TeacherRepository
	currRepo    domain.CurriculumRepository
	eventRepo   domain.ExamEventRepository // [PERBAIKAN] Menghapus baris 'er' yang duplikat
	exporter    exporter.TemplateExporter
}

// [PERBAIKAN] Parameter 'er domain.ExamEventRepository' disisipkan ke dalam konstruktor
func NewTemplateUsecase(
	c domain.ClassRepository,
	i domain.InstitutionRepository,
	sj domain.SubjectRepository,
	st domain.StudentRepository,
	t domain.TeacherRepository,
	cr domain.CurriculumRepository,
	er domain.ExamEventRepository,
) TemplateUsecase {
	return &templateUsecase{
		classRepo:   c,
		instRepo:    i,
		subjectRepo: sj,
		studentRepo: st,
		teacherRepo: t,
		currRepo:    cr,
		eventRepo:   er,
		exporter:    exporter.NewTemplateExporter(),
	}
}

// --- DELEGASI LOGIKA MASTER DATA ---

func (uc *templateUsecase) GenerateInstitutionTemplate() (*bytes.Buffer, error) {
	return uc.exporter.GenerateInstitutionTemplate()
}

func (uc *templateUsecase) GenerateClassTemplate(isSuperAdmin bool, instID string) (*bytes.Buffer, error) {
	var institutions []domain.Institution
	if isSuperAdmin {
		institutions, _, _ = uc.instRepo.FetchAll(context.Background(), domain.InstitutionFilter{Limit: 1000})
	}

	// Tarik data Guru untuk dropdown Excel
	var teachers []domain.User
	if instID != "" {
		teachers, _, _ = uc.teacherRepo.Fetch(context.Background(), domain.TeacherFilter{InstitutionID: instID, Limit: 10000})
	}

	return uc.exporter.GenerateClassTemplate(isSuperAdmin, institutions, teachers)
}

func (uc *templateUsecase) GenerateSubjectTemplate(instID string) (*bytes.Buffer, error) {
	// Tarik data Kurikulum untuk dropdown Excel
	var curriculums []domain.Curriculum
	if instID != "" {
		curriculums, _, _ = uc.currRepo.FetchCurriculums(context.Background(), domain.CurriculumFilter{InstitutionID: instID, Limit: 1000})
	}

	return uc.exporter.GenerateSubjectTemplate(curriculums)
}

// --- DELEGASI LOGIKA UJIAN ---

func (uc *templateUsecase) GenerateQuestionTemplate() (*bytes.Buffer, error) {
	return uc.exporter.GenerateQuestionTemplate()
}

func (uc *templateUsecase) GenerateExamSessionTemplate(instID string, eventID string) (*bytes.Buffer, error) {
	// 1. Ambil data Event untuk Tanggal & Jumlah Ruangan
	event, err := uc.eventRepo.GetEventByID(context.Background(), eventID)
	if err != nil {
		return nil, errors.New("gagal menarik data kegiatan ujian: " + err.Error())
	}

	// 2. Ambil data Guru
	filterTeacher := domain.TeacherFilter{InstitutionID: instID, Status: "ACTIVE", Limit: 10000}
	teachers, _, _ := uc.teacherRepo.Fetch(context.Background(), filterTeacher)

	// 3. Ambil data Mata Pelajaran
	filterSubject := domain.SubjectFilter{InstitutionID: instID, Limit: 10000}
	subjects, _, _ := uc.subjectRepo.Fetch(context.Background(), filterSubject)

	// 4. Lempar Semuanya ke Exporter
	// [PERBAIKAN] Menambahkan dereference (*event) karena GetEventByID mengembalikan pointer
	return uc.exporter.GenerateExamSessionTemplate(teachers, subjects, *event)
}

func (uc *templateUsecase) GenerateExamParticipantTemplate(instID string) (*bytes.Buffer, error) {
	return uc.exporter.GenerateExamParticipantTemplate()
}

// --- DELEGASI LOGIKA SISWA & GURU ---

func (uc *templateUsecase) GenerateStudentTemplate(instID string) (*bytes.Buffer, error) {
	inst, _ := uc.instRepo.GetByID(context.Background(), instID)
	classes, _ := uc.classRepo.Fetch(context.Background(), instID, domain.ClassFilter{})
	return uc.exporter.GenerateStudentTemplate(inst, classes)
}

func (uc *templateUsecase) GenerateStudentExportExcel(students []domain.User, instID string) (*bytes.Buffer, error) {
	inst, _ := uc.instRepo.GetByID(context.Background(), instID)
	classes, _ := uc.classRepo.Fetch(context.Background(), instID, domain.ClassFilter{})
	return uc.exporter.GenerateStudentExport(students, inst, classes)
}

func (uc *templateUsecase) GenerateTeacherTemplate(instID string) (*bytes.Buffer, error) {
	return uc.exporter.GenerateTeacherTemplate()
}

func (uc *templateUsecase) GenerateTeacherExportExcel(teachers []domain.User, instID string) (*bytes.Buffer, error) {
	return uc.exporter.GenerateTeacherExport(teachers)
}
