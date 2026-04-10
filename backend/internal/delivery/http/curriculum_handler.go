// LOKASI: internal/http/curriculum_handler.go
package http

import (
	"fmt"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"banikarimmekarjaya.id/cbt-backend/internal/domain"
)

type CurriculumHandler struct {
	Usecase domain.CurriculumUsecase
}

func NewCurriculumHandler(uc domain.CurriculumUsecase) *CurriculumHandler {
	return &CurriculumHandler{Usecase: uc}
}

func (h *CurriculumHandler) GetCurriculums(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))

	instID := c.GetString("institution_id")
	if c.GetString("role") == "SUPER_ADMIN" {
		if q := c.Query("institution_id"); q != "" {
			instID = q
		}
	}

	filter := domain.CurriculumFilter{
		InstitutionID: instID,
		Search:        c.Query("search"),
		Page:          page,
		Limit:         limit,
	}

	result, err := h.Usecase.GetCurriculums(c.Request.Context(), filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *CurriculumHandler) CreateCurriculum(c *gin.Context) {
	var input struct {
		domain.CurriculumInput
		InstitutionID string `json:"institution_id"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	operator := c.GetString("user_id")
	instID := c.GetString("institution_id")

	if c.GetString("role") == "SUPER_ADMIN" && input.InstitutionID != "" {
		instID = input.InstitutionID
	}

	newData, err := h.Usecase.CreateCurriculum(c.Request.Context(), instID, operator, input.CurriculumInput)
	if err != nil {
		fmt.Printf("[Curriculum Create Error]: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Kurikulum berhasil ditambahkan",
		"data":    newData,
	})
}

func (h *CurriculumHandler) UpdateCurriculum(c *gin.Context) {
	id := c.Param("id")
	var input domain.CurriculumInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	updatedData, err := h.Usecase.UpdateCurriculum(c.Request.Context(), id, input)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Kurikulum berhasil diperbarui",
		"data":    updatedData,
	})
}

func (h *CurriculumHandler) DeleteCurriculum(c *gin.Context) {
	id := c.Param("id")
	if err := h.Usecase.DeleteCurriculum(c.Request.Context(), id); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Kurikulum berhasil dihapus"})
}

func (h *CurriculumHandler) GetSubjectGroups(c *gin.Context) {
	curriculumID := c.Param("id")
	// Kelompok Mapel tidak butuh paginasi kompleks karena datanya sangat sedikit per kurikulum
	result, err := h.Usecase.GetSubjectGroups(c.Request.Context(), curriculumID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": result})
}

func (h *CurriculumHandler) CreateSubjectGroup(c *gin.Context) {
	curriculumID := c.Param("id")
	var input domain.SubjectGroupInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	operator := c.GetString("user_id")

	newData, err := h.Usecase.CreateSubjectGroup(c.Request.Context(), curriculumID, operator, input)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Kelompok Mapel berhasil ditambahkan",
		"data":    newData,
	})
}

func (h *CurriculumHandler) DeleteSubjectGroup(c *gin.Context) {
	id := c.Param("groupId")
	if err := h.Usecase.DeleteSubjectGroup(c.Request.Context(), id); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Kelompok Mapel berhasil dihapus"})
}

func (h *CurriculumHandler) GetHolidays(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))

	instID := c.GetString("institution_id")
	if c.GetString("role") == "SUPER_ADMIN" {
		if q := c.Query("institution_id"); q != "" {
			instID = q
		}
	}

	filter := domain.HolidayFilter{
		InstitutionID: instID,
		YearMonth:     c.Query("month"),
		Search:        c.Query("search"),
		Page:          page,
		Limit:         limit,
	}

	result, err := h.Usecase.GetHolidays(c.Request.Context(), filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *CurriculumHandler) CreateHoliday(c *gin.Context) {
	var input domain.HolidayInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	instID := input.InstitutionID
	if instID == "" {
		instID = c.GetString("institution_id")
	}

	if c.GetString("role") == "SUPER_ADMIN" && c.Query("institution_id") != "" {
		instID = c.Query("institution_id")
	}

	result, err := h.Usecase.CreateHoliday(c.Request.Context(), instID, input)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Hari libur berhasil dicatat", "data": result})
}

func (h *CurriculumHandler) DeleteHoliday(c *gin.Context) {
	id := c.Param("id")
	if err := h.Usecase.DeleteHoliday(c.Request.Context(), id); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Hari libur berhasil dihapus"})
}

func (h *CurriculumHandler) UpdateHoliday(c *gin.Context) {
	id := c.Param("id")
	var input domain.HolidayInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	result, err := h.Usecase.UpdateHoliday(c.Request.Context(), id, input)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": result})
}
