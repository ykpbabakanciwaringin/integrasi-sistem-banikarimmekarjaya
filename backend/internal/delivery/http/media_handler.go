package http

import (
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	"banikarimmekarjaya.id/cbt-backend/internal/usecase"
)

type MediaHandler struct {
	MediaUsecase usecase.MediaUsecase
}

func NewMediaHandler(m usecase.MediaUsecase) *MediaHandler {
	return &MediaHandler{MediaUsecase: m}
}

// POST /utils/upload
func (h *MediaHandler) UploadImage(c *gin.Context) {
	file, header, err := c.Request.FormFile("image")
	if err != nil {
		file, header, err = c.Request.FormFile("file")
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "File tidak ditemukan dalam request"})
			return
		}
	}
	defer file.Close()

	category := c.PostForm("category")
	if category == "" {
		category = "questions" // Default untuk bank soal
	}

	path, err := h.MediaUsecase.UploadImage(file, header, category)
	if err != nil {
		fmt.Println("Upload Error:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menyimpan gambar: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"url": path})
}
