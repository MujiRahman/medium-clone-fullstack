package usecase

import (
	"errors"
	"time"
	"context"
	"fmt"

	"medium-clone/internal/domain"
	"medium-clone/internal/repository/postgres"
	"medium-clone/pkg/utils"

	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
)

type CreateStoryReq struct {
	Title   string `json:"title" binding:"required"`
	Content string `json:"content" binding:"required"`
}

type UpdateStoryReq struct {
	Title   string  `json:"title"`
	Content string  `json:"content"`
	Status  *string `json:"status"` // Optional field, if changing to published
	TLDR    string  `json:"tldr"`
	Tags    string  `json:"tags"`
}

type AddClapReq struct {
	Count int `json:"count" binding:"required,min=1"`
}

type StoryUseCase interface {
	CreateDraft(authorID uuid.UUID, req CreateStoryReq) (*domain.Story, error)
	UpdateStory(reqUserID uuid.UUID, storyID uuid.UUID, req UpdateStoryReq) (*domain.Story, error)
	GetPublishedStoryBySlug(slug string) (*domain.Story, error)
	GetPublishedStories() ([]*domain.Story, error)
	AddClap(userID uuid.UUID, storyID uuid.UUID, req AddClapReq) (*domain.Clap, error)
	GetStoryByID(reqUserID uuid.UUID, storyID uuid.UUID) (*domain.Story, error)
	DeleteStory(reqUserID uuid.UUID, storyID uuid.UUID) error
}

type storyUseCase struct {
	storyRepo    postgres.StoryRepository
	clapRepo     postgres.ClapRepository
	rdb          *redis.Client
	notifUseCase NotificationUseCase
}

var (
	ErrForbidden      = errors.New("you do not have permission to modify this story")
	ErrStoryNotFound  = errors.New("story not found")
	ErrMaxClapsExceed = errors.New("maximum 50 claps exceeded for this story")
)

func NewStoryUseCase(
	storyRepo postgres.StoryRepository,
	clapRepo postgres.ClapRepository,
	rdb *redis.Client,
	notifUseCase NotificationUseCase,
) StoryUseCase {
	return &storyUseCase{
		storyRepo:    storyRepo,
		clapRepo:     clapRepo,
		rdb:          rdb,
		notifUseCase: notifUseCase,
	}
}

func (u *storyUseCase) CreateDraft(authorID uuid.UUID, req CreateStoryReq) (*domain.Story, error) {
	story := &domain.Story{
		AuthorID: authorID,
		Title:    req.Title,
		Content:  req.Content,
		Slug:     utils.GenerateUniqueSlug(req.Title),
		Status:   domain.StoryStatusDraft,
	}

	if err := u.storyRepo.CreateStory(story); err != nil {
		return nil, err
	}

	// Invalidate insights cache
	ctx := context.Background()
	u.rdb.Del(ctx, fmt.Sprintf("insights:%s", authorID.String()))

	return story, nil
}

func (u *storyUseCase) UpdateStory(reqUserID uuid.UUID, storyID uuid.UUID, req UpdateStoryReq) (*domain.Story, error) {
	story, err := u.storyRepo.GetByID(storyID)
	if err != nil {
		return nil, err
	}
	if story == nil {
		return nil, ErrStoryNotFound
	}

	// Validate authorization
	if story.AuthorID != reqUserID {
		return nil, ErrForbidden
	}

	// Update fields
	if req.Title != "" {
		story.Title = req.Title
		story.Slug = utils.GenerateUniqueSlug(req.Title) // Re-generate slug if title changes
	}
	if req.Content != "" {
		story.Content = req.Content
	}
	if req.TLDR != "" {
		story.TLDR = req.TLDR
	}
	if req.Tags != "" {
		story.Tags = req.Tags
	}

	if req.Status != nil {
		status := domain.StoryStatus(*req.Status)
		// Domain hook will validate if it's draft or published
		if status == domain.StoryStatusPublished && story.Status != domain.StoryStatusPublished {
			now := time.Now()
			story.PublishedAt = &now
		}
		story.Status = status
	}

	if err := u.storyRepo.UpdateStory(story); err != nil {
		return nil, err
	}

	// Invalidate insights cache
	ctx := context.Background()
	u.rdb.Del(ctx, fmt.Sprintf("insights:%s", reqUserID.String()))

	return story, nil
}

func (u *storyUseCase) GetPublishedStoryBySlug(slug string) (*domain.Story, error) {
	story, err := u.storyRepo.GetBySlug(slug)
	if err != nil {
		return nil, err
	}
	if story == nil {
		return nil, ErrStoryNotFound
	}

	return story, nil
}

func (u *storyUseCase) GetPublishedStories() ([]*domain.Story, error) {
	return u.storyRepo.GetPublishedStories()
}

func (u *storyUseCase) AddClap(userID uuid.UUID, storyID uuid.UUID, req AddClapReq) (*domain.Clap, error) {
	// Let's verify the story exists
	story, err := u.storyRepo.GetByID(storyID)
	if err != nil {
		return nil, err
	}
	if story == nil {
		return nil, ErrStoryNotFound
	}

	// Retrieve existing clap to check aggregate
	clap, err := u.clapRepo.GetClapByUserAndStory(userID, storyID)
	if err != nil {
		return nil, err
	}

	var totalClapsAfter int

	if clap == nil {
		// First clap from this user
		totalClapsAfter = req.Count
		clap = &domain.Clap{
			UserID:  userID,
			StoryID: storyID,
			Count:   req.Count,
		}
	} else {
		// Existing claps, add the new ones
		totalClapsAfter = clap.Count + req.Count
		clap.Count = totalClapsAfter
	}

	if totalClapsAfter > 50 {
		return nil, ErrMaxClapsExceed
	}

	// Save
	if err := u.clapRepo.SaveClap(clap); err != nil {
		return nil, err
	}

	// Trigger clap notification to the author
	if story.AuthorID != userID {
		go func() {
			_, _ = u.notifUseCase.CreateNotification(context.Background(), story.AuthorID, userID, domain.NotificationTypeClap, "", story.Slug)
		}()
	}

	return clap, nil
}

func (u *storyUseCase) GetStoryByID(reqUserID uuid.UUID, storyID uuid.UUID) (*domain.Story, error) {
	story, err := u.storyRepo.GetByID(storyID)
	if err != nil {
		return nil, err
	}
	if story == nil {
		return nil, ErrStoryNotFound
	}
	// Validate authorization
	if story.AuthorID != reqUserID {
		return nil, ErrForbidden
	}
	return story, nil
}

func (u *storyUseCase) DeleteStory(reqUserID uuid.UUID, storyID uuid.UUID) error {
	story, err := u.storyRepo.GetByID(storyID)
	if err != nil {
		return err
	}
	if story == nil {
		return ErrStoryNotFound
	}
	if story.AuthorID != reqUserID {
		return ErrForbidden
	}
	return u.storyRepo.DeleteStory(storyID)
}
