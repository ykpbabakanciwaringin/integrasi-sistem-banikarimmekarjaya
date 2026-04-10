// LOKASI: internal/repository/postgres/exam_event_repo.go
package postgres

import (
	"context"
	"strings"

	"gorm.io/gorm"
	"ykpbabakanciwaringin.id/cbt-backend/internal/domain"
)

type examEventRepo struct {
	DB *gorm.DB
}

func NewExamEventRepository(db *gorm.DB) domain.ExamEventRepository {
	return &examEventRepo{DB: db}
}

func (r *examEventRepo) CreateEvent(ctx context.Context, e *domain.ExamEvent) error {
	return r.DB.WithContext(ctx).Create(e).Error
}

func (r *examEventRepo) GetEventByID(ctx context.Context, id string) (*domain.ExamEvent, error) {
	var event domain.ExamEvent
	// Ambil event sekaligus menghitung jumlah sesi di dalamnya
	err := r.DB.WithContext(ctx).
		Preload("Institution").
		Preload("Sessions").
		First(&event, "id = ?", id).Error
	return &event, err
}

func (r *examEventRepo) FetchEvents(ctx context.Context, filter domain.EventFilter) ([]domain.ExamEvent, int64, error) {
	var events []domain.ExamEvent
	var total int64

	query := r.DB.WithContext(ctx).Model(&domain.ExamEvent{})

	// Filter Dinamis
	if filter.InstitutionID != "" {
		query = query.Where("institution_id = ?", filter.InstitutionID)
	}

	// [PEMBARUAN TAHAP 1] Mengoptimalkan pencarian dengan ILIKE (Case-Insensitive Native)
	if filter.Search != "" {
		searchTerm := "%" + filter.Search + "%"
		query = query.Where("title ILIKE ? OR description ILIKE ?", searchTerm, searchTerm)
	}

	if filter.IsActive != nil {
		query = query.Where("is_active = ?", *filter.IsActive)
	}

	query.Count(&total)

	if filter.Page <= 0 {
		filter.Page = 1
	}
	if filter.Limit <= 0 {
		filter.Limit = 10
	}
	offset := (filter.Page - 1) * filter.Limit

	sortOrder := "DESC"
	if strings.ToUpper(filter.SortOrder) == "ASC" {
		sortOrder = "ASC"
	}

	sortBy := "start_date" // Default pengurutan
	allowedSorts := map[string]string{
		"title":      "title",
		"start_date": "start_date",
		"end_date":   "end_date",
		"is_active":  "is_active",
		"created_at": "created_at",
	}
	if val, ok := allowedSorts[filter.SortBy]; ok {
		sortBy = val
	}

	// Eksekusi Query
	err := query.
		Order(sortBy + " " + sortOrder).
		Limit(filter.Limit).
		Offset(offset).
		Find(&events).Error

	return events, total, err
}

// Pastikan room_count, subject_count, dan status ikut tersimpan saat di-update
func (r *examEventRepo) UpdateEvent(ctx context.Context, e *domain.ExamEvent) error {
	return r.DB.WithContext(ctx).Model(e).
		Select("title", "description", "start_date", "end_date", "is_active", "is_seb_required", "room_count", "subject_count", "status").
		Updates(e).Error
}

func (r *examEventRepo) DeleteEvent(ctx context.Context, id string) error {
	// PENGAMANAN CASCADING: Jika Event dihapus, GORM akan otomatis menghapus
	// Session -> Participant -> Answer berkat constraint OnDelete:CASCADE di Domain
	return r.DB.WithContext(ctx).Delete(&domain.ExamEvent{}, "id = ?", id).Error
}

// =========================================================================================
// [FITUR BARU] MENARIK DATA KARTU UJIAN LEVEL KEGIATAN (ANTI DUPLIKAT & SUPER AMAN)
// =========================================================================================
func (r *examEventRepo) FetchEventCardData(ctx context.Context, eventID string) ([]map[string]interface{}, error) {
	var results []map[string]interface{}

	// Query Raw SQL untuk performa maksimal pada data besar
	query := `
		SELECT DISTINCT ON (ep.student_id)
			ep.student_id,
			COALESCE(p.full_name, u.username) as student_name,
			COALESCE(p.nisn, '-') as student_nisn,
			p.image as photo_url,
			p.birth_place,
			p.birth_date,
			u.username as student_username,
			u.password_plain as student_password,
			COALESCE(c.name, 'Umum') as class_name,
			COALESCE(ep.exam_number, '-') as exam_number,
			inst.name as institution_name,
			inst.logo_url,
			inst.header1, 
			inst.header2, 
			inst.address_detail,
			inst.address_city,
			inst.contact_phone,
			inst.contact_email,
			inst.website
		FROM exam_participants ep
		JOIN users u ON ep.student_id = u.id
		LEFT JOIN profiles p ON u.id = p.user_id
		LEFT JOIN classes c ON p.class_id = c.id
		JOIN exam_sessions es ON ep.exam_session_id = es.id
		JOIN institutions inst ON es.institution_id = inst.id
		WHERE es.exam_event_id = ?
		ORDER BY ep.student_id, es.start_time ASC
	`
	err := r.DB.WithContext(ctx).Raw(query, eventID).Scan(&results).Error
	return results, err
}
