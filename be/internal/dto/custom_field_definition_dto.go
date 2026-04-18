package dto

import (
	"encoding/json"

	"hris-backend/internal/model"
)

type CreateCustomFieldDefinitionRequest struct {
	CompanyID    string                  `json:"company_id" validate:"required"`
	EntityType   model.CustomFieldEntity `json:"entity_type"` // defaults to "employee"
	FieldKey     string                  `json:"field_key" validate:"required"`
	Label        string                  `json:"label" validate:"required"`
	FieldType    model.CustomFieldType   `json:"field_type"`
	Options      []string                `json:"options"`
	IsRequired   bool                    `json:"is_required"`
	DisplayOrder int                     `json:"display_order"`
}

type UpdateCustomFieldDefinitionRequest struct {
	Label        *string                `json:"label"`
	FieldType    *model.CustomFieldType `json:"field_type"`
	Options      []string               `json:"options"`
	IsRequired   *bool                  `json:"is_required"`
	DisplayOrder *int                   `json:"display_order"`
	IsActive     *bool                  `json:"is_active"`
}

type CustomFieldDefinitionResponse struct {
	ID           string                  `json:"id"`
	CompanyID    string                  `json:"company_id"`
	EntityType   model.CustomFieldEntity `json:"entity_type"`
	FieldKey     string                  `json:"field_key"`
	Label        string                  `json:"label"`
	FieldType    model.CustomFieldType   `json:"field_type"`
	Options      []string                `json:"options,omitempty"`
	IsRequired   bool                    `json:"is_required"`
	DisplayOrder int                     `json:"display_order"`
	IsActive     bool                    `json:"is_active"`
	CreatedAt    string                  `json:"created_at"`
	UpdatedAt    string                  `json:"updated_at"`
}

func ToCustomFieldDefinitionResponse(c *model.CustomFieldDefinition) CustomFieldDefinitionResponse {
	resp := CustomFieldDefinitionResponse{
		ID:           c.ID,
		CompanyID:    c.CompanyID,
		EntityType:   c.EntityType,
		FieldKey:     c.FieldKey,
		Label:        c.Label,
		FieldType:    c.FieldType,
		IsRequired:   c.IsRequired,
		DisplayOrder: c.DisplayOrder,
		IsActive:     c.IsActive,
		CreatedAt:    c.CreatedAt.Format("2006-01-02T15:04:05Z"),
		UpdatedAt:    c.UpdatedAt.Format("2006-01-02T15:04:05Z"),
	}
	if len(c.Options) > 0 {
		var opts []string
		if err := json.Unmarshal(c.Options, &opts); err == nil {
			resp.Options = opts
		}
	}
	return resp
}

func ToCustomFieldDefinitionResponses(defs []model.CustomFieldDefinition) []CustomFieldDefinitionResponse {
	out := make([]CustomFieldDefinitionResponse, len(defs))
	for i, d := range defs {
		out[i] = ToCustomFieldDefinitionResponse(&d)
	}
	return out
}
