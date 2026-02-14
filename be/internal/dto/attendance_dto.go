package dto

import "hris-backend/internal/model"

type ClockInRequest struct {
	EmployeeID string `json:"employee_id" validate:"required"`
	Notes      string `json:"notes"`
}

type ClockOutRequest struct {
	Notes string `json:"notes"`
}

type CreateAttendanceRequest struct {
	EmployeeID    string                 `json:"employee_id" validate:"required"`
	ShiftID       string                 `json:"shift_id"`
	Date          string                 `json:"date" validate:"required"`
	ClockIn       string                 `json:"clock_in"`
	ClockOut      string                 `json:"clock_out"`
	Status        model.AttendanceStatus `json:"status" validate:"required"`
	OvertimeHours float64                `json:"overtime_hours"`
	Notes         string                 `json:"notes"`
}

type UpdateAttendanceRequest struct {
	ShiftID       string                 `json:"shift_id"`
	ClockIn       string                 `json:"clock_in"`
	ClockOut      string                 `json:"clock_out"`
	Status        model.AttendanceStatus `json:"status"`
	OvertimeHours *float64               `json:"overtime_hours"`
	Notes         string                 `json:"notes"`
}

type AttendanceResponse struct {
	ID            string                 `json:"id"`
	EmployeeID    string                 `json:"employee_id"`
	Employee      *EmployeeResponse      `json:"employee,omitempty"`
	ShiftID       string                 `json:"shift_id"`
	Date          string                 `json:"date"`
	ClockIn       string                 `json:"clock_in"`
	ClockOut      string                 `json:"clock_out"`
	Status        model.AttendanceStatus `json:"status"`
	OvertimeHours float64                `json:"overtime_hours"`
	Notes         string                 `json:"notes"`
	CreatedAt     string                 `json:"created_at"`
	UpdatedAt     string                 `json:"updated_at"`
}

func ToAttendanceResponse(a *model.Attendance) AttendanceResponse {
	resp := AttendanceResponse{
		ID:            a.ID,
		EmployeeID:    a.EmployeeID,
		ShiftID:       a.ShiftID,
		Date:          a.Date.Format("2006-01-02"),
		Status:        a.Status,
		OvertimeHours: a.OvertimeHours,
		Notes:         a.Notes,
		CreatedAt:     a.CreatedAt.Format("2006-01-02T15:04:05Z"),
		UpdatedAt:     a.UpdatedAt.Format("2006-01-02T15:04:05Z"),
	}

	if a.ClockIn != nil {
		resp.ClockIn = a.ClockIn.Format("2006-01-02T15:04:05Z")
	}
	if a.ClockOut != nil {
		resp.ClockOut = a.ClockOut.Format("2006-01-02T15:04:05Z")
	}

	if a.Employee.ID != "" {
		empResp := ToEmployeeResponse(&a.Employee)
		resp.Employee = &empResp
	}

	return resp
}

type PaginatedAttendanceResponse struct {
	Data       []AttendanceResponse `json:"data"`
	Page       int                  `json:"page"`
	Limit      int                  `json:"limit"`
	TotalItems int64                `json:"total_items"`
	TotalPages int                  `json:"total_pages"`
}

func ToAttendanceResponses(attendances []model.Attendance) []AttendanceResponse {
	responses := make([]AttendanceResponse, len(attendances))
	for i, a := range attendances {
		responses[i] = ToAttendanceResponse(&a)
	}
	return responses
}
