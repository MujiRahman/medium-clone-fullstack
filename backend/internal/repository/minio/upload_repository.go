package minio

import (
	"bytes"
	"context"
	"fmt"
	"os"

	"github.com/google/uuid"
	minioClient "github.com/minio/minio-go/v7"
)

type UploadRepository interface {
	UploadFile(ctx context.Context, objectName string, data []byte, contentType string) (string, error)
	DeleteFile(ctx context.Context, objectName string) error
}

type uploadRepository struct {
	client     *minioClient.Client
	bucketName string
	publicURL  string
}

func NewUploadRepository(client *minioClient.Client) UploadRepository {
	bucketName := os.Getenv("MINIO_BUCKET_NAME")
	if bucketName == "" {
		bucketName = "medium-uploads"
	}
	publicURL := os.Getenv("MINIO_PUBLIC_URL")
	if publicURL == "" {
		publicURL = "http://localhost:9000"
	}

	return &uploadRepository{
		client:     client,
		bucketName: bucketName,
		publicURL:  publicURL,
	}
}

func (r *uploadRepository) UploadFile(ctx context.Context, objectName string, data []byte, contentType string) (string, error) {
	reader := bytes.NewReader(data)

	_, err := r.client.PutObject(ctx, r.bucketName, objectName, reader, int64(len(data)), minioClient.PutObjectOptions{
		ContentType: contentType,
	})
	if err != nil {
		return "", fmt.Errorf("failed to upload file: %w", err)
	}

	url := fmt.Sprintf("%s/%s/%s", r.publicURL, r.bucketName, objectName)
	return url, nil
}

func (r *uploadRepository) DeleteFile(ctx context.Context, objectName string) error {
	return r.client.RemoveObject(ctx, r.bucketName, objectName, minioClient.RemoveObjectOptions{})
}

// GenerateObjectName creates a unique object name for uploaded files
func GenerateObjectName(imageType string, extension string) string {
	return fmt.Sprintf("images/%s/%s.%s", imageType, uuid.New().String(), extension)
}
