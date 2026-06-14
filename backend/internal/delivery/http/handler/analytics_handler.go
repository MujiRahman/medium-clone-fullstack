package handler


import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"medium-clone/internal/usecase"
	"medium-clone/pkg/response"
)

type AnalyticsHandler struct {
	analyticsUseCase usecase.AnalyticsUseCase
}

func NewAnalyticsHandler(uc usecase.AnalyticsUseCase) *AnalyticsHandler {
	return &AnalyticsHandler{analyticsUseCase: uc}
}

type TrackViewReq struct {
	ArticleID string `json:"article_id" binding:"required"`
	Source    string `json:"source" binding:"required"`
	Duration  int    `json:"duration"` // duration in seconds
}

func (h *AnalyticsHandler) Track(c *gin.Context) {
	var req TrackViewReq
	if err := c.ShouldBindJSON(&req); err != nil {
		response.JSON(c, http.StatusBadRequest, "Invalid request body", nil)
		return
	}

	artUUID, err := uuid.Parse(req.ArticleID)
	if err != nil {
		response.JSON(c, http.StatusBadRequest, "Invalid article ID format", nil)
		return
	}

	source := req.Source
	if source == "" {
		source = "Direct"
	}

	err = h.analyticsUseCase.TrackView(artUUID, source, req.Duration)
	if err != nil {
		response.JSON(c, http.StatusInternalServerError, "Failed to track analytics", nil)
		return
	}

	response.JSON(c, http.StatusOK, "Analytics logged successfully", nil)
}




func (h *AnalyticsHandler) GetStats(c *gin.Context) {
	userID, err := getUserIDFromCtx(c)
	if err != nil {
		response.JSON(c, http.StatusUnauthorized, err.Error(), nil)
		return
	}

	timeframe := c.DefaultQuery("timeframe", "7d")

	stats, err := h.analyticsUseCase.GetStats(userID, timeframe)
	if err != nil {
		response.JSON(c, http.StatusInternalServerError, "Failed to fetch analytics statistics", nil)
		return
	}

	response.JSON(c, http.StatusOK, "Statistics fetched successfully", stats)
}

