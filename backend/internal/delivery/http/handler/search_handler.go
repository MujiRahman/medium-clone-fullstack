package handler

import (
	"net/http"

	"medium-clone/internal/usecase"
	"medium-clone/pkg/response"

	"github.com/gin-gonic/gin"
)

type SearchHandler struct {
	searchUseCase usecase.SearchUseCase
}

func NewSearchHandler(searchUseCase usecase.SearchUseCase) *SearchHandler {
	return &SearchHandler{
		searchUseCase: searchUseCase,
	}
}

func (h *SearchHandler) Autocomplete(c *gin.Context) {
	query := c.Query("q")
	result, err := h.searchUseCase.Autocomplete(c.Request.Context(), query)
	if err != nil {
		response.JSON(c, http.StatusInternalServerError, "Search query failed", nil)
		return
	}

	response.JSON(c, http.StatusOK, "Success", result)
}
