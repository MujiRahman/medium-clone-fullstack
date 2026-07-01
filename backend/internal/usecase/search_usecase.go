package usecase

import (
	"context"
	"medium-clone/internal/domain"

	"gorm.io/gorm"
)

type SearchResult struct {
	Stories []domain.Story `json:"stories"`
	Users   []domain.User  `json:"users"`
}

type SearchUseCase interface {
	Autocomplete(ctx context.Context, query string) (*SearchResult, error)
}

type searchUseCase struct {
	db *gorm.DB
}

func NewSearchUseCase(db *gorm.DB) SearchUseCase {
	return &searchUseCase{db: db}
}

func (u *searchUseCase) Autocomplete(ctx context.Context, query string) (*SearchResult, error) {
	if len(query) < 2 {
		return &SearchResult{
			Stories: []domain.Story{},
			Users:   []domain.User{},
		}, nil
	}

	var stories []domain.Story
	var users []domain.User
	likeQuery := "%" + query + "%"

	// Find stories (fuzzy match via trigram and prefix match)
	err := u.db.Preload("Author").
		Select("stories.*, similarity(title, ?) as score", query).
		Where("status = ? AND (title % ? OR title ILIKE ?)", domain.StoryStatusPublished, query, likeQuery).
		Order("score DESC, published_at DESC").
		Limit(6).
		Find(&stories).Error
	if err != nil {
		return nil, err
	}

	// Find users (fuzzy match via username and prefix match)
	err = u.db.
		Select("users.*, similarity(username, ?) as score", query).
		Where("username % ? OR username ILIKE ?", query, likeQuery).
		Order("score DESC").
		Limit(6).
		Find(&users).Error
	if err != nil {
		return nil, err
	}

	// Ensure fields are slice-initialized instead of nil
	if stories == nil {
		stories = []domain.Story{}
	}
	if users == nil {
		users = []domain.User{}
	}

	return &SearchResult{
		Stories: stories,
		Users:   users,
	}, nil
}
