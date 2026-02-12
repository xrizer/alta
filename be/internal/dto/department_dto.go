package dto

import "hris-backend/internal/model"

type CreateDepartmentRequest struct {
	CompanyID   string `json:"company_id" validate:"required"`
	Name        string `json:"name" validate:"required"`
	Description string `json:"description"`
}

type UpdateDepartmentRequest struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	IsActive    *bool  `json:"is_active"`
}

type DepartmentResponse struct {
	ID          string           `json:"id"`
	CompanyID   string           `json:"company_id"`
	Company     *CompanyResponse `json:"company,omitempty"`
	Name        string           `json:"name"`
	Description string           `json:"description"`
	IsActive    bool             `json:"is_active"`
	CreatedAt   string           `json:"created_at"`
	UpdatedAt   string           `json:"updated_at"`
}

func ToDepartmentResponse(dept *model.Department) DepartmentResponse {
	resp := DepartmentResponse{
		ID:          dept.ID,
		CompanyID:   dept.CompanyID,
		Name:        dept.Name,
		Description: dept.Description,
		IsActive:    dept.IsActive,
		CreatedAt:   dept.CreatedAt.Format("2006-01-02T15:04:05Z"),
		UpdatedAt:   dept.UpdatedAt.Format("2006-01-02T15:04:05Z"),
	}
	if dept.Company.ID != "" {
		companyResp := ToCompanyResponse(&dept.Company)
		resp.Company = &companyResp
	}
	return resp
}

func ToDepartmentResponses(depts []model.Department) []DepartmentResponse {
	responses := make([]DepartmentResponse, len(depts))
	for i, dept := range depts {
		responses[i] = ToDepartmentResponse(&dept)
	}
	return responses
}
