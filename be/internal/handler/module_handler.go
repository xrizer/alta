package handler

import (
	"hris-backend/internal/dto"
	"hris-backend/internal/service"
	"hris-backend/pkg/response"

	"github.com/gofiber/fiber/v2"
)

type ModuleHandler struct {
	service   service.ModuleService
	empService service.EmployeeService
}

func NewModuleHandler(s service.ModuleService, empService service.EmployeeService) *ModuleHandler {
	return &ModuleHandler{s, empService}
}

// ListCatalog returns every module in the catalog. Superadmin/admin only.
func (h *ModuleHandler) ListCatalog(c *fiber.Ctx) error {
	modules, err := h.service.ListAllModules()
	if err != nil {
		return response.Error(c, fiber.StatusInternalServerError, err.Error())
	}
	return response.Success(c, fiber.StatusOK, "Modules fetched", modules)
}

// ListForCompany returns each module with its enabled/config state for one company.
// Superadmin endpoint: /api/companies/:id/modules
func (h *ModuleHandler) ListForCompany(c *fiber.Ctx) error {
	companyID := c.Params("id")
	rows, err := h.service.ListForCompany(companyID)
	if err != nil {
		return response.Error(c, fiber.StatusInternalServerError, err.Error())
	}
	return response.Success(c, fiber.StatusOK, "Company modules fetched", rows)
}

// SetForCompany enables or disables a module for a company.
// Superadmin endpoint: PUT /api/companies/:id/modules/:key
func (h *ModuleHandler) SetForCompany(c *fiber.Ctx) error {
	companyID := c.Params("id")
	moduleKey := c.Params("key")

	var req dto.SetCompanyModuleRequest
	if err := c.BodyParser(&req); err != nil {
		return response.Error(c, fiber.StatusBadRequest, "Invalid request body")
	}

	actorID, _ := c.Locals("userID").(string)
	saved, err := h.service.SetForCompany(companyID, moduleKey, actorID, req)
	if err != nil {
		return response.Error(c, fiber.StatusBadRequest, err.Error())
	}
	return response.Success(c, fiber.StatusOK, "Module updated", saved)
}

// GetMyModules returns the enabled module keys for the current user's company.
// Used by the FE to filter the sidebar.
func (h *ModuleHandler) GetMyModules(c *fiber.Ctx) error {
	userID, _ := c.Locals("userID").(string)
	if userID == "" {
		return response.Error(c, fiber.StatusUnauthorized, "Missing user")
	}

	// Superadmins have no employee record; return all modules enabled so they see everything.
	if role, _ := c.Locals("role").(string); role == "superadmin" {
		allModules, err := h.service.ListAllModules()
		if err != nil {
			return response.Error(c, fiber.StatusInternalServerError, err.Error())
		}
		keys := make([]string, 0, len(allModules))
		for _, m := range allModules {
			keys = append(keys, m.Key)
		}
		return response.Success(c, fiber.StatusOK, "Modules fetched", dto.MyModulesResponse{
			CompanyID:      "",
			EnabledModules: keys,
		})
	}

	emp, err := h.empService.GetByUserID(userID)
	if err != nil || emp == nil || emp.CompanyID == "" {
		return response.Error(c, fiber.StatusNotFound, "Employee / company not found for user")
	}

	keys, err := h.service.EnabledKeysForCompany(emp.CompanyID)
	if err != nil {
		return response.Error(c, fiber.StatusInternalServerError, err.Error())
	}
	return response.Success(c, fiber.StatusOK, "Modules fetched", dto.MyModulesResponse{
		CompanyID:      emp.CompanyID,
		EnabledModules: keys,
	})
}
