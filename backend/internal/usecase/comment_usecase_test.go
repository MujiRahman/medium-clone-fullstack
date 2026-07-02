package usecase_test

import (
	"context"
	"medium-clone/internal/domain"
	"medium-clone/internal/usecase"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

type MockCommentRepository struct {
	mock.Mock
}

func (m *MockCommentRepository) Create(comment *domain.Comment) error {
	args := m.Called(comment)
	return args.Error(0)
}

func (m *MockCommentRepository) GetByID(id uuid.UUID) (*domain.Comment, error) {
	args := m.Called(id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*domain.Comment), args.Error(1)
}

func (m *MockCommentRepository) GetByStoryID(storyID uuid.UUID) ([]domain.Comment, error) {
	args := m.Called(storyID)
	return args.Get(0).([]domain.Comment), args.Error(1)
}

type DummyNotificationUseCase struct{}

func (d *DummyNotificationUseCase) CreateNotification(ctx context.Context, recipientID, senderID uuid.UUID, notifType domain.NotificationType, message, storySlug string) (*domain.Notification, error) {
	return nil, nil
}
func (d *DummyNotificationUseCase) GetNotifications(recipientID uuid.UUID) ([]domain.Notification, error) {
	return nil, nil
}
func (d *DummyNotificationUseCase) MarkAsRead(id, recipientID uuid.UUID) error {
	return nil
}
func (d *DummyNotificationUseCase) MarkAllAsRead(recipientID uuid.UUID) error {
	return nil
}
func (d *DummyNotificationUseCase) Subscribe(ctx context.Context, recipientID uuid.UUID) *redis.PubSub {
	return nil
}

func TestCommentUseCase_GetStoryCommentsTree(t *testing.T) {
	mockRepo := new(MockCommentRepository)
	uc := usecase.NewCommentUseCase(mockRepo, nil, new(DummyNotificationUseCase))

	storyID := uuid.New()
	userID := uuid.New()

	// C1 (Root)
	c1ID := uuid.New()
	c1 := domain.Comment{ID: c1ID, StoryID: storyID, UserID: userID, Body: "Root 1", CreatedAt: time.Now()}

	// C2 (Root)
	c2ID := uuid.New()
	c2 := domain.Comment{ID: c2ID, StoryID: storyID, UserID: userID, Body: "Root 2", CreatedAt: time.Now()}

	// C3 (Child of C1)
	c3ID := uuid.New()
	c3 := domain.Comment{ID: c3ID, StoryID: storyID, UserID: userID, ParentID: &c1ID, Body: "Child 1 of Root 1", CreatedAt: time.Now()}

	// C4 (Child of C3) -> depth 3
	c4ID := uuid.New()
	c4 := domain.Comment{ID: c4ID, StoryID: storyID, UserID: userID, ParentID: &c3ID, Body: "Child 1 of Child 1", CreatedAt: time.Now()}

	mockRepo.On("GetByStoryID", storyID).Return([]domain.Comment{c1, c2, c3, c4}, nil)

	tree, err := uc.GetStoryCommentsTree(storyID)

	assert.NoError(t, err)
	assert.Len(t, tree, 2) // Should be 2 roots

	// Root 1 should have 1 child
	assert.Equal(t, c1ID, tree[0].ID)
	assert.Len(t, tree[0].Children, 1)

	// Context of depth 3 child
	assert.Equal(t, c3ID, tree[0].Children[0].ID)
	assert.Len(t, tree[0].Children[0].Children, 1)

	assert.Equal(t, c4ID, tree[0].Children[0].Children[0].ID)

	mockRepo.AssertExpectations(t)
}
