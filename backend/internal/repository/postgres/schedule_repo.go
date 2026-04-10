// LOKASI: internal/repository/postgres/schedule_repo.go
package postgres

import (
	"context"

	"gorm.io/gorm"
	"banikarimmekarjaya.id/cbt-backend/internal/domain"
)

type scheduleRepo struct {
	DB *gorm.DB
}

func NewScheduleRepository(db *gorm.DB) domain.ScheduleRepository {
	return &scheduleRepo{DB: db}
}

func (r *scheduleRepo) FetchAllocations(ctx context.Context, filter domain.AllocationFilter) ([]domain.TeachingAllocation, error) {
	var allocations []domain.TeachingAllocation

	db := r.DB.WithContext(ctx).
		Preload("AcademicYear").
		Preload("Institution").
		Preload("Teacher").
		Preload("Subject").
		Preload("Class").
		Preload("Schedules")

	if filter.InstitutionID != "" && filter.InstitutionID != "ALL" {
		db = db.Where("institution_id = ?", filter.InstitutionID)
	}
	if filter.AcademicYearID != "" {
		db = db.Where("academic_year_id = ?", filter.AcademicYearID)
	}
	if filter.TeacherID != "" {
		db = db.Where("teacher_id = ?", filter.TeacherID)
	}
	if filter.ClassID != "" {
		db = db.Where("class_id = ?", filter.ClassID)
	}

	if err := db.Find(&allocations).Error; err != nil {
		return nil, err
	}
	return allocations, nil
}

func (r *scheduleRepo) GetByID(ctx context.Context, id string) (*domain.TeachingAllocation, error) {
	var alloc domain.TeachingAllocation
	err := r.DB.WithContext(ctx).
		Preload("AcademicYear").
		Preload("Institution").
		Preload("Teacher").
		Preload("Subject").
		Preload("Class").
		Preload("Schedules").
		First(&alloc, "id = ?", id).Error
	return &alloc, err
}

func (r *scheduleRepo) CheckTeacherConflict(ctx context.Context, teacherID, academicYearID, dayOfWeek, startTime, endTime string) (bool, error) {
	var count int64

	err := r.DB.WithContext(ctx).
		Table("class_schedules").
		Joins("JOIN teaching_allocations ON teaching_allocations.id = class_schedules.teaching_allocation_id").
		Where("teaching_allocations.teacher_id = ?", teacherID).
		Where("teaching_allocations.academic_year_id = ?", academicYearID).
		Where("class_schedules.day_of_week = ?", dayOfWeek).
		// Logika Overlap Waktu
		Where("class_schedules.start_time < ? AND class_schedules.end_time > ?", endTime, startTime).
		Count(&count).Error

	if err != nil {
		return false, err
	}

	return count > 0, nil
}

func (r *scheduleRepo) CreateAllocation(ctx context.Context, ta *domain.TeachingAllocation) error {
	return r.DB.WithContext(ctx).Create(ta).Error
}

func (r *scheduleRepo) DeleteAllocation(ctx context.Context, id string) error {
	return r.DB.WithContext(ctx).Delete(&domain.TeachingAllocation{}, "id = ?", id).Error
}

func (r *scheduleRepo) AddSchedule(ctx context.Context, cs *domain.ClassSchedule) error {
	return r.DB.WithContext(ctx).Create(cs).Error
}

func (r *scheduleRepo) DeleteSchedule(ctx context.Context, id string) error {
	return r.DB.WithContext(ctx).Delete(&domain.ClassSchedule{}, "id = ?", id).Error
}

func (r *scheduleRepo) FetchAllClassesForMatrix(ctx context.Context, instID string) ([]*domain.Class, error) {
	var classes []*domain.Class
	err := r.DB.WithContext(ctx).
		Preload("Institution").
		Where("institution_id = ?", instID).
		Order("level asc, name asc").
		Find(&classes).Error

	if err != nil {
		return nil, err
	}
	return classes, nil
}

func (r *scheduleRepo) FetchSessions(ctx context.Context, instID string) ([]domain.ClassSession, error) {
	var sessions []domain.ClassSession
	err := r.DB.WithContext(ctx).Where("institution_id = ?", instID).Order("start_time ASC").Find(&sessions).Error
	return sessions, err
}

func (r *scheduleRepo) CreateSession(ctx context.Context, session *domain.ClassSession) error {
	return r.DB.WithContext(ctx).Create(session).Error
}

func (r *scheduleRepo) DeleteSession(ctx context.Context, id string) error {
	return r.DB.WithContext(ctx).Delete(&domain.ClassSession{}, "id = ?", id).Error
}
