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
	CreatedAt     time.Time        `json:"created_at"`
	UpdatedAt     time.Time        `json:"updated_at"`
	DeletedAt     gorm.DeletedAt   `gorm:"index" json:"-"`
}

func (a *Attendance) BeforeCreate(tx *gorm.DB) error {
	if a.ID == "" {
		a.ID = uuid.New().String()
	}
	return nil
}
