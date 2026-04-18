package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Grade struct {
	ID          string         `gorm:"type:uuid;primaryKey" json:"id"`
	CompanyID   string         `gorm:"type:uuid;not null" json:"company_id"`
	Company     Company        `gorm:"foreignKey:CompanyID" json:"company,omitempty"`
	JobLevelID  string         `gorm:"type:uuid;not null" json:"job_level_id"`
	JobLevel    JobLevel       `gorm:"foreignKey:JobLevelID" json:"job_level,omitempty"`
	Name        string         `gorm:"type:varchar(100);not null" json:"name"`
	Description string         `gorm:"type:varchar(255)" json:"description"`
	MinSalary   float64        `gorm:"type:decimal(15,2);default:0" json:"min_salary"`
	MaxSalary   float64        `gorm:"type:decimal(15,2);default:0" json:"max_salary"`
	IsActive    bool           `gorm:"default:true" json:"is_active"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`
}

func (g *Grade) BeforeCreate(tx *gorm.DB) error {
	if g.ID == "" {
		g.ID = uuid.New().String()
	}
	return nil
}
