// LOKASI: internal/usecase/finance_usecase.go
package usecase

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"math"
	"mime/multipart"
	"sort"
	"strconv"
	"strings"
	"time"

	"github.com/xuri/excelize/v2"
	"ykpbabakanciwaringin.id/cbt-backend/internal/domain"
)

type financeUsecase struct {
	financeRepo    domain.FinanceRepository
	instRepo       domain.InstitutionRepository
	contextTimeout time.Duration
}

func NewFinanceUsecase(repo domain.FinanceRepository, instRepo domain.InstitutionRepository, timeout time.Duration) domain.FinanceUsecase {
	return &financeUsecase{
		financeRepo:    repo,
		instRepo:       instRepo,
		contextTimeout: timeout,
	}
}

func (u *financeUsecase) GetBillings(c context.Context, filter domain.FinanceBillingFilter) (domain.PaginationResult, error) {
	ctx, cancel := context.WithTimeout(c, u.contextTimeout)
	defer cancel()
	if filter.Page <= 0 {
		filter.Page = 1
	}
	if filter.Limit <= 0 {
		filter.Limit = 50
	}
	billings, total, err := u.financeRepo.FetchBillings(ctx, filter)
	if err != nil {
		return domain.PaginationResult{}, err
	}
	return domain.PaginationResult{
		Data: billings, Total: total, Page: filter.Page, Limit: filter.Limit,
		TotalPages: int(math.Ceil(float64(total) / float64(filter.Limit))),
	}, nil
}

func (u *financeUsecase) ProcessPayment(c context.Context, instID string, operatorID string, input domain.ProcessPaymentInput) (*domain.FinancePayment, error) {
	ctx, cancel := context.WithTimeout(c, u.contextTimeout)
	defer cancel()
	billing, err := u.financeRepo.GetBillingByID(ctx, input.BillingID)
	if err != nil {
		return nil, err
	}
	payment := &domain.FinancePayment{
		InstitutionID: billing.InstitutionID, BillingID: billing.ID.String(),
		PaidAmount: input.PaidAmount, PaymentDate: time.Now(), Channel: input.Channel,
		PaymentType: input.PaymentType, ProcessedByID: operatorID,
		ReceiptNumber: fmt.Sprintf("INV-%d-%s", time.Now().Unix(), billing.StudentID[:5]),
	}
	err = u.financeRepo.ProcessPaymentTx(ctx, payment)
	return payment, err
}

