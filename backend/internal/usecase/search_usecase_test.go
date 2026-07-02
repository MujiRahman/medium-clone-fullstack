package usecase_test

import (
	"context"
	"regexp"
	"testing"

	"medium-clone/internal/usecase"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	gormpostgres "gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func setupSearchMockTest(t *testing.T) (usecase.SearchUseCase, sqlmock.Sqlmock) {
	db, mock, err := sqlmock.New()
	require.NoError(t, err)

	gdb, err := gorm.Open(gormpostgres.New(gormpostgres.Config{
		Conn: db,
	}), &gorm.Config{
		SkipDefaultTransaction: true,
		Logger:                 logger.Default.LogMode(logger.Silent),
	})
	require.NoError(t, err)

	searchUseCase := usecase.NewSearchUseCase(gdb)

	return searchUseCase, mock
}

func TestSearchUseCase_Autocomplete_Success(t *testing.T) {
	uc, mock := setupSearchMockTest(t)
	ctx := context.Background()

	query := "belajar"
	likeQuery := "%" + query + "%"
	storyID := uuid.New()
	authorID := uuid.New()

	// 1. Mock select stories
	storyRows := sqlmock.NewRows([]string{"id", "title", "author_id", "status"}).
		AddRow(storyID, "Belajar Go Backend", authorID, "published")
	mock.ExpectQuery(regexp.QuoteMeta(`SELECT stories.*, similarity(title, $1) as score FROM "stories" WHERE status = $2 AND (title % $3 OR title ILIKE $4) ORDER BY score DESC, published_at DESC LIMIT $5`)).
		WithArgs(query, "published", query, likeQuery, 6).
		WillReturnRows(storyRows)

	// Mock Author preload
	mock.ExpectQuery(regexp.QuoteMeta(`SELECT * FROM "users" WHERE "users"."id" = $1`)).
		WithArgs(authorID).
		WillReturnRows(sqlmock.NewRows([]string{"id", "username"}).AddRow(authorID, "authorname"))

	// 2. Mock select users
	userRows := sqlmock.NewRows([]string{"id", "username"}).
		AddRow(uuid.New(), "belajar_bareng")
	mock.ExpectQuery(regexp.QuoteMeta(`SELECT users.*, similarity(username, $1) as score FROM "users" WHERE username % $2 OR username ILIKE $3 ORDER BY score DESC LIMIT $4`)).
		WithArgs(query, query, likeQuery, 6).
		WillReturnRows(userRows)

	res, err := uc.Autocomplete(ctx, query)
	assert.NoError(t, err)
	assert.NotNil(t, res)
	assert.Len(t, res.Stories, 1)
	assert.Len(t, res.Users, 1)
	assert.Equal(t, "Belajar Go Backend", res.Stories[0].Title)
	assert.Equal(t, "belajar_bareng", res.Users[0].Username)
	assert.Nil(t, mock.ExpectationsWereMet())
}
