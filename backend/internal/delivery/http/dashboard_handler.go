// LOKASI: internal/delivery/http/dashboard_handler.go
package http

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"ykpbabakanciwaringin.id/cbt-backend/internal/usecase"
)

type DashboardHandler struct {
	DashboardUsecase usecase.DashboardUsecase
}

func NewDashboardHandler(uc usecase.DashboardUsecase) *DashboardHandler {
	return &DashboardHandler{DashboardUsecase: uc}
}

func (h *DashboardHandler) GetStats(c *gin.Context) {
	instID := c.GetString("institution_id")

	stats, err := h.DashboardUsecase.GetStats(c.Request.Context(), instID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": stats})
}

func (h *DashboardHandler) HealthCheck(c *gin.Context) {
	ok, err := h.DashboardUsecase.CheckHealth(c.Request.Context())
	if !ok || err != nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"status":  "unstable",
			"message": "Koneksi database terputus atau latensi terlalu tinggi",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":  "stable",
		"message": "Sistem berjalan normal",
	})
}
