package service

import (
	"errors"

	"hris-backend/internal/dto"
	"hris-backend/internal/model"
	"hris-backend/internal/repository"
)

type PositionService interface {
	GetAll() ([]dto.PositionResponse, error)
	GetByID(id string) (*dto.PositionResponse, error)
	GetByCompanyID(companyID string) ([]dto.PositionResponse, error)
	Create(req dto.CreatePositionRequest) (*dto.PositionResponse, error)
	Update(id string, req dto.UpdatePositionRequest) (*dto.PositionResponse, error)
	Delete(id string) error
}

type positionService struct {
	posRepo     repository.PositionRepository
	companyRepo repository.CompanyRepository
}

func NewPositionService(posRepo repository.PositionRepository, companyRepo repository.CompanyRepository) PositionService {
	return &positionService{
		posRepo:     posRepo,
		companyRepo: companyRepo,
	}
}

func (s *positionService) GetAll() ([]dto.PositionResponse, error) {
	positions, err := s.posRepo.FindAll()
	if err != nil {
		return nil, err
	}
	return dto.ToPositionResponses(positions), nil
}

func (s *positionService) GetByID(id string) (*dto.PositionResponse, error) {
	pos, err := s.posRepo.FindByID(id)
	if err != nil {
		return nil, errors.New("position not found")
	}
	response := dto.ToPositionResponse(pos)
	return &response, nil
}

func (s *positionService) GetByCompanyID(companyID string) ([]dto.PositionResponse, error) {
	positions, err := s.posRepo.FindByCompanyID(companyID)
	if err != nil {
		return nil, err
	}
	return dto.ToPositionResponses(positions), nil
}

func (s *positionService) Create(req dto.CreatePositionRequest) (*dto.PositionResponse, error) {
	// Validate company exists
	_, err := s.companyRepo.FindByID(req.CompanyID)
	if err != nil {
		return nil, errors.New("company not found")
	}

	pos := &model.Position{
		CompanyID:  req.CompanyID,
		Name:       req.Name,
		BaseSalary: req.BaseSalary,
		IsActive:   true,
	}

	if err := s.posRepo.Create(pos); err != nil {
		return nil, errors.New("failed to create position")
	}

	// Reload with company preloaded
	created, err := s.posRepo.FindByID(pos.ID)
	if err != nil {
		return nil, errors.New("failed to load position")
	}

	response := dto.ToPositionResponse(created)
	return &response, nil
}

func (s *positionService) Update(id string, req dto.UpdatePositionRequest) (*dto.PositionResponse, error) {
	pos, err := s.posRepo.FindByID(id)
	if err != nil {
		return nil, errors.New("position not found")
	}

	if req.Name != "" {
		pos.Name = req.Name
	}
	if req.BaseSalary != nil {
		pos.BaseSalary = *req.BaseSalary
	}
	if req.IsActive != nil {
		pos.IsActive = *req.IsActive
	}

	if err := s.posRepo.Update(pos); err != nil {
		return nil, errors.New("failed to update position")
	}

	response := dto.ToPositionResponse(pos)
	return &response, nil
}

func (s *positionService) Delete(id string) error {
	_, err := s.posRepo.FindByID(id)
	if err != nil {
		return errors.New("position not found")
	}
	return s.posRepo.Delete(id)
}
