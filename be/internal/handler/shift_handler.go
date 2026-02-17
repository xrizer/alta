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

// GetAll godoc
// @Summary Get all shifts
// @Description Retrieve all shifts, optionally filtered by company
// @Tags Shifts
// @Security Bearer
// @Produce json
// @Param company_id query string false "Filter by company ID"
// @Success 200 {object} response.Response{data=[]dto.ShiftResponse} "Shifts retrieved"
// @Failure 500 {object} response.Response "Failed to fetch shifts"
// @Router /shifts [get]
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

// GetByID godoc
// @Summary Get shift by ID
// @Description Retrieve a shift by its ID
// @Tags Shifts
// @Security Bearer
// @Produce json
// @Param id path string true "Shift ID"
// @Success 200 {object} response.Response{data=dto.ShiftResponse} "Shift retrieved"
// @Failure 404 {object} response.Response "Shift not found"
// @Router /shifts/{id} [get]
func (h *ShiftHandler) GetByID(c *fiber.Ctx) error {
	id := c.Params("id")
	shift, err := h.shiftService.GetByID(id)
	if err != nil {
		return response.Error(c, fiber.StatusNotFound, err.Error())
	}
	return response.Success(c, fiber.StatusOK, "Shift retrieved", shift)
}

// Create godoc
// @Summary Create a shift
// @Description Create a new work shift
// @Tags Shifts
// @Security Bearer
// @Accept json
// @Produce json
// @Param request body dto.CreateShiftRequest true "Shift data"
// @Success 201 {object} response.Response{data=dto.ShiftResponse} "Shift created"
// @Failure 400 {object} response.Response "Invalid request"
// @Router /shifts [post]
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

// Update godoc
// @Summary Update a shift
// @Description Update an existing shift by ID
// @Tags Shifts
// @Security Bearer
// @Accept json
// @Produce json
// @Param id path string true "Shift ID"
// @Param request body dto.UpdateShiftRequest true "Shift data"
// @Success 200 {object} response.Response{data=dto.ShiftResponse} "Shift updated"
// @Failure 400 {object} response.Response "Invalid request"
// @Router /shifts/{id} [put]
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

// Delete godoc
// @Summary Delete a shift
// @Description Delete a shift by ID
// @Tags Shifts
// @Security Bearer
// @Produce json
// @Param id path string true "Shift ID"
// @Success 200 {object} response.Response "Shift deleted"
// @Failure 400 {object} response.Response "Failed to delete"
// @Router /shifts/{id} [delete]
func (h *ShiftHandler) Delete(c *fiber.Ctx) error {
	id := c.Params("id")

	if err := h.shiftService.Delete(id); err != nil {
		return response.Error(c, fiber.StatusBadRequest, err.Error())
	}
	return response.Success(c, fiber.StatusOK, "Shift deleted", nil)
}
