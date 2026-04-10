// LOKASI: internal/domain/finance.go
package domain

import (
	"bytes"
	"context"
	"mime/multipart"
	"time"
)

type FinanceCategory struct {
	BaseEntity
	InstitutionID string       `gorm:"type:uuid;index;not null" json:"institution_id"`
	Name          string       `gorm:"type:varchar(100);not null" json:"name"`
	CategoryType  string       `gorm:"type:varchar(50);not null" json:"category_type"`
	Alias         string       `gorm:"type:varchar(50)" json:"alias"`
	TargetUnit    string       `gorm:"type:varchar(50)" json:"target_unit"`
	Description   string       `gorm:"type:text" json:"description"`
	Institution   *Institution `gorm:"foreignKey:InstitutionID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"institution,omitempty"`
}

type FinanceBilling struct {
	BaseEntity
	InstitutionID   string           `gorm:"type:uuid;index;not null" json:"institution_id"`
	StudentID       string           `gorm:"type:uuid;index;not null" json:"student_id"`
	CategoryID      string           `gorm:"type:uuid;index;not null" json:"category_id"`
	PeriodName      string           `gorm:"type:varchar(100);not null" json:"period_name"`
	BilledAmount    float64          `gorm:"type:decimal(15,2);not null" json:"billed_amount"`
	RemainingAmount float64          `gorm:"type:decimal(15,2);not null" json:"remaining_amount"`
	DueDate         *time.Time       `json:"due_date"`
	Status          string           `gorm:"type:varchar(50);default:'unpaid'" json:"status"`
	Notes           string           `gorm:"type:text" json:"notes"`
	Institution     *Institution     `gorm:"foreignKey:InstitutionID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"institution,omitempty"`
	Student         *User            `gorm:"foreignKey:StudentID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"student,omitempty"`
	Category        *FinanceCategory `gorm:"foreignKey:CategoryID;constraint:OnUpdate:CASCADE,OnDelete:RESTRICT;" json:"category,omitempty"`
	Payments        []FinancePayment `gorm:"foreignKey:BillingID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"payments,omitempty"`
}

type FinancePayment struct {
	BaseEntity
	InstitutionID string          `gorm:"type:uuid;index;not null" json:"institution_id"`
	BillingID     string          `gorm:"type:uuid;index;not null" json:"billing_id"`
	PaidAmount    float64         `gorm:"type:decimal(15,2);not null" json:"paid_amount"`
	PaymentDate   time.Time       `gorm:"not null" json:"payment_date"`
	Channel       string          `gorm:"type:varchar(50);not null" json:"channel"`
	PaymentType   string          `gorm:"type:varchar(50);not null" json:"payment_type"`
	ProcessedByID string          `gorm:"type:uuid;index;not null" json:"processed_by_id"`
	ReceiptNumber string          `gorm:"type:varchar(100);uniqueIndex" json:"receipt_number"`
	Billing       *FinanceBilling `gorm:"foreignKey:BillingID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"billing,omitempty"`
	ProcessedBy   *User           `gorm:"foreignKey:ProcessedByID;constraint:OnUpdate:CASCADE,OnDelete:RESTRICT;" json:"processed_by,omitempty"`
}

type FinanceRukhsoh struct {
	BaseEntity
	InstitutionID string    `gorm:"type:uuid;index;not null" json:"institution_id"`
	StudentID     string    `gorm:"type:uuid;index;not null" json:"student_id"`
	TotalDebt     float64   `gorm:"type:decimal(15,2);not null" json:"total_debt"`
	PromisedDate  time.Time `gorm:"type:date;not null" json:"promised_date"`
	Reason        string    `gorm:"type:text" json:"reason"`
	Status        string    `gorm:"type:varchar(50);default:'pending'" json:"status"`
	ApprovedByID  *string   `gorm:"type:uuid;index" json:"approved_by_id"`
	Student       *User     `gorm:"foreignKey:StudentID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"student,omitempty"`
	ApprovedBy    *User     `gorm:"foreignKey:ApprovedByID;constraint:OnUpdate:CASCADE,OnDelete:SET NULL;" json:"approved_by,omitempty"`
}

type FinanceBillingFilter struct {
	InstitutionID string
	Search        string
	CategoryID    string
	CategoryType  string
	Status        string
	Pondok        string
	Asrama        string
	Sekolah       string
	Program       string
	Page          int
	Limit         int
}

