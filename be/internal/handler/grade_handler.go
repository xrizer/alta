package handler

import (
	"hris-backend/internal/dto"
	"hris-backend/internal/service"
	"hris-backend/pkg/response"

	"github.com/gofiber/fiber/v2"
)

type GradeHandler struct {
	gradeService service.GradeService
}

func NewGradeHandler(gradeService service.GradeService) *GradeHandler {
	return &GradeHandler{gradeService: gradeService}
}

func (h *GradeHandler) GetAll(c *fiber.Ctx) error {
	jobLevelID := c.Query("job_level_id")
	companyID := c.Query("company_id")

	if jobLevelID != "" {
		grades, err := h.gradeService.GetByJobLevelID(jobLevelID)
		if err != nil {
			return response.Error(c, fiber.StatusInternalServerError, "Failed to fetch grades")
		}
		return response.Success(c, fiber.StatusOK, "Grades retrieved", grades)
	}
	if companyID != "" {
		grades, err := h.gradeService.GetByCompanyID(companyID)
		if err != nil {
			return response.Error(c, fiber.StatusInternalServerError, "Failed to fetch grades")
		}
		return response.Success(c, fiber.StatusOK, "Grades retrieved", grades)
	}

	grades, err := h.gradeService.GetAll()
	if err != nil {
		return response.Error(c, fiber.StatusInternalServerError, "Failed to fetch grades")
	}
	return response.Success(c, fiber.StatusOK, "Grades retrieved", grades)
}

func (h *GradeHandler) GetByID(c *fiber.Ctx) error {
	id := c.Params("id")
	g, err := h.gradeService.GetByID(id)
	if err != nil {
		return response.Error(c, fiber.StatusNotFound, err.Error())
	}
	return response.Success(c, fiber.StatusOK, "Grade retrieved", g)
}

func (h *GradeHandler) Create(c *fiber.Ctx) error {
	var req dto.CreateGradeRequest
	if err := c.BodyParser(&req); err != nil {
		return response.Error(c, fiber.StatusBadRequest, "Invalid request body")
	}
	if req.CompanyID == "" || req.JobLevelID == "" || req.Name == "" {
		return response.Error(c, fiber.StatusBadRequest, "Company ID, job level ID, and name are required")
	}

	g, err := h.gradeService.Create(req)
	if err != nil {
		return response.Error(c, fiber.StatusBadRequest, err.Error())
	}
	return response.Success(c, fiber.StatusCreated, "Grade created", g)
}

func (h *GradeHandler) Update(c *fiber.Ctx) error {
	id := c.Params("id")
	var req dto.UpdateGradeRequest
	if err := c.BodyParser(&req); err != nil {
		return response.Error(c, fiber.StatusBadRequest, "Invalid request body")
	}

	g, err := h.gradeService.Update(id, req)
	if err != nil {
		return response.Error(c, fiber.StatusBadRequest, err.Error())
	}
	return response.Success(c, fiber.StatusOK, "Grade updated", g)
}

func (h *GradeHandler) Delete(c *fiber.Ctx) error {
	id := c.Params("id")
	if err := h.gradeService.Delete(id); err != nil {
		return response.Error(c, fiber.StatusBadRequest, err.Error())
	}
	return response.Success(c, fiber.StatusOK, "Grade deleted", nil)
}
