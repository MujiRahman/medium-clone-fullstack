package config

import (
	"fmt"
	"log"
	"os"

	"medium-clone/internal/domain"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func InitDatabase() *gorm.DB {
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
	)
	if err != nil {
		log.Fatal("Failed to auto migrate database:", err)
	}

	log.Println("Database connection established and migrated")
	return db
}
