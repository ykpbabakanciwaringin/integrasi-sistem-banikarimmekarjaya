// LOKASI: internal/service/exporter/schedule_exporter.go
package exporter

import (
	"bytes"
	"fmt"
	"strings"

	"github.com/jung-kurt/gofpdf"
	"github.com/xuri/excelize/v2"
	"ykpbabakanciwaringin.id/cbt-backend/internal/domain"
	"ykpbabakanciwaringin.id/cbt-backend/pkg/utils/excel_helper"
	"ykpbabakanciwaringin.id/cbt-backend/pkg/utils/pdf_helper"
)

type ScheduleExporter interface {
	GenerateScheduleMatrixExcel(classes []*domain.Class, sessions []domain.ClassSchedule, allocations []domain.TeachingAllocation) (*bytes.Buffer, error)
	GenerateScheduleMatrixPDF(classes []*domain.Class, sessions []domain.ClassSchedule, allocations []domain.TeachingAllocation, kopData pdf_helper.KopSuratData) (*bytes.Buffer, error)
}

type scheduleExporter struct{}

func NewScheduleExporter() ScheduleExporter {
	return &scheduleExporter{}
}

// ========================================================================================
// INTERNAL HELPERS (LOGIKA PRESENTASI)
// ========================================================================================

type teacherLegend struct {
	Code    int
	Teacher string
	Subject string
	JTM     int
}

func (e *scheduleExporter) drawVerticalText(pdf *gofpdf.Fpdf, x, y, w, h float64, text string) {
	lineHeight := 2.5
	runes := []rune(text)
	totalHeight := float64(len(runes)) * lineHeight
	startY := y + (h-totalHeight)/2 + 2
	for i, r := range runes {
		char := string(r)
		cw := pdf.GetStringWidth(char)
		cx := x + (w-cw)/2
		pdf.Text(cx, startY+float64(i)*lineHeight, char)
	}
}

func (e *scheduleExporter) getLegendData(allocations []domain.TeachingAllocation) ([]*teacherLegend, map[string]*teacherLegend) {
	legendMap := make(map[string]*teacherLegend)
	var legends []*teacherLegend
	codeCounter := 1
	for _, alloc := range allocations {
		key := alloc.TeacherID + "_" + alloc.SubjectID
		if _, exists := legendMap[key]; !exists {
			tName, sName := "Guru", "Mapel"
			if alloc.Teacher != nil {
				tName = alloc.Teacher.FullName
			}
			if alloc.Subject != nil {
				sName = alloc.Subject.Name
			}
			leg := &teacherLegend{Code: codeCounter, Teacher: tName, Subject: sName, JTM: 0}
			legendMap[key] = leg
			legends = append(legends, leg)
			codeCounter++
		}
		legendMap[key].JTM += len(alloc.Schedules)
	}
	return legends, legendMap
}

