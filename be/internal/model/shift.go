package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Shift struct {
	ID        string         `gorm:"type:uuid;primaryKey" json:"id"`
	CompanyID string         `gorm:"type:uuid;not null" json:"company_id"`
	Company   Company        `gorm:"foreignKey:CompanyID" json:"company,omitempty"`
	Name      string         `gorm:"type:varchar(100);not null" json:"name"`
	StartTime string         `gorm:"type:time;not null" json:"start_time"`
	EndTime   string         `gorm:"type:time;not null" json:"end_time"`
	IsActive  bool           `gorm:"default:true" json:"is_active"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

func (s *Shift) BeforeCreate(tx *gorm.DB) error {
	if s.ID == "" {
		s.ID = uuid.New().String()
	}
	return nil
}
