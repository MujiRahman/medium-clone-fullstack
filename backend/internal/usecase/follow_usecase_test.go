package usecase_test

import (
	"context"
	"regexp"
	"testing"

	"medium-clone/internal/repository/postgres"
	"medium-clone/internal/usecase"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	gormpostgres "gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func setupFollowMockTest(t *testing.T) (usecase.FollowUseCase, sqlmock.Sqlmock) {
	db, mock, err := sqlmock.New()
	require.NoError(t, err)

	gdb, err := gorm.Open(gormpostgres.New(gormpostgres.Config{
		Conn: db,
	}), &gorm.Config{
		SkipDefaultTransaction: true,
		Logger:                 logger.Default.LogMode(logger.Silent),
	})
	require.NoError(t, err)

	followRepo := postgres.NewFollowRepository(gdb)
	userRepo := postgres.NewUserRepository(gdb)
	
	// Reuse the DummyNotificationUseCase declared in this testing package
	followUsecase := usecase.NewFollowUseCase(followRepo, userRepo, new(DummyNotificationUseCase))

	return followUsecase, mock
}

func TestFollowUseCase_Follow_Success(t *testing.T) {
	uc, mock := setupFollowMockTest(t)
	ctx := context.Background()

	followerID := uuid.New()
	followingID := uuid.New()

	// 1. Mock verify target user exists
	userRows := sqlmock.NewRows([]string{"id", "username"}).AddRow(followingID, "targetuser")
	mock.ExpectQuery(regexp.QuoteMeta(`SELECT * FROM "users" WHERE id = $1 ORDER BY "users"."id" LIMIT $2`)).
		WithArgs(followingID, 1).
		WillReturnRows(userRows)

	// 2. Mock GORM FirstOrCreate select check
	mock.ExpectQuery(`SELECT \* FROM "follows" WHERE.*`).
		WithArgs(followerID, followingID, followerID, followingID, 1).
		WillReturnRows(sqlmock.NewRows([]string{}))

	// 3. Mock GORM FirstOrCreate insert
	mock.ExpectExec(regexp.QuoteMeta(`INSERT INTO "follows"`)).
		WithArgs(followerID, followingID, sqlmock.AnyArg()).
		WillReturnResult(sqlmock.NewResult(1, 1))

	// 4. Mock fetch follower details (for notification context)
	followerRows := sqlmock.NewRows([]string{"id", "username"}).AddRow(followerID, "followeruser")
	mock.ExpectQuery(regexp.QuoteMeta(`SELECT * FROM "users" WHERE id = $1 ORDER BY "users"."id" LIMIT $2`)).
		WithArgs(followerID, 1).
		WillReturnRows(followerRows)

	err := uc.Follow(ctx, followerID, followingID)
	assert.NoError(t, err)
	assert.Nil(t, mock.ExpectationsWereMet())
}

func TestFollowUseCase_Unfollow_Success(t *testing.T) {
	uc, mock := setupFollowMockTest(t)
	ctx := context.Background()

	followerID := uuid.New()
	followingID := uuid.New()

	mock.ExpectExec(regexp.QuoteMeta(`DELETE FROM "follows" WHERE follower_id = $1 AND following_id = $2`)).
		WithArgs(followerID, followingID).
		WillReturnResult(sqlmock.NewResult(1, 1))

	err := uc.Unfollow(ctx, followerID, followingID)
	assert.NoError(t, err)
	assert.Nil(t, mock.ExpectationsWereMet())
}

func TestFollowUseCase_IsFollowing_True(t *testing.T) {
	uc, mock := setupFollowMockTest(t)
	ctx := context.Background()

	followerID := uuid.New()
	followingID := uuid.New()

	countRow := sqlmock.NewRows([]string{"count"}).AddRow(1)
	mock.ExpectQuery(regexp.QuoteMeta(`SELECT count(*) FROM "follows" WHERE follower_id = $1 AND following_id = $2`)).
		WithArgs(followerID, followingID).
		WillReturnRows(countRow)

	following, err := uc.IsFollowing(ctx, followerID, followingID)
	assert.NoError(t, err)
	assert.True(t, following)
	assert.Nil(t, mock.ExpectationsWereMet())
}
