package utils

import (
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

type Claims struct {
	UserID        string `json:"user_id"`
	Username      string `json:"username"` // Harus ada
	InstitutionID string `json:"institution_id"`
	Role          string `json:"role"`
	ClassID       string `json:"class_id"`
	TokenVersion  int    `json:"token_version"` // Harus ada
	jwt.RegisteredClaims
}

func GenerateToken(userID, username, instID, role, classID string, tokenVersion int, secret string, expiryDuration time.Duration) (string, error) {
	claims := Claims{
		UserID:        userID,
		Username:      username,
		InstitutionID: instID,
		Role:          role,
		ClassID:       classID,
		TokenVersion:  tokenVersion,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(expiryDuration)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Issuer:    "cbt-backend",
			Subject:   userID,
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(secret))
}

func ParseToken(tokenString, secret string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		return []byte(secret), nil
	})
	if err != nil {
		return nil, err
	}
	if claims, ok := token.Claims.(*Claims); ok && token.Valid {
		return claims, nil
	}
	return nil, errors.New("token tidak valid")
}
