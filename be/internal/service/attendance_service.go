package service

import (
	"errors"
	"fmt"
	"time"

	"hris-backend/internal/dto"
	"hris-backend/internal/model"
	"hris-backend/internal/repository"
)

type AttendanceService interface {
	GetAll() ([]dto.AttendanceResponse, error)
	GetAllPaginated(page, limit int, employeeID string, month, year int, startDate, endDate string) (*dto.PaginatedAttendanceResponse, error)
	GetByID(id string) (*dto.AttendanceResponse, error)
	GetByEmployeeID(employeeID string) ([]dto.AttendanceResponse, error)
	GetByEmployeeIDAndMonth(employeeID string, month, year int) ([]dto.AttendanceResponse, error)
	GetByMonth(month, year int) ([]dto.AttendanceResponse, error)
	ClockIn(req dto.ClockInRequest) (*dto.AttendanceResponse, error)
	ClockOut(id string, req dto.ClockOutRequest) (*dto.AttendanceResponse, error)
	Create(req dto.CreateAttendanceRequest) (*dto.AttendanceResponse, error)
	Update(id string, req dto.UpdateAttendanceRequest) (*dto.AttendanceResponse, error)
	Delete(id string) error
}

type attendanceService struct {
	attRepo   repository.AttendanceRepository
	empRepo   repository.EmployeeRepository
	shiftRepo repository.ShiftRepository
}

func NewAttendanceService(attRepo repository.AttendanceRepository, empRepo repository.EmployeeRepository, shiftRepo repository.ShiftRepository) AttendanceService {
	return &attendanceService{
		attRepo:   attRepo,
		empRepo:   empRepo,
		shiftRepo: shiftRepo,
	}
}

// calculateAttendanceStatus determines the status based on clock-in time and shift start time
func calculateAttendanceStatus(clockIn time.Time, shiftStartTime string) (model.AttendanceStatus, error) {
	// Parse shift start time (format: "HH:MM" or "HH:MM:SS")
	var hour, minute int
	_, err := fmt.Sscanf(shiftStartTime, "%d:%d", &hour, &minute)
	if err != nil {
		return model.AttendanceHadir, err
	}

	// Create the expected shift start time on the same date as clock-in
	shiftStart := time.Date(
		clockIn.Year(),
		clockIn.Month(),
		clockIn.Day(),
		hour,
		minute,
		0,
		0,
		clockIn.Location(),
	)

	// Calculate the difference in minutes
	diff := clockIn.Sub(shiftStart).Minutes()

	// Grace period: 5 minutes before or after shift start is considered "on time"
	const gracePeriod = 5.0

	if diff < -gracePeriod {
		// Clocked in more than 5 minutes early
		return model.AttendanceEarlyIn, nil
	} else if diff <= gracePeriod {
		// Clocked in within grace period (5 minutes before to 5 minutes after)
		return model.AttendanceOnTime, nil
	} else {
		// Clocked in more than 5 minutes late
		return model.AttendanceLateIn, nil
	}
}

func (s *attendanceService) GetAll() ([]dto.AttendanceResponse, error) {
	attendances, err := s.attRepo.FindAll()
	if err != nil {
		return nil, err
	}
	return dto.ToAttendanceResponses(attendances), nil
}

func (s *attendanceService) GetAllPaginated(page, limit int, employeeID string, month, year int, startDate, endDate string) (*dto.PaginatedAttendanceResponse, error) {
	attendances, total, err := s.attRepo.FindAllPaginated(page, limit, employeeID, month, year, startDate, endDate)
	if err != nil {
		return nil, err
	}

	totalPages := int(total) / limit
	if int(total)%limit > 0 {
		totalPages++
	}

	return &dto.PaginatedAttendanceResponse{
		Data:       dto.ToAttendanceResponses(attendances),
		Page:       page,
		Limit:      limit,
		TotalItems: total,
		TotalPages: totalPages,
	}, nil
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

func (s *attendanceService) GetByMonth(month, year int) ([]dto.AttendanceResponse, error) {
	attendances, err := s.attRepo.FindByMonth(month, year)
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

	// Get employee's shift to determine expected start time
	shift, err := s.shiftRepo.FindByID(emp.ShiftID)
	if err != nil {
		return nil, errors.New("shift not found for employee")
	}

	now := time.Now()

	// Calculate attendance status based on clock-in time vs shift start time
	status, err := calculateAttendanceStatus(now, shift.StartTime)
	if err != nil {
		// If there's an error parsing shift time, default to "hadir"
		status = model.AttendanceHadir
	}

	att := &model.Attendance{
		EmployeeID: req.EmployeeID,
		ShiftID:    emp.ShiftID,
		Date:       today,
		ClockIn:    &now,
		Status:     status,
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
