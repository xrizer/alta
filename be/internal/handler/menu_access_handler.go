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

func (h *MenuAccessHandler) GetAll(c *fiber.Ctx) error {
	result, err := h.menuService.GetAll()
	if err != nil {
		return response.Error(c, fiber.StatusInternalServerError, err.Error())
	}

	return response.Success(c, fiber.StatusOK, "All menu access retrieved", result)
}

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
