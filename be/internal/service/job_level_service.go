package service

import (
	"errors"

	"hris-backend/internal/dto"
	"hris-backend/internal/model"
	"hris-backend/internal/repository"
)

type JobLevelService interface {
	GetAll() ([]dto.JobLevelResponse, error)
	GetByID(id string) (*dto.JobLevelResponse, error)
	GetByCompanyID(companyID string) ([]dto.JobLevelResponse, error)
	Create(req dto.CreateJobLevelRequest) (*dto.JobLevelResponse, error)
	Update(id string, req dto.UpdateJobLevelRequest) (*dto.JobLevelResponse, error)
	Delete(id string) error
}

type jobLevelService struct {
	jobLevelRepo repository.JobLevelRepository
	companyRepo  repository.CompanyRepository
}

func NewJobLevelService(jobLevelRepo repository.JobLevelRepository, companyRepo repository.CompanyRepository) JobLevelService {
	return &jobLevelService{jobLevelRepo: jobLevelRepo, companyRepo: companyRepo}
}

func (s *jobLevelService) GetAll() ([]dto.JobLevelResponse, error) {
	levels, err := s.jobLevelRepo.FindAll()
	if err != nil {
		return nil, err
	}
	return dto.ToJobLevelResponses(levels), nil
}

func (s *jobLevelService) GetByID(id string) (*dto.JobLevelResponse, error) {
	jl, err := s.jobLevelRepo.FindByID(id)
	if err != nil {
		return nil, errors.New("job level not found")
	}
	resp := dto.ToJobLevelResponse(jl)
	return &resp, nil
}

func (s *jobLevelService) GetByCompanyID(companyID string) ([]dto.JobLevelResponse, error) {
	levels, err := s.jobLevelRepo.FindByCompanyID(companyID)
	if err != nil {
		return nil, err
	}
	return dto.ToJobLevelResponses(levels), nil
}

func (s *jobLevelService) Create(req dto.CreateJobLevelRequest) (*dto.JobLevelResponse, error) {
	if _, err := s.companyRepo.FindByID(req.CompanyID); err != nil {
		return nil, errors.New("company not found")
	}

	jl := &model.JobLevel{
		CompanyID:   req.CompanyID,
		Name:        req.Name,
		Description: req.Description,
		LevelOrder:  req.LevelOrder,
		IsActive:    true,
	}

	if err := s.jobLevelRepo.Create(jl); err != nil {
		return nil, errors.New("failed to create job level")
	}

	resp := dto.ToJobLevelResponse(jl)
	return &resp, nil
}

func (s *jobLevelService) Update(id string, req dto.UpdateJobLevelRequest) (*dto.JobLevelResponse, error) {
	jl, err := s.jobLevelRepo.FindByID(id)
	if err != nil {
		return nil, errors.New("job level not found")
	}

	if req.Name != nil {
		jl.Name = *req.Name
	}
	if req.Description != nil {
		jl.Description = *req.Description
	}
	if req.LevelOrder != nil {
		jl.LevelOrder = *req.LevelOrder
	}
	if req.IsActive != nil {
		jl.IsActive = *req.IsActive
	}

	if err := s.jobLevelRepo.Update(jl); err != nil {
		return nil, errors.New("failed to update job level")
	}

	resp := dto.ToJobLevelResponse(jl)
	return &resp, nil
}

func (s *jobLevelService) Delete(id string) error {
	if _, err := s.jobLevelRepo.FindByID(id); err != nil {
		return errors.New("job level not found")
	}
	return s.jobLevelRepo.Delete(id)
}
