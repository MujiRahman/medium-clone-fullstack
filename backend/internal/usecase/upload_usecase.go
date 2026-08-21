package usecase

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"image"
	"image/jpeg"
	_ "image/png"
	"strings"

	"medium-clone/internal/domain"
	minioRepo "medium-clone/internal/repository/minio"

	"github.com/disintegration/imaging"
)

var (
	ErrInvalidImageType  = errors.New("invalid image type: must be avatar, cover, or content")
	ErrInvalidFileFormat = errors.New("invalid file format: only JPEG, PNG, and WebP are supported")
	ErrFileTooLarge      = errors.New("file too large: maximum 10MB allowed")
)

const (
	MaxFileSize     = 10 * 1024 * 1024 // 10MB
	AvatarSize      = 400
	CoverWidth      = 1200
	CoverHeight     = 630
	ContentMaxWidth = 1200
	ThumbnailWidth  = 400
	JPEGQuality     = 85
)

type UploadUseCase interface {
	ProcessAndUpload(ctx context.Context, fileData []byte, contentType string, imageType string) (*domain.UploadResult, error)
}

type uploadUseCase struct {
	uploadRepo minioRepo.UploadRepository
}

func NewUploadUseCase(uploadRepo minioRepo.UploadRepository) UploadUseCase {
	return &uploadUseCase{uploadRepo: uploadRepo}
}

func (u *uploadUseCase) ProcessAndUpload(ctx context.Context, fileData []byte, contentType string, imageType string) (*domain.UploadResult, error) {
	if imageType != "avatar" && imageType != "cover" && imageType != "content" {
		return nil, ErrInvalidImageType
	}

	if len(fileData) > MaxFileSize {
		return nil, ErrFileTooLarge
	}

	// Decode image
	img, _, err := image.Decode(bytes.NewReader(fileData))
	if err != nil {
		return nil, fmt.Errorf("failed to decode image: %w", err)
	}

	// Process image based on type
	var processedImg image.Image
	switch imageType {
	case "avatar":
		processedImg = imaging.Fill(img, AvatarSize, AvatarSize, imaging.Center, imaging.Lanczos)
	case "cover":
		processedImg = imaging.Fill(img, CoverWidth, CoverHeight, imaging.Center, imaging.Lanczos)
	case "content":
		bounds := img.Bounds()
		if bounds.Dx() > ContentMaxWidth {
			processedImg = imaging.Resize(img, ContentMaxWidth, 0, imaging.Lanczos)
		} else {
			processedImg = img
		}
	}

	// Encode as JPEG
	var fullBuf bytes.Buffer
	if err := jpeg.Encode(&fullBuf, processedImg, &jpeg.Options{Quality: JPEGQuality}); err != nil {
		return nil, fmt.Errorf("failed to encode image: %w", err)
	}

	// Generate thumbnail
	thumbnailImg := imaging.Resize(processedImg, ThumbnailWidth, 0, imaging.Lanczos)
	var thumbBuf bytes.Buffer
	if err := jpeg.Encode(&thumbBuf, thumbnailImg, &jpeg.Options{Quality: 80}); err != nil {
		return nil, fmt.Errorf("failed to encode thumbnail: %w", err)
	}

	// Upload full image
	objectName := minioRepo.GenerateObjectName(imageType, "jpg")
	fullURL, err := u.uploadRepo.UploadFile(ctx, objectName, fullBuf.Bytes(), "image/jpeg")
	if err != nil {
		return nil, fmt.Errorf("failed to upload image: %w", err)
	}

	// Upload thumbnail
	thumbObjectName := strings.Replace(objectName, ".jpg", "_thumb.jpg", 1)
	thumbURL, err := u.uploadRepo.UploadFile(ctx, thumbObjectName, thumbBuf.Bytes(), "image/jpeg")
	if err != nil {
		return nil, fmt.Errorf("failed to upload thumbnail: %w", err)
	}

	processedBounds := processedImg.Bounds()

	return &domain.UploadResult{
		URL:          fullURL,
		ThumbnailURL: thumbURL,
		Width:        processedBounds.Dx(),
		Height:       processedBounds.Dy(),
		SizeBytes:    int64(fullBuf.Len()),
	}, nil
}
