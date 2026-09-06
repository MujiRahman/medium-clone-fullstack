package usecase

import (
	"errors"

	"medium-clone/internal/domain"
	"medium-clone/internal/repository/postgres"
	jwtutils "medium-clone/pkg/jwt"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
	"context"
	"strings"
	"firebase.google.com/go/v4/auth"
)

type RegisterReq struct {
	Username string `json:"username" binding:"required,min=3"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
}

type LoginReq struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

type AuthUseCase interface {
	Register(req RegisterReq) (*domain.User, error)
	Login(req LoginReq) (string, error)
	LoginWithFirebase(idToken string) (string, error)
	GetMe(userID uuid.UUID) (*domain.User, error)
}

type authUseCase struct {
	userRepo     postgres.UserRepository
	firebaseAuth *auth.Client
}

// Custom Errors
var (
	ErrEmailExists    = errors.New("email is already registered")
	ErrUsernameExists = errors.New("username is already taken")
	ErrInvalidCreds   = errors.New("invalid email or password")
)

func NewAuthUseCase(userRepo postgres.UserRepository, firebaseAuth *auth.Client) AuthUseCase {
	return &authUseCase{
		userRepo:     userRepo,
		firebaseAuth: firebaseAuth,
	}
}

func (u *authUseCase) Register(req RegisterReq) (*domain.User, error) {
	// Check email uniqueness
	existingEmail, err := u.userRepo.GetByEmail(req.Email)
	if err != nil {
		return nil, err
	}
	if existingEmail != nil {
		return nil, ErrEmailExists
	}

	// Check username uniqueness
	existingUser, err := u.userRepo.GetByUsername(req.Username)
	if err != nil {
		return nil, err
	}
	if existingUser != nil {
		return nil, ErrUsernameExists
	}

	// Hash password using Bcrypt
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	// Create User Entity
	user := &domain.User{
		Username:     req.Username,
		Email:        req.Email,
		PasswordHash: string(hashedPassword),
	}

	// Save to Repository
	if err := u.userRepo.CreateUser(user); err != nil {
		return nil, err
	}

	return user, nil
}

func (u *authUseCase) Login(req LoginReq) (string, error) {
	// 1. Retrieve User by Email
	user, err := u.userRepo.GetByEmail(req.Email)
	if err != nil {
		return "", err
	}
	if user == nil {
		return "", ErrInvalidCreds // Generic error for security
	}

	// 2. Compare Bcrypt Passwords
	err = bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password))
	if err != nil {
		return "", ErrInvalidCreds
	}

	// 3. Generate JWT Token
	token, err := jwtutils.GenerateToken(user.ID)
	if err != nil {
		return "", err
	}

	return token, nil
}

func (u *authUseCase) GetMe(userID uuid.UUID) (*domain.User, error) {
	user, err := u.userRepo.GetByID(userID)
	if err != nil {
		return nil, err
	}
	if user == nil {
		return nil, errors.New("user not found")
	}
	return user, nil
}

func (u *authUseCase) LoginWithFirebase(idToken string) (string, error) {
	ctx := context.Background()
	token, err := u.firebaseAuth.VerifyIDToken(ctx, idToken)
	if err != nil {
		return "", errors.New("invalid firebase token")
	}

	email, ok := token.Claims["email"].(string)
	if !ok || email == "" {
		return "", errors.New("email not found in token")
	}

	// 1. Retrieve User by Email
	user, err := u.userRepo.GetByEmail(email)
	if err != nil {
		return "", err
	}

	// 2. If user doesn't exist, register them
	if user == nil {
		// Auto-generate username from email
		username := strings.Split(email, "@")[0]
		
		// Ensure username is unique by checking DB
		existingUser, _ := u.userRepo.GetByUsername(username)
		if existingUser != nil {
			// append a random string or just use uid if collision
			username = username + "-" + token.UID[:5]
		}

		user = &domain.User{
			Username:     username,
			Email:        email,
			PasswordHash: "", // Empty password for OAuth
		}

		if err := u.userRepo.CreateUser(user); err != nil {
			return "", err
		}
	}

	// 3. Generate JWT Token
	jwtToken, err := jwtutils.GenerateToken(user.ID)
	if err != nil {
		return "", err
	}

	return jwtToken, nil
}

