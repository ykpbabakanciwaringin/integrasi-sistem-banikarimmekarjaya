// LOKASI: internal/usecase/journal_usecase.go
package usecase

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"strconv"
	"time"

	"ykpbabakanciwaringin.id/cbt-backend/internal/domain"
	"ykpbabakanciwaringin.id/cbt-backend/internal/service/exporter"
	"ykpbabakanciwaringin.id/cbt-backend/pkg/logger"
	"ykpbabakanciwaringin.id/cbt-backend/pkg/utils/pdf_helper"
)

type journalUsecase struct {
	repo      domain.JournalRepository
	pqUsecase domain.PesantrenQuUsecase
	exporter  exporter.JournalExporter
}

func NewJournalUsecase(repo domain.JournalRepository, pqUsecase domain.PesantrenQuUsecase, exp exporter.JournalExporter) domain.JournalUsecase {
	return &journalUsecase{
		repo:      repo,
		pqUsecase: pqUsecase,
		exporter:  exp,
	}
}

func (u *journalUsecase) CreateJournal(ctx context.Context, operatorID string, input domain.CreateJournalInput) (*domain.Journal, error) {
	parsedDate, err := time.Parse("2006-01-02", input.Date)
	if err != nil {
		return nil, errors.New("format tanggal tidak valid")
	}

	journal := &domain.Journal{
		TeachingAllocationID: input.TeachingAllocationID,
		Date:                 parsedDate,
		Topic:                input.Topic,
		Description:          input.Description,
		AttachmentLink:       input.AttachmentLink,
		HasAssignment:        input.HasAssignment,
		AssignmentDetail:     input.AssignmentDetail,
		StartedAt:            input.StartedAt,
		Status:               "ONGOING",
	}

	if err := u.repo.Create(ctx, journal); err != nil {
		return nil, err
	}
	return u.repo.GetByID(ctx, journal.ID)
}

func (u *journalUsecase) GetJournals(ctx context.Context, filter domain.JournalFilter) ([]domain.Journal, error) {
	return u.repo.GetAll(ctx, filter)
}

func (u *journalUsecase) UpdateJournal(ctx context.Context, id string, input domain.UpdateJournalInput) (*domain.Journal, error) {
	journal, err := u.repo.GetByID(ctx, id)
	if err != nil {
		return nil, errors.New("jurnal tidak ditemukan")
	}

	if journal.Status == "VERIFIED" {
		return nil, errors.New("jurnal sudah diverifikasi admin dan tidak dapat diubah")
	}

	if input.Topic != "" {
		journal.Topic = input.Topic
	}
	journal.Description = input.Description
	journal.AttachmentLink = input.AttachmentLink
	journal.HasAssignment = input.HasAssignment
	journal.AssignmentDetail = input.AssignmentDetail
	if input.EndedAt != nil {
		journal.EndedAt = input.EndedAt
	}

	if err := u.repo.Update(ctx, journal); err != nil {
		return nil, err
	}
	return u.repo.GetByID(ctx, id)
}

func (u *journalUsecase) SubmitAttendances(ctx context.Context, journalID string, inputs []domain.SubmitAttendanceInput) error {
	journal, err := u.repo.GetByID(ctx, journalID)
	if err != nil {
		return errors.New("jurnal tidak ditemukan")
	}

	if journal.Status == "VERIFIED" {
		return errors.New("absensi sudah dikunci oleh verifikasi admin")
	}

	var attendances []domain.Attendance
	var studentIDs []string

	for _, in := range inputs {
		attendances = append(attendances, domain.Attendance{
			JournalID: journalID,
			StudentID: in.StudentID,
			Status:    in.Status,
			Note:      in.Note,
			Behavior:  in.Behavior,
		})
		studentIDs = append(studentIDs, in.StudentID)
	}

	if err := u.repo.SubmitAttendances(ctx, journalID, attendances); err != nil {
		return err
	}

	// Ambil Partner Key Global dari .env sebagai cadangan (Fallback)
	partnerKeyEnv := os.Getenv("PESANTRENQU_PARTNER_KEY")
	go u.syncAttendancesToPesantrenQu(context.Background(), journal, attendances, studentIDs, partnerKeyEnv)

	return nil
}

