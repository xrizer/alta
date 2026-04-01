package service

import (
	"hris-backend/internal/dto"
	"hris-backend/internal/repository"
)

type NotificationService interface {
	GetByUserID(userID string, limit int) ([]dto.NotificationResponse, error)
	GetUnreadCount(userID string) (int64, error)
	MarkAsRead(id string, userID string) error
	MarkAllAsRead(userID string) error
}

type notificationService struct {
	repo repository.NotificationRepository
}

func NewNotificationService(repo repository.NotificationRepository) NotificationService {
	return &notificationService{repo: repo}
}

func (s *notificationService) GetByUserID(userID string, limit int) ([]dto.NotificationResponse, error) {
	notifications, err := s.repo.FindByUserID(userID, limit)
	if err != nil {
		return nil, err
	}
	return dto.ToNotificationResponses(notifications), nil
}

func (s *notificationService) GetUnreadCount(userID string) (int64, error) {
	return s.repo.CountUnread(userID)
}

func (s *notificationService) MarkAsRead(id string, userID string) error {
	return s.repo.MarkAsRead(id, userID)
}

func (s *notificationService) MarkAllAsRead(userID string) error {
	return s.repo.MarkAllAsRead(userID)
}
