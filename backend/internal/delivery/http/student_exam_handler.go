// LOKASI: internal/delivery/http/student_exam_handler.go
package http

import (
	"context"
	"net/http"

	"github.com/gin-gonic/gin"
	"banikarimmekarjaya.id/cbt-backend/internal/domain"
	"banikarimmekarjaya.id/cbt-backend/pkg/utils"
)

type StudentExamHandler struct {
	Usecase domain.StudentExamUsecase
}

func NewStudentExamHandler(uc domain.StudentExamUsecase) *StudentExamHandler {
	return &StudentExamHandler{Usecase: uc}
}

// StartExam menangani permintaan awal untuk masuk ke ujian atau berpindah mata pelajaran.
func (h *StudentExamHandler) StartExam(c *gin.Context) {
	var input struct {
		Token           string `json:"token" binding:"required"`
		TargetSubtestID string `json:"target_subtest_id"` // [PEMBARUAN] Diperlukan untuk navigasi antar mapel
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Token ujian wajib diisi")
		return
	}

	studentID := c.GetString("user_id")

	// [PEMBARUAN] Memanggil Usecase dengan mengirimkan TargetSubtestID
	resp, err := h.Usecase.StartAndDownloadExam(c.Request.Context(), input.Token, studentID, input.TargetSubtestID)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, err.Error())
		return
	}

	// Pesan sukses yang dinamis
	message := "Data soal berhasil dimuat"
	if resp.Status == "WAITING" {
		message = "Anda sedang dalam masa jeda antar mata pelajaran"
	}

	utils.SuccessResponse(c, http.StatusOK, message, resp)
}

// SyncAnswers untuk sinkronisasi jawaban secara berkala (Auto-save)
func (h *StudentExamHandler) SyncAnswers(c *gin.Context) {
	var input domain.BulkSubmitAnswerInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Data sinkronisasi tidak valid")
		return
	}

	studentID := c.GetString("user_id")
	err := h.Usecase.SyncBulkAnswers(c.Request.Context(), studentID, input)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, err.Error())
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Jawaban berhasil tersinkronisasi", nil)
}

// Heartbeat untuk memantau status aktif siswa dan keamanan SEB
func (h *StudentExamHandler) Heartbeat(c *gin.Context) {
	var input domain.ExamHeartbeatInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Data heartbeat tidak valid")
		return
	}

	studentID := c.GetString("user_id")
	ctx := context.WithValue(c.Request.Context(), "client_ip", c.ClientIP())

	resp, err := h.Usecase.HeartbeatPing(ctx, studentID, input)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, err.Error())
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Status pengerjaan terpantau", resp)
}

// GetHistory mengambil riwayat ujian yang pernah diikuti siswa
func (h *StudentExamHandler) GetHistory(c *gin.Context) {
	studentID := c.GetString("user_id")
	resp, err := h.Usecase.GetHistory(c.Request.Context(), studentID)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, err.Error())
		return
	}
	utils.SuccessResponse(c, http.StatusOK, "Berhasil mengambil riwayat ujian", resp)
}

// FinishExam memproses penyelesaian pengerjaan per mata pelajaran (atau sesi keseluruhan)
func (h *StudentExamHandler) FinishExam(c *gin.Context) {
	var input struct {
		SessionID string `json:"session_id" binding:"required"`
		SubtestID string `json:"subtest_id" binding:"required"` // [PEMBARUAN] Wajib ada untuk mengetahui mapel mana yang diselesaikan
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Data sesi atau mata pelajaran tidak valid")
		return
	}

	studentID := c.GetString("user_id")

	// [PEMBARUAN] Meneruskan SubtestID ke Usecase agar auto-grader bekerja spesifik di mapel tersebut
	if err := h.Usecase.FinishExam(c.Request.Context(), input.SessionID, studentID, input.SubtestID); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, err.Error())
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Mata pelajaran berhasil diselesaikan dan dikunci.", nil)
}
