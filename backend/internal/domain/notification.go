package domain

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type NotificationType string

const (
	NotificationTypeClap    NotificationType = "clap"
	NotificationTypeComment NotificationType = "comment"
	NotificationTypeFollow  NotificationType = "follow"
)

type Notification struct {
	ID          uuid.UUID        `gorm:"type:uuid;primaryKey" json:"id"`
	RecipientID uuid.UUID        `gorm:"type:uuid;not null;index" json:"recipient_id"`
	Recipient   User             `gorm:"foreignKey:RecipientID;constraint:OnDelete:CASCADE" json:"-"`
	SenderID    uuid.UUID        `gorm:"type:uuid;not null" json:"sender_id"`
	Sender      User             `gorm:"foreignKey:SenderID;constraint:OnDelete:CASCADE" json:"sender"`
	Type        NotificationType `gorm:"type:varchar(20);not null" json:"type"`
	Message     string           `gorm:"type:text;not null" json:"message"`
	StorySlug   string           `gorm:"type:varchar(255)" json:"story_slug,omitempty"`
	IsRead      bool             `gorm:"not null;default:false;index" json:"is_read"`
	CreatedAt   time.Time        `json:"created_at"`
}

func (n *Notification) BeforeCreate(tx *gorm.DB) (err error) {
	if n.ID == uuid.Nil {
		n.ID = uuid.New()
	}
	return
}
