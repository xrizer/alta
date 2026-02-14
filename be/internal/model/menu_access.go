package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Valid menu keys
const (
	MenuDashboard            = "dashboard"
	MenuCompanies            = "companies"
	MenuDepartments          = "departments"
	MenuPositions            = "positions"
	MenuShifts               = "shifts"
	MenuOrganizationStructure = "organization_structure"
	MenuUsers                = "users"
	MenuEmployees            = "employees"
	MenuAttendance           = "attendance"
	MenuLeaves               = "leaves"
	MenuPayroll              = "payroll"
	MenuMenuAccessPolicy     = "menu_access_policy"
)

var ValidMenuKeys = map[string]bool{
	MenuDashboard:            true,
	MenuCompanies:            true,
	MenuDepartments:          true,
	MenuPositions:            true,
	MenuShifts:               true,
	MenuOrganizationStructure: true,
	MenuUsers:                true,
	MenuEmployees:            true,
	MenuAttendance:           true,
	MenuLeaves:               true,
	MenuPayroll:              true,
	MenuMenuAccessPolicy:     true,
}

type MenuAccess struct {
	ID        string    `gorm:"type:uuid;primaryKey" json:"id"`
	UserID    string    `gorm:"type:uuid;not null;uniqueIndex:idx_user_menu" json:"user_id"`
	User      User      `gorm:"foreignKey:UserID" json:"user,omitempty"`
	MenuKey   string    `gorm:"type:varchar(50);not null;uniqueIndex:idx_user_menu" json:"menu_key"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (m *MenuAccess) BeforeCreate(tx *gorm.DB) error {
	if m.ID == "" {
		m.ID = uuid.New().String()
	}
	return nil
}
