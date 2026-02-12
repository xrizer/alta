package dto

import "hris-backend/internal/model"

type CreateCompanyRequest struct {
	Name    string `json:"name" validate:"required"`
	Address string `json:"address"`
	Phone   string `json:"phone"`
	Email   string `json:"email"`
	NPWP    string `json:"npwp"`
	Logo    string `json:"logo"`
}

type UpdateCompanyRequest struct {
	Name     string `json:"name"`
	Address  string `json:"address"`
	Phone    string `json:"phone"`
	Email    string `json:"email"`
	NPWP     string `json:"npwp"`
	Logo     string `json:"logo"`
	IsActive *bool  `json:"is_active"`
}

type CompanyResponse struct {
	ID        string `json:"id"`
	Name      string `json:"name"`
	Address   string `json:"address"`
	Phone     string `json:"phone"`
	Email     string `json:"email"`
	NPWP      string `json:"npwp"`
	Logo      string `json:"logo"`
	IsActive  bool   `json:"is_active"`
	CreatedAt string `json:"created_at"`
	UpdatedAt string `json:"updated_at"`
}

func ToCompanyResponse(company *model.Company) CompanyResponse {
	return CompanyResponse{
		ID:        company.ID,
		Name:      company.Name,
		Address:   company.Address,
		Phone:     company.Phone,
		Email:     company.Email,
		NPWP:      company.NPWP,
		Logo:      company.Logo,
		IsActive:  company.IsActive,
		CreatedAt: company.CreatedAt.Format("2006-01-02T15:04:05Z"),
		UpdatedAt: company.UpdatedAt.Format("2006-01-02T15:04:05Z"),
	}
}

func ToCompanyResponses(companies []model.Company) []CompanyResponse {
	responses := make([]CompanyResponse, len(companies))
	for i, company := range companies {
		responses[i] = ToCompanyResponse(&company)
	}
	return responses
}
