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

// Manual mock for StoryUseCase
type mockStoryUseCase struct {
	mockCreateDraft      func(authorID uuid.UUID, req usecase.CreateStoryReq) (*domain.Story, error)
	mockUpdateStory      func(reqUserID uuid.UUID, storyID uuid.UUID, req usecase.UpdateStoryReq) (*domain.Story, error)
	mockGetPublished     func(slug string) (*domain.Story, error)
	mockGetPublishedStories func() ([]*domain.Story, error)
	mockAddClap          func(userID uuid.UUID, storyID uuid.UUID, req usecase.AddClapReq) (*domain.Clap, error)
}

func (m *mockStoryUseCase) CreateDraft(authorID uuid.UUID, req usecase.CreateStoryReq) (*domain.Story, error) {
	return m.mockCreateDraft(authorID, req)
}
func (m *mockStoryUseCase) UpdateStory(reqUserID uuid.UUID, storyID uuid.UUID, req usecase.UpdateStoryReq) (*domain.Story, error) {
	return m.mockUpdateStory(reqUserID, storyID, req)
}
func (m *mockStoryUseCase) GetPublishedStoryBySlug(slug string) (*domain.Story, error) {
	return m.mockGetPublished(slug)
}
func (m *mockStoryUseCase) GetPublishedStories() ([]*domain.Story, error) {
	if m.mockGetPublishedStories != nil {
		return m.mockGetPublishedStories()
	}
	return nil, nil
}
func (m *mockStoryUseCase) AddClap(userID uuid.UUID, storyID uuid.UUID, req usecase.AddClapReq) (*domain.Clap, error) {
	return m.mockAddClap(userID, storyID, req)
}

// Dummy middleware to inject user_id context for protected routes
func dummyAuthMiddleware(userID string) gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Set("user_id", userID)
		c.Next()
	}
}

func setupStoryRouter(storyHandler *handler.StoryHandler, userID string) *gin.Engine {
	gin.SetMode(gin.TestMode)
	r := gin.Default()
	
	// Protected
	protected := r.Group("/")
	protected.Use(dummyAuthMiddleware(userID))
	protected.PUT("/api/stories/:id", storyHandler.UpdateStory)
	protected.POST("/api/stories/:id/clap", storyHandler.ClapStory)
	
	return r
}

func TestStoryHandler_UpdateStory_Forbidden(t *testing.T) {
	mockUC := &mockStoryUseCase{
		mockUpdateStory: func(reqUserID, storyID uuid.UUID, req usecase.UpdateStoryReq) (*domain.Story, error) {
			return nil, usecase.ErrForbidden
		},
	}
	h := handler.NewStoryHandler(mockUC)
	userID := uuid.New().String()
	r := setupStoryRouter(h, userID)

	storyID := uuid.New().String()
	body := []byte(`{"title":"New Title"}`)
	req, _ := http.NewRequest(http.MethodPut, "/api/stories/"+storyID, bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusForbidden, w.Code)
	
	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Equal(t, true, response["error"])
	assert.Equal(t, usecase.ErrForbidden.Error(), response["message"])
}

func TestStoryHandler_AddClap_ExceedMax(t *testing.T) {
	mockUC := &mockStoryUseCase{
		mockAddClap: func(userID, storyID uuid.UUID, req usecase.AddClapReq) (*domain.Clap, error) {
			return nil, usecase.ErrMaxClapsExceed
		},
	}
	h := handler.NewStoryHandler(mockUC)
	userID := uuid.New().String()
	r := setupStoryRouter(h, userID)

	storyID := uuid.New().String()
	body := []byte(`{"count":20}`)
	req, _ := http.NewRequest(http.MethodPost, "/api/stories/"+storyID+"/clap", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
	
	var response map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Equal(t, true, response["error"])
	assert.Equal(t, usecase.ErrMaxClapsExceed.Error(), response["message"])
}
