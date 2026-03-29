package kafka

import "encoding/json"

// EventType defines the type of notification event
type EventType string

const (
	EventLeaveSubmitted    EventType = "leave.submitted"
	EventLeaveStatusChanged EventType = "leave.status_changed"
	EventPayrollProcessed  EventType = "payroll.processed"
)

// Topic used for all HRIS notification events
const TopicNotifications = "hris.notifications"

// NotificationEvent is the envelope published to Kafka
type NotificationEvent struct {
	EventType EventType       `json:"event_type"`
	Payload   json.RawMessage `json:"payload"`
}

// LeaveSubmittedPayload is sent when an employee submits a leave request
type LeaveSubmittedPayload struct {
	LeaveID      string `json:"leave_id"`
	EmployeeName string `json:"employee_name"`
	LeaveType    string `json:"leave_type"`
	TotalDays    int    `json:"total_days"`
}

// LeaveStatusChangedPayload is sent when a leave is approved or rejected
type LeaveStatusChangedPayload struct {
	LeaveID         string `json:"leave_id"`
	EmployeeUserID  string `json:"employee_user_id"`
	EmployeeName    string `json:"employee_name"`
	NewStatus       string `json:"new_status"`
	RejectionReason string `json:"rejection_reason,omitempty"`
}

// PayrollProcessedPayload is sent when payroll status changes
type PayrollProcessedPayload struct {
	PayrollID      string  `json:"payroll_id"`
	EmployeeUserID string  `json:"employee_user_id"`
	EmployeeName   string  `json:"employee_name"`
	Period         string  `json:"period"`
	NetSalary      float64 `json:"net_salary"`
	Status         string  `json:"status"`
}

// MarshalEvent encodes an event to JSON bytes for Kafka
func MarshalEvent(eventType EventType, payload any) ([]byte, error) {
	payloadBytes, err := json.Marshal(payload)
	if err != nil {
		return nil, err
	}
	env := NotificationEvent{
		EventType: eventType,
		Payload:   json.RawMessage(payloadBytes),
	}
	return json.Marshal(env)
}
