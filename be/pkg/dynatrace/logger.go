package dynatrace

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"
)

type logEntry struct {
	Content    string                 `json:"content"`
	Status     string                 `json:"status"`
	Timestamp  string                 `json:"timestamp"`
	Attributes map[string]interface{} `json:"attributes,omitempty"`
}

type Logger struct {
	apiURL   string
	apiToken string
	client   *http.Client
}

var defaultLogger *Logger

// Init initialises the package-level default logger.
// Call this once at application startup. If apiURL or apiToken is empty
// the logger silently no-ops, so the application runs fine without Dynatrace.
func Init(apiURL, apiToken string) {
	defaultLogger = &Logger{
		apiURL:   apiURL,
		apiToken: apiToken,
		client:   &http.Client{Timeout: 5 * time.Second},
	}
}

func enabled() bool {
	return defaultLogger != nil && defaultLogger.apiURL != "" && defaultLogger.apiToken != ""
}

// LogError sends an ERROR-level log entry to Dynatrace asynchronously.
func LogError(message string, attrs map[string]interface{}) {
	if !enabled() {
		return
	}
	go defaultLogger.send("ERROR", message, attrs)
}

// LogWarn sends a WARN-level log entry to Dynatrace asynchronously.
func LogWarn(message string, attrs map[string]interface{}) {
	if !enabled() {
		return
	}
	go defaultLogger.send("WARN", message, attrs)
}

func (l *Logger) send(status, message string, attrs map[string]interface{}) {
	entry := logEntry{
		Content:    message,
		Status:     status,
		Timestamp:  time.Now().UTC().Format(time.RFC3339Nano),
		Attributes: attrs,
	}

	body, err := json.Marshal([]logEntry{entry})
	if err != nil {
		log.Printf("dynatrace: marshal error: %v", err)
		return
	}

	req, err := http.NewRequest(
		http.MethodPost,
		fmt.Sprintf("%s/api/v2/logs/ingest", l.apiURL),
		bytes.NewBuffer(body),
	)
	if err != nil {
		log.Printf("dynatrace: create request error: %v", err)
		return
	}

	req.Header.Set("Content-Type", "application/json; charset=utf-8")
	req.Header.Set("Authorization", fmt.Sprintf("Api-Token %s", l.apiToken))

	resp, err := l.client.Do(req)
	if err != nil {
		log.Printf("dynatrace: send error: %v", err)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		log.Printf("dynatrace: unexpected response status %d", resp.StatusCode)
	}
}
