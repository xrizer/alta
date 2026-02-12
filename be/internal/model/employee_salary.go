package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type EmployeeSalary struct {
	ID                 string         `gorm:"type:uuid;primaryKey" json:"id"`
	EmployeeID         string         `gorm:"type:uuid;not null" json:"employee_id"`
	Employee           Employee       `gorm:"foreignKey:EmployeeID" json:"employee,omitempty"`
	BasicSalary        float64        `gorm:"type:decimal(15,2);not null" json:"basic_salary"`
	TransportAllowance float64        `gorm:"type:decimal(15,2);default:0" json:"transport_allowance"`
	MealAllowance      float64        `gorm:"type:decimal(15,2);default:0" json:"meal_allowance"`
	HousingAllowance   float64        `gorm:"type:decimal(15,2);default:0" json:"housing_allowance"`
	PositionAllowance  float64        `gorm:"type:decimal(15,2);default:0" json:"position_allowance"`
	BPJSKesEmployee    float64        `gorm:"type:decimal(15,2);default:0" json:"bpjs_kes_employee"`
	BPJSKesCompany     float64        `gorm:"type:decimal(15,2);default:0" json:"bpjs_kes_company"`
	BPJSTKJHTEmployee  float64        `gorm:"type:decimal(15,2);default:0" json:"bpjs_tk_jht_employee"`
	BPJSTKJHTCompany   float64        `gorm:"type:decimal(15,2);default:0" json:"bpjs_tk_jht_company"`
	BPJSTKJKK          float64        `gorm:"type:decimal(15,2);default:0" json:"bpjs_tk_jkk"`
	BPJSTKJKM          float64        `gorm:"type:decimal(15,2);default:0" json:"bpjs_tk_jkm"`
	BPJSTKJPEmployee   float64        `gorm:"type:decimal(15,2);default:0" json:"bpjs_tk_jp_employee"`
	BPJSTKJPCompany    float64        `gorm:"type:decimal(15,2);default:0" json:"bpjs_tk_jp_company"`
	EffectiveDate      time.Time      `gorm:"type:date;not null" json:"effective_date"`
	CreatedAt          time.Time      `json:"created_at"`
	UpdatedAt          time.Time      `json:"updated_at"`
	DeletedAt          gorm.DeletedAt `gorm:"index" json:"-"`
}

func (es *EmployeeSalary) BeforeCreate(tx *gorm.DB) error {
	if es.ID == "" {
		es.ID = uuid.New().String()
	}
	return nil
}
