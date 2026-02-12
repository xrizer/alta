package middleware

import (
	"hris-backend/pkg/response"

	"github.com/gofiber/fiber/v2"
)

func RoleMiddleware(allowedRoles ...string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		role, ok := c.Locals("role").(string)
		if !ok {
			return response.Error(c, fiber.StatusForbidden, "Access denied")
		}

		for _, allowed := range allowedRoles {
			if role == allowed {
				return c.Next()
			}
		}

		return response.Error(c, fiber.StatusForbidden, "Insufficient permissions")
	}
}
