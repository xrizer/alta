package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Visit represents a single sub-location check-in within one attendance session.
// Model (b): one clock-in/out with many visits nested inside.
//
// For the PT Ahmad Aris sales-ops use case, a marketing employee clocks in once
// in the morning, visits e.g. 5 different RS wards (each a Visit row), then
// clocks out. Each visit captures location, purpose, notes, and optional
// photo/GPS. A later Visit Plan module can link each realized visit to a
// planned one via VisitPlanItemID.
type Visit struct {
	ID           string    `gorm:"type:uuid;primaryKey" json:"id"`
	AttendanceID string    `gorm:"type:uuid;not null;index" json:"attendance_id"`
	Attendance   Attendance `gorm:"foreignKey:AttendanceID" json:"attendance,omitempty"`

	// Denormalized for easier querying / reporting without joining attendance.
	EmployeeID string  `gorm:"type:uuid;not null;index" json:"employee_id"`
	Employee   Employee `gorm:"foreignKey:EmployeeID" json:"employee,omitempty"`
	CompanyID  string  `gorm:"type:uuid;not null;index" json:"company_id"`

	Location    string `gorm:"type:varchar(255);not null" json:"location"`
	SubLocation string `gorm:"type:varchar(255)" json:"sub_location"`
	Purpose     string `gorm:"type:varchar(500)" json:"purpose"`

	ArrivedAt time.Time  `gorm:"type:timestamp;not null" json:"arrived_at"`
	LeftAt    *time.Time `gorm:"type:timestamp" json:"left_at"`

	ResultNotes string `gorm:"type:text" json:"result_notes"`
	Photos      string `gorm:"type:text" json:"photos"` // comma-separated URLs

	// Optional GPS at arrival
	Lat *float64 `gorm:"type:decimal(10,7)" json:"lat,omitempty"`
	Lng *float64 `gorm:"type:decimal(10,7)" json:"lng,omitempty"`

	// Populated by visit_planning module when a plan item is matched against this visit.
	VisitPlanItemID string `gorm:"type:uuid;index" json:"visit_plan_item_id,omitempty"`

	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

func (v *Visit) BeforeCreate(tx *gorm.DB) error {
	if v.ID == "" {
		v.ID = uuid.New().String()
	}
	return nil
}
