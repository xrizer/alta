package handler

import (
	"hris-backend/internal/dto"
	"hris-backend/internal/service"
	"hris-backend/pkg/response"

	"github.com/gofiber/fiber/v2"
)

type PositionHandler struct {
	posService service.PositionService
}

func NewPositionHandler(posService service.PositionService) *PositionHandler {
	return &PositionHandler{posService: posService}
}

func (h *PositionHandler) GetAll(c *fiber.Ctx) error {
	companyID := c.Query("company_id")
	if companyID != "" {
		positions, err := h.posService.GetByCompanyID(companyID)
		if err != nil {
			return response.Error(c, fiber.StatusInternalServerError, "Failed to fetch positions")
		}
		return response.Success(c, fiber.StatusOK, "Positions retrieved", positions)
	}

	positions, err := h.posService.GetAll()
	if err != nil {
		return response.Error(c, fiber.StatusInternalServerError, "Failed to fetch positions")
	}
	return response.Success(c, fiber.StatusOK, "Positions retrieved", positions)
}

func (h *PositionHandler) GetByID(c *fiber.Ctx) error {
	id := c.Params("id")
	pos, err := h.posService.GetByID(id)
	if err != nil {
		return response.Error(c, fiber.StatusNotFound, err.Error())
	}
	return response.Success(c, fiber.StatusOK, "Position retrieved", pos)
}

func (h *PositionHandler) Create(c *fiber.Ctx) error {
	var req dto.CreatePositionRequest
	if err := c.BodyParser(&req); err != nil {
		return response.Error(c, fiber.StatusBadRequest, "Invalid request body")
	}

	if req.CompanyID == "" || req.Name == "" {
		return response.Error(c, fiber.StatusBadRequest, "Company ID and name are required")
	}

	pos, err := h.posService.Create(req)
	if err != nil {
		return response.Error(c, fiber.StatusBadRequest, err.Error())
	}
	return response.Success(c, fiber.StatusCreated, "Position created", pos)
}

func (h *PositionHandler) Update(c *fiber.Ctx) error {
	id := c.Params("id")

	var req dto.UpdatePositionRequest
	if err := c.BodyParser(&req); err != nil {
		return response.Error(c, fiber.StatusBadRequest, "Invalid request body")
	}

	pos, err := h.posService.Update(id, req)
	if err != nil {
		return response.Error(c, fiber.StatusBadRequest, err.Error())
	}
	return response.Success(c, fiber.StatusOK, "Position updated", pos)
}

func (h *PositionHandler) Delete(c *fiber.Ctx) error {
	id := c.Params("id")

	if err := h.posService.Delete(id); err != nil {
		return response.Error(c, fiber.StatusBadRequest, err.Error())
	}
	return response.Success(c, fiber.StatusOK, "Position deleted", nil)
}
