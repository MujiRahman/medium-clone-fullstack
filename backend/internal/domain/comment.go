package domain

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Comment struct {
	ID        uuid.UUID  `gorm:"type:uuid;primaryKey" json:"id"`
	StoryID   uuid.UUID  `gorm:"type:uuid;not null;index" json:"story_id"`
	Story     Story      `gorm:"foreignKey:StoryID" json:"-"`
	UserID    uuid.UUID  `gorm:"type:uuid;not null;index" json:"user_id"`
	User      User       `gorm:"foreignKey:UserID" json:"user"`
	Body      string     `gorm:"type:text;not null" json:"body"`
	ParentID  *uuid.UUID `gorm:"type:uuid;index;default:null" json:"parent_id"`
	Parent    *Comment   `gorm:"foreignKey:ParentID;constraint:OnDelete:CASCADE;" json:"-"`
	CreatedAt time.Time  `json:"created_at"`
}

func (c *Comment) BeforeCreate(tx *gorm.DB) (err error) {
	if c.ID == uuid.Nil {
		c.ID = uuid.New()
	}
	return
}
