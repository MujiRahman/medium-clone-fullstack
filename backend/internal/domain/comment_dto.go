package domain

import (
	"time"

	"github.com/google/uuid"
)

type CreateCommentRequest struct {
	Body     string     `json:"body" binding:"required"`
	ParentID *uuid.UUID `json:"parent_id"`
}

type UserResponse struct {
	ID       uuid.UUID `json:"id"`
	Username string    `json:"username"`
}

type CommentResponse struct {
	ID        uuid.UUID         `json:"id"`
	StoryID   uuid.UUID         `json:"story_id"`
	User      UserResponse      `json:"user"`
	Body      string            `json:"body"`
	ParentID  *uuid.UUID        `json:"parent_id"`
	CreatedAt time.Time         `json:"created_at"`
	Children  []CommentResponse `json:"children"`
}
