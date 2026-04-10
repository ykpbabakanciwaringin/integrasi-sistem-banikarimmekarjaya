// LOKASI: internal/usecase/exam_session_usecase.go
package usecase

import (
	"archive/zip"
	"bytes"
	"context"
	"crypto/rand"
	"errors"
	"fmt"
	"io"
	"math"
	"math/big"
	"mime/multipart"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"

	"ykpbabakanciwaringin.id/cbt-backend/internal/domain"
	"ykpbabakanciwaringin.id/cbt-backend/internal/service/exporter"
	"ykpbabakanciwaringin.id/cbt-backend/pkg/utils"
	"ykpbabakanciwaringin.id/cbt-backend/pkg/utils/pdf_helper"
)

type examSessionUsecase struct {
	repo            domain.ExamSessionRepository
	questionRepo    domain.QuestionRepository
	studentRepo     domain.StudentRepository
	teacherRepo     domain.TeacherRepository
	eventRepo       domain.ExamEventRepository
	pdfExporter     exporter.ExamResultPdfExporter
	sessionExporter exporter.ExamSessionExporter
}

func NewExamSessionUsecase(
	r domain.ExamSessionRepository,
	qr domain.QuestionRepository,
	sr domain.StudentRepository,
	tr domain.TeacherRepository,
	er domain.ExamEventRepository,
	p exporter.ExamResultPdfExporter,
	s exporter.ExamSessionExporter,
) domain.ExamSessionUsecase {
	return &examSessionUsecase{
		repo:            r,
		questionRepo:    qr,
		studentRepo:     sr,
		teacherRepo:     tr,
		eventRepo:       er,
		pdfExporter:     p,
		sessionExporter: s,
	}
}

func (uc *examSessionUsecase) CreateSession(ctx context.Context, teacherID, instID string, input domain.CreateSessionInput) error {
	start, err := utils.ParseWIB("2006-01-02 15:04", input.StartTime)
	if err != nil {
		start, _ = utils.ParseWIB(time.RFC3339, input.StartTime)
	}
	end, err := utils.ParseWIB("2006-01-02 15:04", input.EndTime)
	if err != nil {
		end, _ = utils.ParseWIB(time.RFC3339, input.EndTime)
	}

	session := &domain.ExamSession{
		ExamEventID:   input.ExamEventID,
		InstitutionID: instID,
		Title:         input.Title,
		Token:         input.Token,
		StartTime:     start,
		EndTime:       end,
		DurationMin:   input.DurationMin,
		SubjectList:   input.SubjectList, // [PERBAIKAN] Menggunakan string langsung
	}

	if err := uc.repo.CreateSession(ctx, session); err != nil {
		return err
	}

	// [PERBAIKAN] Memanggil ManageProctors yang sudah mendukung Supervisor & Proctor
	return uc.ManageProctors(ctx, session.ID.String(), input.SupervisorIDs, input.ProctorIDs)
}

func (uc *examSessionUsecase) GetTeacherSessions(ctx context.Context, filter domain.SessionFilter) ([]domain.ExamSession, int64, int, error) {
	sessions, total, err := uc.repo.FetchSessions(ctx, filter)
	if err != nil {
		return nil, 0, 0, err
	}
	totalPages := int(math.Ceil(float64(total) / float64(filter.Limit)))
	return sessions, total, totalPages, nil
}

func (uc *examSessionUsecase) GetSessionDetail(ctx context.Context, sessionID string) (*domain.ExamSession, error) {
	return uc.repo.GetSessionByID(ctx, sessionID)
}

func (uc *examSessionUsecase) UpdateSession(ctx context.Context, id string, input domain.CreateSessionInput) error {
	session, err := uc.repo.GetSessionByID(ctx, id)
	if err != nil {
		return err
	}

	if session.IsActive {
		return errors.New("akses ditolak: tidak dapat mengubah jadwal aktif")
	}

	start, err := utils.ParseWIB("2006-01-02 15:04", input.StartTime)
	if err != nil {
		start, _ = utils.ParseWIB(time.RFC3339, input.StartTime)
	}
	end, err := utils.ParseWIB("2006-01-02 15:04", input.EndTime)
	if err != nil {
		end, _ = utils.ParseWIB(time.RFC3339, input.EndTime)
	}

	session.Title = input.Title
	session.Token = input.Token
	session.StartTime = start
	session.EndTime = end
	session.DurationMin = input.DurationMin
	session.SubjectList = input.SubjectList // [PERBAIKAN]

	if err := uc.repo.UpdateSession(ctx, session); err != nil {
		return err
	}

	uc.repo.ClearProctors(ctx, id) // Fungsi ini harus membersihkan baik Pengawas maupun Proktor di DB
	return uc.ManageProctors(ctx, id, input.SupervisorIDs, input.ProctorIDs)
}

