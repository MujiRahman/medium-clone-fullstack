package domain

import (
	"time"

	"github.com/google/uuid"
)

type ArticleAnalytics struct {
	ID        uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	ArticleID uuid.UUID `gorm:"type:uuid;not null;index" json:"article_id"`
	Timestamp time.Time `gorm:"not null;default:CURRENT_TIMESTAMP;index" json:"timestamp"`
	Source    string    `gorm:"type:varchar(50);not null" json:"source"`
	Duration  int       `gorm:"not null" json:"duration"` // duration in seconds
}

type ArticleStat struct {
	ID              string  `json:"id"`
	Title           string  `json:"title"`
	Views           int     `json:"views"`
	Reads           int     `json:"reads"`
	Claps           int     `json:"claps"`
	Comments        int     `json:"comments"`
	Duration        int     `json:"duration"` // average duration in seconds
	EngagementRate  float64 `json:"engagementRate"`
	ReadThroughRate float64 `json:"readThroughRate"`
}

type ViewTrend struct {
	Date  string `json:"date"`
	Views int    `json:"views"`
}

type TrafficSource struct {
	Name  string `json:"name"`
	Value int    `json:"value"`
}

type TagPerformance struct {
	Tag   string `json:"tag"`
	Views int    `json:"views"`
}

type TimeDistribution struct {
	Hour          string `json:"hour"`
	ActiveReaders int    `json:"activeReaders"`
}

type AIInsight struct {
	Type        string `json:"type"`
	Title       string `json:"title"`
	Description string `json:"description"`
}

type DashboardStats struct {
	TotalViews       int                `json:"totalViews"`
	TotalReads       int                `json:"totalReads"`
	AvgReadTime      int                `json:"avgReadTime"`
	ViewTrends       []ViewTrend        `json:"viewTrends"`
	TrafficSources   []TrafficSource    `json:"trafficSources"`
	TagPerformance   []TagPerformance   `json:"tagPerformance"`
	TimeDistribution []TimeDistribution `json:"timeDistribution"`
	Articles         []ArticleStat      `json:"articles"`
	AIInsights       []AIInsight        `json:"aiInsights"`
}

