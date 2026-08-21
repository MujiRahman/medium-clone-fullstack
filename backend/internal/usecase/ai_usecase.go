package usecase

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"time"
)

type AIUseCase interface {
	GenerateText(ctx context.Context, action string, text string, customPrompt string) (string, error)
}

type aiUseCase struct {
	client *http.Client
}

func NewAIUseCase() AIUseCase {
	return &aiUseCase{
		client: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

type GeminiRequest struct {
	Contents []GeminiContent `json:"contents"`
}

type GeminiContent struct {
	Parts []GeminiPart `json:"parts"`
}

type GeminiPart struct {
	Text string `json:"text"`
}

type GeminiResponse struct {
	Candidates []struct {
		Content struct {
			Parts []struct {
				Text string `json:"text"`
			} `json:"parts"`
		} `json:"content"`
	} `json:"candidates"`
}

func (u *aiUseCase) GenerateText(ctx context.Context, action string, text string, customPrompt string) (string, error) {
	apiKey := os.Getenv("GEMINI_API_KEY")
	if apiKey == "" {
		return "", errors.New("GEMINI_API_KEY is not set in backend configuration")
	}

	var prompt string
	switch action {
	case "fix-grammar":
		prompt = fmt.Sprintf(
			"You are an expert editor. Correct any spelling, grammar, punctuation, and typos in the following text. Preserve the language (e.g. if the input is Indonesian, keep it in Indonesian). Do NOT add any explanations, introductory text, concluding notes, or markdown fences (like ```). Return ONLY the edited text.\n\nInput text:\n%s", 
			text,
		)
	case "shorten":
		prompt = fmt.Sprintf(
			"You are an expert editor. Rewrite the following text to make it significantly more concise and punchy, while retaining the core meaning and tone. Do NOT add any explanations, introductory text, concluding notes, or markdown fences (like ```). Return ONLY the shortened text.\n\nInput text:\n%s", 
			text,
		)
	case "extend":
		prompt = fmt.Sprintf(
			"You are an expert writer. Elaborate and expand upon the following text by adding depth, supporting details, or relevant examples. Maintain the original tone and style. Do NOT add any explanations, introductory text, concluding notes, or markdown fences (like ```). Return ONLY the expanded text.\n\nInput text:\n%s", 
			text,
		)
	case "continue":
		prompt = fmt.Sprintf(
			"You are a skilled author. Continue writing the story/article naturally based on the provided draft. Match the tone, style, vocabulary, and language of the draft. Do NOT repeat or include the draft content in your response. Return ONLY the new continuation text. Do NOT add any explanations, introductory text, concluding notes, or markdown fences (like ```).\n\nDraft content:\n%s", 
			text,
		)
	case "custom":
		prompt = fmt.Sprintf(
			"You are an expert assistant. Modify, rewrite, or analyze the text based on the following instruction: \"%s\". Do NOT add any explanations, introductory text, concluding notes, or markdown fences (like ```). Return ONLY the resulting text.\n\nInput text:\n%s", 
			customPrompt,
			text,
		)
	case "tldr":
		prompt = fmt.Sprintf(
			"You are an expert editor. Summarize the following text in exactly one brief paragraph (TL;DR format) suitable for a story feed preview. Do NOT add any explanations, introductory text, concluding notes, or markdown fences (like ```). Return ONLY the 1-paragraph summary.\n\nText:\n%s",
			text,
		)
	case "tags":
		prompt = fmt.Sprintf(
			"You are an expert editor. Analyze the following text and recommend 3 to 5 relevant tags/categories. Return them ONLY as a single line of comma-separated tags (e.g., 'Tech, Programming, Go, Web Development'). Do NOT add any explanations, introductory text, concluding notes, list bullets, or markdown fences (like ```). Return ONLY the comma-separated tag list.\n\nText:\n%s",
			text,
		)
	default:
		return "", fmt.Errorf("unknown action: %s", action)
	}

	reqBody := GeminiRequest{
		Contents: []GeminiContent{
			{
				Parts: []GeminiPart{
					{
						Text: prompt,
					},
				},
			},
		},
	}

	jsonData, err := json.Marshal(reqBody)
	if err != nil {
		return "", fmt.Errorf("failed to marshal request: %w", err)
	}

	apiURL := "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent"
	req, err := http.NewRequest("POST", apiURL, bytes.NewBuffer(jsonData))
	if err != nil {
		return "", fmt.Errorf("failed to create http request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-goog-api-key", apiKey)

	resp, err := u.client.Do(req)
	if err != nil {
		return "", fmt.Errorf("failed to call gemini api: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("gemini api returned status %d: %s", resp.StatusCode, string(bodyBytes))
	}

	var geminiResp GeminiResponse
	if err := json.NewDecoder(resp.Body).Decode(&geminiResp); err != nil {
		return "", fmt.Errorf("failed to decode gemini response: %w", err)
	}

	if len(geminiResp.Candidates) == 0 || len(geminiResp.Candidates[0].Content.Parts) == 0 {
		return "", errors.New("gemini api returned an empty text generation result")
	}

	resultText := geminiResp.Candidates[0].Content.Parts[0].Text
	resultText = strings.TrimSpace(resultText)

	// Clean up markdown block quotes code ticks in case model returned them despite system prompt instructions
	if strings.HasPrefix(resultText, "```") {
		lines := strings.Split(resultText, "\n")
		if len(lines) >= 2 {
			// Remove the starting ```something
			lines = lines[1:]
			// Remove the trailing ```
			if len(lines) > 0 && strings.HasPrefix(lines[len(lines)-1], "```") {
				lines = lines[:len(lines)-1]
			}
			resultText = strings.TrimSpace(strings.Join(lines, "\n"))
		}
	}

	return resultText, nil
}
