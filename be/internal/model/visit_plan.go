package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// VisitPlan is one employee's planned visits for one date.
// Example: Budi's plan for 2026-04-18 = 6 RS wards to visit.
// At runtime, each actual Visit may link back to a VisitPlanItem via
// Visit.VisitPlanItemID so reports can show planned-vs-actual.
type VisitPlan struct {
	ID         string    `gorm:"type:uuid;primaryKey" json:"id"`
	EmployeeID string    `gorm:"type:uuid;not null;index" json:"employee_id"`
	Employee   Employee  `gorm:"foreignKey:EmployeeID" json:"employee,omitempty"`
	CompanyID  string    `gorm:"type:uuid;not null;index" json:"company_id"`
	PlanDate   time.Time `gorm:"type:date;not null;index" json:"plan_date"`

	// draft | active | done — purely informational; not enforced in flow.
	Status string `gorm:"type:varchar(32);not null;default:'draft'" json:"status"`
	Notes  string `gorm:"type:text" json:"notes"`

	CreatedBy string `gorm:"type:uuid" json:"created_by"` // user_id of author

	Items []VisitPlanItem `gorm:"foreignKey:VisitPlanID" json:"items,omitempty"`

	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

func (p *VisitPlan) BeforeCreate(tx *gorm.DB) error {
	if p.ID == "" {
		p.ID = uuid.New().String()
	}
	return nil
}

// VisitPlanItem is one planned stop inside a plan.
type VisitPlanItem struct {
	ID          string `gorm:"type:uuid;primaryKey" json:"id"`
	VisitPlanID string `gorm:"type:uuid;not null;index" json:"visit_plan_id"`

	Location      string     `gorm:"type:varchar(255);not null" json:"location"`
	SubLocation   string     `gorm:"type:varchar(255)" json:"sub_location"`
	Purpose       string     `gorm:"type:varchar(500)" json:"purpose"`
	ScheduledTime *time.Time `gorm:"type:timestamp" json:"scheduled_time,omitempty"`
	SequenceOrder int        `gorm:"not null;default:0" json:"sequence_order"`

	// pending | visited | skipped
	Status string `gorm:"type:varchar(32);not null;default:'pending'" json:"status"`

	// Filled in when an actual Visit realizes this plan item.
	LinkedVisitID string `gorm:"type:uuid;index" json:"linked_visit_id,omitempty"`

	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

func (i *VisitPlanItem) BeforeCreate(tx *gorm.DB) error {
	if i.ID == "" {
		i.ID = uuid.New().String()
	}
	return nil
}
