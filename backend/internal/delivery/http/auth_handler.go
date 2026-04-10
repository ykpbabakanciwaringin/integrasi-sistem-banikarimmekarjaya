// LOKASI: internal/delivery/http/auth_handler.go
package http

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"ykpbabakanciwaringin.id/cbt-backend/internal/domain"
	"ykpbabakanciwaringin.id/cbt-backend/internal/usecase"
	"ykpbabakanciwaringin.id/cbt-backend/pkg/utils"
)

type AuthHandler struct {
	AuthUsecase usecase.AuthUsecase
}

func NewAuthHandler(uc usecase.AuthUsecase) *AuthHandler {
	return &AuthHandler{AuthUsecase: uc}
}

func (h *AuthHandler) Login(c *gin.Context) {
	var input domain.LoginRequest
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	res, err := h.AuthUsecase.Login(c.Request.Context(), input)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, res)
}

func (h *AuthHandler) ResetPassword(c *gin.Context) {
	var input struct {
		NIP string `json:"nip" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err := h.AuthUsecase.ResetTeacherPassword(c.Request.Context(), input.NIP)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Password baru telah dikirim ke WhatsApp terdaftar."})
}

func (h *AuthHandler) CheckSetup(c *gin.Context) {
	isRequired, err := h.AuthUsecase.IsSetupRequired(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, domain.SetupStatusResponse{
		IsSetupRequired: isRequired,
	})
}

func (h *AuthHandler) SetupFirstAdmin(c *gin.Context) {
	var input domain.RegisterAdminInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err := h.AuthUsecase.RegisterFirstSuperAdmin(c.Request.Context(), input)
	if err != nil {
		if err.Error() == "setup sudah selesai, tidak bisa membuat super admin baru lewat jalur ini" {
			c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Super Admin berhasil dibuat. Silakan login."})
}

func (h *AuthHandler) GetAccounts(c *gin.Context) {
	page := utils.GetIntQuery(c, "page", 1)
	limit := utils.GetIntQuery(c, "limit", 10)
	search := c.Query("search")
	role := c.Query("role")
	instID := c.Query("institution_id")
	status := c.Query("status")

	users, total, err := h.AuthUsecase.GetAccounts(c.Request.Context(), page, limit, search, role, instID, status)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":  users,
		"total": total,
		"page":  page,
		"limit": limit,
	})
}

func (h *AuthHandler) CreateAccount(c *gin.Context) {
	var input struct {
		domain.RegisterAdminInput
		Role          string `json:"role" binding:"required"`
		InstitutionID string `json:"institution_id"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err := h.AuthUsecase.CreateAccount(c.Request.Context(), input.RegisterAdminInput, input.Role, input.InstitutionID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"message": "Akun berhasil dibuat"})
}

func (h *AuthHandler) UpdateAccount(c *gin.Context) {
	id := c.Param("id")
	var input map[string]interface{}
	actorRole := c.GetString("role")

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Format data tidak valid: " + err.Error()})
		return
	}

	err := h.AuthUsecase.UpdateAccount(c.Request.Context(), id, actorRole, input)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Akun berhasil diperbarui"})
}

func (h *AuthHandler) UpdateMyProfile(c *gin.Context) {
	userID := c.GetString("user_id")
	actorRole := c.GetString("role")
	var input map[string]interface{}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Format data tidak valid: " + err.Error()})
		return
	}

	err := h.AuthUsecase.UpdateAccount(c.Request.Context(), userID, actorRole, input)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	updatedUser, err := h.AuthUsecase.GetMe(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"message": "Profil berhasil diperbarui"})
		return
	}
	updatedUser.Password = ""

	c.JSON(http.StatusOK, gin.H{
		"message": "Profil berhasil diperbarui",
		"user":    updatedUser,
	})
}

func (h *AuthHandler) DeleteAccount(c *gin.Context) {
	id := c.Param("id")
	err := h.AuthUsecase.DeleteAccount(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Akun berhasil dihapus"})
}

func (h *AuthHandler) RegisterPublic(c *gin.Context) {
	var input domain.RegisterPublicInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, err.Error())
		return
	}

	err := h.AuthUsecase.RegisterPublic(c.Request.Context(), input)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, err.Error())
		return
	}

	utils.SuccessResponse(c, http.StatusCreated, "Pendaftaran berhasil. Silakan tunggu admin memverifikasi akun Anda.", nil)
}

func (h *AuthHandler) RequestResetPassword(c *gin.Context) {
	var input domain.ResetPasswordInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, err.Error())
		return
	}

	err := h.AuthUsecase.RequestResetPassword(c.Request.Context(), input)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, err.Error())
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Instruksi pemulihan kata sandi telah dikirim ke "+input.Method+" Anda.", nil)
}

func (h *AuthHandler) GetMe(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	uid, ok := userID.(string)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid user ID token"})
		return
	}

	user, err := h.AuthUsecase.GetMe(c.Request.Context(), uid)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User tidak ditemukan"})
		return
	}

	user.Password = ""

	c.JSON(http.StatusOK, gin.H{
		"user": user,
	})
}

func (h *AuthHandler) SwitchInstitution(c *gin.Context) {
	// Gunakan struct anonim agar bebas dari aturan binding:"required" yang ketat
	var input struct {
		TargetInstitutionID string `json:"target_institution_id"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, err.Error())
		return
	}

	userID := c.GetString("user_id")

	res, err := h.AuthUsecase.SwitchInstitution(c.Request.Context(), userID, input.TargetInstitutionID)
	if err != nil {
		// Kembalikan 403 persis seperti aslinya jika ditolak
		utils.ErrorResponse(c, http.StatusForbidden, err.Error())
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Berhasil beralih lembaga. Gunakan token baru ini untuk permintaan selanjutnya.", res)
}

func (h *AuthHandler) ChangePassword(c *gin.Context) {
	var input struct {
		OldPassword string `json:"old_password" binding:"required"`
		NewPassword string `json:"new_password" binding:"required,min=6"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Input tidak valid: "+err.Error())
		return
	}

	userID := c.GetString("user_id")
	if userID == "" {
		utils.ErrorResponse(c, http.StatusUnauthorized, "Akses ditolak, sesi tidak valid")
		return
	}

	err := h.AuthUsecase.ChangePassword(c.Request.Context(), userID, input.OldPassword, input.NewPassword)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, err.Error())
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Kata sandi berhasil diubah", nil)
}
