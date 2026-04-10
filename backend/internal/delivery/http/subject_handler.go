// LOKASI: internal/http/subject_handler.go
package http

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"ykpbabakanciwaringin.id/cbt-backend/internal/domain"
)

type SubjectHandler struct {
	Usecase domain.SubjectUsecase
}

func NewSubjectHandler(uc domain.SubjectUsecase) *SubjectHandler {
	return &SubjectHandler{Usecase: uc}
}

func (h *SubjectHandler) GetAll(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))

	instID := c.GetString("institution_id")
	if c.GetString("role") == "SUPER_ADMIN" {
		if q := c.Query("institution_id"); q != "" {
			instID = q
		}
	}

	filter := domain.SubjectFilter{
		InstitutionID: instID,
		Search:        c.Query("search"),
		Page:          page,
		Limit:         limit,
	}

	result, err := h.Usecase.GetSubjects(c.Request.Context(), filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *SubjectHandler) Create(c *gin.Context) {
	var input domain.SubjectInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if c.GetString("role") != "SUPER_ADMIN" {
		input.InstitutionID = c.GetString("institution_id")
	}

	operator := c.GetString("user_id")

	newData, err := h.Usecase.CreateSubject(c.Request.Context(), input, operator)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Mata pelajaran berhasil ditambahkan",
		"data":    newData,
	})
}

func (h *SubjectHandler) Update(c *gin.Context) {
	id := c.Param("id")
	var input domain.SubjectInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	updatedData, err := h.Usecase.UpdateSubject(c.Request.Context(), id, input)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Mata pelajaran diperbarui",
		"data":    updatedData,
	})
}

func (h *SubjectHandler) Delete(c *gin.Context) {
	id := c.Param("id")
	if err := h.Usecase.DeleteSubject(c.Request.Context(), id); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Mata pelajaran dihapus"})
}
