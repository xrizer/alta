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

func (h *HolidayHandler) GetByID(c *fiber.Ctx) error {
	id := c.Params("id")
	holiday, err := h.holidayService.GetByID(id)
	if err != nil {
		return response.Error(c, fiber.StatusNotFound, err.Error())
	}
	return response.Success(c, fiber.StatusOK, "Holiday retrieved", holiday)
}

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

func (h *HolidayHandler) Delete(c *fiber.Ctx) error {
	id := c.Params("id")

	if err := h.holidayService.Delete(id); err != nil {
		return response.Error(c, fiber.StatusBadRequest, err.Error())
	}
	return response.Success(c, fiber.StatusOK, "Holiday deleted", nil)
}