func (u *journalUsecase) syncAttendancesToPesantrenQu(ctx context.Context, journal *domain.Journal, attendances []domain.Attendance, studentIDs []string, partnerKeyEnv string) {
	// 1. Ambil Pengaturan Lembaga secara dinamis
	inst, err := u.repo.GetInstitutionSettings(ctx, journal.Allocation.InstitutionID)
	if err != nil || inst == nil {
		fmt.Println("🔴 [ThirdParty] Gagal mengambil data lembaga untuk sinkronisasi.")
		return
	}

	// 2. ⚡ GERBANG UTAMA: Jika integrasi dinonaktifkan, hentikan proses di sini
	if !inst.IsPqIntegrationEnabled {
		fmt.Printf("⚪ [ThirdParty] Integrasi PesantrenQu dinonaktifkan untuk lembaga: %s. Sinkronisasi dilewati.\n", inst.Name)
		return
	}

	// 3. Tentukan Partner Key (Gunakan key sekolah di DB jika ada, jika tidak pakai fallback .env)
	resolvedKey := inst.PqPartnerKey
	if resolvedKey == "" {
		resolvedKey = partnerKeyEnv
	}

	if resolvedKey == "" {
		fmt.Println("🔴 [ThirdParty] Gagal sinkronisasi: Partner Key tidak ditemukan baik di DB maupun .env.")
		return
	}

	nisMap, err := u.repo.GetStudentUsernames(ctx, studentIDs)
	if err != nil {
		logger.Error("[ThirdParty] Gagal mengambil NIS siswa: ", err)
		return
	}

	subjectName := "Tidak Diketahui"
	teacherName := "Tidak Diketahui"
	className := "Tidak Diketahui"

	if journal.Allocation != nil {
		if journal.Allocation.Subject != nil {
			subjectName = journal.Allocation.Subject.Name
		}
		if journal.Allocation.Teacher != nil {
			teacherName = journal.Allocation.Teacher.FullName
		}
		if journal.Allocation.Class != nil {
			className = journal.Allocation.Class.Name
		}
	}

	days := []string{"Ahad", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"}
	dayName := days[journal.Date.Weekday()]

	eventID, err := u.repo.GetEventIDForJournal(ctx, journal.TeachingAllocationID, dayName)
	if err != nil || eventID == 0 {
		fmt.Printf("🟡 [ThirdParty] Peringatan: Event ID untuk %s hari %s tidak ditemukan.\n", subjectName, dayName)
	}

	client := &http.Client{Timeout: 15 * time.Second}

	for _, att := range attendances {
		var pqStatus string
		switch att.Status {
		case "HADIR":
			pqStatus = "present"
		case "SAKIT":
			pqStatus = "sick"
		case "IZIN":
			pqStatus = "excused"
		case "ALPA":
			pqStatus = "absent"
		default:
			continue
		}

		usernameStr := nisMap[att.StudentID]
		nisInt, err := strconv.ParseInt(usernameStr, 10, 64)
		if err != nil {
			u.repo.UpdateAttendanceSyncStatus(ctx, att.ID, false, "Username bukan format angka NIS")
			continue
		}

		customSubject := fmt.Sprintf("KBM Mata pelajaran %s dengan Guru Pengampu %s", subjectName, teacherName)

		payload := domain.PQAttendanceReq{
			Status:      pqStatus,
			NIS:         nisInt,
			StatusCheck: "IN",
			EventID:     eventID,
			ForSubject:  customSubject,
			ForBuilding: className,
		}

		jsonData, _ := json.Marshal(payload)
		req, _ := http.NewRequestWithContext(ctx, "POST", "https://attendance.pesantrenqu.id/thirdparty/attendance/student", bytes.NewBuffer(jsonData))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("x-partner-key", resolvedKey)

		res, err := client.Do(req)
		if err != nil {
			u.repo.UpdateAttendanceSyncStatus(ctx, att.ID, false, err.Error())
		} else {
			bodyBytes, _ := io.ReadAll(res.Body)
			errorDetail := string(bodyBytes)
			res.Body.Close()

			if res.StatusCode == http.StatusOK || res.StatusCode == http.StatusCreated || res.StatusCode == http.StatusAccepted {
				u.repo.UpdateAttendanceSyncStatus(ctx, att.ID, true, "")
				fmt.Printf("🟢 [ThirdParty] Sukses kirim data NIS %d ke Pusat (Event ID: %d).\n", nisInt, eventID)
			} else {
				u.repo.UpdateAttendanceSyncStatus(ctx, att.ID, false, fmt.Sprintf("Code %d: %s", res.StatusCode, errorDetail))
			}
		}
	}
}

func (u *journalUsecase) VerifyJournal(ctx context.Context, journalID string, adminID string) error {
	journal, err := u.repo.GetByID(ctx, journalID)
	if err != nil {
		return errors.New("jurnal tidak ditemukan")
	}

	journal.Status = "VERIFIED"
	journal.VerifiedBy = &adminID
	journal.UpdatedAt = time.Now()

	return u.repo.Update(ctx, journal)
}

func (u *journalUsecase) GetJournalByID(ctx context.Context, id string) (*domain.Journal, error) {
	return u.repo.GetByID(ctx, id)
}

func (u *journalUsecase) DeleteJournal(ctx context.Context, id string) error {
	return u.repo.Delete(ctx, id)
}

func (u *journalUsecase) GetAttendances(ctx context.Context, journalID string) ([]domain.Attendance, error) {
	return u.repo.GetAttendances(ctx, journalID)
}

// =======================================================
// DELEGASI EXPORT KE PABRIK JURNAL (EXPORTER)
// =======================================================
func (u *journalUsecase) ExportRecap(ctx context.Context, req domain.ExportRecapRequest) (*bytes.Buffer, string, string, error) {
	filter := domain.JournalFilter{
		InstitutionID: req.InstitutionID,
		Month:         req.Month,
		Limit:         10000,
	}
	journals, err := u.repo.GetAll(ctx, filter)
	if err != nil {
		return nil, "", "", errors.New("gagal mengambil data jurnal")
	}

	holidays, _ := u.repo.GetHolidays(ctx, req.InstitutionID, req.Month)
	teacherAttendances, _ := u.repo.GetTeacherAttendances(ctx, req.InstitutionID, req.Month)

	if req.Type == "excel" {
		buf, err := u.exporter.GenerateJournalRecapExcel(req.Month, journals, holidays, teacherAttendances)
		filename := fmt.Sprintf("Rekap_Jurnal_%s.xlsx", req.Month)
		contentType := "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
		return buf, filename, contentType, err
	}

	var kopData pdf_helper.KopSuratData
	if len(journals) > 0 && journals[0].Allocation != nil && journals[0].Allocation.Institution != nil {
		inst := journals[0].Allocation.Institution
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

	buf, err := u.exporter.GenerateJournalRecapPDF(req.Month, journals, holidays, teacherAttendances, kopData)
	filename := fmt.Sprintf("Rekap_Jurnal_%s.pdf", req.Month)
	contentType := "application/pdf"
	return buf, filename, contentType, err
}

// =========================================================================
// SISTEM PEMULIHAN (RETRY SYNC)
// =========================================================================
func (u *journalUsecase) RetrySyncAttendance(ctx context.Context, journalID string) error {
	// 1. Ambil data jurnal
	journal, err := u.repo.GetByID(ctx, journalID)
	if err != nil {
		return errors.New("jurnal tidak ditemukan")
	}

	// 2. Ambil pengaturan lembaga
	instSettings, err := u.repo.GetInstitutionSettings(ctx, journal.Allocation.InstitutionID)
	if err != nil || instSettings == nil || !instSettings.IsPqIntegrationEnabled {
		return errors.New("integrasi pesantrenqu tidak aktif untuk lembaga ini")
	}

	// 3. Ambil absensi (Menggunakan nama fungsi asli Anda)
	attendances, err := u.repo.GetAttendances(ctx, journalID)
	if err != nil {
		return errors.New("gagal mengambil data absensi")
	}

	var failedAttendances []domain.Attendance
	var studentIDs []string

	// 4. Saring hanya absensi yang statusnya "Gagal Sinkron" dan kumpulkan ID Siswanya
	for _, att := range attendances {
		if !att.SyncedToThirdParty {
			failedAttendances = append(failedAttendances, att)
			studentIDs = append(studentIDs, att.StudentID)
		}
	}

	if len(failedAttendances) == 0 {
		return errors.New("semua data absensi sudah berhasil tersinkronisasi, tidak perlu retry")
	}

	// 5. Jalankan ulang sinkronisasi HANYA untuk siswa yang gagal (5 argumen)
	go u.syncAttendancesToPesantrenQu(context.Background(), journal, failedAttendances, studentIDs, instSettings.PqPartnerKey)

	return nil
}
