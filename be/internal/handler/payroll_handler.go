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
	empService     service.EmployeeService
}

func NewPayrollHandler(payrollService service.PayrollService, empService service.EmployeeService) *PayrollHandler {
	return &PayrollHandler{payrollService: payrollService, empService: empService}
}

// GetAll godoc
// @Summary Get all payrolls
// @Description Retrieve all payroll records, optionally filtered by employee, month, and year
// @Tags Payrolls
// @Security Bearer
// @Produce json
// @Param employee_id query string false "Filter by employee ID"
// @Param month query int false "Filter by month (1-12)"
// @Param year query int false "Filter by year"
// @Success 200 {object} response.Response{data=[]dto.PayrollResponse} "Payrolls retrieved"
// @Failure 400 {object} response.Response "Invalid month or year format"
// @Failure 500 {object} response.Response "Failed to fetch payrolls"
// @Router /payrolls [get]
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

// GetMyPayslips godoc
// @Summary Get my payslips
// @Description Retrieve paid payroll records for the authenticated user
// @Tags Payrolls
// @Security Bearer
// @Produce json
// @Success 200 {object} response.Response{data=[]dto.PayrollResponse} "Payslips retrieved"
// @Failure 404 {object} response.Response "Employee profile not found"
// @Failure 500 {object} response.Response "Failed to fetch payslips"
// @Router /payrolls/me [get]
func (h *PayrollHandler) GetMyPayslips(c *fiber.Ctx) error {
	userID := c.Locals("userID").(string)
	emp, err := h.empService.GetByUserID(userID)
	if err != nil {
		return response.Error(c, fiber.StatusNotFound, "Employee profile not found")
	}
	payslips, err := h.payrollService.GetPaidByEmployeeID(emp.ID)
	if err != nil {
		return response.Error(c, fiber.StatusInternalServerError, "Failed to fetch payslips")
	}
	return response.Success(c, fiber.StatusOK, "Payslips retrieved", payslips)
}

// GetByID godoc
// @Summary Get payroll by ID
// @Description Retrieve a payroll record by its ID
// @Tags Payrolls
// @Security Bearer
// @Produce json
// @Param id path string true "Payroll ID"
// @Success 200 {object} response.Response{data=dto.PayrollResponse} "Payroll retrieved"
// @Failure 404 {object} response.Response "Payroll not found"
// @Router /payrolls/{id} [get]
func (h *PayrollHandler) GetByID(c *fiber.Ctx) error {
	id := c.Params("id")
	payroll, err := h.payrollService.GetByID(id)
	if err != nil {
		return response.Error(c, fiber.StatusNotFound, err.Error())
	}
	return response.Success(c, fiber.StatusOK, "Payroll retrieved", payroll)
}

// Generate godoc
// @Summary Generate payroll
// @Description Generate a payroll record for an employee for a specific month and year
// @Tags Payrolls
// @Security Bearer
// @Accept json
// @Produce json
// @Param request body dto.GeneratePayrollRequest true "Payroll generation data"
// @Success 201 {object} response.Response{data=dto.PayrollResponse} "Payroll generated"
// @Failure 400 {object} response.Response "Invalid request"
// @Router /payrolls/generate [post]
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

// Update godoc
// @Summary Update a payroll
// @Description Update an existing payroll record by ID
// @Tags Payrolls
// @Security Bearer
// @Accept json
// @Produce json
// @Param id path string true "Payroll ID"
// @Param request body dto.UpdatePayrollRequest true "Payroll data"
// @Success 200 {object} response.Response{data=dto.PayrollResponse} "Payroll updated"
// @Failure 400 {object} response.Response "Invalid request"
// @Router /payrolls/{id} [put]
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

// UpdateStatus godoc
// @Summary Update payroll status
// @Description Update the status of a payroll record (draft, processed, paid)
// @Tags Payrolls
// @Security Bearer
// @Accept json
// @Produce json
// @Param id path string true "Payroll ID"
// @Param request body dto.PayrollStatusRequest true "Status data"
// @Success 200 {object} response.Response{data=dto.PayrollResponse} "Payroll status updated"
// @Failure 400 {object} response.Response "Invalid request or status"
// @Router /payrolls/{id}/status [put]
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

// Delete godoc
// @Summary Delete a payroll
// @Description Delete a payroll record by ID
// @Tags Payrolls
// @Security Bearer
// @Produce json
// @Param id path string true "Payroll ID"
// @Success 200 {object} response.Response "Payroll deleted"
// @Failure 400 {object} response.Response "Failed to delete"
// @Router /payrolls/{id} [delete]
func (h *PayrollHandler) Delete(c *fiber.Ctx) error {
	id := c.Params("id")

	if err := h.payrollService.Delete(id); err != nil {
		return response.Error(c, fiber.StatusBadRequest, err.Error())
	}
	return response.Success(c, fiber.StatusOK, "Payroll deleted", nil)
}
