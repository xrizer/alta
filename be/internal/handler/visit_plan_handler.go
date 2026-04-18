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

func (h *VisitPlanHandler) GetByID(c *fiber.Ctx) error {
	id := c.Params("id")
	p, err := h.service.GetByID(id)
	if err != nil {
		return response.Error(c, fiber.StatusNotFound, err.Error())
	}
	return response.Success(c, fiber.StatusOK, "Plan fetched", p)
}

// GetByEmployeeAndDate godoc
// @Summary Fetch the plan for an employee on a given date (YYYY-MM-DD).
// If employee_id=me, uses the calling user's employee record.
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
// @Summary List plans for an employee with optional date range.
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

func (h *VisitPlanHandler) Delete(c *fiber.Ctx) error {
	id := c.Params("id")
	if err := h.service.Delete(id); err != nil {
		return response.Error(c, fiber.StatusBadRequest, err.Error())
	}
	return response.Success(c, fiber.StatusOK, "Plan deleted", nil)
}

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

func (h *VisitPlanHandler) DeleteItem(c *fiber.Ctx) error {
	id := c.Params("itemId")
	if err := h.service.DeleteItem(id); err != nil {
		return response.Error(c, fiber.StatusBadRequest, err.Error())
	}
	return response.Success(c, fiber.StatusOK, "Item deleted", nil)
}

// AdherenceReport godoc
// @Summary Daily adherence report — planned vs actual + under-minimum flag.
// Query: company_id (required), date (YYYY-MM-DD, required), minimum (int, default 5)
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
