package middleware

import (
	"strings"

	"hris-backend/config"
	jwtPkg "hris-backend/pkg/jwt"
	"hris-backend/pkg/response"

	"github.com/gofiber/fiber/v2"
)

func AuthMiddleware(cfg *config.Config) fiber.Handler {
	return func(c *fiber.Ctx) error {
		authHeader := c.Get("Authorization")
		if authHeader == "" {
			return response.Error(c, fiber.StatusUnauthorized, "Missing authorization header")
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			return response.Error(c, fiber.StatusUnauthorized, "Invalid authorization header format")
		}

		claims, err := jwtPkg.ValidateAccessToken(parts[1], cfg.JWTSecret)
		if err != nil {
			return response.Error(c, fiber.StatusUnauthorized, "Invalid or expired token")
		}

		c.Locals("userID", claims.UserID)
		c.Locals("email", claims.Email)
		c.Locals("role", claims.Role)

		return c.Next()
	}
}
