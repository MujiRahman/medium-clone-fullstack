package handler

import (
	"errors"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"medium-clone/internal/usecase"
	"medium-clone/pkg/response"
)

type AuthHandler struct {
	authUseCase usecase.AuthUseCase
}

func NewAuthHandler(uc usecase.AuthUseCase) *AuthHandler {
	return &AuthHandler{authUseCase: uc}
}

func (h *AuthHandler) Register(c *gin.Context) {
	var req usecase.RegisterReq
	if err := c.ShouldBindJSON(&req); err != nil {
		response.JSON(c, http.StatusBadRequest, "Invalid request body", nil)
		return
	}

	user, err := h.authUseCase.Register(req)
	if err != nil {
		if errors.Is(err, usecase.ErrEmailExists) || errors.Is(err, usecase.ErrUsernameExists) {
			response.JSON(c, http.StatusConflict, err.Error(), nil)
			return
		}
		response.JSON(c, http.StatusInternalServerError, "Failed to register user", nil)
		return
	}

	response.JSON(c, http.StatusCreated, "User registered successfully", gin.H{
		"id":       user.ID,
		"username": user.Username,
		"email":    user.Email,
	})
}

func (h *AuthHandler) Login(c *gin.Context) {
	var req usecase.LoginReq
	if err := c.ShouldBindJSON(&req); err != nil {
		response.JSON(c, http.StatusBadRequest, "Invalid request body", nil)
		return
	}

	token, err := h.authUseCase.Login(req)
	if err != nil {
		if errors.Is(err, usecase.ErrInvalidCreds) {
			response.JSON(c, http.StatusUnauthorized, err.Error(), nil)
			return
		}
		response.JSON(c, http.StatusInternalServerError, "Failed to authenticate", nil)
		return
	}

	// Set HttpOnly cookie
	// MaxAge 24 hours = 86400 seconds
	cookieSecure := os.Getenv("COOKIE_SECURE") == "true"
	sameSiteMode := http.SameSiteLaxMode
	if envSameSite := os.Getenv("COOKIE_SAMESITE"); envSameSite != "" {
		switch envSameSite {
		case "none":
			sameSiteMode = http.SameSiteNoneMode
		case "strict":
			sameSiteMode = http.SameSiteStrictMode
		}
	}

	c.SetSameSite(sameSiteMode)
	c.SetCookie("jwt_token", token, 86400, "/", "", cookieSecure, true)

	response.JSON(c, http.StatusOK, "Login successful", nil)
}

func (h *AuthHandler) LoginWithFirebase(c *gin.Context) {
	var req struct {
		IDToken string `json:"id_token" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.JSON(c, http.StatusBadRequest, "Invalid request body", nil)
		return
	}

	token, err := h.authUseCase.LoginWithFirebase(req.IDToken)
	if err != nil {
		response.JSON(c, http.StatusUnauthorized, "Failed to authenticate with Firebase: "+err.Error(), nil)
		return
	}

	// Set HttpOnly cookie
	cookieSecure := os.Getenv("COOKIE_SECURE") == "true"
	sameSiteMode := http.SameSiteLaxMode
	if envSameSite := os.Getenv("COOKIE_SAMESITE"); envSameSite != "" {
		switch envSameSite {
		case "none":
			sameSiteMode = http.SameSiteNoneMode
		case "strict":
			sameSiteMode = http.SameSiteStrictMode
		}
	}

	c.SetSameSite(sameSiteMode)
	c.SetCookie("jwt_token", token, 86400, "/", "", cookieSecure, true)

	response.JSON(c, http.StatusOK, "Firebase Login successful", nil)
}

func (h *AuthHandler) Logout(c *gin.Context) {
	cookieSecure := os.Getenv("COOKIE_SECURE") == "true"
	sameSiteMode := http.SameSiteLaxMode
	if envSameSite := os.Getenv("COOKIE_SAMESITE"); envSameSite != "" {
		switch envSameSite {
		case "none":
			sameSiteMode = http.SameSiteNoneMode
		case "strict":
			sameSiteMode = http.SameSiteStrictMode
		}
	}

	// Clear the cookie by setting negative MaxAge
	c.SetSameSite(sameSiteMode)
	c.SetCookie("jwt_token", "", -1, "/", "", cookieSecure, true)

	response.JSON(c, http.StatusOK, "Logout successful", nil)
}

func (h *AuthHandler) GetMe(c *gin.Context) {
	// UUID user_id should be extracted from JWTMiddleware Context
	val, exists := c.Get("user_id")
	if !exists {
		response.JSON(c, http.StatusUnauthorized, "Unauthorized", nil)
		return
	}
	
	// Safely asserting and parsing UUID
	userIDStr, ok := val.(string)
	if !ok {
		response.JSON(c, http.StatusUnauthorized, "Unauthorized", nil)
		return
	}

	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		response.JSON(c, http.StatusUnauthorized, "Unauthorized", nil)
		return
	}

	user, err := h.authUseCase.GetMe(userID)
	if err != nil {
		response.JSON(c, http.StatusNotFound, "User not found", nil)
		return
	}

	// Only return safe public info
	publicInfo := map[string]interface{}{
		"id":         user.ID,
		"username":   user.Username,
		"email":      user.Email,
		"avatar_url": user.AvatarURL,
	}

	response.JSON(c, http.StatusOK, "Success", publicInfo)
}
