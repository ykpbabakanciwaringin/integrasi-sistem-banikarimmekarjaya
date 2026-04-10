package utils

import (
	"fmt"
	"net/smtp"
	"strings"
)

// SendEmail mengirim email menggunakan konfigurasi SMTP
func SendEmail(toEmail string, subject string, body string, cfg SMTPConfig) error {
	// Setup Autentikasi
	auth := smtp.PlainAuth("", cfg.Email, cfg.Password, cfg.Host)

	// Format MIME header agar email terlihat rapi dan tidak masuk SPAM
	headers := make(map[string]string)
	headers["From"] = fmt.Sprintf("Staff Administrasi YKP <%s>", cfg.Email)
	headers["To"] = toEmail
	headers["Subject"] = subject
	headers["MIME-Version"] = "1.0"
	headers["Content-Type"] = "text/html; charset=\"utf-8\""

	// Susun pesan
	var msg strings.Builder
	for k, v := range headers {
		msg.WriteString(fmt.Sprintf("%s: %s\r\n", k, v))
	}
	msg.WriteString("\r\n") // Pemisah header dan body
	msg.WriteString(body)

	// Alamat server
	addr := fmt.Sprintf("%s:%d", cfg.Host, cfg.Port)

	// Kirim email
	err := smtp.SendMail(addr, auth, cfg.Email, []string{toEmail}, []byte(msg.String()))
	if err != nil {
		return fmt.Errorf("gagal mengirim email ke %s: %w", toEmail, err)
	}

	return nil
}
