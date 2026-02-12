package handler

import (
	"hris-backend/internal/dto"
	"hris-backend/internal/service"
	"hris-backend/pkg/response"

	"github.com/gofiber/fiber/v2"
)

type ShiftHandler struct {
	shiftService service.ShiftService
}

func NewShiftHandler(shiftService service.ShiftService) *ShiftHandler {
	return &ShiftHandler{shiftService: shiftService}
}

func (h *ShiftHandler) GetAll(c *fiber.Ctx) error {
	companyID := c.Query("company_id")
	if companyID != "" {
		shifts, err := h.shiftService.GetByCompanyID(companyID)
		if err != nil {
			return response.Error(c, fiber.StatusInternalServerError, "Failed to fetch shifts")
		}
		return response.Success(c, fiber.StatusOK, "Shifts retrieved", shifts)
	}

	shifts, err := h.shiftService.GetAll()
	if err != nil {
		return response.Error(c, fiber.StatusInternalServerError, "Failed to fetch shifts")
	}
	return response.Success(c, fiber.StatusOK, "Shifts retrieved", shifts)
}

func (h *ShiftHandler) GetByID(c *fiber.Ctx) error {
	id := c.Params("id")
	shift, err := h.shiftService.GetByID(id)
	if err != nil {
		return response.Error(c, fiber.StatusNotFound, err.Error())
	}
	return response.Success(c, fiber.StatusOK, "Shift retrieved", shift)
}

func (h *ShiftHandler) Create(c *fiber.Ctx) error {
	var req dto.CreateShiftRequest
	if err := c.BodyParser(&req); err != nil {
		return response.Error(c, fiber.StatusBadRequest, "Invalid request body")
	}

	if req.CompanyID == "" || req.Name == "" || req.StartTime == "" || req.EndTime == "" {
		return response.Error(c, fiber.StatusBadRequest, "Company ID, name, start time, and end time are required")
	}

	shift, err := h.shiftService.Create(req)
	if err != nil {
		return response.Error(c, fiber.StatusBadRequest, err.Error())
	}
	return response.Success(c, fiber.StatusCreated, "Shift created", shift)
}

func (h *ShiftHandler) Update(c *fiber.Ctx) error {
	id := c.Params("id")

	var req dto.UpdateShiftRequest
	if err := c.BodyParser(&req); err != nil {
		return response.Error(c, fiber.StatusBadRequest, "Invalid request body")
	}

	shift, err := h.shiftService.Update(id, req)
	if err != nil {
		return response.Error(c, fiber.StatusBadRequest, err.Error())
	}
	return response.Success(c, fiber.StatusOK, "Shift updated", shift)
}

func (h *ShiftHandler) Delete(c *fiber.Ctx) error {
	id := c.Params("id")

	if err := h.shiftService.Delete(id); err != nil {
		return response.Error(c, fiber.StatusBadRequest, err.Error())
	}
	return response.Success(c, fiber.StatusOK, "Shift deleted", nil)
}
