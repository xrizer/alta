package handler

import (
	"time"

	"hris-backend/internal/dto"
	"hris-backend/internal/service"
	"hris-backend/pkg/response"

	"github.com/gofiber/fiber/v2"
)

type AuthHandler struct {
	authService service.AuthService
}

func NewAuthHandler(authService service.AuthService) *AuthHandler {
	return &AuthHandler{authService: authService}
}

// Login godoc
// @Summary User login
// @Description Authenticate user with email and password, returns access token and sets refresh token in cookie
// @Tags Authentication
// @Accept json
// @Produce json
// @Param request body dto.LoginRequest true "Login credentials"
// @Success 200 {object} response.Response{data=dto.TokenResponse} "Login successful"
// @Failure 400 {object} response.Response "Invalid request body"
// @Failure 401 {object} response.Response "Unauthorized"
// @Router /auth/login [post]
func (h *AuthHandler) Login(c *fiber.Ctx) error {
	var req dto.LoginRequest
	if err := c.BodyParser(&req); err != nil {
		return response.Error(c, fiber.StatusBadRequest, "Invalid request body")
	}

	if req.Email == "" || req.Password == "" {
		return response.Error(c, fiber.StatusBadRequest, "Email and password are required")
	}

	tokenResp, refreshToken, err := h.authService.Login(req)
	if err != nil {
		return response.Error(c, fiber.StatusUnauthorized, err.Error())
	}

	c.Cookie(&fiber.Cookie{
		Name:     "refresh_token",
		Value:    refreshToken,
		Expires:  time.Now().Add(7 * 24 * time.Hour),
		HTTPOnly: true,
		Secure:   false,
		SameSite: "Lax",
		Path:     "/",
	})

	return response.Success(c, fiber.StatusOK, "Login successful", tokenResp)
}

// Refresh godoc
// @Summary Refresh access token
// @Description Generate new access token using refresh token from cookie
// @Tags Authentication
// @Produce json
// @Success 200 {object} response.Response{data=dto.TokenResponse} "Token refreshed"
// @Failure 401 {object} response.Response "Unauthorized - refresh token not found or invalid"
// @Router /auth/refresh [post]
func (h *AuthHandler) Refresh(c *fiber.Ctx) error {
	refreshToken := c.Cookies("refresh_token")
	if refreshToken == "" {
		return response.Error(c, fiber.StatusUnauthorized, "Refresh token not found")
	}

	tokenResp, newRefreshToken, err := h.authService.RefreshToken(refreshToken)
	if err != nil {
		return response.Error(c, fiber.StatusUnauthorized, err.Error())
	}

	c.Cookie(&fiber.Cookie{
		Name:     "refresh_token",
		Value:    newRefreshToken,
		Expires:  time.Now().Add(7 * 24 * time.Hour),
		HTTPOnly: true,
		Secure:   false,
		SameSite: "Lax",
		Path:     "/",
	})

	return response.Success(c, fiber.StatusOK, "Token refreshed", tokenResp)
}

// Logout godoc
// @Summary User logout
// @Description Clear refresh token cookie to logout user
// @Tags Authentication
// @Security Bearer
// @Produce json
// @Success 200 {object} response.Response "Logged out successfully"
// @Router /auth/logout [post]
func (h *AuthHandler) Logout(c *fiber.Ctx) error {
	c.Cookie(&fiber.Cookie{
		Name:     "refresh_token",
		Value:    "",
		Expires:  time.Now().Add(-1 * time.Hour),
		HTTPOnly: true,
		Secure:   false,
		SameSite: "Lax",
		Path:     "/",
	})

	return response.Success(c, fiber.StatusOK, "Logged out successfully", nil)
}
