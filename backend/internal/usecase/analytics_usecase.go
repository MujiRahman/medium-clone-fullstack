package usecase

import (
	"encoding/json"
	"fmt"
	"math"
	"medium-clone/internal/domain"
	"medium-clone/internal/repository/postgres"
	"sort"
	"strings"
	"time"
	"context"

	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
)

type AnalyticsUseCase interface {
	TrackView(articleID uuid.UUID, source string, duration int) error
	GetStats(authorID uuid.UUID, timeframe string) (*domain.DashboardStats, error)
	GetInsights(authorID uuid.UUID) ([]domain.AIInsight, error)
}

type analyticsUseCase struct {
	analyticsRepo postgres.AnalyticsRepository
	aiUseCase     AIUseCase
	rdb           *redis.Client
}

func NewAnalyticsUseCase(repo postgres.AnalyticsRepository, aiUC AIUseCase, rdb *redis.Client) AnalyticsUseCase {
	return &analyticsUseCase{
		analyticsRepo: repo,
		aiUseCase:     aiUC,
		rdb:           rdb,
	}
}

func (u *analyticsUseCase) TrackView(articleID uuid.UUID, source string, duration int) error {
	record := &domain.ArticleAnalytics{
		ArticleID: articleID,
		Timestamp: time.Now(),
		Source:    source,
		Duration:  duration,
	}
	return u.analyticsRepo.CreateRecord(record)
}

