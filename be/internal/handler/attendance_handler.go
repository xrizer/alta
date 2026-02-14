package handler

import (
	"fmt"
	"strconv"
	"strings"
	"time"

	"hris-backend/internal/dto"
	"hris-backend/internal/model"
	"hris-backend/internal/service"
	"hris-backend/pkg/response"

	"github.com/gofiber/fiber/v2"
	"github.com/xuri/excelize/v2"
)

type AttendanceHandler struct {
	attService service.AttendanceService
	empService service.EmployeeService
}

func NewAttendanceHandler(attService service.AttendanceService, empService service.EmployeeService) *AttendanceHandler {
	return &AttendanceHandler{attService: attService, empService: empService}
}

func (h *AttendanceHandler) GetAll(c *fiber.Ctx) error {
	employeeID := c.Query("employee_id")
	monthStr := c.Query("month")
	yearStr := c.Query("year")

	// Parse month/year if provided
	var month, year int
	var hasMonth, hasYear bool
	if monthStr != "" {
		m, err := strconv.Atoi(monthStr)
		if err != nil {
			return response.Error(c, fiber.StatusBadRequest, "Invalid month format")
		}
		month = m
		hasMonth = true
	}
	if yearStr != "" {
		y, err := strconv.Atoi(yearStr)
		if err != nil {
			return response.Error(c, fiber.StatusBadRequest, "Invalid year format")
		}
		year = y
		hasYear = true
	}

	// Filter by employee + month/year
	if employeeID != "" && hasMonth && hasYear {
		attendances, err := h.attService.GetByEmployeeIDAndMonth(employeeID, month, year)
		if err != nil {
			return response.Error(c, fiber.StatusInternalServerError, "Failed to fetch attendances")
		}
		return response.Success(c, fiber.StatusOK, "Attendances retrieved", attendances)
	}

	// Filter by employee only
	if employeeID != "" {
		attendances, err := h.attService.GetByEmployeeID(employeeID)
		if err != nil {
			return response.Error(c, fiber.StatusInternalServerError, "Failed to fetch attendances")
		}
		return response.Success(c, fiber.StatusOK, "Attendances retrieved", attendances)
	}

	// Filter by month/year only (admin view)
	if hasMonth && hasYear {
		attendances, err := h.attService.GetByMonth(month, year)
		if err != nil {
			return response.Error(c, fiber.StatusInternalServerError, "Failed to fetch attendances")
		}
		return response.Success(c, fiber.StatusOK, "Attendances retrieved", attendances)
	}

	// No filters — return all
	attendances, err := h.attService.GetAll()
	if err != nil {
		return response.Error(c, fiber.StatusInternalServerError, "Failed to fetch attendances")
	}
	return response.Success(c, fiber.StatusOK, "Attendances retrieved", attendances)
}

func (h *AttendanceHandler) GetByID(c *fiber.Ctx) error {
	id := c.Params("id")
	att, err := h.attService.GetByID(id)
	if err != nil {
		return response.Error(c, fiber.StatusNotFound, err.Error())
	}
	return response.Success(c, fiber.StatusOK, "Attendance retrieved", att)
}

func (h *AttendanceHandler) ClockIn(c *fiber.Ctx) error {
	var req dto.ClockInRequest
	if err := c.BodyParser(&req); err != nil {
		return response.Error(c, fiber.StatusBadRequest, "Invalid request body")
	}

	if req.EmployeeID == "" {
		return response.Error(c, fiber.StatusBadRequest, "Employee ID is required")
	}

	att, err := h.attService.ClockIn(req)
	if err != nil {
		return response.Error(c, fiber.StatusBadRequest, err.Error())
	}
	return response.Success(c, fiber.StatusCreated, "Clock in successful", att)
}

func (h *AttendanceHandler) ClockOut(c *fiber.Ctx) error {
	id := c.Params("id")

	var req dto.ClockOutRequest
	if err := c.BodyParser(&req); err != nil {
		return response.Error(c, fiber.StatusBadRequest, "Invalid request body")
	}

	att, err := h.attService.ClockOut(id, req)
	if err != nil {
		return response.Error(c, fiber.StatusBadRequest, err.Error())
	}
	return response.Success(c, fiber.StatusOK, "Clock out successful", att)
}

