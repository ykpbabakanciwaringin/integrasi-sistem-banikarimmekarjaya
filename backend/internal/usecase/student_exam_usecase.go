// LOKASI: internal/usecase/student_exam_usecase.go
package usecase

import (
	"context"
	"encoding/base64"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"sync" // [PEMBARUAN] Diperlukan untuk mekanisme Mutex Lock
	"time"

	"github.com/google/uuid"
	"ykpbabakanciwaringin.id/cbt-backend/internal/domain"
	"ykpbabakanciwaringin.id/cbt-backend/pkg/utils"
)

type studentExamUsecase struct {
	repo        domain.StudentExamRepository
	examRepo    domain.ExamExecutionRepository
	finishLocks sync.Map // [PEMBARUAN] Satpam memori untuk mencegah double-click
}

func NewStudentExamUsecase(r domain.StudentExamRepository, er domain.ExamExecutionRepository) domain.StudentExamUsecase {
	return &studentExamUsecase{
		repo:     r,
		examRepo: er,
		// finishLocks otomatis diinisialisasi sebagai map kosong oleh Golang
	}
}

// [PEMBARUAN] Menambahkan targetSubtestID agar siswa bisa berpindah mapel
func (uc *studentExamUsecase) StartAndDownloadExam(ctx context.Context, token, studentID, targetSubtestID string) (*domain.StudentExamBundle, error) {
	session, err := uc.examRepo.GetActiveSessionByToken(ctx, token)
	if err != nil {
		return nil, errors.New("Sesi ujian tidak ditemukan atau sedang DIJEDA")
	}

	_, participant, err := uc.repo.VerifyStudentAccess(ctx, session.ID.String(), studentID)
	if err != nil {
		return nil, errors.New("Anda tidak terdaftar dalam sesi ujian ini")
	}

	if participant.Status == "BLOCKED" {
		return nil, errors.New("Akses Ditolak: Anda diblokir oleh pengawas ruangan")
	}

	now := utils.NowWIB()
	if now.After(session.EndTime) {
		return nil, errors.New("Waktu ujian telah berakhir")
	}

	// 1. Merakit Informasi Daftar Mapel (Meta Data) & Menentukan Mapel Aktif
	var subtestInfos []domain.SubtestInfo
	var activeSubtest *domain.ParticipantSubtest

	for i := range participant.Subtests {
		st := participant.Subtests[i]
		subjName := "Mata Pelajaran"
		if st.QuestionBank != nil {
			subjName = st.QuestionBank.Title
			if st.QuestionBank.Subject != nil {
				subjName = st.QuestionBank.Subject.Name
			}
		}

		info := domain.SubtestInfo{
			ID:          st.ID,
			SubjectName: subjName,
			OrderNum:    st.OrderNum,
			DurationMin: st.DurationMin,
			Status:      st.Status,
			StartedAt:   st.StartedAt,
		}
		subtestInfos = append(subtestInfos, info)

		// Pemilihan Mapel Aktif (Jika diminta oleh Frontend, atau otomatis ambil yang pertama belum selesai)
		if targetSubtestID != "" && st.ID == targetSubtestID {
			activeSubtest = &participant.Subtests[i]
		} else if targetSubtestID == "" && activeSubtest == nil && st.Status != "FINISHED" {
			activeSubtest = &participant.Subtests[i]
		}
	}

	if activeSubtest == nil {
		_ = uc.repo.UpdateParticipantState(ctx, session.ID.String(), studentID, "FINISHED")
		return nil, errors.New("Anda telah menyelesaikan seluruh mata pelajaran dalam sesi ini. Terima kasih.")
	}

	// 2. Set Status Mapel Aktif menjadi ONGOING jika masih LOCKED
	if activeSubtest.Status == "LOCKED" {
		if err := uc.repo.SetSubtestOngoing(ctx, activeSubtest.ID); err != nil {
			return nil, errors.New("Gagal membuka mata pelajaran")
		}
		activeSubtest.Status = "ONGOING"
		nowPtr := now
		activeSubtest.StartedAt = &nowPtr
	}

	// 3. Kalkulasi Sisa Waktu (Hybrid: Per-Mapel atau Global)
	timeRemaining := int(session.EndTime.Sub(now).Seconds())
	if activeSubtest.DurationMin > 0 && activeSubtest.StartedAt != nil {
		mapelEndTime := activeSubtest.StartedAt.Add(time.Duration(activeSubtest.DurationMin) * time.Minute)
		mapelRemaining := int(mapelEndTime.Sub(now).Seconds())
		if mapelRemaining < timeRemaining {
			timeRemaining = mapelRemaining
		}
	}

	if timeRemaining <= 0 {
		return nil, errors.New("Waktu pengerjaan untuk mata pelajaran ini telah habis")
	}

	// 4. Tarik Soal khusus untuk Mapel Aktif saja (Menghemat RAM)
	rawQuestions, err := uc.repo.GetQuestionsForStudent(ctx, activeSubtest.QuestionBankID)
	if err != nil {
		return nil, errors.New("Gagal memuat bank soal")
	}

	var questions []domain.StudentQuestionItem
	for i, q := range rawQuestions {
		questions = append(questions, domain.StudentQuestionItem{
			ID:       q.ID.String(),
			Type:     q.Type,
			Content:  q.Content,
			OrderNum: i + 1,
		})
	}

	// 5. Tarik Jawaban Sebelumnya
	savedAnswers, _ := uc.examRepo.GetAnswersBySession(ctx, session.ID.String(), studentID)
	lastAnswersMap := make(map[string]string)
	for _, ans := range savedAnswers {
		lastAnswersMap[ans.QuestionID] = ans.AnswerGiven
	}

	// Update status peserta induk jika baru mulai
	if participant.Status == "REGISTERED" || participant.Status == "READY" {
		_ = uc.repo.UpdateParticipantState(ctx, session.ID.String(), studentID, "WORKING")
	}

	activeSubjName := "Mata Pelajaran"
	if activeSubtest.QuestionBank != nil {
		activeSubjName = activeSubtest.QuestionBank.Title
	}

	isSEBRequired, _ := uc.repo.GetSEBStatusBySession(ctx, session.ID.String())

	return &domain.StudentExamBundle{
		SessionID:       session.ID.String(),
		Title:           session.Title,
		SessionEnd:      session.EndTime,
		IsSEBRequired:   isSEBRequired,
		Status:          participant.Status,
		Subtests:        subtestInfos,
		ActiveSubtestID: activeSubtest.ID,
		ActiveSubject:   activeSubjName,
		TimeRemaining:   timeRemaining,
		Questions:       questions,
		LastAnswers:     lastAnswersMap,
	}, nil
}

