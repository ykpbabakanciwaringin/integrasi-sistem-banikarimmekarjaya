package utils

import (
	"errors"
	"golang.org/x/crypto/bcrypt"
)

// HashPassword mengubah password teks biasa menjadi hash menggunakan bcrypt.
// Menggunakan bcrypt.DefaultCost (10) untuk keseimbangan antara keamanan dan performa.
//
// Parameters:
//   - password: Password dalam bentuk plain text yang akan di-hash
//
// Returns:
//   - string: Password yang sudah di-hash (dapat disimpan di database)
//   - error: Error jika terjadi kesalahan saat hashing
//
// Example:
//
//	hashedPassword, err := HashPassword("password123")
//	if err != nil {
//	    // Handle error
//	}
//	// Simpan hashedPassword ke database
func HashPassword(password string) (string, error) {
	if password == "" {
		return "", errors.New("password tidak boleh kosong")
	}
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	return string(bytes), err
}

// CheckPasswordHash membandingkan password input dengan hash yang tersimpan di database.
// Menggunakan bcrypt untuk memverifikasi apakah password cocok dengan hash.
//
// Parameters:
//   - password: Password dalam bentuk plain text yang akan diverifikasi
//   - hash: Password hash yang tersimpan di database
//
// Returns:
//   - bool: true jika password cocok, false jika tidak cocok atau terjadi error
//
// Example:
//
//	isValid := CheckPasswordHash("password123", storedHash)
//	if !isValid {
//	    // Password salah
//	}
func CheckPasswordHash(password, hash string) bool {
	if password == "" || hash == "" {
		return false
	}
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}
