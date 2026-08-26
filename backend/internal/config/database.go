package config

import (
	"fmt"
	"log"
	"os"
	"sync"
	"time"

	"medium-clone/internal/domain"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
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

		newLogger := logger.New(
			log.New(os.Stdout, "\r\n", log.LstdFlags), // io writer
			logger.Config{
				SlowThreshold:             time.Second, // Anggap query lambat jika lebih dari 1 detik
				LogLevel:                  logger.Warn, // Log level: Silent, Error, Warn, Info
				IgnoreRecordNotFoundError: true,        // Jangan jadikan error log jika data tidak ditemukan (misal pencarian user)
				Colorful:                  true,        // Beri warna agar enak dibaca di terminal
			},
		)

		dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=disable TimeZone=UTC",
			host, user, password, dbname, port)

		db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
			PrepareStmt: true, // 🚀 Mempercepat query hingga 10-20% untuk query berulang
			Logger:      newLogger,
			// NamingStrategy: schema.NamingStrategy{
			// 	SingularTable: true, // Struct `User` akan menjadi tabel `user` (bukan `users`)
			// 	TablePrefix: "vibe_", // Struct `User` akan menjadi tabel `vibe_user`
			// },
		})
		if err != nil {
			log.Fatal("Failed to connect to database:", err)
		}

		// MENGATUR CONNECTION POOLING
		sqlDB, err := db.DB()
		if err != nil {
			log.Fatal("Failed to get database instance:", err)
		}

		// buat pembatasan koneksi di postgresql karna per-1 koneksi memerlukan memory 10mb - 16mb
		// 1. SetMaxIdleConns mengatur jumlah koneksi maksimal yang menganggur (idle)
		sqlDB.SetMaxIdleConns(5)
		// 2. SetMaxOpenConns mengatur jumlah maksimal koneksi yang terbuka ke database
		sqlDB.SetMaxOpenConns(10) // Sesuaikan dengan max_connections di PostgreSQL-mu
		// 3. SetConnMaxLifetime mengatur durasi maksimal sebuah koneksi bisa dipakai ulang
		sqlDB.SetConnMaxLifetime(30 * time.Minute)

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
		//membuat index (daftar isi) untuk tabel users pada kolom username
		if err := db.Exec("CREATE INDEX IF NOT EXISTS idx_users_username_trgm ON users USING gin (username gin_trgm_ops);").Error; err != nil {
			log.Printf("Warning: failed to create trigram index on users: %v", err)
		}
		//membuat index (daftar isi) untuk tabel stories pada kolom title
		if err := db.Exec("CREATE INDEX IF NOT EXISTS idx_stories_title_trgm ON stories USING gin (title gin_trgm_ops);").Error; err != nil {
			log.Printf("Warning: failed to create trigram index on stories: %v", err)
		}

		log.Println("Database connection established and migrated")
		dbInstance = db
	})

	return dbInstance
}
