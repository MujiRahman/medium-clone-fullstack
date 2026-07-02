package postgres

import (
	"medium-clone/internal/domain"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type AnalyticsRepository interface {
	CreateRecord(record *domain.ArticleAnalytics) error
	GetAuthorStories(authorID uuid.UUID) ([]*domain.Story, error)
	GetAnalyticsRecords(articleIDs []uuid.UUID, since time.Time) ([]*domain.ArticleAnalytics, error)
	GetStoriesClapsCount(articleIDs []uuid.UUID) (map[uuid.UUID]int, error)
	GetStoriesCommentsCount(articleIDs []uuid.UUID) (map[uuid.UUID]int, error)
}

type analyticsRepository struct {
	db *gorm.DB
}

func NewAnalyticsRepository(db *gorm.DB) AnalyticsRepository {
	return &analyticsRepository{db}
}

func (r *analyticsRepository) CreateRecord(record *domain.ArticleAnalytics) error {
	return r.db.Create(record).Error
}

func (r *analyticsRepository) GetAuthorStories(authorID uuid.UUID) ([]*domain.Story, error) {
	var stories []*domain.Story
	err := r.db.Where("author_id = ? AND status = ?", authorID, domain.StoryStatusPublished).Find(&stories).Error
	return stories, err
}

func (r *analyticsRepository) GetAnalyticsRecords(articleIDs []uuid.UUID, since time.Time) ([]*domain.ArticleAnalytics, error) {
	var records []*domain.ArticleAnalytics
	if len(articleIDs) == 0 {
		return records, nil
	}
	query := r.db.Where("article_id IN ?", articleIDs)
	if !since.IsZero() {
		query = query.Where("timestamp >= ?", since)
	}
	err := query.Find(&records).Error
	return records, err
}

func (r *analyticsRepository) GetStoriesClapsCount(articleIDs []uuid.UUID) (map[uuid.UUID]int, error) {
	m := make(map[uuid.UUID]int)
	if len(articleIDs) == 0 {
		return m, nil
	}
	type Result struct {
		StoryID uuid.UUID
		Total   int
	}
	var results []Result
	err := r.db.Model(&domain.Clap{}).
		Select("story_id, SUM(count) as total").
		Where("story_id IN ?", articleIDs).
		Group("story_id").
		Scan(&results).Error
	if err != nil {
		return nil, err
	}

	for _, res := range results {
		m[res.StoryID] = res.Total
	}
	return m, nil
}

func (r *analyticsRepository) GetStoriesCommentsCount(articleIDs []uuid.UUID) (map[uuid.UUID]int, error) {
	m := make(map[uuid.UUID]int)
	if len(articleIDs) == 0 {
		return m, nil
	}
	type Result struct {
		StoryID uuid.UUID
		Total   int
	}
	var results []Result
	err := r.db.Model(&domain.Comment{}).
		Select("story_id, COUNT(id) as total").
		Where("story_id IN ?", articleIDs).
		Group("story_id").
		Scan(&results).Error
	if err != nil {
		return nil, err
	}

	for _, res := range results {
		m[res.StoryID] = res.Total
	}
	return m, nil
}

