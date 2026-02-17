package handler

import (
	"hris-backend/internal/dto"
	"hris-backend/internal/service"
	"hris-backend/pkg/response"

	"github.com/gofiber/fiber/v2"
)

type EmployeeHandler struct {
	empService service.EmployeeService
}

func NewEmployeeHandler(empService service.EmployeeService) *EmployeeHandler {
	return &EmployeeHandler{empService: empService}
}

// GetAll godoc
// @Summary Get all employees
// @Description Retrieve all employees, optionally filtered by company
// @Tags Employees
// @Security Bearer
// @Produce json
// @Param company_id query string false "Filter by company ID"
// @Success 200 {object} response.Response{data=[]dto.EmployeeResponse} "Employees retrieved"
// @Failure 500 {object} response.Response "Failed to fetch employees"
// @Router /employees [get]
func (h *EmployeeHandler) GetAll(c *fiber.Ctx) error {
	companyID := c.Query("company_id")
	if companyID != "" {
		employees, err := h.empService.GetByCompanyID(companyID)
		if err != nil {
			return response.Error(c, fiber.StatusInternalServerError, "Failed to fetch employees")
		}
		return response.Success(c, fiber.StatusOK, "Employees retrieved", employees)
	}

	employees, err := h.empService.GetAll()
	if err != nil {
		return response.Error(c, fiber.StatusInternalServerError, "Failed to fetch employees")
	}
	return response.Success(c, fiber.StatusOK, "Employees retrieved", employees)
}

// GetByID godoc
// @Summary Get employee by ID
// @Description Retrieve an employee by their ID
// @Tags Employees
// @Security Bearer
// @Produce json
// @Param id path string true "Employee ID"
// @Success 200 {object} response.Response{data=dto.EmployeeResponse} "Employee retrieved"
// @Failure 404 {object} response.Response "Employee not found"
// @Router /employees/{id} [get]
func (h *EmployeeHandler) GetByID(c *fiber.Ctx) error {
	id := c.Params("id")
	emp, err := h.empService.GetByID(id)
	if err != nil {
		return response.Error(c, fiber.StatusNotFound, err.Error())
	}
	return response.Success(c, fiber.StatusOK, "Employee retrieved", emp)
}

// GetMe godoc
// @Summary Get my employee profile
// @Description Retrieve the employee profile of the currently authenticated user
// @Tags Employees
// @Security Bearer
// @Produce json
// @Success 200 {object} response.Response{data=dto.EmployeeResponse} "Employee retrieved"
// @Failure 404 {object} response.Response "Employee profile not found"
// @Router /employees/me [get]
func (h *EmployeeHandler) GetMe(c *fiber.Ctx) error {
	userID := c.Locals("userID").(string)
	emp, err := h.empService.GetByUserID(userID)
	if err != nil {
		return response.Error(c, fiber.StatusNotFound, err.Error())
	}
	return response.Success(c, fiber.StatusOK, "Employee retrieved", emp)
}

// Create godoc
// @Summary Create an employee
// @Description Create a new employee record linked to a user account
// @Tags Employees
// @Security Bearer
// @Accept json
// @Produce json
// @Param request body dto.CreateEmployeeRequest true "Employee data"
// @Success 201 {object} response.Response{data=dto.EmployeeResponse} "Employee created"
// @Failure 400 {object} response.Response "Invalid request"
// @Router /employees [post]
func (h *EmployeeHandler) Create(c *fiber.Ctx) error {
	var req dto.CreateEmployeeRequest
	if err := c.BodyParser(&req); err != nil {
		return response.Error(c, fiber.StatusBadRequest, "Invalid request body")
	}

	if req.UserID == "" || req.CompanyID == "" || req.DepartmentID == "" || req.PositionID == "" || req.ShiftID == "" {
		return response.Error(c, fiber.StatusBadRequest, "User ID, company ID, department ID, position ID, and shift ID are required")
	}

	if req.EmployeeNumber == "" {
		return response.Error(c, fiber.StatusBadRequest, "Employee number is required")
	}

	if req.JoinDate == "" {
		return response.Error(c, fiber.StatusBadRequest, "Join date is required")
	}

	if req.EmployeeStatus != "" && req.EmployeeStatus != "tetap" && req.EmployeeStatus != "kontrak" && req.EmployeeStatus != "probation" {
		return response.Error(c, fiber.StatusBadRequest, "Invalid employee status. Must be tetap, kontrak, or probation")
	}

	emp, err := h.empService.Create(req)
	if err != nil {
		return response.Error(c, fiber.StatusBadRequest, err.Error())
	}
	return response.Success(c, fiber.StatusCreated, "Employee created", emp)
}

// Update godoc
// @Summary Update an employee
// @Description Update an existing employee record by ID
// @Tags Employees
// @Security Bearer
// @Accept json
// @Produce json
// @Param id path string true "Employee ID"
// @Param request body dto.UpdateEmployeeRequest true "Employee data"
// @Success 200 {object} response.Response{data=dto.EmployeeResponse} "Employee updated"
// @Failure 400 {object} response.Response "Invalid request"
// @Router /employees/{id} [put]
func (h *EmployeeHandler) Update(c *fiber.Ctx) error {
	id := c.Params("id")

	var req dto.UpdateEmployeeRequest
	if err := c.BodyParser(&req); err != nil {
		return response.Error(c, fiber.StatusBadRequest, "Invalid request body")
	}

	if req.EmployeeStatus != "" && req.EmployeeStatus != "tetap" && req.EmployeeStatus != "kontrak" && req.EmployeeStatus != "probation" {
		return response.Error(c, fiber.StatusBadRequest, "Invalid employee status. Must be tetap, kontrak, or probation")
	}

	emp, err := h.empService.Update(id, req)
	if err != nil {
		return response.Error(c, fiber.StatusBadRequest, err.Error())
	}
	return response.Success(c, fiber.StatusOK, "Employee updated", emp)
}

// Delete godoc
// @Summary Delete an employee
// @Description Delete an employee record by ID
// @Tags Employees
// @Security Bearer
// @Produce json
// @Param id path string true "Employee ID"
// @Success 200 {object} response.Response "Employee deleted"
// @Failure 400 {object} response.Response "Failed to delete"
// @Router /employees/{id} [delete]
func (h *EmployeeHandler) Delete(c *fiber.Ctx) error {
	id := c.Params("id")

	if err := h.empService.Delete(id); err != nil {
		return response.Error(c, fiber.StatusBadRequest, err.Error())
	}
	return response.Success(c, fiber.StatusOK, "Employee deleted", nil)
}