func (u *analyticsUseCase) GetStats(authorID uuid.UUID, timeframe string) (*domain.DashboardStats, error) {
	// 1. Fetch stories
	stories, err := u.analyticsRepo.GetAuthorStories(authorID)
	if err != nil {
		return nil, err
	}

	if len(stories) == 0 {
		return &domain.DashboardStats{
			TotalViews:       0,
			TotalReads:       0,
			AvgReadTime:      0,
			ViewTrends:       []domain.ViewTrend{},
			TrafficSources:   []domain.TrafficSource{},
			TagPerformance:   []domain.TagPerformance{},
			TimeDistribution: []domain.TimeDistribution{},
			Articles:         []domain.ArticleStat{},
			AIInsights: []domain.AIInsight{
				{
					Type:        "recommendation",
					Title:       "Write your first article",
					Description: "Create and publish your first article to begin tracking readership views and claps.",
				},
			},
		}, nil
	}

	articleIDs := make([]uuid.UUID, len(stories))
	for i, s := range stories {
		articleIDs[i] = s.ID
	}

	// 2. Determine timestamp threshold
	var since time.Time
	now := time.Now()
	switch timeframe {
	case "7d":
		since = now.AddDate(0, 0, -6)
		since = time.Date(since.Year(), since.Month(), since.Day(), 0, 0, 0, 0, since.Location())
	case "30d":
		since = now.AddDate(0, 0, -29)
		since = time.Date(since.Year(), since.Month(), since.Day(), 0, 0, 0, 0, since.Location())
	case "all":
		since = time.Time{}
	default:
		since = now.AddDate(0, 0, -6)
		timeframe = "7d"
	}

	// 3. Query analytics, claps, comments
	records, err := u.analyticsRepo.GetAnalyticsRecords(articleIDs, since)
	if err != nil {
		return nil, err
	}

	clapsMap, err := u.analyticsRepo.GetStoriesClapsCount(articleIDs)
	if err != nil {
		return nil, err
	}

	commentsMap, err := u.analyticsRepo.GetStoriesCommentsCount(articleIDs)
	if err != nil {
		return nil, err
	}

	// 4. Map records by article ID
	recordsByArticle := make(map[uuid.UUID][]*domain.ArticleAnalytics)
	for _, r := range records {
		recordsByArticle[r.ArticleID] = append(recordsByArticle[r.ArticleID], r)
	}

	// 5. Total Metrics
	totalViews := len(records)
	totalReads := 0
	totalDuration := 0
	for _, r := range records {
		totalDuration += r.Duration
		if r.Duration >= 30 {
			totalReads++
		}
	}
	avgReadTime := 0
	if totalViews > 0 {
		avgReadTime = totalDuration / totalViews
	}

	// 6. View Trends
	var trends []domain.ViewTrend
	if timeframe == "7d" {
		trends = make([]domain.ViewTrend, 7)
		trendMap := make(map[string]int)
		for i := 0; i < 7; i++ {
			t := now.AddDate(0, 0, -6+i)
			trends[i] = domain.ViewTrend{Date: t.Format("Mon"), Views: 0}
			trendMap[t.Format("2006-01-02")] = i
		}
		for _, r := range records {
			dateStr := r.Timestamp.Format("2006-01-02")
			if idx, exists := trendMap[dateStr]; exists {
				trends[idx].Views++
			}
		}
	} else if timeframe == "30d" {
		trends = []domain.ViewTrend{
			{Date: "Week 1", Views: 0},
			{Date: "Week 2", Views: 0},
			{Date: "Week 3", Views: 0},
			{Date: "Week 4", Views: 0},
		}
		for _, r := range records {
			diff := now.Sub(r.Timestamp)
			daysAgo := int(diff.Hours() / 24)
			if daysAgo >= 0 && daysAgo < 28 {
				if daysAgo < 7 {
					trends[3].Views++
				} else if daysAgo < 14 {
					trends[2].Views++
				} else if daysAgo < 21 {
					trends[1].Views++
				} else {
					trends[0].Views++
				}
			}
		}
	} else { // "all"
		trends = make([]domain.ViewTrend, 6)
		trendMap := make(map[string]int)
		for i := 0; i < 6; i++ {
			t := now.AddDate(0, -5+i, 0)
			trends[i] = domain.ViewTrend{Date: t.Format("Jan"), Views: 0}
			trendMap[t.Format("2006-01")] = i
		}
		for _, r := range records {
			monthStr := r.Timestamp.Format("2006-01")
			if idx, exists := trendMap[monthStr]; exists {
				trends[idx].Views++
			}
		}
	}

	// 7. Traffic Sources
	sourceCounts := make(map[string]int)
	for _, r := range records {
		src := r.Source
		if src == "" {
			src = "Direct"
		}
		sourceCounts[src]++
	}
	trafficSources := make([]domain.TrafficSource, 0)
	for name, val := range sourceCounts {
		trafficSources = append(trafficSources, domain.TrafficSource{
			Name:  name,
			Value: val,
		})
	}
	sort.Slice(trafficSources, func(i, j int) bool {
		return trafficSources[i].Value > trafficSources[j].Value
	})

	// 8. Tag Performance
	tagViews := make(map[string]int)
	for _, s := range stories {
		storyRecords := recordsByArticle[s.ID]
		storyViews := len(storyRecords)

		if s.Tags != "" {
			parts := strings.Split(s.Tags, ",")
			for _, p := range parts {
				trimmed := strings.TrimSpace(p)
				if trimmed != "" {
					tagViews[trimmed] += storyViews
				}
			}
		}
	}
	tagPerformance := make([]domain.TagPerformance, 0)
	for tag, val := range tagViews {
		tagPerformance = append(tagPerformance, domain.TagPerformance{
			Tag:   tag,
			Views: val,
		})
	}
	sort.Slice(tagPerformance, func(i, j int) bool {
		return tagPerformance[i].Views > tagPerformance[j].Views
	})
	if len(tagPerformance) > 5 {
		tagPerformance = tagPerformance[:5]
	}

	// 9. Time Distribution
	timeDistribution := []domain.TimeDistribution{
		{Hour: "00:00", ActiveReaders: 0},
		{Hour: "04:00", ActiveReaders: 0},
		{Hour: "08:00", ActiveReaders: 0},
		{Hour: "12:00", ActiveReaders: 0},
		{Hour: "16:00", ActiveReaders: 0},
		{Hour: "20:00", ActiveReaders: 0},
	}
	for _, r := range records {
		h := r.Timestamp.Hour()
		if h >= 0 && h < 4 {
			timeDistribution[0].ActiveReaders++
		} else if h >= 4 && h < 8 {
			timeDistribution[1].ActiveReaders++
		} else if h >= 8 && h < 12 {
			timeDistribution[2].ActiveReaders++
		} else if h >= 12 && h < 16 {
			timeDistribution[3].ActiveReaders++
		} else if h >= 16 && h < 20 {
			timeDistribution[4].ActiveReaders++
		} else {
			timeDistribution[5].ActiveReaders++
		}
	}

	// 10. Articles list
	var articlesStats []domain.ArticleStat
	for _, s := range stories {
		storyRecords := recordsByArticle[s.ID]
		storyViews := len(storyRecords)

		storyReads := 0
		storyDurationSum := 0
		for _, sr := range storyRecords {
			storyDurationSum += sr.Duration
			if sr.Duration >= 30 {
				storyReads++
			}
		}
		avgDur := 0
		if storyViews > 0 {
			avgDur = storyDurationSum / storyViews
		}

		claps := clapsMap[s.ID]
		comments := commentsMap[s.ID]

		engagementRate := 0.0
		if storyViews > 0 {
			engagementRate = (float64(claps+comments) / float64(storyViews)) * 100.0
			engagementRate = math.Round(engagementRate*10) / 10
		}

		readThroughRate := 0.0
		if storyViews > 0 {
			readThroughRate = (float64(storyReads) / float64(storyViews)) * 100.0
			readThroughRate = math.Round(readThroughRate*10) / 10
		}

		articlesStats = append(articlesStats, domain.ArticleStat{
			ID:              s.ID.String(),
			Title:           s.Title,
			Views:           storyViews,
			Reads:           storyReads,
			Claps:           claps,
			Comments:        comments,
			Duration:        avgDur,
			EngagementRate:  engagementRate,
			ReadThroughRate: readThroughRate,
		})
	}
	sort.Slice(articlesStats, func(i, j int) bool {
		return articlesStats[i].Views > articlesStats[j].Views
	})

	// AI recommendations will be fetched asynchronously via GetInsights
	aiInsights := []domain.AIInsight{}

	return &domain.DashboardStats{
		TotalViews:       totalViews,
		TotalReads:       totalReads,
		AvgReadTime:      avgReadTime,
		ViewTrends:       trends,
		TrafficSources:   trafficSources,
		TagPerformance:   tagPerformance,
		TimeDistribution: timeDistribution,
		Articles:         articlesStats,
		AIInsights:       aiInsights,
	}, nil
}

