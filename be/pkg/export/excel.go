// Package export provides cross-cutting helpers for generating downloadable
// reports (currently Excel/.xlsx). Every module that needs an export — payroll,
// attendance, visits, reimbursement, etc. — should use this instead of rolling
// its own xlsx writer.
package export

import (
	"bytes"
	"fmt"
	"io"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/xuri/excelize/v2"
)

// Column describes a single exported column.
//   - Header: the bold header text shown in row 1
//   - Key:    the key to look up in each row's map[string]interface{}
//   - Width:  optional column width in characters (e.g. 20). 0 = auto/default.
//   - Format: optional excel number-format string (e.g. "#,##0.00" or
//             "yyyy-mm-dd"). Empty = no format applied.
type Column struct {
	Header string
	Key    string
	Width  float64
	Format string
}

const defaultSheet = "Sheet1"

// WriteTo streams an .xlsx file containing the given rows to w.
// sheetName defaults to "Sheet1" if empty.
func WriteTo(w io.Writer, sheetName string, cols []Column, rows []map[string]interface{}) error {
	if sheetName == "" {
		sheetName = defaultSheet
	}

	f := excelize.NewFile()
	defer func() { _ = f.Close() }()

	// The new file starts with "Sheet1". If the caller wants a different name, rename it.
	if sheetName != defaultSheet {
		if err := f.SetSheetName(defaultSheet, sheetName); err != nil {
			return fmt.Errorf("rename sheet: %w", err)
		}
	}

	// Header style — bold + light fill
	headerStyle, err := f.NewStyle(&excelize.Style{
		Font: &excelize.Font{Bold: true},
		Fill: excelize.Fill{Type: "pattern", Color: []string{"E5E7EB"}, Pattern: 1},
	})
	if err != nil {
		return fmt.Errorf("create header style: %w", err)
	}

	// Write headers
	for i, col := range cols {
		cell, err := excelize.CoordinatesToCellName(i+1, 1)
		if err != nil {
			return err
		}
		if err := f.SetCellValue(sheetName, cell, col.Header); err != nil {
			return err
		}
		if err := f.SetCellStyle(sheetName, cell, cell, headerStyle); err != nil {
			return err
		}
		if col.Width > 0 {
			colName, _ := excelize.ColumnNumberToName(i + 1)
			_ = f.SetColWidth(sheetName, colName, colName, col.Width)
		}
	}

	// Cache per-column data style (only create when a Format is set)
	formatStyles := make(map[string]int, len(cols))
	for _, col := range cols {
		if col.Format == "" {
			continue
		}
		if _, ok := formatStyles[col.Format]; ok {
			continue
		}
		customFmt := col.Format
		sid, err := f.NewStyle(&excelize.Style{CustomNumFmt: &customFmt})
		if err != nil {
			return fmt.Errorf("create number format %q: %w", col.Format, err)
		}
		formatStyles[col.Format] = sid
	}

	// Write data rows
	for rowIdx, row := range rows {
		excelRow := rowIdx + 2 // +1 for 1-based, +1 to skip header
		for colIdx, col := range cols {
			cell, err := excelize.CoordinatesToCellName(colIdx+1, excelRow)
			if err != nil {
				return err
			}
			val, ok := row[col.Key]
			if !ok || val == nil {
				continue
			}

			// Convert time.Time values to Excel-native so number-formats render correctly
			switch v := val.(type) {
			case time.Time:
				if err := f.SetCellValue(sheetName, cell, v); err != nil {
					return err
				}
			case *time.Time:
				if v != nil {
					if err := f.SetCellValue(sheetName, cell, *v); err != nil {
						return err
					}
				}
			default:
				if err := f.SetCellValue(sheetName, cell, val); err != nil {
					return err
				}
			}

			if sid, ok := formatStyles[col.Format]; ok && col.Format != "" {
				if err := f.SetCellStyle(sheetName, cell, cell, sid); err != nil {
					return err
				}
			}
		}
	}

	// Freeze the header row for usability on large exports
	if err := f.SetPanes(sheetName, &excelize.Panes{
		Freeze:      true,
		YSplit:      1,
		TopLeftCell: "A2",
		ActivePane:  "bottomLeft",
	}); err != nil {
		return fmt.Errorf("freeze header: %w", err)
	}

	f.SetActiveSheet(0)
	if _, err := f.WriteTo(w); err != nil {
		return fmt.Errorf("write xlsx: %w", err)
	}
	return nil
}

// WriteFiber writes an xlsx response with the correct headers for a browser
// download. filename should NOT include the .xlsx suffix — it is added.
func WriteFiber(c *fiber.Ctx, filename, sheetName string, cols []Column, rows []map[string]interface{}) error {
	var buf bytes.Buffer
	if err := WriteTo(&buf, sheetName, cols, rows); err != nil {
		return err
	}
	c.Set(fiber.HeaderContentType, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
	c.Set(fiber.HeaderContentDisposition, fmt.Sprintf(`attachment; filename="%s.xlsx"`, filename))
	return c.SendStream(&buf, buf.Len())
}
