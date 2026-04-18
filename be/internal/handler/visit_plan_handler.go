package handler

import (
	"strconv"
	"time"

	"hris-backend/internal/dto"
	"hris-backend/internal/service"
	"hris-backend/pkg/response"

	"github.com/gofiber/fiber/v2"
)

type VisitPlanHandler struct {
	service    service.VisitPlanService
	empService service.EmployeeService
}

func NewVisitPlanHandler(s service.VisitPlanService, empService service.EmployeeService) *VisitPlanHandler {
	return &VisitPlanHandler{s, empService}
}

// Create godoc
// @Summary Create a visit plan for an employee on a specific date
// @Tags VisitPlans
// @Security Bearer
// @Accept json
// @Produce json
// @Param request body dto.CreateVisitPlanRequest true "Plan data"
// @Success 201 {object} response.Response{data=dto.VisitPlanResponse}
// @Router /visit-plans [post]
func (h *VisitPlanHandler) Create(c *fiber.Ctx) error {
	userID, _ := c.Locals("userID").(string)
	var req dto.CreateVisitPlanRequest
	if err := c.BodyParser(&req); err != nil {
		return response.Error(c, fiber.StatusBadRequest, "Invalid request body")
	}
	if req.EmployeeID == "" || req.PlanDate == "" {
		return response.Error(c, fiber.StatusBadRequest, "employee_id and plan_date are required")
	}
	p, err := h.service.Create(userID, req)
	if err != nil {
		return response.Error(c, fiber.StatusBadRequest, err.Error())
	}
	return response.Success(c, fiber.StatusCreated, "Plan created", p)
}

// Update godoc
// @Summary Update a visit plan (status / notes)
// @Tags VisitPlans
// @Security Bearer
// @Accept json
// @Produce json
// @Param id path string true "Plan ID"
// @Param request body dto.UpdateVisitPlanRequest true "Fields to update"
// @Success 200 {object} response.Response{data=dto.VisitPlanResponse} "Plan updated"
// @Failure 400 {object} response.Response "Invalid request"
// @Router /visit-plans/{id} [put]
func (h *VisitPlanHandler) Update(c *fiber.Ctx) error {
	id := c.Params("id")
	var req dto.UpdateVisitPlanRequest
	if err := c.BodyParser(&req); err != nil {
		return response.Error(c, fiber.StatusBadRequest, "Invalid request body")
	}
	p, err := h.service.Update(id, req)
	if err != nil {
		return response.Error(c, fiber.StatusBadRequest, err.Error())
	}
	return response.Success(c, fiber.StatusOK, "Plan updated", p)
}

// GetByID godoc
// @Summary Get a visit plan by ID
// @Tags VisitPlans
// @Security Bearer
// @Produce json
// @Param id path string true "Plan ID"
// @Success 200 {object} response.Response{data=dto.VisitPlanResponse} "Plan fetched"
// @Failure 404 {object} response.Response "Plan not found"
// @Router /visit-plans/{id} [get]
func (h *VisitPlanHandler) GetByID(c *fiber.Ctx) error {
	id := c.Params("id")
	p, err := h.service.GetByID(id)
	if err != nil {
		return response.Error(c, fiber.StatusNotFound, err.Error())
	}
	return response.Success(c, fiber.StatusOK, "Plan fetched", p)
}

// GetByEmployeeAndDate godoc
// @Summary Fetch the plan for an employee on a given date
// @Description Pass employee_id=me to look up the caller's plan.
// @Tags VisitPlans
// @Security Bearer
// @Produce json
// @Param employee_id query string true "Employee ID or 'me'"
// @Param date query string true "Plan date (YYYY-MM-DD)"
// @Success 200 {object} response.Response{data=dto.VisitPlanResponse} "Plan fetched"
// @Failure 400 {object} response.Response "Invalid date format"
// @Failure 404 {object} response.Response "Plan not found"
// @Router /visit-plans/by-date [get]
func (h *VisitPlanHandler) GetByEmployeeAndDate(c *fiber.Ctx) error {
	empID := c.Query("employee_id")
	dateStr := c.Query("date")
	if empID == "" || dateStr == "" {
		return response.Error(c, fiber.StatusBadRequest, "employee_id and date are required")
	}
	if empID == "me" {
		userID, _ := c.Locals("userID").(string)
		emp, err := h.empService.GetByUserID(userID)
		if err != nil || emp == nil {
			return response.Error(c, fiber.StatusForbidden, "no employee record for user")
		}
		empID = emp.ID
	}
	date, err := time.Parse("2006-01-02", dateStr)
	if err != nil {
		return response.Error(c, fiber.StatusBadRequest, "Invalid date (YYYY-MM-DD)")
	}
	p, err := h.service.GetByEmployeeAndDate(empID, date)
	if err != nil {
		return response.Error(c, fiber.StatusNotFound, err.Error())
	}
	return response.Success(c, fiber.StatusOK, "Plan fetched", p)
}

