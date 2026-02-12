package handler

import (
	"strconv"

	"hris-backend/internal/dto"
	"hris-backend/internal/service"
	"hris-backend/pkg/response"

	"github.com/gofiber/fiber/v2"
)

type AttendanceHandler struct {
	attService service.AttendanceService
}

func NewAttendanceHandler(attService service.AttendanceService) *AttendanceHandler {
	return &AttendanceHandler{attService: attService}
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
