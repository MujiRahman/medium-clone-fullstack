package postgres

import (
	"errors"

	"medium-clone/internal/domain"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type ClapRepository interface {
	GetClapByUserAndStory(userID, storyID uuid.UUID) (*domain.Clap, error)
	GetTotalClapsByStory(storyID uuid.UUID) (int, error)
	SaveClap(clap *domain.Clap) error
}

type clapRepository struct {
	db *gorm.DB
}

func NewClapRepository(db *gorm.DB) ClapRepository {
	return &clapRepository{db}
}

func (r *clapRepository) GetClapByUserAndStory(userID, storyID uuid.UUID) (*domain.Clap, error) {
	var clap domain.Clap
	err := r.db.Where("user_id = ? AND story_id = ?", userID, storyID).First(&clap).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &clap, nil
}

func (r *clapRepository) GetTotalClapsByStory(storyID uuid.UUID) (int, error) {
	var total int64
	err := r.db.Model(&domain.Clap{}).Where("story_id = ?", storyID).Select("COALESCE(SUM(count), 0)").Scan(&total).Error
	return int(total), err
}

func (r *clapRepository) SaveClap(clap *domain.Clap) error {
	return r.db.Save(clap).Error // Save will INSERT if primary key is uninitialized or UPDATE if initialized
}
