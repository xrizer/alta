package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Holiday struct {
	ID         string    `gorm:"type:uuid;primaryKey" json:"id"`
	CompanyID  string    `gorm:"type:uuid;not null" json:"company_id"`
	Company    Company   `gorm:"foreignKey:CompanyID" json:"company,omitempty"`
	Name       string    `gorm:"type:varchar(255);not null" json:"name"`
	Date       time.Time `gorm:"type:date;not null" json:"date"`
	IsNational bool      `gorm:"default:true" json:"is_national"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}

func (h *Holiday) BeforeCreate(tx *gorm.DB) error {
	if h.ID == "" {
		h.ID = uuid.New().String()
	}
	return nil
}
