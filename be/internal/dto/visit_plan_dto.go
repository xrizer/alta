package dto

import (
	"time"

	"hris-backend/internal/model"
)

// --- Requests ---

type VisitPlanItemInput struct {
	Location      string     `json:"location" validate:"required"`
	SubLocation   string     `json:"sub_location"`
	Purpose       string     `json:"purpose"`
	ScheduledTime *time.Time `json:"scheduled_time,omitempty"`
	SequenceOrder int        `json:"sequence_order"`
}

type CreateVisitPlanRequest struct {
	EmployeeID string               `json:"employee_id" validate:"required"`
	PlanDate   string               `json:"plan_date" validate:"required"` // YYYY-MM-DD
	Notes      string               `json:"notes"`
	Status     string               `json:"status"` // optional, defaults to draft
	Items      []VisitPlanItemInput `json:"items"`
}

type UpdateVisitPlanRequest struct {
	Notes  *string `json:"notes,omitempty"`
	Status *string `json:"status,omitempty"`
}

type AddVisitPlanItemRequest = VisitPlanItemInput

type UpdateVisitPlanItemRequest struct {
	Location      *string    `json:"location,omitempty"`
	SubLocation   *string    `json:"sub_location,omitempty"`
	Purpose       *string    `json:"purpose,omitempty"`
	ScheduledTime *time.Time `json:"scheduled_time,omitempty"`
	SequenceOrder *int       `json:"sequence_order,omitempty"`
	Status        *string    `json:"status,omitempty"` // pending | visited | skipped
}

// --- Responses ---

type VisitPlanItemResponse struct {
	ID            string     `json:"id"`
	VisitPlanID   string     `json:"visit_plan_id"`
	Location      string     `json:"location"`
	SubLocation   string     `json:"sub_location"`
	Purpose       string     `json:"purpose"`
	ScheduledTime *time.Time `json:"scheduled_time,omitempty"`
	SequenceOrder int        `json:"sequence_order"`
	Status        string     `json:"status"`
	LinkedVisitID string     `json:"linked_visit_id,omitempty"`
	CreatedAt     time.Time  `json:"created_at"`
	UpdatedAt     time.Time  `json:"updated_at"`
}

type VisitPlanResponse struct {
	ID         string                  `json:"id"`
	EmployeeID string                  `json:"employee_id"`
	CompanyID  string                  `json:"company_id"`
	PlanDate   time.Time               `json:"plan_date"`
	Status     string                  `json:"status"`
	Notes      string                  `json:"notes"`
	CreatedBy  string                  `json:"created_by"`
	Items      []VisitPlanItemResponse `json:"items"`
	CreatedAt  time.Time               `json:"created_at"`
	UpdatedAt  time.Time               `json:"updated_at"`
}

func ToVisitPlanItemResponse(i *model.VisitPlanItem) VisitPlanItemResponse {
	return VisitPlanItemResponse{
		ID:            i.ID,
		VisitPlanID:   i.VisitPlanID,
		Location:      i.Location,
		SubLocation:   i.SubLocation,
		Purpose:       i.Purpose,
		ScheduledTime: i.ScheduledTime,
		SequenceOrder: i.SequenceOrder,
		Status:        i.Status,
		LinkedVisitID: i.LinkedVisitID,
		CreatedAt:     i.CreatedAt,
		UpdatedAt:     i.UpdatedAt,
	}
}

func ToVisitPlanResponse(p *model.VisitPlan) VisitPlanResponse {
	items := make([]VisitPlanItemResponse, len(p.Items))
	for i := range p.Items {
		items[i] = ToVisitPlanItemResponse(&p.Items[i])
	}
	return VisitPlanResponse{
		ID:         p.ID,
		EmployeeID: p.EmployeeID,
		CompanyID:  p.CompanyID,
		PlanDate:   p.PlanDate,
		Status:     p.Status,
		Notes:      p.Notes,
		CreatedBy:  p.CreatedBy,
		Items:      items,
		CreatedAt:  p.CreatedAt,
		UpdatedAt:  p.UpdatedAt,
	}
}

func ToVisitPlanResponses(ps []model.VisitPlan) []VisitPlanResponse {
	out := make([]VisitPlanResponse, len(ps))
	for i := range ps {
		out[i] = ToVisitPlanResponse(&ps[i])
	}
	return out
}

// --- Daily adherence report ---
//
// For a given date+company, reports per-employee planned-vs-actual counts and
// whether the actual count fell below the minimum (5 by default, PT Ahmad
// Aris policy). "Soft" flag — admin sees but is not blocked.

type VisitAdherenceRow struct {
	EmployeeID     string `json:"employee_id"`
	EmployeeName   string `json:"employee_name"`
	PlannedCount   int    `json:"planned_count"`
	ActualCount    int    `json:"actual_count"`
	MatchedCount   int    `json:"matched_count"` // actual visits that linked to a plan item
	UnderMinimum   bool   `json:"under_minimum"`
	MinimumTarget  int    `json:"minimum_target"`
}

type VisitAdherenceReport struct {
	Date    time.Time           `json:"date"`
	Minimum int                 `json:"minimum"`
	Rows    []VisitAdherenceRow `json:"rows"`
}
