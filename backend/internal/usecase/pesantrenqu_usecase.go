// internal/usecase/pesantrenqu_usecase.go
package usecase

import (
	"context"

	"ykpbabakanciwaringin.id/cbt-backend/internal/domain"
)

type pesantrenQuUsecase struct {
	pqRepo domain.PesantrenQuRepository
}

func NewPesantrenQuUsecase(pqRepo domain.PesantrenQuRepository) domain.PesantrenQuUsecase {
	return &pesantrenQuUsecase{
		pqRepo: pqRepo,
	}
}

func (u *pesantrenQuUsecase) FetchStudents(ctx context.Context) ([]domain.PQStudent, error) {
	return u.pqRepo.GetStudents(ctx)
}

func (u *pesantrenQuUsecase) CheckBalance(ctx context.Context, rfid string) (*domain.PQBalance, error) {
	return u.pqRepo.GetBalanceByRFID(ctx, rfid)
}

func (u *pesantrenQuUsecase) SubmitAttendance(ctx context.Context, req domain.PQAttendanceReq) error {
	return u.pqRepo.PostAttendance(ctx, req)
}
