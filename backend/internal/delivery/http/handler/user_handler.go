package handler

import (
	"errors"
	"net/http"

	"medium-clone/internal/repository/postgres"
	"medium-clone/internal/usecase"
	"medium-clone/pkg/response"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type UserHandler struct {
	userRepo      postgres.UserRepository
	storyRepo     postgres.StoryRepository
	followUseCase usecase.FollowUseCase
}

func NewUserHandler(
	userRepo postgres.UserRepository,
	storyRepo postgres.StoryRepository,
	followUseCase usecase.FollowUseCase,
) *UserHandler {
	return &UserHandler{
		userRepo:      userRepo,
		storyRepo:     storyRepo,
		followUseCase: followUseCase,
	}
}

func (h *UserHandler) GetProfile(c *gin.Context) {
	username := c.Param("username")
	user, err := h.userRepo.GetByUsername(username)
	if err != nil {
		response.JSON(c, http.StatusInternalServerError, "Database error", nil)
		return
	}
	if user == nil {
		response.JSON(c, http.StatusNotFound, "User not found", nil)
		return
	}

	// Fetch follow stats
	followersCount, followingCount, err := h.followUseCase.GetFollowStats(c.Request.Context(), user.ID)
	if err != nil {
		response.JSON(c, http.StatusInternalServerError, "Failed to fetch follow statistics", nil)
		return
	}

	// Fetch author's published stories
	stories, err := h.storyRepo.GetStoriesByAuthor(user.ID)
	if err != nil {
		response.JSON(c, http.StatusInternalServerError, "Failed to fetch stories", nil)
		return
	}

	// Format response
	profileData := gin.H{
		"user": gin.H{
			"id":              user.ID,
			"username":        user.Username,
			"email":           user.Email,
			"bio":             user.Bio,
			"followers_count": followersCount,
			"following_count": followingCount,
		},
		"stories": stories,
	}

	response.JSON(c, http.StatusOK, "Success", profileData)
}

type UpdateProfileReq struct {
	Bio string `json:"bio" binding:"required"`
}

func (h *UserHandler) UpdateProfile(c *gin.Context) {
	// Extract caller ID
	callerID, err := h.getCallerID(c)
	if err != nil {
		response.JSON(c, http.StatusUnauthorized, "Unauthorized", nil)
		return
	}

	// Target user
	targetUsername := c.Param("username")
	targetUser, err := h.userRepo.GetByUsername(targetUsername)
	if err != nil {
		response.JSON(c, http.StatusInternalServerError, "Database error", nil)
		return
	}
	if targetUser == nil {
		response.JSON(c, http.StatusNotFound, "User not found", nil)
		return
	}

	// Authorization check: only update self profile
	if targetUser.ID != callerID {
		response.JSON(c, http.StatusForbidden, "Forbidden: you can only update your own profile", nil)
		return
	}

	var req UpdateProfileReq
	if err := c.ShouldBindJSON(&req); err != nil {
		response.JSON(c, http.StatusBadRequest, "Invalid request body", nil)
		return
	}

	targetUser.Bio = req.Bio
	if err := h.userRepo.UpdateUser(targetUser); err != nil {
		response.JSON(c, http.StatusInternalServerError, "Failed to update profile", nil)
		return
	}

	response.JSON(c, http.StatusOK, "Profile updated successfully", gin.H{
		"id":       targetUser.ID,
		"username": targetUser.Username,
		"bio":      targetUser.Bio,
	})
}

func (h *UserHandler) getCallerID(c *gin.Context) (uuid.UUID, error) {
	val, exists := c.Get("user_id")
	if !exists {
		return uuid.Nil, errors.New("user_id context not set")
	}
	userIDStr, ok := val.(string)
	if !ok {
		return uuid.Nil, errors.New("user_id context is not a string")
	}
	return uuid.Parse(userIDStr)
}
