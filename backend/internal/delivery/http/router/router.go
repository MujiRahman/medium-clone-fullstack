package router

import (
	"os"
	"strings"
	"time"

	"github.com/gin-gonic/gin"

	"medium-clone/internal/delivery/http/handler"
	"medium-clone/internal/delivery/http/middleware"

	"github.com/gin-contrib/cors"
)

func SetupRouter(
	authHandler *handler.AuthHandler,
	userHandler *handler.UserHandler,
	storyHandler *handler.StoryHandler,
	commentHandler *handler.CommentHandler,
	aiHandler *handler.AIHandler,
	analyticsHandler *handler.AnalyticsHandler,
	followHandler *handler.FollowHandler,
	notificationHandler *handler.NotificationHandler,
	searchHandler *handler.SearchHandler,
) *gin.Engine {
	r := gin.Default()

	// Enable CORS for frontend integration
	allowedOrigins := []string{"http://localhost:3000"}
	if envOrigins := os.Getenv("ALLOWED_ORIGINS"); envOrigins != "" {
		origins := strings.Split(envOrigins, ",")
		for _, o := range origins {
			trimmed := strings.TrimSpace(o)
			if trimmed != "" {
				allowedOrigins = append(allowedOrigins, trimmed)
			}
		}
	}

	r.Use(cors.New(cors.Config{
		AllowOrigins:     allowedOrigins,
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
		api.POST("/analytics/track", analyticsHandler.Track)

		// Search Routes
		api.GET("/search/autocomplete", searchHandler.Autocomplete)

		// Public Follow Stats
		api.GET("/users/:username/follow-stats", followHandler.GetFollowStats)

		// Protected Routes
		protected := api.Group("/")
		protected.Use(middleware.JWTMiddleware())
		{
			// Auth
			protected.GET("/auth/me", authHandler.GetMe)

			// Analytics Stats
			protected.GET("/me/stats", analyticsHandler.GetStats)
			protected.GET("/me/stats/insights", analyticsHandler.GetInsights)

			// Users Routes
			users := protected.Group("/users")
			{
				users.GET("/:username", userHandler.GetProfile)
				users.PUT("/:username", userHandler.UpdateProfile)
				users.POST("/:username/follow", followHandler.Follow)
				users.POST("/:username/unfollow", followHandler.Unfollow)
				users.GET("/:username/follow-status", followHandler.IsFollowing)
			}

			// Stories Routes
			stories := protected.Group("/stories")
			{
				stories.POST("", storyHandler.CreateStory)
				stories.GET("/id/:id", storyHandler.GetStoryByID)
				stories.PUT("/:id", storyHandler.UpdateStory)
				stories.DELETE("/:id", storyHandler.DeleteStory)
				stories.POST("/:id/clap", storyHandler.ClapStory)
				stories.POST("/:id/comments", commentHandler.CreateComment)
			}

			// Notifications Routes
			notifications := protected.Group("/notifications")
			{
				notifications.GET("", notificationHandler.GetNotifications)
				notifications.POST("/read-all", notificationHandler.MarkAllAsRead)
				notifications.POST("/:id/read", notificationHandler.MarkAsRead)
				notifications.GET("/stream", notificationHandler.StreamNotifications)
			}

			// AI Routes
			ai := protected.Group("/ai")
			{
				ai.POST("/generate", aiHandler.Generate)
			}
		}
	}

	return r
}