func (u *financeUsecase) ExportBillingReportExcel(c context.Context, filter domain.FinanceBillingFilter) (*bytes.Buffer, error) {
	ctx, cancel := context.WithTimeout(c, u.contextTimeout)
	defer cancel()

	filter.Page = 1
	filter.Limit = 100000
	billings, _, err := u.financeRepo.FetchBillings(ctx, filter)
	if err != nil {
		return nil, err
	}

	f := excelize.NewFile()
	sheet := "Buku Besar"
	f.SetSheetName("Sheet1", sheet)

	// 1. EKSTRAKSI KOLOM (Header Matriks)
	type colData struct{ ID, Alias, TargetUnit string }
	uniqueColsMap := make(map[string]colData)

	for _, b := range billings {
		if b.CategoryID == "" {
			continue
		}

		if _, exists := uniqueColsMap[b.CategoryID]; !exists {
			alias := "Lainnya"
			targetUnit := "Umum"

			if b.Category != nil {
				alias = b.Category.Name
				if b.Category.Alias != "" {
					alias = b.Category.Alias
				}
				if b.Category.TargetUnit != "" {
					targetUnit = b.Category.TargetUnit
				}
			}

			uniqueColsMap[b.CategoryID] = colData{
				ID:         b.CategoryID,
				Alias:      alias,
				TargetUnit: targetUnit,
			}
		}
	}

	var columns []colData
	for _, v := range uniqueColsMap {
		columns = append(columns, v)
	}
	sort.Slice(columns, func(i, j int) bool {
		return columns[i].Alias < columns[j].Alias
	})

	// 2. GROUPING BARIS (Logic Unit Diperbaiki)
	type studentSummary struct {
		Name      string
		NIS       string
		Unit      string
		Bills     map[string]float64
		TotalDebt float64
	}
	studentMap := make(map[string]*studentSummary)

	for _, b := range billings {
		if _, exists := studentMap[b.StudentID]; !exists {
			name := b.Student.Username
			if b.Student.Profile != nil && b.Student.Profile.FullName != "" {
				name = b.Student.Profile.FullName
			}

			unit := "-"
			if b.Student.Profile != nil && b.Student.Profile.Program != "" {
				unit = b.Student.Profile.Program
			} else if b.Institution != nil {
				unit = b.Institution.Name
			}

			studentMap[b.StudentID] = &studentSummary{
				Name:  name,
				NIS:   b.Student.Username,
				Unit:  unit,
				Bills: make(map[string]float64),
			}
		}
		studentMap[b.StudentID].Bills[b.CategoryID] = b.RemainingAmount
		studentMap[b.StudentID].TotalDebt += b.RemainingAmount
	}

	var matrixData []*studentSummary
	for _, v := range studentMap {
		matrixData = append(matrixData, v)
	}
	sort.Slice(matrixData, func(i, j int) bool {
		return matrixData[i].Name < matrixData[j].Name
	})

	// 3. HEADER
	styleHeader, _ := f.NewStyle(&excelize.Style{
		Font:      &excelize.Font{Bold: true, Color: "FFFFFF", Size: 10},
		Fill:      excelize.Fill{Type: "pattern", Color: []string{"059669"}, Pattern: 1},
		Alignment: &excelize.Alignment{Horizontal: "center", Vertical: "center", WrapText: true},
		Border: []excelize.Border{
			{Type: "left", Color: "A7F3D0", Style: 1}, {Type: "right", Color: "A7F3D0", Style: 1},
			{Type: "top", Color: "A7F3D0", Style: 1}, {Type: "bottom", Color: "A7F3D0", Style: 1},
		},
	})

	f.SetCellValue(sheet, "A1", "NO")
	f.SetCellValue(sheet, "B1", "NAMA SANTRI")
	f.SetCellValue(sheet, "C1", "NIS")
	f.SetCellValue(sheet, "D1", "UNIT / PROGRAM")

	colStartIdx := 5
	for i, col := range columns {
		colName, _ := excelize.ColumnNumberToName(colStartIdx + i)
		f.SetCellValue(sheet, colName+"1", fmt.Sprintf("%s\n(%s)", strings.ToUpper(col.Alias), strings.ToUpper(col.TargetUnit)))
		f.SetColWidth(sheet, colName, colName, 18)
	}

	lastColName, _ := excelize.ColumnNumberToName(colStartIdx + len(columns))
	f.SetCellValue(sheet, lastColName+"1", "TOTAL TUNGGAKAN")

	f.SetColWidth(sheet, "A", "A", 5)
	f.SetColWidth(sheet, "B", "B", 35)
	f.SetColWidth(sheet, "C", "C", 18)
	f.SetColWidth(sheet, "D", "D", 25)
	f.SetColWidth(sheet, lastColName, lastColName, 22)
	f.SetRowHeight(sheet, 1, 35)
	f.SetCellStyle(sheet, "A1", lastColName+"1", styleHeader)

	// 4. BODY
	styleRupiah, _ := f.NewStyle(&excelize.Style{NumFmt: 43, Alignment: &excelize.Alignment{Vertical: "center"}})
	styleCenter, _ := f.NewStyle(&excelize.Style{Alignment: &excelize.Alignment{Horizontal: "center", Vertical: "center"}})
	styleLunas, _ := f.NewStyle(&excelize.Style{
		Font:      &excelize.Font{Color: "10B981", Bold: true},
		Alignment: &excelize.Alignment{Horizontal: "center", Vertical: "center"},
	})
	styleTunggakanFull, _ := f.NewStyle(&excelize.Style{
		Font:      &excelize.Font{Color: "E11D48", Bold: true},
		NumFmt:    43,
		Alignment: &excelize.Alignment{Vertical: "center"},
	})

	for i, row := range matrixData {
		rowIdx := strconv.Itoa(i + 2)
		f.SetCellValue(sheet, "A"+rowIdx, i+1)
		f.SetCellStyle(sheet, "A"+rowIdx, "A"+rowIdx, styleCenter)
		f.SetCellValue(sheet, "B"+rowIdx, row.Name)
		f.SetCellValue(sheet, "C"+rowIdx, row.NIS)
		f.SetCellValue(sheet, "D"+rowIdx, row.Unit)

		for j, col := range columns {
			colName, _ := excelize.ColumnNumberToName(colStartIdx + j)
			cell := colName + rowIdx
			if remaining, exists := row.Bills[col.ID]; exists {
				if remaining == 0 {
					f.SetCellValue(sheet, cell, "LUNAS")
					f.SetCellStyle(sheet, cell, cell, styleLunas)
				} else {
					f.SetCellValue(sheet, cell, remaining)
					f.SetCellStyle(sheet, cell, cell, styleRupiah)
				}
			} else {
				f.SetCellValue(sheet, cell, "-")
				f.SetCellStyle(sheet, cell, cell, styleCenter)
			}
		}
		f.SetCellValue(sheet, lastColName+rowIdx, row.TotalDebt)
		f.SetCellStyle(sheet, lastColName+rowIdx, lastColName+rowIdx, styleTunggakanFull)
	}

	var buf bytes.Buffer
	f.Write(&buf)
	return &buf, nil
}

