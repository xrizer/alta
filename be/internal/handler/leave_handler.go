package handler

import (
	"hris-backend/internal/dto"
	"hris-backend/internal/service"
	"hris-backend/pkg/response"

	"github.com/gofiber/fiber/v2"
)

type LeaveHandler struct {
	leaveService service.LeaveService
}

func NewLeaveHandler(leaveService service.LeaveService) *LeaveHandler {
	return &LeaveHandler{leaveService: leaveService}
}

func (h *LeaveHandler) GetAll(c *fiber.Ctx) error {
	employeeID := c.Query("employee_id")
	status := c.Query("status")

	if status == "pending" {
		leaves, err := h.leaveService.GetPending()
		if err != nil {
			return response.Error(c, fiber.StatusInternalServerError, "Failed to fetch leaves")
		}
		return response.Success(c, fiber.StatusOK, "Leaves retrieved", leaves)
	}

	if employeeID != "" {
		leaves, err := h.leaveService.GetByEmployeeID(employeeID)
		if err != nil {
			return response.Error(c, fiber.StatusInternalServerError, "Failed to fetch leaves")
		}
		return response.Success(c, fiber.StatusOK, "Leaves retrieved", leaves)
	}

	leaves, err := h.leaveService.GetAll()
	if err != nil {
		return response.Error(c, fiber.StatusInternalServerError, "Failed to fetch leaves")
	}
	return response.Success(c, fiber.StatusOK, "Leaves retrieved", leaves)
}

func (h *LeaveHandler) GetByID(c *fiber.Ctx) error {
	id := c.Params("id")
	leave, err := h.leaveService.GetByID(id)
	if err != nil {
		return response.Error(c, fiber.StatusNotFound, err.Error())
	}
	return response.Success(c, fiber.StatusOK, "Leave retrieved", leave)
}

func (h *LeaveHandler) Create(c *fiber.Ctx) error {
	var req dto.CreateLeaveRequest
	if err := c.BodyParser(&req); err != nil {
		return response.Error(c, fiber.StatusBadRequest, "Invalid request body")
	}

	if req.EmployeeID == "" || req.LeaveType == "" || req.StartDate == "" || req.EndDate == "" || req.Reason == "" {
		return response.Error(c, fiber.StatusBadRequest, "Employee ID, leave type, start date, end date, and reason are required")
	}

	if req.TotalDays <= 0 {
		return response.Error(c, fiber.StatusBadRequest, "Total days must be greater than 0")
	}

	leave, err := h.leaveService.Create(req)
	if err != nil {
		return response.Error(c, fiber.StatusBadRequest, err.Error())
	}
	return response.Success(c, fiber.StatusCreated, "Leave request created", leave)
}

func (h *LeaveHandler) Update(c *fiber.Ctx) error {
	id := c.Params("id")

	var req dto.UpdateLeaveRequest
	if err := c.BodyParser(&req); err != nil {
		return response.Error(c, fiber.StatusBadRequest, "Invalid request body")
	}

	leave, err := h.leaveService.Update(id, req)
	if err != nil {
		return response.Error(c, fiber.StatusBadRequest, err.Error())
	}
	return response.Success(c, fiber.StatusOK, "Leave request updated", leave)
}

func (h *LeaveHandler) Approve(c *fiber.Ctx) error {
	id := c.Params("id")
	approverID := c.Locals("userID").(string)

	var req dto.ApproveLeaveRequest
	if err := c.BodyParser(&req); err != nil {
		return response.Error(c, fiber.StatusBadRequest, "Invalid request body")
	}

	if req.Status == "" {
		return response.Error(c, fiber.StatusBadRequest, "Status is required (approved or rejected)")
	}

	leave, err := h.leaveService.Approve(id, approverID, req)
	if err != nil {
		return response.Error(c, fiber.StatusBadRequest, err.Error())
	}
	return response.Success(c, fiber.StatusOK, "Leave request updated", leave)
}

func (h *LeaveHandler) Delete(c *fiber.Ctx) error {
	id := c.Params("id")

	if err := h.leaveService.Delete(id); err != nil {
		return response.Error(c, fiber.StatusBadRequest, err.Error())
	}
	return response.Success(c, fiber.StatusOK, "Leave request deleted", nil)
}
