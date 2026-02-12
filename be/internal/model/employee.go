package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type EmployeeStatus string

const (
	StatusTetap     EmployeeStatus = "tetap"
	StatusKontrak   EmployeeStatus = "kontrak"
	StatusProbation EmployeeStatus = "probation"
)

type Employee struct {
	ID             string         `gorm:"type:uuid;primaryKey" json:"id"`
	UserID         string         `gorm:"type:uuid;uniqueIndex;not null" json:"user_id"`
	User           User           `gorm:"foreignKey:UserID" json:"user,omitempty"`
	CompanyID      string         `gorm:"type:uuid;not null" json:"company_id"`
	Company        Company        `gorm:"foreignKey:CompanyID" json:"company,omitempty"`
	DepartmentID   string         `gorm:"type:uuid;not null" json:"department_id"`
	Department     Department     `gorm:"foreignKey:DepartmentID" json:"department,omitempty"`
	PositionID     string         `gorm:"type:uuid;not null" json:"position_id"`
	Position       Position       `gorm:"foreignKey:PositionID" json:"position,omitempty"`
	ShiftID        string         `gorm:"type:uuid;not null" json:"shift_id"`
	Shift          Shift          `gorm:"foreignKey:ShiftID" json:"shift,omitempty"`
	EmployeeNumber string         `gorm:"type:varchar(50);uniqueIndex;not null" json:"employee_number"`
	NIK            string         `gorm:"type:varchar(16)" json:"nik"`
	Gender         string         `gorm:"type:varchar(10)" json:"gender"`
	BirthPlace     string         `gorm:"type:varchar(100)" json:"birth_place"`
	BirthDate      *time.Time     `gorm:"type:date" json:"birth_date"`
	MaritalStatus  string         `gorm:"type:varchar(20)" json:"marital_status"`
	Religion       string         `gorm:"type:varchar(20)" json:"religion"`
	BloodType      string         `gorm:"type:varchar(5)" json:"blood_type"`
	LastEducation  string         `gorm:"type:varchar(50)" json:"last_education"`
	JoinDate       time.Time      `gorm:"type:date;not null" json:"join_date"`
	ResignDate     *time.Time     `gorm:"type:date" json:"resign_date"`
	EmployeeStatus EmployeeStatus `gorm:"type:varchar(20);not null;default:'kontrak'" json:"employee_status"`
	BankName       string         `gorm:"type:varchar(50)" json:"bank_name"`
	BankAccount    string         `gorm:"type:varchar(30)" json:"bank_account"`
	BPJSKesNo      string         `gorm:"type:varchar(20)" json:"bpjs_kes_no"`
	BPJSTKNo       string         `gorm:"type:varchar(20)" json:"bpjs_tk_no"`
	NPWP           string         `gorm:"type:varchar(30)" json:"npwp"`
	CreatedAt      time.Time      `json:"created_at"`
	UpdatedAt      time.Time      `json:"updated_at"`
	DeletedAt      gorm.DeletedAt `gorm:"index" json:"-"`
}

func (e *Employee) BeforeCreate(tx *gorm.DB) error {
	if e.ID == "" {
		e.ID = uuid.New().String()
	}
	return nil
}
