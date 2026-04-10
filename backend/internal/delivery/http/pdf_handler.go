package http

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"banikarimmekarjaya.id/cbt-backend/internal/usecase"
)

type PdfHandler struct {
	PdfUsecase usecase.PdfUsecase
}

func NewPdfHandler(p usecase.PdfUsecase) *PdfHandler {
	return &PdfHandler{PdfUsecase: p}
}

/**
 * DownloadExamCards menangani permintaan HTTP untuk mengunduh kartu ujian.
 * Sekarang menerima filename dinamis dari usecase.
 */
func (h *PdfHandler) DownloadExamCards(c *gin.Context) {
	sessionID := c.Param("session_id")

	// Menerima 3 return value: buffer, filename, err
	buffer, filename, err := h.PdfUsecase.GenerateExamCards(c.Request.Context(), sessionID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal membuat PDF: " + err.Error()})
		return
	}

	c.Header("Content-Disposition", "attachment; filename=\""+filename+"\"")
	c.Header("Content-Type", "application/pdf")
	c.Data(http.StatusOK, "application/pdf", buffer.Bytes())
}
