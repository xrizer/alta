package response

import (
	"fmt"

	"hris-backend/pkg/signoz"

	"github.com/gofiber/fiber/v2"
)

type Response struct {
	Success bool        `json:"success"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
}

func Success(c *fiber.Ctx, statusCode int, message string, data interface{}) error {
	return c.Status(statusCode).JSON(Response{
		Success: true,
		Message: message,
		Data:    data,
	})
}

func ErrorWithData(c *fiber.Ctx, statusCode int, message string, data interface{}) error {
	attrs := map[string]interface{}{
		"service":     "hris-backend",
		"path":        c.Path(),
		"method":      c.Method(),
		"status_code": statusCode,
	}
	if userID := c.Locals("userID"); userID != nil {
		attrs["user_id"] = fmt.Sprintf("%v", userID)
	}

	if statusCode >= 500 {
		signoz.LogError(message, attrs)
	} else {
		signoz.LogWarn(message, attrs)
	}

	return c.Status(statusCode).JSON(Response{
		Success: false,
		Message: message,
		Data:    data,
	})
}

func Error(c *fiber.Ctx, statusCode int, message string) error {
	attrs := map[string]interface{}{
		"service":     "hris-backend",
		"path":        c.Path(),
		"method":      c.Method(),
		"status_code": statusCode,
	}
	if userID := c.Locals("userID"); userID != nil {
		attrs["user_id"] = fmt.Sprintf("%v", userID)
	}

	if statusCode >= 500 {
		signoz.LogError(message, attrs)
	} else {
		signoz.LogWarn(message, attrs)
	}

	return c.Status(statusCode).JSON(Response{
		Success: false,
		Message: message,
	})
}
