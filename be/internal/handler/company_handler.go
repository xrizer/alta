package handler

import (
	"hris-backend/internal/dto"
	"hris-backend/internal/service"
	"hris-backend/pkg/response"

	"github.com/gofiber/fiber/v2"
)

type CompanyHandler struct {
	companyService service.CompanyService
}

func NewCompanyHandler(companyService service.CompanyService) *CompanyHandler {
	return &CompanyHandler{companyService: companyService}
}

func (h *CompanyHandler) GetAll(c *fiber.Ctx) error {
	companies, err := h.companyService.GetAll()
	if err != nil {
		return response.Error(c, fiber.StatusInternalServerError, "Failed to fetch companies")
	}
	return response.Success(c, fiber.StatusOK, "Companies retrieved", companies)
}

func (h *CompanyHandler) GetByID(c *fiber.Ctx) error {
	id := c.Params("id")
	company, err := h.companyService.GetByID(id)
	if err != nil {
		return response.Error(c, fiber.StatusNotFound, err.Error())
	}
	return response.Success(c, fiber.StatusOK, "Company retrieved", company)
}

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

func (h *CompanyHandler) Delete(c *fiber.Ctx) error {
	id := c.Params("id")

	if err := h.companyService.Delete(id); err != nil {
		return response.Error(c, fiber.StatusBadRequest, err.Error())
	}
	return response.Success(c, fiber.StatusOK, "Company deleted", nil)
}
