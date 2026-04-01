package config

import (
	"log"
	"os"
	"strings"
	"time"

	"github.com/joho/godotenv"
)

type Config struct {
	DBHost     string
	DBPort     string
	DBUser     string
	DBPassword string
	DBName     string
	DBSSLMode  string

	JWTSecret         string
	JWTRefreshSecret  string
	JWTAccessExpiry   time.Duration
	JWTRefreshExpiry  time.Duration

	AppPort      string
	CORSOrigins  string

	SuperAdminEmail    string
	SuperAdminPassword string

	AdminEmail    string
	AdminPassword string

	KafkaBrokers []string

	DynatraceAPIURL   string
	DynatraceAPIToken string
}

func Load() *Config {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	accessExpiry, err := time.ParseDuration(getEnv("JWT_ACCESS_EXPIRY", "15m"))
	if err != nil {
		accessExpiry = 15 * time.Minute
	}

	refreshExpiry, err := time.ParseDuration(getEnv("JWT_REFRESH_EXPIRY", "168h"))
	if err != nil {
		refreshExpiry = 7 * 24 * time.Hour
	}

	return &Config{
		DBHost:     getEnv("DB_HOST", "localhost"),
		DBPort:     getEnv("DB_PORT", "5432"),
		DBUser:     getEnv("DB_USER", "postgres"),
		DBPassword: getEnv("DB_PASSWORD", "postgres"),
		DBName:     getEnv("DB_NAME", "hris"),
		DBSSLMode:  getEnv("DB_SSLMODE", "disable"),

		JWTSecret:        getEnv("JWT_SECRET", "secret"),
		JWTRefreshSecret: getEnv("JWT_REFRESH_SECRET", "refresh-secret"),
		JWTAccessExpiry:  accessExpiry,
		JWTRefreshExpiry: refreshExpiry,

		AppPort:     getEnv("APP_PORT", "8080"),
		CORSOrigins: getEnv("CORS_ORIGINS", "http://localhost:3000"),

		SuperAdminEmail:    getEnv("SUPERADMIN_EMAIL", "superadmin@hris.com"),
		SuperAdminPassword: getEnv("SUPERADMIN_PASSWORD", "superadmin123"),

		AdminEmail:    getEnv("ADMIN_EMAIL", "admin@hris.com"),
		AdminPassword: getEnv("ADMIN_PASSWORD", "admin123"),

		KafkaBrokers: splitBrokers(getEnv("KAFKA_BROKERS", "localhost:9092")),

		DynatraceAPIURL:   getEnv("DYNATRACE_API_URL", ""),
		DynatraceAPIToken: getEnv("DYNATRACE_API_TOKEN", ""),
	}
}

func getEnv(key, fallback string) string {
	if value, ok := os.LookupEnv(key); ok {
		return value
	}
	return fallback
}

func splitBrokers(brokers string) []string {
	var result []string
	for _, b := range strings.Split(brokers, ",") {
		b = strings.TrimSpace(b)
		if b != "" {
			result = append(result, b)
		}
	}
	return result
}
