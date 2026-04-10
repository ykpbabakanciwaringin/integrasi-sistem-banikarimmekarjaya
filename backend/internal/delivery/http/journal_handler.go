// LOKASI: internal/delivery/http/journal_handler.go
package http

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"ykpbabakanciwaringin.id/cbt-backend/internal/domain"
)

type JournalHandler struct {
	Usecase domain.JournalUsecase
}

func NewJournalHandler(uc domain.JournalUsecase) *JournalHandler {
	return &JournalHandler{Usecase: uc}
}

func (h *JournalHandler) CreateJournal(c *gin.Context) {
	var input domain.CreateJournalInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	operatorID := c.GetString("user_id")
	journal, err := h.Usecase.CreateJournal(c.Request.Context(), operatorID, input)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Jurnal berhasil dibuat", "data": journal})
}

func (h *JournalHandler) GetJournals(c *gin.Context) {
	filter := domain.JournalFilter{
		InstitutionID: c.GetString("institution_id"),
		TeacherID:     c.Query("teacher_id"),
		ClassID:       c.Query("class_id"),
		Status:        c.Query("status"),
	}

	// Super Admin bisa melihat semua institusi
	if c.GetString("role") == "SUPER_ADMIN" {
		if q := c.Query("institution_id"); q != "" {
			filter.InstitutionID = q
		}
	}

	journals, err := h.Usecase.GetJournals(c.Request.Context(), filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": journals})
}

func (h *JournalHandler) UpdateJournal(c *gin.Context) {
	id := c.Param("id")
	var input domain.UpdateJournalInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	journal, err := h.Usecase.UpdateJournal(c.Request.Context(), id, input)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Jurnal berhasil diupdate", "data": journal})
}

func (h *JournalHandler) DeleteJournal(c *gin.Context) {
	id := c.Param("id")
	if err := h.Usecase.DeleteJournal(c.Request.Context(), id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Jurnal berhasil dihapus"})
}

func (h *JournalHandler) SubmitAttendances(c *gin.Context) {
	journalID := c.Param("id")
	role := c.GetString("role")

	// 1. AMBIL DATA JURNAL UNTUK CEK TANGGAL JADWAL
	journal, err := h.Usecase.GetJournalByID(c.Request.Context(), journalID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Jurnal tidak ditemukan"})
		return
	}

	// 2. LOGIKA PENGUNCIAN ENTERPRISE (SOP PESANTREN)
	today := time.Now().Truncate(24 * time.Hour)
	journalDate := journal.Date.Truncate(24 * time.Hour)
	diffDays := int(today.Sub(journalDate).Hours() / 24)

	switch role {
	case domain.RoleTeacher:
		if diffDays != 0 {
			c.JSON(http.StatusForbidden, gin.H{"error": "SOP Sistem: Guru HANYA diizinkan mengisi absensi pada hari H jadwal mengajar. Hubungi Admin jika ada perubahan."})
			return
		}
	case domain.RoleAdmin, domain.RoleSuperAdmin:
		if diffDays > 6 || diffDays < 0 {
			c.JSON(http.StatusForbidden, gin.H{"error": "SOP Sistem: Admin HANYA diizinkan merevisi data maksimal H+6 dari tanggal jadwal kelas berlangsung."})
			return
		}
	}

	// Lanjut ke proses asli
	var inputs []domain.SubmitAttendanceInput
	if err := c.ShouldBindJSON(&inputs); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.Usecase.SubmitAttendances(c.Request.Context(), journalID, inputs); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Absensi berhasil disimpan"})
}

func (h *JournalHandler) GetAttendances(c *gin.Context) {
	journalID := c.Param("id")
	attendances, err := h.Usecase.GetAttendances(c.Request.Context(), journalID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": attendances})
}

func (h *JournalHandler) VerifyJournal(c *gin.Context) {
	journalID := c.Param("id")
	adminID := c.GetString("user_id") // Ambil ID Admin dari Token JWT
	role := c.GetString("role")

	// Keamanan: Hanya Admin & Super Admin yang boleh lewat
	if role != domain.RoleSuperAdmin && role != domain.RoleAdmin && role != domain.RoleAdminAcademic {
		c.JSON(http.StatusForbidden, gin.H{"error": "Hanya Admin yang berhak memverifikasi jurnal"})
		return
	}

	if err := h.Usecase.VerifyJournal(c.Request.Context(), journalID, adminID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Jurnal berhasil diverifikasi dan dikunci"})
}

func (h *JournalHandler) ExportRecap(c *gin.Context) {
	var req domain.ExportRecapRequest

	// Mengambil data dari Query Parameter URL (?type=mapel&month=2025-07)
	if err := c.ShouldBindQuery(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Parameter tidak valid: " + err.Error()})
		return
	}

	// Memanggil Usecase Mesin Cetak kita
	fileBuffer, fileName, contentType, err := h.Usecase.ExportRecap(c.Request.Context(), req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghasilkan dokumen: " + err.Error()})
		return
	}

	c.Header("Content-Disposition", `attachment; filename="`+fileName+`"`)
	c.Data(http.StatusOK, contentType, fileBuffer.Bytes())
}

func (h *JournalHandler) RetrySync(c *gin.Context) {
	journalID := c.Param("id")

	if err := h.Usecase.RetrySyncAttendance(c.Request.Context(), journalID); err != nil {
		// Jika err memuat kata "tidak perlu retry" atau "tidak aktif", kirim 400 Bad Request
		if err.Error() == "semua data absensi sudah berhasil tersinkronisasi, tidak perlu retry" ||
			err.Error() == "integrasi pesantrenqu tidak aktif untuk lembaga ini" {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Perintah sinkronisasi ulang berhasil dikirim. Silakan cek status beberapa saat lagi."})
}
