package service

import (
	"errors"
	"time"

	"hris-backend/internal/dto"
	"hris-backend/internal/model"
	"hris-backend/internal/repository"
)

type AttendanceService interface {
	GetAll() ([]dto.AttendanceResponse, error)
	GetByID(id string) (*dto.AttendanceResponse, error)
	GetByEmployeeID(employeeID string) ([]dto.AttendanceResponse, error)
	GetByEmployeeIDAndMonth(employeeID string, month, year int) ([]dto.AttendanceResponse, error)
	ClockIn(req dto.ClockInRequest) (*dto.AttendanceResponse, error)
	ClockOut(id string, req dto.ClockOutRequest) (*dto.AttendanceResponse, error)
	Create(req dto.CreateAttendanceRequest) (*dto.AttendanceResponse, error)
	Update(id string, req dto.UpdateAttendanceRequest) (*dto.AttendanceResponse, error)
	Delete(id string) error
}

type attendanceService struct {
	attRepo repository.AttendanceRepository
	empRepo repository.EmployeeRepository
}

func NewAttendanceService(attRepo repository.AttendanceRepository, empRepo repository.EmployeeRepository) AttendanceService {
	return &attendanceService{
		attRepo: attRepo,
		empRepo: empRepo,
	}
}

func (s *attendanceService) GetAll() ([]dto.AttendanceResponse, error) {
	attendances, err := s.attRepo.FindAll()
	if err != nil {
		return nil, err
	}
	return dto.ToAttendanceResponses(attendances), nil
}

func (s *attendanceService) GetByID(id string) (*dto.AttendanceResponse, error) {
	att, err := s.attRepo.FindByID(id)
	if err != nil {
		return nil, errors.New("attendance not found")
	}
	response := dto.ToAttendanceResponse(att)
	return &response, nil
}

func (s *attendanceService) GetByEmployeeID(employeeID string) ([]dto.AttendanceResponse, error) {
	attendances, err := s.attRepo.FindByEmployeeID(employeeID)
	if err != nil {
		return nil, err
	}
	return dto.ToAttendanceResponses(attendances), nil
}

func (s *attendanceService) GetByEmployeeIDAndMonth(employeeID string, month, year int) ([]dto.AttendanceResponse, error) {
	attendances, err := s.attRepo.FindByEmployeeIDAndMonth(employeeID, month, year)
	if err != nil {
		return nil, err
	}
	return dto.ToAttendanceResponses(attendances), nil
}

func (s *attendanceService) ClockIn(req dto.ClockInRequest) (*dto.AttendanceResponse, error) {
	// Validate employee exists
	emp, err := s.empRepo.FindByID(req.EmployeeID)
	if err != nil {
		return nil, errors.New("employee not found")
	}

	today := time.Now().Truncate(24 * time.Hour)

	// Check if already clocked in today
	existing, _ := s.attRepo.FindByEmployeeIDAndDate(req.EmployeeID, today)
	if existing != nil {
		return nil, errors.New("already clocked in today")
	}

	now := time.Now()
	att := &model.Attendance{
		EmployeeID: req.EmployeeID,
		ShiftID:    emp.ShiftID,
		Date:       today,
		ClockIn:    &now,
		Status:     model.AttendanceHadir,
		Notes:      req.Notes,
	}

	if err := s.attRepo.Create(att); err != nil {
		return nil, errors.New("failed to clock in")
	}

	created, err := s.attRepo.FindByID(att.ID)
	if err != nil {
		return nil, errors.New("failed to load attendance")
	}

	response := dto.ToAttendanceResponse(created)
	return &response, nil
}

func (s *attendanceService) ClockOut(id string, req dto.ClockOutRequest) (*dto.AttendanceResponse, error) {
	att, err := s.attRepo.FindByID(id)
	if err != nil {
		return nil, errors.New("attendance not found")
	}

	if att.ClockOut != nil {
		return nil, errors.New("already clocked out")
	}

	if att.ClockIn == nil {
		return nil, errors.New("not clocked in yet")
	}

	now := time.Now()
	att.ClockOut = &now

	if req.Notes != "" {
		att.Notes = req.Notes
	}

	if err := s.attRepo.Update(att); err != nil {
		return nil, errors.New("failed to clock out")
	}

	response := dto.ToAttendanceResponse(att)
	return &response, nil
}

func (s *attendanceService) Create(req dto.CreateAttendanceRequest) (*dto.AttendanceResponse, error) {
	_, err := s.empRepo.FindByID(req.EmployeeID)
	if err != nil {
		return nil, errors.New("employee not found")
	}

	date, err := time.Parse("2006-01-02", req.Date)
	if err != nil {
		return nil, errors.New("invalid date format, use YYYY-MM-DD")
	}

	// Check for duplicate
	existing, _ := s.attRepo.FindByEmployeeIDAndDate(req.EmployeeID, date)
	if existing != nil {
		return nil, errors.New("attendance record already exists for this date")
	}

	att := &model.Attendance{
		EmployeeID:    req.EmployeeID,
		ShiftID:       req.ShiftID,
		Date:          date,
		Status:        req.Status,
		OvertimeHours: req.OvertimeHours,
		Notes:         req.Notes,
	}

	if req.ClockIn != "" {
		ci, err := time.Parse("2006-01-02T15:04:05Z", req.ClockIn)
		if err != nil {
			return nil, errors.New("invalid clock in format, use ISO 8601")
		}
		att.ClockIn = &ci
	}
	if req.ClockOut != "" {
		co, err := time.Parse("2006-01-02T15:04:05Z", req.ClockOut)
		if err != nil {
			return nil, errors.New("invalid clock out format, use ISO 8601")
		}
		att.ClockOut = &co
	}

	if err := s.attRepo.Create(att); err != nil {
		return nil, errors.New("failed to create attendance")
	}

	created, err := s.attRepo.FindByID(att.ID)
	if err != nil {
		return nil, errors.New("failed to load attendance")
	}

	response := dto.ToAttendanceResponse(created)
	return &response, nil
}

func (s *attendanceService) Update(id string, req dto.UpdateAttendanceRequest) (*dto.AttendanceResponse, error) {
	att, err := s.attRepo.FindByID(id)
	if err != nil {
		return nil, errors.New("attendance not found")
	}

	if req.ShiftID != "" {
		att.ShiftID = req.ShiftID
	}
	if req.ClockIn != "" {
		ci, err := time.Parse("2006-01-02T15:04:05Z", req.ClockIn)
		if err != nil {
			return nil, errors.New("invalid clock in format, use ISO 8601")
		}
		att.ClockIn = &ci
	}
	if req.ClockOut != "" {
		co, err := time.Parse("2006-01-02T15:04:05Z", req.ClockOut)
		if err != nil {
			return nil, errors.New("invalid clock out format, use ISO 8601")
		}
		att.ClockOut = &co
	}
	if req.Status != "" {
		att.Status = req.Status
	}
	if req.OvertimeHours != nil {
		att.OvertimeHours = *req.OvertimeHours
	}
	if req.Notes != "" {
		att.Notes = req.Notes
	}

	if err := s.attRepo.Update(att); err != nil {
		return nil, errors.New("failed to update attendance")
	}

	response := dto.ToAttendanceResponse(att)
	return &response, nil
}

func (s *attendanceService) Delete(id string) error {
	_, err := s.attRepo.FindByID(id)
	if err != nil {
		return errors.New("attendance not found")
	}
	return s.attRepo.Delete(id)
}
