package handler

import (
	"strconv"

	"hris-backend/internal/dto"
	"hris-backend/internal/service"
	"hris-backend/pkg/response"

	"github.com/gofiber/fiber/v2"
)

type PayrollHandler struct {
	payrollService service.PayrollService
}

func NewPayrollHandler(payrollService service.PayrollService) *PayrollHandler {
	return &PayrollHandler{payrollService: payrollService}
}

func (h *PayrollHandler) GetAll(c *fiber.Ctx) error {
	employeeID := c.Query("employee_id")
	monthStr := c.Query("month")
	yearStr := c.Query("year")

	if monthStr != "" && yearStr != "" {
		month, err := strconv.Atoi(monthStr)
		if err != nil {
			return response.Error(c, fiber.StatusBadRequest, "Invalid month format")
		}
		year, err := strconv.Atoi(yearStr)
		if err != nil {
			return response.Error(c, fiber.StatusBadRequest, "Invalid year format")
		}
		payrolls, err := h.payrollService.GetByPeriod(month, year)
		if err != nil {
			return response.Error(c, fiber.StatusInternalServerError, "Failed to fetch payrolls")
		}
		return response.Success(c, fiber.StatusOK, "Payrolls retrieved", payrolls)
	}

	if employeeID != "" {
		payrolls, err := h.payrollService.GetByEmployeeID(employeeID)
		if err != nil {
			return response.Error(c, fiber.StatusInternalServerError, "Failed to fetch payrolls")
		}
		return response.Success(c, fiber.StatusOK, "Payrolls retrieved", payrolls)
	}

	payrolls, err := h.payrollService.GetAll()
	if err != nil {
		return response.Error(c, fiber.StatusInternalServerError, "Failed to fetch payrolls")
	}
	return response.Success(c, fiber.StatusOK, "Payrolls retrieved", payrolls)
}

func (h *PayrollHandler) GetByID(c *fiber.Ctx) error {
	id := c.Params("id")
	payroll, err := h.payrollService.GetByID(id)
	if err != nil {
		return response.Error(c, fiber.StatusNotFound, err.Error())
	}
	return response.Success(c, fiber.StatusOK, "Payroll retrieved", payroll)
}

func (h *PayrollHandler) Generate(c *fiber.Ctx) error {
	var req dto.GeneratePayrollRequest
	if err := c.BodyParser(&req); err != nil {
		return response.Error(c, fiber.StatusBadRequest, "Invalid request body")
	}

	if req.EmployeeID == "" {
		return response.Error(c, fiber.StatusBadRequest, "Employee ID is required")
	}

	if req.Month < 1 || req.Month > 12 {
		return response.Error(c, fiber.StatusBadRequest, "Month must be between 1 and 12")
	}

	if req.Year < 2000 {
		return response.Error(c, fiber.StatusBadRequest, "Invalid year")
	}

	payroll, err := h.payrollService.Generate(req)
	if err != nil {
		return response.Error(c, fiber.StatusBadRequest, err.Error())
	}
	return response.Success(c, fiber.StatusCreated, "Payroll generated", payroll)
}

func (h *PayrollHandler) Update(c *fiber.Ctx) error {
	id := c.Params("id")

	var req dto.UpdatePayrollRequest
	if err := c.BodyParser(&req); err != nil {
		return response.Error(c, fiber.StatusBadRequest, "Invalid request body")
	}

	payroll, err := h.payrollService.Update(id, req)
	if err != nil {
		return response.Error(c, fiber.StatusBadRequest, err.Error())
	}
	return response.Success(c, fiber.StatusOK, "Payroll updated", payroll)
}

func (h *PayrollHandler) UpdateStatus(c *fiber.Ctx) error {
	id := c.Params("id")

	var req dto.PayrollStatusRequest
	if err := c.BodyParser(&req); err != nil {
		return response.Error(c, fiber.StatusBadRequest, "Invalid request body")
	}

	if req.Status == "" {
		return response.Error(c, fiber.StatusBadRequest, "Status is required")
	}

	if req.Status != "draft" && req.Status != "processed" && req.Status != "paid" {
		return response.Error(c, fiber.StatusBadRequest, "Invalid status. Must be draft, processed, or paid")
	}

	payroll, err := h.payrollService.UpdateStatus(id, req)
	if err != nil {
		return response.Error(c, fiber.StatusBadRequest, err.Error())
	}
	return response.Success(c, fiber.StatusOK, "Payroll status updated", payroll)
}

func (h *PayrollHandler) Delete(c *fiber.Ctx) error {
	id := c.Params("id")

	if err := h.payrollService.Delete(id); err != nil {
		return response.Error(c, fiber.StatusBadRequest, err.Error())
	}
	return response.Success(c, fiber.StatusOK, "Payroll deleted", nil)
}
