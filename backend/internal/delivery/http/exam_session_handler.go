// LOKASI: internal/delivery/http/exam_session_handler.go
package http

import (
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"ykpbabakanciwaringin.id/cbt-backend/internal/domain"
	"ykpbabakanciwaringin.id/cbt-backend/pkg/utils"
)

type ExamSessionHandler struct {
	ExamUsecase domain.ExamSessionUsecase
}

func NewExamSessionHandler(uc domain.ExamSessionUsecase) *ExamSessionHandler {
	return &ExamSessionHandler{ExamUsecase: uc}
}

// ---------------------------------------------------------
// 1. MANAJEMEN SESI (CRUD)
// ---------------------------------------------------------

func (h *ExamSessionHandler) CreateSession(c *gin.Context) {
	instID := c.GetString("institution_id")
	teacherID := c.GetString("user_id")
	var input domain.CreateSessionInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Format data tidak valid: "+err.Error())
		return
	}
	if instID == "" {
		instID = input.InstitutionID
	}
	if instID == "" {
		utils.ErrorResponse(c, http.StatusBadRequest, "Lembaga (institution_id) tidak boleh kosong")
		return
	}
	if err := h.ExamUsecase.CreateSession(c.Request.Context(), teacherID, instID, input); err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}
	utils.SuccessResponse(c, http.StatusCreated, "Jadwal sesi berhasil dibuat", nil)
}

func (h *ExamSessionHandler) GetSessions(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	filter := domain.SessionFilter{
		BaseFilter: domain.BaseFilter{
			Page: page, Limit: limit, Search: c.Query("search"), SortBy: c.Query("sort_by"), SortOrder: c.Query("sort_order"),
		},
		UserID: c.GetString("user_id"), Role: c.GetString("role"), InstitutionID: c.Query("institution_id"), ExamEventID: c.Query("exam_event_id"), Status: c.Query("status"),
	}
	sessions, total, totalPages, err := h.ExamUsecase.GetTeacherSessions(c.Request.Context(), filter)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal mengambil data jadwal ujian: "+err.Error())
		return
	}
	utils.SuccessResponse(c, http.StatusOK, "Daftar sesi berhasil diambil", gin.H{
		"list": sessions, "total": total, "total_pages": totalPages, "page": page, "limit": limit,
	})
}

func (h *ExamSessionHandler) GetSessionDetail(c *gin.Context) {
	id := c.Param("id")
	session, err := h.ExamUsecase.GetSessionDetail(c.Request.Context(), id)
	if err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Data sesi ujian tidak ditemukan")
		return
	}
	utils.SuccessResponse(c, http.StatusOK, "Detail sesi berhasil diambil", session)
}

func (h *ExamSessionHandler) UpdateSession(c *gin.Context) {
	id := c.Param("id")
	var input domain.CreateSessionInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Format pembaruan data tidak valid")
		return
	}
	if err := h.ExamUsecase.UpdateSession(c.Request.Context(), id, input); err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}
	utils.SuccessResponse(c, http.StatusOK, "Data sesi ujian berhasil diperbarui", nil)
}

func (h *ExamSessionHandler) DeleteSession(c *gin.Context) {
	id := c.Param("id")
	if err := h.ExamUsecase.DeleteSession(c.Request.Context(), id); err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}
	utils.SuccessResponse(c, http.StatusOK, "Sesi ujian telah dihapus secara permanen", nil)
}

// ---------------------------------------------------------
// 2. KONTROL SESI (STOP/RESUME)
// ---------------------------------------------------------

func (h *ExamSessionHandler) StopSession(c *gin.Context) {
	id := c.Param("id")
	if err := h.ExamUsecase.StopSession(c.Request.Context(), id); err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}
	utils.SuccessResponse(c, http.StatusOK, "Sesi ujian berhasil dihentikan (DIJEDA)", nil)
}

func (h *ExamSessionHandler) ResumeSession(c *gin.Context) {
	id := c.Param("id")
	if err := h.ExamUsecase.ResumeSession(c.Request.Context(), id); err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}
	utils.SuccessResponse(c, http.StatusOK, "Sesi ujian berhasil dilanjutkan", nil)
}

// ---------------------------------------------------------
// 3. MANAJEMEN PESERTA & PETUGAS
// ---------------------------------------------------------