// [PEMBARUAN] Menyertakan SubtestID pada proses simpan jawaban (Auto-Save)
func (uc *studentExamUsecase) SyncBulkAnswers(ctx context.Context, studentID string, input domain.BulkSubmitAnswerInput) error {
	var answers []domain.StudentAnswer
	for _, a := range input.Answers {
		answers = append(answers, domain.StudentAnswer{
			ExamSessionID:        input.SessionID,
			StudentID:            studentID,
			QuestionID:           a.QuestionID,
			ParticipantSubtestID: a.SubtestID, // Menyimpan relasi spesifik mapel
			AnswerGiven:          a.Answer,
		})
	}
	return uc.repo.BulkSaveAnswers(ctx, input.SessionID, studentID, answers)
}

func (uc *studentExamUsecase) HeartbeatPing(ctx context.Context, studentID string, input domain.ExamHeartbeatInput) (*domain.ExamHeartbeatResponse, error) {
	ctxTimeout, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	session, participant, err := uc.repo.VerifyStudentAccess(ctxTimeout, input.SessionID, studentID)
	if err != nil {
		return nil, err
	}

	ipVal := ctx.Value("client_ip")
	currentIP, ok := ipVal.(string)
	if !ok || currentIP == "" {
		currentIP = participant.IPAddress
	}

	if participant.IPAddress != "" && participant.IPAddress != currentIP {
		_ = uc.repo.UpdateParticipantState(ctxTimeout, input.SessionID, studentID, "BLOCKED")
		return &domain.ExamHeartbeatResponse{
			Action:  "BLOCK",
			Message: "Akses dari jaringan/perangkat berbeda terdeteksi. Sesi disekat.",
		}, nil
	}

	if currentIP != "" {
		_ = uc.repo.UpdateParticipantActivity(ctxTimeout, input.SessionID, studentID, currentIP)
	}

	if input.SnapshotBase64 != "" {
		b64data := input.SnapshotBase64
		idx := strings.Index(b64data, ";base64,")
		if idx != -1 {
			b64data = b64data[idx+8:]
		}

		decData, err := base64.StdEncoding.DecodeString(b64data)
		if err == nil {
			uploadDir := "./static/uploads/monitoring"
			os.MkdirAll(uploadDir, os.ModePerm)

			fileName := fmt.Sprintf("%s_%s_%s.jpg", studentID[:8], input.SessionID[:8], uuid.New().String()[:6])
			savePath := filepath.Join(uploadDir, fileName)

			if err := os.WriteFile(savePath, decData, 0644); err == nil {
				vLog := domain.ExamViolationLog{
					ExamSessionID: input.SessionID,
					StudentID:     studentID,
					ViolationType: input.ViolationType,
					SnapshotUrl:   "/uploads/monitoring/" + fileName,
				}
				_ = uc.repo.LogViolation(ctxTimeout, vLog)
			}
		}
	}

	if participant.Status == "BLOCKED" {
		return &domain.ExamHeartbeatResponse{
			Action:  "BLOCK",
			Message: "Akses Anda telah diblokir oleh pengawas.",
		}, nil
	}

	now := utils.NowWIB()
	timeRemaining := int(session.EndTime.Sub(now).Seconds())

	if timeRemaining <= 0 {
		_ = uc.repo.UpdateParticipantState(ctxTimeout, input.SessionID, studentID, "FINISHED")
		return &domain.ExamHeartbeatResponse{
			Action:  "FORCE_SUBMIT",
			Message: "Waktu ujian telah habis!",
		}, nil
	}

	if input.ViolationCount >= 3 {
		_ = uc.repo.UpdateParticipantState(ctxTimeout, input.SessionID, studentID, "BLOCKED")
		return &domain.ExamHeartbeatResponse{
			Action:  "BLOCK",
			Message: "Pelanggaran keamanan terdeteksi berkali-kali. Sesi diblokir.",
		}, nil
	}

	return &domain.ExamHeartbeatResponse{
		Action:        "CONTINUE",
		TimeRemaining: timeRemaining,
	}, nil
}

