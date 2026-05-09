package middleware

import (
	"errors"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"

	"medium-clone/pkg/response"
)

func JWTMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		tokenString, err := c.Cookie("jwt_token")
		if err != nil {
			response.JSON(c, http.StatusUnauthorized, "Missing authentication cookie", nil)
			c.Abort()
			return
		}

		secret := os.Getenv("JWT_SECRET")
		if secret == "" {
			// Fallback check, although it should be validated at startup
			response.JSON(c, http.StatusInternalServerError, "Server error: secret not configured", nil)
			c.Abort()
			return
		}

		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, errors.New("unexpected signing method")
			}
			return []byte(secret), nil
		})

		if err != nil || !token.Valid {
			response.JSON(c, http.StatusUnauthorized, "Invalid or expired token", nil)
			c.Abort()
			return
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			response.JSON(c, http.StatusUnauthorized, "Invalid token claims", nil)
			c.Abort()
			return
		}

		userID, ok := claims["sub"].(string)
		if !ok {
			response.JSON(c, http.StatusUnauthorized, "Invalid user identifier in token", nil)
			c.Abort()
			return
		}

		// Set Context
		c.Set("user_id", userID)

		c.Next()
	}
}
