// LOKASI: internal/usecase/exam_session_import.go
package usecase

import (
	"context"
	"errors"
	"fmt"
	"mime/multipart"
	"strconv"
	"strings"
	"time"

	"github.com/xuri/excelize/v2"
	"banikarimmekarjaya.id/cbt-backend/internal/domain"
	"banikarimmekarjaya.id/cbt-backend/pkg/utils"
)

// =========================================================================================
// HELPER: Mencegah error "index out of range" jika ada kolom excel yang terpotong
// =========================================================================================
func getColSafe(row []string, idx int) string {
	if idx >= 0 && idx < len(row) {
		return strings.TrimSpace(row[idx])
	}
	return ""
}

// =========================================================================================
// KHUSUS MENANGANI IMPORT JADWAL SESI VIA EXCEL (FASE 4 - DYNAMIC COLUMN DETECTION)
// =========================================================================================

func (uc *examSessionUsecase) ImportSessionsFromExcel(ctx context.Context, eventID string, instID string, fileHeader *multipart.FileHeader) (int, []string, error) {
	// 1. Tarik Data Event
	_, err := uc.eventRepo.GetEventByID(ctx, eventID)
	if err != nil {
		return 0, nil, errors.New("gagal menemukan data kegiatan ujian")
	}

	// 2. Buka File Excel
	file, err := fileHeader.Open()
	if err != nil {
		return 0, nil, errors.New("gagal membuka file excel")
	}
	defer file.Close()

	f, err := excelize.OpenReader(file)
	if err != nil {
		return 0, nil, errors.New("format file excel tidak didukung")
	}
	defer f.Close()

	sheet := f.GetSheetName(0)
	rows, err := f.GetRows(sheet)
	if err != nil || len(rows) < 2 {
		return 0, nil, errors.New("data excel kosong atau format tidak valid")
	}

	// 3. Tarik Referensi Guru
	teachers, _, _ := uc.teacherRepo.Fetch(ctx, domain.TeacherFilter{InstitutionID: instID, Limit: 10000})
	teacherMap := make(map[string]string)
	for _, t := range teachers {
		teacherMap[strings.TrimSpace(strings.ToLower(t.GetFullName()))] = t.ID.String()
	}

	var errorsList []string
	var sessionsToInsert []domain.ExamSession

	// ==================================================================================
	// DETEKSI KOLOM DINAMIS BERDASARKAN HEADER BARIS PERTAMA
	// ==================================================================================
	headers := rows[0]

	idxSesi, idxTanggal, idxMulai, idxSelesai, idxDurasi, idxKeterangan := -1, -1, -1, -1, -1, -1
	var idxPengawas, idxProktor, idxMapel []int

	for i, h := range headers {
		hUpper := strings.ToUpper(strings.TrimSpace(h))

		if strings.Contains(hUpper, "NAMA_SESI") {
			idxSesi = i
		} else if strings.Contains(hUpper, "TANGGAL") {
			idxTanggal = i
		} else if strings.Contains(hUpper, "JAM_MULAI") {
			idxMulai = i
		} else if strings.Contains(hUpper, "JAM_SELESAI") {
			idxSelesai = i
		} else if strings.Contains(hUpper, "DURASI") {
			idxDurasi = i
		} else if strings.Contains(hUpper, "KETERANGAN") {
			idxKeterangan = i
		} else if strings.HasPrefix(hUpper, "PENGAWAS_") {
			idxPengawas = append(idxPengawas, i)
		} else if strings.HasPrefix(hUpper, "PROKTOR_") {
			idxProktor = append(idxProktor, i)
		} else if strings.HasPrefix(hUpper, "MAPEL_") {
			idxMapel = append(idxMapel, i)
		}
	}

	// Validasi jika header sangat kacau atau salah template
	if idxSesi == -1 || idxTanggal == -1 || len(idxMapel) == 0 {
		return 0, nil, errors.New("format judul kolom (header) Excel tidak sesuai dengan template standar (pastikan baris pertama memuat NAMA_SESI, TANGGAL, MAPEL_1, dll)")
	}

	// 4. Proses Ekstraksi Baris demi Baris
	for i := 1; i < len(rows); i++ {
		row := rows[i]
		rowNum := i + 1

		title := getColSafe(row, idxSesi)

		// Graceful Parsing: Abaikan jika Nama Sesi kosong atau tersangkut judul "NAMA SESI"
		if title == "" || strings.Contains(strings.ToUpper(title), "NAMA_SESI") {
			continue
		}

		dateStr := getColSafe(row, idxTanggal)
		startStr := getColSafe(row, idxMulai)
		endStr := getColSafe(row, idxSelesai)
		durationStr := getColSafe(row, idxDurasi)
		description := getColSafe(row, idxKeterangan)

		var rowErrors []string

		if dateStr == "" {
			rowErrors = append(rowErrors, "Kolom TANGGAL kosong")
		}
		if startStr == "" {
			rowErrors = append(rowErrors, "Kolom JAM MULAI kosong")
		}
		if endStr == "" {
			rowErrors = append(rowErrors, "Kolom JAM SELESAI kosong")
		}
		if durationStr == "" {
			rowErrors = append(rowErrors, "Kolom DURASI MENIT kosong")
		}

		var duration int
		if durationStr != "" {
			var errDur error
			duration, errDur = strconv.Atoi(durationStr)
			if errDur != nil || duration <= 0 {
				rowErrors = append(rowErrors, "Kolom DURASI MENIT harus berupa angka valid")
			}
		}

		var start, end time.Time
		if dateStr != "" && startStr != "" && endStr != "" {
			cleanDateStr := strings.ReplaceAll(dateStr, "/", "-")
			fullStartStr := fmt.Sprintf("%s %s", cleanDateStr, startStr)
			fullEndStr := fmt.Sprintf("%s %s", cleanDateStr, endStr)

			layouts := []string{"2006-01-02 15:04", "1-2-2006 15:04", "01-02-2006 15:04", "02-01-2006 15:04", "2-1-2006 15:04"}
			var errStart, errEnd error

			for _, layout := range layouts {
				start, errStart = utils.ParseWIB(layout, fullStartStr)
				if errStart == nil {
					break
				}
			}
			for _, layout := range layouts {
				end, errEnd = utils.ParseWIB(layout, fullEndStr)
				if errEnd == nil {
					break
				}
			}

			if errStart != nil {
				rowErrors = append(rowErrors, fmt.Sprintf("Format waktu salah pada JAM MULAI ('%s')", startStr))
			}
			if errEnd != nil {
				rowErrors = append(rowErrors, fmt.Sprintf("Format waktu salah pada JAM SELESAI ('%s')", endStr))
			}
		}

		autoToken := strings.ToUpper(utils.GenerateRandomString(6))

		// EKSTRAK PENGAWAS SECARA DINAMIS
		var supervisors []domain.ExamSupervisor
		for _, colIdx := range idxPengawas {
			namaPengawas := getColSafe(row, colIdx)
			if namaPengawas != "" && namaPengawas != "-" {
				if teacherID, exists := teacherMap[strings.ToLower(namaPengawas)]; exists {
					supervisors = append(supervisors, domain.ExamSupervisor{TeacherID: teacherID})
				} else {
					rowErrors = append(rowErrors, fmt.Sprintf("Pengawas '%s' tidak terdaftar dalam sistem", namaPengawas))
				}
			}
		}

		// EKSTRAK PROKTOR SECARA DINAMIS
		var proctors []domain.ExamProctor
		for _, colIdx := range idxProktor {
			namaProktor := getColSafe(row, colIdx)
			if namaProktor != "" && namaProktor != "-" {
				if teacherID, exists := teacherMap[strings.ToLower(namaProktor)]; exists {
					proctors = append(proctors, domain.ExamProctor{TeacherID: teacherID})
				} else {
					rowErrors = append(rowErrors, fmt.Sprintf("Proktor '%s' tidak terdaftar dalam sistem", namaProktor))
				}
			}
		}

		// EKSTRAK MATA PELAJARAN SECARA DINAMIS
		var mapelList []string
		for _, colIdx := range idxMapel {
			namaMapel := getColSafe(row, colIdx)
			if namaMapel != "" && namaMapel != "-" {
				mapelList = append(mapelList, namaMapel)
			}
		}

		if len(mapelList) == 0 {
			rowErrors = append(rowErrors, "Minimal satu MATA PELAJARAN harus diisi")
		}

		// Jika ada error di baris ini, gabungkan dan catat ke errorsList
		if len(rowErrors) > 0 {
			errorsList = append(errorsList, fmt.Sprintf("Baris %d: %s", rowNum, strings.Join(rowErrors, "; ")))
			continue // Lanjut evaluasi baris berikutnya
		}

		gabunganMapel := strings.Join(mapelList, ", ")
		if description != "" {
			gabunganMapel += " | " + description
		}

		sessionsToInsert = append(sessionsToInsert, domain.ExamSession{
			ExamEventID:   eventID,
			InstitutionID: instID,
			Title:         title,
			Token:         autoToken,
			StartTime:     start,
			EndTime:       end,
			DurationMin:   duration,
			SubjectList:   gabunganMapel,
			IsActive:      true,
			Supervisors:   supervisors,
			Proctors:      proctors,
		})
	}

	if len(errorsList) > 0 {
		return 0, errorsList, errors.New("terdapat data yang tidak sesuai format")
	}
	if len(sessionsToInsert) == 0 {
		return 0, nil, errors.New("tidak ada data jadwal valid untuk diimpor")
	}

	if err := uc.repo.CreateBulkSessions(ctx, sessionsToInsert); err != nil {
		return 0, nil, fmt.Errorf("gagal menyimpan massal: %v", err)
	}
	return len(sessionsToInsert), nil, nil
}