func (u *analyticsUseCase) GetInsights(authorID uuid.UUID) ([]domain.AIInsight, error) {
	ctx := context.Background()
	cacheKey := fmt.Sprintf("insights:%s", authorID.String())

	// 1. Check Redis Cache First
	cached, err := u.rdb.Get(ctx, cacheKey).Result()
	if err == nil && cached != "" {
		var insights []domain.AIInsight
		if errDec := json.Unmarshal([]byte(cached), &insights); errDec == nil {
			return insights, nil
		}
	}

	// 2. Fetch stats for all time
	stats, err := u.GetStats(authorID, "all")
	if err != nil {
		return nil, err
	}

	// 3. Fallback/Default insights if no articles
	defaultInsights := []domain.AIInsight{
		{
			Type:        "optimization",
			Title:       "Title Engagement Check",
			Description: "Your articles have stable view statistics. Try using more action-oriented verbs in your headlines to see if it increases click-through rates.",
		},
		{
			Type:        "recommendation",
			Title:       "Expand Popular Topics",
			Description: "Readers are highly engaged with your main tags. Drafting sequel posts or deep-dives into these topics could sustain traffic.",
		},
		{
			Type:        "sentiment",
			Title:       "Engagement Strategy",
			Description: "Include a clear call-to-action (like asking a question at the end of the post) to encourage more readers to comment and clap.",
		},
	}

	if stats.TotalViews == 0 {
		return defaultInsights, nil
	}

	// 4. Generate with Gemini
	statsJSON, _ := json.Marshal(map[string]interface{}{
		"totalViews":  stats.TotalViews,
		"totalReads":  stats.TotalReads,
		"avgReadTime": stats.AvgReadTime,
		"articles":    stats.Articles,
		"topTags":     stats.TagPerformance,
	})

	prompt := fmt.Sprintf(`Analyze the following writer dashboard statistics. Generate exactly 3 personalized recommendations or insights in a JSON array of objects to help the author grow their readership, optimize story engagement, and improve read completion rate.
Format the output strictly as a JSON array of objects, where each object has these fields:
- "type": "optimization", "recommendation", or "sentiment"
- "title": a short headline of the tip
- "description": a detailed description with specific action points (mentioning article names or tags where relevant)

Respond ONLY with the raw JSON array. Do not wrap it in markdown code fences or HTML blockquotes. Respond only in valid raw JSON format.

Statistics:
%s`, string(statsJSON))

	aiResult, err := u.aiUseCase.GenerateText("custom", "", prompt)
	if err == nil && aiResult != "" {
		var generatedInsights []domain.AIInsight
		if errDec := json.Unmarshal([]byte(aiResult), &generatedInsights); errDec == nil && len(generatedInsights) > 0 {
			// Save to Redis (no expiration, invalidated on article update/create)
			insightsJSON, _ := json.Marshal(generatedInsights)
			u.rdb.Set(ctx, cacheKey, insightsJSON, 0)
			return generatedInsights, nil
		} else {
			fmt.Printf("Failed to decode AI insights JSON: %v. Raw response: %s\n", errDec, aiResult)
		}
	} else if err != nil {
		fmt.Printf("Gemini call failed for stats insights: %v\n", err)
	}

	return defaultInsights, nil
}

