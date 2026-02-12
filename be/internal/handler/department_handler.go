package handler

import (
	"hris-backend/internal/dto"
	"hris-backend/internal/service"
	"hris-backend/pkg/response"

	"github.com/gofiber/fiber/v2"
)

type DepartmentHandler struct {
	deptService service.DepartmentService
}

func NewDepartmentHandler(deptService service.DepartmentService) *DepartmentHandler {
	return &DepartmentHandler{deptService: deptService}
}

func (h *DepartmentHandler) GetAll(c *fiber.Ctx) error {
	companyID := c.Query("company_id")
	if companyID != "" {
		depts, err := h.deptService.GetByCompanyID(companyID)
		if err != nil {
			return response.Error(c, fiber.StatusInternalServerError, "Failed to fetch departments")
		}
		return response.Success(c, fiber.StatusOK, "Departments retrieved", depts)
	}

	depts, err := h.deptService.GetAll()
	if err != nil {
		return response.Error(c, fiber.StatusInternalServerError, "Failed to fetch departments")
	}
	return response.Success(c, fiber.StatusOK, "Departments retrieved", depts)
}

func (h *DepartmentHandler) GetByID(c *fiber.Ctx) error {
	id := c.Params("id")
	dept, err := h.deptService.GetByID(id)
	if err != nil {
		return response.Error(c, fiber.StatusNotFound, err.Error())
	}
	return response.Success(c, fiber.StatusOK, "Department retrieved", dept)
}

func (h *DepartmentHandler) Create(c *fiber.Ctx) error {
	var req dto.CreateDepartmentRequest
	if err := c.BodyParser(&req); err != nil {
		return response.Error(c, fiber.StatusBadRequest, "Invalid request body")
	}

	if req.CompanyID == "" || req.Name == "" {
		return response.Error(c, fiber.StatusBadRequest, "Company ID and name are required")
	}

	dept, err := h.deptService.Create(req)
	if err != nil {
		return response.Error(c, fiber.StatusBadRequest, err.Error())
	}
	return response.Success(c, fiber.StatusCreated, "Department created", dept)
}

func (h *DepartmentHandler) Update(c *fiber.Ctx) error {
	id := c.Params("id")

	var req dto.UpdateDepartmentRequest
	if err := c.BodyParser(&req); err != nil {
		return response.Error(c, fiber.StatusBadRequest, "Invalid request body")
	}

	dept, err := h.deptService.Update(id, req)
	if err != nil {
		return response.Error(c, fiber.StatusBadRequest, err.Error())
	}
	return response.Success(c, fiber.StatusOK, "Department updated", dept)
}

func (h *DepartmentHandler) Delete(c *fiber.Ctx) error {
	id := c.Params("id")

	if err := h.deptService.Delete(id); err != nil {
		return response.Error(c, fiber.StatusBadRequest, err.Error())
	}
	return response.Success(c, fiber.StatusOK, "Department deleted", nil)
}
