// LOKASI: internal/delivery/http/report_handler.go
package http

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"banikarimmekarjaya.id/cbt-backend/internal/domain"
	"banikarimmekarjaya.id/cbt-backend/internal/usecase"
)

type ReportHandler struct {
	ReportUsecase usecase.ReportUsecase
}

func NewReportHandler(uc usecase.ReportUsecase) *ReportHandler {
	return &ReportHandler{ReportUsecase: uc}
}

// POST /reports (Wali Kelas Input Rapor)
func (h *ReportHandler) InputReport(c *gin.Context) {
	teacherID := c.GetString("user_id")
	role := c.GetString("role")

	var input usecase.InputReportDTO
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.ReportUsecase.InputReport(c.Request.Context(), teacherID, role, input); err != nil {
		if errors.Is(err, domain.ErrForbiddenReportAccess) {
			c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Data rapor tersimpan"})
}

// GET /reports/class/:id/leger
func (h *ReportHandler) GetClassLeger(c *gin.Context) {
	classID := c.Param("id")
	userID := c.GetString("user_id")
	role := c.GetString("role")

	if classID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID Kelas wajib diisi"})
		return
	}

	response, err := h.ReportUsecase.GenerateClassLeger(c.Request.Context(), classID, userID, role)
	if err != nil {
		if errors.Is(err, domain.ErrForbiddenReportAccess) {
			c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": response})
}
