// LOKASI: internal/delivery/http/assignment_handler.go
package http

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"banikarimmekarjaya.id/cbt-backend/internal/domain"
)

type AssignmentHandler struct {
	Usecase domain.AssignmentUsecase
}

func NewAssignmentHandler(uc domain.AssignmentUsecase) *AssignmentHandler {
	return &AssignmentHandler{Usecase: uc}
}

// GET /api/v1/academic/assignments
func (h *AssignmentHandler) GetAll(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))

	filter := domain.AssignmentFilter{
		InstitutionID: c.GetString("institution_id"),
		TeacherID:     c.Query("teacher_id"),
		ClassID:       c.Query("class_id"),
		Search:        c.Query("search"),
		Page:          page,
		Limit:         limit,
	}

	if c.GetString("role") == "SUPER_ADMIN" {
		if instID := c.Query("institution_id"); instID != "" {
			filter.InstitutionID = instID
		}
	}

	result, err := h.Usecase.GetAssignments(c.Request.Context(), filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, result)
}

// GET /api/v1/academic/assignments/:id
func (h *AssignmentHandler) GetDetail(c *gin.Context) {
	id := c.Param("id")
	result, err := h.Usecase.GetAssignmentDetail(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": result})
}

// GET /api/v1/academic/assignments/:id/grades
func (h *AssignmentHandler) GetGrades(c *gin.Context) {
	id := c.Param("id")
	result, err := h.Usecase.GetAssignmentGrades(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": result})
}

// POST /api/v1/academic/assignments
func (h *AssignmentHandler) Create(c *gin.Context) {
	var input domain.CreateAssignmentInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if c.GetString("role") != "SUPER_ADMIN" {
		input.InstitutionID = c.GetString("institution_id")
	}

	operatorID := c.GetString("user_id")
	result, err := h.Usecase.CreateAssignment(c.Request.Context(), input, operatorID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Penugasan berhasil dibuat", "data": result})
}

// PUT /api/v1/academic/assignments/:id/kkm
func (h *AssignmentHandler) UpdateKKM(c *gin.Context) {
	id := c.Param("id")
	var input domain.UpdateKKMInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.Usecase.UpdateKKM(c.Request.Context(), id, input); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Nilai KKM berhasil diperbarui"})
}

// DELETE /api/v1/academic/assignments/:id
func (h *AssignmentHandler) Delete(c *gin.Context) {
	id := c.Param("id")
	if err := h.Usecase.DeleteAssignment(c.Request.Context(), id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Penugasan berhasil dihapus"})
}

// =======================================================
// (REKAP NILAI SISWA PER PENUGASAN)
// =======================================================
func (h *AssignmentHandler) ExportExcel(c *gin.Context) {
	id := c.Param("id")
	buf, err := h.Usecase.DownloadRekap(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.Header("Content-Disposition", "attachment; filename=Rekap_Nilai.xlsx")
	c.Data(http.StatusOK, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", buf.Bytes())
}

func (h *AssignmentHandler) ExportPDF(c *gin.Context) {
	id := c.Param("id")
	buf, err := h.Usecase.DownloadRekapPDF(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.Header("Content-Type", "application/pdf")
	c.Header("Content-Disposition", "inline; filename=Rekap_Nilai.pdf")
	c.Data(http.StatusOK, "application/pdf", buf.Bytes())
}

// =======================================================
// TEMPLATE, BATCH IMPORT & EXPORT LIST
// =======================================================

// GET /api/v1/utils/templates/assignments
func (h *AssignmentHandler) DownloadTemplate(c *gin.Context) {
	instID := c.GetString("institution_id")
	if c.GetString("role") == "SUPER_ADMIN" && c.Query("institution_id") != "" {
		instID = c.Query("institution_id")
	}

	buf, err := h.Usecase.DownloadAssignmentTemplate(c.Request.Context(), instID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.Header("Content-Disposition", "attachment; filename=Template_Penugasan.xlsx")
	c.Data(http.StatusOK, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", buf.Bytes())
}

// POST /api/v1/academic/assignments/import
func (h *AssignmentHandler) Import(c *gin.Context) {
	file, _, err := c.Request.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "File Excel tidak ditemukan dalam request"})
		return
	}
	defer file.Close()

	instID := c.GetString("institution_id")
	if c.GetString("role") == "SUPER_ADMIN" {
		if q := c.PostForm("institution_id"); q != "" {
			instID = q
		}
	}

	count, err := h.Usecase.ImportAssignments(c.Request.Context(), instID, file)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Import penugasan berhasil diproses", "success_count": count})
}

// GET /api/v1/academic/assignments/export-list/excel
func (h *AssignmentHandler) ExportListExcel(c *gin.Context) {
	filter := domain.AssignmentFilter{
		InstitutionID: c.GetString("institution_id"),
		TeacherID:     c.Query("teacher_id"),
		ClassID:       c.Query("class_id"),
	}

	if c.GetString("role") == "SUPER_ADMIN" && c.Query("institution_id") != "" {
		filter.InstitutionID = c.Query("institution_id")
	}

	buf, err := h.Usecase.ExportAssignmentsExcel(c.Request.Context(), filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.Header("Content-Disposition", "attachment; filename=Daftar_Penugasan.xlsx")
	c.Data(http.StatusOK, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", buf.Bytes())
}

// GET /api/v1/academic/assignments/export-list/pdf
func (h *AssignmentHandler) ExportListPDF(c *gin.Context) {
	filter := domain.AssignmentFilter{
		InstitutionID: c.GetString("institution_id"),
		TeacherID:     c.Query("teacher_id"),
		ClassID:       c.Query("class_id"),
	}

	if c.GetString("role") == "SUPER_ADMIN" && c.Query("institution_id") != "" {
		filter.InstitutionID = c.Query("institution_id")
	}

	buf, err := h.Usecase.ExportAssignmentsPDF(c.Request.Context(), filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.Header("Content-Type", "application/pdf")
	c.Header("Content-Disposition", "inline; filename=Daftar_Penugasan.pdf")
	c.Data(http.StatusOK, "application/pdf", buf.Bytes())
}
