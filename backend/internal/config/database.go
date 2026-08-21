package config

import (
	"fmt"
	"log"
	"os"
	"sync"

	"medium-clone/internal/domain"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var (
	dbInstance *gorm.DB
	dbOnce     sync.Once
)

func InitDatabase() *gorm.DB {
	dbOnce.Do(func() {
		host := os.Getenv("DB_HOST")
		user := os.Getenv("DB_USER")
		password := os.Getenv("DB_PASSWORD")
		dbname := os.Getenv("DB_NAME")
		port := os.Getenv("DB_PORT")

		// set default for local run if no env vars exist
		if host == "" {
			host = "localhost"
			user = "medium_user"
			password = "medium_password"
			dbname = "medium_clone"
			port = "5432"
		}

		dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=disable TimeZone=UTC",
			host, user, password, dbname, port)

		db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
		if err != nil {
			log.Fatal("Failed to connect to database:", err)
		}

		// Auto Migrate the Domain entities
		err = db.AutoMigrate(
			&domain.User{},
			&domain.Story{},
			&domain.Clap{},
			&domain.Comment{},
			&domain.ArticleAnalytics{},
			&domain.Follow{},
			&domain.Notification{},
		)
		if err != nil {
			log.Fatal("Failed to auto migrate database:", err)
		}

		// Enable pg_trgm and add fuzzy search indexes
		if err := db.Exec("CREATE EXTENSION IF NOT EXISTS pg_trgm;").Error; err != nil {
			log.Printf("Warning: failed to create pg_trgm extension: %v", err)
		}
		if err := db.Exec("CREATE INDEX IF NOT EXISTS idx_users_username_trgm ON users USING gin (username gin_trgm_ops);").Error; err != nil {
			log.Printf("Warning: failed to create trigram index on users: %v", err)
		}
		if err := db.Exec("CREATE INDEX IF NOT EXISTS idx_stories_title_trgm ON stories USING gin (title gin_trgm_ops);").Error; err != nil {
			log.Printf("Warning: failed to create trigram index on stories: %v", err)
		}

		log.Println("Database connection established and migrated")
		dbInstance = db
	})
	
	return dbInstance
}
