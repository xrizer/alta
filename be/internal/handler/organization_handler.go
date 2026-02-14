package handler

import (
	"hris-backend/internal/service"
	"hris-backend/pkg/response"

	"github.com/gofiber/fiber/v2"
)

type OrganizationHandler struct {
	orgService service.OrganizationService
}

func NewOrganizationHandler(orgService service.OrganizationService) *OrganizationHandler {
	return &OrganizationHandler{orgService: orgService}
}

func (h *OrganizationHandler) GetStructure(c *fiber.Ctx) error {
	companyID := c.Query("company_id")
	if companyID == "" {
		return response.Error(c, fiber.StatusBadRequest, "company_id query parameter is required")
	}

	result, err := h.orgService.GetStructure(companyID)
	if err != nil {
		return response.Error(c, fiber.StatusNotFound, err.Error())
	}

	return response.Success(c, fiber.StatusOK, "Organization structure retrieved", result)
}
