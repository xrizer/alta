package handler

import (
	"strconv"
	"time"

	"hris-backend/internal/dto"
	"hris-backend/internal/service"
	"hris-backend/pkg/response"

	"github.com/gofiber/fiber/v2"
)

type VisitHandler struct {
	service    service.VisitService
	empService service.EmployeeService
}

func NewVisitHandler(s service.VisitService, empService service.EmployeeService) *VisitHandler {
	return &VisitHandler{s, empService}
}

// resolveActingEmployeeID returns the employee record ID of the current caller.
func (h *VisitHandler) resolveActingEmployeeID(c *fiber.Ctx) (string, error) {
	userID, _ := c.Locals("userID").(string)
	if userID == "" {
		return "", fiber.NewError(fiber.StatusUnauthorized, "missing user")
	}
	emp, err := h.empService.GetByUserID(userID)
	if err != nil || emp == nil {
		return "", fiber.NewError(fiber.StatusForbidden, "no employee record for user")
	}
	return emp.ID, nil
}

// Start godoc
// @Summary Start a visit
// @Description Record arrival at a sub-location inside an active attendance session
// @Tags Visits
// @Security Bearer
// @Accept json
// @Produce json
// @Param request body dto.StartVisitRequest true "Visit start data"
// @Success 201 {object} response.Response{data=dto.VisitResponse}
// @Router /visits/start [post]
func (h *VisitHandler) Start(c *fiber.Ctx) error {
	empID, err := h.resolveActingEmployeeID(c)
	if err != nil {
		return response.Error(c, fiber.StatusForbidden, err.Error())
	}

	var req dto.StartVisitRequest
	if err := c.BodyParser(&req); err != nil {
		return response.Error(c, fiber.StatusBadRequest, "Invalid request body")
	}
	if req.AttendanceID == "" || req.Location == "" {
		return response.Error(c, fiber.StatusBadRequest, "attendance_id and location are required")
	}

	v, err := h.service.Start(empID, req)
	if err != nil {
		return response.Error(c, fiber.StatusBadRequest, err.Error())
	}
	return response.Success(c, fiber.StatusCreated, "Visit started", v)
}

// End godoc
// @Summary End a visit
// @Description Finalize a visit with result notes and optional additional photos
// @Tags Visits
// @Security Bearer
// @Accept json
// @Produce json
// @Param id path string true "Visit ID"
// @Param request body dto.EndVisitRequest true "Visit end data"
// @Success 200 {object} response.Response{data=dto.VisitResponse}
// @Router /visits/{id}/end [post]
func (h *VisitHandler) End(c *fiber.Ctx) error {
	empID, err := h.resolveActingEmployeeID(c)
	if err != nil {
		return response.Error(c, fiber.StatusForbidden, err.Error())
	}

	id := c.Params("id")
	var req dto.EndVisitRequest
	if err := c.BodyParser(&req); err != nil {
		return response.Error(c, fiber.StatusBadRequest, "Invalid request body")
	}

	v, err := h.service.End(id, empID, req)
	if err != nil {
		return response.Error(c, fiber.StatusBadRequest, err.Error())
	}
	return response.Success(c, fiber.StatusOK, "Visit ended", v)
}

// GetByID godoc
// @Summary Get a visit by ID
// @Description Retrieve a single visit record.
// @Tags Visits
// @Security Bearer
// @Produce json
// @Param id path string true "Visit ID"
// @Success 200 {object} response.Response{data=dto.VisitResponse} "Visit fetched"
// @Failure 404 {object} response.Response "Visit not found"
// @Router /visits/{id} [get]
func (h *VisitHandler) GetByID(c *fiber.Ctx) error {
	id := c.Params("id")
	v, err := h.service.GetByID(id)
	if err != nil {
		return response.Error(c, fiber.StatusNotFound, err.Error())
	}
	return response.Success(c, fiber.StatusOK, "Visit fetched", v)
}

// GetByAttendanceID godoc
// @Summary List visits within an attendance session
// @Description Timeline of visits nested inside one clock-in session, ordered by arrival.
// @Tags Visits
// @Security Bearer
// @Produce json
// @Param attendanceId path string true "Attendance ID"
// @Success 200 {object} response.Response{data=[]dto.VisitResponse} "Visits fetched"
// @Router /visits/attendance/{attendanceId} [get]
func (h *VisitHandler) GetByAttendanceID(c *fiber.Ctx) error {
	attID := c.Params("attendanceId")
	vs, err := h.service.GetByAttendanceID(attID)
	if err != nil {
		return response.Error(c, fiber.StatusInternalServerError, err.Error())
	}
	return response.Success(c, fiber.StatusOK, "Visits fetched", vs)
}

// List godoc
// @Summary List visits with filters
// @Description Admin/HR listing. Employees should use /visits/attendance/{attendanceId}.
// @Tags Visits
// @Security Bearer
// @Produce json
// @Param employee_id query string false "Filter by employee ID"
// @Param company_id query string false "Filter by company ID"
// @Param from query string false "Filter start date (YYYY-MM-DD)"
// @Param to query string false "Filter end date (YYYY-MM-DD, inclusive)"
// @Param page query int false "Page number" default(1)
// @Param limit query int false "Items per page" default(20)
// @Success 200 {object} response.Response{data=dto.PaginatedVisitResponse} "Visits fetched"
// @Failure 400 {object} response.Response "Invalid date filter"
// @Router /visits [get]
func (h *VisitHandler) List(c *fiber.Ctx) error {
	page, _ := strconv.Atoi(c.Query("page", "1"))
	limit, _ := strconv.Atoi(c.Query("limit", "20"))
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 200 {
		limit = 20
	}

	employeeID := c.Query("employee_id")
	companyID := c.Query("company_id")

	var fromPtr, toPtr *time.Time
	if from := c.Query("from"); from != "" {
		t, err := time.Parse("2006-01-02", from)
		if err != nil {
			return response.Error(c, fiber.StatusBadRequest, "Invalid from date (YYYY-MM-DD)")
		}
		fromPtr = &t
	}
	if to := c.Query("to"); to != "" {
		t, err := time.Parse("2006-01-02", to)
		if err != nil {
			return response.Error(c, fiber.StatusBadRequest, "Invalid to date (YYYY-MM-DD)")
		}
		// include whole day
		endOfDay := t.Add(24*time.Hour - time.Second)
		toPtr = &endOfDay
	}

	out, err := h.service.List(page, limit, employeeID, companyID, fromPtr, toPtr)
	if err != nil {
		return response.Error(c, fiber.StatusInternalServerError, err.Error())
	}
	return response.Success(c, fiber.StatusOK, "Visits fetched", out)
}

// Delete godoc
// @Summary Delete a visit
// @Description Soft-deletes a visit. Admin only.
// @Tags Visits
// @Security Bearer
// @Produce json
// @Param id path string true "Visit ID"
// @Success 200 {object} response.Response "Visit deleted"
// @Failure 400 {object} response.Response "Failed to delete visit"
// @Router /visits/{id} [delete]
func (h *VisitHandler) Delete(c *fiber.Ctx) error {
	id := c.Params("id")
	if err := h.service.Delete(id); err != nil {
		return response.Error(c, fiber.StatusBadRequest, err.Error())
	}
	return response.Success(c, fiber.StatusOK, "Visit deleted", nil)
}
