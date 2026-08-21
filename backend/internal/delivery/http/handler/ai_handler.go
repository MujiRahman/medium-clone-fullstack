package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"medium-clone/internal/usecase"
	"medium-clone/pkg/response"
)

type AIHandler struct {
	aiUseCase usecase.AIUseCase
}

func NewAIHandler(uc usecase.AIUseCase) *AIHandler {
	return &AIHandler{aiUseCase: uc}
}

type GenerateReq struct {
	Text         string `json:"text"`
	Action       string `json:"action" binding:"required"`
	CustomPrompt string `json:"custom_prompt"`
}

func (h *AIHandler) Generate(c *gin.Context) {
	var req GenerateReq
	if err := c.ShouldBindJSON(&req); err != nil {
		response.JSON(c, http.StatusBadRequest, "Invalid request body", nil)
		return
	}

	result, err := h.aiUseCase.GenerateText(c.Request.Context(), req.Action, req.Text, req.CustomPrompt)
	if err != nil {
		response.JSON(c, http.StatusInternalServerError, err.Error(), nil)
		return
	}

	response.JSON(c, http.StatusOK, "AI Generation successful", gin.H{
		"result": result,
	})
}
