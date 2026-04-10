// LOKASI: internal/domain/common.go
package domain

import (
	"database/sql/driver"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type JSONMap map[string]interface{}

func (j JSONMap) Value() (driver.Value, error) {
	return json.Marshal(j)
}

func (j *JSONMap) Scan(value interface{}) error {
	b, ok := value.([]byte)
	if !ok {
		return errors.New("type assertion to []byte failed")
	}
	return json.Unmarshal(b, &j)
}

type PaginationResult struct {
	Data       interface{} `json:"data"`
	Total      int64       `json:"total"`
	Page       int         `json:"page"`
	Limit      int         `json:"limit"`
	TotalPages int         `json:"total_pages"`
}

type BaseEntity struct {
	ID        uuid.UUID      `gorm:"type:uuid;primary_key" json:"id"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
	CreatedBy string         `gorm:"type:varchar(100)" json:"created_by"`
	UpdatedBy string         `gorm:"type:varchar(100)" json:"updated_by"`
}

// BeforeCreate adalah GORM Hook yang akan mengisi UUID secara otomatis di sisi aplikasi
// Ini memastikan sistem tetap jalan meskipun database tidak punya ekstensi UUID.
func (base *BaseEntity) BeforeCreate(tx *gorm.DB) error {
	if base.ID == uuid.Nil {
		base.ID = uuid.New()
	}
	return nil
}

type DashboardStats struct {
	TotalTeachers     int64 `json:"total_teachers"`
	TotalStudents     int64 `json:"total_students"`
	TotalStaff        int64 `json:"total_staff"`
	PendingAccounts   int64 `json:"pending_accounts"`
	TotalClasses      int64 `json:"total_classes"`
	ActiveExams       int64 `json:"active_exams"`
	TotalInstitutions int64 `json:"total_institutions"`
}

func FormatDateIndo(t time.Time) string {
	loc := time.FixedZone("WIB", 7*3600)
	t = t.In(loc)
	days := []string{"Ahad", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"}
	months := []string{"", "Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"}
	return fmt.Sprintf("%s, %02d %s %d", days[t.Weekday()], t.Day(), months[t.Month()], t.Year())
}
