// LOKASI: internal/delivery/http/institution_handler.go
package http

import (
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"ykpbabakanciwaringin.id/cbt-backend/internal/domain"
	"ykpbabakanciwaringin.id/cbt-backend/internal/usecase"
	"ykpbabakanciwaringin.id/cbt-backend/pkg/utils/pdf_helper"
)

type InstitutionHandler struct {
	InstUsecase usecase.InstitutionUsecase
}

func NewInstitutionHandler(uc usecase.InstitutionUsecase) *InstitutionHandler {
	return &InstitutionHandler{InstUsecase: uc}
}

func (h *InstitutionHandler) GetAll(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	search := c.Query("search")

	filter := domain.InstitutionFilter{
		Page:   page,
		Limit:  limit,
		Search: search,
	}

	result, err := h.InstUsecase.GetAll(c.Request.Context(), filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *InstitutionHandler) Create(c *gin.Context) {
	var input domain.CreateInstitutionInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	inst, err := h.InstUsecase.Create(c.Request.Context(), input)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Lembaga berhasil dibuat",
		"data":    inst,
	})
}

func (h *InstitutionHandler) Update(c *gin.Context) {
	id := c.Param("id")
	var input domain.CreateInstitutionInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	inst, err := h.InstUsecase.Update(c.Request.Context(), id, input)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Lembaga berhasil diperbarui",
		"data":    inst,
	})
}

func (h *InstitutionHandler) Delete(c *gin.Context) {
	id := c.Param("id")
	if err := h.InstUsecase.Delete(c.Request.Context(), id); err != nil {
		if strings.HasPrefix(err.Error(), "gagal:") {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Lembaga berhasil dihapus"})
}

func (h *InstitutionHandler) Import(c *gin.Context) {
	file, _, err := c.Request.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "File excel wajib diupload"})
		return
	}
	defer file.Close()

	count, err := h.InstUsecase.Import(c.Request.Context(), file)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Import data lembaga berhasil", "count": count})
}

func (h *InstitutionHandler) UpdateWeeklyDayOff(c *gin.Context) {
	var input struct {
		WeeklyDayOff string `json:"weekly_day_off"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	instID := c.Query("institution_id")
	if instID == "" {
		instID = c.GetString("institution_id")
	}

	if err := h.InstUsecase.UpdateWeeklyDayOff(c.Request.Context(), instID, input.WeeklyDayOff); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Hari libur mingguan berhasil diperbarui"})
}

func (h *InstitutionHandler) UpdatePqSettings(c *gin.Context) {
	id := c.Param("id")
	var input struct {
		Enabled    bool   `json:"is_pq_integration_enabled"`
		PartnerKey string `json:"pq_partner_key"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(400, gin.H{"error": "Format input tidak valid"})
		return
	}

	if err := h.InstUsecase.UpdatePqSettings(c.Request.Context(), id, input.Enabled, input.PartnerKey); err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	c.JSON(200, gin.H{"message": "Pengaturan integrasi API Pihak Ketiga berhasil diperbarui"})
}

// =========================================================================
// HANDLER EXPORT (EXCEL & PDF) - BARU
// =========================================================================

func (h *InstitutionHandler) ExportExcel(c *gin.Context) {
	search := c.Query("search")

	filter := domain.InstitutionFilter{
		Search: search,
	}

	buf, err := h.InstUsecase.ExportExcel(c.Request.Context(), filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghasilkan file Excel: " + err.Error()})
		return
	}

	c.Header("Content-Disposition", "attachment; filename=Data_Lembaga.xlsx")
	c.Data(http.StatusOK, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", buf.Bytes())
}

func (h *InstitutionHandler) ExportPDF(c *gin.Context) {
	search := c.Query("search")

	filter := domain.InstitutionFilter{
		Search: search,
	}

	// Menyiapkan Data Kop Surat Default untuk Laporan Super Admin
	kopData := pdf_helper.KopSuratData{
		Name:           "YAYASAN KEBAJIKAN PESANTREN",
		FoundationName: "DAFTAR LEMBAGA PENDIDIKAN",
		Header1:        "PUSAT DATA ADMINISTRASI",
		AddressDetail:  "Jl. Gondang Manis No.52 RT 002 RW 002 Ds. Babakan Kec. Ciwaringin",
		AddressCity:    "Kab. Cirebon Jawa Barat 45167",
		ContactPhone:   "085123456789",
		Website:        "www.ykpbabakanciwaringin.id",
	}

	buf, err := h.InstUsecase.ExportPDF(c.Request.Context(), filter, kopData)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghasilkan file PDF: " + err.Error()})
		return
	}

	c.Header("Content-Disposition", "attachment; filename=Data_Lembaga.pdf")
	c.Data(http.StatusOK, "application/pdf", buf.Bytes())
}
