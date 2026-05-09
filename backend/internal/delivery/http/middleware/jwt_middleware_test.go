package middleware_test

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"

	"medium-clone/internal/delivery/http/middleware"
	jwtutils "medium-clone/pkg/jwt"
)

func TestJWTMiddleware_NoCookie(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.Default()
	r.Use(middleware.JWTMiddleware())
	r.GET("/protected", func(c *gin.Context) {
		c.String(http.StatusOK, "success")
	})

	req, _ := http.NewRequest(http.MethodGet, "/protected", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	// Asserts
	assert.Equal(t, http.StatusUnauthorized, w.Code)
	
	var res map[string]interface{}
	json.Unmarshal(w.Body.Bytes(), &res)
	assert.Equal(t, true, res["error"])
	assert.Equal(t, "Missing authentication cookie", res["message"])
}

func TestJWTMiddleware_ValidCookie(t *testing.T) {
	// Setup test secret using jwtutils
	testSecret := "super_secret_test_middleware"
	jwtutils.SetSecretForTest(testSecret)
	
	// Create a valid token
	userID := uuid.New()
	claims := jwt.RegisteredClaims{
		Subject:   userID.String(),
		ExpiresAt: jwt.NewNumericDate(time.Now().Add(1 * time.Hour)),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, _ := token.SignedString([]byte(testSecret))

	// Setup Gin
	gin.SetMode(gin.TestMode)
	r := gin.Default()
	
	// Inject secret for the middleware to read
	t.Setenv("JWT_SECRET", testSecret)

	r.Use(middleware.JWTMiddleware())
	r.GET("/protected", func(c *gin.Context) {
		// Context should have the user_id extracted by middleware
		extractedUserID, exists := c.Get("user_id")
		if !exists {
			c.String(http.StatusInternalServerError, "user_id not in context")
			return
		}
		c.String(http.StatusOK, extractedUserID.(string))
	})

	req, _ := http.NewRequest(http.MethodGet, "/protected", nil)
	req.AddCookie(&http.Cookie{
		Name:  "jwt_token",
		Value: tokenString,
	})

	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	assert.Equal(t, userID.String(), w.Body.String())
}
