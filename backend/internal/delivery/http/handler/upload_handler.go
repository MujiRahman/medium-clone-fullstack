package handler

import (
	"io"
	"net/http"

	"medium-clone/internal/usecase"
	"medium-clone/pkg/response"

	"github.com/gin-gonic/gin"
)

type UploadHandler struct {
	uploadUseCase usecase.UploadUseCase
}

func NewUploadHandler(uc usecase.UploadUseCase) *UploadHandler {
	return &UploadHandler{uploadUseCase: uc}
}

func (h *UploadHandler) UploadImage(c *gin.Context) {
	_, err := getUserIDFromCtx(c)
	if err != nil {
		response.JSON(c, http.StatusUnauthorized, "Unauthorized", nil)
		return
	}

	imageType := c.PostForm("type")
	if imageType == "" {
		response.JSON(c, http.StatusBadRequest, "Image type is required (avatar, cover, or content)", nil)
		return
	}

	file, header, err := c.Request.FormFile("file")
	if err != nil {
		response.JSON(c, http.StatusBadRequest, "File is required", nil)
		return
	}
	defer file.Close()

	fileData, err := io.ReadAll(file)
	if err != nil {
		response.JSON(c, http.StatusInternalServerError, "Failed to read file", nil)
		return
	}

	contentType := header.Header.Get("Content-Type")
	if contentType == "" {
		contentType = http.DetectContentType(fileData)
	}

	result, err := h.uploadUseCase.ProcessAndUpload(c.Request.Context(), fileData, contentType, imageType)
	if err != nil {
		switch err {
		case usecase.ErrInvalidImageType, usecase.ErrInvalidFileFormat, usecase.ErrFileTooLarge:
			response.JSON(c, http.StatusBadRequest, err.Error(), nil)
		default:
			response.JSON(c, http.StatusInternalServerError, "Failed to process and upload image", nil)
		}
		return
	}

	response.JSON(c, http.StatusOK, "Image uploaded successfully", result)
}
