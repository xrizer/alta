package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type AttendanceStatus string

const (
	AttendanceHadir     AttendanceStatus = "hadir"
	AttendanceAlpha     AttendanceStatus = "alpha"
	AttendanceTerlambat AttendanceStatus = "terlambat"
	AttendanceIzin      AttendanceStatus = "izin"
	AttendanceSakit     AttendanceStatus = "sakit"
	AttendanceCuti      AttendanceStatus = "cuti"
	AttendanceEarlyIn   AttendanceStatus = "early_in"
	AttendanceOnTime    AttendanceStatus = "on_time"
	AttendanceLateIn    AttendanceStatus = "late_in"
)

type Attendance struct {
	ID            string           `gorm:"type:uuid;primaryKey" json:"id"`
	EmployeeID    string           `gorm:"type:uuid;not null" json:"employee_id"`
	Employee      Employee         `gorm:"foreignKey:EmployeeID" json:"employee,omitempty"`
	ShiftID       string           `gorm:"type:uuid" json:"shift_id"`
	Shift         Shift            `gorm:"foreignKey:ShiftID" json:"shift,omitempty"`
	Date          time.Time        `gorm:"type:date;not null" json:"date"`
	ClockIn       *time.Time       `gorm:"type:timestamp" json:"clock_in"`
	ClockOut      *time.Time       `gorm:"type:timestamp" json:"clock_out"`
	Status        AttendanceStatus `gorm:"type:varchar(20);not null;default:'hadir'" json:"status"`
	OvertimeHours float64          `gorm:"type:decimal(5,2);default:0" json:"overtime_hours"`
	Notes         string           `gorm:"type:text" json:"notes"`

	// GPS + photo capture (populated by mobile clients; web clients may leave empty).
	// When the `geo_attendance` module is enabled, these are expected; otherwise optional.
	ClockInLat            *float64 `gorm:"type:decimal(10,7)" json:"clock_in_lat,omitempty"`
	ClockInLng            *float64 `gorm:"type:decimal(10,7)" json:"clock_in_lng,omitempty"`
	ClockInPhoto          string   `gorm:"type:varchar(500)" json:"clock_in_photo,omitempty"`
	ClockInDistanceM      *float64 `gorm:"type:decimal(10,2)" json:"clock_in_distance_m,omitempty"`
	ClockOutLat           *float64 `gorm:"type:decimal(10,7)" json:"clock_out_lat,omitempty"`
	ClockOutLng           *float64 `gorm:"type:decimal(10,7)" json:"clock_out_lng,omitempty"`
	ClockOutPhoto         string   `gorm:"type:varchar(500)" json:"clock_out_photo,omitempty"`
	ClockOutDistanceM     *float64 `gorm:"type:decimal(10,2)" json:"clock_out_distance_m,omitempty"`

	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

func (a *Attendance) BeforeCreate(tx *gorm.DB) error {
	if a.ID == "" {
		a.ID = uuid.New().String()
	}
	return nil
}
