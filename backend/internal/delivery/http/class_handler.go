// LOKASI: internal/delivery/http/class_handler.go
package http

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"banikarimmekarjaya.id/cbt-backend/internal/domain"
	"banikarimmekarjaya.id/cbt-backend/internal/usecase"
)

type ClassHandler struct {
	ClassUsecase usecase.ClassUsecase
}

func NewClassHandler(uc usecase.ClassUsecase) *ClassHandler {
	return &ClassHandler{ClassUsecase: uc}
}

func (h *ClassHandler) GetClasses(c *gin.Context) {
	instID := c.GetString("institution_id")
	if c.GetString("role") == "SUPER_ADMIN" {
		if q := c.Query("institution_id"); q != "" {
			instID = q
		}
	}

	filter := domain.ClassFilter{
		Level:  c.Query("level"),
		Major:  c.Query("major"),
		Search: c.Query("search"),
	}

	classes, err := h.ClassUsecase.GetClasses(c.Request.Context(), instID, filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Berhasil mengambil data kelas",
		"data":    classes,
	})
}

func (h *ClassHandler) CreateClass(c *gin.Context) {
	var input domain.CreateClassInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if input.InstitutionID == "" {
		input.InstitutionID = c.GetString("institution_id")
	}

	operatorID := c.GetString("user_id")

	newClass, err := h.ClassUsecase.CreateClass(c.Request.Context(), input, operatorID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Kelas berhasil dibuat",
		"data":    newClass,
	})
}

func (h *ClassHandler) UpdateClass(c *gin.Context) {
	id := c.Param("id")
	var input domain.CreateClassInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	updatedClass, err := h.ClassUsecase.UpdateClass(c.Request.Context(), id, input)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Kelas berhasil diperbarui",
		"data":    updatedClass,
	})
}

func (h *ClassHandler) AssignHomeroom(c *gin.Context) {
	id := c.Param("id")
	var input struct {
		TeacherID string `json:"teacher_id" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	updatedClass, err := h.ClassUsecase.SetClassHomeroom(c.Request.Context(), id, input.TeacherID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Wali kelas berhasil ditetapkan",
		"data":    updatedClass,
	})
}

func (h *ClassHandler) DeleteClass(c *gin.Context) {
	id := c.Param("id")
	if err := h.ClassUsecase.DeleteClass(c.Request.Context(), id); err != nil {
		if strings.HasPrefix(err.Error(), "gagal:") {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Kelas berhasil dihapus"})
}

func (h *ClassHandler) ImportClasses(c *gin.Context) {
	file, _, err := c.Request.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "File excel wajib diupload"})
		return
	}
	defer file.Close()

	instID := c.PostForm("institution_id")
	if instID == "" {
		instID = c.GetString("institution_id")
	}

	if err := h.ClassUsecase.ImportClasses(c.Request.Context(), instID, file); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Import data kelas berhasil"})
}
