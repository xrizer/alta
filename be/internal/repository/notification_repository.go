package repository

import (
	"hris-backend/internal/model"
	"time"

	"gorm.io/gorm"
)

type NotificationRepository interface {
	Create(n *model.Notification) error
	FindByUserID(userID string, limit int) ([]model.Notification, error)
	CountUnread(userID string) (int64, error)
	MarkAsRead(id string, userID string) error
	MarkAllAsRead(userID string) error
}

type notificationRepository struct {
	db *gorm.DB
}

func NewNotificationRepository(db *gorm.DB) NotificationRepository {
	return &notificationRepository{db: db}
}

func (r *notificationRepository) Create(n *model.Notification) error {
	return r.db.Create(n).Error
}

func (r *notificationRepository) FindByUserID(userID string, limit int) ([]model.Notification, error) {
	var notifications []model.Notification
	q := r.db.Where("user_id = ?", userID).Order("created_at DESC")
	if limit > 0 {
		q = q.Limit(limit)
	}
	if err := q.Find(&notifications).Error; err != nil {
		return nil, err
	}
	return notifications, nil
}

func (r *notificationRepository) CountUnread(userID string) (int64, error) {
	var count int64
	err := r.db.Model(&model.Notification{}).
		Where("user_id = ? AND is_read = false", userID).
		Count(&count).Error
	return count, err
}

func (r *notificationRepository) MarkAsRead(id string, userID string) error {
	now := time.Now()
	return r.db.Model(&model.Notification{}).
		Where("id = ? AND user_id = ?", id, userID).
		Updates(map[string]any{
			"is_read": true,
			"read_at": now,
		}).Error
}

func (r *notificationRepository) MarkAllAsRead(userID string) error {
	now := time.Now()
	return r.db.Model(&model.Notification{}).
		Where("user_id = ? AND is_read = false", userID).
		Updates(map[string]any{
			"is_read": true,
			"read_at": now,
		}).Error
}
