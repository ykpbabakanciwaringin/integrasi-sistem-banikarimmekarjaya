package utils

import (
	"fmt"
	"strings"

	"github.com/joho/godotenv"
	"github.com/spf13/viper"
)

type Config struct {
	Server   ServerConfig   `mapstructure:"server"`
	Database DatabaseConfig `mapstructure:"database"`
	Redis    RedisConfig    `mapstructure:"redis"` // [BARU] Kerangka untuk Sesi 2
	JWT      JWTConfig      `mapstructure:"jwt"`
	WhatsApp WhatsAppConfig `mapstructure:"whatsapp"`
	SMTP     SMTPConfig     `mapstructure:"smtp"`
}

type ServerConfig struct {
	Port                string `mapstructure:"port"`
	EnableSEBProtection bool   `mapstructure:"enable_seb_protection"`
}

type DatabaseConfig struct {
	Host     string `mapstructure:"host"`
	Port     string `mapstructure:"port"`
	User     string `mapstructure:"user"`
	Password string `mapstructure:"password"`
	Name     string `mapstructure:"name"`
	SSLMode  string `mapstructure:"sslmode"`
}

type RedisConfig struct {
	Host     string `mapstructure:"host"`
	Port     string `mapstructure:"port"`
	Password string `mapstructure:"password"`
}

type JWTConfig struct {
	SecretKey       string `mapstructure:"secret_key"`
	ExpirationHours int    `mapstructure:"expiration_hours"`
}

type WhatsAppConfig struct {
	APIKey string `mapstructure:"api_key"`
}

type SMTPConfig struct {
	Host     string `mapstructure:"host"`
	Port     int    `mapstructure:"port"`
	Email    string `mapstructure:"email"`
	Password string `mapstructure:"password"`
}

func LoadConfig(path string) (config Config, err error) {
	// Prioritaskan .env untuk secrets (Lebih aman dari hardcode yaml)
	_ = godotenv.Load(".env")
	_ = godotenv.Load("../.env")

	viper.AddConfigPath(path)
	viper.SetConfigName("config")

	viper.SetEnvKeyReplacer(strings.NewReplacer(".", "_"))
	viper.AutomaticEnv()

	// Bind Environment Variables (some linters report unhandled errors)
	if err := viper.BindEnv("database.host", "DATABASE_HOST"); err != nil {
		return config, fmt.Errorf("unable to bind env database.host: %w", err)
	}
	if err := viper.BindEnv("database.password", "DATABASE_PASSWORD"); err != nil {
		return config, fmt.Errorf("unable to bind env database.password: %w", err)
	}
	if err := viper.BindEnv("redis.host", "REDIS_HOST"); err != nil {
		return config, fmt.Errorf("unable to bind env redis.host: %w", err)
	}
	if err := viper.BindEnv("redis.password", "REDIS_PASSWORD"); err != nil {
		return config, fmt.Errorf("unable to bind env redis.password: %w", err)
	}
	if err := viper.BindEnv("jwt.secret_key", "JWT_SECRET_KEY"); err != nil {
		return config, fmt.Errorf("unable to bind env jwt.secret_key: %w", err)
	}

	_ = viper.ReadInConfig()

	err = viper.Unmarshal(&config)
	if err != nil {
		return config, err
	}

	return
}
