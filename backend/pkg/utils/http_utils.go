package utils

import (
	"bytes"
	"errors"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"ykpbabakanciwaringin.id/cbt-backend/internal/domain"
)

type Meta struct {
	Code    int    `json:"code"`
	Status  string `json:"status"`
	Message string `json:"message"`
}

type JSONResult struct {
	Meta   Meta        `json:"meta"`
	Data   interface{} `json:"data,omitempty"`
	Errors interface{} `json:"errors,omitempty"`
}

// SuccessResponse membungkus balikan sukses dengan format standar
func SuccessResponse(c *gin.Context, code int, message string, data interface{}) {
	c.JSON(code, JSONResult{
		Meta: Meta{Code: code, Status: "success", Message: message},
		Data: data,
	})
}

// ErrorResponse membungkus error dengan format standar
func ErrorResponse(c *gin.Context, code int, message string) {
	status := "error"
	if code >= 500 {
		status = "fail"
	}
	c.JSON(code, JSONResult{
		Meta:   Meta{Code: code, Status: status, Message: message},
		Errors: message,
	})
}

// SmartError mendeteksi jenis error dari layer Domain dan menerjemahkannya ke HTTP Status yang tepat
func SmartError(c *gin.Context, err error) {
	statusCode := http.StatusInternalServerError
	message := "Terjadi kesalahan internal server"

	switch {
	case errors.Is(err, domain.ErrNotFound):
		statusCode = http.StatusNotFound
		message = err.Error()
	case errors.Is(err, domain.ErrUnauthorized):
		statusCode = http.StatusUnauthorized
		message = err.Error()
	case errors.Is(err, domain.ErrBadParamInput), errors.Is(err, domain.ErrInvalidInput):
		statusCode = http.StatusBadRequest
		message = err.Error()
	case errors.Is(err, domain.ErrConflict):
		statusCode = http.StatusConflict
		message = err.Error()
	case errors.Is(err, domain.ErrExamFinished), errors.Is(err, domain.ErrExamNotStarted), errors.Is(err, domain.ErrSessionInactive):
		statusCode = http.StatusForbidden
		message = err.Error()
	case errors.Is(err, domain.ErrForbidden):
		statusCode = http.StatusForbidden
		message = err.Error()
	}

	ErrorResponse(c, statusCode, message)
}

func GetIntQuery(c *gin.Context, key string, defaultValue int) int {
	valStr := c.Query(key)
	if valStr == "" {
		return defaultValue
	}
	val, err := strconv.Atoi(valStr)
	if err != nil {
		return defaultValue
	}
	return val
}

func DownloadFile(c *gin.Context, buf *bytes.Buffer, filename string) {
	c.Header("Content-Disposition", "attachment; filename="+filename)
	c.Header("Content-Type", "application/octet-stream")
	c.Data(http.StatusOK, "application/octet-stream", buf.Bytes())
}
