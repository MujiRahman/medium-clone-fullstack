package domain

import (
	"time"

	"github.com/google/uuid"
)

type Follow struct {
	FollowerID  uuid.UUID `gorm:"type:uuid;primaryKey;index" json:"follower_id"`
	Follower    User      `gorm:"foreignKey:FollowerID;constraint:OnDelete:CASCADE" json:"follower,omitempty"`
	FollowingID uuid.UUID `gorm:"type:uuid;primaryKey;index" json:"following_id"`
	Following   User      `gorm:"foreignKey:FollowingID;constraint:OnDelete:CASCADE" json:"following,omitempty"`
	CreatedAt   time.Time `json:"created_at"`
}
