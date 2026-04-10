// LOKASI: internal/usecase/question_usecase.go
package usecase

import (
	"archive/zip"
	"bytes"
	"context"
	"errors"
	"fmt"
	"mime/multipart"
	"strconv"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/xuri/excelize/v2"
	"ykpbabakanciwaringin.id/cbt-backend/internal/domain"
	"ykpbabakanciwaringin.id/cbt-backend/internal/service/exporter"
	"ykpbabakanciwaringin.id/cbt-backend/internal/service/importer"
	"ykpbabakanciwaringin.id/cbt-backend/pkg/utils/pdf_helper"
)

type questionUsecase struct {
	questionRepo     domain.QuestionRepository
	exporter         exporter.QuestionExporter
	pdfExporter      exporter.QuestionPdfExporter
	academicYearRepo domain.AcademicYearRepository
	scheduleRepo     domain.ScheduleRepository

	// INJEKSI LINTAS DOMAIN UNTUK MAPPING
	subjectRepo domain.SubjectRepository
	teacherRepo domain.TeacherRepository
	importer    importer.ExcelImporter
	classRepo   domain.ClassRepository
}

func NewQuestionUsecase(
	r domain.QuestionRepository,
	exp exporter.QuestionExporter,
	pdfExp exporter.QuestionPdfExporter,
	ayRepo domain.AcademicYearRepository,
	sRepo domain.ScheduleRepository,
	subRepo domain.SubjectRepository,
	tRepo domain.TeacherRepository,
	imp importer.ExcelImporter,
	cRepo domain.ClassRepository,
) domain.QuestionUsecase {
	return &questionUsecase{
		questionRepo:     r,
		exporter:         exp,
		pdfExporter:      pdfExp,
		academicYearRepo: ayRepo,
		scheduleRepo:     sRepo,
		subjectRepo:      subRepo,
		teacherRepo:      tRepo,
		importer:         imp,
		classRepo:        cRepo,
	}
}

// ============================================================================
// --- IMPLEMENTASI MANAJEMEN PAKET SOAL (INDUK) ---
// ============================================================================

func (uc *questionUsecase) GetPackets(ctx context.Context, filter domain.QuestionFilter) ([]domain.QuestionBank, int64, error) {
	return uc.questionRepo.FetchPackets(ctx, filter)
}

func (uc *questionUsecase) GetPacketDetail(ctx context.Context, id string) (*domain.QuestionBank, error) {
	return uc.questionRepo.GetPacketByID(ctx, id)
}

func (uc *questionUsecase) CreatePacket(ctx context.Context, teacherID, instID string, input domain.CreatePacketInput) error {
	packet := domain.QuestionBank{
		BaseEntity: domain.BaseEntity{
			ID:        uuid.New(),
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
			CreatedBy: teacherID,
		},
		InstitutionID: instID,
		TeacherID:     teacherID,
		SubjectID:     input.SubjectID,
		Title:         input.Title,
		GradeLevel:    input.GradeLevel,
		Type:          domain.QuestionTypeMixed,
	}
	return uc.questionRepo.CreatePacket(ctx, &packet)
}

func (uc *questionUsecase) UpdatePacket(ctx context.Context, id, operatorID, role string, input domain.UpdatePacketInput) error {
	packet, err := uc.questionRepo.GetPacketByID(ctx, id)
	if err != nil {
		return errors.New("paket soal tidak ditemukan")
	}

	if role == "TEACHER" && packet.TeacherID != operatorID {
		isAssigned := uc.questionRepo.IsTeacherAssignedToSubject(ctx, operatorID, packet.SubjectID)
		if !isAssigned {
			return errors.New("izin ditolak: anda bukan pembuat soal ini dan tidak mengampu mata pelajaran terkait")
		}
	}

	packet.Title = input.Title
	packet.GradeLevel = input.GradeLevel
	packet.SubjectID = input.SubjectID
	packet.UpdatedAt = time.Now()

	return uc.questionRepo.UpdatePacket(ctx, packet)
}