func (h *AttendanceHandler) Create(c *fiber.Ctx) error {
	var req dto.CreateAttendanceRequest
	if err := c.BodyParser(&req); err != nil {
		return response.Error(c, fiber.StatusBadRequest, "Invalid request body")
	}

	if req.EmployeeID == "" || req.Date == "" || req.Status == "" {
		return response.Error(c, fiber.StatusBadRequest, "Employee ID, date, and status are required")
	}

	att, err := h.attService.Create(req)
	if err != nil {
		return response.Error(c, fiber.StatusBadRequest, err.Error())
	}
	return response.Success(c, fiber.StatusCreated, "Attendance created", att)
}

func (h *AttendanceHandler) Update(c *fiber.Ctx) error {
	id := c.Params("id")

	var req dto.UpdateAttendanceRequest
	if err := c.BodyParser(&req); err != nil {
		return response.Error(c, fiber.StatusBadRequest, "Invalid request body")
	}

	att, err := h.attService.Update(id, req)
	if err != nil {
		return response.Error(c, fiber.StatusBadRequest, err.Error())
	}
	return response.Success(c, fiber.StatusOK, "Attendance updated", att)
}

func (h *AttendanceHandler) Delete(c *fiber.Ctx) error {
	id := c.Params("id")

	if err := h.attService.Delete(id); err != nil {
		return response.Error(c, fiber.StatusBadRequest, err.Error())
	}
	return response.Success(c, fiber.StatusOK, "Attendance deleted", nil)
}

