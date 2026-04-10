package usecase

import (
	"errors"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/google/uuid"
)

type MediaUsecase interface {
	UploadImage(file multipart.File, header *multipart.FileHeader, category string) (string, error)
}

type mediaUsecase struct{}

func NewMediaUsecase() MediaUsecase {
	return &mediaUsecase{}
}

// UploadImage: Menyimpan file fisik dengan Standar Keamanan Enterprise (Anti-Malware)
func (uc *mediaUsecase) UploadImage(file multipart.File, header *multipart.FileHeader, category string) (string, error) {
	// 1. PENGAMANAN 1: Whitelist Kategori (Anti Path Traversal / Folder Spoofing)
	validCategories := map[string]bool{
		"questions":    true,
		"profiles":     true,
		"students":     true,
		"institutions": true,
	}
	if !validCategories[category] {
		return "", errors.New("SECURITY_ALERT: Kategori direktori tidak diizinkan")
	}

	// 2. Validasi Ukuran (Max 5MB)
	if header.Size > 5*1024*1024 {
		return "", errors.New("ukuran gambar maksimal 5MB")
	}

	// 3. PENGAMANAN 2: Validasi MIME Type Asli (Magic Bytes) - Anti Malware Spoofing
	buffer := make([]byte, 512) // Ambil 512 byte pertama untuk dicek DNA-nya
	if _, err := file.Read(buffer); err != nil && err != io.EOF {
		return "", err
	}
	// Kembalikan pointer file ke awal setelah dibaca
	if _, err := file.Seek(0, io.SeekStart); err != nil {
		return "", err
	}

	contentType := http.DetectContentType(buffer)
	if contentType != "image/jpeg" && contentType != "image/png" {
		return "", errors.New("SECURITY_ALERT: File ini bukan gambar asli meskipun ekstensinya jpg/png")
	}

	// 4. Buat Nama Unik
	ext := filepath.Ext(header.Filename)
	filename := fmt.Sprintf("%s_%d%s", uuid.New().String(), time.Now().Unix(), ext)

	// 5. Tentukan Folder (Aman karena kategori sudah di-whitelist)
	uploadPath := filepath.Join("static", "uploads", category)
	// gunakan permission minimal untuk folder
	if err := os.MkdirAll(uploadPath, 0750); err != nil {
		return "", err
	}

	// 6. Simpan File (menggunakan path yang telah disanitasi)
	dstPath := filepath.Join(uploadPath, filename)
	if !strings.HasPrefix(dstPath, filepath.Clean(uploadPath)+string(os.PathSeparator)) {
		return "", errors.New("invalid destination path")
	}
	dst, err := os.Create(dstPath)
	if err != nil {
		return "", err
	}
	defer dst.Close()

	if _, err := io.Copy(dst, file); err != nil {
		return "", err
	}

	return fmt.Sprintf("/uploads/%s/%s", category, filename), nil
}
