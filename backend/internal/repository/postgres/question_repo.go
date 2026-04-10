// LOKASI: internal/repository/postgres/question_repo.go
package postgres

import (
	"context"

	"gorm.io/gorm"
	"ykpbabakanciwaringin.id/cbt-backend/internal/domain"
)

type questionRepo struct {
	DB *gorm.DB
}

func NewQuestionRepository(db *gorm.DB) domain.QuestionRepository {
	return &questionRepo{DB: db}
}

func (r *questionRepo) UpdatePacket(ctx context.Context, q *domain.QuestionBank) error {
	return r.DB.WithContext(ctx).Model(q).
		Select("Title", "GradeLevel", "SubjectID", "UpdatedAt").
		Updates(q).Error
}

func (r *questionRepo) FetchPackets(ctx context.Context, filter domain.QuestionFilter) ([]domain.QuestionBank, int64, error) {
	var banks []domain.QuestionBank
	var total int64

	// GORM otomatis mengabaikan data yang sudah di-Soft Delete (DeletedAt IS NOT NULL)
	query := r.DB.WithContext(ctx).Model(&domain.QuestionBank{}).
		Select("question_banks.*, (SELECT COUNT(*) FROM question_banks q2 WHERE q2.parent_id = question_banks.id AND q2.deleted_at IS NULL) as item_count").
		Preload("Subject").
		Preload("Teacher.Profile").
		Preload("Institution").
		Where("question_banks.parent_id IS NULL")

	if filter.TeacherID != "" {
		query = query.Where(`
			question_banks.teacher_id = ? OR 
			EXISTS (
				SELECT 1 FROM teaching_allocations ta 
				WHERE ta.teacher_id = ? 
				AND ta.subject_id = question_banks.subject_id 
				AND ta.institution_id = question_banks.institution_id
				AND ta.deleted_at IS NULL
			)
		`, filter.TeacherID, filter.TeacherID)
	}

	if filter.InstitutionID != "" && filter.InstitutionID != "ALL" {
		query = query.Where("question_banks.institution_id = ?", filter.InstitutionID)
	}

	// [PEMBARUAN TAHAP 1] Mengganti LOWER() LIKE menjadi ILIKE untuk performa indeks maksimal
	if filter.Search != "" {
		s := "%" + filter.Search + "%"
		query = query.Where("title ILIKE ?", s)
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset := (filter.Page - 1) * filter.Limit
	err := query.Order("question_banks.created_at DESC").
		Limit(filter.Limit).
		Offset(offset).
		Find(&banks).Error

	return banks, total, err
}

func (r *questionRepo) IsTeacherAssignedToSubject(ctx context.Context, teacherID, subjectID string) bool {
	var count int64
	r.DB.WithContext(ctx).Table("teaching_allocations").
		Where("teacher_id = ? AND subject_id = ? AND deleted_at IS NULL", teacherID, subjectID).
		Count(&count)
	return count > 0
}

func (r *questionRepo) GetPacketByID(ctx context.Context, id string) (*domain.QuestionBank, error) {
	var q domain.QuestionBank
	err := r.DB.WithContext(ctx).
		Preload("Subject").
		Preload("Teacher").
		Preload("Institution").
		Preload("Items", func(db *gorm.DB) *gorm.DB {
			return db.Order("created_at ASC")
		}).
		First(&q, "id = ?", id).Error

	if err != nil {
		return nil, domain.ErrNotFound
	}
	return &q, nil
}

func (r *questionRepo) GetItemByID(ctx context.Context, id string) (*domain.QuestionBank, error) {
	var q domain.QuestionBank
	err := r.DB.WithContext(ctx).First(&q, "id = ?", id).Error
	if err != nil {
		return nil, domain.ErrNotFound
	}
	return &q, nil
}

func (r *questionRepo) CreatePacket(ctx context.Context, q *domain.QuestionBank) error {
	return r.DB.WithContext(ctx).Create(q).Error
}

func (r *questionRepo) CreateItem(ctx context.Context, q *domain.QuestionBank) error {
	return r.DB.WithContext(ctx).Create(q).Error
}

// Bulk Create Massal untuk Excel (Butir Soal)
func (r *questionRepo) BulkCreateItem(ctx context.Context, items []*domain.QuestionBank) error {
	return r.DB.WithContext(ctx).CreateInBatches(items, 100).Error
}

// Bulk Create Massal untuk Paket Soal (Induk)
func (r *questionRepo) BulkCreatePackets(ctx context.Context, packets []*domain.QuestionBank) error {
	// Memasukkan data paket soal dalam batch (100 per proses) agar hemat memori & sangat cepat
	return r.DB.WithContext(ctx).CreateInBatches(packets, 100).Error
}

// [PEMBARUAN] Otomatis menjadi Soft Delete karena struct memiliki gorm.DeletedAt
func (r *questionRepo) DeletePacket(ctx context.Context, id string) error {
	return r.DB.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("parent_id = ?", id).Delete(&domain.QuestionBank{}).Error; err != nil {
			return err
		}
		if err := tx.Delete(&domain.QuestionBank{}, "id = ?", id).Error; err != nil {
			return err
		}
		return nil
	})
}

