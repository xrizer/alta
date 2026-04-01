// Package signoz ships structured log records to SigNoz via the OpenTelemetry
// Logs signal over OTLP/HTTP JSON (no external dependencies — stdlib only).
//
// SigNoz endpoint:
//   - Self-hosted : http://<host>:4318   (no token required)
//   - SigNoz Cloud: https://ingest.<region>.signoz.cloud:443  (token required)
//
// Call Init() once at startup. If the endpoint is empty the logger is a no-op.
package signoz

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"time"
)

// OTLP severity numbers (OTel Log Data Model spec).
const (
	severityWarn  = 13 // SEVERITY_NUMBER_WARN
	severityError = 17 // SEVERITY_NUMBER_ERROR
)

// ---- OTLP JSON structures (minimal subset) ----------------------------------

type anyValue struct {
	StringValue string `json:"stringValue,omitempty"`
	IntValue    string `json:"intValue,omitempty"` // OTLP encodes int64 as string
}

type kvPair struct {
	Key   string   `json:"key"`
	Value anyValue `json:"value"`
}

type logRecord struct {
	TimeUnixNano   string   `json:"timeUnixNano"`
	SeverityNumber int      `json:"severityNumber"`
	SeverityText   string   `json:"severityText"`
	Body           anyValue `json:"body"`
	Attributes     []kvPair `json:"attributes,omitempty"`
}

type scopeLogs struct {
	Scope      map[string]string `json:"scope"`
	LogRecords []logRecord       `json:"logRecords"`
}

type resource struct {
	Attributes []kvPair `json:"attributes"`
}

type resourceLogs struct {
	Resource  resource    `json:"resource"`
	ScopeLogs []scopeLogs `json:"scopeLogs"`
}

type logsPayload struct {
	ResourceLogs []resourceLogs `json:"resourceLogs"`
}

// -----------------------------------------------------------------------------

// Logger sends OTLP log records to a SigNoz-compatible endpoint.
type Logger struct {
	endpoint    string // e.g. "http://localhost:4318"
	accessToken string // SigNoz Cloud token (empty for self-hosted)
	service     string
	client      *http.Client
}

var defaultLogger *Logger

// Init initialises the package-level logger.
// endpoint example: "http://localhost:4318" or "https://ingest.in.signoz.cloud:443"
// accessToken is only required for SigNoz Cloud; pass "" for self-hosted.
func Init(endpoint, accessToken, serviceName string) {
	if endpoint == "" {
		return
	}
	defaultLogger = &Logger{
		endpoint:    endpoint,
		accessToken: accessToken,
		service:     serviceName,
		client:      &http.Client{Timeout: 5 * time.Second},
	}
}

// LogError sends an ERROR-level log entry asynchronously.
func LogError(message string, attrs map[string]interface{}) {
	if defaultLogger == nil {
		return
	}
	go defaultLogger.send(severityError, "ERROR", message, attrs)
}

// LogWarn sends a WARN-level log entry asynchronously.
func LogWarn(message string, attrs map[string]interface{}) {
	if defaultLogger == nil {
		return
	}
	go defaultLogger.send(severityWarn, "WARN", message, attrs)
}

func (l *Logger) send(severityNum int, severityText, message string, attrs map[string]interface{}) {
	// Build OTLP attributes list
	kvs := make([]kvPair, 0, len(attrs))
	for k, v := range attrs {
		switch val := v.(type) {
		case int:
			kvs = append(kvs, kvPair{Key: k, Value: anyValue{IntValue: strconv.Itoa(val)}})
		case string:
			kvs = append(kvs, kvPair{Key: k, Value: anyValue{StringValue: val}})
		default:
			kvs = append(kvs, kvPair{Key: k, Value: anyValue{StringValue: fmt.Sprintf("%v", val)}})
		}
	}

	payload := logsPayload{
		ResourceLogs: []resourceLogs{
			{
				Resource: resource{
					Attributes: []kvPair{
						{Key: "service.name", Value: anyValue{StringValue: l.service}},
					},
				},
				ScopeLogs: []scopeLogs{
					{
						Scope:      map[string]string{"name": l.service},
						LogRecords: []logRecord{
							{
								TimeUnixNano:   strconv.FormatInt(time.Now().UnixNano(), 10),
								SeverityNumber: severityNum,
								SeverityText:   severityText,
								Body:           anyValue{StringValue: message},
								Attributes:     kvs,
							},
						},
					},
				},
			},
		},
	}

	body, err := json.Marshal(payload)
	if err != nil {
		log.Printf("signoz: marshal error: %v", err)
		return
	}

	req, err := http.NewRequest(http.MethodPost, l.endpoint+"/v1/logs", bytes.NewBuffer(body))
	if err != nil {
		log.Printf("signoz: create request error: %v", err)
		return
	}

	req.Header.Set("Content-Type", "application/json")
	if l.accessToken != "" {
		req.Header.Set("signoz-access-token", l.accessToken)
	}

	resp, err := l.client.Do(req)
	if err != nil {
		log.Printf("signoz: send error: %v", err)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		log.Printf("signoz: unexpected response status %d", resp.StatusCode)
	}
}
