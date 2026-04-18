package handler

import (
	"hris-backend/internal/dto"
	"hris-backend/internal/model"
	"hris-backend/internal/service"
	"hris-backend/pkg/response"

	"github.com/gofiber/fiber/v2"
)

type CustomFieldDefinitionHandler struct {
	svc service.CustomFieldDefinitionService
}

func NewCustomFieldDefinitionHandler(svc service.CustomFieldDefinitionService) *CustomFieldDefinitionHandler {
	return &CustomFieldDefinitionHandler{svc: svc}
}

func (h *CustomFieldDefinitionHandler) GetAll(c *fiber.Ctx) error {
	companyID := c.Query("company_id")
	entityType := model.CustomFieldEntity(c.Query("entity_type"))

	if companyID != "" {
		defs, err := h.svc.GetByCompany(companyID, entityType)
		if err != nil {
			return response.Error(c, fiber.StatusInternalServerError, "Failed to fetch custom fields")
		}
		return response.Success(c, fiber.StatusOK, "Custom fields retrieved", defs)
	}

	defs, err := h.svc.GetAll()
	if err != nil {
		return response.Error(c, fiber.StatusInternalServerError, "Failed to fetch custom fields")
	}
	return response.Success(c, fiber.StatusOK, "Custom fields retrieved", defs)
}

func (h *CustomFieldDefinitionHandler) GetByID(c *fiber.Ctx) error {
	id := c.Params("id")
	def, err := h.svc.GetByID(id)
	if err != nil {
		return response.Error(c, fiber.StatusNotFound, err.Error())
	}
	return response.Success(c, fiber.StatusOK, "Custom field retrieved", def)
}

func (h *CustomFieldDefinitionHandler) Create(c *fiber.Ctx) error {
	var req dto.CreateCustomFieldDefinitionRequest
	if err := c.BodyParser(&req); err != nil {
		return response.Error(c, fiber.StatusBadRequest, "Invalid request body")
	}
	if req.CompanyID == "" || req.FieldKey == "" || req.Label == "" {
		return response.Error(c, fiber.StatusBadRequest, "company_id, field_key and label are required")
	}
	def, err := h.svc.Create(req)
	if err != nil {
		return response.Error(c, fiber.StatusBadRequest, err.Error())
	}
	return response.Success(c, fiber.StatusCreated, "Custom field created", def)
}

func (h *CustomFieldDefinitionHandler) Update(c *fiber.Ctx) error {
	id := c.Params("id")
	var req dto.UpdateCustomFieldDefinitionRequest
	if err := c.BodyParser(&req); err != nil {
		return response.Error(c, fiber.StatusBadRequest, "Invalid request body")
	}
	def, err := h.svc.Update(id, req)
	if err != nil {
		return response.Error(c, fiber.StatusBadRequest, err.Error())
	}
	return response.Success(c, fiber.StatusOK, "Custom field updated", def)
}

func (h *CustomFieldDefinitionHandler) Delete(c *fiber.Ctx) error {
	id := c.Params("id")
	if err := h.svc.Delete(id); err != nil {
		return response.Error(c, fiber.StatusBadRequest, err.Error())
	}
	return response.Success(c, fiber.StatusOK, "Custom field deleted", nil)
}
