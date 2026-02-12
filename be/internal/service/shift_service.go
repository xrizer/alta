package service

import (
	"errors"

	"hris-backend/internal/dto"
	"hris-backend/internal/model"
	"hris-backend/internal/repository"
)

type ShiftService interface {
	GetAll() ([]dto.ShiftResponse, error)
	GetByID(id string) (*dto.ShiftResponse, error)
	GetByCompanyID(companyID string) ([]dto.ShiftResponse, error)
	Create(req dto.CreateShiftRequest) (*dto.ShiftResponse, error)
	Update(id string, req dto.UpdateShiftRequest) (*dto.ShiftResponse, error)
	Delete(id string) error
}

type shiftService struct {
	shiftRepo   repository.ShiftRepository
	companyRepo repository.CompanyRepository
}

func NewShiftService(shiftRepo repository.ShiftRepository, companyRepo repository.CompanyRepository) ShiftService {
	return &shiftService{
		shiftRepo:   shiftRepo,
		companyRepo: companyRepo,
	}
}

func (s *shiftService) GetAll() ([]dto.ShiftResponse, error) {
	shifts, err := s.shiftRepo.FindAll()
	if err != nil {
		return nil, err
	}
	return dto.ToShiftResponses(shifts), nil
}

func (s *shiftService) GetByID(id string) (*dto.ShiftResponse, error) {
	shift, err := s.shiftRepo.FindByID(id)
	if err != nil {
		return nil, errors.New("shift not found")
	}
	response := dto.ToShiftResponse(shift)
	return &response, nil
}

func (s *shiftService) GetByCompanyID(companyID string) ([]dto.ShiftResponse, error) {
	shifts, err := s.shiftRepo.FindByCompanyID(companyID)
	if err != nil {
		return nil, err
	}
	return dto.ToShiftResponses(shifts), nil
}

func (s *shiftService) Create(req dto.CreateShiftRequest) (*dto.ShiftResponse, error) {
	// Validate company exists
	_, err := s.companyRepo.FindByID(req.CompanyID)
	if err != nil {
		return nil, errors.New("company not found")
	}

	shift := &model.Shift{
		CompanyID: req.CompanyID,
		Name:      req.Name,
		StartTime: req.StartTime,
		EndTime:   req.EndTime,
		IsActive:  true,
	}

	if err := s.shiftRepo.Create(shift); err != nil {
		return nil, errors.New("failed to create shift")
	}

	// Reload with company preloaded
	created, err := s.shiftRepo.FindByID(shift.ID)
	if err != nil {
		return nil, errors.New("failed to load shift")
	}

	response := dto.ToShiftResponse(created)
	return &response, nil
}

func (s *shiftService) Update(id string, req dto.UpdateShiftRequest) (*dto.ShiftResponse, error) {
	shift, err := s.shiftRepo.FindByID(id)
	if err != nil {
		return nil, errors.New("shift not found")
	}

	if req.Name != "" {
		shift.Name = req.Name
	}
	if req.StartTime != "" {
		shift.StartTime = req.StartTime
	}
	if req.EndTime != "" {
		shift.EndTime = req.EndTime
	}
	if req.IsActive != nil {
		shift.IsActive = *req.IsActive
	}

	if err := s.shiftRepo.Update(shift); err != nil {
		return nil, errors.New("failed to update shift")
	}

	response := dto.ToShiftResponse(shift)
	return &response, nil
}

func (s *shiftService) Delete(id string) error {
	_, err := s.shiftRepo.FindByID(id)
	if err != nil {
		return errors.New("shift not found")
	}
	return s.shiftRepo.Delete(id)
}
