// LOKASI: internal/repository/postgres/dashboard_repo.go
package postgres

import (
	"context"
	"sync"
	"time"

	"gorm.io/gorm"
	"banikarimmekarjaya.id/cbt-backend/internal/domain"
)

// DashboardRepository adalah interface untuk manajemen statistik
type DashboardRepository interface {
	GetStats(ctx context.Context, instID string) (domain.DashboardStats, error)
	Ping() error
}

type cacheItem struct {
	stats     domain.DashboardStats
	expiresAt time.Time
}

// dashboardRepository adalah implementasi struct (private)
type dashboardRepository struct {
	db    *gorm.DB
	cache sync.Map
}

// NewDashboardRepository adalah constructor
func NewDashboardRepository(db *gorm.DB) DashboardRepository {
	return &dashboardRepository{
		db: db,
	}
}

// GetStats mengambil jumlah data berdasarkan Institution ID
func (r *dashboardRepository) GetStats(ctx context.Context, instID string) (domain.DashboardStats, error) {

	cacheKey := instID
	if cacheKey == "" || cacheKey == "ALL" {
		cacheKey = "GLOBAL"
	}

	// Jika data ada di memori dan belum kadaluarsa (dibawah 5 menit), langsung kembalikan!
	if val, ok := r.cache.Load(cacheKey); ok {
		item := val.(cacheItem)
		if time.Now().Before(item.expiresAt) {
			return item.stats, nil
		}
	}

	var stats domain.DashboardStats
	isGlobal := instID == "" || instID == "ALL"

	var teacherQuery, studentQuery, staffQuery, pendingQuery, classQuery, examQuery, instQuery *gorm.DB

	if isGlobal {
		// Logik Global
		teacherQuery = r.db.WithContext(ctx).Model(&domain.User{}).Where("role = ?", domain.RoleTeacher)
		studentQuery = r.db.WithContext(ctx).Model(&domain.User{}).Where("role = ?", domain.RoleStudent)
		staffQuery = r.db.WithContext(ctx).Model(&domain.User{}).Where("role IN ?", []string{domain.RoleAdmin, domain.RoleAdminAcademic, domain.RoleAdminFinance, domain.RoleSuperAdmin})
		pendingQuery = r.db.WithContext(ctx).Model(&domain.User{}).Where("is_active = ?", false)
		classQuery = r.db.WithContext(ctx).Model(&domain.Class{})
		examQuery = r.db.WithContext(ctx).Model(&domain.ExamSession{}).Where("is_active = ?", true)
		instQuery = r.db.WithContext(ctx).Model(&domain.Institution{})
	} else {
		// Logik Per Lembaga
		teacherQuery = r.db.WithContext(ctx).Model(&domain.Enrollment{}).Where("institution_id = ? AND role = ?", instID, domain.RoleTeacher)
		studentQuery = r.db.WithContext(ctx).Model(&domain.Enrollment{}).Where("institution_id = ? AND role = ?", instID, domain.RoleStudent)
		staffQuery = r.db.WithContext(ctx).Model(&domain.Enrollment{}).Where("institution_id = ? AND role IN ?", instID, []string{domain.RoleAdmin, domain.RoleAdminAcademic, domain.RoleAdminFinance})
		pendingQuery = r.db.WithContext(ctx).Model(&domain.User{}).Joins("JOIN enrollments ON enrollments.user_id = users.id").Where("enrollments.institution_id = ? AND users.is_active = ?", instID, false)
		classQuery = r.db.WithContext(ctx).Model(&domain.Class{}).Where("institution_id = ?", instID)
		examQuery = r.db.WithContext(ctx).Model(&domain.ExamSession{}).Where("institution_id = ? AND is_active = ?", instID, true)
		instQuery = r.db.WithContext(ctx).Model(&domain.Institution{}).Where("id = ?", instID)
	}

	// Eksekusi paralel untuk performa tinggi
	var wg sync.WaitGroup
	var errs []error
	var mu sync.Mutex

	runCount := func(query *gorm.DB, target *int64) {
		defer wg.Done()
		if err := query.Count(target).Error; err != nil {
			mu.Lock()
			errs = append(errs, err)
			mu.Unlock()
		}
	}

	wg.Add(7)
	go runCount(teacherQuery, &stats.TotalTeachers)
	go runCount(studentQuery, &stats.TotalStudents)
	go runCount(staffQuery, &stats.TotalStaff)
	go runCount(pendingQuery, &stats.PendingAccounts)
	go runCount(classQuery, &stats.TotalClasses)
	go runCount(examQuery, &stats.ActiveExams)
	go runCount(instQuery, &stats.TotalInstitutions)

	wg.Wait()

	if len(errs) > 0 {
		return stats, errs[0]
	}

	r.cache.Store(cacheKey, cacheItem{
		stats:     stats,
		expiresAt: time.Now().Add(5 * time.Minute), // Umur Cache: 5 Menit
	})

	return stats, nil
}

func (r *dashboardRepository) Ping() error {
	sqlDB, err := r.db.DB()
	if err != nil {
		return err
	}
	return sqlDB.Ping()
}
