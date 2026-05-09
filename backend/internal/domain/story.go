package domain

import (
	"errors"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type StoryStatus string

const (
	StoryStatusDraft     StoryStatus = "draft"
	StoryStatusPublished StoryStatus = "published"
)

type Story struct {
	ID          uuid.UUID   `gorm:"type:uuid;primaryKey" json:"id"`
	AuthorID    uuid.UUID   `gorm:"type:uuid;not null;index" json:"author_id"`
	Author      User        `gorm:"foreignKey:AuthorID" json:"author"`
	Title       string      `gorm:"not null" json:"title"`
	Slug        string      `gorm:"uniqueIndex;not null" json:"slug"`
	Content     string      `gorm:"type:text" json:"content"`
	Status      StoryStatus `gorm:"type:varchar(20);not null" json:"status"`
	TotalClaps  int         `gorm:"->" json:"total_claps"`
	PublishedAt *time.Time  `json:"published_at"`
	CreatedAt   time.Time   `json:"created_at"`
	UpdatedAt   time.Time   `json:"updated_at"`
}

// BeforeCreate hook to generate UUID at application level
func (s *Story) BeforeCreate(tx *gorm.DB) (err error) {
	if s.ID == uuid.Nil {
		s.ID = uuid.New()
	}

	// Validate status
	if s.Status != StoryStatusDraft && s.Status != StoryStatusPublished {
		return errors.New("invalid story status")
	}

	return
}

// BeforeSave hook to validate logic on updates
func (s *Story) BeforeSave(tx *gorm.DB) (err error) {
	if s.Status != StoryStatusDraft && s.Status != StoryStatusPublished {
		return errors.New("invalid story status")
	}
	return
}
