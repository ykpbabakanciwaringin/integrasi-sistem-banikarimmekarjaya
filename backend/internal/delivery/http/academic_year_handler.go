package http

import (
	"fmt"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"ykpbabakanciwaringin.id/cbt-backend/internal/domain"
)

type AcademicYearHandler struct {
	Usecase domain.AcademicYearUsecase
}

func NewAcademicYearHandler(uc domain.AcademicYearUsecase) *AcademicYearHandler {
	return &AcademicYearHandler{Usecase: uc}
}

func (h *AcademicYearHandler) GetAll(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))

	instID := c.GetString("institution_id")
	if c.GetString("role") == "SUPER_ADMIN" {
		if q := c.Query("institution_id"); q != "" {
			instID = q
		}
	}

	filter := domain.AcademicYearFilter{
		InstitutionID: instID,
		Search:        c.Query("search"),
		Page:          page,
		Limit:         limit,
	}

	result, err := h.Usecase.GetAcademicYears(c.Request.Context(), filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, result)
}

func (h *AcademicYearHandler) GetActive(c *gin.Context) {
	instID := c.GetString("institution_id")
	if c.GetString("role") == "SUPER_ADMIN" {
		if q := c.Query("institution_id"); q != "" {
			instID = q
		}
	}

	result, err := h.Usecase.GetActiveAcademicYear(c.Request.Context(), instID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Belum ada tahun ajaran yang aktif"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": result})
}

func (h *AcademicYearHandler) Create(c *gin.Context) {
	// Kita buat struct temporary untuk menangkap input + institution_id
	var input struct {
		domain.AcademicYearInput
		InstitutionID string `json:"institution_id"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	operator := c.GetString("user_id")

	// LOGIKA PENENTUAN INST_ID:
	// 1. Ambil dari token (untuk Admin Lembaga)
	instID := c.GetString("institution_id")

	// 2. Jika Super Admin, izinkan mengambil dari JSON Body
	if c.GetString("role") == "SUPER_ADMIN" && input.InstitutionID != "" {
		instID = input.InstitutionID
	}

	newData, err := h.Usecase.CreateAcademicYear(c.Request.Context(), instID, operator, input.AcademicYearInput)
	if err != nil {
		fmt.Printf("[AcademicYear Error]: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Tahun Ajaran berhasil ditambahkan",
		"data":    newData,
	})
}

func (h *AcademicYearHandler) Update(c *gin.Context) {
	id := c.Param("id")
	var input domain.AcademicYearInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	updatedData, err := h.Usecase.UpdateAcademicYear(c.Request.Context(), id, input)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Tahun Ajaran berhasil diperbarui",
		"data":    updatedData,
	})
}

func (h *AcademicYearHandler) Delete(c *gin.Context) {
	id := c.Param("id")
	if err := h.Usecase.DeleteAcademicYear(c.Request.Context(), id); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Tahun Ajaran berhasil dihapus"})
}

func (h *AcademicYearHandler) SetActive(c *gin.Context) {
	id := c.Param("id")

	activeData, err := h.Usecase.SetActiveAcademicYear(c.Request.Context(), id, "")
	if err != nil {
		fmt.Printf("[AcademicYear SetActive Error]: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Tahun Ajaran berhasil diaktifkan",
		"data":    activeData,
	})
}
