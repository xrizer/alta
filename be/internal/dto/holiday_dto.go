package dto

import "hris-backend/internal/model"

type CreateHolidayRequest struct {
	CompanyID  string `json:"company_id" validate:"required"`
	Name       string `json:"name" validate:"required"`
	Date       string `json:"date" validate:"required"`
	IsNational *bool  `json:"is_national"`
}

type UpdateHolidayRequest struct {
	Name       string `json:"name"`
	Date       string `json:"date"`
	IsNational *bool  `json:"is_national"`
}

type HolidayResponse struct {
	ID         string           `json:"id"`
	CompanyID  string           `json:"company_id"`
	Company    *CompanyResponse `json:"company,omitempty"`
	Name       string           `json:"name"`
	Date       string           `json:"date"`
	IsNational bool             `json:"is_national"`
	CreatedAt  string           `json:"created_at"`
	UpdatedAt  string           `json:"updated_at"`
}

func ToHolidayResponse(h *model.Holiday) HolidayResponse {
	resp := HolidayResponse{
		ID:         h.ID,
		CompanyID:  h.CompanyID,
		Name:       h.Name,
		Date:       h.Date.Format("2006-01-02"),
		IsNational: h.IsNational,
		CreatedAt:  h.CreatedAt.Format("2006-01-02T15:04:05Z"),
		UpdatedAt:  h.UpdatedAt.Format("2006-01-02T15:04:05Z"),
	}
	if h.Company.ID != "" {
		companyResp := ToCompanyResponse(&h.Company)
		resp.Company = &companyResp
	}
	return resp
}

func ToHolidayResponses(holidays []model.Holiday) []HolidayResponse {
	responses := make([]HolidayResponse, len(holidays))
	for i, h := range holidays {
		responses[i] = ToHolidayResponse(&h)
	}
	return responses
}