func (u *financeUsecase) GenerateKartuPembayaranPDF(c context.Context, sID, iID string) (*bytes.Buffer, error) {
	return bytes.NewBufferString(""), nil
}
func (u *financeUsecase) GenerateSuratPernyataanPDF(c context.Context, iID, oID string, in domain.CreateRukhsohInput) (*bytes.Buffer, error) {
	return bytes.NewBufferString(""), nil
}

func (u *financeUsecase) GetFinanceSummary(ctx context.Context, filter domain.FinanceBillingFilter) (domain.FinanceSummary, error) {
	summary, err := u.financeRepo.GetSummary(ctx, filter)
	if err != nil {
		return domain.FinanceSummary{}, err
	}
	return summary, nil
}

func (u *financeUsecase) GetCategories(c context.Context, instID string) ([]domain.FinanceCategory, error) {
	ctx, cancel := context.WithTimeout(c, u.contextTimeout)
	defer cancel()
	return u.financeRepo.GetCategories(ctx, instID)
}

func (u *financeUsecase) CreateCategory(c context.Context, instID string, input domain.CategoryInput) (*domain.FinanceCategory, error) {
	ctx, cancel := context.WithTimeout(c, u.contextTimeout)
	defer cancel()
	category := &domain.FinanceCategory{
		InstitutionID: instID, Name: input.Name, CategoryType: input.CategoryType,
		Alias: input.Alias, TargetUnit: input.TargetUnit, Description: input.Description,
	}
	err := u.financeRepo.CreateCategory(ctx, category)
	return category, err
}

func (u *financeUsecase) UpdateCategory(c context.Context, id string, instID string, input domain.CategoryInput) (*domain.FinanceCategory, error) {
	ctx, cancel := context.WithTimeout(c, u.contextTimeout)
	defer cancel()
	category, err := u.financeRepo.GetCategoryByID(ctx, id, instID)
	if err != nil {
		return nil, errors.New("kategori tidak ditemukan")
	}
	category.Name = input.Name
	category.CategoryType = input.CategoryType
	category.Alias = input.Alias
	category.TargetUnit = input.TargetUnit
	category.Description = input.Description
	err = u.financeRepo.UpdateCategory(ctx, category)
	return category, err
}

func (u *financeUsecase) DeleteCategory(c context.Context, id string, instID string) error {
	ctx, cancel := context.WithTimeout(c, u.contextTimeout)
	defer cancel()
	_, err := u.financeRepo.GetCategoryByID(ctx, id, instID)
	if err != nil {
		return errors.New("kategori tidak valid atau sudah terhapus")
	}
	return u.financeRepo.DeleteCategory(ctx, id, instID)
}