func (r *questionRepo) UpdateItem(ctx context.Context, q *domain.QuestionBank) error {
	return r.DB.WithContext(ctx).Model(q).
		Select("Content", "AnswerKey", "ScoreWeight", "UpdatedAt").
		Updates(q).Error
}

// [PEMBARUAN] Otomatis menjadi Soft Delete
func (r *questionRepo) DeleteItem(ctx context.Context, id string) error {
	return r.DB.WithContext(ctx).Delete(&domain.QuestionBank{}, "id = ?", id).Error
}

func (r *questionRepo) FetchPacketsWithItems(ctx context.Context, filter domain.QuestionFilter) ([]domain.QuestionBank, error) {
	var banks []domain.QuestionBank

	// Memulai query dengan Preload Items untuk menarik butir soal
	query := r.DB.WithContext(ctx).Model(&domain.QuestionBank{}).
		Preload("Items", func(db *gorm.DB) *gorm.DB {
			return db.Order("created_at ASC") // Urutkan butir soal berdasarkan waktu buat
		}).
		Preload("Subject").
		Preload("Teacher.Profile").
		Preload("Institution").
		Where("question_banks.parent_id IS NULL") // Hanya ambil Paket (Parent)

	// Filter berdasarkan Guru/Akses
	if filter.TeacherID != "" {
		query = query.Where(`
			question_banks.teacher_id = ? OR 
			EXISTS (
				SELECT 1 FROM teaching_allocations ta 
				WHERE ta.teacher_id = ? 
				AND ta.subject_id = question_banks.subject_id 
				AND ta.institution_id = question_banks.institution_id
				AND ta.deleted_at IS NULL
			)
		`, filter.TeacherID, filter.TeacherID)
	}

	// Filter berdasarkan Lembaga
	if filter.InstitutionID != "" && filter.InstitutionID != "ALL" {
		query = query.Where("question_banks.institution_id = ?", filter.InstitutionID)
	}

	// Filter berdasarkan Mata Pelajaran (Jika dipilih)
	if filter.SubjectID != "" {
		query = query.Where("question_banks.subject_id = ?", filter.SubjectID)
	}

	// [PEMBARUAN TAHAP 1] Mengganti LOWER() LIKE menjadi ILIKE untuk performa indeks maksimal
	if filter.Search != "" {
		s := "%" + filter.Search + "%"
		query = query.Where("title ILIKE ?", s)
	}

	// Eksekusi query tanpa limit/offset karena ini untuk EXPORT (ambil semua yang sesuai filter)
	err := query.Order("question_banks.created_at DESC").Find(&banks).Error

	return banks, err
}
