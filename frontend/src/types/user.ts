// LOKASI: src/types/user.ts
import { BaseEntity, PaginationParams } from "./common";

export type UserRole =
  | "USER"
  | "TEACHER"
  | "ADMIN"
  | "ADMIN_ACADEMIC"
  | "ADMIN_FINANCE"
  | "SUPER_ADMIN";

export type AccountStatus = "ACTIVE" | "PENDING" | "ALL";

// --- SETUP & ADMIN REGISTRATION ---
export interface RegisterAdminInput {
  username: string;
  password: string; // min 6 chars
  full_name: string;
}

export interface SetupStatusResponse {
  is_setup_required: boolean;
}

// Mapping student.go -> StudentImportDTO
export interface StudentImportDTO {
  full_name: string;
  nisn: string;
  gender: "L" | "P";
  username: string;
  password?: string; // Raw password
  class_name: string; // "X-RPL-1"
}

// =====================================================================
// --- ENTITAS UTAMA (Sesuai user.go) ---
// =====================================================================

// Mapping struct Profile (dari user.go)
export interface Profile {
  user_id: string; // Di go sebagai UUID primaryKey
  full_name: string;
  nisn: string;
  nik: string;
  nip: string; 
  gender: string; // "L" or "P"

  // Informasi Dasar
  type: string;
  phone_number: string;
  email?: string;
  position?: string;
  birth_place?: string;
  birth_date?: string; // Format ISO string YYYY-MM-DD

  // Data Pondok (Sistem Pesantren)
  pondok?: string;
  asrama?: string;
  kamar?: string;          
  program?: string;        
  kelas_program?: string;  

  // Alamat Lengkap
  address?: string;
  village?: string;        
  subdistrict?: string;    
  regency?: string;        
  province?: string;       
  postal_code?: string;    

  // Data Orang Tua / Wali
  guardian_phone?: string; 
  father_name?: string;    
  mother_name?: string;    
  status?: string;

  // Foto Profil
  image?: string;
  photo_url?: string;      

  // Relasi
  class_id?: string | null;
  class?: any;             
}

// Enrollment merepresentasikan relasi/penugasan antara User dan Institution.
export interface Enrollment {
  id: string;
  user_id: string;
  institution_id: string;
  role: string;
  position?: string;
  status?: string;
  meta_data?: Record<string, any>; 
  institution?: {
    id: string;
    name: string;
  };
}

// Struktur User lengkap balikan dari API
export interface User extends BaseEntity {
  username: string;
  password_plain?: string; 
  role: UserRole;
  is_active: boolean;
  lockout_until?: string | null; 

  institution_id: string | null;
  institution_name?: string;
  
  profile?: Profile;
  enrollments?: Enrollment[];
  status?: AccountStatus;

  // --- UI DISPLAY HELPERS (Hasil Flattening) ---
  full_name?: string; 
  avatar?: string;    
}

// --- DTO & REQUEST PAYLOADS ---

export interface LoginRequest {
  username: string;
  password: string;
  role?: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface AccountFilter extends PaginationParams {
  role?: UserRole | "ALL";
  institution_id?: string | "ALL" | "GLOBAL";
  status?: AccountStatus;
  gender?: string;
  position?: string;
}

// Definisi StudentFilter untuk menyelaraskan dengan Backend
export interface StudentFilter extends PaginationParams {
  institution_id?: string;
  class_id?: string;
  search?: string;
  status?: "ACTIVE" | "PENDING" | "ALL" | string;
  gender?: string;
  academic_status?: string;
}

export interface AccountPayload {
  username: string;
  role: UserRole;
  full_name: string;
  password?: string;
  institution_id?: string | null;
  is_active?: boolean;
  phone_number?: string;
  gender?: string;
  image?: File | string | null;

  // Field Tambahan
  email?: string;
  nik?: string;
  nisn?: string;
  nip?: string;
  birth_place?: string;
  birth_date?: string;
  address?: string;
  pondok?: string;
  asrama?: string;
}

export interface EnrollmentPayload {
  institution_id: string;
  role: UserRole;
  position?: string;
}

// =====================================================================
// --- UI HELPERS ---
// =====================================================================

export const RoleDisplayMap: Record<UserRole, string> = {
  USER: "Siswa",
  TEACHER: "Guru",
  ADMIN: "Admin",
  ADMIN_ACADEMIC: "Admin Akademik",
  ADMIN_FINANCE: "Admin Keuangan",
  SUPER_ADMIN: "Super Admin",
};

export const getRoleLabel = (role?: string): string => {
  if (!role) return "Tidak Diketahui";
  return RoleDisplayMap[role as UserRole] || role;
};