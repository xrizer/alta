package dto

import "hris-backend/internal/model"

type CreateShiftRequest struct {
	CompanyID string `json:"company_id" validate:"required"`
	Name      string `json:"name" validate:"required"`
	StartTime string `json:"start_time" validate:"required"`
	EndTime   string `json:"end_time" validate:"required"`
}

type UpdateShiftRequest struct {
	Name      string `json:"name"`
	StartTime string `json:"start_time"`
	EndTime   string `json:"end_time"`
	IsActive  *bool  `json:"is_active"`
}

type ShiftResponse struct {
	ID        string           `json:"id"`
	CompanyID string           `json:"company_id"`
	Company   *CompanyResponse `json:"company,omitempty"`
	Name      string           `json:"name"`
	StartTime string           `json:"start_time"`
	EndTime   string           `json:"end_time"`
	IsActive  bool             `json:"is_active"`
	CreatedAt string           `json:"created_at"`
	UpdatedAt string           `json:"updated_at"`
}

func ToShiftResponse(shift *model.Shift) ShiftResponse {
	resp := ShiftResponse{
		ID:        shift.ID,
		CompanyID: shift.CompanyID,
		Name:      shift.Name,
		StartTime: shift.StartTime,
		EndTime:   shift.EndTime,
		IsActive:  shift.IsActive,
		CreatedAt: shift.CreatedAt.Format("2006-01-02T15:04:05Z"),
		UpdatedAt: shift.UpdatedAt.Format("2006-01-02T15:04:05Z"),
	}
	if shift.Company.ID != "" {
		companyResp := ToCompanyResponse(&shift.Company)
		resp.Company = &companyResp
	}
	return resp
}

func ToShiftResponses(shifts []model.Shift) []ShiftResponse {
	responses := make([]ShiftResponse, len(shifts))
	for i, shift := range shifts {
		responses[i] = ToShiftResponse(&shift)
	}
	return responses
}
