// LOKASI: internal/delivery/http/middleware/seb_middleware.go
package middleware

import (
	"net/http"
	"os"
	"strings"

	"github.com/gin-gonic/gin"
	"ykpbabakanciwaringin.id/cbt-backend/internal/domain"
	"ykpbabakanciwaringin.id/cbt-backend/pkg/logger"
	"ykpbabakanciwaringin.id/cbt-backend/pkg/utils"
)

// Middleware SEB Dinamis (Mengecek Wajib SEB dari Database)
func SEBMiddleware(examRepo domain.ExamExecutionRepository, studentExamRepo domain.StudentExamRepository) gin.HandlerFunc {
	return func(c *gin.Context) {
		// [PEMBARUAN TAHAP 2]: Menghemat CPU & RAM.
		// Tidak lagi membaca io.ReadAll(Body) dan Unmarshal JSON di level Middleware.
		// Kita langsung mengambil identitas sesi dari HTTP Header atau Query Param.

		sessionID := c.GetHeader("X-Session-ID")
		if sessionID == "" {
			sessionID = c.Query("session_id")
		}

		token := c.GetHeader("X-Exam-Token")
		if token == "" {
			token = c.Query("token")
		}

		var isSEBRequired bool
		var err error

		// Tentukan status Wajib SEB berdasarkan rute (Start pakai Token, Sync/Heartbeat pakai SessionID)
		if sessionID != "" {
			isSEBRequired, err = studentExamRepo.GetSEBStatusBySession(c.Request.Context(), sessionID)
		} else if token != "" {
			session, errToken := examRepo.GetActiveSessionByToken(c.Request.Context(), token)
			if errToken == nil {
				isSEBRequired, err = studentExamRepo.GetSEBStatusBySession(c.Request.Context(), session.ID.String())
			}
		}

		// Jika terjadi error (data tidak ditemukan) atau ujian TIDAK mewajibkan SEB, biarkan lolos
		if err != nil || !isSEBRequired {
			c.Next()
			return
		}

		// =======================================================
		// 🛡️ ZONA KEAMANAN KETAT (HANYA JIKA UJIAN WAJIB SEB)
		// =======================================================

		userAgent := c.GetHeader("User-Agent")
		userAgentLower := strings.ToLower(userAgent)

		// A. Validasi Dasar User-Agent
		if !strings.Contains(userAgentLower, "safeexambrowser") && !strings.Contains(userAgentLower, "seb") {
			logger.Infof("Bukan browser SEB (User-Agent: %s) terdeteksi dari IP %s", userAgent, c.ClientIP())
			utils.ErrorResponse(c, http.StatusForbidden, "SEB_REQUIRED: Ujian ini wajib menggunakan aplikasi Safe Exam Browser (SEB) resmi lembaga.")
			c.Abort()
			return
		}

		// B. Validasi Kriptografi Hash (Standar Industri)
		configKeyHash := c.GetHeader("X-SafeExamBrowser-ConfigKeyHash")
		requestHash := c.GetHeader("X-SafeExamBrowser-RequestHash")

		if configKeyHash == "" && requestHash == "" {
			logger.Infof("Percobaan bypass SEB (Missing Hash) terdeteksi dari IP %s", c.ClientIP())
			utils.ErrorResponse(c, http.StatusForbidden, "SECURITY_BREACH: Hash Konfigurasi SEB tidak terdeteksi. Silakan gunakan file .seb yang valid.")
			c.Abort()
			return
		}

		// C. Otorisasi Konfigurasi (Mencegah Siswa merakit file .seb sendiri untuk curang)
		expectedHash := os.Getenv("SEB_EXPECTED_CONFIG_HASH")
		if expectedHash != "" {
			// Periksa jika configKeyHash dikirimkan dan tidak cocok dengan server
			if configKeyHash != "" && configKeyHash != expectedHash {
				logger.Infof("Percobaan bypass SEB (Invalid Hash: %s) terdeteksi dari IP %s", configKeyHash, c.ClientIP())
				utils.ErrorResponse(c, http.StatusForbidden, "SECURITY_BREACH: Konfigurasi SEB Anda telah dimodifikasi (TIDAK VALID). Silakan hubungi pengawas.")
				c.Abort()
				return
			}
		}

		c.Next()
	}
}
