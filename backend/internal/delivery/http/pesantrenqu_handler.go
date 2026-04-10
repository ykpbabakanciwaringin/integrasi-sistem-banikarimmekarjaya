// internal/delivery/http/pesantrenqu_handler.go
package http

import (
	"net/http"

	"ykpbabakanciwaringin.id/cbt-backend/internal/domain"

	"github.com/gin-gonic/gin" // Asumsi Anda menggunakan framework Gin
)

type PesantrenQuHandler struct {
	pqUsecase domain.PesantrenQuUsecase
}

func NewPesantrenQuHandler(r *gin.RouterGroup, pqUsecase domain.PesantrenQuUsecase) {
	handler := &PesantrenQuHandler{
		pqUsecase: pqUsecase,
	}

	// Route internal aplikasi Anda
	api := r.Group("/thirdparty/pesantrenqu")
	{
		api.GET("/students", handler.GetStudents)
		api.GET("/balance", handler.GetBalance)
		api.POST("/attendance", handler.RecordAttendance)
	}
}

func (h *PesantrenQuHandler) GetStudents(c *gin.Context) {
	students, err := h.pqUsecase.FetchStudents(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": students})
}

func (h *PesantrenQuHandler) GetBalance(c *gin.Context) {
	rfid := c.Query("rfid")
	if rfid == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "rfid is required"})
		return
	}
	balance, err := h.pqUsecase.CheckBalance(c.Request.Context(), rfid)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": balance})
}

func (h *PesantrenQuHandler) RecordAttendance(c *gin.Context) {
	var req domain.PQAttendanceReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err := h.pqUsecase.SubmitAttendance(c.Request.Context(), req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Attendance recorded successfully"})
}
