package postgres

import (
	"errors"

	"medium-clone/internal/domain"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type UserRepository interface {
	CreateUser(user *domain.User) error
	GetByEmail(email string) (*domain.User, error)
	GetByUsername(username string) (*domain.User, error)
	GetByID(id uuid.UUID) (*domain.User, error)
	UpdateUser(user *domain.User) error
}

type userRepository struct {
	db *gorm.DB
}

func NewUserRepository(db *gorm.DB) UserRepository {
	return &userRepository{db}
}

func (r *userRepository) CreateUser(user *domain.User) error {
	return r.db.Create(user).Error
}

func (r *userRepository) UpdateUser(user *domain.User) error {
	return r.db.Save(user).Error
}

func (r *userRepository) GetByEmail(email string) (*domain.User, error) {
	var user domain.User
	if err := r.db.Where("email = ?", email).First(&user).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil // Return nil, nil if not found
		}
		return nil, err
	}
	return &user, nil
}

func (r *userRepository) GetByUsername(username string) (*domain.User, error) {
	var user domain.User
	if err := r.db.Where("username = ?", username).First(&user).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil // Return nil, nil if not found
		}
		return nil, err
	}
	return &user, nil
}

func (r *userRepository) GetByID(id uuid.UUID) (*domain.User, error) {
	var user domain.User
	if err := r.db.Where("id = ?", id).First(&user).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil // Return nil, nil if not found
		}
		return nil, err
	}
	return &user, nil
}

