package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type LeaveType string

const (
	LeaveCutiTahunan   LeaveType = "cuti_tahunan"
	LeaveCutiSakit     LeaveType = "cuti_sakit"
	LeaveCutiMelahirkan LeaveType = "cuti_melahirkan"
	LeaveCutiBesar     LeaveType = "cuti_besar"
	LeaveIzin          LeaveType = "izin"
	LeaveDinasLuar     LeaveType = "dinas_luar"
)

type LeaveStatus string

const (
	LeaveStatusPending  LeaveStatus = "pending"
	LeaveStatusApproved LeaveStatus = "approved"
	LeaveStatusRejected LeaveStatus = "rejected"
)

type Leave struct {
	ID              string         `gorm:"type:uuid;primaryKey" json:"id"`
	EmployeeID      string         `gorm:"type:uuid;not null" json:"employee_id"`
	Employee        Employee       `gorm:"foreignKey:EmployeeID" json:"employee,omitempty"`
	LeaveType       LeaveType      `gorm:"type:varchar(30);not null" json:"leave_type"`
	StartDate       time.Time      `gorm:"type:date;not null" json:"start_date"`
	EndDate         time.Time      `gorm:"type:date;not null" json:"end_date"`
	TotalDays       int            `gorm:"not null" json:"total_days"`
	Reason          string         `gorm:"type:text;not null" json:"reason"`
	Attachment      string         `gorm:"type:varchar(255)" json:"attachment"`
	Status          LeaveStatus    `gorm:"type:varchar(20);not null;default:'pending'" json:"status"`
	ApprovedBy      string         `gorm:"type:uuid" json:"approved_by"`
	Approver        *User          `gorm:"foreignKey:ApprovedBy" json:"approver,omitempty"`
	ApprovedAt      *time.Time     `gorm:"type:timestamp" json:"approved_at"`
	RejectionReason string         `gorm:"type:text" json:"rejection_reason"`
	CreatedAt       time.Time      `json:"created_at"`
	UpdatedAt       time.Time      `json:"updated_at"`
	DeletedAt       gorm.DeletedAt `gorm:"index" json:"-"`
}

func (l *Leave) BeforeCreate(tx *gorm.DB) error {
	if l.ID == "" {
		l.ID = uuid.New().String()
	}
	return nil
}