func (uc *questionUsecase) DeletePacket(ctx context.Context, id, operatorID, role string) error {
	packet, err := uc.questionRepo.GetPacketByID(ctx, id)
	if err != nil {
		return errors.New("paket soal tidak ditemukan")
	}

	if role == "TEACHER" && packet.TeacherID != operatorID {
		isAssigned := uc.questionRepo.IsTeacherAssignedToSubject(ctx, operatorID, packet.SubjectID)
		if !isAssigned {
			return errors.New("izin ditolak: anda bukan pembuat soal ini dan tidak mengampu mata pelajaran terkait")
		}
	}

	return uc.questionRepo.DeletePacket(ctx, id)
}

// ----------------------------------------------------------------------------
// IMPORT BATCH PAKET SOAL (HIGH-PERFORMANCE)
// ----------------------------------------------------------------------------
func (uc *questionUsecase) ImportPackets(ctx context.Context, instID, operatorID string, file multipart.File) (int, error) {
	// 1. Parsing file Excel menjadi slice struct Go
	parsedData, err := uc.importer.ParseQuestionPacketExcel(file)
	if err != nil {
		return 0, err
	}
	if len(parsedData) == 0 {
		return 0, errors.New("tidak ada data yang valid untuk diimport")
	}

	// 2. IN-MEMORY MAPPING MATA PELAJARAN
	subjects, _, _ := uc.subjectRepo.Fetch(ctx, domain.SubjectFilter{InstitutionID: instID, Limit: 10000})
	subjMap := make(map[string]string)
	for _, s := range subjects {
		subjMap[strings.ToUpper(s.Name)] = s.ID.String()
	}

	// 3. IN-MEMORY MAPPING GURU (Wali/Pembuat)
	teachers, _, _ := uc.teacherRepo.Fetch(ctx, domain.TeacherFilter{InstitutionID: instID, Limit: 10000})
	teacherMap := make(map[string]string)
	for _, t := range teachers {
		if t.Profile != nil {
			teacherMap[strings.ToUpper(t.Profile.FullName)] = t.ID.String()
		}
	}

	// 4. Proses Pencocokan (Mapping) & Persiapan Bulk Insert
	var packetsToCreate []*domain.QuestionBank
	now := time.Now()

	for _, parsed := range parsedData {
		subjID, exists := subjMap[strings.ToUpper(parsed.SubjectName)]
		if !exists {
			// Lewati baris ini jika Mapel tidak ditemukan (misal Admin memaksa ketik manual di luar dropdown)
			continue
		}

		// Tentukan siapa pemilik paketnya
		creatorID := operatorID // Default ke Admin yang upload
		if parsed.TeacherName != "" {
			if tid, tExists := teacherMap[strings.ToUpper(parsed.TeacherName)]; tExists {
				creatorID = tid
			}
		}

		packet := &domain.QuestionBank{
			BaseEntity: domain.BaseEntity{
				ID:        uuid.New(),
				CreatedAt: now,
				UpdatedAt: now,
				CreatedBy: operatorID,
			},
			InstitutionID: instID,
			TeacherID:     creatorID,
			SubjectID:     subjID,
			Title:         parsed.Title,
			GradeLevel:    strings.ToUpper(parsed.GradeLevel),
			Type:          domain.QuestionTypeMixed,
		}
		packetsToCreate = append(packetsToCreate, packet)
	}

	// 5. Eksekusi Bulk Insert ke Database (Sangat Cepat & Atomic)
	if len(packetsToCreate) > 0 {
		if err := uc.questionRepo.BulkCreatePackets(ctx, packetsToCreate); err != nil {
			return 0, err
		}
	}

	return len(packetsToCreate), nil
}

// ----------------------------------------------------------------------------
// EXPORT LAPORAN DAFTAR PAKET SOAL (TANPA BUTIR SOAL)
// ----------------------------------------------------------------------------
func (uc *questionUsecase) ExportPacketList(ctx context.Context, filter domain.QuestionFilter) (*bytes.Buffer, error) {
	// Bypass limit untuk laporan ekspor (tarik semua data)
	filter.Page = 1
	filter.Limit = 10000

	packets, _, err := uc.questionRepo.FetchPackets(ctx, filter)
	if err != nil {
		return nil, err
	}

	if len(packets) == 0 {
		return nil, errors.New("tidak ada data paket soal yang ditemukan")
	}

	return uc.exporter.GeneratePacketListExcel(packets)
}

