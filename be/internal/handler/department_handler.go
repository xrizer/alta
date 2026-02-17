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

// GetAll godoc
// @Summary Get all departments
// @Description Retrieve all departments, optionally filtered by company
// @Tags Departments
// @Security Bearer
// @Produce json
// @Param company_id query string false "Filter by company ID"
// @Success 200 {object} response.Response{data=[]dto.DepartmentResponse} "Departments retrieved"
// @Failure 500 {object} response.Response "Failed to fetch departments"
// @Router /departments [get]
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

// GetByID godoc
// @Summary Get department by ID
// @Description Retrieve a department by its ID
// @Tags Departments
// @Security Bearer
// @Produce json
// @Param id path string true "Department ID"
// @Success 200 {object} response.Response{data=dto.DepartmentResponse} "Department retrieved"
// @Failure 404 {object} response.Response "Department not found"
// @Router /departments/{id} [get]
func (h *DepartmentHandler) GetByID(c *fiber.Ctx) error {
	id := c.Params("id")
	dept, err := h.deptService.GetByID(id)
	if err != nil {
		return response.Error(c, fiber.StatusNotFound, err.Error())
	}
	return response.Success(c, fiber.StatusOK, "Department retrieved", dept)
}

// Create godoc
// @Summary Create a department
// @Description Create a new department
// @Tags Departments
// @Security Bearer
// @Accept json
// @Produce json
// @Param request body dto.CreateDepartmentRequest true "Department data"
// @Success 201 {object} response.Response{data=dto.DepartmentResponse} "Department created"
// @Failure 400 {object} response.Response "Invalid request"
// @Router /departments [post]
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

// Update godoc
// @Summary Update a department
// @Description Update an existing department by ID
// @Tags Departments
// @Security Bearer
// @Accept json
// @Produce json
// @Param id path string true "Department ID"
// @Param request body dto.UpdateDepartmentRequest true "Department data"
// @Success 200 {object} response.Response{data=dto.DepartmentResponse} "Department updated"
// @Failure 400 {object} response.Response "Invalid request"
// @Router /departments/{id} [put]
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

// Delete godoc
// @Summary Delete a department
// @Description Delete a department by ID
// @Tags Departments
// @Security Bearer
// @Produce json
// @Param id path string true "Department ID"
// @Success 200 {object} response.Response "Department deleted"
// @Failure 400 {object} response.Response "Failed to delete"
// @Router /departments/{id} [delete]
func (h *DepartmentHandler) Delete(c *fiber.Ctx) error {
	id := c.Params("id")

	if err := h.deptService.Delete(id); err != nil {
		return response.Error(c, fiber.StatusBadRequest, err.Error())
	}
	return response.Success(c, fiber.StatusOK, "Department deleted", nil)
}
