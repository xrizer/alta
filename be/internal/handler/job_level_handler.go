package handler

import (
	"hris-backend/internal/dto"
	"hris-backend/internal/service"
	"hris-backend/pkg/response"

	"github.com/gofiber/fiber/v2"
)

type JobLevelHandler struct {
	jobLevelService service.JobLevelService
}

func NewJobLevelHandler(jobLevelService service.JobLevelService) *JobLevelHandler {
	return &JobLevelHandler{jobLevelService: jobLevelService}
}

func (h *JobLevelHandler) GetAll(c *fiber.Ctx) error {
	companyID := c.Query("company_id")
	if companyID != "" {
		levels, err := h.jobLevelService.GetByCompanyID(companyID)
		if err != nil {
			return response.Error(c, fiber.StatusInternalServerError, "Failed to fetch job levels")
		}
		return response.Success(c, fiber.StatusOK, "Job levels retrieved", levels)
	}

	levels, err := h.jobLevelService.GetAll()
	if err != nil {
		return response.Error(c, fiber.StatusInternalServerError, "Failed to fetch job levels")
	}
	return response.Success(c, fiber.StatusOK, "Job levels retrieved", levels)
}

func (h *JobLevelHandler) GetByID(c *fiber.Ctx) error {
	id := c.Params("id")
	jl, err := h.jobLevelService.GetByID(id)
	if err != nil {
		return response.Error(c, fiber.StatusNotFound, err.Error())
	}
	return response.Success(c, fiber.StatusOK, "Job level retrieved", jl)
}

func (h *JobLevelHandler) Create(c *fiber.Ctx) error {
	var req dto.CreateJobLevelRequest
	if err := c.BodyParser(&req); err != nil {
		return response.Error(c, fiber.StatusBadRequest, "Invalid request body")
	}
	if req.CompanyID == "" || req.Name == "" {
		return response.Error(c, fiber.StatusBadRequest, "Company ID and name are required")
	}

	jl, err := h.jobLevelService.Create(req)
	if err != nil {
		return response.Error(c, fiber.StatusBadRequest, err.Error())
	}
	return response.Success(c, fiber.StatusCreated, "Job level created", jl)
}

func (h *JobLevelHandler) Update(c *fiber.Ctx) error {
	id := c.Params("id")
	var req dto.UpdateJobLevelRequest
	if err := c.BodyParser(&req); err != nil {
		return response.Error(c, fiber.StatusBadRequest, "Invalid request body")
	}

	jl, err := h.jobLevelService.Update(id, req)
	if err != nil {
		return response.Error(c, fiber.StatusBadRequest, err.Error())
	}
	return response.Success(c, fiber.StatusOK, "Job level updated", jl)
}

func (h *JobLevelHandler) Delete(c *fiber.Ctx) error {
	id := c.Params("id")
	if err := h.jobLevelService.Delete(id); err != nil {
		return response.Error(c, fiber.StatusBadRequest, err.Error())
	}
	return response.Success(c, fiber.StatusOK, "Job level deleted", nil)
}
