// LOKASI: internal/delivery/http/exam_event_handler.go
package http

import (
	"context"
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"banikarimmekarjaya.id/cbt-backend/internal/domain"
)

type ExamEventHandler struct {
	EventUsecase domain.ExamEventUsecase
}

func NewExamEventHandler(uc domain.ExamEventUsecase) *ExamEventHandler {
	return &ExamEventHandler{EventUsecase: uc}
}

func (h *ExamEventHandler) CreateEvent(c *gin.Context) {
	var input domain.CreateEventInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Format data tidak valid: " + err.Error()})
		return
	}

	instID := input.InstitutionID
	if instID == "" {
		// Jika dari body JSON kosong, coba ambil dari token JWT pengguna yang login
		instID = c.GetString("institution_id")
	}

	if instID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Lembaga wajib diisi. Silakan pilih lembaga untuk kegiatan ini."})
		return
	}

	if err := h.EventUsecase.CreateEvent(c.Request.Context(), instID, input); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal membuat kegiatan ujian: " + err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Kegiatan Ujian berhasil dibuat"})
}

func (h *ExamEventHandler) GetEvents(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))

	filter := domain.EventFilter{
		BaseFilter: domain.BaseFilter{
			Page:      page,
			Limit:     limit,
			Search:    c.Query("search"),
			SortBy:    c.Query("sort_by"),
			SortOrder: c.Query("sort_order"),
		},
		InstitutionID: c.GetString("institution_id"),
	}

	if activeStr := c.Query("is_active"); activeStr != "" {
		isActive := activeStr == "true"
		filter.IsActive = &isActive
	}

	events, total, totalPages, err := h.EventUsecase.GetEvents(c.Request.Context(), filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data kegiatan: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":        events,
		"total":       total,
		"total_pages": totalPages,
		"page":        page,
		"limit":       limit,
	})
}

func (h *ExamEventHandler) GetEventDetail(c *gin.Context) {
	id := c.Param("id")
	event, err := h.EventUsecase.GetEventDetail(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Kegiatan ujian tidak ditemukan"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": event})
}

func (h *ExamEventHandler) UpdateEvent(c *gin.Context) {
	id := c.Param("id")
	var input domain.CreateEventInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Format data tidak valid: " + err.Error()})
		return
	}

	if err := h.EventUsecase.UpdateEvent(c.Request.Context(), id, input); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal memperbarui kegiatan: " + err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Kegiatan berhasil diperbarui"})
}

func (h *ExamEventHandler) DeleteEvent(c *gin.Context) {
	id := c.Param("id")
	if err := h.EventUsecase.DeleteEvent(c.Request.Context(), id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghapus kegiatan: " + err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Kegiatan berhasil dihapus"})
}

func (h *ExamEventHandler) DownloadSEBConfig(c *gin.Context) {
	id := c.Param("id")

	// 1. Tangkap URL dari mana request ini berasal (Origin/Referer)
	origin := c.GetHeader("Origin")
	if origin == "" {
		origin = c.GetHeader("Referer")
	}

	// Bersihkan path di belakangnya (hanya ambil http://localhost:3000 atau https://domain.com)
	if origin != "" {
		parts := strings.Split(origin, "/")
		if len(parts) >= 3 {
			origin = parts[0] + "//" + parts[2]
		}
	}

	// 2. Suntikkan Origin Dinamis ke dalam Context
	ctx := context.WithValue(c.Request.Context(), "client_origin", origin)

	buf, err := h.EventUsecase.GenerateSEBConfig(ctx, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.Header("Content-Disposition", `attachment; filename="Config_Ujian_SEB.seb"`)
	c.Header("Content-Type", "application/seb")
	c.Data(http.StatusOK, "application/seb", buf.Bytes())
}

// =========================================================================================
// [FITUR BARU] ENDPOINT KARTU UJIAN LEVEL KEGIATAN
// =========================================================================================

// GET /exams/events/:id/participants-cards
func (h *ExamEventHandler) DownloadEventExamCards(c *gin.Context) {
	eventID := c.Param("id")

	data, err := h.EventUsecase.DownloadEventExamCards(c.Request.Context(), eventID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menarik data cetak kartu kegiatan: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": data})
}
