package utils

import (
	"crypto/rand"
	"math/big"
)

// GenerateRandomString menghasilkan string acak dengan panjang tertentu.
// Menggunakan karakter alfanumerik dan simbol khusus untuk keamanan yang lebih baik.
// Menggunakan crypto/rand untuk keamanan kriptografi yang lebih kuat.
//
// Parameters:
//   - n: Panjang string yang diinginkan
//
// Returns:
//   - string: String acak dengan panjang n
//
// Example:
//
//	randomStr := GenerateRandomString(16)
//	// Output: "aB3$kL9mN2pQ5rS"
func GenerateRandomString(n int) string {
	const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*"
	b := make([]byte, n)
	for i := range b {
		num, _ := rand.Int(rand.Reader, big.NewInt(int64(len(charset))))
		b[i] = charset[num.Int64()]
	}
	return string(b)
}

// GenerateComplexCode menghasilkan kode kompleks dengan panjang tertentu.
// Fungsi ini identik dengan GenerateRandomString, disediakan untuk backward compatibility.
//
// Deprecated: Gunakan GenerateRandomString sebagai gantinya.
//
// Parameters:
//   - length: Panjang kode yang diinginkan
//
// Returns:
//   - string: Kode acak dengan panjang length
func GenerateComplexCode(length int) string {
	return GenerateRandomString(length)
}
