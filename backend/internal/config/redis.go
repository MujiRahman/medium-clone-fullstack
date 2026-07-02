package config

import (
	"context"
	"fmt"
	"log"
	"os"

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
		Addr:     fmt.Sprintf("%s:%s", host, port),
		Password: "", // no password set by default in docker-compose
		DB:       0,  // use default DB
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
