// LOKASI: internal/delivery/http/master_data_handler.go
package http

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"ykpbabakanciwaringin.id/cbt-backend/internal/domain"
	"ykpbabakanciwaringin.id/cbt-backend/internal/usecase"
	"ykpbabakanciwaringin.id/cbt-backend/pkg/utils"
)

type MasterDataHandler struct {
	MasterUsecase usecase.MasterDataUsecase
}

func NewMasterDataHandler(uc usecase.MasterDataUsecase) *MasterDataHandler {
	return &MasterDataHandler{MasterUsecase: uc}
}

// --- ASRAMA ---
func (h *MasterDataHandler) GetDorms(c *gin.Context) {
	instID := c.Query("institution_id") // Boleh dari query atau context login
	if instID == "" {
		instID = c.GetString("institution_id")
	}

	dorms, err := h.MasterUsecase.GetDorms(c.Request.Context(), instID)
	if err != nil {
		utils.SmartError(c, err)
		return
	}
	utils.SuccessResponse(c, http.StatusOK, "Berhasil mengambil data asrama", dorms)
}

func (h *MasterDataHandler) CreateDorm(c *gin.Context) {
	instID := c.GetString("institution_id")
	var input domain.CreateDormInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Format input asrama tidak valid")
		return
	}

	if err := h.MasterUsecase.CreateDorm(c.Request.Context(), instID, input); err != nil {
		utils.SmartError(c, err)
		return
	}
	utils.SuccessResponse(c, http.StatusCreated, "Asrama berhasil ditambahkan", nil)
}

// --- KAMAR ---
func (h *MasterDataHandler) GetRooms(c *gin.Context) {
	dormID := c.Param("dorm_id")
	rooms, err := h.MasterUsecase.GetRooms(c.Request.Context(), dormID)
	if err != nil {
		utils.SmartError(c, err)
		return
	}
	utils.SuccessResponse(c, http.StatusOK, "Berhasil mengambil data kamar", rooms)
}

func (h *MasterDataHandler) CreateRoom(c *gin.Context) {
	dormID := c.Param("dorm_id")
	var input domain.CreateRoomInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Format input kamar tidak valid")
		return
	}

	if err := h.MasterUsecase.CreateRoom(c.Request.Context(), dormID, input); err != nil {
		utils.SmartError(c, err)
		return
	}
	utils.SuccessResponse(c, http.StatusCreated, "Kamar berhasil ditambahkan", nil)
}

// --- PROGRAM PENGUASAAN / JURUSAN ---
func (h *MasterDataHandler) GetPrograms(c *gin.Context) {
	instID := c.Query("institution_id")
	if instID == "" {
		instID = c.GetString("institution_id")
	}

	programs, err := h.MasterUsecase.GetPrograms(c.Request.Context(), instID)
	if err != nil {
		utils.SmartError(c, err)
		return
	}
	utils.SuccessResponse(c, http.StatusOK, "Berhasil mengambil data program", programs)
}

func (h *MasterDataHandler) CreateProgram(c *gin.Context) {
	instID := c.GetString("institution_id")
	var input domain.CreateProgramInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Format input program tidak valid")
		return
	}

	if err := h.MasterUsecase.CreateProgram(c.Request.Context(), instID, input); err != nil {
		utils.SmartError(c, err)
		return
	}
	utils.SuccessResponse(c, http.StatusCreated, "Program berhasil ditambahkan", nil)
}

// --- KELAS PROGRAM ---
func (h *MasterDataHandler) GetClassPrograms(c *gin.Context) {
	programID := c.Param("program_id")
	cps, err := h.MasterUsecase.GetClassPrograms(c.Request.Context(), programID)
	if err != nil {
		utils.SmartError(c, err)
		return
	}
	utils.SuccessResponse(c, http.StatusOK, "Berhasil mengambil data kelas program", cps)
}

func (h *MasterDataHandler) CreateClassProgram(c *gin.Context) {
	programID := c.Param("program_id")
	var input domain.CreateClassProgramInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Format input kelas program tidak valid")
		return
	}

	if err := h.MasterUsecase.CreateClassProgram(c.Request.Context(), programID, input); err != nil {
		utils.SmartError(c, err)
		return
	}
	utils.SuccessResponse(c, http.StatusCreated, "Kelas Program berhasil ditambahkan", nil)
}
