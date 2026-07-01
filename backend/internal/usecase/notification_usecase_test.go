package usecase_test

import (
	"context"
	"regexp"
	"testing"

	"medium-clone/internal/domain"
	"medium-clone/internal/repository/postgres"
	"medium-clone/internal/usecase"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	gormpostgres "gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func setupNotifMockTest(t *testing.T) (usecase.NotificationUseCase, sqlmock.Sqlmock) {
	db, mock, err := sqlmock.New()
	require.NoError(t, err)

	gdb, err := gorm.Open(gormpostgres.New(gormpostgres.Config{
		Conn: db,
	}), &gorm.Config{
		SkipDefaultTransaction: true,
		Logger:                 logger.Default.LogMode(logger.Silent),
	})
	require.NoError(t, err)

	notifRepo := postgres.NewNotificationRepository(gdb)
	userRepo := postgres.NewUserRepository(gdb)
	rdb := redis.NewClient(&redis.Options{Addr: "localhost:6379"})

	notifUseCase := usecase.NewNotificationUseCase(notifRepo, userRepo, rdb)

	return notifUseCase, mock
}

func TestNotificationUseCase_CreateNotification_Success(t *testing.T) {
	uc, mock := setupNotifMockTest(t)
	ctx := context.Background()

	recipientID := uuid.New()
	senderID := uuid.New()

	// 1. Mock fetch sender details
	senderRows := sqlmock.NewRows([]string{"id", "username"}).AddRow(senderID, "senderuser")
	mock.ExpectQuery(regexp.QuoteMeta(`SELECT * FROM "users" WHERE id = $1 ORDER BY "users"."id" LIMIT $2`)).
		WithArgs(senderID, 1).
		WillReturnRows(senderRows)

	// 2. Mock GORM saving sender user association due to GORM nested structure insert
	mock.ExpectExec(regexp.QuoteMeta(`INSERT INTO "users"`)).
		WithArgs(senderID, "senderuser", "", "", "", sqlmock.AnyArg(), sqlmock.AnyArg()).
		WillReturnResult(sqlmock.NewResult(1, 1))

	// 3. Mock GORM save notification
	mock.ExpectExec(regexp.QuoteMeta(`INSERT INTO "notifications"`)).
		WithArgs(sqlmock.AnyArg(), recipientID, senderID, string(domain.NotificationTypeClap), "senderuser clapped for your story", "test-slug", false, sqlmock.AnyArg()).
		WillReturnResult(sqlmock.NewResult(1, 1))

	notif, err := uc.CreateNotification(ctx, recipientID, senderID, domain.NotificationTypeClap, "", "test-slug")
	assert.NoError(t, err)
	assert.NotNil(t, notif)
	assert.Equal(t, "senderuser clapped for your story", notif.Message)
	assert.Nil(t, mock.ExpectationsWereMet())
}

func TestNotificationUseCase_GetNotifications_Success(t *testing.T) {
	uc, mock := setupNotifMockTest(t)

	recipientID := uuid.New()
	senderID := uuid.New()

	notifRows := sqlmock.NewRows([]string{"id", "recipient_id", "sender_id", "type", "message", "story_slug", "is_read"}).
		AddRow(uuid.New(), recipientID, senderID, string(domain.NotificationTypeFollow), "user followed you", "", false)

	mock.ExpectQuery(regexp.QuoteMeta(`SELECT * FROM "notifications" WHERE recipient_id = $1 ORDER BY created_at DESC LIMIT $2`)).
		WithArgs(recipientID, 50).
		WillReturnRows(notifRows)

	// mock sender preload
	mock.ExpectQuery(regexp.QuoteMeta(`SELECT * FROM "users" WHERE "users"."id" = $1`)).
		WithArgs(senderID).
		WillReturnRows(sqlmock.NewRows([]string{"id", "username"}).AddRow(senderID, "someuser"))

	list, err := uc.GetNotifications(recipientID)
	assert.NoError(t, err)
	assert.Len(t, list, 1)
	assert.Nil(t, mock.ExpectationsWereMet())
}