func (u *financeUsecase) PreviewImportExcel(c context.Context, file multipart.File) ([]string, error) {
	f, err := excelize.OpenReader(file)
	if err != nil {
		return nil, errors.New("format excel tidak valid")
	}
	defer f.Close()
	sheetName := f.GetSheetName(f.GetActiveSheetIndex())
	rows, err := f.GetRows(sheetName)
	if err != nil {
		return nil, errors.New("gagal membaca baris excel")
	}
	catMap := make(map[string]bool)
	var uniqueCategories []string
	for i, row := range rows {
		if i == 0 || len(row) <= 14 {
			continue
		}
		catName := strings.TrimSpace(row[14])
		if catName != "" && !catMap[catName] {
			catMap[catName] = true
			uniqueCategories = append(uniqueCategories, catName)
		}
	}
	return uniqueCategories, nil
}

func (u *financeUsecase) ExecuteImportExcel(c context.Context, instID string, operatorID string, file multipart.File, mappings []domain.CategoryMapping) (int, error) {
	ctx, cancel := context.WithTimeout(c, u.contextTimeout)
	defer cancel()
	mapDict := make(map[string]domain.CategoryMapping)
	for _, m := range mappings {
		mapDict[m.OriginalName] = m
	}
	f, err := excelize.OpenReader(file)
	if err != nil {
		return 0, err
	}
	defer f.Close()
	sheetName := f.GetSheetName(f.GetActiveSheetIndex())
	rows, err := f.GetRows(sheetName)
	if err != nil {
		return 0, err
	}
	successCount := 0
	for i, row := range rows {
		if i == 0 || len(row) <= 20 {
			continue
		}
		nis := strings.TrimSpace(row[1])
		categoryName := strings.TrimSpace(row[14])
		periodName := strings.TrimSpace(row[18])
		if periodName == "" {
			periodName = strings.TrimSpace(row[15])
		}
		if periodName == "" {
			periodName = categoryName
		}
		billedAmount, _ := strconv.ParseFloat(strings.TrimSpace(row[5]), 64)
		paidAmount, _ := strconv.ParseFloat(strings.TrimSpace(row[6]), 64)
		var paymentDate time.Time
		if parsedDate, err := time.Parse("2006-01-02 15:04:05", strings.TrimSpace(row[20])); err == nil {
			paymentDate = parsedDate
		} else {
			paymentDate = time.Now()
		}
		student, err := u.financeRepo.GetStudentByNIS(ctx, nis, instID)
		if err != nil || student == nil {
			continue
		}
		actualInstID := instID
		if actualInstID == "" && len(student.Enrollments) > 0 {
			actualInstID = student.Enrollments[0].InstitutionID.String()
		}
		if actualInstID == "" {
			continue
		}
		catType, catAlias, catTarget := "Bulanan", "", "Sekolah"
		if mappedData, exists := mapDict[categoryName]; exists {
			if mappedData.CategoryType != "" {
				catType = mappedData.CategoryType
			}
			catAlias, catTarget = mappedData.Alias, mappedData.TargetUnit
		}
		category := domain.FinanceCategory{
			InstitutionID: actualInstID, Name: categoryName,
			CategoryType: catType, Alias: catAlias, TargetUnit: catTarget,
		}
		_ = u.financeRepo.FirstOrCreateCategory(ctx, &category)
		billing := domain.FinanceBilling{
			InstitutionID: actualInstID, StudentID: student.ID.String(),
			CategoryID: category.ID.String(), PeriodName: periodName,
			BilledAmount: billedAmount, RemainingAmount: billedAmount, Status: "unpaid",
		}
		_ = u.financeRepo.FirstOrCreateBilling(ctx, &billing)
		if paidAmount > 0 {
			payment := domain.FinancePayment{
				InstitutionID: actualInstID, BillingID: billing.ID.String(),
				PaidAmount: paidAmount, PaymentDate: paymentDate, Channel: "cashless",
				PaymentType: "Massal Excel", ProcessedByID: operatorID,
				ReceiptNumber: fmt.Sprintf("EXCEL-%d-%d", time.Now().Unix(), i),
			}
			_ = u.financeRepo.ProcessPaymentTx(ctx, &payment)
		}
		successCount++
	}
	return successCount, nil
}

func (u *financeUsecase) GetFilterOptions(c context.Context, instID string) (domain.FinanceFilterOptions, error) {
	ctx, cancel := context.WithTimeout(c, u.contextTimeout)
	defer cancel()
	return u.financeRepo.GetUniqueFilterOptions(ctx, instID)
}
