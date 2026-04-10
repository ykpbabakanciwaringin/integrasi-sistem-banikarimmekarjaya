package http

import (
	"bytes"
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"banikarimmekarjaya.id/cbt-backend/internal/usecase"
)

type TemplateHandler struct {
	TemplateUsecase usecase.TemplateUsecase
}

func NewTemplateHandler(t usecase.TemplateUsecase) *TemplateHandler {
	return &TemplateHandler{TemplateUsecase: t}
}

// Helper Internal untuk Download Excel
func serveExcel(c *gin.Context, filename string, buf *bytes.Buffer) {
	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=\"%s\"", filename))
	c.Header("Content-Description", "File Transfer")
	c.Header("Content-Transfer-Encoding", "binary")
	c.Header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
	c.Header("Expires", "0")
	c.Header("Cache-Control", "must-revalidate")
	c.Header("Pragma", "public")
	c.Data(http.StatusOK, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", buf.Bytes())
}

func (h *TemplateHandler) DownloadStudentTemplate(c *gin.Context) {
	instID := c.GetString("institution_id")
	if c.GetString("role") == "SUPER_ADMIN" {
		instID = c.Query("institution_id")
	}

	if instID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Pilih lembaga terlebih dahulu untuk mengunduh template siswa."})
		return
	}

	buffer, err := h.TemplateUsecase.GenerateStudentTemplate(instID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal generate template: " + err.Error()})
		return
	}
	serveExcel(c, "Template_Siswa.xlsx", buffer)
}

func (h *TemplateHandler) DownloadTeacherTemplate(c *gin.Context) {
	instID := c.GetString("institution_id")
	if c.GetString("role") == "SUPER_ADMIN" {
		instID = c.Query("institution_id")
	}

	if instID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Pilih lembaga terlebih dahulu untuk mengunduh template guru."})
		return
	}

	buffer, err := h.TemplateUsecase.GenerateTeacherTemplate(instID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal generate template: " + err.Error()})
		return
	}
	serveExcel(c, "Template_Guru.xlsx", buffer)
}

func (h *TemplateHandler) DownloadInstitutionTemplate(c *gin.Context) {
	buffer, err := h.TemplateUsecase.GenerateInstitutionTemplate()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal generate template: " + err.Error()})
		return
	}
	serveExcel(c, "Template_Lembaga.xlsx", buffer)
}

func (h *TemplateHandler) DownloadClassTemplate(c *gin.Context) {
	isSuperAdmin := c.GetString("role") == "SUPER_ADMIN"
	instID := c.GetString("institution_id")
	if isSuperAdmin && c.Query("institution_id") != "" {
		instID = c.Query("institution_id")
	}

	buffer, err := h.TemplateUsecase.GenerateClassTemplate(isSuperAdmin, instID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal generate template: " + err.Error()})
		return
	}
	serveExcel(c, "Template_Kelas.xlsx", buffer)
}

func (h *TemplateHandler) DownloadQuestionTemplate(c *gin.Context) {
	buffer, err := h.TemplateUsecase.GenerateQuestionTemplate()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal generate template: " + err.Error()})
		return
	}
	serveExcel(c, "Template_Soal_Ujian.xlsx", buffer)
}

func (h *TemplateHandler) DownloadExamParticipantTemplate(c *gin.Context) {
	instID := c.GetString("institution_id")
	if c.GetString("role") == "SUPER_ADMIN" {
		instID = c.Query("institution_id")
	}

	// [PERBAIKAN] Cegah penarikan seluruh data siswa sejagat raya
	if instID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Sistem mendeteksi jadwal ujian ini belum memiliki relasi Lembaga yang jelas. Gagal mengunduh template."})
		return
	}

	buffer, err := h.TemplateUsecase.GenerateExamParticipantTemplate(instID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal generate template: " + err.Error()})
		return
	}
	filename := fmt.Sprintf("Template_Peserta_Ujian_%s.xlsx", time.Now().Format("20060102"))
	serveExcel(c, filename, buffer)
}

func (h *TemplateHandler) DownloadSubjectTemplate(c *gin.Context) {
	instID := c.GetString("institution_id")
	if c.GetString("role") == "SUPER_ADMIN" && c.Query("institution_id") != "" {
		instID = c.Query("institution_id")
	}

	buffer, err := h.TemplateUsecase.GenerateSubjectTemplate(instID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal generate template: " + err.Error()})
		return
	}
	serveExcel(c, "Template_Mapel.xlsx", buffer)
}

func (h *TemplateHandler) DownloadExamSessionTemplate(c *gin.Context) {
	instID := c.GetString("institution_id")
	if c.GetString("role") == "SUPER_ADMIN" {
		instID = c.Query("institution_id")
	}
	if instID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Sistem mendeteksi Anda belum berada di dalam konteks Lembaga."})
		return
	}

	// [TAMBAHAN BARU] Tangkap Event ID untuk fitur kolom dinamis
	eventID := c.Query("event_id")
	if eventID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Parameter event_id wajib disertakan untuk menghasilkan template dinamis."})
		return
	}

	// Masukkan eventID ke parameter fungsi
	buffer, err := h.TemplateUsecase.GenerateExamSessionTemplate(instID, eventID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal generate template: " + err.Error()})
		return
	}
	filename := fmt.Sprintf("Template_Jadwal_Sesi_%s.xlsx", time.Now().Format("20060102"))
	serveExcel(c, filename, buffer)
}
