package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Permission struct {
	ID          string    `gorm:"type:uuid;primaryKey" json:"id"`
	Name        string    `gorm:"type:varchar(100);uniqueIndex;not null" json:"name"`
	Description string    `gorm:"type:varchar(255)" json:"description"`
	Module      string    `gorm:"type:varchar(50);not null" json:"module"`
	Action      string    `gorm:"type:varchar(20);not null" json:"action"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

func (p *Permission) BeforeCreate(tx *gorm.DB) error {
	if p.ID == "" {
		p.ID = uuid.New().String()
	}
	return nil
}

type RolePermission struct {
	ID           string     `gorm:"type:uuid;primaryKey" json:"id"`
	Role         Role       `gorm:"type:varchar(20);not null" json:"role"`
	PermissionID string     `gorm:"type:uuid;not null" json:"permission_id"`
	Permission   Permission `gorm:"foreignKey:PermissionID" json:"permission,omitempty"`
	CreatedAt    time.Time  `json:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at"`
}

func (rp *RolePermission) BeforeCreate(tx *gorm.DB) error {
	if rp.ID == "" {
		rp.ID = uuid.New().String()
	}
	return nil
}
