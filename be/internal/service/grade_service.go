package service

import (
	"errors"

	"hris-backend/internal/dto"
	"hris-backend/internal/model"
	"hris-backend/internal/repository"
)

type GradeService interface {
	GetAll() ([]dto.GradeResponse, error)
	GetByID(id string) (*dto.GradeResponse, error)
	GetByCompanyID(companyID string) ([]dto.GradeResponse, error)
	GetByJobLevelID(jobLevelID string) ([]dto.GradeResponse, error)
	Create(req dto.CreateGradeRequest) (*dto.GradeResponse, error)
	Update(id string, req dto.UpdateGradeRequest) (*dto.GradeResponse, error)
	Delete(id string) error
}

type gradeService struct {
	gradeRepo    repository.GradeRepository
	jobLevelRepo repository.JobLevelRepository
	companyRepo  repository.CompanyRepository
}

func NewGradeService(gradeRepo repository.GradeRepository, jobLevelRepo repository.JobLevelRepository, companyRepo repository.CompanyRepository) GradeService {
	return &gradeService{gradeRepo: gradeRepo, jobLevelRepo: jobLevelRepo, companyRepo: companyRepo}
}

func (s *gradeService) GetAll() ([]dto.GradeResponse, error) {
	grades, err := s.gradeRepo.FindAll()
	if err != nil {
		return nil, err
	}
	return dto.ToGradeResponses(grades), nil
}

func (s *gradeService) GetByID(id string) (*dto.GradeResponse, error) {
	g, err := s.gradeRepo.FindByID(id)
	if err != nil {
		return nil, errors.New("grade not found")
	}
	resp := dto.ToGradeResponse(g)
	return &resp, nil
}

func (s *gradeService) GetByCompanyID(companyID string) ([]dto.GradeResponse, error) {
	grades, err := s.gradeRepo.FindByCompanyID(companyID)
	if err != nil {
		return nil, err
	}
	return dto.ToGradeResponses(grades), nil
}

func (s *gradeService) GetByJobLevelID(jobLevelID string) ([]dto.GradeResponse, error) {
	grades, err := s.gradeRepo.FindByJobLevelID(jobLevelID)
	if err != nil {
		return nil, err
	}
	return dto.ToGradeResponses(grades), nil
}

func (s *gradeService) Create(req dto.CreateGradeRequest) (*dto.GradeResponse, error) {
	if _, err := s.companyRepo.FindByID(req.CompanyID); err != nil {
		return nil, errors.New("company not found")
	}
	if _, err := s.jobLevelRepo.FindByID(req.JobLevelID); err != nil {
		return nil, errors.New("job level not found")
	}
	if req.MaxSalary > 0 && req.MinSalary > req.MaxSalary {
		return nil, errors.New("min salary cannot exceed max salary")
	}

	g := &model.Grade{
		CompanyID:   req.CompanyID,
		JobLevelID:  req.JobLevelID,
		Name:        req.Name,
		Description: req.Description,
		MinSalary:   req.MinSalary,
		MaxSalary:   req.MaxSalary,
		IsActive:    true,
	}

	if err := s.gradeRepo.Create(g); err != nil {
		return nil, errors.New("failed to create grade")
	}

	// Reload with JobLevel preloaded for the response
	created, _ := s.gradeRepo.FindByID(g.ID)
	resp := dto.ToGradeResponse(created)
	return &resp, nil
}

func (s *gradeService) Update(id string, req dto.UpdateGradeRequest) (*dto.GradeResponse, error) {
	g, err := s.gradeRepo.FindByID(id)
	if err != nil {
		return nil, errors.New("grade not found")
	}

	if req.JobLevelID != nil {
		if _, err := s.jobLevelRepo.FindByID(*req.JobLevelID); err != nil {
			return nil, errors.New("job level not found")
		}
		g.JobLevelID = *req.JobLevelID
	}
	if req.Name != nil {
		g.Name = *req.Name
	}
	if req.Description != nil {
		g.Description = *req.Description
	}
	if req.MinSalary != nil {
		g.MinSalary = *req.MinSalary
	}
	if req.MaxSalary != nil {
		g.MaxSalary = *req.MaxSalary
	}
	if req.IsActive != nil {
		g.IsActive = *req.IsActive
	}

	if g.MaxSalary > 0 && g.MinSalary > g.MaxSalary {
		return nil, errors.New("min salary cannot exceed max salary")
	}

	if err := s.gradeRepo.Update(g); err != nil {
		return nil, errors.New("failed to update grade")
	}

	// Reload for fresh JobLevel name
	updated, _ := s.gradeRepo.FindByID(g.ID)
	resp := dto.ToGradeResponse(updated)
	return &resp, nil
}

func (s *gradeService) Delete(id string) error {
	if _, err := s.gradeRepo.FindByID(id); err != nil {
		return errors.New("grade not found")
	}
	return s.gradeRepo.Delete(id)
}
