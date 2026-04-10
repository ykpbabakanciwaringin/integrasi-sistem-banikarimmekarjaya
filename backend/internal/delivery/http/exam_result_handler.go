// LOKASI: internal/delivery/http/exam_result_handler.go

package http

import (
	"fmt"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"banikarimmekarjaya.id/cbt-backend/internal/domain"
	"banikarimmekarjaya.id/cbt-backend/pkg/utils"
)

type ExamResultHandler struct {
	ResultUsecase domain.ExamResultUsecase
}

func NewExamResultHandler(uc domain.ExamResultUsecase) *ExamResultHandler {
	return &ExamResultHandler{ResultUsecase: uc}
}

// GetSessionResults mengambil daftar nilai seluruh siswa dalam satu sesi (Format Matriks)
func (h *ExamResultHandler) GetSessionResults(c *gin.Context) {
	sessionID := c.Param("id")
	userID := c.GetString("user_id")
	role := c.GetString("role")

	results, err := h.ResultUsecase.GetCBTResults(c.Request.Context(), sessionID, userID, role)
	if err != nil {
		code := http.StatusInternalServerError
		if strings.Contains(strings.ToLower(err.Error()), "akses ditolak") {
			code = http.StatusForbidden
		}
		utils.ErrorResponse(c, code, "Gagal mengambil rekap nilai: "+err.Error())
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Rekapitulasi nilai berhasil dimuat", results)
}

// ExportSessionResults menghasilkan file Excel berisi matriks nilai multi-mapel
func (h *ExamResultHandler) ExportSessionResults(c *gin.Context) {
	sessionID := c.Param("id")
	userID := c.GetString("user_id")
	role := c.GetString("role")

	buf, filename, err := h.ResultUsecase.ExportCBTResultsExcel(c.Request.Context(), sessionID, userID, role)
	if err != nil {
		utils.ErrorResponse(c, http.StatusForbidden, "Gagal mengekspor laporan Excel: "+err.Error())
		return
	}

	// Mengatur Header untuk unduhan file
	c.Header("Content-Disposition", fmt.Sprintf(`attachment; filename="%s.xlsx"`, filename))
	c.Header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
	c.Data(http.StatusOK, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", buf.Bytes())
}

// ExportSessionResultsPDF menghasilkan file PDF berisi laporan hasil ujian resmi
func (h *ExamResultHandler) ExportSessionResultsPDF(c *gin.Context) {
	sessionID := c.Param("id")
	userID := c.GetString("user_id")
	role := c.GetString("role")

	buf, filename, err := h.ResultUsecase.ExportCBTResultsPDF(c.Request.Context(), sessionID, userID, role)
	if err != nil {
		utils.ErrorResponse(c, http.StatusForbidden, "Gagal mengekspor laporan PDF: "+err.Error())
		return
	}

	// Mengatur Header untuk unduhan file
	c.Header("Content-Disposition", fmt.Sprintf(`attachment; filename="%s.pdf"`, filename))
	c.Header("Content-Type", "application/pdf")
	c.Data(http.StatusOK, "application/pdf", buf.Bytes())
}