func (h *AttendanceHandler) Import(c *fiber.Ctx) error {
	file, err := c.FormFile("file")
	if err != nil {
		return response.Error(c, fiber.StatusBadRequest, "File is required")
	}

	// Validate file extension
	if !strings.HasSuffix(strings.ToLower(file.Filename), ".xlsx") {
		return response.Error(c, fiber.StatusBadRequest, "Only .xlsx files are supported")
	}

	src, err := file.Open()
	if err != nil {
		return response.Error(c, fiber.StatusInternalServerError, "Failed to open file")
	}
	defer src.Close()

	f, err := excelize.OpenReader(src)
	if err != nil {
		return response.Error(c, fiber.StatusBadRequest, "Failed to parse XLSX file")
	}
	defer f.Close()

	sheetName := f.GetSheetName(0)
	rows, err := f.GetRows(sheetName)
	if err != nil {
		return response.Error(c, fiber.StatusBadRequest, "Failed to read sheet")
	}

	if len(rows) < 2 {
		return response.Error(c, fiber.StatusBadRequest, "File must have a header row and at least one data row")
	}

	// Parse header to find column indices
	header := rows[0]
	colMap := make(map[string]int)
	for i, h := range header {
		colMap[strings.ToLower(strings.TrimSpace(h))] = i
	}

	requiredCols := []string{"employee_number", "date", "status"}
	for _, col := range requiredCols {
		if _, ok := colMap[col]; !ok {
			return response.Error(c, fiber.StatusBadRequest, fmt.Sprintf("Missing required column: %s", col))
		}
	}

	// Build employee cache by employee_number
	allEmployees, err := h.empService.GetAll()
	if err != nil {
		return response.Error(c, fiber.StatusInternalServerError, "Failed to fetch employees")
	}
	empByNumber := make(map[string]dto.EmployeeResponse)
	for _, emp := range allEmployees {
		empByNumber[emp.EmployeeNumber] = emp
	}

	var imported int
	var errors []string

	for i, row := range rows[1:] {
		rowNum := i + 2

		getCol := func(name string) string {
			idx, ok := colMap[name]
			if !ok || idx >= len(row) {
				return ""
			}
			return strings.TrimSpace(row[idx])
		}

		empNumber := getCol("employee_number")
		dateStr := getCol("date")
		statusStr := getCol("status")

		if empNumber == "" || dateStr == "" || statusStr == "" {
			errors = append(errors, fmt.Sprintf("Row %d: missing required fields", rowNum))
			continue
		}

		emp, ok := empByNumber[empNumber]
		if !ok {
			errors = append(errors, fmt.Sprintf("Row %d: employee %s not found", rowNum, empNumber))
			continue
		}

		// Validate status
		validStatuses := map[string]model.AttendanceStatus{
			"hadir":     model.AttendanceHadir,
			"alpha":     model.AttendanceAlpha,
			"terlambat": model.AttendanceTerlambat,
			"izin":      model.AttendanceIzin,
			"sakit":     model.AttendanceSakit,
			"cuti":      model.AttendanceCuti,
		}
		status, ok := validStatuses[strings.ToLower(statusStr)]
		if !ok {
			errors = append(errors, fmt.Sprintf("Row %d: invalid status '%s'", rowNum, statusStr))
			continue
		}

		// Parse date
		var parsedDate time.Time
		for _, layout := range []string{"2006-01-02", "02/01/2006", "01/02/2006", "2006/01/02"} {
			parsedDate, err = time.Parse(layout, dateStr)
			if err == nil {
				break
			}
		}
		if parsedDate.IsZero() {
			errors = append(errors, fmt.Sprintf("Row %d: invalid date format '%s'", rowNum, dateStr))
			continue
		}

		req := dto.CreateAttendanceRequest{
			EmployeeID: emp.ID,
			ShiftID:    emp.ShiftID,
			Date:       parsedDate.Format("2006-01-02"),
			Status:     status,
		}

		// Optional fields
		if clockIn := getCol("clock_in"); clockIn != "" {
			ci, err := parseClockTime(clockIn, parsedDate)
			if err != nil {
				errors = append(errors, fmt.Sprintf("Row %d: invalid clock_in '%s'", rowNum, clockIn))
				continue
			}
			req.ClockIn = ci.Format("2006-01-02T15:04:05Z")
		}
		if clockOut := getCol("clock_out"); clockOut != "" {
			co, err := parseClockTime(clockOut, parsedDate)
			if err != nil {
				errors = append(errors, fmt.Sprintf("Row %d: invalid clock_out '%s'", rowNum, clockOut))
				continue
			}
			req.ClockOut = co.Format("2006-01-02T15:04:05Z")
		}
		if overtimeStr := getCol("overtime_hours"); overtimeStr != "" {
			ot, err := strconv.ParseFloat(overtimeStr, 64)
			if err == nil {
				req.OvertimeHours = ot
			}
		}
		if notes := getCol("notes"); notes != "" {
			req.Notes = notes
		}

		_, err := h.attService.Create(req)
		if err != nil {
			errors = append(errors, fmt.Sprintf("Row %d: %s", rowNum, err.Error()))
			continue
		}
		imported++
	}

	result := fiber.Map{
		"imported": imported,
		"total":    len(rows) - 1,
		"errors":   errors,
	}

	if imported == 0 && len(errors) > 0 {
		return response.Error(c, fiber.StatusBadRequest, fmt.Sprintf("Import failed: %d errors", len(errors)))
	}

	return response.Success(c, fiber.StatusOK, fmt.Sprintf("Imported %d of %d records", imported, len(rows)-1), result)
}

func parseClockTime(timeStr string, date time.Time) (time.Time, error) {
	// Try HH:MM format
	t, err := time.Parse("15:04", timeStr)
	if err == nil {
		return time.Date(date.Year(), date.Month(), date.Day(), t.Hour(), t.Minute(), 0, 0, time.UTC), nil
	}
	// Try HH.MM format
	t, err = time.Parse("15.04", timeStr)
	if err == nil {
		return time.Date(date.Year(), date.Month(), date.Day(), t.Hour(), t.Minute(), 0, 0, time.UTC), nil
	}
	// Try full ISO
	t, err = time.Parse("2006-01-02T15:04:05Z", timeStr)
	if err == nil {
		return t, nil
	}
	return time.Time{}, fmt.Errorf("unrecognized time format")
}
