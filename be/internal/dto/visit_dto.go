package dto

import (
	"time"

	"hris-backend/internal/model"
)

// StartVisitRequest is posted when the employee arrives at a sub-location.
type StartVisitRequest struct {
	AttendanceID string   `json:"attendance_id" validate:"required"`
	Location     string   `json:"location" validate:"required"`
	SubLocation  string   `json:"sub_location"`
	Purpose      string   `json:"purpose"`
	Lat          *float64 `json:"lat,omitempty"`
	Lng          *float64 `json:"lng,omitempty"`
	Photos       []string `json:"photos,omitempty"`
	// Optional — supplied when this visit realizes a planned item.
	VisitPlanItemID string `json:"visit_plan_item_id,omitempty"`
}

// EndVisitRequest finalizes a visit with the outcome.
type EndVisitRequest struct {
	ResultNotes string   `json:"result_notes"`
	Photos      []string `json:"photos,omitempty"` // additional photos appended to existing
}

type VisitResponse struct {
	ID              string     `json:"id"`
	AttendanceID    string     `json:"attendance_id"`
	EmployeeID      string     `json:"employee_id"`
	CompanyID       string     `json:"company_id"`
	Location        string     `json:"location"`
	SubLocation     string     `json:"sub_location"`
	Purpose         string     `json:"purpose"`
	ArrivedAt       time.Time  `json:"arrived_at"`
	LeftAt          *time.Time `json:"left_at,omitempty"`
	ResultNotes     string     `json:"result_notes"`
	Photos          []string   `json:"photos"`
	Lat             *float64   `json:"lat,omitempty"`
	Lng             *float64   `json:"lng,omitempty"`
	VisitPlanItemID string     `json:"visit_plan_item_id,omitempty"`
	CreatedAt       time.Time  `json:"created_at"`
	UpdatedAt       time.Time  `json:"updated_at"`
}

func ToVisitResponse(v *model.Visit) VisitResponse {
	return VisitResponse{
		ID:              v.ID,
		AttendanceID:    v.AttendanceID,
		EmployeeID:      v.EmployeeID,
		CompanyID:       v.CompanyID,
		Location:        v.Location,
		SubLocation:     v.SubLocation,
		Purpose:         v.Purpose,
		ArrivedAt:       v.ArrivedAt,
		LeftAt:          v.LeftAt,
		ResultNotes:     v.ResultNotes,
		Photos:          splitPhotos(v.Photos),
		Lat:             v.Lat,
		Lng:             v.Lng,
		VisitPlanItemID: v.VisitPlanItemID,
		CreatedAt:       v.CreatedAt,
		UpdatedAt:       v.UpdatedAt,
	}
}

func ToVisitResponses(vs []model.Visit) []VisitResponse {
	out := make([]VisitResponse, len(vs))
	for i := range vs {
		out[i] = ToVisitResponse(&vs[i])
	}
	return out
}

type PaginatedVisitResponse struct {
	Data       []VisitResponse `json:"data"`
	Page       int             `json:"page"`
	Limit      int             `json:"limit"`
	TotalItems int64           `json:"total_items"`
	TotalPages int             `json:"total_pages"`
}

// splitPhotos converts the comma-separated storage format into a slice.
func splitPhotos(s string) []string {
	if s == "" {
		return []string{}
	}
	out := []string{}
	start := 0
	for i := 0; i < len(s); i++ {
		if s[i] == ',' {
			if i > start {
				out = append(out, s[start:i])
			}
			start = i + 1
		}
	}
	if start < len(s) {
		out = append(out, s[start:])
	}
	return out
}
