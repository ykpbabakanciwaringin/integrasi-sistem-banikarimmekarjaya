// LOKASI: internal/delivery/http/student_handler.go
package http

import (
	"fmt"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"banikarimmekarjaya.id/cbt-backend/internal/domain"
	"banikarimmekarjaya.id/cbt-backend/internal/usecase"
)

type StudentHandler struct {
	StudentUsecase  usecase.StudentUsecase
	PdfUsecase      usecase.PdfUsecase
	TemplateUsecase usecase.TemplateUsecase
}

func NewStudentHandler(uc usecase.StudentUsecase, pdf usecase.PdfUsecase, temp usecase.TemplateUsecase) *StudentHandler {
	return &StudentHandler{
		StudentUsecase:  uc,
		PdfUsecase:      pdf,
		TemplateUsecase: temp,
	}
}

func (h *StudentHandler) GetStudents(c *gin.Context) {
	instID := c.GetString("institution_id")
	role := c.GetString("role")

	filterInstID := instID
	if role == "SUPER_ADMIN" {
		if queryInst := c.Query("institution_id"); queryInst != "" {
			filterInstID = queryInst
		}
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))

	filter := domain.StudentFilter{
		InstitutionID:  filterInstID,
		ClassID:        c.Query("class_id"),
		Search:         c.Query("search"),
		Status:         c.Query("status"),
		Gender:         c.Query("gender"),
		AcademicStatus: c.Query("academic_status"),
		Page:           page,
		Limit:          limit,
	}

	students, total, err := h.StudentUsecase.GetStudents(c.Request.Context(), filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":  students,
		"total": total,
		"page":  page,
		"limit": limit,
	})
}

func (h *StudentHandler) CreateStudent(c *gin.Context) {
	var input domain.StudentCreateInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Format data tidak valid: " + err.Error()})
		return
	}

	if c.GetString("role") != "SUPER_ADMIN" {
		input.InstitutionID = c.GetString("institution_id")
	}

	if err := h.StudentUsecase.CreateStudent(c.Request.Context(), input); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"message": "Siswa berhasil ditambahkan"})
}

func (h *StudentHandler) UpdateStudent(c *gin.Context) {
	id := c.Param("id")
	var input domain.StudentUpdateInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Format data tidak valid: " + err.Error()})
		return
	}

	if err := h.StudentUsecase.UpdateStudent(c.Request.Context(), id, input); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Data siswa berhasil diperbarui"})
}

func (h *StudentHandler) DeleteStudent(c *gin.Context) {
	id := c.Param("id")
	if err := h.StudentUsecase.DeleteStudent(c.Request.Context(), id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Siswa berhasil dihapus"})
}

func (h *StudentHandler) GetStudentDetail(c *gin.Context) {
	id := c.Param("id")
	if _, err := uuid.Parse(id); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Format ID tidak valid"})
		return
	}

	student, err := h.StudentUsecase.GetStudentByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Data siswa tidak ditemukan"})
		return
	}

	student.Password = ""
	c.JSON(http.StatusOK, gin.H{"data": student})
}

func (h *StudentHandler) ResetStudentPassword(c *gin.Context) {
	id := c.Param("id")
	var input struct {
		Password string `json:"password" binding:"required,min=6"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Password baru tidak valid"})
		return
	}

	if err := h.StudentUsecase.ResetStudentPassword(c.Request.Context(), id, input.Password); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mereset password"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Password berhasil direset"})
}

func (h *StudentHandler) ImportStudents(c *gin.Context) {
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

	count, err := h.StudentUsecase.ImportStudents(c.Request.Context(), instID, file)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": fmt.Sprintf("Berhasil mengimpor %d data siswa", count),
		"count":   count,
	})
}

func (h *StudentHandler) ExportStudentsExcel(c *gin.Context) {
	instID := c.GetString("institution_id")
	if c.GetString("role") == "SUPER_ADMIN" {
		if q := c.Query("institution_id"); q != "" {
			instID = q
		}
	}

	filter := domain.StudentFilter{
		InstitutionID:  instID,
		ClassID:        c.Query("class_id"),
		Search:         c.Query("search"),
		Status:         c.Query("status"),
		Gender:         c.Query("gender"),
		AcademicStatus: c.Query("academic_status"),
		Page:           1,
		Limit:          10000,
	}

	students, _, err := h.StudentUsecase.GetStudents(c.Request.Context(), filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data ekspor"})
		return
	}

	buffer, err := h.TemplateUsecase.GenerateStudentExportExcel(students, instID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal membuat dokumen excel"})
		return
	}

	c.Header("Content-Disposition", "attachment; filename=Data_Siswa_Eksport.xlsx")
	c.Header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
	c.Data(http.StatusOK, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", buffer.Bytes())
}

// ExportStudentsPDF: Laporan Resmi Lembaga (Kop Surat Dinamis)
func (h *StudentHandler) ExportStudentsPDF(c *gin.Context) {
	instID := c.GetString("institution_id")
	if c.GetString("role") == "SUPER_ADMIN" {
		if q := c.Query("institution_id"); q != "" {
			instID = q
		}
	}

	filter := domain.StudentFilter{
		InstitutionID:  instID,
		ClassID:        c.Query("class_id"),
		Search:         c.Query("search"),
		Status:         c.Query("status"),
		Gender:         c.Query("gender"),
		AcademicStatus: c.Query("academic_status"),
		Page:           1,
		Limit:          10000,
	}

	students, _, err := h.StudentUsecase.GetStudents(c.Request.Context(), filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data siswa"})
		return
	}

	// Kita tidak lagi mengirim string "Yayasan Kebajikan...", melainkan instID
	pdfBuf, err := h.PdfUsecase.GenerateStudentListPDF(c.Request.Context(), students, instID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal membuat PDF: " + err.Error()})
		return
	}

	c.Header("Content-Disposition", `attachment; filename="Data_Siswa.pdf"`)
	c.Header("Content-Type", "application/pdf")
	c.Data(http.StatusOK, "application/pdf", pdfBuf.Bytes())
}