func (uc *examSessionUsecase) DeleteSession(ctx context.Context, id string) error {
	session, err := uc.repo.GetSessionByID(ctx, id)
	if err != nil {
		return err
	}
	if session.IsActive {
		return errors.New("akses ditolak: tidak dapat menghapus jadwal aktif")
	}
	return uc.repo.DeleteSession(ctx, id)
}

func (uc *examSessionUsecase) StopSession(ctx context.Context, id string) error {
	return uc.repo.UpdateSessionStatus(ctx, id, false)
}

func (uc *examSessionUsecase) ResumeSession(ctx context.Context, id string) error {
	return uc.repo.UpdateSessionStatus(ctx, id, true)
}

func (uc *examSessionUsecase) FetchParticipants(ctx context.Context, sessionID string, filter domain.ParticipantFilter) ([]domain.ExamParticipant, int64, *domain.ParticipantStats, error) {
	participants, total, err := uc.repo.FetchParticipants(ctx, sessionID, filter)
	if err != nil {
		return nil, 0, nil, err
	}
	stats, err := uc.repo.GetParticipantStats(ctx, sessionID)
	if err != nil {
		return nil, 0, nil, err
	}
	return participants, total, stats, nil
}

func (uc *examSessionUsecase) GetSessionParticipants(ctx context.Context, sessionID, userID, role string, filter domain.ParticipantFilter) ([]domain.ExamParticipant, int64, *domain.ParticipantStats, error) {
	if role == "TEACHER" {
		session, err := uc.repo.GetSessionByID(ctx, sessionID)
		if err != nil {
			return nil, 0, nil, errors.New("sesi tidak ditemukan")
		}

		isAuthorized := false
		// Cek apakah guru adalah Pengawas
		for _, sp := range session.Supervisors {
			if sp.TeacherID == userID {
				isAuthorized = true
				break
			}
		}
		// Cek apakah guru adalah Proktor
		if !isAuthorized {
			for _, pr := range session.Proctors {
				if pr.TeacherID == userID {
					isAuthorized = true
					break
				}
			}
		}

		if !isAuthorized {
			return nil, 0, nil, errors.New("AKSES DITOLAK: Anda tidak memiliki wewenang memantau/mengelola peserta di sesi ujian ini")
		}
	}

	participants, total, err := uc.repo.FetchParticipants(ctx, sessionID, filter)
	if err != nil {
		return nil, 0, nil, err
	}

	stats, err := uc.repo.GetParticipantStats(ctx, sessionID)
	if err != nil {
		return nil, 0, nil, err
	}

	return participants, total, stats, nil
}

func (uc *examSessionUsecase) AddParticipant(ctx context.Context, sessionID string, input domain.AddParticipantInput) error {
	var qbID *string
	if input.QuestionBankID != "" && input.QuestionBankID != "empty" {
		qbID = &input.QuestionBankID
	}

	var subtests []domain.ParticipantSubtest
	orderNum := 1

	if len(input.QuestionBankIDs) > 0 {
		for _, id := range input.QuestionBankIDs {
			if id != "" && id != "empty" {
				subtests = append(subtests, domain.ParticipantSubtest{
					QuestionBankID: id,
					OrderNum:       orderNum,
					Status:         "LOCKED", // Secara default terkunci saat baru didaftarkan
				})
				orderNum++
			}
		}
	} else if qbID != nil {
		// Fallback sistem lama (Jika UI frontend belum mengirim array)
		subtests = append(subtests, domain.ParticipantSubtest{
			QuestionBankID: *qbID,
			OrderNum:       1,
			Status:         "LOCKED",
		})
	}

	p := &domain.ExamParticipant{
		ExamSessionID: sessionID,
		StudentID:     input.StudentID,
		ExamNumber:    input.ExamNumber,
		// [PERBAIKAN FASE 1]: Menghapus baris QuestionBankID: qbID dari sini
		Status:   "REGISTERED",
		Subtests: subtests, // Inject subtes yang telah dirakit
	}
	return uc.repo.RegisterParticipant(ctx, p)
}

