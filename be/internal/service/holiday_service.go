package service

import (
	"errors"
	"time"

	"hris-backend/internal/dto"
	"hris-backend/internal/model"
	"hris-backend/internal/repository"
)

type HolidayService interface {
	GetAll() ([]dto.HolidayResponse, error)
	GetByID(id string) (*dto.HolidayResponse, error)
	GetByCompanyID(companyID string) ([]dto.HolidayResponse, error)
	GetByCompanyIDAndYear(companyID string, year int) ([]dto.HolidayResponse, error)
	Create(req dto.CreateHolidayRequest) (*dto.HolidayResponse, error)
	Update(id string, req dto.UpdateHolidayRequest) (*dto.HolidayResponse, error)
	Delete(id string) error
}

type holidayService struct {
	holidayRepo repository.HolidayRepository
	companyRepo repository.CompanyRepository
}

func NewHolidayService(holidayRepo repository.HolidayRepository, companyRepo repository.CompanyRepository) HolidayService {
	return &holidayService{
		holidayRepo: holidayRepo,
		companyRepo: companyRepo,
	}
}

func (s *holidayService) GetAll() ([]dto.HolidayResponse, error) {
	holidays, err := s.holidayRepo.FindAll()
	if err != nil {
		return nil, err
	}
	return dto.ToHolidayResponses(holidays), nil
}

func (s *holidayService) GetByID(id string) (*dto.HolidayResponse, error) {
	holiday, err := s.holidayRepo.FindByID(id)
	if err != nil {
		return nil, errors.New("holiday not found")
	}
	response := dto.ToHolidayResponse(holiday)
	return &response, nil
}

func (s *holidayService) GetByCompanyID(companyID string) ([]dto.HolidayResponse, error) {
	holidays, err := s.holidayRepo.FindByCompanyID(companyID)
	if err != nil {
		return nil, err
	}
	return dto.ToHolidayResponses(holidays), nil
}

func (s *holidayService) GetByCompanyIDAndYear(companyID string, year int) ([]dto.HolidayResponse, error) {
	holidays, err := s.holidayRepo.FindByCompanyIDAndYear(companyID, year)
	if err != nil {
		return nil, err
	}
	return dto.ToHolidayResponses(holidays), nil
}

func (s *holidayService) Create(req dto.CreateHolidayRequest) (*dto.HolidayResponse, error) {
	_, err := s.companyRepo.FindByID(req.CompanyID)
	if err != nil {
		return nil, errors.New("company not found")
	}

	date, err := time.Parse("2006-01-02", req.Date)
	if err != nil {
		return nil, errors.New("invalid date format, use YYYY-MM-DD")
	}

	holiday := &model.Holiday{
		CompanyID:  req.CompanyID,
		Name:       req.Name,
		Date:       date,
		IsNational: true,
	}

	if req.IsNational != nil {
		holiday.IsNational = *req.IsNational
	}

	if err := s.holidayRepo.Create(holiday); err != nil {
		return nil, errors.New("failed to create holiday")
	}

	created, err := s.holidayRepo.FindByID(holiday.ID)
	if err != nil {
		return nil, errors.New("failed to load holiday")
	}

	response := dto.ToHolidayResponse(created)
	return &response, nil
}

func (s *holidayService) Update(id string, req dto.UpdateHolidayRequest) (*dto.HolidayResponse, error) {
	holiday, err := s.holidayRepo.FindByID(id)
	if err != nil {
		return nil, errors.New("holiday not found")
	}

	if req.Name != "" {
		holiday.Name = req.Name
	}
	if req.Date != "" {
		date, err := time.Parse("2006-01-02", req.Date)
		if err != nil {
			return nil, errors.New("invalid date format, use YYYY-MM-DD")
		}
		holiday.Date = date
	}
	if req.IsNational != nil {
		holiday.IsNational = *req.IsNational
	}

	if err := s.holidayRepo.Update(holiday); err != nil {
		return nil, errors.New("failed to update holiday")
	}

	response := dto.ToHolidayResponse(holiday)
	return &response, nil
}

func (s *holidayService) Delete(id string) error {
	_, err := s.holidayRepo.FindByID(id)
	if err != nil {
		return errors.New("holiday not found")
	}
	return s.holidayRepo.Delete(id)
}
