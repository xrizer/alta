package dto

import "hris-backend/internal/model"

type CreatePositionRequest struct {
	CompanyID    string  `json:"company_id" validate:"required"`
	DepartmentID string  `json:"department_id"`
	Name         string  `json:"name" validate:"required"`
	BaseSalary   float64 `json:"base_salary"`
}

type UpdatePositionRequest struct {
	DepartmentID string   `json:"department_id"`
	Name         string   `json:"name"`
	BaseSalary   *float64 `json:"base_salary"`
	IsActive     *bool    `json:"is_active"`
}

type PositionResponse struct {
	ID           string              `json:"id"`
	CompanyID    string              `json:"company_id"`
	Company      *CompanyResponse    `json:"company,omitempty"`
	DepartmentID string              `json:"department_id"`
	Department   *DepartmentResponse `json:"department,omitempty"`
	Name         string              `json:"name"`
	BaseSalary   float64             `json:"base_salary"`
	IsActive     bool                `json:"is_active"`
	CreatedAt    string              `json:"created_at"`
	UpdatedAt    string              `json:"updated_at"`
}

func ToPositionResponse(pos *model.Position) PositionResponse {
	resp := PositionResponse{
		ID:           pos.ID,
		CompanyID:    pos.CompanyID,
		DepartmentID: pos.DepartmentID,
		Name:         pos.Name,
		BaseSalary:   pos.BaseSalary,
		IsActive:     pos.IsActive,
		CreatedAt:    pos.CreatedAt.Format("2006-01-02T15:04:05Z"),
		UpdatedAt:    pos.UpdatedAt.Format("2006-01-02T15:04:05Z"),
	}
	if pos.Company.ID != "" {
		companyResp := ToCompanyResponse(&pos.Company)
		resp.Company = &companyResp
	}
	if pos.Department.ID != "" {
		deptResp := ToDepartmentResponse(&pos.Department)
		resp.Department = &deptResp
	}
	return resp
}

func ToPositionResponses(positions []model.Position) []PositionResponse {
	responses := make([]PositionResponse, len(positions))
	for i, pos := range positions {
		responses[i] = ToPositionResponse(&pos)
	}
	return responses
}
