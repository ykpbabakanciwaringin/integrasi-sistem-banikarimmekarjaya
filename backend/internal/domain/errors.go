package domain

import "errors"

var (
	ErrNotFound            = errors.New("data tidak ditemukan")
	ErrInternalServerError = errors.New("terjadi kesalahan internal server")
	ErrConflict            = errors.New("data sudah ada (duplikat)")
	ErrBadParamInput       = errors.New("parameter input tidak valid")
	ErrUnauthorized        = errors.New("akses tidak diizinkan")
	ErrForbidden           = errors.New("akses dilarang: role tidak sesuai")
	ErrExamFinished        = errors.New("ujian sudah diselesaikan")
	ErrExamNotStarted      = errors.New("ujian belum dimulai")
	ErrSessionInactive     = errors.New("sesi ujian tidak aktif") // Tambahkan ini agar http_utils tidak error
	ErrInvalidInput        = errors.New("input tidak valid")      // Tambahkan ini agar http_utils tidak error
)
