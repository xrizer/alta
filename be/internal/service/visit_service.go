package service

import (
	"errors"
	"strings"
	"time"

	"hris-backend/internal/dto"
	"hris-backend/internal/model"
	"hris-backend/internal/repository"
)

type VisitService interface {
	Start(employeeID string, req dto.StartVisitRequest) (*dto.VisitResponse, error)
	End(id string, actorEmployeeID string, req dto.EndVisitRequest) (*dto.VisitResponse, error)
	GetByID(id string) (*dto.VisitResponse, error)
	GetByAttendanceID(attendanceID string) ([]dto.VisitResponse, error)
	List(page, limit int, employeeID, companyID string, from, to *time.Time) (*dto.PaginatedVisitResponse, error)
	Delete(id string) error
}

type visitService struct {
	repo    repository.VisitRepository
	attRepo repository.AttendanceRepository
	empRepo repository.EmployeeRepository
}

func NewVisitService(repo repository.VisitRepository, attRepo repository.AttendanceRepository, empRepo repository.EmployeeRepository) VisitService {
	return &visitService{repo, attRepo, empRepo}
}

func (s *visitService) Start(employeeID string, req dto.StartVisitRequest) (*dto.VisitResponse, error) {
	// Validate attendance exists and belongs to the acting employee
	att, err := s.attRepo.FindByID(req.AttendanceID)
	if err != nil {
		return nil, errors.New("attendance not found")
	}
	if att.EmployeeID != employeeID {
		return nil, errors.New("attendance does not belong to employee")
	}
	if att.ClockIn == nil {
		return nil, errors.New("cannot start visit before clock in")
	}
	if att.ClockOut != nil {
		return nil, errors.New("cannot start visit after clock out")
	}

	// Derive company_id from the employee
	emp, err := s.empRepo.FindByID(employeeID)
	if err != nil {
		return nil, errors.New("employee not found")
	}

	v := &model.Visit{
		AttendanceID:    req.AttendanceID,
		EmployeeID:      employeeID,
		CompanyID:       emp.CompanyID,
		Location:        req.Location,
		SubLocation:     req.SubLocation,
		Purpose:         req.Purpose,
		ArrivedAt:       time.Now(),
		Lat:             req.Lat,
		Lng:             req.Lng,
		Photos:          strings.Join(req.Photos, ","),
		VisitPlanItemID: req.VisitPlanItemID,
	}
	if err := s.repo.Create(v); err != nil {
		return nil, errors.New("failed to create visit")
	}
	resp := dto.ToVisitResponse(v)
	return &resp, nil
}

func (s *visitService) End(id string, actorEmployeeID string, req dto.EndVisitRequest) (*dto.VisitResponse, error) {
	v, err := s.repo.FindByID(id)
	if err != nil {
		return nil, errors.New("visit not found")
	}
	if v.EmployeeID != actorEmployeeID {
		return nil, errors.New("visit does not belong to employee")
	}
	if v.LeftAt != nil {
		return nil, errors.New("visit already ended")
	}

	now := time.Now()
	v.LeftAt = &now
	if req.ResultNotes != "" {
		v.ResultNotes = req.ResultNotes
	}
	if len(req.Photos) > 0 {
		if v.Photos != "" {
			v.Photos = v.Photos + "," + strings.Join(req.Photos, ",")
		} else {
			v.Photos = strings.Join(req.Photos, ",")
		}
	}

	if err := s.repo.Update(v); err != nil {
		return nil, errors.New("failed to end visit")
	}
	resp := dto.ToVisitResponse(v)
	return &resp, nil
}

func (s *visitService) GetByID(id string) (*dto.VisitResponse, error) {
	v, err := s.repo.FindByID(id)
	if err != nil {
		return nil, errors.New("visit not found")
	}
	resp := dto.ToVisitResponse(v)
	return &resp, nil
}

func (s *visitService) GetByAttendanceID(attendanceID string) ([]dto.VisitResponse, error) {
	vs, err := s.repo.FindByAttendanceID(attendanceID)
	if err != nil {
		return nil, err
	}
	return dto.ToVisitResponses(vs), nil
}

func (s *visitService) List(page, limit int, employeeID, companyID string, from, to *time.Time) (*dto.PaginatedVisitResponse, error) {
	rows, total, err := s.repo.FindPaginated(page, limit, employeeID, companyID, from, to)
	if err != nil {
		return nil, err
	}
	pages := int(total) / limit
	if int(total)%limit > 0 {
		pages++
	}
	return &dto.PaginatedVisitResponse{
		Data:       dto.ToVisitResponses(rows),
		Page:       page,
		Limit:      limit,
		TotalItems: total,
		TotalPages: pages,
	}, nil
}

func (s *visitService) Delete(id string) error {
	_, err := s.repo.FindByID(id)
	if err != nil {
		return errors.New("visit not found")
	}
	return s.repo.Delete(id)
}
