// LOKASI: internal/usecase/exam_event_usecase.go
package usecase

import (
	"bytes"
	"context"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"math"
	"os"
	"strings"
	"time"

	"banikarimmekarjaya.id/cbt-backend/internal/domain"
	"banikarimmekarjaya.id/cbt-backend/pkg/utils"
)

type examEventUsecase struct {
	repo domain.ExamEventRepository
}

// [PERBAIKAN] Tidak perlu menyuntikkan Exporter di sini, karena data kartu (JSON)
// akan di-generate PDF-nya di sisi Frontend (menggunakan komponen react ReactToPrint)
func NewExamEventUsecase(r domain.ExamEventRepository) domain.ExamEventUsecase {
	return &examEventUsecase{
		repo: r,
	}
}

func (uc *examEventUsecase) CreateEvent(ctx context.Context, instID string, input domain.CreateEventInput) error {
	start, errStart := utils.ParseWIB(time.RFC3339, input.StartDate)
	end, errEnd := utils.ParseWIB(time.RFC3339, input.EndDate)

	if errStart != nil || errEnd != nil {
		return errors.New("format tanggal tidak valid, pastikan menggunakan format RFC3339")
	}

	isActive := true // Default
	if input.IsActive != nil {
		isActive = *input.IsActive
	}

	isSeb := false // Default
	if input.IsSEBRequired != nil {
		isSeb = *input.IsSEBRequired
	}

	status := "DRAFT"
	if input.Status != "" {
		status = input.Status
	}

	event := &domain.ExamEvent{
		InstitutionID: instID,
		Title:         input.Title,
		Description:   input.Description,
		StartDate:     start,
		EndDate:       end,
		RoomCount:     input.RoomCount,    // Memasukkan Jumlah Ruangan
		SubjectCount:  input.SubjectCount, // Memasukkan Batas Maksimal Mapel
		IsActive:      isActive,
		IsSEBRequired: isSeb,
		Status:        status,
	}
	return uc.repo.CreateEvent(ctx, event)
}

func (uc *examEventUsecase) UpdateEvent(ctx context.Context, id string, input domain.CreateEventInput) error {
	event, err := uc.repo.GetEventByID(ctx, id)
	if err != nil {
		return err
	}

	start, errStart := utils.ParseWIB(time.RFC3339, input.StartDate)
	end, errEnd := utils.ParseWIB(time.RFC3339, input.EndDate)

	if errStart != nil || errEnd != nil {
		return errors.New("format tanggal tidak valid, pastikan menggunakan format RFC3339")
	}

	event.Title = input.Title
	event.Description = input.Description
	event.StartDate = start
	event.EndDate = end

	if input.RoomCount >= 1 {
		event.RoomCount = input.RoomCount
	}
	if input.SubjectCount >= 1 {
		event.SubjectCount = input.SubjectCount
	}
	if input.Status != "" {
		event.Status = input.Status
	}

	if input.IsActive != nil {
		event.IsActive = *input.IsActive
	}
	if input.IsSEBRequired != nil {
		event.IsSEBRequired = *input.IsSEBRequired
	}

	return uc.repo.UpdateEvent(ctx, event)
}

func (uc *examEventUsecase) GetEvents(ctx context.Context, filter domain.EventFilter) ([]domain.ExamEvent, int64, int, error) {
	events, total, err := uc.repo.FetchEvents(ctx, filter)
	if err != nil {
		return nil, 0, 0, err
	}
	totalPages := int(math.Ceil(float64(total) / float64(filter.Limit)))
	return events, total, totalPages, nil
}

func (uc *examEventUsecase) GetEventDetail(ctx context.Context, id string) (*domain.ExamEvent, error) {
	return uc.repo.GetEventByID(ctx, id)
}

func (uc *examEventUsecase) DeleteEvent(ctx context.Context, id string) error {
	return uc.repo.DeleteEvent(ctx, id)
}

func (uc *examEventUsecase) GenerateSEBConfig(ctx context.Context, id string) (*bytes.Buffer, error) {
	_, err := uc.repo.GetEventByID(ctx, id)
	if err != nil {
		return nil, errors.New("kegiatan ujian tidak ditemukan")
	}

	appURL := ""
	clientOrigin, ok := ctx.Value("client_origin").(string)
	if ok && clientOrigin != "" && strings.HasPrefix(clientOrigin, "http") {
		appURL = clientOrigin
	}

	if appURL == "" {
		appURL = os.Getenv("FRONTEND_APP_URL")
		if appURL == "" {
			appURL = "https://banikarimmekarjaya.id"
		}
	}

	quitPassword := "ExitUjian"
	hash := sha256.Sum256([]byte(quitPassword))
	hashedQuitPassword := hex.EncodeToString(hash[:])

	sebTemplate := `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE plist PUBLIC "-//Apple Computer//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <dict>
    <key>originatorVersion</key>
    <string>SEB_OSX_2.3.2_33E0</string>
    <key>startURL</key>
    <string>%s</string>
    <key>hashedQuitPassword</key>
    <string>%s</string>
    <key>enableQuitButton</key>
    <true/>
    <key>allowQuit</key>
    <true/>
    <key>sendBrowserExamKey</key>
    <true/>
    <key>browserExamKey</key>
    <string>e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855</string>
    <key>showMenuBar</key>
    <true/>
    <key>showTaskBar</key>
    <true/>
    <key>allowPreferencesWindow</key>
    <false/>
  </dict>
</plist>`

	filledTemplate := fmt.Sprintf(sebTemplate, appURL, hashedQuitPassword)
	return bytes.NewBufferString(filledTemplate), nil
}

// =========================================================================================
// [FITUR BARU] MENGIRIM DATA KARTU UJIAN LEVEL KEGIATAN KE FRONTEND
// =========================================================================================
func (uc *examEventUsecase) DownloadEventExamCards(ctx context.Context, eventID string) ([]map[string]interface{}, error) {
	// Pastikan kegiatannya ada
	_, err := uc.repo.GetEventByID(ctx, eventID)
	if err != nil {
		return nil, errors.New("kegiatan ujian tidak ditemukan")
	}

	// Panggil fungsi penyaring (DISTINCT) dari Repository
	return uc.repo.FetchEventCardData(ctx, eventID)
}
