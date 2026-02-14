package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Position struct {
	ID           string         `gorm:"type:uuid;primaryKey" json:"id"`
	CompanyID    string         `gorm:"type:uuid;not null" json:"company_id"`
	Company      Company        `gorm:"foreignKey:CompanyID" json:"company,omitempty"`
	DepartmentID string         `gorm:"type:uuid" json:"department_id"`
	Department   Department     `gorm:"foreignKey:DepartmentID" json:"department,omitempty"`
	Name         string         `gorm:"type:varchar(255);not null" json:"name"`
	BaseSalary   float64        `gorm:"type:decimal(15,2);default:0" json:"base_salary"`
	IsActive     bool           `gorm:"default:true" json:"is_active"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `gorm:"index" json:"-"`
}

func (p *Position) BeforeCreate(tx *gorm.DB) error {
	if p.ID == "" {
		p.ID = uuid.New().String()
	}
	return nil
}
