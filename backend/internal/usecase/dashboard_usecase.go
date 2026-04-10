// LOKASI: internal/usecase/dashboard_usecase.go
package usecase

import (
	"context"

	"ykpbabakanciwaringin.id/cbt-backend/internal/domain"
	repo "ykpbabakanciwaringin.id/cbt-backend/internal/repository/postgres"
)

type DashboardUsecase interface {
	GetStats(ctx context.Context, instID string) (domain.DashboardStats, error)
	CheckHealth(ctx context.Context) (bool, error)
}

type dashboardUsecase struct {
	dashboardRepo repo.DashboardRepository
}

func NewDashboardUsecase(r repo.DashboardRepository) DashboardUsecase {
	return &dashboardUsecase{dashboardRepo: r}
}

func (uc *dashboardUsecase) GetStats(ctx context.Context, instID string) (domain.DashboardStats, error) {
	return uc.dashboardRepo.GetStats(ctx, instID)
}

func (uc *dashboardUsecase) CheckHealth(ctx context.Context) (bool, error) {
	err := uc.dashboardRepo.Ping()
	if err != nil {
		return false, err
	}
	return true, nil
}