func (h *ExamSessionHandler) GetSessionParticipants(c *gin.Context) {
	sessionID := c.Param("id")
	userID, role := c.GetString("user_id"), c.GetString("role")
	filter := domain.ParticipantFilter{
		BaseFilter: domain.BaseFilter{
			Search: c.Query("search"), Page: utils.GetIntQuery(c, "page", 1), Limit: utils.GetIntQuery(c, "limit", 10),
			SortBy: c.Query("sort_by"), SortOrder: c.Query("sort_order"),
		},
		Status: strings.ToUpper(c.Query("status")), Gender: c.Query("gender"), ClassID: c.Query("class_id"),
	}
	participants, total, stats, err := h.ExamUsecase.GetSessionParticipants(c.Request.Context(), sessionID, userID, role, filter)
	if err != nil {
		code := http.StatusInternalServerError
		if strings.Contains(err.Error(), "AKSES DITOLAK") {
			code = http.StatusForbidden
		}
		utils.ErrorResponse(c, code, err.Error())
		return
	}
	totalPages := int((total + int64(filter.Limit) - 1) / int64(filter.Limit))
	utils.SuccessResponse(c, http.StatusOK, "Daftar peserta berhasil dimuat", gin.H{
		"list": participants, "stats": stats, "total": total, "total_pages": totalPages, "page": filter.Page,
	})
}

func (h *ExamSessionHandler) AddParticipant(c *gin.Context) {
	id := c.Param("id")
	var input domain.AddParticipantInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Format data tidak valid")
		return
	}
	if err := h.ExamUsecase.AddParticipant(c.Request.Context(), id, input); err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}
	utils.SuccessResponse(c, http.StatusOK, "Peserta berhasil ditambahkan", nil)
}

func (h *ExamSessionHandler) AddBulkParticipants(c *gin.Context) {
	id := c.Param("id")
	var input domain.AddBulkParticipantsInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Format data tidak valid")
		return
	}
	if err := h.ExamUsecase.AddBulkParticipants(c.Request.Context(), id, input); err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}
	utils.SuccessResponse(c, http.StatusOK, "Seluruh peserta berhasil ditambahkan", nil)
}

func (h *ExamSessionHandler) RemoveParticipant(c *gin.Context) {
	sessionID, studentID := c.Param("id"), c.Param("studentId")
	if err := h.ExamUsecase.RemoveParticipant(c.Request.Context(), sessionID, studentID); err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}
	utils.SuccessResponse(c, http.StatusOK, "Peserta telah dihapus", nil)
}

func (h *ExamSessionHandler) AssignProctors(c *gin.Context) {
	id := c.Param("id")
	var input struct {
		SupervisorIDs []string `json:"supervisor_ids"`
		ProctorIDs    []string `json:"proctor_ids"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Data petugas tidak valid")
		return
	}
	if err := h.ExamUsecase.ManageProctors(c.Request.Context(), id, input.SupervisorIDs, input.ProctorIDs); err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}
	utils.SuccessResponse(c, http.StatusOK, "Petugas berhasil diperbarui", nil)
}

// ---------------------------------------------------------
// 4. RESET & GENERATE KREDENSIAL (FUNGSI YANG TADI TERHAPUS)
// ---------------------------------------------------------

func (h *ExamSessionHandler) GenerateNewPassword(c *gin.Context) {
	studentID := c.Param("studentId")
	if err := h.ExamUsecase.GenerateNewPassword(c.Request.Context(), studentID); err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}
	utils.SuccessResponse(c, http.StatusOK, "Sandi baru berhasil dibuat secara acak", nil)
}

func (h *ExamSessionHandler) GenerateBulkNewPassword(c *gin.Context) {
	sessionID := c.Param("id")
	var input struct {
		StudentIDs []string `json:"student_ids" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Daftar siswa wajib diisi")
		return
	}
	if err := h.ExamUsecase.GenerateBulkNewPassword(c.Request.Context(), sessionID, input.StudentIDs); err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}
	utils.SuccessResponse(c, http.StatusOK, "Sandi massal berhasil diperbarui", nil)
}

func (h *ExamSessionHandler) ResetStudentLogin(c *gin.Context) {
	sessionID, studentID := c.Param("id"), c.Param("studentId")
	if err := h.ExamUsecase.ResetParticipantLogin(c.Request.Context(), sessionID, studentID); err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}
	utils.SuccessResponse(c, http.StatusOK, "Sesi login siswa telah direset", nil)
}

func (h *ExamSessionHandler) ToggleBlockStudent(c *gin.Context) {
	sessionID, studentID := c.Param("id"), c.Param("studentId")
	if err := h.ExamUsecase.ToggleBlockParticipant(c.Request.Context(), sessionID, studentID); err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}
	utils.SuccessResponse(c, http.StatusOK, "Status akses siswa diperbarui", nil)
}

// ---------------------------------------------------------
// 5. IMPORT & EXPORT DATA MASSAL
// ---------------------------------------------------------

