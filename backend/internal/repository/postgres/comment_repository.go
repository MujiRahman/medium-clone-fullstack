package postgres

import (
	"medium-clone/internal/domain"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type CommentRepository struct {
	db *gorm.DB
}

func NewCommentRepository(db *gorm.DB) *CommentRepository {
	return &CommentRepository{db: db}
}

func (r *CommentRepository) Create(comment *domain.Comment) error {
	return r.db.Create(comment).Error
}

func (r *CommentRepository) GetByID(id uuid.UUID) (*domain.Comment, error) {
	var comment domain.Comment
	err := r.db.First(&comment, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &comment, nil
}

func (r *CommentRepository) GetByStoryID(storyID uuid.UUID) ([]domain.Comment, error) {
	var comments []domain.Comment
	// One Query fetch! Using Preload for User to display authorship efficiently.
	err := r.db.Preload("User").Where("story_id = ?", storyID).Order("created_at asc").Find(&comments).Error
	return comments, err
}
