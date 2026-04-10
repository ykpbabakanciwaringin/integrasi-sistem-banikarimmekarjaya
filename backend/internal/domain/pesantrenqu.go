// internal/domain/pesantrenqu.go
package domain

import "context"

type PQStudent struct {
	Name string `json:"name"`
	NIS  string `json:"nis"`
	RFID string `json:"rfid"`
}

type PQBalance struct {
	NIS     string `json:"nis"`
	Name    string `json:"name"`
	RFID    string `json:"rfid,omitempty"`
	Balance string `json:"balance"`
}

type PQAttendanceReq struct {
	Status      string `json:"status"`
	NIS         int64  `json:"nis"`
	StatusCheck string `json:"status_check"`
	EventID     int    `json:"event_id"`
	ForSubject  string `json:"for_subject"`
	ForBuilding string `json:"for_building"`
}

// Kontrak untuk Usecase
type PesantrenQuUsecase interface {
	FetchStudents(ctx context.Context) ([]PQStudent, error)
	CheckBalance(ctx context.Context, rfid string) (*PQBalance, error)
	SubmitAttendance(ctx context.Context, req PQAttendanceReq) error
}

// Kontrak untuk Repository
type PesantrenQuRepository interface {
	GetStudents(ctx context.Context) ([]PQStudent, error)
	GetBalanceByRFID(ctx context.Context, rfid string) (*PQBalance, error)
	PostAttendance(ctx context.Context, req PQAttendanceReq) error
}
