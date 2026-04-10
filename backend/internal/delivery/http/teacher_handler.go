package http

import (
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"ykpbabakanciwaringin.id/cbt-backend/internal/domain"
	"ykpbabakanciwaringin.id/cbt-backend/internal/usecase"
	"ykpbabakanciwaringin.id/cbt-backend/pkg/utils"
)

type TeacherHandler struct {
	TeacherUsecase  usecase.TeacherUsecase
	PdfUsecase      usecase.PdfUsecase
	TemplateUsecase usecase.TemplateUsecase
}

func NewTeacherHandler(uc usecase.TeacherUsecase, pdf usecase.PdfUsecase, temp usecase.TemplateUsecase) *TeacherHandler {
	return &TeacherHandler{
		TeacherUsecase:  uc,
		PdfUsecase:      pdf,
		TemplateUsecase: temp,
	}
}

func (h *TeacherHandler) GetTeachers(c *gin.Context) {
	instID := c.GetString("institution_id")

	if c.GetString("role") == "SUPER_ADMIN" {
		q := c.Query("institution_id")
		if q != "" && q != "ALL" {
			instID = q
		} else if q == "ALL" {
			instID = ""
		}
	}

	page := utils.GetIntQuery(c, "page", 1)
	limit := utils.GetIntQuery(c, "limit", 10)
	search := c.Query("search")
	gender := c.Query("gender")
	status := c.Query("status")

	filter := domain.TeacherFilter{
		InstitutionID: instID,
		Search:        search,
		Page:          page,
		Limit:         limit,
		Gender:        gender,
		Status:        status,
	}

	teachers, total, err := h.TeacherUsecase.GetTeachers(c.Request.Context(), filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":  teachers,
		"total": total,
		"page":  page,
		"limit": limit,
	})
}

func (h *TeacherHandler) CreateTeacher(c *gin.Context) {
	var input domain.TeacherCreateInput

	// PRAKTIK TERBAIK JANGKA PANJANG: Murni Bind JSON (2-Step Upload)
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Data tidak valid: " + err.Error()})
		return
	}

	input.CreatedBy = c.GetString("username")

	if c.GetString("role") != "SUPER_ADMIN" {
		input.InstitutionID = c.GetString("institution_id")
	}

	if err := h.TeacherUsecase.CreateTeacher(c.Request.Context(), input); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Guru berhasil ditambahkan"})
}

func (h *TeacherHandler) UpdateTeacher(c *gin.Context) {
	id := c.Param("id")
	var input domain.TeacherUpdateInput

	// PRAKTIK TERBAIK JANGKA PANJANG: Murni Bind JSON (2-Step Upload)
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Format data tidak valid: " + err.Error()})
		return
	}

	if err := h.TeacherUsecase.UpdateTeacher(c.Request.Context(), id, input); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Data guru berhasil diperbarui"})
}

func (h *TeacherHandler) DeleteTeacher(c *gin.Context) {
	id := c.Param("id")
	if err := h.TeacherUsecase.DeleteTeacher(c.Request.Context(), id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Guru berhasil dihapus"})
}

func (h *TeacherHandler) ImportTeachers(c *gin.Context) {
	file, _, err := c.Request.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "File excel wajib diupload"})
		return
	}
	defer file.Close()

	instID := c.GetString("institution_id")
	if c.GetString("role") == "SUPER_ADMIN" {
		if val := c.PostForm("institution_id"); val != "" {
			instID = val
		}
	}

	count, err := h.TeacherUsecase.ImportTeachers(c.Request.Context(), instID, file)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": fmt.Sprintf("Berhasil mengimport %d data guru", count),
		"count":   count,
	})
}

func (h *TeacherHandler) GetTeacherDetail(c *gin.Context) {
	id := c.Param("id")

	if _, err := uuid.Parse(id); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Format QR Code atau ID tidak valid"})
		return
	}

	teacher, err := h.TeacherUsecase.GetTeacherByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Data guru tidak ditemukan"})
		return
	}

	teacher.Password = ""

	c.JSON(http.StatusOK, gin.H{"data": teacher})
}

func (h *TeacherHandler) SubmitAttendance(c *gin.Context) {
	var input domain.TeacherAttendanceInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	instID := c.GetString("institution_id")
	operatorID := c.GetString("user_id") // ID Guru Piket yang sedang login

	if err := h.TeacherUsecase.SubmitAttendance(c.Request.Context(), instID, operatorID, input); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Presensi guru berhasil disimpan"})
}

func (h *TeacherHandler) GetAttendances(c *gin.Context) {
	instID := c.GetString("institution_id")
	if c.GetString("role") == "SUPER_ADMIN" {
		if q := c.Query("institution_id"); q != "" {
			instID = q
		}
	}

	month := c.Query("month")
	result, err := h.TeacherUsecase.GetAttendances(c.Request.Context(), instID, month)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": result})
}

// =========================================================================
// EKSPOR DATA GURU (EXCEL & PDF)
// =========================================================================

func (h *TeacherHandler) ExportTeachersExcel(c *gin.Context) {
	instID := c.GetString("institution_id")
	if c.GetString("role") == "SUPER_ADMIN" {
		if q := c.Query("institution_id"); q != "" && q != "ALL" {
			instID = q
		} else if q == "ALL" {
			instID = ""
		}
	}

	filter := domain.TeacherFilter{
		InstitutionID: instID,
		Search:        c.Query("search"),
		Gender:        c.Query("gender"),
		Status:        c.Query("status"),
		Page:          1,
		Limit:         10000, // Ambil semua data untuk diekspor
	}

	teachers, _, err := h.TeacherUsecase.GetTeachers(c.Request.Context(), filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data guru"})
		return
	}

	buffer, err := h.TemplateUsecase.GenerateTeacherExportExcel(teachers, instID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal membuat dokumen Excel: " + err.Error()})
		return
	}

	c.Header("Content-Disposition", "attachment; filename=\"Data_Guru.xlsx\"")
	c.Header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
	c.Data(http.StatusOK, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", buffer.Bytes())
}

// ExportTeachersPDF: Laporan Resmi Lembaga (Kop Surat Dinamis)
func (h *TeacherHandler) ExportTeachersPDF(c *gin.Context) {
	instID := c.GetString("institution_id")
	if c.GetString("role") == "SUPER_ADMIN" {
		if q := c.Query("institution_id"); q != "" && q != "ALL" {
			instID = q
		} else if q == "ALL" {
			instID = ""
		}
	}

	filter := domain.TeacherFilter{
		InstitutionID: instID,
		Search:        c.Query("search"),
		Gender:        c.Query("gender"),
		Status:        c.Query("status"),
		Page:          1,
		Limit:         10000,
	}

	teachers, _, err := h.TeacherUsecase.GetTeachers(c.Request.Context(), filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data guru"})
		return
	}

	pdfBuf, err := h.PdfUsecase.GenerateTeacherListPDF(c.Request.Context(), teachers, instID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal membuat PDF: " + err.Error()})
		return
	}

	c.Header("Content-Disposition", `attachment; filename="Data_Guru.pdf"`)
	c.Header("Content-Type", "application/pdf")
	c.Data(http.StatusOK, "application/pdf", pdfBuf.Bytes())
}
