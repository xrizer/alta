package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type JobLevel struct {
	ID          string         `gorm:"type:uuid;primaryKey" json:"id"`
	CompanyID   string         `gorm:"type:uuid;not null" json:"company_id"`
	Company     Company        `gorm:"foreignKey:CompanyID" json:"company,omitempty"`
	Name        string         `gorm:"type:varchar(100);not null" json:"name"`
	Description string         `gorm:"type:varchar(255)" json:"description"`
	LevelOrder  int            `gorm:"default:0" json:"level_order"`
	IsActive    bool           `gorm:"default:true" json:"is_active"`
	Grades      []Grade        `gorm:"foreignKey:JobLevelID" json:"grades,omitempty"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`
}

func (jl *JobLevel) BeforeCreate(tx *gorm.DB) error {
	if jl.ID == "" {
		jl.ID = uuid.New().String()
	}
	return nil
}