type CategoryInput struct {
	Name         string `json:"name" binding:"required"`
	CategoryType string `json:"category_type" binding:"required"`
	Alias        string `json:"alias"`
	TargetUnit   string `json:"target_unit"`
	Description  string `json:"description"`
}

type CategoryMapping struct {
	OriginalName string `json:"original_name"`
	CategoryType string `json:"category_type"`
	Alias        string `json:"alias"`
	TargetUnit   string `json:"target_unit"`
}

type FinanceFilterOptions struct {
	Pondoks  []string `json:"pondoks"`
	Sekolahs []string `json:"sekolahs"`
	Programs []string `json:"programs"`
}

type ProcessPaymentInput struct {
	BillingID   string  `json:"billing_id" binding:"required"`
	PaidAmount  float64 `json:"paid_amount" binding:"required,gt=0"`
	Channel     string  `json:"channel" binding:"required"`
	PaymentType string  `json:"payment_type" binding:"required"`
	Notes       string  `json:"notes"`
}

type CreateRukhsohInput struct {
	StudentID    string  `json:"student_id" binding:"required"`
	PromisedDate string  `json:"promised_date" binding:"required"`
	Reason       string  `json:"reason"`
	TotalDebt    float64 `json:"total_debt" binding:"required"`
}

type FinanceSummary struct {
	TotalBilled float64 `json:"total_billed"`
	TotalPaid   float64 `json:"total_paid"`
	TotalUnpaid float64 `json:"total_unpaid"`
}

type FinanceRepository interface {
	GetCategories(ctx context.Context, instID string) ([]FinanceCategory, error)
	FetchBillings(ctx context.Context, filter FinanceBillingFilter) ([]FinanceBilling, int64, error)
	GetBillingByID(ctx context.Context, id string) (*FinanceBilling, error)
	ProcessPaymentTx(ctx context.Context, payment *FinancePayment) error
	GetStudentByNIS(ctx context.Context, nis string, instID string) (*User, error)
	CreateRukhsoh(ctx context.Context, rukhsoh *FinanceRukhsoh) error

	FirstOrCreateCategory(ctx context.Context, category *FinanceCategory) error
	FirstOrCreateBilling(ctx context.Context, billing *FinanceBilling) error
	GetSummary(ctx context.Context, filter FinanceBillingFilter) (FinanceSummary, error)
	GetCategoryByID(ctx context.Context, id string, instID string) (*FinanceCategory, error)
	CreateCategory(ctx context.Context, category *FinanceCategory) error
	UpdateCategory(ctx context.Context, category *FinanceCategory) error
	DeleteCategory(ctx context.Context, id string, instID string) error
	GetUniqueFilterOptions(ctx context.Context, instID string) (FinanceFilterOptions, error)
}

type FinanceUsecase interface {
	GetBillings(ctx context.Context, filter FinanceBillingFilter) (PaginationResult, error)
	ProcessPayment(ctx context.Context, instID string, operatorID string, input ProcessPaymentInput) (*FinancePayment, error)
	PreviewImportExcel(ctx context.Context, file multipart.File) ([]string, error)
	ExecuteImportExcel(ctx context.Context, instID string, operatorID string, file multipart.File, mappings []CategoryMapping) (int, error)

	ExportBillingReportExcel(ctx context.Context, filter FinanceBillingFilter) (*bytes.Buffer, error)
	GenerateKartuPembayaranPDF(ctx context.Context, studentID string, instID string) (*bytes.Buffer, error)
	GenerateSuratPernyataanPDF(ctx context.Context, instID string, operatorID string, input CreateRukhsohInput) (*bytes.Buffer, error)
	GetFinanceSummary(ctx context.Context, filter FinanceBillingFilter) (FinanceSummary, error)
	GetCategories(ctx context.Context, instID string) ([]FinanceCategory, error)
	CreateCategory(ctx context.Context, instID string, input CategoryInput) (*FinanceCategory, error)
	UpdateCategory(ctx context.Context, id string, instID string, input CategoryInput) (*FinanceCategory, error)
	DeleteCategory(ctx context.Context, id string, instID string) error
	GetFilterOptions(ctx context.Context, instID string) (FinanceFilterOptions, error)
}
