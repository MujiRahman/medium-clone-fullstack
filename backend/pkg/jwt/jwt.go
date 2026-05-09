package jwtutils

import (
	"errors"
	"log"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

var secretKey []byte

// InitJWT ensures that JWT_SECRET is present at application startup.
// Must be called in main.go
func InitJWT() {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		log.Fatalf("FATAL ERROR: JWT_SECRET environment variable is missing or empty")
	}
	secretKey = []byte(secret)
}

// GenerateToken creates a JWT token with a 24-hour TTL
func GenerateToken(userID uuid.UUID) (string, error) {
	if len(secretKey) == 0 {
		return "", errors.New("JWT secret not initialized")
	}

	claims := jwt.RegisteredClaims{
		Subject:   userID.String(),
		ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
		IssuedAt:  jwt.NewNumericDate(time.Now()),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(secretKey)
}

// SetSecretForTest is used in unit tests to avoid panic
func SetSecretForTest(secret string) {
	secretKey = []byte(secret)
}