// ----------------------------------------------------------------------------
// DOWNLOAD DYNAMIC TEMPLATE (DROPDOWN OTOMATIS)
// ----------------------------------------------------------------------------
func (uc *questionUsecase) DownloadTemplateBatch(ctx context.Context, instID string) (*bytes.Buffer, error) {
	// Tarik data Mapel, Guru, dan Kelas secara Real-Time
	subjects, _, _ := uc.subjectRepo.Fetch(ctx, domain.SubjectFilter{InstitutionID: instID, Limit: 10000})
	teachers, _, _ := uc.teacherRepo.Fetch(ctx, domain.TeacherFilter{InstitutionID: instID, Limit: 10000})
	classes, _ := uc.classRepo.Fetch(ctx, instID, domain.ClassFilter{})

	// Kirim ke Exporter beserta data Kelas untuk dicetak menjadi Excel ber-Dropdown penuh
	return uc.exporter.GenerateQuestionPacketTemplate(classes, subjects, teachers)
}

// ============================================================================
// --- IMPLEMENTASI BUTIR SOAL (ITEMS) ---
// ============================================================================

func (uc *questionUsecase) CreateItem(ctx context.Context, teacherID, instID string, input domain.CreateItemInput) error {
	parent, err := uc.questionRepo.GetPacketByID(ctx, input.ParentID)
	if err != nil {
		return errors.New("paket induk tidak ditemukan")
	}

	content := domain.QuestionContent{
		Question: input.Question,
		ImageURL: input.ImageURL,
	}

	if input.Type == domain.QuestionTypePG {
		content.Options = map[string]string{
			"A": input.OptionA,
			"B": input.OptionB,
			"C": input.OptionC,
			"D": input.OptionD,
			"E": input.OptionE,
		}
	}

	item := domain.QuestionBank{
		BaseEntity: domain.BaseEntity{
			ID:        uuid.New(),
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
			CreatedBy: teacherID,
		},
		InstitutionID: parent.InstitutionID,
		TeacherID:     parent.TeacherID,
		SubjectID:     parent.SubjectID,
		ParentID:      &input.ParentID,
		Type:          input.Type,
		Content:       content,
		AnswerKey:     strings.ToUpper(input.AnswerKey),
		ScoreWeight:   input.ScoreWeight,
	}

	return uc.questionRepo.CreateItem(ctx, &item)
}

func (uc *questionUsecase) UpdateItem(ctx context.Context, id, teacherID, role string, input domain.CreateItemInput) error {
	item, err := uc.questionRepo.GetItemByID(ctx, id)
	if err != nil {
		return errors.New("soal tidak ditemukan")
	}

	if role == "TEACHER" && item.TeacherID != teacherID {
		isAssigned := uc.questionRepo.IsTeacherAssignedToSubject(ctx, teacherID, item.SubjectID)
		if !isAssigned {
			return errors.New("izin ditolak: anda tidak mengampu mata pelajaran untuk soal ini")
		}
	}

	item.Content.Question = input.Question
	item.Content.ImageURL = input.ImageURL

	if item.Type == domain.QuestionTypePG {
		item.Content.Options = map[string]string{
			"A": input.OptionA,
			"B": input.OptionB,
			"C": input.OptionC,
			"D": input.OptionD,
			"E": input.OptionE,
		}
	}

	item.AnswerKey = strings.ToUpper(input.AnswerKey)
	item.ScoreWeight = input.ScoreWeight
	item.UpdatedAt = time.Now()

	return uc.questionRepo.UpdateItem(ctx, item)
}

