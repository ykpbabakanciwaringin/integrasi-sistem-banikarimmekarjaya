package utils

import (
	"time"
)

// WIB adalah variabel global penyimpan Location agar tidak perlu LoadLocation berulang kali (hemat CPU)
var WIB *time.Location

func init() {
	loc, err := time.LoadLocation("Asia/Jakarta")
	if err != nil {
		// Fallback manual jika OS tidak memiliki tzdata (seperti di Alpine Docker yang belum di-setup)
		WIB = time.FixedZone("WIB", 7*3600)
	} else {
		WIB = loc
	}
}

// NowWIB mengembalikan waktu saat ini yang dikunci secara absolut ke zona waktu Indonesia (WIB)
func NowWIB() time.Time {
	return time.Now().In(WIB)
}

// ParseWIB mengonversi string waktu menjadi objek time.Time dengan standar WIB yang sudah di-cache
func ParseWIB(layout, value string) (time.Time, error) {
	return time.ParseInLocation(layout, value, WIB)
}

// FormatDateIndo mengembalikan format tanggal sederhana untuk keperluan PDF/Cetak (contoh: 02-01-2006)
func FormatDateIndo(t time.Time) string {
	return t.In(WIB).Format("02-01-2006")
}
