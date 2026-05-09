package postgres

import (
	"errors"

	"medium-clone/internal/domain"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type StoryRepository interface {
	CreateStory(story *domain.Story) error
	GetByID(id uuid.UUID) (*domain.Story, error)
	GetBySlug(slug string) (*domain.Story, error)
	GetPublishedStories() ([]*domain.Story, error)
	UpdateStory(story *domain.Story) error
}

type storyRepository struct {
	db *gorm.DB
}

func NewStoryRepository(db *gorm.DB) StoryRepository {
	return &storyRepository{db}
}

func (r *storyRepository) CreateStory(story *domain.Story) error {
	return r.db.Create(story).Error
}

func (r *storyRepository) GetByID(id uuid.UUID) (*domain.Story, error) {
	var story domain.Story
	err := r.db.Preload("Author").Where("id = ?", id).First(&story).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil // Return nil wrapper on not found
		}
		return nil, err
	}
	return &story, nil
}

func (r *storyRepository) GetBySlug(slug string) (*domain.Story, error) {
	var story domain.Story
	err := r.db.Preload("Author").
		Select("stories.*, COALESCE((SELECT SUM(count) FROM claps WHERE claps.story_id = stories.id), 0) AS total_claps").
		Where("slug = ? AND status = ?", slug, domain.StoryStatusPublished).First(&story).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &story, nil
}

func (r *storyRepository) UpdateStory(story *domain.Story) error {
	return r.db.Save(story).Error
}

func (r *storyRepository) GetPublishedStories() ([]*domain.Story, error) {
	var stories []*domain.Story
	err := r.db.Preload("Author").
		Select("stories.*, COALESCE((SELECT SUM(count) FROM claps WHERE claps.story_id = stories.id), 0) AS total_claps").
		Where("status = ?", domain.StoryStatusPublished).Order("published_at DESC").Find(&stories).Error
	return stories, err
}

