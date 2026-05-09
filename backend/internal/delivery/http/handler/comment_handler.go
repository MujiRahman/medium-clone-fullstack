package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"medium-clone/internal/domain"
)

type CommentUseCase interface {
	CreateComment(storyID, userID uuid.UUID, req domain.CreateCommentRequest) (*domain.Comment, error)
	GetStoryCommentsTree(storyID uuid.UUID) ([]domain.CommentResponse, error)
}

type CommentHandler struct {
	commentUseCase CommentUseCase
}

func NewCommentHandler(commentUseCase CommentUseCase) *CommentHandler {
	return &CommentHandler{commentUseCase: commentUseCase}
}

func (h *CommentHandler) CreateComment(c *gin.Context) {
	storyIDStr := c.Param("id")
	storyID, err := uuid.Parse(storyIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Invalid story ID"})
		return
	}

	val, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "Unauthorized"})
		return
	}
	userIDStrAuth, ok := val.(string)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "Invalid user token format"})
		return
	}
	userID, err := uuid.Parse(userIDStrAuth)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "Invalid user UUID"})
		return
	}

	var req domain.CreateCommentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
		return
	}

	comment, err := h.commentUseCase.CreateComment(storyID, userID, req)
	if err != nil {
		if err.Error() == "parent comment belongs to a different story" || err.Error() == "parent comment not found" {
			c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Failed to create comment"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": comment})
}

func (h *CommentHandler) GetStoryComments(c *gin.Context) {
	storyIDStr := c.Param("slug")
	storyID, err := uuid.Parse(storyIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Invalid story ID"})
		return
	}

	tree, err := h.commentUseCase.GetStoryCommentsTree(storyID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Failed to get comments"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": tree})
}
