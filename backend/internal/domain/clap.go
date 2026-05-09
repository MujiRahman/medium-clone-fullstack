package domain

import (
	"errors"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Clap struct {
	ID      uuid.UUID `gorm:"type:uuid;primaryKey"`
	UserID  uuid.UUID `gorm:"type:uuid;not null;uniqueIndex:idx_user_story"`
	User    User      `gorm:"foreignKey:UserID"`
	StoryID uuid.UUID `gorm:"type:uuid;not null;uniqueIndex:idx_user_story"`
	Story   Story     `gorm:"foreignKey:StoryID"`
	Count   int       `gorm:"not null"`
}

func (c *Clap) BeforeCreate(tx *gorm.DB) (err error) {
	if c.ID == uuid.Nil {
		c.ID = uuid.New()
	}

	if c.Count < 0 || c.Count > 50 {
		return errors.New("clap count must be between 0 and 50")
	}

	return
}

func (c *Clap) BeforeSave(tx *gorm.DB) (err error) {
	if c.Count < 0 || c.Count > 50 {
		return errors.New("clap count must be between 0 and 50")
	}
	return
}
