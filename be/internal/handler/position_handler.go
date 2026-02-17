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

// GetAll godoc
// @Summary Get all positions
// @Description Retrieve all positions, optionally filtered by company
// @Tags Positions
// @Security Bearer
// @Produce json
// @Param company_id query string false "Filter by company ID"
// @Success 200 {object} response.Response{data=[]dto.PositionResponse} "Positions retrieved"
// @Failure 500 {object} response.Response "Failed to fetch positions"
// @Router /positions [get]
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

// GetByID godoc
// @Summary Get position by ID
// @Description Retrieve a position by its ID
// @Tags Positions
// @Security Bearer
// @Produce json
// @Param id path string true "Position ID"
// @Success 200 {object} response.Response{data=dto.PositionResponse} "Position retrieved"
// @Failure 404 {object} response.Response "Position not found"
// @Router /positions/{id} [get]
func (h *PositionHandler) GetByID(c *fiber.Ctx) error {
	id := c.Params("id")
	pos, err := h.posService.GetByID(id)
	if err != nil {
		return response.Error(c, fiber.StatusNotFound, err.Error())
	}
	return response.Success(c, fiber.StatusOK, "Position retrieved", pos)
}

// Create godoc
// @Summary Create a position
// @Description Create a new position
// @Tags Positions
// @Security Bearer
// @Accept json
// @Produce json
// @Param request body dto.CreatePositionRequest true "Position data"
// @Success 201 {object} response.Response{data=dto.PositionResponse} "Position created"
// @Failure 400 {object} response.Response "Invalid request"
// @Router /positions [post]
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

// Update godoc
// @Summary Update a position
// @Description Update an existing position by ID
// @Tags Positions
// @Security Bearer
// @Accept json
// @Produce json
// @Param id path string true "Position ID"
// @Param request body dto.UpdatePositionRequest true "Position data"
// @Success 200 {object} response.Response{data=dto.PositionResponse} "Position updated"
// @Failure 400 {object} response.Response "Invalid request"
// @Router /positions/{id} [put]
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

// Delete godoc
// @Summary Delete a position
// @Description Delete a position by ID
// @Tags Positions
// @Security Bearer
// @Produce json
// @Param id path string true "Position ID"
// @Success 200 {object} response.Response "Position deleted"
// @Failure 400 {object} response.Response "Failed to delete"
// @Router /positions/{id} [delete]
func (h *PositionHandler) Delete(c *fiber.Ctx) error {
	id := c.Params("id")

	if err := h.posService.Delete(id); err != nil {
		return response.Error(c, fiber.StatusBadRequest, err.Error())
	}
	return response.Success(c, fiber.StatusOK, "Position deleted", nil)
}