func (uc *examSessionUsecase) AddBulkParticipants(ctx context.Context, sessionID string, input domain.AddBulkParticipantsInput) error {
	var participants []domain.ExamParticipant
	timePrefix := utils.NowWIB().Format("05.000")

	var qbID *string
	if input.QuestionBankID != "" && input.QuestionBankID != "empty" {
		qbID = &input.QuestionBankID
	}

	// [PEMBAHARUAN FASE 2] Setup kerangka dasar Subtes
	var baseSubtests []domain.ParticipantSubtest
	orderNum := 1
	if len(input.QuestionBankIDs) > 0 {
		for _, id := range input.QuestionBankIDs {
			if id != "" && id != "empty" {
				baseSubtests = append(baseSubtests, domain.ParticipantSubtest{
					QuestionBankID: id,
					OrderNum:       orderNum,
					Status:         "LOCKED",
				})
				orderNum++
			}
		}
	} else if qbID != nil {
		baseSubtests = append(baseSubtests, domain.ParticipantSubtest{
			QuestionBankID: *qbID,
			OrderNum:       1,
			Status:         "LOCKED",
		})
	}

	for _, sid := range input.StudentIDs {
		shortSid := sid
		if len(sid) >= 4 {
			shortSid = sid[:4]
		}
		examNum := "EXM-" + timePrefix + "-" + shortSid

		// Mengkloning data Subtes agar memori pointer terpisah untuk setiap siswa
		clonedSubtests := make([]domain.ParticipantSubtest, len(baseSubtests))
		copy(clonedSubtests, baseSubtests)

		participants = append(participants, domain.ExamParticipant{
			ExamSessionID: sessionID,
			StudentID:     sid,
			ExamNumber:    examNum,
			// [PERBAIKAN FASE 1]: Menghapus baris QuestionBankID: qbID dari sini
			Status:   "REGISTERED",
			Subtests: clonedSubtests,
		})
	}

	if len(participants) > 0 {
		return uc.repo.RegisterBulkParticipants(ctx, participants)
	}
	return nil
}

func (uc *examSessionUsecase) RemoveParticipant(ctx context.Context, sessionID, studentID string) error {
	return uc.repo.DeleteParticipant(ctx, sessionID, studentID)
}

// [PERBAIKAN] Menangani penugasan Supervisor DAN Proctor sekaligus
func (uc *examSessionUsecase) ManageProctors(ctx context.Context, sessionID string, supervisorIDs []string, proctorIDs []string) error {
	var supervisors []domain.ExamSupervisor
	var proctors []domain.ExamProctor

	for _, tid := range supervisorIDs {
		supervisors = append(supervisors, domain.ExamSupervisor{
			ExamSessionID: sessionID,
			TeacherID:     tid,
		})
	}

	for _, tid := range proctorIDs {
		proctors = append(proctors, domain.ExamProctor{
			ExamSessionID: sessionID,
			TeacherID:     tid,
		})
	}

	// [PERHATIAN] Anda harus memperbarui fungsi di exam_session_repo.go Anda
	// untuk menerima dua array ini. (AssignProctors(ctx, supervisors, proctors))
	return uc.repo.AssignProctors(ctx, supervisors, proctors)
}

