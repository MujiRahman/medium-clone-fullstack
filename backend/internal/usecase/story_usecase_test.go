package usecase_test

import (
	"regexp"
	"testing"

	"medium-clone/internal/domain"
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

func setupStoryMockTest(t *testing.T) (usecase.StoryUseCase, sqlmock.Sqlmock) {
	db, mock, err := sqlmock.New()
	require.NoError(t, err)

	gdb, err := gorm.Open(gormpostgres.New(gormpostgres.Config{
		Conn: db,
	}), &gorm.Config{
		SkipDefaultTransaction: true,
		Logger:                 logger.Default.LogMode(logger.Silent),
	})
	require.NoError(t, err)

	storyRepo := postgres.NewStoryRepository(gdb)
	clapRepo := postgres.NewClapRepository(gdb)
	storyUsecase := usecase.NewStoryUseCase(storyRepo, clapRepo)

	return storyUsecase, mock
}

func TestStoryUseCase_CreateDraft_Success(t *testing.T) {
	uc, mock := setupStoryMockTest(t)

	authorID := uuid.New()
	req := usecase.CreateStoryReq{
		Title:   "Belajar Go",
		Content: "Ini adalah konten",
	}

	mock.ExpectExec(regexp.QuoteMeta(`INSERT INTO "stories"`)).
		WithArgs(
			sqlmock.AnyArg(),        // id
			authorID,                // author_id
			req.Title,               // title
			sqlmock.AnyArg(),        // slug
			req.Content,             // content
			"",                      // tldr
			"",                      // tags
			domain.StoryStatusDraft, // status
			nil,                     // published_at
			sqlmock.AnyArg(),        // created_at
			sqlmock.AnyArg(),        // updated_at
		).
		WillReturnResult(sqlmock.NewResult(1, 1))

	story, err := uc.CreateDraft(authorID, req)

	assert.NoError(t, err)
	assert.NotNil(t, story)
	assert.Equal(t, domain.StoryStatusDraft, story.Status)
	assert.Contains(t, story.Slug, "belajar-go-")
	assert.Nil(t, mock.ExpectationsWereMet())
}

func TestStoryUseCase_UpdateStory_Forbidden(t *testing.T) {
	uc, mock := setupStoryMockTest(t)

	authorID := uuid.New()
	otherUserID := uuid.New()
	storyID := uuid.New()

	req := usecase.UpdateStoryReq{
		Title: "Judul Baru",
	}

	// GET Story mock
	rows := sqlmock.NewRows([]string{"id", "author_id", "title"}).
		AddRow(storyID, authorID, "Judul Lama") // Different author

	mock.ExpectQuery(regexp.QuoteMeta(`SELECT * FROM "stories" WHERE id = $1 ORDER BY "stories"."id" LIMIT $2`)).
		WithArgs(storyID, 1).
		WillReturnRows(rows)

	// Preload Author mock
	mock.ExpectQuery(regexp.QuoteMeta(`SELECT * FROM "users" WHERE "users"."id" = $1`)).
		WithArgs(authorID).
		WillReturnRows(sqlmock.NewRows([]string{"id"}).AddRow(authorID))

	// Update action by otherUserID
	story, err := uc.UpdateStory(otherUserID, storyID, req)

	assert.Error(t, err)
	assert.Nil(t, story)
	assert.Equal(t, usecase.ErrForbidden, err)
	assert.Nil(t, mock.ExpectationsWereMet()) // Ensure no save query is executed
}

func TestStoryUseCase_AddClap_Success(t *testing.T) {
	uc, mock := setupStoryMockTest(t)

	userID := uuid.New()
	storyID := uuid.New()

	req := usecase.AddClapReq{Count: 15}

	// 1. Get Story (exists)
	storyRows := sqlmock.NewRows([]string{"id"}).AddRow(storyID)
	mock.ExpectQuery(regexp.QuoteMeta(`SELECT * FROM "stories" WHERE id = $1 ORDER BY "stories"."id" LIMIT $2`)).
		WithArgs(storyID, 1).
		WillReturnRows(storyRows)

	// 2. Get Clap (not found, means first clap)
	mock.ExpectQuery(regexp.QuoteMeta(`SELECT * FROM "claps" WHERE user_id = $1 AND story_id = $2 ORDER BY "claps"."id" LIMIT $3`)).
		WithArgs(userID, storyID, 1).
		WillReturnRows(sqlmock.NewRows([]string{}))

	// 3. Save Clap (INSERT)
	mock.ExpectExec(regexp.QuoteMeta(`INSERT INTO "claps"`)).
		WithArgs(sqlmock.AnyArg(), userID, storyID, 15).
		WillReturnResult(sqlmock.NewResult(1, 1))

	clap, err := uc.AddClap(userID, storyID, req)

	assert.NoError(t, err)
	assert.Equal(t, 15, clap.Count)
	assert.Nil(t, mock.ExpectationsWereMet())
}

func TestStoryUseCase_AddClap_ExceedMax(t *testing.T) {
	uc, mock := setupStoryMockTest(t)

	userID := uuid.New()
	storyID := uuid.New()

	req := usecase.AddClapReq{Count: 20} // Trying to add 20

	// 1. Get Story (exists)
	storyRows := sqlmock.NewRows([]string{"id"}).AddRow(storyID)
	mock.ExpectQuery(regexp.QuoteMeta(`SELECT * FROM "stories" WHERE id = $1 ORDER BY "stories"."id" LIMIT $2`)).
		WithArgs(storyID, 1).
		WillReturnRows(storyRows)

	// 2. Get Clap (already has 35)
	clapRows := sqlmock.NewRows([]string{"id", "user_id", "story_id", "count"}).
		AddRow(uuid.New(), userID, storyID, 35)
	mock.ExpectQuery(regexp.QuoteMeta(`SELECT * FROM "claps" WHERE user_id = $1 AND story_id = $2 ORDER BY "claps"."id" LIMIT $3`)).
		WithArgs(userID, storyID, 1).
		WillReturnRows(clapRows)

	// 3. Save (Should not happen)

	clap, err := uc.AddClap(userID, storyID, req) // 35 + 20 = 55 (Exceeds)

	assert.Error(t, err)
	assert.Nil(t, clap)
	assert.Equal(t, usecase.ErrMaxClapsExceed, err)
	assert.Nil(t, mock.ExpectationsWereMet())
}

func TestStoryUseCase_GetStoryByID_Success(t *testing.T) {
	uc, mock := setupStoryMockTest(t)

	authorID := uuid.New()
	storyID := uuid.New()

	rows := sqlmock.NewRows([]string{"id", "author_id", "title"}).
		AddRow(storyID, authorID, "Judul Cerita")

	mock.ExpectQuery(regexp.QuoteMeta(`SELECT * FROM "stories" WHERE id = $1 ORDER BY "stories"."id" LIMIT $2`)).
		WithArgs(storyID, 1).
		WillReturnRows(rows)

	mock.ExpectQuery(regexp.QuoteMeta(`SELECT * FROM "users" WHERE "users"."id" = $1`)).
		WithArgs(authorID).
		WillReturnRows(sqlmock.NewRows([]string{"id"}).AddRow(authorID))

	story, err := uc.GetStoryByID(authorID, storyID)

	assert.NoError(t, err)
	assert.NotNil(t, story)
	assert.Equal(t, storyID, story.ID)
	assert.Equal(t, authorID, story.AuthorID)
	assert.Nil(t, mock.ExpectationsWereMet())
}

func TestStoryUseCase_DeleteStory_Success(t *testing.T) {
	uc, mock := setupStoryMockTest(t)

	authorID := uuid.New()
	storyID := uuid.New()

	rows := sqlmock.NewRows([]string{"id", "author_id", "title"}).
		AddRow(storyID, authorID, "Judul Cerita")

	mock.ExpectQuery(regexp.QuoteMeta(`SELECT * FROM "stories" WHERE id = $1 ORDER BY "stories"."id" LIMIT $2`)).
		WithArgs(storyID, 1).
		WillReturnRows(rows)

	mock.ExpectQuery(regexp.QuoteMeta(`SELECT * FROM "users" WHERE "users"."id" = $1`)).
		WithArgs(authorID).
		WillReturnRows(sqlmock.NewRows([]string{"id"}).AddRow(authorID))

	mock.ExpectExec(regexp.QuoteMeta(`DELETE FROM "stories" WHERE id = $1`)).
		WithArgs(storyID).
		WillReturnResult(sqlmock.NewResult(1, 1))

	err := uc.DeleteStory(authorID, storyID)

	assert.NoError(t, err)
	assert.Nil(t, mock.ExpectationsWereMet())
}
