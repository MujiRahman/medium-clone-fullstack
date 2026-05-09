package usecase

import (
	"errors"
	"medium-clone/internal/domain"

	"github.com/google/uuid"
)

type CommentRepository interface {
	Create(comment *domain.Comment) error
	GetByID(id uuid.UUID) (*domain.Comment, error)
	GetByStoryID(storyID uuid.UUID) ([]domain.Comment, error)
}

type CommentUseCase struct {
	commentRepo CommentRepository
}

func NewCommentUseCase(commentRepo CommentRepository) *CommentUseCase {
	return &CommentUseCase{commentRepo: commentRepo}
}

func (u *CommentUseCase) CreateComment(storyID, userID uuid.UUID, req domain.CreateCommentRequest) (*domain.Comment, error) {
	if req.ParentID != nil {
		// Validasi silang: pastikan ParentID dimiliki oleh Story yang sama
		parent, err := u.commentRepo.GetByID(*req.ParentID)
		if err != nil {
			return nil, errors.New("parent comment not found")
		}
		if parent.StoryID != storyID {
			return nil, errors.New("parent comment belongs to a different story")
		}
	}

	comment := &domain.Comment{
		StoryID:  storyID,
		UserID:   userID,
		Body:     req.Body,
		ParentID: req.ParentID,
	}

	if err := u.commentRepo.Create(comment); err != nil {
		return nil, err
	}

	return comment, nil
}

func (u *CommentUseCase) GetStoryCommentsTree(storyID uuid.UUID) ([]domain.CommentResponse, error) {
	flatComments, err := u.commentRepo.GetByStoryID(storyID)
	if err != nil {
		return nil, err
	}

	// O(N) grouping
	childrenMap := make(map[uuid.UUID][]domain.Comment)
	var rootComments []domain.Comment

	for _, c := range flatComments {
		if c.ParentID == nil {
			rootComments = append(rootComments, c)
		} else {
			childrenMap[*c.ParentID] = append(childrenMap[*c.ParentID], c)
		}
	}

	// Rekursif pembangun pohon
	var buildTree func(parent domain.Comment) domain.CommentResponse
	buildTree = func(parent domain.Comment) domain.CommentResponse {
		node := domain.CommentResponse{
			ID:        parent.ID,
			StoryID:   parent.StoryID,
			User:      domain.UserResponse{ID: parent.User.ID, Username: parent.User.Username},
			Body:      parent.Body,
			ParentID:  parent.ParentID,
			CreatedAt: parent.CreatedAt,
			Children:  []domain.CommentResponse{},
		}
		for _, child := range childrenMap[parent.ID] {
			node.Children = append(node.Children, buildTree(child))
		}
		return node
	}

	var result []domain.CommentResponse
	for _, root := range rootComments {
		result = append(result, buildTree(root))
	}
	
	if result == nil {
		result = []domain.CommentResponse{}
	}

	return result, nil
}
