package service

import (
	"errors"

	"hris-backend/internal/dto"
	"hris-backend/internal/repository"
)

type OrganizationService interface {
	GetStructure(companyID string) (*dto.OrgStructureResponse, error)
}

type organizationService struct {
	companyRepo repository.CompanyRepository
}

func NewOrganizationService(companyRepo repository.CompanyRepository) OrganizationService {
	return &organizationService{companyRepo: companyRepo}
}

func (s *organizationService) GetStructure(companyID string) (*dto.OrgStructureResponse, error) {
	if companyID == "" {
		return nil, errors.New("company_id is required")
	}

	company, err := s.companyRepo.FindWithStructure(companyID)
	if err != nil {
		return nil, errors.New("company not found")
	}

	resp := dto.ToOrgStructureResponse(company)
	return &resp, nil
}
