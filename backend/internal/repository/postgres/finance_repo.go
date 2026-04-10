// LOKASI: internal/repository/postgres/finance_repo.go
package postgres

import (
	"context"
	"strings"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
	"ykpbabakanciwaringin.id/cbt-backend/internal/domain"
)

type financeRepository struct {
	db *gorm.DB
}

func NewFinanceRepository(db *gorm.DB) domain.FinanceRepository {
	return &financeRepository{db: db}
}

func (r *financeRepository) GetCategories(ctx context.Context, instID string) ([]domain.FinanceCategory, error) {
	var categories []domain.FinanceCategory

	query := r.db.WithContext(ctx)
	if instID != "" {
		query = query.Where("institution_id = ?", instID)
	}

	err := query.Find(&categories).Error
	return categories, err
}

func (r *financeRepository) FetchBillings(ctx context.Context, filter domain.FinanceBillingFilter) ([]domain.FinanceBilling, int64, error) {
	var billings []domain.FinanceBilling
	var total int64

	query := r.db.WithContext(ctx).Model(&domain.FinanceBilling{})

	// JOIN yang aman untuk pencarian dan filter
	query = query.Joins("LEFT JOIN users ON users.id = finance_billings.student_id").
		Joins("LEFT JOIN profiles ON profiles.user_id = users.id").
		Joins("LEFT JOIN finance_categories fc ON fc.id = finance_billings.category_id").
		Joins("LEFT JOIN institutions inst ON inst.id = finance_billings.institution_id")

	if filter.InstitutionID != "" {
		query = query.Where("finance_billings.institution_id = ?", filter.InstitutionID)
	}

	if filter.Search != "" {
		search := "%" + strings.ToLower(filter.Search) + "%"
		query = query.Where("(LOWER(users.username) LIKE ? OR LOWER(profiles.full_name) LIKE ?)", search, search)
	}

	if filter.Status != "" {
		query = query.Where("finance_billings.status = ?", filter.Status)
	}

	if filter.Pondok != "" {
		query = query.Where("profiles.pondok = ?", filter.Pondok)
	}
	if filter.Asrama != "" {
		query = query.Where("profiles.asrama = ?", filter.Asrama)
	}
	if filter.Sekolah != "" {
		query = query.Where("inst.name = ?", filter.Sekolah)
	}
	if filter.Program != "" {
		query = query.Where("profiles.program = ?", filter.Program)
	}

	if filter.CategoryID != "" {
		query = query.Where("finance_billings.category_id = ?", filter.CategoryID)
	}
	if filter.CategoryType != "" {
		query = query.Where("fc.category_type = ?", filter.CategoryType)
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset := (filter.Page - 1) * filter.Limit
	err := query.Preload("Student.Profile").
		Preload("Student.Enrollments").
		Preload("Category").
		Preload("Institution").
		Preload("Payments").
		Order("finance_billings.created_at DESC").
		Offset(offset).Limit(filter.Limit).
		Find(&billings).Error

	return billings, total, err
}

func (r *financeRepository) GetBillingByID(ctx context.Context, id string) (*domain.FinanceBilling, error) {
	var billing domain.FinanceBilling
	err := r.db.WithContext(ctx).
		Preload("Student.Profile").Preload("Student.Enrollments").Preload("Category").
		Preload("Payments").
		Where("id = ?", id).First(&billing).Error
	return &billing, err
}

func (r *financeRepository) ProcessPaymentTx(ctx context.Context, payment *domain.FinancePayment) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(payment).Error; err != nil {
			return err
		}
		var billing domain.FinanceBilling
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).Where("id = ?", payment.BillingID).First(&billing).Error; err != nil {
			return err
		}
		billing.RemainingAmount -= payment.PaidAmount
		if billing.RemainingAmount <= 0 {
			billing.RemainingAmount = 0
			billing.Status = "paid"
		} else {
			billing.Status = "partial"
		}
		return tx.Save(&billing).Error
	})
}

func (r *financeRepository) GetStudentByNIS(ctx context.Context, nis string, _ string) (*domain.User, error) {
	var student domain.User
	err := r.db.WithContext(ctx).
		Preload("Profile").Preload("Enrollments").
		Where("username = ?", nis).First(&student).Error
	return &student, err
}

func (r *financeRepository) CreateRukhsoh(ctx context.Context, rukhsoh *domain.FinanceRukhsoh) error {
	return r.db.WithContext(ctx).Create(rukhsoh).Error
}

func (r *financeRepository) FirstOrCreateCategory(ctx context.Context, category *domain.FinanceCategory) error {
	query := r.db.WithContext(ctx).Where("name = ?", category.Name)
	if category.InstitutionID != "" {
		query = query.Where("institution_id = ?", category.InstitutionID)
	}
	return query.FirstOrCreate(category).Error
}

