package kafka

import (
	"encoding/json"
	"fmt"
	"log"

	"hris-backend/internal/model"
	"hris-backend/internal/repository"
)

// EventProcessor consumes Kafka events and persists notifications to the database.
type EventProcessor struct {
	notifRepo repository.NotificationRepository
	userRepo  repository.UserRepository
}

// NewEventProcessor creates a new processor that handles notification events.
func NewEventProcessor(
	notifRepo repository.NotificationRepository,
	userRepo repository.UserRepository,
) *EventProcessor {
	return &EventProcessor{
		notifRepo: notifRepo,
		userRepo:  userRepo,
	}
}

// Handle processes a raw Kafka message value.
func (p *EventProcessor) Handle(value []byte) error {
	event, err := ParseEvent(value)
	if err != nil {
		return fmt.Errorf("parse event: %w", err)
	}

	switch event.EventType {
	case EventLeaveSubmitted:
		return p.handleLeaveSubmitted(event.Payload)
	case EventLeaveStatusChanged:
		return p.handleLeaveStatusChanged(event.Payload)
	case EventPayrollProcessed:
		return p.handlePayrollProcessed(event.Payload)
	default:
		log.Printf("[kafka] processor: unknown event type %q — skipping", event.EventType)
	}
	return nil
}

// handleLeaveSubmitted notifies all admin and HR users about a new leave request.
func (p *EventProcessor) handleLeaveSubmitted(payload json.RawMessage) error {
	var data LeaveSubmittedPayload
	if err := json.Unmarshal(payload, &data); err != nil {
		return fmt.Errorf("unmarshal LeaveSubmittedPayload: %w", err)
	}

	admins, err := p.userRepo.FindByRoles([]string{"admin", "hr"})
	if err != nil {
		return fmt.Errorf("find admin/hr users: %w", err)
	}

	title := "New Leave Request"
	message := fmt.Sprintf("%s submitted a %d-day %s request", data.EmployeeName, data.TotalDays, data.LeaveType)

	for _, u := range admins {
		n := &model.Notification{
			UserID:  u.ID,
			Title:   title,
			Message: message,
			Type:    model.NotificationTypeWarning,
			RefID:   data.LeaveID,
			RefType: "leave",
		}
		if err := p.notifRepo.Create(n); err != nil {
			log.Printf("[kafka] processor: failed to create notification for user %s: %v", u.ID, err)
		}
	}
	return nil
}

// handleLeaveStatusChanged notifies the employee about their leave decision.
func (p *EventProcessor) handleLeaveStatusChanged(payload json.RawMessage) error {
	var data LeaveStatusChangedPayload
	if err := json.Unmarshal(payload, &data); err != nil {
		return fmt.Errorf("unmarshal LeaveStatusChangedPayload: %w", err)
	}

	var title, message string
	var notifType model.NotificationType

	switch data.NewStatus {
	case "approved":
		title = "Leave Request Approved"
		message = fmt.Sprintf("Your leave request has been approved.")
		notifType = model.NotificationTypeSuccess
	case "rejected":
		title = "Leave Request Rejected"
		message = fmt.Sprintf("Your leave request has been rejected.")
		if data.RejectionReason != "" {
			message += " Reason: " + data.RejectionReason
		}
		notifType = model.NotificationTypeError
	default:
		title = "Leave Request Updated"
		message = fmt.Sprintf("Your leave request status has changed to: %s", data.NewStatus)
		notifType = model.NotificationTypeInfo
	}

	n := &model.Notification{
		UserID:  data.EmployeeUserID,
		Title:   title,
		Message: message,
		Type:    notifType,
		RefID:   data.LeaveID,
		RefType: "leave",
	}
	return p.notifRepo.Create(n)
}

// handlePayrollProcessed notifies the employee about their payroll.
func (p *EventProcessor) handlePayrollProcessed(payload json.RawMessage) error {
	var data PayrollProcessedPayload
	if err := json.Unmarshal(payload, &data); err != nil {
		return fmt.Errorf("unmarshal PayrollProcessedPayload: %w", err)
	}

	title := "Payroll Processed"
	message := fmt.Sprintf("Your payroll for %s has been processed. Net salary: %.0f", data.Period, data.NetSalary)

	n := &model.Notification{
		UserID:  data.EmployeeUserID,
		Title:   title,
		Message: message,
		Type:    model.NotificationTypeSuccess,
		RefID:   data.PayrollID,
		RefType: "payroll",
	}
	return p.notifRepo.Create(n)
}
