package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type PayrollStatus string

const (
	PayrollDraft     PayrollStatus = "draft"
	PayrollProcessed PayrollStatus = "processed"
	PayrollPaid      PayrollStatus = "paid"
)

type Payroll struct {
	ID               string         `gorm:"type:uuid;primaryKey" json:"id"`
	EmployeeID       string         `gorm:"type:uuid;not null" json:"employee_id"`
	Employee         Employee       `gorm:"foreignKey:EmployeeID" json:"employee,omitempty"`
	PeriodMonth      int            `gorm:"not null" json:"period_month"`
	PeriodYear       int            `gorm:"not null" json:"period_year"`
	WorkingDays      int            `gorm:"default:0" json:"working_days"`
	PresentDays      int            `gorm:"default:0" json:"present_days"`
	BasicSalary      float64        `gorm:"type:decimal(15,2);default:0" json:"basic_salary"`
	TotalAllowances  float64        `gorm:"type:decimal(15,2);default:0" json:"total_allowances"`
	OvertimePay      float64        `gorm:"type:decimal(15,2);default:0" json:"overtime_pay"`
	THR              float64        `gorm:"type:decimal(15,2);default:0" json:"thr"`
	TotalDeductions  float64        `gorm:"type:decimal(15,2);default:0" json:"total_deductions"`
	BPJSKesDeduction float64        `gorm:"type:decimal(15,2);default:0" json:"bpjs_kes_deduction"`
	BPJSTKDeduction  float64        `gorm:"type:decimal(15,2);default:0" json:"bpjs_tk_deduction"`
	PPH21            float64        `gorm:"type:decimal(15,2);default:0" json:"pph21"`
	OtherDeductions  float64        `gorm:"type:decimal(15,2);default:0" json:"other_deductions"`
	GrossSalary      float64        `gorm:"type:decimal(15,2);default:0" json:"gross_salary"`
	NetSalary        float64        `gorm:"type:decimal(15,2);default:0" json:"net_salary"`
	Status           PayrollStatus  `gorm:"type:varchar(20);not null;default:'draft'" json:"status"`
	PaidAt           *time.Time     `gorm:"type:timestamp" json:"paid_at"`
	Notes            string         `gorm:"type:text" json:"notes"`
	CreatedAt        time.Time      `json:"created_at"`
	UpdatedAt        time.Time      `json:"updated_at"`
	DeletedAt        gorm.DeletedAt `gorm:"index" json:"-"`
}

func (p *Payroll) BeforeCreate(tx *gorm.DB) error {
	if p.ID == "" {
		p.ID = uuid.New().String()
	}
	return nil
}
