package utils

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"

	"github.com/gosimple/slug"
)

// GenerateUniqueSlug creates a URL-friendly slug and appends a random hex to ensure uniqueness
func GenerateUniqueSlug(title string) string {
	baseSlug := slug.Make(title)
	
	// Generate 4 random bytes
	b := make([]byte, 4)
	rand.Read(b)
	uniqueHex := hex.EncodeToString(b)
	
	return fmt.Sprintf("%s-%s", baseSlug, uniqueHex)
}
