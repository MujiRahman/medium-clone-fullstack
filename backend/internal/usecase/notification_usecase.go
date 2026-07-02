package usecase

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"medium-clone/internal/domain"
	"medium-clone/internal/repository/postgres"

	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
)

type NotificationUseCase interface {
	CreateNotification(ctx context.Context, recipientID, senderID uuid.UUID, notifType domain.NotificationType, message, storySlug string) (*domain.Notification, error)
	GetNotifications(recipientID uuid.UUID) ([]domain.Notification, error)
	MarkAsRead(id, recipientID uuid.UUID) error
	MarkAllAsRead(recipientID uuid.UUID) error
	Subscribe(ctx context.Context, recipientID uuid.UUID) *redis.PubSub
}

type notificationUseCase struct {
	notificationRepo postgres.NotificationRepository
	userRepo         postgres.UserRepository
	rdb              *redis.Client
}

func NewNotificationUseCase(
	notificationRepo postgres.NotificationRepository,
	userRepo postgres.UserRepository,
	rdb *redis.Client,
) NotificationUseCase {
	return &notificationUseCase{
		notificationRepo: notificationRepo,
		userRepo:         userRepo,
		rdb:              rdb,
	}
}

func (u *notificationUseCase) CreateNotification(
	ctx context.Context,
	recipientID, senderID uuid.UUID,
	notifType domain.NotificationType,
	message, storySlug string,
) (*domain.Notification, error) {
	// 1. If sender and recipient are the same, don't create notification (e.g. self clap/comment)
	if recipientID == senderID {
		return nil, nil
	}

	// 2. Fetch sender info to embed in notification JSON
	sender, err := u.userRepo.GetByID(senderID)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch sender info: %w", err)
	}
	if sender == nil {
		return nil, fmt.Errorf("sender user not found")
	}

	// 3. Construct message if empty
	finalMessage := message
	if finalMessage == "" {
		switch notifType {
		case domain.NotificationTypeFollow:
			finalMessage = fmt.Sprintf("%s started following you", sender.Username)
		case domain.NotificationTypeClap:
			finalMessage = fmt.Sprintf("%s clapped for your story", sender.Username)
		case domain.NotificationTypeComment:
			finalMessage = fmt.Sprintf("%s commented on your story", sender.Username)
		}
	}

	// 4. Create Notification entity
	notif := &domain.Notification{
		ID:          uuid.New(),
		RecipientID: recipientID,
		SenderID:    senderID,
		Sender:      *sender,
		Type:        notifType,
		Message:     finalMessage,
		StorySlug:   storySlug,
		IsRead:      false,
		CreatedAt:   time.Now(),
	}

	// 4. Save to Database
	if err := u.notificationRepo.Create(notif); err != nil {
		return nil, err
	}

	// 5. Publish to Redis Pub/Sub
	payload, err := json.Marshal(notif)
	if err != nil {
		log.Printf("Warning: failed to marshal notification: %v", err)
		return notif, nil // return notif even if pub/sub fails
	}

	channel := fmt.Sprintf("notifications:user:%s", recipientID.String())
	err = u.rdb.Publish(ctx, channel, payload).Err()
	if err != nil {
		log.Printf("Warning: failed to publish notification to Redis channel %s: %v", channel, err)
	}

	return notif, nil
}

func (u *notificationUseCase) GetNotifications(recipientID uuid.UUID) ([]domain.Notification, error) {
	return u.notificationRepo.GetByRecipientID(recipientID)
}

func (u *notificationUseCase) MarkAsRead(id, recipientID uuid.UUID) error {
	return u.notificationRepo.MarkAsRead(id, recipientID)
}

func (u *notificationUseCase) MarkAllAsRead(recipientID uuid.UUID) error {
	return u.notificationRepo.MarkAllAsRead(recipientID)
}

func (u *notificationUseCase) Subscribe(ctx context.Context, recipientID uuid.UUID) *redis.PubSub {
	channel := fmt.Sprintf("notifications:user:%s", recipientID.String())
	return u.rdb.Subscribe(ctx, channel)
}
