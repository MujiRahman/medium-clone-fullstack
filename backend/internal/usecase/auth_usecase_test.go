package usecase_test

import (
	"regexp"
	"testing"

	"medium-clone/internal/repository/postgres"
	"medium-clone/internal/usecase"
	jwtutils "medium-clone/pkg/jwt"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"golang.org/x/crypto/bcrypt"
	gormpostgres "gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func setupMockTest(t *testing.T) (usecase.AuthUseCase, sqlmock.Sqlmock) {
	db, mock, err := sqlmock.New()
	require.NoError(t, err)

	gdb, err := gorm.Open(gormpostgres.New(gormpostgres.Config{
		Conn: db,
	}), &gorm.Config{
		SkipDefaultTransaction: true,
		Logger:                 logger.Default.LogMode(logger.Silent),
	})
	require.NoError(t, err)

	userRepo := postgres.NewUserRepository(gdb)
	authUsecase := usecase.NewAuthUseCase(userRepo)

	// Set dummy JWT secret for testing
	jwtutils.SetSecretForTest("super_secret_test_key")

	return authUsecase, mock
}

func TestAuthUseCase_Register_Success(t *testing.T) {
	uc, mock := setupMockTest(t)

	req := usecase.RegisterReq{
		Username: "testuser",
		Email:    "test@example.com",
		Password: "password123",
	}

	// Mock GetByEmail -> not found
	mock.ExpectQuery(regexp.QuoteMeta(`SELECT * FROM "users" WHERE email = $1 ORDER BY "users"."id" LIMIT $2`)).
		WithArgs(req.Email, 1).
		WillReturnRows(sqlmock.NewRows([]string{}))

	// Mock GetByUsername -> not found
	mock.ExpectQuery(regexp.QuoteMeta(`SELECT * FROM "users" WHERE username = $1 ORDER BY "users"."id" LIMIT $2`)).
		WithArgs(req.Username, 1).
		WillReturnRows(sqlmock.NewRows([]string{}))

	// Mock Create
	mock.ExpectExec(regexp.QuoteMeta(`INSERT INTO "users"`)).
		WithArgs(sqlmock.AnyArg(), req.Username, req.Email, sqlmock.AnyArg(), sqlmock.AnyArg(), sqlmock.AnyArg(), sqlmock.AnyArg()).
		WillReturnResult(sqlmock.NewResult(1, 1))

	user, err := uc.Register(req)

	require.NoError(t, err)
	require.NotNil(t, user)
	assert.Equal(t, req.Email, user.Email)
	assert.Equal(t, req.Username, user.Username)
	assert.NotEmpty(t, user.PasswordHash)
	assert.NotEqual(t, req.Password, user.PasswordHash) // Should be hashed
	assert.Nil(t, mock.ExpectationsWereMet())
}

func TestAuthUseCase_Register_DuplicateEmail(t *testing.T) {
	uc, mock := setupMockTest(t)

	req := usecase.RegisterReq{
		Username: "testuser",
		Email:    "duplicate@example.com",
		Password: "password123",
	}

	// Mock GetByEmail -> found
	rows := sqlmock.NewRows([]string{"id", "email"}).
		AddRow(uuid.New().String(), req.Email)

	mock.ExpectQuery(regexp.QuoteMeta(`SELECT * FROM "users" WHERE email = $1 ORDER BY "users"."id" LIMIT $2`)).
		WithArgs(req.Email, 1).
		WillReturnRows(rows)

	user, err := uc.Register(req)

	assert.Error(t, err)
	assert.Nil(t, user)
	assert.Equal(t, usecase.ErrEmailExists, err)
	assert.Nil(t, mock.ExpectationsWereMet())
}

func TestAuthUseCase_Login_Success(t *testing.T) {
	uc, mock := setupMockTest(t)

	req := usecase.LoginReq{
		Email:    "test@example.com",
		Password: "password123",
	}

	hashedPassword, _ := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)

	// Mock GetByEmail -> found
	rows := sqlmock.NewRows([]string{"id", "email", "password_hash"}).
		AddRow(uuid.New().String(), req.Email, string(hashedPassword))

	mock.ExpectQuery(regexp.QuoteMeta(`SELECT * FROM "users" WHERE email = $1 ORDER BY "users"."id" LIMIT $2`)).
		WithArgs(req.Email, 1).
		WillReturnRows(rows)

	token, err := uc.Login(req)

	assert.NoError(t, err)
	assert.NotEmpty(t, token)
	assert.Nil(t, mock.ExpectationsWereMet())
}

func TestAuthUseCase_Login_WrongPassword(t *testing.T) {
	uc, mock := setupMockTest(t)

	req := usecase.LoginReq{
		Email:    "test@example.com",
		Password: "wrongpassword",
	}

	hashedPassword, _ := bcrypt.GenerateFromPassword([]byte("correctpassword"), bcrypt.DefaultCost)

	rows := sqlmock.NewRows([]string{"id", "email", "password_hash"}).
		AddRow(uuid.New().String(), req.Email, string(hashedPassword))

	mock.ExpectQuery(regexp.QuoteMeta(`SELECT * FROM "users" WHERE email = $1 ORDER BY "users"."id" LIMIT $2`)).
		WithArgs(req.Email, 1).
		WillReturnRows(rows)

	token, err := uc.Login(req)

	assert.Error(t, err)
	assert.Empty(t, token)
	assert.Equal(t, usecase.ErrInvalidCreds, err)
	assert.Nil(t, mock.ExpectationsWereMet())
}
