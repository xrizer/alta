package handler

import (
	"hris-backend/internal/dto"
	"hris-backend/internal/service"
	"hris-backend/pkg/response"

	"github.com/gofiber/fiber/v2"
)

type ModuleHandler struct {
	service    service.ModuleService
	empService service.EmployeeService
}

func NewModuleHandler(s service.ModuleService, empService service.EmployeeService) *ModuleHandler {
	return &ModuleHandler{s, empService}
}

// ListCatalog godoc
// @Summary List the feature module catalog
// @Description Returns every feature module known to the system (core + opt-in). Authenticated.
// @Tags Modules
// @Security Bearer
// @Produce json
// @Success 200 {object} response.Response{data=[]dto.ModuleResponse} "Modules fetched"
// @Failure 500 {object} response.Response "Failed to fetch modules"
// @Router /modules [get]
func (h *ModuleHandler) ListCatalog(c *fiber.Ctx) error {
	modules, err := h.service.ListAllModules()
	if err != nil {
		return response.Error(c, fiber.StatusInternalServerError, err.Error())
	}
	return response.Success(c, fiber.StatusOK, "Modules fetched", modules)
}

// ListForCompany godoc
// @Summary List modules with enabled state for a specific company
// @Description Superadmin view: every module + whether it is enabled for the given company.
// @Tags Modules
// @Security Bearer
// @Produce json
// @Param id path string true "Company ID"
// @Success 200 {object} response.Response{data=[]dto.CompanyModuleResponse} "Company modules fetched"
// @Failure 500 {object} response.Response "Failed to fetch modules"
// @Router /companies/{id}/modules [get]
func (h *ModuleHandler) ListForCompany(c *fiber.Ctx) error {
	companyID := c.Params("id")
	rows, err := h.service.ListForCompany(companyID)
	if err != nil {
		return response.Error(c, fiber.StatusInternalServerError, err.Error())
	}
	return response.Success(c, fiber.StatusOK, "Company modules fetched", rows)
}

// SetForCompany godoc
// @Summary Enable or disable a module for a company
// @Description Superadmin-only. Core modules cannot be disabled. Dependencies are validated.
// @Tags Modules
// @Security Bearer
// @Accept json
// @Produce json
// @Param id path string true "Company ID"
// @Param key path string true "Module key (e.g. visit_tracking)"
// @Param request body dto.SetCompanyModuleRequest true "Enable/disable + optional JSON config"
// @Success 200 {object} response.Response{data=dto.CompanyModuleResponse} "Module updated"
// @Failure 400 {object} response.Response "Invalid request or dependency violation"
// @Router /companies/{id}/modules/{key} [put]
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

// GetMyModules godoc
// @Summary Get the enabled module keys for the current caller
// @Description Used by the frontend to filter the sidebar. Superadmins receive all modules.
// @Tags Modules
// @Security Bearer
// @Produce json
// @Success 200 {object} response.Response{data=dto.MyModulesResponse} "Modules fetched"
// @Failure 404 {object} response.Response "Employee or company not found for user"
// @Router /me/modules [get]
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
