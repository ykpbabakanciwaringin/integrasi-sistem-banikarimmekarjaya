// LOKASI: internal/domain/user.go
package domain

import (
	"context"
	"time"

	"github.com/google/uuid"
	"gorm.io/datatypes"
)

const (
	RoleStudent       = "USER"
	RoleTeacher       = "TEACHER"
	RoleAdmin         = "ADMIN"
	RoleAdminAcademic = "ADMIN_ACADEMIC"
	RoleAdminFinance  = "ADMIN_FINANCE"
	RoleSuperAdmin    = "SUPER_ADMIN"
)

type UserRepository interface {
	AddEnrollment(ctx context.Context, enrollment *Enrollment) error
	FetchByUsername(ctx context.Context, username string) (*User, error)
	FetchByNISN(ctx context.Context, nisn string) (*User, error)
	FetchByNIP(ctx context.Context, nip string) (*User, error)
	FetchByID(ctx context.Context, id string) (*User, error)
	Update(ctx context.Context, user *User) error
	CreateOne(ctx context.Context, user *User) error
	BulkCreate(ctx context.Context, users []*User) error
	CountSuperAdmins(ctx context.Context) (int64, error)
	FetchAll(ctx context.Context, limit, offset int, search, role, instID, status string) ([]User, int64, error)
	Delete(ctx context.Context, id string) error
	FetchEnrollmentByID(ctx context.Context, id string) (*Enrollment, error)
	UpdateEnrollment(ctx context.Context, enrollment *Enrollment) error
	DeleteEnrollment(ctx context.Context, id string) error
}

type User struct {
	BaseEntity
	Username      string `gorm:"uniqueIndex;not null" json:"username"`
	Password      string `gorm:"not null" json:"-"`
	PasswordPlain string `gorm:"size:255" json:"password_plain"`

	Role     string `gorm:"index:idx_user_role_active,priority:1;not null;default:'USER'" json:"role"`
	IsActive bool   `gorm:"index:idx_user_role_active,priority:2;default:true" json:"is_active"`

	FailedLoginAttempts int        `gorm:"default:0" json:"-"`
	LockoutUntil        *time.Time `json:"lockout_until,omitempty"`
	TokenVersion        int        `gorm:"default:1" json:"-"`

	Profile     *Profile     `gorm:"foreignKey:UserID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"profile,omitempty"`
	Enrollments []Enrollment `gorm:"foreignKey:UserID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"enrollments,omitempty"`
}

type Profile struct {
	UserID   uuid.UUID `gorm:"type:uuid;primaryKey" json:"user_id"`
	FullName string    `gorm:"index;not null" json:"full_name"`
	NISN     string    `gorm:"index" json:"nisn"`
	NIK      string    `gorm:"index" json:"nik"`
	NIP      string    `gorm:"index" json:"nip"`
	Gender   string    `gorm:"size:1" json:"gender"`

	Type        string    `json:"type"`
	PhoneNumber string    `json:"phone_number"`
	Email       string    `json:"email"`
	Position    string    `json:"position"`
	BirthPlace  string    `json:"birth_place"`
	BirthDate   time.Time `json:"birth_date"`

	Pondok       string `json:"pondok"`
	Asrama       string `json:"asrama"`
	Kamar        string `json:"kamar"`
	Program      string `json:"program"`
	KelasProgram string `json:"kelas_program"`

	Address     string `json:"address"`
	Village     string `json:"village"`
	Subdistrict string `json:"subdistrict"`
	Regency     string `json:"regency"`
	Province    string `json:"province"`
	PostalCode  string `json:"postal_code"`

	GuardianPhone string `json:"guardian_phone"`
	FatherName    string `json:"father_name"`
	MotherName    string `json:"mother_name"`
	Status        string `json:"status"`

	Image    string `json:"image"`
	PhotoURL string `json:"photo_url"`

	ClassID *string `gorm:"type:uuid;index" json:"class_id"`
	Class   *Class  `gorm:"foreignKey:ClassID;constraint:-" json:"class,omitempty"`
}

type Enrollment struct {
	ID            uuid.UUID `gorm:"type:uuid;primary_key" json:"id"`
	UserID        uuid.UUID `gorm:"type:uuid;index:idx_enrollment_user_inst_role,priority:1;not null" json:"user_id"`
	InstitutionID uuid.UUID `gorm:"type:uuid;index:idx_enrollment_user_inst_role,priority:2;index:idx_enrollment_inst_role,priority:1;not null" json:"institution_id"`
	Role          string    `gorm:"index:idx_enrollment_user_inst_role,priority:3;index:idx_enrollment_inst_role,priority:2;not null" json:"role"`

	Position string `gorm:"type:varchar(100)" json:"position"`
	Status   string `gorm:"index;default:'ACTIVE'" json:"status"`

	MetaData    datatypes.JSON `gorm:"type:jsonb" json:"meta_data"`
	Institution *Institution   `gorm:"foreignKey:InstitutionID;references:ID" json:"institution,omitempty"`
}

type LoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
	Role     string `json:"role"`
}

type LoginResponse struct {
	Token string      `json:"token"`
	User  interface{} `json:"user"`
}

// GetInstitutionID adalah Helper Method untuk mendapatkan UUID Lembaga secara aman.
// Karena satu siswa bisa punya banyak pendaftaran, kita ambil pendaftaran pertama yang aktif.
func (u *User) GetInstitutionID() string {
	if u == nil {
		return ""
	}
	// Cek apakah data Enrollments sudah di-load dari database
	if len(u.Enrollments) > 0 {
		return u.Enrollments[0].InstitutionID.String()
	}
	return ""
}

// GetFullName adalah Helper Method untuk mengambil nama lengkap.
// Jika profil belum di-load atau kosong, sistem akan mengembalikan Username sebagai cadangan.
func (u *User) GetFullName() string {
	if u == nil {
		return "-"
	}
	if u.Profile != nil && u.Profile.FullName != "" {
		return u.Profile.FullName
	}
	return u.Username
}

// GetPondok adalah Helper Method untuk mengambil data Pondok/Asrama.
func (u *User) GetPondok() string {
	if u != nil && u.Profile != nil {
		return u.Profile.Pondok
	}
	return "-"
}
