package service

import (
	"errors"
	"time"

	"hris-backend/internal/dto"
	"hris-backend/internal/model"
	"hris-backend/internal/repository"
)

type LeaveService interface {
	GetAll() ([]dto.LeaveResponse, error)
	GetByID(id string) (*dto.LeaveResponse, error)
	GetByEmployeeID(employeeID string) ([]dto.LeaveResponse, error)
	GetPending() ([]dto.LeaveResponse, error)
	Create(req dto.CreateLeaveRequest) (*dto.LeaveResponse, error)
	Update(id string, req dto.UpdateLeaveRequest) (*dto.LeaveResponse, error)
	Approve(id string, approverID string, req dto.ApproveLeaveRequest) (*dto.LeaveResponse, error)
	Delete(id string) error
}

type leaveService struct {
	leaveRepo repository.LeaveRepository
	empRepo   repository.EmployeeRepository
}

func NewLeaveService(leaveRepo repository.LeaveRepository, empRepo repository.EmployeeRepository) LeaveService {
	return &leaveService{
		leaveRepo: leaveRepo,
		empRepo:   empRepo,
	}
}

func (s *leaveService) GetAll() ([]dto.LeaveResponse, error) {
	leaves, err := s.leaveRepo.FindAll()
	if err != nil {
		return nil, err
	}
	return dto.ToLeaveResponses(leaves), nil
}

func (s *leaveService) GetByID(id string) (*dto.LeaveResponse, error) {
	leave, err := s.leaveRepo.FindByID(id)
	if err != nil {
		return nil, errors.New("leave not found")
	}
	response := dto.ToLeaveResponse(leave)
	return &response, nil
}

func (s *leaveService) GetByEmployeeID(employeeID string) ([]dto.LeaveResponse, error) {
	leaves, err := s.leaveRepo.FindByEmployeeID(employeeID)
	if err != nil {
		return nil, err
	}
	return dto.ToLeaveResponses(leaves), nil
}

func (s *leaveService) GetPending() ([]dto.LeaveResponse, error) {
	leaves, err := s.leaveRepo.FindByStatus(model.LeaveStatusPending)
	if err != nil {
		return nil, err
	}
	return dto.ToLeaveResponses(leaves), nil
}

func (s *leaveService) Create(req dto.CreateLeaveRequest) (*dto.LeaveResponse, error) {
	_, err := s.empRepo.FindByID(req.EmployeeID)
	if err != nil {
		return nil, errors.New("employee not found")
	}

	startDate, err := time.Parse("2006-01-02", req.StartDate)
	if err != nil {
		return nil, errors.New("invalid start date format, use YYYY-MM-DD")
	}

	endDate, err := time.Parse("2006-01-02", req.EndDate)
	if err != nil {
		return nil, errors.New("invalid end date format, use YYYY-MM-DD")
	}

	if endDate.Before(startDate) {
		return nil, errors.New("end date must be after start date")
	}

	leave := &model.Leave{
		EmployeeID: req.EmployeeID,
		LeaveType:  req.LeaveType,
		StartDate:  startDate,
		EndDate:    endDate,
		TotalDays:  req.TotalDays,
		Reason:     req.Reason,
		Attachment: req.Attachment,
		Status:     model.LeaveStatusPending,
	}

	if err := s.leaveRepo.Create(leave); err != nil {
		return nil, errors.New("failed to create leave request")
	}

	created, err := s.leaveRepo.FindByID(leave.ID)
	if err != nil {
		return nil, errors.New("failed to load leave request")
	}

	response := dto.ToLeaveResponse(created)
	return &response, nil
}

func (s *leaveService) Update(id string, req dto.UpdateLeaveRequest) (*dto.LeaveResponse, error) {
	leave, err := s.leaveRepo.FindByID(id)
	if err != nil {
		return nil, errors.New("leave not found")
	}

	if leave.Status != model.LeaveStatusPending {
		return nil, errors.New("can only update pending leave requests")
	}

	if req.LeaveType != "" {
		leave.LeaveType = req.LeaveType
	}
	if req.StartDate != "" {
		sd, err := time.Parse("2006-01-02", req.StartDate)
		if err != nil {
			return nil, errors.New("invalid start date format, use YYYY-MM-DD")
		}
		leave.StartDate = sd
	}
	if req.EndDate != "" {
		ed, err := time.Parse("2006-01-02", req.EndDate)
		if err != nil {
			return nil, errors.New("invalid end date format, use YYYY-MM-DD")
		}
		leave.EndDate = ed
	}
	if req.TotalDays != nil {
		leave.TotalDays = *req.TotalDays
	}
	if req.Reason != "" {
		leave.Reason = req.Reason
	}
	if req.Attachment != "" {
		leave.Attachment = req.Attachment
	}

	if leave.EndDate.Before(leave.StartDate) {
		return nil, errors.New("end date must be after start date")
	}

	if err := s.leaveRepo.Update(leave); err != nil {
		return nil, errors.New("failed to update leave request")
	}

	response := dto.ToLeaveResponse(leave)
	return &response, nil
}

func (s *leaveService) Approve(id string, approverID string, req dto.ApproveLeaveRequest) (*dto.LeaveResponse, error) {
	leave, err := s.leaveRepo.FindByID(id)
	if err != nil {
		return nil, errors.New("leave not found")
	}

	if leave.Status != model.LeaveStatusPending {
		return nil, errors.New("can only approve/reject pending leave requests")
	}

	if req.Status != model.LeaveStatusApproved && req.Status != model.LeaveStatusRejected {
		return nil, errors.New("status must be approved or rejected")
	}

	now := time.Now()
	leave.Status = req.Status
	leave.ApprovedBy = approverID
	leave.ApprovedAt = &now

	if req.Status == model.LeaveStatusRejected {
		if req.RejectionReason == "" {
			return nil, errors.New("rejection reason is required")
		}
		leave.RejectionReason = req.RejectionReason
	}

	if err := s.leaveRepo.Update(leave); err != nil {
		return nil, errors.New("failed to update leave status")
	}

	// Reload with relations
	updated, err := s.leaveRepo.FindByID(leave.ID)
	if err != nil {
		return nil, errors.New("failed to load leave request")
	}

	response := dto.ToLeaveResponse(updated)
	return &response, nil
}

func (s *leaveService) Delete(id string) error {
	leave, err := s.leaveRepo.FindByID(id)
	if err != nil {
		return errors.New("leave not found")
	}

	if leave.Status != model.LeaveStatusPending {
		return errors.New("can only delete pending leave requests")
	}

	return s.leaveRepo.Delete(id)
}
