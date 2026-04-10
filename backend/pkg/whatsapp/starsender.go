package whatsapp

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

type StarSenderClient struct {
	APIKey string
	Client *http.Client
}

func NewStarSenderClient(apiKey string) *StarSenderClient {
	return &StarSenderClient{
		APIKey: apiKey,
		Client: &http.Client{Timeout: 10 * time.Second},
	}
}

// Struktur Payload sesuai dokumentasi StarSender
type sendPayload struct {
	MessageType string `json:"messageType"`
	To          string `json:"to"`
	Body        string `json:"body"`
}

func (s *StarSenderClient) SendMessage(to string, message string) error {
	url := "https://api.starsender.online/api/send"

	payload := sendPayload{
		MessageType: "text",
		To:          to,
		Body:        message,
	}

	jsonPayload, err := json.Marshal(payload)
	if err != nil {
		return err
	}

	req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonPayload))
	if err != nil {
		return err
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", s.APIKey) // API Key di Header

	resp, err := s.Client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return fmt.Errorf("gagal mengirim whatsapp, status code: %d", resp.StatusCode)
	}

	return nil
}
