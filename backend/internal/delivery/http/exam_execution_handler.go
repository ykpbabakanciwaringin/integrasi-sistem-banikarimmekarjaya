// LOKASI: internal/delivery/http/exam_execution_handler.go
package http

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"banikarimmekarjaya.id/cbt-backend/internal/domain"
	"banikarimmekarjaya.id/cbt-backend/pkg/utils"
)

type ExamExecutionHandler struct {
	ExamUsecase domain.ExamExecutionUsecase
}

func NewExamExecutionHandler(uc domain.ExamExecutionUsecase) *ExamExecutionHandler {
	return &ExamExecutionHandler{ExamUsecase: uc}
}

// JoinExam menangani proses masuk ke sesi ujian menggunakan Token.
// Endpoint ini divalidasi agar siswa mendapatkan akses awal ke sistem ujian.
func (h *ExamExecutionHandler) JoinExam(c *gin.Context) {
	var input struct {
		Token string `json:"token" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Token ujian wajib diisi")
		return
	}

	studentID := c.GetString("user_id")

	resp, err := h.ExamUsecase.JoinExam(c.Request.Context(), input.Token, studentID)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, err.Error())
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Berhasil masuk ke sesi ujian", resp)
}

// SubmitAnswer menangani pengiriman satu butir jawaban secara realtime.
func (h *ExamExecutionHandler) SubmitAnswer(c *gin.Context) {
	var input domain.SubmitAnswerInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Format jawaban tidak valid")
		return
	}

	input.StudentID = c.GetString("user_id")

	if err := h.ExamUsecase.SubmitAnswer(c.Request.Context(), input); err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Jawaban berhasil disimpan", nil)
}

// FinishExam memproses penyelesaian ujian secara keseluruhan.
// Fungsi ini mendukung 'Force Finish' jika dipanggil oleh petugas (mengirim StudentID di body),
// atau penyelesaian mandiri oleh siswa (mengambil ID dari token JWT).
func (h *ExamExecutionHandler) FinishExam(c *gin.Context) {
	var input struct {
		SessionID string `json:"session_id" binding:"required"`
		StudentID string `json:"student_id"` // Opsional, diisi jika dipaksa selesai oleh petugas
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "ID Sesi wajib disertakan")
		return
	}

	// Deteksi Otoritas: Ambil dari token jika input StudentID kosong
	targetStudentID := input.StudentID
	if targetStudentID == "" {
		targetStudentID = c.GetString("user_id")
	}

	result, err := h.ExamUsecase.FinishExam(c.Request.Context(), input.SessionID, targetStudentID)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Seluruh rangkaian ujian telah selesai", result)
}
