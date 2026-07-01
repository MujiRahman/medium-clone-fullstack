package postgres

import (
	"medium-clone/internal/domain"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type NotificationRepository interface {
	Create(notification *domain.Notification) error
	GetByRecipientID(recipientID uuid.UUID) ([]domain.Notification, error)
	MarkAsRead(id uuid.UUID, recipientID uuid.UUID) error
	MarkAllAsRead(recipientID uuid.UUID) error
}

type notificationRepository struct {
	db *gorm.DB
}

func NewNotificationRepository(db *gorm.DB) NotificationRepository {
	return &notificationRepository{db}
}

func (r *notificationRepository) Create(notification *domain.Notification) error {
	return r.db.Create(notification).Error
}

func (r *notificationRepository) GetByRecipientID(recipientID uuid.UUID) ([]domain.Notification, error) {
	var notifications []domain.Notification
	err := r.db.Preload("Sender").
		Where("recipient_id = ?", recipientID).
		Order("created_at DESC").
		Limit(50). // Limit to last 50 notifications to prevent heavy loads
		Find(&notifications).Error
	if err != nil {
		return nil, err
	}
	return notifications, nil
}

func (r *notificationRepository) MarkAsRead(id uuid.UUID, recipientID uuid.UUID) error {
	return r.db.Model(&domain.Notification{}).
		Where("id = ? AND recipient_id = ?", id, recipientID).
		Update("is_read", true).Error
}

func (r *notificationRepository) MarkAllAsRead(recipientID uuid.UUID) error {
	return r.db.Model(&domain.Notification{}).
		Where("recipient_id = ? AND is_read = ?", recipientID, false).
		Update("is_read", true).Error
}
