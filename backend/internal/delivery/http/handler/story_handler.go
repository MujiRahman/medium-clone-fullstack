package handler

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"medium-clone/internal/usecase"
	"medium-clone/pkg/response"
)

type StoryHandler struct {
	storyUseCase usecase.StoryUseCase
}

func NewStoryHandler(uc usecase.StoryUseCase) *StoryHandler {
	return &StoryHandler{storyUseCase: uc}
}

// Helper to get UUID from gin Context
func getUserIDFromCtx(c *gin.Context) (uuid.UUID, error) {
	val, exists := c.Get("user_id")
	if !exists {
		return uuid.Nil, errors.New("user_id not found in context")
	}
	userIDStr, ok := val.(string)
	if !ok {
		return uuid.Nil, errors.New("user_id is not a string")
	}
	return uuid.Parse(userIDStr)
}

func (h *StoryHandler) GetStories(c *gin.Context) {
	stories, err := h.storyUseCase.GetPublishedStories()
	if err != nil {
		response.JSON(c, http.StatusInternalServerError, "Failed to get stories", nil)
		return
	}
	response.JSON(c, http.StatusOK, "Success", stories)
}

func (h *StoryHandler) GetStoryBySlug(c *gin.Context) {
	slug := c.Param("slug")
	if slug == "" {
		response.JSON(c, http.StatusBadRequest, "Slug is required", nil)
		return
	}

	story, err := h.storyUseCase.GetPublishedStoryBySlug(slug)
	if err != nil {
		if errors.Is(err, usecase.ErrStoryNotFound) {
			response.JSON(c, http.StatusNotFound, "Story not found", nil)
			return
		}
		response.JSON(c, http.StatusInternalServerError, "Failed to get story", nil)
		return
	}

	response.JSON(c, http.StatusOK, "Success", story)
}

func (h *StoryHandler) CreateStory(c *gin.Context) {
	userID, err := getUserIDFromCtx(c)
	if err != nil {
		response.JSON(c, http.StatusUnauthorized, "Unauthorized", nil)
		return
	}

	var req usecase.CreateStoryReq
	if err := c.ShouldBindJSON(&req); err != nil {
		response.JSON(c, http.StatusBadRequest, "Invalid request body", nil)
		return
	}

	story, err := h.storyUseCase.CreateDraft(userID, req)
	if err != nil {
		response.JSON(c, http.StatusInternalServerError, "Failed to create draft", nil)
		return
	}

	response.JSON(c, http.StatusCreated, "Draft created", story)
}

func (h *StoryHandler) UpdateStory(c *gin.Context) {
	userID, err := getUserIDFromCtx(c)
	if err != nil {
		response.JSON(c, http.StatusUnauthorized, "Unauthorized", nil)
		return
	}

	storyIDStr := c.Param("id")
	storyID, err := uuid.Parse(storyIDStr)
	if err != nil {
		response.JSON(c, http.StatusBadRequest, "Invalid story ID", nil)
		return
	}

	var req usecase.UpdateStoryReq
	if err := c.ShouldBindJSON(&req); err != nil {
		response.JSON(c, http.StatusBadRequest, "Invalid request body", err.Error())
		return
	}

	story, err := h.storyUseCase.UpdateStory(userID, storyID, req)
	if err != nil {
		if errors.Is(err, usecase.ErrForbidden) {
			response.JSON(c, http.StatusForbidden, err.Error(), nil)
			return
		}
		if errors.Is(err, usecase.ErrStoryNotFound) {
			response.JSON(c, http.StatusNotFound, err.Error(), nil)
			return
		}
		response.JSON(c, http.StatusInternalServerError, "Failed to update story", nil)
		return
	}

	response.JSON(c, http.StatusOK, "Story updated", story)
}

func (h *StoryHandler) ClapStory(c *gin.Context) {
	userID, err := getUserIDFromCtx(c)
	if err != nil {
		response.JSON(c, http.StatusUnauthorized, "Unauthorized", nil)
		return
	}

	storyIDStr := c.Param("id")
	storyID, err := uuid.Parse(storyIDStr)
	if err != nil {
		response.JSON(c, http.StatusBadRequest, "Invalid story ID", nil)
		return
	}

	var req usecase.AddClapReq
	if err := c.ShouldBindJSON(&req); err != nil {
		response.JSON(c, http.StatusBadRequest, "Invalid request body", nil)
		return
	}

	clap, err := h.storyUseCase.AddClap(userID, storyID, req)
	if err != nil {
		if errors.Is(err, usecase.ErrMaxClapsExceed) {
			response.JSON(c, http.StatusBadRequest, err.Error(), nil)
			return
		}
		if errors.Is(err, usecase.ErrStoryNotFound) {
			response.JSON(c, http.StatusNotFound, err.Error(), nil)
			return
		}
		response.JSON(c, http.StatusInternalServerError, "Failed to add clap", nil)
		return
	}

	response.JSON(c, http.StatusOK, "Clap added successfully", clap)
}

func (h *StoryHandler) GetStoryByID(c *gin.Context) {
	userID, err := getUserIDFromCtx(c)
	if err != nil {
		response.JSON(c, http.StatusUnauthorized, "Unauthorized", nil)
		return
	}

	storyIDStr := c.Param("id")
	storyID, err := uuid.Parse(storyIDStr)
	if err != nil {
		response.JSON(c, http.StatusBadRequest, "Invalid story ID", nil)
		return
	}

	story, err := h.storyUseCase.GetStoryByID(userID, storyID)
	if err != nil {
		if errors.Is(err, usecase.ErrForbidden) {
			response.JSON(c, http.StatusForbidden, err.Error(), nil)
			return
		}
		if errors.Is(err, usecase.ErrStoryNotFound) {
			response.JSON(c, http.StatusNotFound, err.Error(), nil)
			return
		}
		response.JSON(c, http.StatusInternalServerError, "Failed to get story", nil)
		return
	}

	response.JSON(c, http.StatusOK, "Success", story)
}

func (h *StoryHandler) DeleteStory(c *gin.Context) {
	userID, err := getUserIDFromCtx(c)
	if err != nil {
		response.JSON(c, http.StatusUnauthorized, "Unauthorized", nil)
		return
	}

	storyIDStr := c.Param("id")
	storyID, err := uuid.Parse(storyIDStr)
	if err != nil {
		response.JSON(c, http.StatusBadRequest, "Invalid story ID", nil)
		return
	}

	err = h.storyUseCase.DeleteStory(userID, storyID)
	if err != nil {
		if errors.Is(err, usecase.ErrForbidden) {
			response.JSON(c, http.StatusForbidden, err.Error(), nil)
			return
		}
		if errors.Is(err, usecase.ErrStoryNotFound) {
			response.JSON(c, http.StatusNotFound, err.Error(), nil)
			return
		}
		response.JSON(c, http.StatusInternalServerError, "Failed to delete story", nil)
		return
	}

	response.JSON(c, http.StatusOK, "Story deleted successfully", nil)
}

