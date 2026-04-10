// LOKASI: internal/domain/master_data.go
package domain

import (
	"context"
)

// =========================================================================
// ENTITAS DATABASE (Tabel Master Data)
// =========================================================================

// Dorm merepresentasikan data Asrama/Pondok per Lembaga
type Dorm struct {
	BaseEntity
	InstitutionID string `gorm:"type:uuid;index;not null" json:"institution_id"`
	Name          string `gorm:"type:varchar(150);not null" json:"name"`
	Rooms         []Room `gorm:"foreignKey:DormID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"rooms,omitempty"`
}

// Room merepresentasikan Kamar di dalam sebuah Asrama
type Room struct {
	BaseEntity
	DormID string `gorm:"type:uuid;index;not null" json:"dorm_id"`
	Name   string `gorm:"type:varchar(100);not null" json:"name"`
}

// Program merepresentasikan Program Pengajian/Jurusan per Lembaga
type Program struct {
	BaseEntity
	InstitutionID string         `gorm:"type:uuid;index;not null" json:"institution_id"`
	Name          string         `gorm:"type:varchar(150);not null" json:"name"`
	ClassPrograms []ClassProgram `gorm:"foreignKey:ProgramID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"class_programs,omitempty"`
}

// ClassProgram merepresentasikan Kelas turunan dari Program Pengajian
type ClassProgram struct {
	BaseEntity
	ProgramID string `gorm:"type:uuid;index;not null" json:"program_id"`
	Name      string `gorm:"type:varchar(100);not null" json:"name"`
}

// =========================================================================
// DTO (Data Transfer Object) UNTUK INPUT
// =========================================================================

type CreateDormInput struct {
	Name string `json:"name" binding:"required"`
}

type CreateRoomInput struct {
	Name string `json:"name" binding:"required"`
}

type CreateProgramInput struct {
	Name string `json:"name" binding:"required"`
}

type CreateClassProgramInput struct {
	Name string `json:"name" binding:"required"`
}

// =========================================================================
// KONTRAK REPOSITORY
// =========================================================================

type MasterDataRepository interface {
	// Asrama & Kamar
	GetDorms(ctx context.Context, instID string) ([]Dorm, error)
	CreateDorm(ctx context.Context, dorm *Dorm) error
	GetRooms(ctx context.Context, dormID string) ([]Room, error)
	CreateRoom(ctx context.Context, room *Room) error

	// Program & Kelas Program
	GetPrograms(ctx context.Context, instID string) ([]Program, error)
	CreateProgram(ctx context.Context, program *Program) error
	GetClassPrograms(ctx context.Context, programID string) ([]ClassProgram, error)
	CreateClassProgram(ctx context.Context, cp *ClassProgram) error
}
