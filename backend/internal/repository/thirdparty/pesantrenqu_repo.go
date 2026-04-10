// internal/repository/thirdparty/pesantrenqu_repo.go
package thirdparty

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"banikarimmekarjaya.id/cbt-backend/internal/domain"
)

type pesantrenQuRepo struct {
	client     *http.Client
	partnerKey string
	username   string
	password   string
}

func NewPesantrenQuRepository(partnerKey, username, password string) domain.PesantrenQuRepository {
	return &pesantrenQuRepo{
		client:     &http.Client{Timeout: 10 * time.Second},
		partnerKey: partnerKey,
		username:   username,
		password:   password,
	}
}

func (r *pesantrenQuRepo) GetStudents(ctx context.Context) ([]domain.PQStudent, error) {
	req, err := http.NewRequestWithContext(ctx, "GET", "https://account.pesantrenqu.id/thirdparty/students", nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("x-partner-key", r.partnerKey)

	res, err := r.client.Do(req)
	if err != nil {
		return nil, err
	}
	defer res.Body.Close()

	var students []domain.PQStudent
	if err := json.NewDecoder(res.Body).Decode(&students); err != nil {
		return nil, err
	}
	return students, nil
}

func (r *pesantrenQuRepo) GetBalanceByRFID(ctx context.Context, rfid string) (*domain.PQBalance, error) {
	url := fmt.Sprintf("https://saving.pesantrenqu.id/thirdparty/student/balance?rfid=%s", rfid)
	req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("x-partner-key", r.partnerKey)

	res, err := r.client.Do(req)
	if err != nil {
		return nil, err
	}
	defer res.Body.Close()

	// Mapping struktur balasan asli API
	var response struct {
		Status string           `json:"status"`
		Data   domain.PQBalance `json:"data"`
	}
	if err := json.NewDecoder(res.Body).Decode(&response); err != nil {
		return nil, err
	}
	return &response.Data, nil
}

func (r *pesantrenQuRepo) PostAttendance(ctx context.Context, payload domain.PQAttendanceReq) error {
	jsonData, _ := json.Marshal(payload)
	req, err := http.NewRequestWithContext(ctx, "POST", "https://attendance.pesantrenqu.id/thirdparty/attendance/student", bytes.NewBuffer(jsonData))
	if err != nil {
		return err
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("x-partner-key", r.partnerKey)
	req.Header.Set("x-username", r.username)
	req.Header.Set("x-password", r.password)

	res, err := r.client.Do(req)
	if err != nil {
		return err
	}
	defer res.Body.Close()

	if res.StatusCode != http.StatusOK && res.StatusCode != http.StatusCreated {
		return fmt.Errorf("third party error, status: %d", res.StatusCode)
	}
	return nil
}
