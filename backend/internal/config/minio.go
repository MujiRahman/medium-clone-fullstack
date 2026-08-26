package config

import (
	"context"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
)

func InitMinIO() *minio.Client {
	endpoint := os.Getenv("MINIO_ENDPOINT")
	accessKey := os.Getenv("MINIO_ROOT_USER")
	secretKey := os.Getenv("MINIO_ROOT_PASSWORD")
	bucketName := os.Getenv("MINIO_BUCKET_NAME")
	useSSL := os.Getenv("MINIO_USE_SSL") == "true"

	if endpoint == "" {
		endpoint = "localhost:9000"
	}
	if accessKey == "" {
		accessKey = "minioadmin"
	}
	if secretKey == "" {
		secretKey = "minioadmin123"
	}
	if bucketName == "" {
		bucketName = "medium-uploads"
	}

	// Membuat HTTP Transport khusus dengan timeout
	customTransport := &http.Transport{
		MaxIdleConns:       100,
		IdleConnTimeout:    90 * time.Second,
		DisableCompression: true, // Jangan kompres gambar 2x (biar CPU hemat)
	}
	client, err := minio.New(endpoint, &minio.Options{
		Creds:     credentials.NewStaticV4(accessKey, secretKey, ""),
		Secure:    useSSL,
		Transport: customTransport,
	})
	if err != nil {
		log.Printf("Warning: Failed to initialize MinIO client: %v", err)
		return nil
	}

	ctx := context.Background()
	exists, err := client.BucketExists(ctx, bucketName)
	if err != nil {
		log.Printf("Warning: Failed to check MinIO bucket: %v", err)
	} else if !exists {
		err = client.MakeBucket(ctx, bucketName, minio.MakeBucketOptions{})
		if err != nil {
			log.Printf("Warning: Failed to create MinIO bucket '%s': %v", bucketName, err)
		} else {
			log.Printf("MinIO bucket '%s' created successfully", bucketName)
		}

		policy := `{"Version": "2012-10-17","Statement": [{"Effect": "Allow","Principal": {"AWS": ["*"]},"Action": ["s3:GetObject"],"Resource": ["arn:aws:s3:::` + bucketName + `/*"]}]}`
		if err := client.SetBucketPolicy(ctx, bucketName, policy); err != nil {
			log.Printf("Warning: Failed to set bucket policy: %v", err)
		}
	}

	log.Println("MinIO connection established")
	return client
}
