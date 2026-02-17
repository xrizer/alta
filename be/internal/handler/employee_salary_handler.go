package handler

import (
	"hris-backend/internal/dto"
	"hris-backend/internal/service"
	"hris-backend/pkg/response"

	"github.com/gofiber/fiber/v2"
)

type EmployeeSalaryHandler struct {
	salaryService service.EmployeeSalaryService
}

func NewEmployeeSalaryHandler(salaryService service.EmployeeSalaryService) *EmployeeSalaryHandler {
	return &EmployeeSalaryHandler{salaryService: salaryService}
}

// GetAll godoc
// @Summary Get all employee salaries
// @Description Retrieve all employee salary records, optionally filtered by employee
// @Tags Employee Salaries
// @Security Bearer
// @Produce json
// @Param employee_id query string false "Filter by employee ID"
// @Success 200 {object} response.Response{data=[]dto.EmployeeSalaryResponse} "Employee salaries retrieved"
// @Failure 500 {object} response.Response "Failed to fetch employee salaries"
// @Router /employee-salaries [get]
func (h *EmployeeSalaryHandler) GetAll(c *fiber.Ctx) error {
	employeeID := c.Query("employee_id")
	if employeeID != "" {
		salaries, err := h.salaryService.GetByEmployeeID(employeeID)
		if err != nil {
			return response.Error(c, fiber.StatusInternalServerError, "Failed to fetch employee salaries")
		}
		return response.Success(c, fiber.StatusOK, "Employee salaries retrieved", salaries)
	}

	salaries, err := h.salaryService.GetAll()
	if err != nil {
		return response.Error(c, fiber.StatusInternalServerError, "Failed to fetch employee salaries")
	}
	return response.Success(c, fiber.StatusOK, "Employee salaries retrieved", salaries)
}

// GetByID godoc
// @Summary Get employee salary by ID
// @Description Retrieve an employee salary record by its ID
// @Tags Employee Salaries
// @Security Bearer
// @Produce json
// @Param id path string true "Salary ID"
// @Success 200 {object} response.Response{data=dto.EmployeeSalaryResponse} "Employee salary retrieved"
// @Failure 404 {object} response.Response "Employee salary not found"
// @Router /employee-salaries/{id} [get]
func (h *EmployeeSalaryHandler) GetByID(c *fiber.Ctx) error {
	id := c.Params("id")
	salary, err := h.salaryService.GetByID(id)
	if err != nil {
		return response.Error(c, fiber.StatusNotFound, err.Error())
	}
	return response.Success(c, fiber.StatusOK, "Employee salary retrieved", salary)
}

// GetLatest godoc
// @Summary Get latest salary for an employee
// @Description Retrieve the most recent salary record for a specific employee
// @Tags Employee Salaries
// @Security Bearer
// @Produce json
// @Param employeeId path string true "Employee ID"
// @Success 200 {object} response.Response{data=dto.EmployeeSalaryResponse} "Latest employee salary retrieved"
// @Failure 404 {object} response.Response "Employee salary not found"
// @Router /employee-salaries/employee/{employeeId}/latest [get]
func (h *EmployeeSalaryHandler) GetLatest(c *fiber.Ctx) error {
	employeeID := c.Params("employeeId")
	salary, err := h.salaryService.GetLatestByEmployeeID(employeeID)
	if err != nil {
		return response.Error(c, fiber.StatusNotFound, err.Error())
	}
	return response.Success(c, fiber.StatusOK, "Latest employee salary retrieved", salary)
}

// Create godoc
// @Summary Create an employee salary
// @Description Create a new salary record for an employee
// @Tags Employee Salaries
// @Security Bearer
// @Accept json
// @Produce json
// @Param request body dto.CreateEmployeeSalaryRequest true "Salary data"
// @Success 201 {object} response.Response{data=dto.EmployeeSalaryResponse} "Employee salary created"
// @Failure 400 {object} response.Response "Invalid request"
// @Router /employee-salaries [post]
func (h *EmployeeSalaryHandler) Create(c *fiber.Ctx) error {
	var req dto.CreateEmployeeSalaryRequest
	if err := c.BodyParser(&req); err != nil {
		return response.Error(c, fiber.StatusBadRequest, "Invalid request body")
	}

	if req.EmployeeID == "" {
		return response.Error(c, fiber.StatusBadRequest, "Employee ID is required")
	}

	if req.BasicSalary <= 0 {
		return response.Error(c, fiber.StatusBadRequest, "Basic salary must be greater than 0")
	}

	if req.EffectiveDate == "" {
		return response.Error(c, fiber.StatusBadRequest, "Effective date is required")
	}

	salary, err := h.salaryService.Create(req)
	if err != nil {
		return response.Error(c, fiber.StatusBadRequest, err.Error())
	}
	return response.Success(c, fiber.StatusCreated, "Employee salary created", salary)
}

// Update godoc
// @Summary Update an employee salary
// @Description Update an existing salary record by ID
// @Tags Employee Salaries
// @Security Bearer
// @Accept json
// @Produce json
// @Param id path string true "Salary ID"
// @Param request body dto.UpdateEmployeeSalaryRequest true "Salary data"
// @Success 200 {object} response.Response{data=dto.EmployeeSalaryResponse} "Employee salary updated"
// @Failure 400 {object} response.Response "Invalid request"
// @Router /employee-salaries/{id} [put]
func (h *EmployeeSalaryHandler) Update(c *fiber.Ctx) error {
	id := c.Params("id")

	var req dto.UpdateEmployeeSalaryRequest
	if err := c.BodyParser(&req); err != nil {
		return response.Error(c, fiber.StatusBadRequest, "Invalid request body")
	}

	if req.BasicSalary != nil && *req.BasicSalary <= 0 {
		return response.Error(c, fiber.StatusBadRequest, "Basic salary must be greater than 0")
	}

	salary, err := h.salaryService.Update(id, req)
	if err != nil {
		return response.Error(c, fiber.StatusBadRequest, err.Error())
	}
	return response.Success(c, fiber.StatusOK, "Employee salary updated", salary)
}

// Delete godoc
// @Summary Delete an employee salary
// @Description Delete an employee salary record by ID
// @Tags Employee Salaries
// @Security Bearer
// @Produce json
// @Param id path string true "Salary ID"
// @Success 200 {object} response.Response "Employee salary deleted"
// @Failure 400 {object} response.Response "Failed to delete"
// @Router /employee-salaries/{id} [delete]
func (h *EmployeeSalaryHandler) Delete(c *fiber.Ctx) error {
	id := c.Params("id")

	if err := h.salaryService.Delete(id); err != nil {
		return response.Error(c, fiber.StatusBadRequest, err.Error())
	}
	return response.Success(c, fiber.StatusOK, "Employee salary deleted", nil)
}
