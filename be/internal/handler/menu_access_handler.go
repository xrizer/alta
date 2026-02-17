package handler

import (
	"hris-backend/internal/dto"
	"hris-backend/internal/service"
	"hris-backend/pkg/response"

	"github.com/gofiber/fiber/v2"
)

type MenuAccessHandler struct {
	menuService service.MenuAccessService
}

func NewMenuAccessHandler(menuService service.MenuAccessService) *MenuAccessHandler {
	return &MenuAccessHandler{menuService: menuService}
}

// GetMyMenus godoc
// @Summary Get my menu access
// @Description Retrieve the list of menu keys accessible to the currently authenticated user
// @Tags Menu Access
// @Security Bearer
// @Produce json
// @Success 200 {object} response.Response{data=dto.UserMenuKeysResponse} "Menu access retrieved"
// @Failure 401 {object} response.Response "Unauthorized"
// @Failure 500 {object} response.Response "Internal server error"
// @Router /menu-access/me [get]
func (h *MenuAccessHandler) GetMyMenus(c *fiber.Ctx) error {
	userID, ok := c.Locals("userID").(string)
	if !ok {
		return response.Error(c, fiber.StatusUnauthorized, "Unauthorized")
	}

	result, err := h.menuService.GetUserMenuKeys(userID)
	if err != nil {
		return response.Error(c, fiber.StatusInternalServerError, err.Error())
	}

	return response.Success(c, fiber.StatusOK, "Menu access retrieved", result)
}

// GetAll godoc
// @Summary Get all menu access mappings
// @Description Retrieve all user menu access mappings (Admin only)
// @Tags Menu Access
// @Security Bearer
// @Produce json
// @Success 200 {object} response.Response{data=[]dto.MenuAccessResponse} "All menu access retrieved"
// @Failure 500 {object} response.Response "Internal server error"
// @Router /menu-access [get]
func (h *MenuAccessHandler) GetAll(c *fiber.Ctx) error {
	result, err := h.menuService.GetAll()
	if err != nil {
		return response.Error(c, fiber.StatusInternalServerError, err.Error())
	}

	return response.Success(c, fiber.StatusOK, "All menu access retrieved", result)
}

// Set godoc
// @Summary Set user menu access
// @Description Set the menu keys accessible to a specific user (Admin only)
// @Tags Menu Access
// @Security Bearer
// @Accept json
// @Produce json
// @Param request body dto.SetMenuAccessRequest true "Menu access data"
// @Success 200 {object} response.Response "Menu access updated"
// @Failure 400 {object} response.Response "Invalid request"
// @Router /menu-access [post]
func (h *MenuAccessHandler) Set(c *fiber.Ctx) error {
	var req dto.SetMenuAccessRequest
	if err := c.BodyParser(&req); err != nil {
		return response.Error(c, fiber.StatusBadRequest, "Invalid request body")
	}

	if req.UserID == "" {
		return response.Error(c, fiber.StatusBadRequest, "user_id is required")
	}

	if err := h.menuService.SetUserMenuAccess(req); err != nil {
		return response.Error(c, fiber.StatusBadRequest, err.Error())
	}

	return response.Success(c, fiber.StatusOK, "Menu access updated", nil)
}

// Delete godoc
// @Summary Reset user menu access
// @Description Delete custom menu access for a user, reverting to role defaults (Admin only)
// @Tags Menu Access
// @Security Bearer
// @Produce json
// @Param user_id path string true "User ID"
// @Success 200 {object} response.Response "Menu access reset to defaults"
// @Failure 400 {object} response.Response "user_id is required"
// @Failure 500 {object} response.Response "Internal server error"
// @Router /menu-access/{user_id} [delete]
func (h *MenuAccessHandler) Delete(c *fiber.Ctx) error {
	userID := c.Params("user_id")
	if userID == "" {
		return response.Error(c, fiber.StatusBadRequest, "user_id is required")
	}

	if err := h.menuService.DeleteUserMenuAccess(userID); err != nil {
		return response.Error(c, fiber.StatusInternalServerError, err.Error())
	}

	return response.Success(c, fiber.StatusOK, "Menu access reset to defaults", nil)
}