func (uc *examSessionUsecase) BulkUploadPhotos(fileHeader *multipart.FileHeader) (int, []string, error) {
	src, err := fileHeader.Open()
	if err != nil {
		return 0, nil, errors.New("gagal membuka file zip yang diunggah")
	}
	defer src.Close()

	fileBytes, err := io.ReadAll(src)
	if err != nil {
		return 0, nil, errors.New("gagal membaca isi file zip")
	}

	zipReader, err := zip.NewReader(bytes.NewReader(fileBytes), int64(len(fileBytes)))
	if err != nil {
		return 0, nil, errors.New("file tidak valid, pastikan berekstensi .zip")
	}

	uploadDir := "./static/uploads/students"
	if err := os.MkdirAll(uploadDir, os.ModePerm); err != nil {
		return 0, nil, errors.New("gagal membuat folder penyimpanan di server")
	}

	successCount := 0
	var errorLogs []string

	for _, f := range zipReader.File {
		if f.FileInfo().IsDir() || strings.Contains(f.Name, "__MACOSX") || strings.HasPrefix(filepath.Base(f.Name), "._") {
			continue
		}

		ext := strings.ToLower(filepath.Ext(f.Name))
		if ext != ".jpg" && ext != ".jpeg" && ext != ".png" {
			continue
		}

		rawName := filepath.Base(f.Name)
		for {
			extTmp := filepath.Ext(rawName)
			if extTmp == "" {
				break
			}
			rawName = strings.TrimSuffix(rawName, extTmp)
		}
		identifier := rawName

		rc, err := f.Open()
		if err != nil {
			errorLogs = append(errorLogs, fmt.Sprintf("Gagal ekstrak: %s", f.Name))
			continue
		}

		newFileName := fmt.Sprintf("%s_%d%s", uuid.New().String(), time.Now().Unix(), ext)
		savePath := filepath.Join(uploadDir, newFileName)

		dst, err := os.Create(savePath)
		if err != nil {
			rc.Close()
			continue
		}

		io.Copy(dst, rc)
		dst.Close()
		rc.Close()

		dbPath := "/uploads/students/" + newFileName
		err = uc.repo.UpdateStudentPhoto(context.Background(), identifier, dbPath)
		if err != nil {
			errorLogs = append(errorLogs, fmt.Sprintf("Foto %s diabaikan: %s", f.Name, err.Error()))
			continue
		}

		successCount++
	}

	if successCount == 0 {
		return 0, errorLogs, errors.New("tidak ada foto yang berhasil disinkronkan")
	}

	return successCount, errorLogs, nil
}

func (uc *examSessionUsecase) GeneratePhotoReferenceExcel(ctx context.Context, sessionID string) (*bytes.Buffer, error) {
	filter := domain.ParticipantFilter{BaseFilter: domain.BaseFilter{Limit: 10000, Page: 1}}
	participants, _, _, err := uc.FetchParticipants(ctx, sessionID, filter)
	if err != nil {
		return nil, err
	}
	return uc.sessionExporter.GeneratePhotoReferenceExcel(participants)
}

func (uc *examSessionUsecase) DownloadBeritaAcaraPDF(ctx context.Context, sessionID string) (*bytes.Buffer, string, error) {
	session, err := uc.repo.GetSessionByID(ctx, sessionID)
	if err != nil {
		return nil, "", err
	}

	participants, _, err := uc.repo.FetchParticipants(ctx, sessionID, domain.ParticipantFilter{
		BaseFilter: domain.BaseFilter{Limit: 5000},
	})
	if err != nil {
		return nil, "", err
	}

	var kopData pdf_helper.KopSuratData
	if session.Institution != nil {
		kopData = pdf_helper.KopSuratData{
			Name:          session.Institution.Name,
			Header1:       session.Institution.Header1,
			Header2:       session.Institution.Header2,
			AddressDetail: session.Institution.AddressDetail,
			AddressCity:   session.Institution.AddressCity,
			ContactPhone:  session.Institution.ContactPhone,
			ContactEmail:  session.Institution.ContactEmail,
			Website:       session.Institution.Website,
			LogoUrl:       session.Institution.LogoUrl,
		}
	}

	buf, err := uc.pdfExporter.GenerateBeritaAcaraPDF(*session, participants, kopData)
	if err != nil {
		return nil, "", err
	}

	safeTitle := strings.ReplaceAll(session.Title, " ", "_")
	filename := fmt.Sprintf("Berita_Acara_Ujian_%s.pdf", safeTitle)

	return buf, filename, nil
}

func (uc *examSessionUsecase) ExportSessionsExcel(ctx context.Context, filter domain.SessionFilter) (*bytes.Buffer, error) {
	filter.Limit = 10000
	filter.Page = 1
	sessions, _, err := uc.repo.FetchSessions(ctx, filter)
	if err != nil {
		return nil, err
	}
	return uc.sessionExporter.GenerateSessionScheduleExcel(sessions)
}

