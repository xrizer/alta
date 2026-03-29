package dto

import "hris-backend/internal/model"

type NotificationResponse struct {
	ID        string                  `json:"id"`
	Title     string                  `json:"title"`
	Message   string                  `json:"message"`
	Type      model.NotificationType  `json:"type"`
	RefID     string                  `json:"ref_id,omitempty"`
	RefType   string                  `json:"ref_type,omitempty"`
	IsRead    bool                    `json:"is_read"`
	ReadAt    string                  `json:"read_at,omitempty"`
	CreatedAt string                  `json:"created_at"`
}

type UnreadCountResponse struct {
	Count int64 `json:"count"`
}

func ToNotificationResponse(n *model.Notification) NotificationResponse {
	resp := NotificationResponse{
		ID:        n.ID,
		Title:     n.Title,
		Message:   n.Message,
		Type:      n.Type,
		RefID:     n.RefID,
		RefType:   n.RefType,
		IsRead:    n.IsRead,
		CreatedAt: n.CreatedAt.Format("2006-01-02T15:04:05Z"),
	}
	if n.ReadAt != nil {
		resp.ReadAt = n.ReadAt.Format("2006-01-02T15:04:05Z")
	}
	return resp
}

func ToNotificationResponses(notifications []model.Notification) []NotificationResponse {
	responses := make([]NotificationResponse, len(notifications))
	for i, n := range notifications {
		responses[i] = ToNotificationResponse(&n)
	}
	return responses
}
