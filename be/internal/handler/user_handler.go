package handler

import (
	"hris-backend/internal/dto"
	"hris-backend/internal/service"
	"hris-backend/pkg/response"

	"github.com/gofiber/fiber/v2"
)

type UserHandler struct {
	userService service.UserService
}

func NewUserHandler(userService service.UserService) *UserHandler {
	return &UserHandler{userService: userService}
}

func (h *UserHandler) GetAll(c *fiber.Ctx) error {
	users, err := h.userService.GetAll()
	if err != nil {
		return response.Error(c, fiber.StatusInternalServerError, "Failed to fetch users")
	}
	return response.Success(c, fiber.StatusOK, "Users retrieved", users)
}

func (h *UserHandler) GetByID(c *fiber.Ctx) error {
	id := c.Params("id")

	userRole := c.Locals("role").(string)
	userID := c.Locals("userID").(string)

	if userRole == "employee" && userID != id {
		return response.Error(c, fiber.StatusForbidden, "Access denied")
	}

	user, err := h.userService.GetByID(id)
	if err != nil {
		return response.Error(c, fiber.StatusNotFound, err.Error())
	}
	return response.Success(c, fiber.StatusOK, "User retrieved", user)
}

func (h *UserHandler) GetMe(c *fiber.Ctx) error {
	userID := c.Locals("userID").(string)
	user, err := h.userService.GetByID(userID)
	if err != nil {
		return response.Error(c, fiber.StatusNotFound, err.Error())
	}
	return response.Success(c, fiber.StatusOK, "User retrieved", user)
}

func (h *UserHandler) Create(c *fiber.Ctx) error {
	var req dto.CreateUserRequest
	if err := c.BodyParser(&req); err != nil {
		return response.Error(c, fiber.StatusBadRequest, "Invalid request body")
	}

	if req.Name == "" || req.Email == "" || req.Password == "" || req.Role == "" {
		return response.Error(c, fiber.StatusBadRequest, "Name, email, password, and role are required")
	}

	if req.Role != "admin" && req.Role != "hr" && req.Role != "employee" {
		return response.Error(c, fiber.StatusBadRequest, "Invalid role. Must be admin, hr, or employee")
	}

	if len(req.Password) < 6 {
		return response.Error(c, fiber.StatusBadRequest, "Password must be at least 6 characters")
	}

	user, err := h.userService.Create(req)
	if err != nil {
		return response.Error(c, fiber.StatusBadRequest, err.Error())
	}
	return response.Success(c, fiber.StatusCreated, "User created", user)
}

func (h *UserHandler) Update(c *fiber.Ctx) error {
	id := c.Params("id")

	var req dto.UpdateUserRequest
	if err := c.BodyParser(&req); err != nil {
		return response.Error(c, fiber.StatusBadRequest, "Invalid request body")
	}

	if req.Role != "" && req.Role != "admin" && req.Role != "hr" && req.Role != "employee" {
		return response.Error(c, fiber.StatusBadRequest, "Invalid role. Must be admin, hr, or employee")
	}

	if req.Password != "" && len(req.Password) < 6 {
		return response.Error(c, fiber.StatusBadRequest, "Password must be at least 6 characters")
	}

	user, err := h.userService.Update(id, req)
	if err != nil {
		return response.Error(c, fiber.StatusBadRequest, err.Error())
	}
	return response.Success(c, fiber.StatusOK, "User updated", user)
}

func (h *UserHandler) Delete(c *fiber.Ctx) error {
	id := c.Params("id")

	currentUserID := c.Locals("userID").(string)
	if currentUserID == id {
		return response.Error(c, fiber.StatusBadRequest, "Cannot delete your own account")
	}

	if err := h.userService.Delete(id); err != nil {
		return response.Error(c, fiber.StatusBadRequest, err.Error())
	}
	return response.Success(c, fiber.StatusOK, "User deleted", nil)
}