// ========================================================================================
// 1. EXPORT EXCEL (MATRIKS JADWAL PELAJARAN)
// ========================================================================================
func (e *scheduleExporter) GenerateScheduleMatrixExcel(classes []*domain.Class, sessions []domain.ClassSchedule, allocations []domain.TeachingAllocation) (*bytes.Buffer, error) {
	f := excelize.NewFile()
	sheet := "Master Jadwal"
	f.SetSheetName("Sheet1", sheet)
	styles := excel_helper.InitStandardStyles(f)

	// Custom Vertical Style untuk Header
	headerVerticalStyle, _ := f.NewStyle(&excelize.Style{
		Font:      &excelize.Font{Bold: true, Color: "FFFFFF", Size: 9},
		Fill:      excelize.Fill{Type: "pattern", Color: []string{"#047857"}, Pattern: 1},
		Border:    []excelize.Border{{Type: "left", Style: 1}, {Type: "right", Style: 1}, {Type: "top", Style: 1}, {Type: "bottom", Style: 1}},
		Alignment: &excelize.Alignment{Horizontal: "center", Vertical: "center", TextRotation: 90},
	})

	dayMergeStyle, _ := f.NewStyle(&excelize.Style{
		Font:      &excelize.Font{Bold: true, Size: 9},
		Border:    []excelize.Border{{Type: "left", Style: 1}, {Type: "right", Style: 1}, {Type: "top", Style: 1}, {Type: "bottom", Style: 1}},
		Alignment: &excelize.Alignment{Horizontal: "center", Vertical: "center", TextRotation: 90},
	})

	legends, legendMap := e.getLegendData(allocations)

	// --- RENDER HEADER ---
	f.SetCellValue(sheet, "A1", "MASTER MATRIKS JADWAL PELAJARAN")
	endMatCol, _ := excelize.ColumnNumberToName(len(classes) + 2)
	f.MergeCell(sheet, "A1", fmt.Sprintf("%s1", endMatCol))

	f.SetRowHeight(sheet, 3, 60)
	f.SetCellValue(sheet, "A3", "HARI")
	f.SetCellValue(sheet, "B3", "JAM")
	f.SetColWidth(sheet, "A", "A", 5)
	f.SetColWidth(sheet, "B", "B", 15)
	f.SetCellStyle(sheet, "A3", "A3", headerVerticalStyle)
	f.SetCellStyle(sheet, "B3", "B3", styles.Header)

	for i, class := range classes {
		colName, _ := excelize.ColumnNumberToName(i + 3)
		f.SetCellValue(sheet, fmt.Sprintf("%s3", colName), class.Name)
		f.SetColWidth(sheet, colName, colName, 5)
		f.SetCellStyle(sheet, fmt.Sprintf("%s3", colName), fmt.Sprintf("%s3", colName), headerVerticalStyle)
	}

	// --- RENDER BODY & MERGE HARI ---
	currentRow := 4
	startRow := 4
	var currentDay string
	if len(sessions) > 0 {
		currentDay = sessions[0].DayOfWeek
	}

	for _, session := range sessions {
		if session.DayOfWeek != currentDay {
			if currentRow-1 > startRow {
				f.MergeCell(sheet, fmt.Sprintf("A%d", startRow), fmt.Sprintf("A%d", currentRow-1))
				f.SetCellStyle(sheet, fmt.Sprintf("A%d", startRow), fmt.Sprintf("A%d", currentRow-1), dayMergeStyle)
			}
			startRow = currentRow
			currentDay = session.DayOfWeek
		}

		f.SetCellValue(sheet, fmt.Sprintf("A%d", currentRow), strings.ToUpper(session.DayOfWeek))
		f.SetCellValue(sheet, fmt.Sprintf("B%d", currentRow), fmt.Sprintf("%s-%s", session.StartTime, session.EndTime))
		f.SetCellStyle(sheet, fmt.Sprintf("B%d", currentRow), fmt.Sprintf("B%d", currentRow), styles.DataCenter)

		for i, class := range classes {
			colName, _ := excelize.ColumnNumberToName(i + 3)
			txt := "-"
			for _, alloc := range allocations {
				if alloc.ClassID == class.ID.String() {
					for _, s := range alloc.Schedules {
						if s.DayOfWeek == session.DayOfWeek && s.StartTime == session.StartTime {
							key := alloc.TeacherID + "_" + alloc.SubjectID
							txt = fmt.Sprintf("%d", legendMap[key].Code)
						}
					}
				}
			}
			f.SetCellValue(sheet, fmt.Sprintf("%s%d", colName, currentRow), txt)
			f.SetCellStyle(sheet, fmt.Sprintf("%s%d", colName, currentRow), fmt.Sprintf("%s%d", colName, currentRow), styles.DataCenter)
		}
		currentRow++
	}
	// Merge hari terakhir
	if currentRow-1 > startRow {
		f.MergeCell(sheet, fmt.Sprintf("A%d", startRow), fmt.Sprintf("A%d", currentRow-1))
		f.SetCellStyle(sheet, fmt.Sprintf("A%d", startRow), fmt.Sprintf("A%d", currentRow-1), dayMergeStyle)
	}

	// --- RENDER LEGENDS ---
	legStartColIdx := len(classes) + 4
	colK, _ := excelize.ColumnNumberToName(legStartColIdx)
	colL, _ := excelize.ColumnNumberToName(legStartColIdx + 1)
	colM, _ := excelize.ColumnNumberToName(legStartColIdx + 2)
	colN, _ := excelize.ColumnNumberToName(legStartColIdx + 3)

	f.SetCellValue(sheet, fmt.Sprintf("%s3", colK), "KODE")
	f.SetCellValue(sheet, fmt.Sprintf("%s3", colL), "MATA PELAJARAN")
	f.SetCellValue(sheet, fmt.Sprintf("%s3", colM), "GURU")
	f.SetCellValue(sheet, fmt.Sprintf("%s3", colN), "JTM")
	f.SetCellStyle(sheet, fmt.Sprintf("%s3", colK), fmt.Sprintf("%s3", colN), styles.Header)

	f.SetColWidth(sheet, colL, colL, 30)
	f.SetColWidth(sheet, colM, colM, 30)

	legRow := 4
	for _, leg := range legends {
		f.SetCellValue(sheet, fmt.Sprintf("%s%d", colK, legRow), leg.Code)
		f.SetCellValue(sheet, fmt.Sprintf("%s%d", colL, legRow), leg.Subject)
		f.SetCellValue(sheet, fmt.Sprintf("%s%d", colM, legRow), leg.Teacher)
		f.SetCellValue(sheet, fmt.Sprintf("%s%d", colN, legRow), leg.JTM)
		f.SetCellStyle(sheet, fmt.Sprintf("%s%d", colK, legRow), fmt.Sprintf("%s%d", colN, legRow), styles.DataLeft)
		legRow++
	}

	return f.WriteToBuffer()
}

