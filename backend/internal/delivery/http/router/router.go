package router

import (
	"github.com/gin-gonic/gin"

	"time"

	"medium-clone/internal/delivery/http/handler"
	"medium-clone/internal/delivery/http/middleware"

	"github.com/gin-contrib/cors"
)

func SetupRouter(
	authHandler *handler.AuthHandler,
	userHandler *handler.UserHandler,
	storyHandler *handler.StoryHandler,
	commentHandler *handler.CommentHandler,
) *gin.Engine {
	r := gin.Default()

	// Enable CORS for frontend integration
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000"}, // Frontend Next.js URL
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true, // Wajib TRUE agar HttpOnly Cookie bisa dikirim dan ditangkap!
		MaxAge:           12 * time.Hour,
	}))

	api := r.Group("/api")
	{
		// Public Routes
		auth := api.Group("/auth")
		{
			auth.POST("/register", authHandler.Register)
			auth.POST("/login", authHandler.Login)
			auth.POST("/logout", authHandler.Logout)
		}

		api.GET("/stories/:slug", storyHandler.GetStoryBySlug)
		api.GET("/stories", storyHandler.GetStories)
		api.GET("/stories/:slug/comments", commentHandler.GetStoryComments)

		// Protected Routes
		protected := api.Group("/")
		protected.Use(middleware.JWTMiddleware())
		{
			// Auth
			protected.GET("/auth/me", authHandler.GetMe)

			// Users Routes
			users := protected.Group("/users")
			{
				users.GET("/:username", userHandler.GetProfile)
				users.PUT("/:username", userHandler.UpdateProfile)
			}

			// Stories Routes
			stories := protected.Group("/stories")
			{
				stories.POST("", storyHandler.CreateStory)
				stories.PUT("/:id", storyHandler.UpdateStory)
				stories.POST("/:id/clap", storyHandler.ClapStory)
				stories.POST("/:id/comments", commentHandler.CreateComment)
			}
		}
	}

	return r
}
