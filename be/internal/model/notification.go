package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// NotificationType represents the visual category of a notification
type NotificationType string

const (
	NotificationTypeInfo    NotificationType = "info"
	NotificationTypeSuccess NotificationType = "success"
	NotificationTypeWarning NotificationType = "warning"
	NotificationTypeError   NotificationType = "error"
)

// Notification represents a persisted notification for a specific user
type Notification struct {
	ID        string           `gorm:"type:uuid;primaryKey" json:"id"`
	UserID    string           `gorm:"type:uuid;not null;index" json:"user_id"`
	Title     string           `gorm:"type:varchar(255);not null" json:"title"`
	Message   string           `gorm:"type:text;not null" json:"message"`
	Type      NotificationType `gorm:"type:varchar(20);not null;default:'info'" json:"type"`
	RefID     string           `gorm:"type:uuid" json:"ref_id,omitempty"`
	RefType   string           `gorm:"type:varchar(50)" json:"ref_type,omitempty"`
	IsRead    bool             `gorm:"default:false" json:"is_read"`
	ReadAt    *time.Time       `json:"read_at,omitempty"`
	CreatedAt time.Time        `json:"created_at"`
	UpdatedAt time.Time        `json:"updated_at"`
	DeletedAt gorm.DeletedAt   `gorm:"index" json:"-"`
}

func (n *Notification) BeforeCreate(tx *gorm.DB) error {
	if n.ID == "" {
		n.ID = uuid.New().String()
	}
	return nil
}
