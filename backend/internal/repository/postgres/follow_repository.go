package postgres

import (
	"time"

	"medium-clone/internal/domain"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type FollowRepository interface {
	Follow(followerID, followingID uuid.UUID) error
	Unfollow(followerID, followingID uuid.UUID) error
	IsFollowing(followerID, followingID uuid.UUID) (bool, error)
	GetFollowersCount(userID uuid.UUID) (int64, error)
	GetFollowingCount(userID uuid.UUID) (int64, error)
}

type followRepository struct {
	db *gorm.DB
}

func NewFollowRepository(db *gorm.DB) FollowRepository {
	return &followRepository{db}
}

func (r *followRepository) Follow(followerID, followingID uuid.UUID) error {
	follow := &domain.Follow{
		FollowerID:  followerID,
		FollowingID: followingID,
		CreatedAt:   time.Now(),
	}
	// Use clauses or FirstOrCreate to avoid primary key conflicts if already following
	return r.db.FirstOrCreate(follow, &domain.Follow{
		FollowerID:  followerID,
		FollowingID: followingID,
	}).Error
}

func (r *followRepository) Unfollow(followerID, followingID uuid.UUID) error {
	return r.db.Delete(&domain.Follow{}, "follower_id = ? AND following_id = ?", followerID, followingID).Error
}

func (r *followRepository) IsFollowing(followerID, followingID uuid.UUID) (bool, error) {
	var count int64
	err := r.db.Model(&domain.Follow{}).
		Where("follower_id = ? AND following_id = ?", followerID, followingID).
		Count(&count).Error
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

func (r *followRepository) GetFollowersCount(userID uuid.UUID) (int64, error) {
	var count int64
	err := r.db.Model(&domain.Follow{}).Where("following_id = ?", userID).Count(&count).Error
	return count, err
}

func (r *followRepository) GetFollowingCount(userID uuid.UUID) (int64, error) {
	var count int64
	err := r.db.Model(&domain.Follow{}).Where("follower_id = ?", userID).Count(&count).Error
	return count, err
}
