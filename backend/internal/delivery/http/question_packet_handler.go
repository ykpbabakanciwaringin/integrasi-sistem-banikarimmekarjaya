// LOKASI: internal/delivery/http/question_packet_handler.go
package http

import (
	"fmt"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"ykpbabakanciwaringin.id/cbt-backend/internal/domain"
)

type QuestionPacketHandler struct {
	QuestionUsecase domain.QuestionPacketUsecase
}

func NewQuestionPacketHandler(uc domain.QuestionPacketUsecase) *QuestionPacketHandler {
	return &QuestionPacketHandler{QuestionUsecase: uc}
}

// --- HELPER INTERNAL ---
// Menyelesaikan konflik hak akses: Jika Super Admin, utamakan input JSON/Query.
// Jika bukan, paksa gunakan Institution ID dari Token JWT.
func resolveInstitutionID(c *gin.Context, inputInstID string) string {
	role := c.GetString("role")
	if role == "SUPER_ADMIN" && inputInstID != "" && inputInstID != "all" {
		return inputInstID
	}
	return c.GetString("institution_id")
}

func (h *QuestionPacketHandler) GetPackets(c *gin.Context) {
	teacherID := c.GetString("user_id")
	role := c.GetString("role")

	// [PERBAIKAN]: Gunakan resolver agar filter Super Admin berfungsi
	instID := resolveInstitutionID(c, c.Query("institution_id"))

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))

	filter := domain.QuestionFilter{
		InstitutionID: instID,
		Search:        c.Query("search"),
		SubjectID:     c.Query("subject_id"),
		Page:          page,
		Limit:         limit,
	}

	if role == "TEACHER" {
		filter.TeacherID = teacherID
	}

	packets, total, err := h.QuestionUsecase.GetPackets(c.Request.Context(), filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	totalPages := int((total + int64(limit) - 1) / int64(limit))

	c.JSON(http.StatusOK, domain.PaginationResult{
		Data:       packets,
		Total:      total,
		Page:       page,
		Limit:      limit,
		TotalPages: totalPages,
	})
}

func (h *QuestionPacketHandler) GetPacketDetail(c *gin.Context) {
	id := c.Param("id")
	packet, err := h.QuestionUsecase.GetPacketDetail(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, packet)
}

func (h *QuestionPacketHandler) CreatePacket(c *gin.Context) {
	var input domain.CreatePacketInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	teacherID := c.GetString("user_id")

	// [PERBAIKAN KRUSIAL]: Mencegah Error UUID:"" dari Super Admin
	finalInstID := resolveInstitutionID(c, input.InstitutionID)

	if finalInstID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Lembaga pendidikan wajib dipilih untuk menyimpan soal"})
		return
	}

	if err := h.QuestionUsecase.CreatePacket(c.Request.Context(), teacherID, finalInstID, input); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Paket soal berhasil dibuat"})
}

func (h *QuestionPacketHandler) UpdatePacket(c *gin.Context) {
	id := c.Param("id")
	operatorID := c.GetString("user_id")
	role := c.GetString("role")

	var input domain.UpdatePacketInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.QuestionUsecase.UpdatePacket(c.Request.Context(), id, operatorID, role, input); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Paket soal berhasil diperbarui"})
}

func (h *QuestionPacketHandler) DeletePacket(c *gin.Context) {
	id := c.Param("id")
	operatorID := c.GetString("user_id")
	role := c.GetString("role")

	if err := h.QuestionUsecase.DeletePacket(c.Request.Context(), id, operatorID, role); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Paket soal dihapus"})
}

func (h *QuestionPacketHandler) ExportExcel(c *gin.Context) {
	teacherID := c.GetString("user_id")
	role := c.GetString("role")
	instID := resolveInstitutionID(c, c.Query("institution_id"))

	filter := domain.QuestionFilter{
		InstitutionID: instID,
		Search:        c.Query("search"),
		SubjectID:     c.Query("subject_id"),
	}

	if role == "TEACHER" {
		filter.TeacherID = teacherID
	}

	buf, err := h.QuestionUsecase.ExportQuestions(c.Request.Context(), filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.Header("Content-Disposition", "attachment; filename=KUMPULAN_BANK_SOAL.zip")
	c.Header("Content-Type", "application/zip")
	c.Header("Content-Length", strconv.Itoa(buf.Len()))
	c.Writer.Write(buf.Bytes())
}

func (h *QuestionPacketHandler) ExportPDF(c *gin.Context) {
	teacherID := c.GetString("user_id")
	role := c.GetString("role")
	instID := resolveInstitutionID(c, c.Query("institution_id"))

	filter := domain.QuestionFilter{
		InstitutionID: instID,
		Search:        c.Query("search"),
		SubjectID:     c.Query("subject_id"),
	}

	if role == "TEACHER" {
		filter.TeacherID = teacherID
	}

	buf, err := h.QuestionUsecase.ExportQuestionsPDF(c.Request.Context(), filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.Header("Content-Disposition", "attachment; filename=KUMPULAN_ARSIP_SOAL_LURING.zip")
	c.Header("Content-Type", "application/zip")
	c.Header("Content-Length", strconv.Itoa(buf.Len()))
	c.Writer.Write(buf.Bytes())
}

// ============================================================================
// BATCH UPLOAD & EXPORT LIST
// ============================================================================

func (h *QuestionPacketHandler) DownloadTemplateBatch(c *gin.Context) {
	instID := c.GetString("institution_id")
	// (Fitur Lanjutan) Jika Super Admin ingin download template,
	// Idealnya mengirimkan query institution_id, namun fallback aman jika kosong:
	if instID == "" {
		instID = c.Query("institution_id")
	}

	buf, err := h.QuestionUsecase.DownloadTemplateBatch(c.Request.Context(), instID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal membuat template: " + err.Error()})
		return
	}

	c.Header("Content-Disposition", `attachment; filename="Template_Paket_Soal.xlsx"`)
	c.Header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
	c.Data(http.StatusOK, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", buf.Bytes())
}

func (h *QuestionPacketHandler) ImportPackets(c *gin.Context) {
	file, _, err := c.Request.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "File excel wajib diupload"})
		return
	}
	defer file.Close()

	operatorID := c.GetString("user_id")
	instID := resolveInstitutionID(c, c.PostForm("institution_id"))

	count, err := h.QuestionUsecase.ImportPackets(c.Request.Context(), instID, operatorID, file)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal memproses file: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": fmt.Sprintf("Berhasil mengimpor %d paket soal", count),
		"count":   count,
	})
}

func (h *QuestionPacketHandler) ExportPacketList(c *gin.Context) {
	teacherID := c.GetString("user_id")
	role := c.GetString("role")
	instID := resolveInstitutionID(c, c.Query("institution_id"))

	filter := domain.QuestionFilter{
		InstitutionID: instID,
		Search:        c.Query("search"),
		SubjectID:     c.Query("subject_id"),
	}

	if role == "TEACHER" {
		filter.TeacherID = teacherID
	}

	buf, err := h.QuestionUsecase.ExportPacketList(c.Request.Context(), filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.Header("Content-Disposition", `attachment; filename="Laporan_Daftar_Paket_Soal.xlsx"`)
	c.Header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
	c.Data(http.StatusOK, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", buf.Bytes())
}
