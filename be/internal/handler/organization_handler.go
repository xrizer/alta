package handler

import (
	"hris-backend/internal/dto"
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

// GetStructure godoc
// @Summary Get organization structure
// @Description Retrieve the hierarchical organization structure for a company (departments → positions → employees)
// @Tags Organization
// @Security Bearer
// @Produce json
// @Param company_id query string true "Company ID"
// @Success 200 {object} response.Response{data=dto.OrgStructureResponse} "Organization structure retrieved"
// @Failure 400 {object} response.Response "company_id is required"
// @Failure 404 {object} response.Response "Company not found"
// @Router /organization/structure [get]
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

// ensure dto import is used
var _ = dto.OrgStructureResponse{}