func (uc *examSessionUsecase) ExportSessionsPDF(ctx context.Context, filter domain.SessionFilter) (*bytes.Buffer, error) {
	filter.Limit = 10000
	filter.Page = 1
	sessions, _, err := uc.repo.FetchSessions(ctx, filter)
	if err != nil {
		return nil, err
	}

	var kopData pdf_helper.KopSuratData
	if len(sessions) > 0 && sessions[0].Institution != nil {
		inst := sessions[0].Institution
		kopData = pdf_helper.KopSuratData{
			Name:          inst.Name,
			Header1:       inst.Header1,
			Header2:       inst.Header2,
			AddressDetail: inst.AddressDetail,
			AddressCity:   inst.AddressCity,
			ContactPhone:  inst.ContactPhone,
			ContactEmail:  inst.ContactEmail,
			Website:       inst.Website,
			LogoUrl:       inst.LogoUrl,
		}
	}

	return uc.sessionExporter.GenerateSessionSchedulePDF(sessions, kopData)
}

func (uc *examSessionUsecase) GetParticipantsForCards(ctx context.Context, sessionID string) ([]map[string]interface{}, error) {
	return uc.repo.FetchCardData(ctx, sessionID)
}

func (uc *examSessionUsecase) DownloadExamCards(ctx context.Context, sessionID string) ([]map[string]interface{}, error) {
	return uc.repo.FetchCardData(ctx, sessionID)
}

func (uc *examSessionUsecase) ResetParticipantLogin(ctx context.Context, sessionID string, studentID string) error {
	return uc.repo.UpdateParticipantStatus(ctx, sessionID, studentID, "REGISTERED")
}

func (uc *examSessionUsecase) ToggleBlockParticipant(ctx context.Context, sessionID string, studentID string) error {
	p, err := uc.repo.GetParticipant(ctx, sessionID, studentID)
	if err != nil {
		return errors.New("data peserta tidak ditemukan")
	}
	newStatus := "BLOCKED"
	if p.Status == "BLOCKED" {
		newStatus = "REGISTERED"
	}
	return uc.repo.UpdateParticipantStatus(ctx, sessionID, studentID, newStatus)
}

func generateRandomPassword() string {
	const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
	result := make([]byte, 6)
	for i := range result {
		num, _ := rand.Int(rand.Reader, big.NewInt(int64(len(chars))))
		result[i] = chars[num.Int64()]
	}
	return string(result)
}

func (uc *examSessionUsecase) GenerateNewPassword(ctx context.Context, studentID string) error {
	plainPassword := generateRandomPassword()
	hashedBytes, err := bcrypt.GenerateFromPassword([]byte(plainPassword), bcrypt.DefaultCost)
	if err != nil {
		return errors.New("gagal mengenkripsi sandi baru")
	}
	return uc.repo.UpdateStudentPassword(ctx, studentID, string(hashedBytes), plainPassword)
}

func (uc *examSessionUsecase) GenerateBulkNewPassword(ctx context.Context, sessionID string, studentIDs []string) error {
	for _, studentID := range studentIDs {
		plainPassword := generateRandomPassword()
		hashedBytes, err := bcrypt.GenerateFromPassword([]byte(plainPassword), bcrypt.DefaultCost)
		if err != nil {
			continue
		}
		uc.repo.UpdateStudentPassword(ctx, studentID, string(hashedBytes), plainPassword)
	}
	return nil
}

func (uc *examSessionUsecase) DownloadParticipantTemplate(ctx context.Context, sessionID string) (*bytes.Buffer, error) {
	session, err := uc.repo.GetSessionByID(ctx, sessionID)
	if err != nil {
		return nil, errors.New("sesi ujian tidak ditemukan")
	}

	filterQ := domain.QuestionFilter{
		InstitutionID: session.InstitutionID,
		Limit:         10000,
		Page:          1,
	}
	packets, _, err := uc.questionRepo.FetchPackets(ctx, filterQ)
	if err != nil {
		return nil, errors.New("gagal memuat referensi bank soal")
	}

	filterS := domain.StudentFilter{
		InstitutionID: session.InstitutionID,
		Limit:         10000,
		Page:          1,
	}
	students, _, err := uc.studentRepo.Fetch(ctx, filterS)
	if err != nil {
		return nil, errors.New("gagal memuat data siswa untuk auto-fill")
	}

	// [PERBAIKAN]: Menarik batas jumlah mata pelajaran dari relasi ExamEvent
	subjectCount := 1
	if session.ExamEvent != nil && session.ExamEvent.SubjectCount > 0 {
		subjectCount = session.ExamEvent.SubjectCount
	}

	return uc.sessionExporter.GenerateParticipantTemplate(session.Title, subjectCount, packets, students)
}
