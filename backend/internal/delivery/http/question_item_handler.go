package http

import (
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	"banikarimmekarjaya.id/cbt-backend/internal/domain"
)

type QuestionItemHandler struct {
	// [FIX] Menggunakan interface spesifik Item
	QuestionUsecase domain.QuestionItemUsecase
}

func NewQuestionItemHandler(uc domain.QuestionItemUsecase) *QuestionItemHandler {
	return &QuestionItemHandler{QuestionUsecase: uc}
}

func (h *QuestionItemHandler) CreateItem(c *gin.Context) {
	var input domain.CreateItemInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	teacherID := c.GetString("user_id")
	instID := c.GetString("institution_id")

	if err := h.QuestionUsecase.CreateItem(c.Request.Context(), teacherID, instID, input); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Butir soal berhasil ditambahkan"})
}

func (h *QuestionItemHandler) UpdateItem(c *gin.Context) {
	id := c.Param("id")
	teacherID := c.GetString("user_id")
	role := c.GetString("role")

	var input domain.CreateItemInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.QuestionUsecase.UpdateItem(c.Request.Context(), id, teacherID, role, input); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Butir soal berhasil diperbarui"})
}

func (h *QuestionItemHandler) DeleteItem(c *gin.Context) {
	id := c.Param("id")
	operatorID := c.GetString("user_id")
	role := c.GetString("role")

	if err := h.QuestionUsecase.DeleteItem(c.Request.Context(), id, operatorID, role); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Butir soal dihapus"})
}

func (h *QuestionItemHandler) ImportQuestions(c *gin.Context) {
	file, _, err := c.Request.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "File excel wajib diupload"})
		return
	}
	defer file.Close()

	parentID := c.PostForm("parent_id")
	if parentID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID Paket Soal (parent_id) tidak boleh kosong"})
		return
	}

	count, err := h.QuestionUsecase.ImportQuestions(c.Request.Context(), parentID, file)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": fmt.Sprintf("Berhasil mengimport %d butir soal", count),
		"count":   count,
	})
}