func (uc *studentExamUsecase) GetHistory(ctx context.Context, studentID string) ([]domain.StudentExamHistoryResponse, error) {
	ctxTimeout, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()
	return uc.repo.GetStudentHistory(ctxTimeout, studentID)
}

// [PEMBARUAN] FinishExam bertindak sebagai Penilai Otomatis (Auto-Grader) di Memori Usecase dengan pengaman anti-spam
func (uc *studentExamUsecase) FinishExam(ctx context.Context, sessionID, studentID, subtestID string) error {
	// [PEMBARUAN TAHAP 2] Mekanisme Penguncian (Mutex/Lock) Anti Double-Click
	// Kunci dibuat unik berdasarkan Kombinasi Sesi + Siswa + Mapel
	lockKey := fmt.Sprintf("%s:%s:%s", sessionID, studentID, subtestID)

	// Coba masukkan gembok. Jika sudah ada (loaded == true), tolak klik kedua dan seterusnya.
	if _, loaded := uc.finishLocks.LoadOrStore(lockKey, true); loaded {
		return errors.New("Sistem sedang memproses nilai Anda, mohon tunggu sebentar.")
	}
	// Pastikan gembok dilepas ketika proses penilaian selesai (berhasil maupun error)
	defer uc.finishLocks.Delete(lockKey)

	// 1. Tarik Data Peserta & Subtes
	_, participant, err := uc.repo.VerifyStudentAccess(ctx, sessionID, studentID)
	if err != nil {
		return err
	}

	var activeSubtest *domain.ParticipantSubtest
	var allFinishedAfterThis = true
	var totalSesiScore float64 = 0

	for i := range participant.Subtests {
		st := &participant.Subtests[i]
		if st.ID == subtestID && st.Status != "FINISHED" {
			activeSubtest = st
		}

		// Lakukan kalkulasi pengecekan status akhir
		if st.ID != subtestID {
			totalSesiScore += st.Score
			if st.Status != "FINISHED" {
				allFinishedAfterThis = false
			}
		}
	}

	// 2. Jika Subtes Valid, Lakukan Penilaian Otomatis
	if activeSubtest != nil {
		// Tarik kunci jawaban secara kilat ke memori
		keyMap, err := uc.repo.GetAnswerKeysByQuestionBank(ctx, activeSubtest.QuestionBankID)
		if err != nil {
			return errors.New("Gagal menarik skema penilaian")
		}

		// Tarik jawaban riil siswa
		studentAnswers, err := uc.examRepo.GetAnswersBySession(ctx, sessionID, studentID)
		if err != nil {
			return errors.New("Gagal menarik jawaban siswa")
		}

		// Hitung Skor
		var subtestScore float64 = 0
		for _, ans := range studentAnswers {
			// Hanya koreksi jawaban milik mapel ini saja
			if key, ok := keyMap[ans.QuestionID]; ok {
				if key.AnswerKey != "" && ans.AnswerGiven == key.AnswerKey {
					subtestScore += key.ScoreWeight
				}
			}
		}

		// Kunci hasil mapel ke dalam database
		err = uc.repo.UpdateSubtestScoreAndFinish(ctx, subtestID, subtestScore)
		if err != nil {
			return errors.New("Gagal mengunci nilai mata pelajaran")
		}

		totalSesiScore += subtestScore
	}

	// 3. Cek Apakah Ini Mapel Terakhir? Jika Ya, Kunci Sesi Secara Menyeluruh
	if allFinishedAfterThis {
		finalAvg := totalSesiScore
		if len(participant.Subtests) > 0 {
			finalAvg = totalSesiScore / float64(len(participant.Subtests)) // Rata-rata dari semua mapel
		}

		err = uc.repo.UpdateParticipantFinalScoreAndFinish(ctx, sessionID, studentID, finalAvg)
		if err != nil {
			return errors.New("Gagal menyelesaikan sesi ujian secara keseluruhan")
		}
	}

	return nil
}
