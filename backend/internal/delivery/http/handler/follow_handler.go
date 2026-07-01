package handler

import (
	"net/http"

	"medium-clone/internal/repository/postgres"
	"medium-clone/internal/usecase"
	"medium-clone/pkg/response"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type FollowHandler struct {
	followUseCase usecase.FollowUseCase
	userRepo      postgres.UserRepository
}

func NewFollowHandler(followUseCase usecase.FollowUseCase, userRepo postgres.UserRepository) *FollowHandler {
	return &FollowHandler{
		followUseCase: followUseCase,
		userRepo:      userRepo,
	}
}

func (h *FollowHandler) Follow(c *gin.Context) {
	callerID, err := h.getCallerID(c)
	if err != nil {
		response.JSON(c, http.StatusUnauthorized, "Unauthorized", nil)
		return
	}

	targetUsername := c.Param("username")
	targetUser, err := h.userRepo.GetByUsername(targetUsername)
	if err != nil {
		response.JSON(c, http.StatusInternalServerError, "Failed to resolve target user", nil)
		return
	}
	if targetUser == nil {
		response.JSON(c, http.StatusNotFound, "User not found", nil)
		return
	}

	if err := h.followUseCase.Follow(c.Request.Context(), callerID, targetUser.ID); err != nil {
		response.JSON(c, http.StatusBadRequest, err.Error(), nil)
		return
	}

	response.JSON(c, http.StatusOK, "Successfully followed user", nil)
}

func (h *FollowHandler) Unfollow(c *gin.Context) {
	callerID, err := h.getCallerID(c)
	if err != nil {
		response.JSON(c, http.StatusUnauthorized, "Unauthorized", nil)
		return
	}

	targetUsername := c.Param("username")
	targetUser, err := h.userRepo.GetByUsername(targetUsername)
	if err != nil {
		response.JSON(c, http.StatusInternalServerError, "Failed to resolve target user", nil)
		return
	}
	if targetUser == nil {
		response.JSON(c, http.StatusNotFound, "User not found", nil)
		return
	}

	if err := h.followUseCase.Unfollow(c.Request.Context(), callerID, targetUser.ID); err != nil {
		response.JSON(c, http.StatusBadRequest, err.Error(), nil)
		return
	}

	response.JSON(c, http.StatusOK, "Successfully unfollowed user", nil)
}

func (h *FollowHandler) IsFollowing(c *gin.Context) {
	callerID, err := h.getCallerID(c)
	if err != nil {
		response.JSON(c, http.StatusUnauthorized, "Unauthorized", nil)
		return
	}

	targetUsername := c.Param("username")
	targetUser, err := h.userRepo.GetByUsername(targetUsername)
	if err != nil {
		response.JSON(c, http.StatusInternalServerError, "Failed to resolve target user", nil)
		return
	}
	if targetUser == nil {
		response.JSON(c, http.StatusNotFound, "User not found", nil)
		return
	}

	following, err := h.followUseCase.IsFollowing(c.Request.Context(), callerID, targetUser.ID)
	if err != nil {
		response.JSON(c, http.StatusInternalServerError, "Failed to check follow status", nil)
		return
	}

	response.JSON(c, http.StatusOK, "Success", gin.H{"following": following})
}

func (h *FollowHandler) GetFollowStats(c *gin.Context) {
	targetUsername := c.Param("username")
	targetUser, err := h.userRepo.GetByUsername(targetUsername)
	if err != nil {
		response.JSON(c, http.StatusInternalServerError, "Failed to resolve target user", nil)
		return
	}
	if targetUser == nil {
		response.JSON(c, http.StatusNotFound, "User not found", nil)
		return
	}

	followers, following, err := h.followUseCase.GetFollowStats(c.Request.Context(), targetUser.ID)
	if err != nil {
		response.JSON(c, http.StatusInternalServerError, "Failed to get stats", nil)
		return
	}

	response.JSON(c, http.StatusOK, "Success", gin.H{
		"followers": followers,
		"following": following,
	})
}

func (h *FollowHandler) getCallerID(c *gin.Context) (uuid.UUID, error) {
	val, exists := c.Get("user_id")
	if !exists {
		return uuid.Nil, http.ErrNoCookie
	}
	userIDStr, ok := val.(string)
	if !ok {
		return uuid.Nil, http.ErrNoCookie
	}
	return uuid.Parse(userIDStr)
}