// ========================================================================================
// 2. EXPORT PDF (MATRIKS JADWAL PELAJARAN)
// ========================================================================================
func (e *scheduleExporter) GenerateScheduleMatrixPDF(classes []*domain.Class, sessions []domain.ClassSchedule, allocations []domain.TeachingAllocation, kopData pdf_helper.KopSuratData) (*bytes.Buffer, error) {
	pdf := pdf_helper.SetupPDF("P")
	pdf.SetMargins(10, 10, 10)
	pdf.AddPage()

	// Hitung Statistik Hari untuk Merging Visual
	daySessionCount := make(map[string]int)
	for _, s := range sessions {
		daySessionCount[s.DayOfWeek]++
	}

	qrPayload := "https://ykpbabakanciwaringin.id/verify/schedule"
	pdf_helper.RenderKopSurat(pdf, kopData, qrPayload, true)

	pdf.SetFont("Cambria", "B", 12)
	pdf.CellFormat(190, 7, "MASTER MATRIKS JADWAL PELAJARAN", "", 1, "C", false, 0, "")
	pdf.Ln(3)

	legends, legendMap := e.getLegendData(allocations)

	// Pengaturan Grid
	matriksWidth, colHari, colJam := 130.0, 5.0, 15.0
	colClassWidth := (matriksWidth - colHari - colJam) / float64(len(classes))
	if colClassWidth < 4 {
		colClassWidth = 4
	}

	y := pdf.GetY()
	startY, headerHeight := y, 22.0

	pdf.SetFont("Cambria", "B", 6)
	pdf.SetFillColor(5, 150, 105) // Emerald
	pdf.SetTextColor(255, 255, 255)

	e.drawVerticalText(pdf, 10, y, colHari, headerHeight, "HARI")
	pdf.SetXY(10+colHari, y)
	pdf.CellFormat(colJam, headerHeight, "JAM", "1", 0, "C", true, 0, "")

	cx := 10.0 + colHari + colJam
	for _, c := range classes {
		pdf.SetXY(cx, y)
		pdf.CellFormat(colClassWidth, headerHeight, "", "1", 0, "C", true, 0, "")
		e.drawVerticalText(pdf, cx, y, colClassWidth, headerHeight, c.Name)
		cx += colClassWidth
	}
	y += headerHeight

	// --- RENDER DATA ROWS ---
	pdf.SetTextColor(0, 0, 0)
	rowHeight, currentDay := 6.5, ""
	for _, session := range sessions {
		if y > 260 {
			pdf.AddPage()
			y = 20.0 // Reset Y di halaman baru
		}

		pdf.SetXY(10, y)
		if session.DayOfWeek != currentDay {
			currentDay = session.DayOfWeek
			h := rowHeight * float64(daySessionCount[session.DayOfWeek])
			pdf.SetFont("Cambria", "B", 6)
			e.drawVerticalText(pdf, 10, y, colHari, h, strings.ToUpper(session.DayOfWeek)[:3])
		}

		pdf.SetXY(10+colHari, y)
		pdf.SetFont("Cambria", "", 6)
		pdf.CellFormat(colJam, rowHeight, fmt.Sprintf("%s-%s", session.StartTime, session.EndTime), "1", 0, "C", false, 0, "")

		cx = 10.0 + colHari + colJam
		for _, class := range classes {
			text := "-"
			for _, alloc := range allocations {
				if alloc.ClassID == class.ID.String() {
					for _, s := range alloc.Schedules {
						if s.DayOfWeek == session.DayOfWeek && s.StartTime == session.StartTime {
							key := alloc.TeacherID + "_" + alloc.SubjectID
							text = fmt.Sprintf("%d", legendMap[key].Code)
						}
					}
				}
			}
			pdf.SetXY(cx, y)
			pdf.CellFormat(colClassWidth, rowHeight, text, "1", 0, "C", false, 0, "")
			cx += colClassWidth
		}
		y += rowHeight
	}

	// --- RENDER LEGENDS (DI SAMPING ATAU BAWAH) ---
	ly, lx := startY, 145.0
	pdf.SetFont("Cambria", "B", 7)
	pdf.SetXY(lx, ly)
	pdf.SetFillColor(230, 230, 230)
	pdf.CellFormat(50, 6, " KETERANGAN KODE:", "1", 1, "L", true, 0, "")

	for _, leg := range legends {
		if ly > 260 { // Proteksi overflow legend
			lx += 55
			ly = startY
		}
		pdf.SetXY(lx, pdf.GetY())
		pdf.SetFont("Cambria", "", 6)
		txt := fmt.Sprintf("%d: %s (%s)", leg.Code, leg.Subject, leg.Teacher)
		if len(txt) > 45 {
			txt = txt[:42] + "..."
		}
		pdf.CellFormat(50, 5, " "+txt, "1", 1, "L", false, 0, "")
	}

	var buf bytes.Buffer
	err := pdf.Output(&buf)
	return &buf, err
}