func (uc *questionUsecase) DeleteItem(ctx context.Context, id, operatorID, role string) error {
	item, err := uc.questionRepo.GetItemByID(ctx, id)
	if err != nil {
		return errors.New("butir soal tidak ditemukan")
	}

	if role == "TEACHER" && item.TeacherID != operatorID {
		isAssigned := uc.questionRepo.IsTeacherAssignedToSubject(ctx, operatorID, item.SubjectID)
		if !isAssigned {
			return errors.New("izin ditolak: anda tidak mengampu mata pelajaran untuk soal ini")
		}
	}

	return uc.questionRepo.DeleteItem(ctx, id)
}

func (uc *questionUsecase) ImportQuestions(ctx context.Context, parentID string, file multipart.File) (int, error) {
	parent, err := uc.questionRepo.GetPacketByID(ctx, parentID)
	if err != nil {
		return 0, errors.New("paket induk tidak ditemukan")
	}

	f, err := excelize.OpenReader(file)
	if err != nil {
		return 0, err
	}
	defer f.Close()

	rows, err := f.GetRows(f.GetSheetList()[0])
	if err != nil || len(rows) <= 1 {
		return 0, errors.New("file kosong atau tidak valid")
	}

	successCount := 0
	parentIDStr := parent.ID.String()

	for i, row := range rows {
		if i == 0 || len(row) < 3 {
			continue
		}

		getCol := func(idx int) string {
			if idx < len(row) {
				return strings.TrimSpace(row[idx])
			}
			return ""
		}

		pertanyaan := getCol(2)
		jawaban := getCol(8)
		bobotStr := getCol(9)
		bobot, _ := strconv.ParseFloat(bobotStr, 64)

		if pertanyaan == "" || jawaban == "" {
			continue
		}

		tipeSoal := parent.Type
		if parent.Type == domain.QuestionTypeMixed {
			if getCol(3) != "" {
				tipeSoal = domain.QuestionTypePG
			} else {
				tipeSoal = domain.QuestionTypeEssay
			}
		}

		content := domain.QuestionContent{Question: pertanyaan}
		if tipeSoal == domain.QuestionTypePG {
			content.Options = map[string]string{
				"A": getCol(3),
				"B": getCol(4),
				"C": getCol(5),
				"D": getCol(6),
				"E": getCol(7),
			}
		}

		item := domain.QuestionBank{
			BaseEntity: domain.BaseEntity{
				ID:        uuid.New(),
				CreatedAt: time.Now(),
				UpdatedAt: time.Now(),
				CreatedBy: parent.TeacherID,
			},
			InstitutionID: parent.InstitutionID,
			TeacherID:     parent.TeacherID,
			SubjectID:     parent.SubjectID,
			ParentID:      &parentIDStr,
			Type:          tipeSoal,
			Content:       content,
			AnswerKey:     strings.ToUpper(jawaban),
			ScoreWeight:   bobot,
		}

		if err := uc.questionRepo.CreateItem(ctx, &item); err == nil {
			successCount++
		}
	}

	return successCount, nil
}

// ============================================================================
// --- IMPLEMENTASI EXPORT ZIP (EXCEL & PDF) ---
// ============================================================================

func (uc *questionUsecase) ExportQuestions(ctx context.Context, filter domain.QuestionFilter) (*bytes.Buffer, error) {
	packets, err := uc.questionRepo.FetchPacketsWithItems(ctx, filter)
	if err != nil {
		return nil, err
	}

	if len(packets) == 0 {
		return nil, errors.New("tidak ada data soal yang ditemukan untuk diekspor")
	}

	zipBuf := new(bytes.Buffer)
	zipWriter := zip.NewWriter(zipBuf)

	for _, packet := range packets {
		excelBuf, err := uc.exporter.GenerateQuestionExcel(packet)
		if err != nil {
			return nil, errors.New("gagal memproses excel untuk paket: " + packet.Title)
		}

		instName := "UMUM"
		if packet.Institution != nil {
			instName = packet.Institution.Name
		}
		subjName := "UMUM"
		if packet.Subject != nil {
			subjName = packet.Subject.Name
		}

		fileName := fmt.Sprintf("PAKET SOAL %s KELAS %s %s - %s.xlsx",
			strings.ToUpper(subjName), strings.ToUpper(packet.GradeLevel),
			strings.ToUpper(instName), strings.ToUpper(packet.Title),
		)

		invalidChars := []string{"/", "\\", "?", "%", "*", ":", "|", "\"", "<", ">"}
		for _, char := range invalidChars {
			fileName = strings.ReplaceAll(fileName, char, "_")
		}

		fWriter, err := zipWriter.Create(fileName)
		if err != nil {
			return nil, err
		}

		_, _ = fWriter.Write(excelBuf.Bytes())
	}

	if err := zipWriter.Close(); err != nil {
		return nil, err
	}

	return zipBuf, nil
}

