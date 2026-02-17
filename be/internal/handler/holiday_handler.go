package handler

import (
	"strconv"

	"hris-backend/internal/dto"
	"hris-backend/internal/service"
	"hris-backend/pkg/response"

	"github.com/gofiber/fiber/v2"
)

type HolidayHandler struct {
	holidayService service.HolidayService
}

func NewHolidayHandler(holidayService service.HolidayService) *HolidayHandler {
	return &HolidayHandler{holidayService: holidayService}
}

// GetAll godoc
// @Summary Get all holidays
// @Description Retrieve all holidays, optionally filtered by company and/or year
// @Tags Holidays
// @Security Bearer
// @Produce json
// @Param company_id query string false "Filter by company ID"
// @Param year query int false "Filter by year"
// @Success 200 {object} response.Response{data=[]dto.HolidayResponse} "Holidays retrieved"
// @Failure 400 {object} response.Response "Invalid year format"
// @Failure 500 {object} response.Response "Failed to fetch holidays"
// @Router /holidays [get]
func (h *HolidayHandler) GetAll(c *fiber.Ctx) error {
	companyID := c.Query("company_id")
	yearStr := c.Query("year")

	if companyID != "" && yearStr != "" {
		year, err := strconv.Atoi(yearStr)
		if err != nil {
			return response.Error(c, fiber.StatusBadRequest, "Invalid year format")
		}
		holidays, err := h.holidayService.GetByCompanyIDAndYear(companyID, year)
		if err != nil {
			return response.Error(c, fiber.StatusInternalServerError, "Failed to fetch holidays")
		}
		return response.Success(c, fiber.StatusOK, "Holidays retrieved", holidays)
	}

	if companyID != "" {
		holidays, err := h.holidayService.GetByCompanyID(companyID)
		if err != nil {
			return response.Error(c, fiber.StatusInternalServerError, "Failed to fetch holidays")
		}
		return response.Success(c, fiber.StatusOK, "Holidays retrieved", holidays)
	}

	holidays, err := h.holidayService.GetAll()
	if err != nil {
		return response.Error(c, fiber.StatusInternalServerError, "Failed to fetch holidays")
	}
	return response.Success(c, fiber.StatusOK, "Holidays retrieved", holidays)
}

// GetByID godoc
// @Summary Get holiday by ID
// @Description Retrieve a holiday by its ID
// @Tags Holidays
// @Security Bearer
// @Produce json
// @Param id path string true "Holiday ID"
// @Success 200 {object} response.Response{data=dto.HolidayResponse} "Holiday retrieved"
// @Failure 404 {object} response.Response "Holiday not found"
// @Router /holidays/{id} [get]
func (h *HolidayHandler) GetByID(c *fiber.Ctx) error {
	id := c.Params("id")
	holiday, err := h.holidayService.GetByID(id)
	if err != nil {
		return response.Error(c, fiber.StatusNotFound, err.Error())
	}
	return response.Success(c, fiber.StatusOK, "Holiday retrieved", holiday)
}

// Create godoc
// @Summary Create a holiday
// @Description Create a new holiday record
// @Tags Holidays
// @Security Bearer
// @Accept json
// @Produce json
// @Param request body dto.CreateHolidayRequest true "Holiday data"
// @Success 201 {object} response.Response{data=dto.HolidayResponse} "Holiday created"
// @Failure 400 {object} response.Response "Invalid request"
// @Router /holidays [post]
func (h *HolidayHandler) Create(c *fiber.Ctx) error {
	var req dto.CreateHolidayRequest
	if err := c.BodyParser(&req); err != nil {
		return response.Error(c, fiber.StatusBadRequest, "Invalid request body")
	}

	if req.CompanyID == "" || req.Name == "" || req.Date == "" {
		return response.Error(c, fiber.StatusBadRequest, "Company ID, name, and date are required")
	}

	holiday, err := h.holidayService.Create(req)
	if err != nil {
		return response.Error(c, fiber.StatusBadRequest, err.Error())
	}
	return response.Success(c, fiber.StatusCreated, "Holiday created", holiday)
}

// Update godoc
// @Summary Update a holiday
// @Description Update an existing holiday by ID
// @Tags Holidays
// @Security Bearer
// @Accept json
// @Produce json
// @Param id path string true "Holiday ID"
// @Param request body dto.UpdateHolidayRequest true "Holiday data"
// @Success 200 {object} response.Response{data=dto.HolidayResponse} "Holiday updated"
// @Failure 400 {object} response.Response "Invalid request"
// @Router /holidays/{id} [put]
func (h *HolidayHandler) Update(c *fiber.Ctx) error {
	id := c.Params("id")

	var req dto.UpdateHolidayRequest
	if err := c.BodyParser(&req); err != nil {
		return response.Error(c, fiber.StatusBadRequest, "Invalid request body")
	}

	holiday, err := h.holidayService.Update(id, req)
	if err != nil {
		return response.Error(c, fiber.StatusBadRequest, err.Error())
	}
	return response.Success(c, fiber.StatusOK, "Holiday updated", holiday)
}

// Delete godoc
// @Summary Delete a holiday
// @Description Delete a holiday by ID
// @Tags Holidays
// @Security Bearer
// @Produce json
// @Param id path string true "Holiday ID"
// @Success 200 {object} response.Response "Holiday deleted"
// @Failure 400 {object} response.Response "Failed to delete"
// @Router /holidays/{id} [delete]
func (h *HolidayHandler) Delete(c *fiber.Ctx) error {
	id := c.Params("id")

	if err := h.holidayService.Delete(id); err != nil {
		return response.Error(c, fiber.StatusBadRequest, err.Error())
	}
	return response.Success(c, fiber.StatusOK, "Holiday deleted", nil)
}
