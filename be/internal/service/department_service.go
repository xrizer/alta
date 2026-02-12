package service

import (
	"errors"

	"hris-backend/internal/dto"
	"hris-backend/internal/model"
	"hris-backend/internal/repository"
)

type DepartmentService interface {
	GetAll() ([]dto.DepartmentResponse, error)
	GetByID(id string) (*dto.DepartmentResponse, error)
	GetByCompanyID(companyID string) ([]dto.DepartmentResponse, error)
	Create(req dto.CreateDepartmentRequest) (*dto.DepartmentResponse, error)
	Update(id string, req dto.UpdateDepartmentRequest) (*dto.DepartmentResponse, error)
	Delete(id string) error
}

type departmentService struct {
	deptRepo    repository.DepartmentRepository
	companyRepo repository.CompanyRepository
}

func NewDepartmentService(deptRepo repository.DepartmentRepository, companyRepo repository.CompanyRepository) DepartmentService {
	return &departmentService{
		deptRepo:    deptRepo,
		companyRepo: companyRepo,
	}
}

func (s *departmentService) GetAll() ([]dto.DepartmentResponse, error) {
	depts, err := s.deptRepo.FindAll()
	if err != nil {
		return nil, err
	}
	return dto.ToDepartmentResponses(depts), nil
}

func (s *departmentService) GetByID(id string) (*dto.DepartmentResponse, error) {
	dept, err := s.deptRepo.FindByID(id)
	if err != nil {
		return nil, errors.New("department not found")
	}
	response := dto.ToDepartmentResponse(dept)
	return &response, nil
}

func (s *departmentService) GetByCompanyID(companyID string) ([]dto.DepartmentResponse, error) {
	depts, err := s.deptRepo.FindByCompanyID(companyID)
	if err != nil {
		return nil, err
	}
	return dto.ToDepartmentResponses(depts), nil
}

func (s *departmentService) Create(req dto.CreateDepartmentRequest) (*dto.DepartmentResponse, error) {
	// Validate company exists
	_, err := s.companyRepo.FindByID(req.CompanyID)
	if err != nil {
		return nil, errors.New("company not found")
	}

	dept := &model.Department{
		CompanyID:   req.CompanyID,
		Name:        req.Name,
		Description: req.Description,
		IsActive:    true,
	}

	if err := s.deptRepo.Create(dept); err != nil {
		return nil, errors.New("failed to create department")
	}

	// Reload with company preloaded
	created, err := s.deptRepo.FindByID(dept.ID)
	if err != nil {
		return nil, errors.New("failed to load department")
	}

	response := dto.ToDepartmentResponse(created)
	return &response, nil
}

func (s *departmentService) Update(id string, req dto.UpdateDepartmentRequest) (*dto.DepartmentResponse, error) {
	dept, err := s.deptRepo.FindByID(id)
	if err != nil {
		return nil, errors.New("department not found")
	}

	if req.Name != "" {
		dept.Name = req.Name
	}
	if req.Description != "" {
		dept.Description = req.Description
	}
	if req.IsActive != nil {
		dept.IsActive = *req.IsActive
	}

	if err := s.deptRepo.Update(dept); err != nil {
		return nil, errors.New("failed to update department")
	}

	response := dto.ToDepartmentResponse(dept)
	return &response, nil
}

func (s *departmentService) Delete(id string) error {
	_, err := s.deptRepo.FindByID(id)
	if err != nil {
		return errors.New("department not found")
	}
	return s.deptRepo.Delete(id)
}
