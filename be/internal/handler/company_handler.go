package handler

import (
	"hris-backend/internal/dto"
	"hris-backend/internal/service"
	"hris-backend/pkg/response"
	"strconv"

	"github.com/gofiber/fiber/v2"
)

type CompanyHandler struct {
	companyService service.CompanyService
}

func NewCompanyHandler(companyService service.CompanyService) *CompanyHandler {
	return &CompanyHandler{companyService: companyService}
}

// GetAll godoc
// @Summary Get all companies
// @Description Retrieve companies with pagination, search, and sorting
// @Tags Companies
// @Security Bearer
// @Produce json
// @Param page query int false "Page number (default 1)"
// @Param limit query int false "Items per page (default 10)"
// @Param search query string false "Search by name, email, phone, or NPWP"
// @Param sort_by query string false "Sort field: name, email, phone, npwp, is_active, created_at"
// @Param sort_order query string false "Sort direction: asc or desc"
// @Success 200 {object} response.Response{data=dto.PaginatedCompanyResponse} "Companies retrieved"
// @Failure 500 {object} response.Response "Failed to fetch companies"
// @Router /companies [get]
func (h *CompanyHandler) GetAll(c *fiber.Ctx) error {
	page, _ := strconv.Atoi(c.Query("page", "1"))
	limit, _ := strconv.Atoi(c.Query("limit", "10"))
	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 10
	}

	search := c.Query("search")
	sortBy := c.Query("sort_by", "created_at")
	sortOrder := c.Query("sort_order", "desc")

	result, err := h.companyService.GetAllPaginated(page, limit, search, sortBy, sortOrder)
	if err != nil {
		return response.Error(c, fiber.StatusInternalServerError, "Failed to fetch companies")
	}
	return response.Success(c, fiber.StatusOK, "Companies retrieved", result)
}

// GetByID godoc
// @Summary Get company by ID
// @Description Retrieve a company by its ID
// @Tags Companies
// @Security Bearer
// @Produce json
// @Param id path string true "Company ID"
// @Success 200 {object} response.Response{data=dto.CompanyResponse} "Company retrieved"
// @Failure 404 {object} response.Response "Company not found"
// @Router /companies/{id} [get]
func (h *CompanyHandler) GetByID(c *fiber.Ctx) error {
	id := c.Params("id")
	company, err := h.companyService.GetByID(id)
	if err != nil {
		return response.Error(c, fiber.StatusNotFound, err.Error())
	}
	return response.Success(c, fiber.StatusOK, "Company retrieved", company)
}

// Create godoc
// @Summary Create a company
// @Description Create a new company
// @Tags Companies
// @Security Bearer
// @Accept json
// @Produce json
// @Param request body dto.CreateCompanyRequest true "Company data"
// @Success 201 {object} response.Response{data=dto.CompanyResponse} "Company created"
// @Failure 400 {object} response.Response "Invalid request"
// @Router /companies [post]
func (h *CompanyHandler) Create(c *fiber.Ctx) error {
	var req dto.CreateCompanyRequest
	if err := c.BodyParser(&req); err != nil {
		return response.Error(c, fiber.StatusBadRequest, "Invalid request body")
	}

	if req.Name == "" {
		return response.Error(c, fiber.StatusBadRequest, "Company name is required")
	}

	company, err := h.companyService.Create(req)
	if err != nil {
		return response.Error(c, fiber.StatusBadRequest, err.Error())
	}
	return response.Success(c, fiber.StatusCreated, "Company created", company)
}

// Update godoc
// @Summary Update a company
// @Description Update an existing company by ID
// @Tags Companies
// @Security Bearer
// @Accept json
// @Produce json
// @Param id path string true "Company ID"
// @Param request body dto.UpdateCompanyRequest true "Company data"
// @Success 200 {object} response.Response{data=dto.CompanyResponse} "Company updated"
// @Failure 400 {object} response.Response "Invalid request"
// @Router /companies/{id} [put]
func (h *CompanyHandler) Update(c *fiber.Ctx) error {
	id := c.Params("id")

	var req dto.UpdateCompanyRequest
	if err := c.BodyParser(&req); err != nil {
		return response.Error(c, fiber.StatusBadRequest, "Invalid request body")
	}

	company, err := h.companyService.Update(id, req)
	if err != nil {
		return response.Error(c, fiber.StatusBadRequest, err.Error())
	}
	return response.Success(c, fiber.StatusOK, "Company updated", company)
}

// Delete godoc
// @Summary Delete a company
// @Description Delete a company by ID
// @Tags Companies
// @Security Bearer
// @Produce json
// @Param id path string true "Company ID"
// @Success 200 {object} response.Response "Company deleted"
// @Failure 400 {object} response.Response "Failed to delete"
// @Router /companies/{id} [delete]
func (h *CompanyHandler) Delete(c *fiber.Ctx) error {
	id := c.Params("id")

	if err := h.companyService.Delete(id); err != nil {
		return response.Error(c, fiber.StatusBadRequest, err.Error())
	}
	return response.Success(c, fiber.StatusOK, "Company deleted", nil)
}

// DeleteMultiple godoc
// @Summary Delete multiple companies
// @Description Delete multiple companies by IDs
// @Tags Companies
// @Security Bearer
// @Accept json
// @Produce json
// @Param request body dto.DeleteMultipleCompaniesRequest true "Company IDs"
// @Success 200 {object} response.Response "Companies deleted"
// @Failure 400 {object} response.Response "Invalid request or failed to delete"
// @Router /companies [delete]
func (h *CompanyHandler) DeleteMultiple(c *fiber.Ctx) error {
	var req dto.DeleteMultipleCompaniesRequest
	if err := c.BodyParser(&req); err != nil {
		return response.Error(c, fiber.StatusBadRequest, "Invalid request body")
	}

	if len(req.IDs) == 0 {
		return response.Error(c, fiber.StatusBadRequest, "No IDs provided")
	}

	if err := h.companyService.DeleteMultiple(req.IDs); err != nil {
		return response.Error(c, fiber.StatusBadRequest, err.Error())
	}
	return response.Success(c, fiber.StatusOK, "Companies deleted", nil)
}
