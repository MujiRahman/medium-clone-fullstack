package handler

import (
	"log"
	"net/http"
	"time"

	"medium-clone/internal/usecase"
	"medium-clone/pkg/response"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type NotificationHandler struct {
	notifUseCase usecase.NotificationUseCase
}

func NewNotificationHandler(notifUseCase usecase.NotificationUseCase) *NotificationHandler {
	return &NotificationHandler{
		notifUseCase: notifUseCase,
	}
}

func (h *NotificationHandler) GetNotifications(c *gin.Context) {
	userID, err := h.getCallerID(c)
	if err != nil {
		response.JSON(c, http.StatusUnauthorized, "Unauthorized", nil)
		return
	}

	notifs, err := h.notifUseCase.GetNotifications(userID)
	if err != nil {
		response.JSON(c, http.StatusInternalServerError, "Failed to fetch notifications", nil)
		return
	}

	response.JSON(c, http.StatusOK, "Success", notifs)
}

func (h *NotificationHandler) MarkAsRead(c *gin.Context) {
	userID, err := h.getCallerID(c)
	if err != nil {
		response.JSON(c, http.StatusUnauthorized, "Unauthorized", nil)
		return
	}

	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		response.JSON(c, http.StatusBadRequest, "Invalid notification ID", nil)
		return
	}

	if err := h.notifUseCase.MarkAsRead(id, userID); err != nil {
		response.JSON(c, http.StatusInternalServerError, "Failed to update notification", nil)
		return
	}

	response.JSON(c, http.StatusOK, "Notification marked as read", nil)
}

func (h *NotificationHandler) MarkAllAsRead(c *gin.Context) {
	userID, err := h.getCallerID(c)
	if err != nil {
		response.JSON(c, http.StatusUnauthorized, "Unauthorized", nil)
		return
	}

	if err := h.notifUseCase.MarkAllAsRead(userID); err != nil {
		response.JSON(c, http.StatusInternalServerError, "Failed to update notifications", nil)
		return
	}

	response.JSON(c, http.StatusOK, "All notifications marked as read", nil)
}

func (h *NotificationHandler) StreamNotifications(c *gin.Context) {
	userID, err := h.getCallerID(c)
	if err != nil {
		response.JSON(c, http.StatusUnauthorized, "Unauthorized", nil)
		return
	}

	// Set Headers for SSE
	c.Header("Content-Type", "text/event-stream")
	c.Header("Cache-Control", "no-cache")
	c.Header("Connection", "keep-alive")
	c.Header("Transfer-Encoding", "chunked")

	// Subscribe to Redis channel
	pubsub := h.notifUseCase.Subscribe(c.Request.Context(), userID)
	defer func() {
		if err := pubsub.Close(); err != nil {
			log.Printf("Error closing notification pubsub subscription for user %s: %v", userID, err)
		}
	}()

	// Heartbeat ticker
	ticker := time.NewTicker(20 * time.Second)
	defer ticker.Stop()

	// Notify connection established
	c.SSEvent("connected", "listening to real-time notifications")
	c.Writer.Flush()

	ch := pubsub.Channel()

	for {
		select {
		case msg, ok := <-ch:
			if !ok {
				return
			}
			// Send the message payload under event "notification"
			c.SSEvent("notification", msg.Payload)
			c.Writer.Flush()
		case <-ticker.C:
			// Ping to keep connection alive
			c.SSEvent("ping", "heartbeat")
			c.Writer.Flush()
		case <-c.Writer.CloseNotify():
			return
		case <-c.Request.Context().Done():
			return
		}
	}
}

func (h *NotificationHandler) getCallerID(c *gin.Context) (uuid.UUID, error) {
	val, exists := c.Get("user_id")
	if !exists {
		return uuid.Nil, http.ErrNoCookie
	}
	userIDStr, ok := val.(string)
	if !ok {
		return uuid.Nil, http.ErrNoCookie
	}
	return uuid.Parse(userIDStr)
}