// ListByEmployee godoc
// @Summary List plans for an employee
// @Description Optionally filter by date range. Use employeeId=me for self-service.
// @Tags VisitPlans
// @Security Bearer
// @Produce json
// @Param employeeId path string true "Employee ID or 'me'"
// @Param from query string false "Start date (YYYY-MM-DD)"
// @Param to query string false "End date (YYYY-MM-DD)"
// @Success 200 {object} response.Response{data=[]dto.VisitPlanResponse} "Plans fetched"
// @Router /visit-plans/employee/{employeeId} [get]
func (h *VisitPlanHandler) ListByEmployee(c *fiber.Ctx) error {
	empID := c.Params("employeeId")
	if empID == "me" {
		userID, _ := c.Locals("userID").(string)
		emp, err := h.empService.GetByUserID(userID)
		if err != nil || emp == nil {
			return response.Error(c, fiber.StatusForbidden, "no employee record for user")
		}
		empID = emp.ID
	}
	var fromPtr, toPtr *time.Time
	if from := c.Query("from"); from != "" {
		t, err := time.Parse("2006-01-02", from)
		if err != nil {
			return response.Error(c, fiber.StatusBadRequest, "Invalid from date")
		}
		fromPtr = &t
	}
	if to := c.Query("to"); to != "" {
		t, err := time.Parse("2006-01-02", to)
		if err != nil {
			return response.Error(c, fiber.StatusBadRequest, "Invalid to date")
		}
		toPtr = &t
	}
	ps, err := h.service.ListByEmployee(empID, fromPtr, toPtr)
	if err != nil {
		return response.Error(c, fiber.StatusInternalServerError, err.Error())
	}
	return response.Success(c, fiber.StatusOK, "Plans fetched", ps)
}

// Delete godoc
// @Summary Delete a visit plan
// @Description Soft-deletes the plan and all its items. Admin only.
// @Tags VisitPlans
// @Security Bearer
// @Produce json
// @Param id path string true "Plan ID"
// @Success 200 {object} response.Response "Plan deleted"
// @Router /visit-plans/{id} [delete]
func (h *VisitPlanHandler) Delete(c *fiber.Ctx) error {
	id := c.Params("id")
	if err := h.service.Delete(id); err != nil {
		return response.Error(c, fiber.StatusBadRequest, err.Error())
	}
	return response.Success(c, fiber.StatusOK, "Plan deleted", nil)
}

// AddItem godoc
// @Summary Add a stop to a visit plan
// @Tags VisitPlans
// @Security Bearer
// @Accept json
// @Produce json
// @Param id path string true "Plan ID"
// @Param request body dto.AddVisitPlanItemRequest true "Plan item data"
// @Success 201 {object} response.Response{data=dto.VisitPlanItemResponse} "Item added"
// @Failure 400 {object} response.Response "Invalid request"
// @Router /visit-plans/{id}/items [post]
func (h *VisitPlanHandler) AddItem(c *fiber.Ctx) error {
	planID := c.Params("id")
	var req dto.AddVisitPlanItemRequest
	if err := c.BodyParser(&req); err != nil {
		return response.Error(c, fiber.StatusBadRequest, "Invalid request body")
	}
	if req.Location == "" {
		return response.Error(c, fiber.StatusBadRequest, "location is required")
	}
	item, err := h.service.AddItem(planID, req)
	if err != nil {
		return response.Error(c, fiber.StatusBadRequest, err.Error())
	}
	return response.Success(c, fiber.StatusCreated, "Item added", item)
}

// UpdateItem godoc
// @Summary Update a plan item (mark visited/skipped, edit fields)
// @Tags VisitPlans
// @Security Bearer
// @Accept json
// @Produce json
// @Param itemId path string true "Plan item ID"
// @Param request body dto.UpdateVisitPlanItemRequest true "Fields to update"
// @Success 200 {object} response.Response{data=dto.VisitPlanItemResponse} "Item updated"
// @Failure 400 {object} response.Response "Invalid request"
// @Router /visit-plans/items/{itemId} [put]
func (h *VisitPlanHandler) UpdateItem(c *fiber.Ctx) error {
	id := c.Params("itemId")
	var req dto.UpdateVisitPlanItemRequest
	if err := c.BodyParser(&req); err != nil {
		return response.Error(c, fiber.StatusBadRequest, "Invalid request body")
	}
	item, err := h.service.UpdateItem(id, req)
	if err != nil {
		return response.Error(c, fiber.StatusBadRequest, err.Error())
	}
	return response.Success(c, fiber.StatusOK, "Item updated", item)
}

// DeleteItem godoc
// @Summary Delete a plan item
// @Tags VisitPlans
// @Security Bearer
// @Produce json
// @Param itemId path string true "Plan item ID"
// @Success 200 {object} response.Response "Item deleted"
// @Router /visit-plans/items/{itemId} [delete]
func (h *VisitPlanHandler) DeleteItem(c *fiber.Ctx) error {
	id := c.Params("itemId")
	if err := h.service.DeleteItem(id); err != nil {
		return response.Error(c, fiber.StatusBadRequest, err.Error())
	}
	return response.Success(c, fiber.StatusOK, "Item deleted", nil)
}

// AdherenceReport godoc
// @Summary Daily visit adherence report
// @Description Planned-vs-actual per employee for one date. The under_minimum flag is soft (default minimum 5).
// @Tags VisitPlans
// @Security Bearer
// @Produce json
// @Param company_id query string true "Company ID"
// @Param date query string true "Report date (YYYY-MM-DD)"
// @Param minimum query int false "Override the 5/day threshold"
// @Success 200 {object} response.Response{data=dto.VisitAdherenceReport} "Report generated"
// @Failure 400 {object} response.Response "Invalid parameters"
// @Router /visit-plans/report [get]
func (h *VisitPlanHandler) AdherenceReport(c *fiber.Ctx) error {
	companyID := c.Query("company_id")
	dateStr := c.Query("date")
	if companyID == "" || dateStr == "" {
		return response.Error(c, fiber.StatusBadRequest, "company_id and date are required")
	}
	date, err := time.Parse("2006-01-02", dateStr)
	if err != nil {
		return response.Error(c, fiber.StatusBadRequest, "Invalid date (YYYY-MM-DD)")
	}
	minimum, _ := strconv.Atoi(c.Query("minimum", "0"))
	r, err := h.service.AdherenceReport(companyID, date, minimum)
	if err != nil {
		return response.Error(c, fiber.StatusInternalServerError, err.Error())
	}
	return response.Success(c, fiber.StatusOK, "Report generated", r)
}
