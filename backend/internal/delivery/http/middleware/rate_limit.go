package middleware

import (
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"golang.org/x/time/rate"
	"ykpbabakanciwaringin.id/cbt-backend/pkg/utils" // Gunakan Utils
)

type client struct {
	limiter  *rate.Limiter
	lastSeen time.Time
}

type IPLimiter struct {
	ips map[string]*client
	mu  *sync.RWMutex
	r   rate.Limit
	b   int
}

func NewIPLimiter(r rate.Limit, b int) *IPLimiter {
	i := &IPLimiter{
		ips: make(map[string]*client),
		mu:  &sync.RWMutex{},
		r:   r,
		b:   b,
	}
	go i.cleanupWorker()
	return i
}

func (i *IPLimiter) GetLimiter(ip string) *rate.Limiter {
	i.mu.Lock()
	defer i.mu.Unlock()

	c, exists := i.ips[ip]
	if !exists {
		limiter := rate.NewLimiter(i.r, i.b)
		i.ips[ip] = &client{limiter: limiter, lastSeen: utils.NowWIB()}
		return limiter
	}

	c.lastSeen = utils.NowWIB()
	return c.limiter
}

func (i *IPLimiter) cleanupWorker() {
	for {
		time.Sleep(10 * time.Minute)
		i.mu.Lock()
		for ip, client := range i.ips {
			if utils.NowWIB().Sub(client.lastSeen) > 30*time.Minute {
				delete(i.ips, ip)
			}
		}
		i.mu.Unlock()
	}
}

// GetLimiterMiddleware mengembalikan gin.HandlerFunc untuk disuntikkan ke Router
func (i *IPLimiter) GetLimiterMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		ip := c.ClientIP()
		limiter := i.GetLimiter(ip)

		if !limiter.Allow() {
			// [FIX] Gunakan ErrorResponse Standar
			utils.ErrorResponse(c, http.StatusTooManyRequests, "Terlalu banyak permintaan. Mohon tunggu beberapa saat.")
			c.Abort()
			return
		}
		c.Next()
	}
}
