package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Module is a catalog row representing a feature module that a company can enable/disable.
// Rows are code-seeded from internal/modules/registry — never user-editable.
type Module struct {
	Key         string         `gorm:"type:varchar(64);primaryKey" json:"key"`
	Name        string         `gorm:"type:varchar(128);not null" json:"name"`
	Description string         `gorm:"type:varchar(500)" json:"description"`
	Category    string         `gorm:"type:varchar(64);not null" json:"category"`
	DependsOn   string         `gorm:"type:varchar(500)" json:"depends_on"` // comma-separated module keys
	IsCore      bool           `gorm:"not null;default:false" json:"is_core"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`
}

// CompanyModule toggles a Module for a specific Company.
// Absence of a row = disabled (unless the Module is core; core modules are always-on).
type CompanyModule struct {
	ID         string     `gorm:"type:uuid;primaryKey" json:"id"`
	CompanyID  string     `gorm:"type:uuid;not null;index:idx_company_module,unique" json:"company_id"`
	Company    Company    `gorm:"foreignKey:CompanyID" json:"company,omitempty"`
	ModuleKey  string     `gorm:"type:varchar(64);not null;index:idx_company_module,unique" json:"module_key"`
	Module     Module     `gorm:"foreignKey:ModuleKey;references:Key" json:"module,omitempty"`
	Enabled    bool       `gorm:"not null;default:false" json:"enabled"`
	Config     string     `gorm:"type:jsonb" json:"config"` // module-specific config as raw JSON string
	EnabledAt  *time.Time `json:"enabled_at"`
	EnabledBy  string     `gorm:"type:uuid" json:"enabled_by"`
	CreatedAt  time.Time  `json:"created_at"`
	UpdatedAt  time.Time  `json:"updated_at"`
}

func (cm *CompanyModule) BeforeCreate(tx *gorm.DB) error {
	if cm.ID == "" {
		cm.ID = uuid.New().String()
	}
	return nil
}