func (r *financeRepository) FirstOrCreateBilling(ctx context.Context, billing *domain.FinanceBilling) error {
	return r.db.WithContext(ctx).
		Where("student_id = ? AND category_id = ? AND period_name = ?", billing.StudentID, billing.CategoryID, billing.PeriodName).
		Attrs(domain.FinanceBilling{
			InstitutionID: billing.InstitutionID, BilledAmount: billing.BilledAmount,
			RemainingAmount: billing.BilledAmount, Status: "unpaid",
		}).FirstOrCreate(billing).Error
}

func (r *financeRepository) GetSummary(ctx context.Context, filter domain.FinanceBillingFilter) (domain.FinanceSummary, error) {
	var summary domain.FinanceSummary

	// Query Dasar
	query := `
		SELECT 
			COALESCE(SUM(fb.billed_amount), 0) as total_billed,
			COALESCE(SUM(fb.billed_amount - fb.remaining_amount), 0) as total_paid,
			COALESCE(SUM(fb.remaining_amount), 0) as total_unpaid
		FROM finance_billings fb
		LEFT JOIN users u ON fb.student_id = u.id
		LEFT JOIN profiles p ON p.user_id = u.id
		LEFT JOIN finance_categories fc ON fc.id = fb.category_id
		LEFT JOIN institutions inst ON inst.id = fb.institution_id
		WHERE fb.deleted_at IS NULL
	`

	var args []interface{}

	if filter.InstitutionID != "" {
		query += ` AND fb.institution_id = ?`
		args = append(args, filter.InstitutionID)
	}

	if filter.Search != "" {
		query += ` AND (p.full_name ILIKE ? OR u.username ILIKE ?)`
		args = append(args, "%"+filter.Search+"%", "%"+filter.Search+"%")
	}

	if filter.CategoryID != "" {
		query += ` AND fb.category_id = ?`
		args = append(args, filter.CategoryID)
	}

	if filter.Status != "" {
		query += ` AND fb.status = ?`
		args = append(args, filter.Status)
	}

	// Filter Tambahan
	if filter.Pondok != "" {
		query += ` AND p.pondok = ?`
		args = append(args, filter.Pondok)
	}
	if filter.Asrama != "" {
		query += ` AND p.asrama = ?`
		args = append(args, filter.Asrama)
	}
	if filter.Sekolah != "" {
		query += ` AND inst.name = ?`
		args = append(args, filter.Sekolah)
	}
	if filter.Program != "" {
		query += ` AND p.program = ?`
		args = append(args, filter.Program)
	}
	if filter.CategoryType != "" {
		query += ` AND fc.category_type = ?`
		args = append(args, filter.CategoryType)
	}

	err := r.db.WithContext(ctx).Raw(query, args...).Scan(&summary).Error
	if err != nil {
		return summary, err
	}

	return summary, nil
}

func (r *financeRepository) GetCategoryByID(ctx context.Context, id string, instID string) (*domain.FinanceCategory, error) {
	var category domain.FinanceCategory
	query := r.db.WithContext(ctx).Where("id = ?", id)
	if instID != "" {
		query = query.Where("institution_id = ?", instID)
	}
	err := query.First(&category).Error
	return &category, err
}

func (r *financeRepository) CreateCategory(ctx context.Context, category *domain.FinanceCategory) error {
	return r.db.WithContext(ctx).Create(category).Error
}

func (r *financeRepository) UpdateCategory(ctx context.Context, category *domain.FinanceCategory) error {
	return r.db.WithContext(ctx).Save(category).Error
}

func (r *financeRepository) DeleteCategory(ctx context.Context, id string, instID string) error {
	query := r.db.WithContext(ctx).Where("id = ?", id)
	if instID != "" {
		query = query.Where("institution_id = ?", instID)
	}
	return query.Delete(&domain.FinanceCategory{}).Error
}

func (r *financeRepository) GetUniqueFilterOptions(ctx context.Context, instID string) (domain.FinanceFilterOptions, error) {
	var options domain.FinanceFilterOptions

	// 1. Ambil Nama Sekolah (Institutions)
	instQuery := r.db.WithContext(ctx).Model(&domain.Institution{})
	if instID != "" {
		instQuery = instQuery.Where("id = ?", instID)
	}
	instQuery.Pluck("DISTINCT name", &options.Sekolahs)

	// 2. Ambil Program dari tabel Profile
	r.db.WithContext(ctx).Model(&domain.Profile{}).
		Where("program IS NOT NULL AND program != ''").
		Pluck("DISTINCT program", &options.Programs)

	// 3. Ambil Pondok dari tabel Profile
	r.db.WithContext(ctx).Model(&domain.Profile{}).
		Where("pondok IS NOT NULL AND pondok != ''").
		Pluck("DISTINCT pondok", &options.Pondoks)

	return options, nil
}
