package http

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"ykpbabakanciwaringin.id/cbt-backend/internal/domain"
	"ykpbabakanciwaringin.id/cbt-backend/internal/usecase"
	"ykpbabakanciwaringin.id/cbt-backend/pkg/utils"
)

type AccountHandler struct {
	AccountUsecase usecase.AccountUsecase
}

func NewAccountHandler(uc usecase.AccountUsecase) *AccountHandler {
	return &AccountHandler{AccountUsecase: uc}
}

func (h *AccountHandler) GetAccounts(c *gin.Context) {
	filter := domain.AccountFilter{
		Page:          utils.GetIntQuery(c, "page", 1),
		Limit:         utils.GetIntQuery(c, "limit", 10),
		Search:        c.Query("search"),
		Role:          c.Query("role"),
		InstitutionID: c.Query("institution_id"),
		Status:        c.Query("status"),
	}

	// Jika bukan Super Admin, paksa hanya melihat data sekolahnya sendiri
	if c.GetString("role") != domain.RoleSuperAdmin {
		filter.InstitutionID = c.GetString("institution_id")
	}

	users, total, err := h.AccountUsecase.GetAccounts(c.Request.Context(), filter)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}

	c.JSON(http.StatusOK, domain.PaginationResult{
		Data:       users,
		Total:      total,
		Page:       filter.Page,
		Limit:      filter.Limit,
		TotalPages: int((total + int64(filter.Limit) - 1) / int64(filter.Limit)),
	})
}

func (h *AccountHandler) CreateAccount(c *gin.Context) {
	var input domain.AccountCreateInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Data tidak valid: "+err.Error())
		return
	}

	actorRole := c.GetString("role")
	if err := h.AccountUsecase.CreateAccount(c.Request.Context(), input, actorRole); err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}

	utils.SuccessResponse(c, http.StatusCreated, "Akun berhasil dibuat", nil)
}

func (h *AccountHandler) UpdateAccount(c *gin.Context) {
	id := c.Param("id")
	actorRole := c.GetString("role")
	var input domain.AccountUpdateInput

	// Karena frontend sekarang mengirim JSON MURNI, binding otomatis mulus!
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Format data tidak valid: "+err.Error())
		return
	}

	// Oper langsung ke Usecase
	if err := h.AccountUsecase.UpdateAccount(c.Request.Context(), id, actorRole, input); err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}

	updatedUser, err := h.AccountUsecase.GetAccountByID(c.Request.Context(), id)
	if err != nil {
		// Fallback jika gagal mengambil data
		utils.SuccessResponse(c, http.StatusOK, "Akun berhasil diperbarui", nil)
		return
	}

	updatedUser.Password = "" // Keamanan: hapus password agar tidak bocor ke frontend

	// Balas dengan format data untuk sinkronisasi Zustand
	c.JSON(http.StatusOK, gin.H{
		"message": "Akun berhasil diperbarui",
		"user":    updatedUser,
	})
}

func (h *AccountHandler) DeleteAccount(c *gin.Context) {
	id := c.Param("id")
	actorRole := c.GetString("role")

	if err := h.AccountUsecase.DeleteAccount(c.Request.Context(), id, actorRole); err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}
	utils.SuccessResponse(c, http.StatusOK, "Akun berhasil dihapus", nil)
}

// --- ENROLLMENT HANDLERS ---

func (h *AccountHandler) AddEnrollment(c *gin.Context) {
	userID := c.Param("id")
	var input domain.AddEnrollmentInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, err.Error())
		return
	}

	if err := h.AccountUsecase.AddUserEnrollment(c.Request.Context(), userID, input); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, err.Error())
		return
	}
	utils.SuccessResponse(c, http.StatusCreated, "Penugasan lembaga berhasil ditambahkan", nil)
}

func (h *AccountHandler) UpdateEnrollment(c *gin.Context) {
	userID := c.Param("id")
	enrollmentID := c.Param("enrollment_id")

	var input struct {
		Role     string `json:"role" binding:"required"`
		Position string `json:"position"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Input tidak valid: "+err.Error())
		return
	}

	if err := h.AccountUsecase.UpdateUserEnrollment(c.Request.Context(), userID, enrollmentID, input.Role, input.Position); err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}
	utils.SuccessResponse(c, http.StatusOK, "Penugasan lembaga berhasil diperbarui", nil)
}

func (h *AccountHandler) DeleteEnrollment(c *gin.Context) {
	userID := c.Param("id")
	enrollmentID := c.Param("enrollment_id")

	if err := h.AccountUsecase.DeleteUserEnrollment(c.Request.Context(), userID, enrollmentID); err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}
	utils.SuccessResponse(c, http.StatusOK, "Penugasan lembaga berhasil dihapus", nil)
}