// =========================================================================================
// [PEMBAHARUAN FASE 4] IMPORT DATA PESERTA MULTI-MAPEL
// =========================================================================================

func (uc *examSessionUsecase) ImportParticipants(ctx context.Context, sessionID string, file *multipart.FileHeader) (int, error) {
	src, err := file.Open()
	if err != nil {
		return 0, errors.New("gagal membuka file excel")
	}
	defer src.Close()

	f, err := excelize.OpenReader(src)
	if err != nil {
		return 0, errors.New("gagal membaca file excel")
	}
	defer f.Close()

	sheetMap := f.GetSheetMap()
	sheetName := sheetMap[1]
	rows, err := f.GetRows(sheetName)
	if err != nil || len(rows) < 2 {
		return 0, errors.New("file excel kosong atau format tidak sesuai template")
	}

	session, err := uc.repo.GetSessionByID(ctx, sessionID)
	if err != nil {
		return 0, errors.New("sesi ujian tidak ditemukan")
	}

	subjectCount := 1
	if session.ExamEvent != nil && session.ExamEvent.SubjectCount > 0 {
		subjectCount = session.ExamEvent.SubjectCount
	}
	expectedCols := 6 + subjectCount // 6 kolom dasar + jumlah kolom mapel

	filter := domain.QuestionFilter{InstitutionID: session.InstitutionID, Limit: 10000}
	packets, _, _ := uc.questionRepo.FetchPackets(ctx, filter)

	qbMap := make(map[string]string)
	for _, p := range packets {
		qbMap[strings.TrimSpace(p.Title)] = p.ID.String()
	}

	var usernames []string
	userQbIDsMap := make(map[string][]string)
	examNumMap := make(map[string]string)

	for i, row := range rows {
		if i == 0 {
			continue
		}

		for len(row) < expectedCols {
			row = append(row, "")
		}

		customExamNum := strings.TrimSpace(row[1])
		username := strings.TrimSpace(row[5])

		if username != "" && username != "-" {
			usernames = append(usernames, username)

			if customExamNum != "" && customExamNum != "-" {
				examNumMap[username] = customExamNum
			}

			// --- PROSES PEMINDAIAN KOLOM DINAMIS (MULTI-MAPEL) ---
			var foundIDs []string
			for colIdx := 6; colIdx < 6+subjectCount; colIdx++ {
				paketName := strings.TrimSpace(row[colIdx])
				if paketName != "" && paketName != "-" {
					if id, exists := qbMap[paketName]; exists {
						foundIDs = append(foundIDs, id)
					}
				}
			}
			userQbIDsMap[username] = foundIDs
		}
	}

	if len(usernames) == 0 {
		return 0, errors.New("tidak ada data username valid")
	}

	studentMap, err := uc.repo.GetStudentIDsByUsernames(ctx, usernames)
	if err != nil {
		return 0, err
	}

	var participants []domain.ExamParticipant
	timePrefix := utils.NowWIB().Format("05.000")

	for _, username := range usernames {
		studentID, exists := studentMap[username]
		if !exists {
			continue
		}

		examNum := examNumMap[username]
		if examNum == "" {
			shortSid := studentID
			if len(studentID) >= 4 {
				shortSid = studentID[:4]
			}
			examNum = "EXM-" + timePrefix + "-" + shortSid
		}

		var subtests []domain.ParticipantSubtest
		qbIDs := userQbIDsMap[username]
		for idx, qid := range qbIDs {
			subtests = append(subtests, domain.ParticipantSubtest{
				QuestionBankID: qid,
				OrderNum:       idx + 1,
				Status:         "LOCKED",
			})
		}

		// [PERBAIKAN FASE 1]: Menghilangkan firstQB dan pengisian QuestionBankID
		// karena entitas Induk tidak lagi membutuhkan ID Paket tunggal.
		participants = append(participants, domain.ExamParticipant{
			ExamSessionID: sessionID,
			StudentID:     studentID,
			ExamNumber:    examNum,
			Status:        "REGISTERED",
			Subtests:      subtests,
		})
	}

	if len(participants) == 0 {
		return 0, errors.New("tidak ada data yang cocok dengan database")
	}

	if err := uc.repo.RegisterBulkParticipants(ctx, participants); err != nil {
		return 0, err
	}

	return len(participants), nil
}
