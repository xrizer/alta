package handler

import (
	"hris-backend/internal/service"
	"hris-backend/pkg/response"
	"strconv"

	"github.com/gofiber/fiber/v2"
)

type NotificationHandler struct {
	notifService service.NotificationService
}

func NewNotificationHandler(notifService service.NotificationService) *NotificationHandler {
	return &NotificationHandler{notifService: notifService}
}

// GetMyNotifications godoc
// @Summary Get notifications for the current user
// @Description Returns the latest notifications for the authenticated user
// @Tags Notifications
// @Security Bearer
// @Produce json
// @Param limit query int false "Max number to return (default 20)"
// @Success 200 {object} response.Response{data=[]dto.NotificationResponse}
// @Router /notifications [get]
func (h *NotificationHandler) GetMyNotifications(c *fiber.Ctx) error {
	userID := c.Locals("userID").(string)
	limit := 20
	if l := c.Query("limit"); l != "" {
		if v, err := strconv.Atoi(l); err == nil && v > 0 {
			limit = v
		}
	}

	notifications, err := h.notifService.GetByUserID(userID, limit)
	if err != nil {
		return response.Error(c, fiber.StatusInternalServerError, "Failed to fetch notifications")
	}
	return response.Success(c, fiber.StatusOK, "Notifications retrieved", notifications)
}

// GetUnreadCount godoc
// @Summary Get unread notification count
// @Description Returns the number of unread notifications for the authenticated user
// @Tags Notifications
// @Security Bearer
// @Produce json
// @Success 200 {object} response.Response{data=dto.UnreadCountResponse}
// @Router /notifications/unread-count [get]
func (h *NotificationHandler) GetUnreadCount(c *fiber.Ctx) error {
	userID := c.Locals("userID").(string)
	count, err := h.notifService.GetUnreadCount(userID)
	if err != nil {
		return response.Error(c, fiber.StatusInternalServerError, "Failed to count notifications")
	}
	return response.Success(c, fiber.StatusOK, "Unread count retrieved", fiber.Map{"count": count})
}

// MarkAsRead godoc
// @Summary Mark a notification as read
// @Tags Notifications
// @Security Bearer
// @Produce json
// @Param id path string true "Notification ID"
// @Success 200 {object} response.Response
// @Router /notifications/{id}/read [put]
func (h *NotificationHandler) MarkAsRead(c *fiber.Ctx) error {
	userID := c.Locals("userID").(string)
	id := c.Params("id")

	if err := h.notifService.MarkAsRead(id, userID); err != nil {
		return response.Error(c, fiber.StatusInternalServerError, "Failed to mark notification as read")
	}
	return response.Success(c, fiber.StatusOK, "Notification marked as read", nil)
}

// MarkAllAsRead godoc
// @Summary Mark all notifications as read
// @Tags Notifications
// @Security Bearer
// @Produce json
// @Success 200 {object} response.Response
// @Router /notifications/read-all [put]
func (h *NotificationHandler) MarkAllAsRead(c *fiber.Ctx) error {
	userID := c.Locals("userID").(string)

	if err := h.notifService.MarkAllAsRead(userID); err != nil {
		return response.Error(c, fiber.StatusInternalServerError, "Failed to mark all notifications as read")
	}
	return response.Success(c, fiber.StatusOK, "All notifications marked as read", nil)
}
