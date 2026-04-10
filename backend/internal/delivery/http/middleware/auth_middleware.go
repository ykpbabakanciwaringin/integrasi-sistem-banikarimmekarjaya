// LOKASI: internal/delivery/http/middleware/auth_middleware.go
package middleware

import (
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"banikarimmekarjaya.id/cbt-backend/internal/domain"
	"banikarimmekarjaya.id/cbt-backend/pkg/utils"
)

// In-Memory Cache untuk TokenVersion agar tidak memukul DB setiap request (Anti-DDoS Internal)
type tokenCacheItem struct {
	Version   int
	Position  string
	ExpiresAt time.Time
}

var tokenVersionCache sync.Map

// [PEMBARUAN TAHAP 2]: Pekerja Latar Belakang (Background Worker) untuk mencegah Memory Leak.
// Fungsi init() otomatis dipanggil sekali saat aplikasi Golang pertama kali dijalankan.
func init() {
	go func() {
		// Looping tak terbatas yang berjalan di background
		for {
			// Tidur selama 10 menit, lalu bangun untuk menyapu RAM
			time.Sleep(10 * time.Minute)
			now := utils.NowWIB()

			// Iterasi seluruh isi sync.Map
			tokenVersionCache.Range(func(key, value interface{}) bool {
				if item, ok := value.(tokenCacheItem); ok {
					// Jika token sudah kedaluwarsa, hapus dari memori RAM
					if now.After(item.ExpiresAt) {
						tokenVersionCache.Delete(key)
					}
				}
				return true // Lanjutkan ke baris data berikutnya
			})
		}
	}()
}

func AuthMiddleware(secretKey string, userRepo domain.UserRepository) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			utils.ErrorResponse(c, http.StatusUnauthorized, "Akses ditolak: Token tidak ditemukan")
			c.Abort()
			return
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			utils.ErrorResponse(c, http.StatusUnauthorized, "Akses ditolak: Format token tidak valid")
			c.Abort()
			return
		}

		claims, err := utils.ParseToken(parts[1], secretKey)
		if err != nil {
			utils.ErrorResponse(c, http.StatusUnauthorized, "Sesi telah berakhir atau token tidak valid")
			c.Abort()
			return
		}

		// LOGIKA HIGH-PERFORMANCE: Cek Cache dulu sebelum tembak Database
		now := utils.NowWIB()
		isValid := false
		userPosition := ""

		if val, ok := tokenVersionCache.Load(claims.UserID); ok {
			if cachedItem, ok := val.(tokenCacheItem); ok {
				if now.Before(cachedItem.ExpiresAt) {
					// Cache masih valid, cek versinya
					if cachedItem.Version == claims.TokenVersion {
						isValid = true
						userPosition = cachedItem.Position
					}
				}
			}
		}

		// Jika tidak ada di cache atau cache expired, baru kita query ke DB
		if !isValid {
			user, err := userRepo.FetchByID(c.Request.Context(), claims.UserID)
			if err != nil || user == nil {
				utils.ErrorResponse(c, http.StatusUnauthorized, "User tidak ditemukan")
				c.Abort()
				return
			}

			if user.TokenVersion != claims.TokenVersion {
				utils.ErrorResponse(c, http.StatusUnauthorized, "Sesi berakhir. Akun Anda telah login di perangkat lain.")
				c.Abort()
				return
			}

			if user.Profile != nil {
				userPosition = user.Profile.Position
			}

			// Simpan ke cache untuk 3 menit ke depan (Menghemat ribuan Query DB)
			tokenVersionCache.Store(claims.UserID, tokenCacheItem{
				Version:   user.TokenVersion,
				Position:  userPosition,
				ExpiresAt: now.Add(3 * time.Minute),
			})
		}

		c.Set("user_id", claims.UserID)
		c.Set("username", claims.Username)
		c.Set("institution_id", claims.InstitutionID)
		c.Set("role", claims.Role)
		c.Set("position", userPosition)
		c.Next()
	}
}

// RoleMiddleware untuk RBAC (Role-Based Access Control)
func RoleMiddleware(allowedRoles ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		userRole := c.GetString("role")

		allowed := false
		for _, role := range allowedRoles {
			if role == userRole {
				allowed = true
				break
			}
		}

		if !allowed {
			utils.ErrorResponse(c, http.StatusForbidden, "Akses ditolak: Role Anda ("+userRole+") tidak memiliki izin ke area ini")
			c.Abort()
			return
		}
		c.Next()
	}
}
