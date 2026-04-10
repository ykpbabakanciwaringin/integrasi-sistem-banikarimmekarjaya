// LOKASI: internal/delivery/http/schedule_handler.go
package http

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"ykpbabakanciwaringin.id/cbt-backend/internal/domain"
	"ykpbabakanciwaringin.id/cbt-backend/pkg/utils"
)

type ScheduleHandler struct {
	Usecase domain.ScheduleUsecase
}

func NewScheduleHandler(uc domain.ScheduleUsecase) *ScheduleHandler {
	return &ScheduleHandler{Usecase: uc}
}

func (h *ScheduleHandler) GetAllocations(c *gin.Context) {
	instID := c.GetString("institution_id")
	if c.GetString("role") == "SUPER_ADMIN" {
		if q := c.Query("institution_id"); q != "" {
			instID = q
		}
	}

	filter := domain.AllocationFilter{
		InstitutionID:  instID,
		AcademicYearID: c.Query("academic_year_id"),
		ClassID:        c.Query("class_id"),
		TeacherID:      c.Query("teacher_id"),
	}

	userRole := c.GetString("role")
	userPosition := strings.ToUpper(c.GetString("position")) // Ambil jabatan dari middleware

	// Deteksi apakah yang login punya wewenang khusus (Piket / Kurikulum)
	isPiket := strings.Contains(userPosition, "PIKET") || strings.Contains(userPosition, "KURIKULUM")

	// Jika dia guru TAPI BUKAN Piket, paksa hanya bisa lihat jadwalnya sendiri
	if userRole == "TEACHER" && !isPiket {
		filter.TeacherID = c.GetString("user_id")
	}

	result, err := h.Usecase.GetAllocations(c.Request.Context(), filter)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": result})
}

func (h *ScheduleHandler) CreateAllocation(c *gin.Context) {
	var input struct {
		domain.CreateAllocationInput
		InstitutionID string `json:"institution_id"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	instID := c.GetString("institution_id")
	if c.GetString("role") == "SUPER_ADMIN" && strings.TrimSpace(input.InstitutionID) != "" {
		instID = input.InstitutionID
	}

	if strings.TrimSpace(instID) == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Gagal: ID Lembaga belum terpilih. Silakan pilih lembaga terlebih dahulu."})
		return
	}

	operator := c.GetString("user_id")
	newData, err := h.Usecase.CreateAllocation(c.Request.Context(), instID, operator, input.CreateAllocationInput)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Alokasi mengajar berhasil dibuat",
		"data":    newData,
	})
}

func (h *ScheduleHandler) DeleteAllocation(c *gin.Context) {
	id := c.Param("id")
	if err := h.Usecase.DeleteAllocation(c.Request.Context(), id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Alokasi berhasil dihapus"})
}

func (h *ScheduleHandler) AddSchedule(c *gin.Context) {
	allocationID := c.Param("allocationId")
	var input domain.AddScheduleInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	operator := c.GetString("user_id")
	err := h.Usecase.AddSchedule(c.Request.Context(), allocationID, operator, input)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"message": "Jadwal berhasil ditambahkan"})
}

func (h *ScheduleHandler) DeleteSchedule(c *gin.Context) {
	id := c.Param("scheduleId")
	if err := h.Usecase.DeleteSchedule(c.Request.Context(), id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Jadwal berhasil dihapus"})
}

// =======================================================
// HANDLER: MASTER SESI PESANTRENQU
// =======================================================
func (h *ScheduleHandler) GetSessions(c *gin.Context) {
	instID := c.GetString("institution_id")
	if c.GetString("role") == "SUPER_ADMIN" {
		if q := c.Query("institution_id"); q != "" {
			instID = q
		}
	}

	result, err := h.Usecase.GetSessions(c.Request.Context(), instID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": result})
}

func (h *ScheduleHandler) CreateSession(c *gin.Context) {
	var input struct {
		domain.CreateClassSessionInput
		InstitutionID string `json:"institution_id"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	instID := c.GetString("institution_id")
	if c.GetString("role") == "SUPER_ADMIN" && strings.TrimSpace(input.InstitutionID) != "" {
		instID = input.InstitutionID
	}

	if strings.TrimSpace(instID) == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID Lembaga wajib disertakan"})
		return
	}

	result, err := h.Usecase.CreateSession(c.Request.Context(), instID, input.CreateClassSessionInput)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"data": result, "message": "Sesi berhasil ditambahkan"})
}

func (h *ScheduleHandler) DeleteSession(c *gin.Context) {
	id := c.Param("id")
	if err := h.Usecase.DeleteSession(c.Request.Context(), id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Sesi berhasil dihapus"})
}

// =======================================================
// EXPORT HANDLERS
// =======================================================
func (h *ScheduleHandler) ExportExcel(c *gin.Context) {
	instID := c.Query("institution_id")
	if instID == "" {
		instID = c.GetString("institution_id")
	}
	academicYearID := c.Query("academic_year_id")

	buf, err := h.Usecase.ExportScheduleMatrixExcel(c.Request.Context(), instID, academicYearID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal membuat file Excel: " + err.Error()})
		return
	}

	c.Header("Content-Disposition", `attachment; filename="Master_Jadwal_Pelajaran.xlsx"`)
	c.Header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
	c.Data(http.StatusOK, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", buf.Bytes())
}

func (h *ScheduleHandler) ExportSessionResultsPDF(c *gin.Context) {
	instID := c.Query("institution_id")
	if instID == "" {
		instID = c.GetString("institution_id")
	}
	academicYearID := c.Query("academic_year_id")

	buf, err := h.Usecase.ExportScheduleMatrixPDF(c.Request.Context(), instID, academicYearID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal membuat file PDF: " + err.Error()})
		return
	}

	c.Header("Content-Disposition", `attachment; filename="Master_Jadwal_Pelajaran.pdf"`)
	c.Header("Content-Type", "application/pdf")
	c.Data(http.StatusOK, "application/pdf", buf.Bytes())
}
