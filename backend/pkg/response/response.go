package response

import (
	"github.com/gin-gonic/gin"
)

type APIResponse struct {
	Error   bool   `json:"error"`
	Message string `json:"message"`
	Code    int    `json:"code"`
	Data    any    `json:"data,omitempty"`
}

func JSON(c *gin.Context, code int, message string, data any) {
	c.JSON(code, APIResponse{
		Error:   code >= 400,
		Message: message,
		Code:    code,
		Data:    data,
	})
}
