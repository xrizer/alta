package dto

import "hris-backend/internal/model"

type CreateGradeRequest struct {
	CompanyID   string  `json:"company_id" validate:"required"`
	JobLevelID  string  `json:"job_level_id" validate:"required"`
	Name        string  `json:"name" validate:"required"`
	Description string  `json:"description"`
	MinSalary   float64 `json:"min_salary"`
	MaxSalary   float64 `json:"max_salary"`
}

type UpdateGradeRequest struct {
	JobLevelID  *string  `json:"job_level_id"`
	Name        *string  `json:"name"`
	Description *string  `json:"description"`
	MinSalary   *float64 `json:"min_salary"`
	MaxSalary   *float64 `json:"max_salary"`
	IsActive    *bool    `json:"is_active"`
}

type GradeResponse struct {
	ID          string  `json:"id"`
	CompanyID   string  `json:"company_id"`
	JobLevelID  string  `json:"job_level_id"`
	JobLevelName string `json:"job_level_name,omitempty"`
	Name        string  `json:"name"`
	Description string  `json:"description"`
	MinSalary   float64 `json:"min_salary"`
	MaxSalary   float64 `json:"max_salary"`
	IsActive    bool    `json:"is_active"`
	CreatedAt   string  `json:"created_at"`
	UpdatedAt   string  `json:"updated_at"`
}

func ToGradeResponse(g *model.Grade) GradeResponse {
	resp := GradeResponse{
		ID:          g.ID,
		CompanyID:   g.CompanyID,
		JobLevelID:  g.JobLevelID,
		Name:        g.Name,
		Description: g.Description,
		MinSalary:   g.MinSalary,
		MaxSalary:   g.MaxSalary,
		IsActive:    g.IsActive,
		CreatedAt:   g.CreatedAt.Format("2006-01-02T15:04:05Z"),
		UpdatedAt:   g.UpdatedAt.Format("2006-01-02T15:04:05Z"),
	}
	if g.JobLevel.ID != "" {
		resp.JobLevelName = g.JobLevel.Name
	}
	return resp
}

func ToGradeResponses(grades []model.Grade) []GradeResponse {
	responses := make([]GradeResponse, len(grades))
	for i, g := range grades {
		responses[i] = ToGradeResponse(&g)
	}
	return responses
}
