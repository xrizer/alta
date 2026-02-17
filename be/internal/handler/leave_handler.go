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

// GetAll godoc
// @Summary Get all leave requests
// @Description Retrieve all leave requests, optionally filtered by employee or status
// @Tags Leaves
// @Security Bearer
// @Produce json
// @Param employee_id query string false "Filter by employee ID"
// @Param status query string false "Filter by status (e.g. pending)"
// @Success 200 {object} response.Response{data=[]dto.LeaveResponse} "Leaves retrieved"
// @Failure 500 {object} response.Response "Failed to fetch leaves"
// @Router /leaves [get]
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

// GetByID godoc
// @Summary Get leave request by ID
// @Description Retrieve a leave request by its ID
// @Tags Leaves
// @Security Bearer
// @Produce json
// @Param id path string true "Leave ID"
// @Success 200 {object} response.Response{data=dto.LeaveResponse} "Leave retrieved"
// @Failure 404 {object} response.Response "Leave not found"
// @Router /leaves/{id} [get]
func (h *LeaveHandler) GetByID(c *fiber.Ctx) error {
	id := c.Params("id")
	leave, err := h.leaveService.GetByID(id)
	if err != nil {
		return response.Error(c, fiber.StatusNotFound, err.Error())
	}
	return response.Success(c, fiber.StatusOK, "Leave retrieved", leave)
}

// Create godoc
// @Summary Create a leave request
// @Description Submit a new leave request
// @Tags Leaves
// @Security Bearer
// @Accept json
// @Produce json
// @Param request body dto.CreateLeaveRequest true "Leave request data"
// @Success 201 {object} response.Response{data=dto.LeaveResponse} "Leave request created"
// @Failure 400 {object} response.Response "Invalid request"
// @Router /leaves [post]
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

// Update godoc
// @Summary Update a leave request
// @Description Update an existing leave request by ID
// @Tags Leaves
// @Security Bearer
// @Accept json
// @Produce json
// @Param id path string true "Leave ID"
// @Param request body dto.UpdateLeaveRequest true "Leave request data"
// @Success 200 {object} response.Response{data=dto.LeaveResponse} "Leave request updated"
// @Failure 400 {object} response.Response "Invalid request"
// @Router /leaves/{id} [put]
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

// Approve godoc
// @Summary Approve or reject a leave request
// @Description Approve or reject a pending leave request (Admin/HR only)
// @Tags Leaves
// @Security Bearer
// @Accept json
// @Produce json
// @Param id path string true "Leave ID"
// @Param request body dto.ApproveLeaveRequest true "Approval data"
// @Success 200 {object} response.Response{data=dto.LeaveResponse} "Leave request updated"
// @Failure 400 {object} response.Response "Invalid request"
// @Router /leaves/{id}/approve [put]
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

// Delete godoc
// @Summary Delete a leave request
// @Description Delete a leave request by ID
// @Tags Leaves
// @Security Bearer
// @Produce json
// @Param id path string true "Leave ID"
// @Success 200 {object} response.Response "Leave request deleted"
// @Failure 400 {object} response.Response "Failed to delete"
// @Router /leaves/{id} [delete]
func (h *LeaveHandler) Delete(c *fiber.Ctx) error {
	id := c.Params("id")

	if err := h.leaveService.Delete(id); err != nil {
		return response.Error(c, fiber.StatusBadRequest, err.Error())
	}
	return response.Success(c, fiber.StatusOK, "Leave request deleted", nil)
}
