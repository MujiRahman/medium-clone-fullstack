package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

type UserHandler struct{}

func NewUserHandler() *UserHandler {
	return &UserHandler{}
}

func (h *UserHandler) GetProfile(c *gin.Context) {
	c.JSON(http.StatusNotImplemented, gin.H{"error": true, "message": "Not Implemented", "code": http.StatusNotImplemented})
}

func (h *UserHandler) UpdateProfile(c *gin.Context) {
	c.JSON(http.StatusNotImplemented, gin.H{"error": true, "message": "Not Implemented", "code": http.StatusNotImplemented})
}
