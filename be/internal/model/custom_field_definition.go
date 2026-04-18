package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/datatypes"
	"gorm.io/gorm"
)

// CustomFieldType enumerates supported input types for a custom field.
type CustomFieldType string

const (
	CustomFieldText    CustomFieldType = "text"
	CustomFieldNumber  CustomFieldType = "number"
	CustomFieldDate    CustomFieldType = "date"
	CustomFieldBoolean CustomFieldType = "boolean"
	CustomFieldSelect  CustomFieldType = "select"
)

// CustomFieldEntity enumerates the owning entity type for a custom field.
// For Phase 1 the only entity is "employee", but the column lets us reuse the
// same definitions table for other entities (leaves, payrolls, etc.) later
// without another migration.
type CustomFieldEntity string

const (
	CustomFieldEntityEmployee CustomFieldEntity = "employee"
)

// CustomFieldDefinition describes a user-defined field that admins can attach
// to a parent entity (currently "employee"). The actual values are stored as
// JSONB on the parent row under the FieldKey.
type CustomFieldDefinition struct {
	ID           string            `gorm:"type:uuid;primaryKey" json:"id"`
	CompanyID    string            `gorm:"type:uuid;not null;index:idx_cfd_company_entity_key,unique" json:"company_id"`
	Company      Company           `gorm:"foreignKey:CompanyID" json:"company,omitempty"`
	EntityType   CustomFieldEntity `gorm:"type:varchar(30);not null;index:idx_cfd_company_entity_key,unique" json:"entity_type"`
	FieldKey     string            `gorm:"type:varchar(60);not null;index:idx_cfd_company_entity_key,unique" json:"field_key"`
	Label        string            `gorm:"type:varchar(100);not null" json:"label"`
	FieldType    CustomFieldType   `gorm:"type:varchar(20);not null;default:'text'" json:"field_type"`
	Options      datatypes.JSON    `gorm:"type:jsonb" json:"options,omitempty"` // string[] for select type
	IsRequired   bool              `gorm:"default:false" json:"is_required"`
	DisplayOrder int               `gorm:"default:0" json:"display_order"`
	IsActive     bool              `gorm:"default:true" json:"is_active"`
	CreatedAt    time.Time         `json:"created_at"`
	UpdatedAt    time.Time         `json:"updated_at"`
	DeletedAt    gorm.DeletedAt    `gorm:"index" json:"-"`
}

func (c *CustomFieldDefinition) BeforeCreate(tx *gorm.DB) error {
	if c.ID == "" {
		c.ID = uuid.New().String()
	}
	return nil
}
