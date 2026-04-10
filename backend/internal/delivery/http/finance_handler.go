// LOKASI: internal/delivery/http/finance_handler.go
package http

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"banikarimmekarjaya.id/cbt-backend/internal/domain"
	"banikarimmekarjaya.id/cbt-backend/pkg/utils"
)

type FinanceHandler struct {
	financeUsecase domain.FinanceUsecase
}

func NewFinanceHandler(fu domain.FinanceUsecase) *FinanceHandler {
	return &FinanceHandler{
		financeUsecase: fu,
	}
}

// GetBillings melayani request daftar tagihan dengan fitur paginasi & filter
func (h *FinanceHandler) GetBillings(c *gin.Context) {
	instID := c.GetString("institution_id")

	// Parse pagination
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))

	filter := domain.FinanceBillingFilter{
		InstitutionID: instID,
		Search:        c.Query("search"),
		CategoryID:    c.Query("category_id"),
		Status:        c.Query("status"),
		Pondok:        c.Query("pondok"),
		Asrama:        c.Query("asrama"),
		Page:          page,
		Limit:         limit,
	}

	result, err := h.financeUsecase.GetBillings(c.Request.Context(), filter)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal mengambil data tagihan: "+err.Error())
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Berhasil mengambil data tagihan", result)
}

// ProcessPayment melayani request kasir untuk mencatat pembayaran
func (h *FinanceHandler) ProcessPayment(c *gin.Context) {
	instID := c.GetString("institution_id")
	operatorID := c.GetString("user_id") // ID Admin/Bendahara yang sedang login

	var input domain.ProcessPaymentInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Format input pembayaran tidak valid")
		return
	}

	payment, err := h.financeUsecase.ProcessPayment(c.Request.Context(), instID, operatorID, input)
	if err != nil {
		statusCode := http.StatusInternalServerError
		if err == domain.ErrBadParamInput || err == domain.ErrForbidden {
			statusCode = http.StatusBadRequest
		}
		utils.ErrorResponse(c, statusCode, "Gagal memproses pembayaran: "+err.Error())
		return
	}

	utils.SuccessResponse(c, http.StatusCreated, "Pembayaran berhasil diproses", payment)
}

// ExportBillingReportExcel melayani download laporan excel (meniru format CSV yang Anda lampirkan)
func (h *FinanceHandler) ExportBillingReportExcel(c *gin.Context) {
	instID := c.GetString("institution_id")

	filter := domain.FinanceBillingFilter{
		InstitutionID: instID,
		Search:        c.Query("search"),
		CategoryID:    c.Query("category_id"),
		Status:        c.Query("status"),
		Pondok:        c.Query("pondok"),
		Asrama:        c.Query("asrama"),
	}

	buf, err := h.financeUsecase.ExportBillingReportExcel(c.Request.Context(), filter)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal membuat laporan excel: "+err.Error())
		return
	}

	// Set header agar browser otomatis mengunduh sebagai file Excel
	filename := fmt.Sprintf("Laporan_Pembayaran_%s.xlsx", time.Now().Format("2006-01-02_150405"))
	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=\"%s\"", filename))
	c.Data(http.StatusOK, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", buf.Bytes())
}

// GenerateKartuPembayaranPDF melayani download Kartu Pembayaran (Template Word)
func (h *FinanceHandler) GenerateKartuPembayaranPDF(c *gin.Context) {
	instID := c.GetString("institution_id")
	studentID := c.Param("student_id") // Ambil ID siswa dari URL

	buf, err := h.financeUsecase.GenerateKartuPembayaranPDF(c.Request.Context(), studentID, instID)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal membuat PDF Kartu Pembayaran: "+err.Error())
		return
	}

	c.Header("Content-Disposition", "attachment; filename=\"Kartu_Pembayaran.pdf\"")
	c.Data(http.StatusOK, "application/pdf", buf.Bytes())
}

// GenerateSuratPernyataanPDF melayani input dispensasi sekaligus mencetak Surat Pernyataan
func (h *FinanceHandler) GenerateSuratPernyataanPDF(c *gin.Context) {
	instID := c.GetString("institution_id")
	operatorID := c.GetString("user_id")

	var input domain.CreateRukhsohInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Format input dispensasi tidak valid")
		return
	}

	buf, err := h.financeUsecase.GenerateSuratPernyataanPDF(c.Request.Context(), instID, operatorID, input)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal membuat Surat Pernyataan: "+err.Error())
		return
	}

	c.Header("Content-Disposition", "attachment; filename=\"Surat_Pernyataan_Rukhsoh.pdf\"")
	c.Data(http.StatusOK, "application/pdf", buf.Bytes())
}