func (uc *questionUsecase) ExportQuestionsPDF(ctx context.Context, filter domain.QuestionFilter) (*bytes.Buffer, error) {
	packets, err := uc.questionRepo.FetchPacketsWithItems(ctx, filter)
	if err != nil {
		return nil, err
	}

	if len(packets) == 0 {
		return nil, errors.New("tidak ada data soal yang ditemukan untuk diekspor")
	}

	zipBuf := new(bytes.Buffer)
	zipWriter := zip.NewWriter(zipBuf)

	for _, packet := range packets {
		var kopData pdf_helper.KopSuratData
		activeYearStr := "2024/2025" // Fallback aman
		assignedTeacher := ""

		if packet.Institution != nil {
			kopData = pdf_helper.KopSuratData{
				Name:          packet.Institution.Name,
				Header1:       packet.Institution.Header1,
				Header2:       packet.Institution.Header2,
				AddressDetail: packet.Institution.AddressDetail,
				AddressCity:   packet.Institution.AddressCity,
				ContactPhone:  packet.Institution.ContactPhone,
				ContactEmail:  packet.Institution.ContactEmail,
				Website:       packet.Institution.Website,
				LogoUrl:       packet.Institution.LogoUrl,
			}

			// Cek Tahun Ajaran Aktif
			ay, err := uc.academicYearRepo.GetActive(ctx, packet.InstitutionID)
			if err == nil && ay != nil {
				activeYearStr = fmt.Sprintf("%s %s", ay.Name, ay.Semester)

				// Logika Guru Pengampu
				allocFilter := domain.AllocationFilter{
					InstitutionID:  packet.InstitutionID,
					SubjectID:      packet.SubjectID,
					AcademicYearID: ay.ID.String(),
				}
				allocs, _ := uc.scheduleRepo.FetchAllocations(ctx, allocFilter)

				for _, alloc := range allocs {
					if alloc.Class != nil && strings.EqualFold(alloc.Class.Level, packet.GradeLevel) {
						if alloc.Teacher != nil {
							assignedTeacher = alloc.Teacher.FullName
							break
						}
					}
				}
			}
		} else {
			kopData = pdf_helper.KopSuratData{Name: "YAYASAN KEBAJIKAN PESANTREN"}
		}

		// Panggil Exporter
		pdfBuf, err := uc.pdfExporter.GenerateQuestionPDF(packet, kopData, activeYearStr, assignedTeacher)
		if err != nil {
			return nil, fmt.Errorf("gagal memproses paket %s: %v", packet.Title, err)
		}

		// Penamaan File
		instName := "UMUM"
		if packet.Institution != nil {
			instName = packet.Institution.Name
		}
		subjName := "UMUM"
		if packet.Subject != nil {
			subjName = packet.Subject.Name
		}

		fileName := fmt.Sprintf("PAKET SOAL %s KELAS %s %s - %s.pdf",
			strings.ToUpper(subjName), strings.ToUpper(packet.GradeLevel),
			strings.ToUpper(instName), strings.ToUpper(packet.Title),
		)

		invalidChars := []string{"/", "\\", "?", "%", "*", ":", "|", "\"", "<", ">"}
		for _, char := range invalidChars {
			fileName = strings.ReplaceAll(fileName, char, "_")
		}

		fWriter, err := zipWriter.Create(fileName)
		if err != nil {
			return nil, err
		}
		_, _ = fWriter.Write(pdfBuf.Bytes())
	}

	if err := zipWriter.Close(); err != nil {
		return nil, err
	}

	return zipBuf, nil
}