func (h *ExamSessionHandler) ImportSessions(c *gin.Context) {
	eventID := c.Param("id")
	instID := c.GetString("institution_id")
	if instID == "" {
		instID = c.PostForm("institution_id")
	}

	file, err := c.FormFile("file")
	if err != nil {
		// Format error standar Anda
		utils.ErrorResponse(c, http.StatusBadRequest, "File Excel diperlukan untuk proses import")
		return
	}

	count, errLogs, err := h.ExamUsecase.ImportSessionsFromExcel(c.Request.Context(), eventID, instID, file)

	if err != nil {
		// [PERBAIKAN]: Kita kirim respons khusus jika terdapat detail error (errLogs)
		if len(errLogs) > 0 {
			c.JSON(http.StatusBadRequest, gin.H{
				"status":        "error",
				"message":       "Gagal memproses file Excel. Harap periksa kolom yang ditunjukkan:",
				"detail_errors": errLogs,
			})
			return
		}

		// Jika errLogs kosong tapi tetap ada error umum (misal: "data excel kosong")
		utils.ErrorResponse(c, http.StatusBadRequest, err.Error())
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Berhasil mengimpor jadwal sesi", gin.H{"count": count})
}

func (h *ExamSessionHandler) ImportParticipants(c *gin.Context) {
	sessionID := c.Param("id")
	file, err := c.FormFile("file")
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "File Excel diperlukan")
		return
	}
	count, err := h.ExamUsecase.ImportParticipants(c.Request.Context(), sessionID, file)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}
	utils.SuccessResponse(c, http.StatusOK, "Import peserta berhasil", gin.H{"processed": count})
}

func (h *ExamSessionHandler) BulkUploadPhotos(c *gin.Context) {
	file, err := c.FormFile("file")
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "File ZIP diperlukan")
		return
	}
	count, logs, err := h.ExamUsecase.BulkUploadPhotos(file)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}
	utils.SuccessResponse(c, http.StatusOK, "Upload foto selesai", gin.H{"count": count, "errors": logs})
}

// ---------------------------------------------------------
// 6. DOWNLOAD DOKUMEN & EXPORT (FUNGSI YANG TADI TERHAPUS)
// ---------------------------------------------------------

func (h *ExamSessionHandler) DownloadExamCards(c *gin.Context) {
	id := c.Param("id")
	data, err := h.ExamUsecase.DownloadExamCards(c.Request.Context(), id)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal memproses data kartu")
		return
	}
	utils.SuccessResponse(c, http.StatusOK, "Data kartu berhasil ditarik", data)
}

func (h *ExamSessionHandler) DownloadPhotoReference(c *gin.Context) {
	id := c.Param("id")
	buf, err := h.ExamUsecase.GeneratePhotoReferenceExcel(c.Request.Context(), id)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}
	c.Header("Content-Disposition", "attachment; filename=Acuan_Foto.xlsx")
	c.Header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
	c.Data(http.StatusOK, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", buf.Bytes())
}

func (h *ExamSessionHandler) ExportSessionsExcel(c *gin.Context) {
	eventID := c.Param("id")
	filter := domain.SessionFilter{
		ExamEventID: eventID, InstitutionID: c.GetString("institution_id"), Role: c.GetString("role"), UserID: c.GetString("user_id"),
	}
	buf, err := h.ExamUsecase.ExportSessionsExcel(c.Request.Context(), filter)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}
	c.Header("Content-Disposition", `attachment; filename="Data_Sesi.xlsx"`)
	c.Header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
	c.Data(http.StatusOK, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", buf.Bytes())
}

func (h *ExamSessionHandler) ExportSessionsPDF(c *gin.Context) {
	eventID := c.Param("id")
	filter := domain.SessionFilter{
		ExamEventID: eventID, InstitutionID: c.GetString("institution_id"), Role: c.GetString("role"), UserID: c.GetString("user_id"),
	}
	buf, err := h.ExamUsecase.ExportSessionsPDF(c.Request.Context(), filter)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}
	c.Header("Content-Disposition", `attachment; filename="Data_Sesi.pdf"`)
	c.Header("Content-Type", "application/pdf")
	c.Data(http.StatusOK, "application/pdf", buf.Bytes())
}

func (h *ExamSessionHandler) DownloadBeritaAcaraPDF(c *gin.Context) {
	id := c.Param("id")
	buf, filename, err := h.ExamUsecase.DownloadBeritaAcaraPDF(c.Request.Context(), id)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal mencetak PDF: "+err.Error())
		return
	}
	c.Header("Content-Disposition", fmt.Sprintf(`attachment; filename="%s"`, filename))
	c.Header("Content-Type", "application/pdf")
	c.Data(http.StatusOK, "application/pdf", buf.Bytes())
}

func (h *ExamSessionHandler) DownloadParticipantTemplate(c *gin.Context) {
	id := c.Param("id")
	buf, err := h.ExamUsecase.DownloadParticipantTemplate(c.Request.Context(), id)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}
	c.Header("Content-Disposition", "attachment; filename=Template_Peserta.xlsx")
	c.Header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
	c.Data(http.StatusOK, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", buf.Bytes())
}
