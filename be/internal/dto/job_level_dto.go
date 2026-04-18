package dto

import "hris-backend/internal/model"

type CreateJobLevelRequest struct {
	CompanyID   string `json:"company_id" validate:"required"`
	Name        string `json:"name" validate:"required"`
	Description string `json:"description"`
	LevelOrder  int    `json:"level_order"`
}

type UpdateJobLevelRequest struct {
	Name        *string `json:"name"`
	Description *string `json:"description"`
	LevelOrder  *int    `json:"level_order"`
	IsActive    *bool   `json:"is_active"`
}

type JobLevelResponse struct {
	ID          string  `json:"id"`
	CompanyID   string  `json:"company_id"`
	Name        string  `json:"name"`
	Description string  `json:"description"`
	LevelOrder  int     `json:"level_order"`
	IsActive    bool    `json:"is_active"`
	CreatedAt   string  `json:"created_at"`
	UpdatedAt   string  `json:"updated_at"`
}

func ToJobLevelResponse(jl *model.JobLevel) JobLevelResponse {
	return JobLevelResponse{
		ID:          jl.ID,
		CompanyID:   jl.CompanyID,
		Name:        jl.Name,
		Description: jl.Description,
		LevelOrder:  jl.LevelOrder,
		IsActive:    jl.IsActive,
		CreatedAt:   jl.CreatedAt.Format("2006-01-02T15:04:05Z"),
		UpdatedAt:   jl.UpdatedAt.Format("2006-01-02T15:04:05Z"),
	}
}

func ToJobLevelResponses(levels []model.JobLevel) []JobLevelResponse {
	responses := make([]JobLevelResponse, len(levels))
	for i, jl := range levels {
		responses[i] = ToJobLevelResponse(&jl)
	}
	return responses
}
