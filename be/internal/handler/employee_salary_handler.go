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

func (h *EmployeeSalaryHandler) GetByID(c *fiber.Ctx) error {
	id := c.Params("id")
	salary, err := h.salaryService.GetByID(id)
	if err != nil {
		return response.Error(c, fiber.StatusNotFound, err.Error())
	}
	return response.Success(c, fiber.StatusOK, "Employee salary retrieved", salary)
}

func (h *EmployeeSalaryHandler) GetLatest(c *fiber.Ctx) error {
	employeeID := c.Params("employeeId")
	salary, err := h.salaryService.GetLatestByEmployeeID(employeeID)
	if err != nil {
		return response.Error(c, fiber.StatusNotFound, err.Error())
	}
	return response.Success(c, fiber.StatusOK, "Latest employee salary retrieved", salary)
}

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

func (h *EmployeeSalaryHandler) Delete(c *fiber.Ctx) error {
	id := c.Params("id")

	if err := h.salaryService.Delete(id); err != nil {
		return response.Error(c, fiber.StatusBadRequest, err.Error())
	}
	return response.Success(c, fiber.StatusOK, "Employee salary deleted", nil)
}
