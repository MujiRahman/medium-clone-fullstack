package usecase

import (
	"context"
	"fmt"

	"medium-clone/internal/domain"
	"medium-clone/internal/repository/postgres"

	"github.com/google/uuid"
)

type FollowUseCase interface {
	Follow(ctx context.Context, followerID, followingID uuid.UUID) error
	Unfollow(ctx context.Context, followerID, followingID uuid.UUID) error
	IsFollowing(ctx context.Context, followerID, followingID uuid.UUID) (bool, error)
	GetFollowStats(ctx context.Context, userID uuid.UUID) (followers int64, following int64, err error)
}

type followUseCase struct {
	followRepo   postgres.FollowRepository
	userRepo     postgres.UserRepository
	notifUseCase NotificationUseCase
}

func NewFollowUseCase(
	followRepo postgres.FollowRepository,
	userRepo postgres.UserRepository,
	notifUseCase NotificationUseCase,
) FollowUseCase {
	return &followUseCase{
		followRepo:   followRepo,
		userRepo:     userRepo,
		notifUseCase: notifUseCase,
	}
}

func (u *followUseCase) Follow(ctx context.Context, followerID, followingID uuid.UUID) error {
	if followerID == followingID {
		return fmt.Errorf("you cannot follow yourself")
	}

	// Verify target user exists
	targetUser, err := u.userRepo.GetByID(followingID)
	if err != nil {
		return err
	}
	if targetUser == nil {
		return fmt.Errorf("user to follow not found")
	}

	// Perform follow action
	if err := u.followRepo.Follow(followerID, followingID); err != nil {
		return err
	}

	// Fetch follower's details to compose the notification message
	follower, err := u.userRepo.GetByID(followerID)
	if err == nil && follower != nil {
		msg := fmt.Sprintf("%s started following you", follower.Username)
		_, _ = u.notifUseCase.CreateNotification(ctx, followingID, followerID, domain.NotificationTypeFollow, msg, "")
	}

	return nil
}

func (u *followUseCase) Unfollow(ctx context.Context, followerID, followingID uuid.UUID) error {
	return u.followRepo.Unfollow(followerID, followingID)
}

func (u *followUseCase) IsFollowing(ctx context.Context, followerID, followingID uuid.UUID) (bool, error) {
	return u.followRepo.IsFollowing(followerID, followingID)
}

func (u *followUseCase) GetFollowStats(ctx context.Context, userID uuid.UUID) (followers int64, following int64, err error) {
	followers, err = u.followRepo.GetFollowersCount(userID)
	if err != nil {
		return 0, 0, err
	}
	following, err = u.followRepo.GetFollowingCount(userID)
	if err != nil {
		return 0, 0, err
	}
	return followers, following, nil
}
