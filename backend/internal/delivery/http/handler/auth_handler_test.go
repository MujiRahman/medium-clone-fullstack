package handler_test

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"

	"medium-clone/internal/delivery/http/handler"
	"medium-clone/internal/domain"
	"medium-clone/internal/usecase"
)

// Manual mock for AuthUseCase
type mockAuthUseCase struct {
	mockRegister func(req usecase.RegisterReq) (*domain.User, error)
	mockLogin    func(req usecase.LoginReq) (string, error)
	mockGetMe    func(userID uuid.UUID) (*domain.User, error)
}

func (m *mockAuthUseCase) Register(req usecase.RegisterReq) (*domain.User, error) {
	return m.mockRegister(req)
}

func (m *mockAuthUseCase) Login(req usecase.LoginReq) (string, error) {
	return m.mockLogin(req)
}

func (m *mockAuthUseCase) GetMe(userID uuid.UUID) (*domain.User, error) {
	if m.mockGetMe != nil {
		return m.mockGetMe(userID)
	}
	return nil, nil // Default stub
}

func setupRouter(authHandler *handler.AuthHandler) *gin.Engine {
	gin.SetMode(gin.TestMode)
	r := gin.Default()
	r.POST("/api/auth/register", authHandler.Register)
	r.POST("/api/auth/login", authHandler.Login)
	r.POST("/api/auth/logout", authHandler.Logout)
	return r
}

func TestAuthHandler_Login_Success_SetCookie(t *testing.T) {
	mockUC := &mockAuthUseCase{
		mockLogin: func(req usecase.LoginReq) (string, error) {
			return "dummy.jwt.token", nil
		},
	}
	h := handler.NewAuthHandler(mockUC)
	r := setupRouter(h)

	body := []byte(`{"email":"test@example.com","password":"password"}`)
	req, _ := http.NewRequest(http.MethodPost, "/api/auth/login", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	// Check if Set-Cookie header exists and contains correct directives
	cookies := w.Result().Cookies()
	requireCookieFound := false
	for _, cookie := range cookies {
		if cookie.Name == "jwt_token" {
			requireCookieFound = true
			assert.Equal(t, "dummy.jwt.token", cookie.Value)
			assert.True(t, cookie.HttpOnly, "Cookie must be HttpOnly")
			assert.True(t, cookie.Secure, "Cookie must be Secure")
			assert.Equal(t, http.SameSiteStrictMode, cookie.SameSite, "Cookie must be SameSite=Strict")
			assert.Equal(t, 86400, cookie.MaxAge, "Cookie must have 24h MaxAge")
		}
	}
	assert.True(t, requireCookieFound, "jwt_token cookie was not set")

	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Equal(t, false, response["error"])
	assert.Equal(t, "Login successful", response["message"])
}

func TestAuthHandler_Logout_Success_ClearCookie(t *testing.T) {
	mockUC := &mockAuthUseCase{}
	h := handler.NewAuthHandler(mockUC)
	r := setupRouter(h)

	req, _ := http.NewRequest(http.MethodPost, "/api/auth/logout", nil)
	w := httptest.NewRecorder()

	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	cookies := w.Result().Cookies()
	requireCookieFound := false
	for _, cookie := range cookies {
		if cookie.Name == "jwt_token" {
			requireCookieFound = true
			assert.Empty(t, cookie.Value, "Token should be cleared")
			assert.Equal(t, -1, cookie.MaxAge, "MaxAge should be negative to expire")
		}
	}
	assert.True(t, requireCookieFound, "jwt_token cookie was not set for cleanup")
}

func TestAuthHandler_Register_Success(t *testing.T) {
	mockUC := &mockAuthUseCase{
		mockRegister: func(req usecase.RegisterReq) (*domain.User, error) {
			return &domain.User{
				ID:       uuid.New(),
				Username: req.Username,
				Email:    req.Email,
			}, nil
		},
	}
	h := handler.NewAuthHandler(mockUC)
	r := setupRouter(h)

	body := []byte(`{"username":"test", "email":"test@example.com","password":"password"}`)
	req, _ := http.NewRequest(http.MethodPost, "/api/auth/register", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusCreated, w.Code)
}
