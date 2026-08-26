package config

import (
	"context"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/redis/go-redis/v9"
)

func InitRedis() *redis.Client {
	host := os.Getenv("REDIS_HOST")
	port := os.Getenv("REDIS_PORT")
	if host == "" {
		host = "localhost"
	}
	if port == "" {
		port = "6379"
	}

	client := redis.NewClient(&redis.Options{
		Addr:         fmt.Sprintf("%s:%s", host, port),
		Password:     "",              // no password set by default in docker-compose
		DB:           0,               // use default DB
		PoolSize:     50,              // Maksimal 50 koneksi berbarengan ke Redis
		MinIdleConns: 10,              // Selalu siapkan 10 koneksi nganggur agar cepat merespons
		DialTimeout:  5 * time.Second, // Nyerah jika dalam 5 detik gagal konek awal
		ReadTimeout:  3 * time.Second, // Nyerah jika Redis tidak membalas dalam 3 detik
		WriteTimeout: 3 * time.Second, // Nyerah jika gagal mengirim data dalam 3 detik
	})

	// Test the connection
	_, err := client.Ping(context.Background()).Result()
	if err != nil {
		log.Printf("Warning: Failed to connect to Redis at %s:%s - %v", host, port, err)
	} else {
		log.Println("Redis connection established")
	}

	return client
}
