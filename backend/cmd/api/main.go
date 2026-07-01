package main

import (
	"log"
	"os"

	"medium-clone/internal/config"
	"medium-clone/internal/delivery/http/handler"
	"medium-clone/internal/delivery/http/router"
	"medium-clone/internal/repository/postgres"
	"medium-clone/internal/usecase"
	jwtutils "medium-clone/pkg/jwt"

	"github.com/joho/godotenv"
)

func main() {
	// Attempt to load .env file if it exists, ignoring error if it doesn't 
	// (useful for production docker where env is injected)
	_ = godotenv.Load()

	// 0. Provide JWT Secret
	jwtutils.InitJWT()

	// 1. Init Database (and Auto Migrate)
	db := config.InitDatabase()
	rdb := config.InitRedis()

	// 2. Init Repositories & Usecases
	userRepo := postgres.NewUserRepository(db)
	authUseCase := usecase.NewAuthUseCase(userRepo)
	
	notificationRepo := postgres.NewNotificationRepository(db)
	notifUseCase := usecase.NewNotificationUseCase(notificationRepo, userRepo, rdb)

	storyRepo := postgres.NewStoryRepository(db)
	clapRepo := postgres.NewClapRepository(db)
	storyUseCase := usecase.NewStoryUseCase(storyRepo, clapRepo, rdb, notifUseCase)

	commentRepo := postgres.NewCommentRepository(db)
	commentUseCase := usecase.NewCommentUseCase(commentRepo, storyRepo, notifUseCase)

	aiUseCase := usecase.NewAIUseCase()

	analyticsRepo := postgres.NewAnalyticsRepository(db)
	analyticsUseCase := usecase.NewAnalyticsUseCase(analyticsRepo, aiUseCase, rdb)

	followRepo := postgres.NewFollowRepository(db)
	followUseCase := usecase.NewFollowUseCase(followRepo, userRepo, notifUseCase)

	searchUseCase := usecase.NewSearchUseCase(db)

	// 3. Init Handlers
	authHandler := handler.NewAuthHandler(authUseCase)
	userHandler := handler.NewUserHandler(userRepo, storyRepo, followUseCase)
	storyHandler := handler.NewStoryHandler(storyUseCase)
	commentHandler := handler.NewCommentHandler(commentUseCase)
	aiHandler := handler.NewAIHandler(aiUseCase)
	analyticsHandler := handler.NewAnalyticsHandler(analyticsUseCase)
	followHandler := handler.NewFollowHandler(followUseCase, userRepo)
	notificationHandler := handler.NewNotificationHandler(notifUseCase)
	searchHandler := handler.NewSearchHandler(searchUseCase)

	// 4. Setup Router
	r := router.SetupRouter(
		authHandler,
		userHandler,
		storyHandler,
		commentHandler,
		aiHandler,
		analyticsHandler,
		followHandler,
		notificationHandler,
		searchHandler,
	)

	// 5. Run Server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Starting server on port %s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}
