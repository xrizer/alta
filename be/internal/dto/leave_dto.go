package dto

import "hris-backend/internal/model"

type CreateLeaveRequest struct {
	EmployeeID string          `json:"employee_id" validate:"required"`
	LeaveType  model.LeaveType `json:"leave_type" validate:"required"`
	StartDate  string          `json:"start_date" validate:"required"`
	EndDate    string          `json:"end_date" validate:"required"`
	TotalDays  int             `json:"total_days" validate:"required"`
	Reason     string          `json:"reason" validate:"required"`
	Attachment string          `json:"attachment"`
}

type UpdateLeaveRequest struct {
	LeaveType  model.LeaveType `json:"leave_type"`
	StartDate  string          `json:"start_date"`
	EndDate    string          `json:"end_date"`
	TotalDays  *int            `json:"total_days"`
	Reason     string          `json:"reason"`
	Attachment string          `json:"attachment"`
}

type ApproveLeaveRequest struct {
	Status          model.LeaveStatus `json:"status" validate:"required"`
	RejectionReason string            `json:"rejection_reason"`
}

type LeaveResponse struct {
	ID              string            `json:"id"`
	EmployeeID      string            `json:"employee_id"`
	Employee        *EmployeeResponse `json:"employee,omitempty"`
	LeaveType       model.LeaveType   `json:"leave_type"`
	StartDate       string            `json:"start_date"`
	EndDate         string            `json:"end_date"`
	TotalDays       int               `json:"total_days"`
	Reason          string            `json:"reason"`
	Attachment      string            `json:"attachment"`
	Status          model.LeaveStatus `json:"status"`
	ApprovedBy      string            `json:"approved_by"`
	Approver        *UserResponse     `json:"approver,omitempty"`
	ApprovedAt      string            `json:"approved_at"`
	RejectionReason string            `json:"rejection_reason"`
	CreatedAt       string            `json:"created_at"`
	UpdatedAt       string            `json:"updated_at"`
}

func ToLeaveResponse(l *model.Leave) LeaveResponse {
	resp := LeaveResponse{
		ID:              l.ID,
		EmployeeID:      l.EmployeeID,
		LeaveType:       l.LeaveType,
		StartDate:       l.StartDate.Format("2006-01-02"),
		EndDate:         l.EndDate.Format("2006-01-02"),
		TotalDays:       l.TotalDays,
		Reason:          l.Reason,
		Attachment:      l.Attachment,
		Status:          l.Status,
		RejectionReason: l.RejectionReason,
		CreatedAt:       l.CreatedAt.Format("2006-01-02T15:04:05Z"),
		UpdatedAt:       l.UpdatedAt.Format("2006-01-02T15:04:05Z"),
	}

	if l.ApprovedBy != nil {
		resp.ApprovedBy = *l.ApprovedBy
	}
	if l.ApprovedAt != nil {
		resp.ApprovedAt = l.ApprovedAt.Format("2006-01-02T15:04:05Z")
	}

	if l.Employee.ID != "" {
		empResp := ToEmployeeResponse(&l.Employee)
		resp.Employee = &empResp
	}
	if l.Approver != nil && l.Approver.ID != "" {
		approverResp := ToUserResponse(l.Approver)
		resp.Approver = &approverResp
	}

	return resp
}

func ToLeaveResponses(leaves []model.Leave) []LeaveResponse {
	responses := make([]LeaveResponse, len(leaves))
	for i, l := range leaves {
		responses[i] = ToLeaveResponse(&l)
	}
	return responses
}
