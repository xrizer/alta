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

func (h *EmployeeHandler) GetByID(c *fiber.Ctx) error {
	id := c.Params("id")
	emp, err := h.empService.GetByID(id)
	if err != nil {
		return response.Error(c, fiber.StatusNotFound, err.Error())
	}
	return response.Success(c, fiber.StatusOK, "Employee retrieved", emp)
}

func (h *EmployeeHandler) GetMe(c *fiber.Ctx) error {
	userID := c.Locals("userID").(string)
	emp, err := h.empService.GetByUserID(userID)
	if err != nil {
		return response.Error(c, fiber.StatusNotFound, err.Error())
	}
	return response.Success(c, fiber.StatusOK, "Employee retrieved", emp)
}

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

func (h *EmployeeHandler) Delete(c *fiber.Ctx) error {
	id := c.Params("id")

	if err := h.empService.Delete(id); err != nil {
		return response.Error(c, fiber.StatusBadRequest, err.Error())
	}
	return response.Success(c, fiber.StatusOK, "Employee deleted", nil)
}
