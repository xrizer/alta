package service

import (
	"errors"

	"hris-backend/internal/dto"
	"hris-backend/internal/model"
	"hris-backend/internal/repository"
)

type CompanyService interface {
	GetAll() ([]dto.CompanyResponse, error)
	GetAllPaginated(page, limit int, search, sortBy, sortOrder string) (*dto.PaginatedCompanyResponse, error)
	GetByID(id string) (*dto.CompanyResponse, error)
	Create(req dto.CreateCompanyRequest) (*dto.CompanyResponse, error)
	Update(id string, req dto.UpdateCompanyRequest) (*dto.CompanyResponse, error)
	Delete(id string) error
	DeleteMultiple(ids []string) error
}

type companyService struct {
	companyRepo repository.CompanyRepository
}

func NewCompanyService(companyRepo repository.CompanyRepository) CompanyService {
	return &companyService{companyRepo: companyRepo}
}

func (s *companyService) GetAll() ([]dto.CompanyResponse, error) {
	companies, err := s.companyRepo.FindAll()
	if err != nil {
		return nil, err
	}
	return dto.ToCompanyResponses(companies), nil
}

func (s *companyService) GetAllPaginated(page, limit int, search, sortBy, sortOrder string) (*dto.PaginatedCompanyResponse, error) {
	companies, total, err := s.companyRepo.FindAllPaginated(page, limit, search, sortBy, sortOrder)
	if err != nil {
		return nil, err
	}

	totalPages := int(total) / limit
	if int(total)%limit > 0 {
		totalPages++
	}

	return &dto.PaginatedCompanyResponse{
		Data:       dto.ToCompanyResponses(companies),
		Page:       page,
		Limit:      limit,
		TotalItems: total,
		TotalPages: totalPages,
	}, nil
}

func (s *companyService) GetByID(id string) (*dto.CompanyResponse, error) {
	company, err := s.companyRepo.FindByID(id)
	if err != nil {
		return nil, errors.New("company not found")
	}
	response := dto.ToCompanyResponse(company)
	return &response, nil
}

func (s *companyService) Create(req dto.CreateCompanyRequest) (*dto.CompanyResponse, error) {
	company := &model.Company{
		Name:     req.Name,
		Address:  req.Address,
		Phone:    req.Phone,
		Email:    req.Email,
		NPWP:     req.NPWP,
		NPP:      req.NPP,
		Logo:     req.Logo,
		IsActive: true,
	}

	if err := s.companyRepo.Create(company); err != nil {
		return nil, errors.New("failed to create company")
	}

	response := dto.ToCompanyResponse(company)
	return &response, nil
}

func (s *companyService) Update(id string, req dto.UpdateCompanyRequest) (*dto.CompanyResponse, error) {
	company, err := s.companyRepo.FindByID(id)
	if err != nil {
		return nil, errors.New("company not found")
	}

	if req.Name != "" {
		company.Name = req.Name
	}
	if req.Address != "" {
		company.Address = req.Address
	}
	if req.Phone != "" {
		company.Phone = req.Phone
	}
	if req.Email != "" {
		company.Email = req.Email
	}
	if req.NPWP != "" {
		company.NPWP = req.NPWP
	}
	if req.NPP != "" {
		company.NPP = req.NPP
	}
	if req.Logo != "" {
		company.Logo = req.Logo
	}
	if req.IsActive != nil {
		company.IsActive = *req.IsActive
	}

	if err := s.companyRepo.Update(company); err != nil {
		return nil, errors.New("failed to update company")
	}

	response := dto.ToCompanyResponse(company)
	return &response, nil
}

func (s *companyService) Delete(id string) error {
	_, err := s.companyRepo.FindByID(id)
	if err != nil {
		return errors.New("company not found")
	}
	return s.companyRepo.Delete(id)
}

func (s *companyService) DeleteMultiple(ids []string) error {
	if len(ids) == 0 {
		return errors.New("no IDs provided")
	}
	return s.companyRepo.DeleteMultiple(ids)
}