func (h *FinanceHandler) HandleGetSummary(c *gin.Context) {
	// Ambil institution_id dari token context (keamanan akses)
	instID := c.GetString("institution_id")

	filter := domain.FinanceBillingFilter{
		InstitutionID: instID,
		Search:        c.Query("search"),
		CategoryID:    c.Query("category_id"),
		Status:        c.Query("status"),
		Pondok:        c.Query("pondok"),
	}

	// Perbaikan: gunakan h.financeUsecase (huruf f kecil) dan c.Request.Context()
	summary, err := h.financeUsecase.GetFinanceSummary(c.Request.Context(), filter)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal mengambil data rekapitulasi keuangan: "+err.Error())
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Berhasil mengambil data rekapitulasi", summary)
}

func (h *FinanceHandler) GetCategories(c *gin.Context) {
	instID := c.GetString("institution_id")

	categories, err := h.financeUsecase.GetCategories(c.Request.Context(), instID)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal mengambil data kategori: "+err.Error())
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Berhasil mengambil kategori", categories)
}

// ==========================================
// HANDLER CRUD KATEGORI
// ==========================================

func (h *FinanceHandler) CreateCategory(c *gin.Context) {
	instID := c.GetString("institution_id")

	var input domain.CategoryInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Format input kategori tidak valid")
		return
	}

	category, err := h.financeUsecase.CreateCategory(c.Request.Context(), instID, input)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal membuat kategori: "+err.Error())
		return
	}

	utils.SuccessResponse(c, http.StatusCreated, "Berhasil membuat kategori", category)
}

func (h *FinanceHandler) UpdateCategory(c *gin.Context) {
	instID := c.GetString("institution_id")
	categoryID := c.Param("id")

	var input domain.CategoryInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Format input kategori tidak valid")
		return
	}

	category, err := h.financeUsecase.UpdateCategory(c.Request.Context(), categoryID, instID, input)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal memperbarui kategori: "+err.Error())
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Berhasil memperbarui kategori", category)
}

func (h *FinanceHandler) DeleteCategory(c *gin.Context) {
	instID := c.GetString("institution_id")
	categoryID := c.Param("id")

	err := h.financeUsecase.DeleteCategory(c.Request.Context(), categoryID, instID)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal menghapus kategori: "+err.Error())
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Berhasil menghapus kategori", nil)
}

// ==========================================
// SISTEM IMPORT EXCEL (ETL)
// ==========================================

// Fase 1: Preview (Hanya membaca kategori unik dari Excel)
func (h *FinanceHandler) PreviewImportExcel(c *gin.Context) {
	fileHeader, err := c.FormFile("file")
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "File excel wajib dilampirkan")
		return
	}

	file, err := fileHeader.Open()
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal membuka file: "+err.Error())
		return
	}
	defer file.Close()

	categories, err := h.financeUsecase.PreviewImportExcel(c.Request.Context(), file)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal membaca excel: "+err.Error())
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Berhasil mengekstrak kategori", categories)
}

// Fase 2: Execute (Menyimpan data dengan mapping kategori)
func (h *FinanceHandler) ExecuteImportExcel(c *gin.Context) {
	instID := c.GetString("institution_id")
	operatorID := c.GetString("user_id")

	fileHeader, err := c.FormFile("file")
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "File excel wajib dilampirkan")
		return
	}

	// Menangkap JSON string hasil mapping dari form-data Frontend
	mappingsJSON := c.PostForm("mappings")
	var mappings []domain.CategoryMapping
	if err := json.Unmarshal([]byte(mappingsJSON), &mappings); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Format mapping kategori tidak valid")
		return
	}

	file, err := fileHeader.Open()
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal membuka file: "+err.Error())
		return
	}
	defer file.Close()

	successCount, err := h.financeUsecase.ExecuteImportExcel(c.Request.Context(), instID, operatorID, file, mappings)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal mengeksekusi import: "+err.Error())
		return
	}

	msg := fmt.Sprintf("Berhasil mengimport %d data pembayaran dari excel", successCount)
	utils.SuccessResponse(c, http.StatusOK, msg, gin.H{"success_count": successCount})
}
func (h *FinanceHandler) GetFilterOptions(c *gin.Context) {
	instID := c.GetString("institution_id") // Kosong jika Super Admin

	options, err := h.financeUsecase.GetFilterOptions(c.Request.Context(), instID)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "Gagal mengambil opsi filter")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "OK", options)
}
