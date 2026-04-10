// LOKASI: src/types/academic.ts
import { BaseEntity, PaginationParams } from "./common";
import { Profile } from "./user";

// --- INSTITUTION ---
export interface Institution extends BaseEntity {
  code: string;
  name: string;
  foundation_name?: string;
  category: string;
  address_city: string;
  address_detail?: string;
  level_code: string;
  logo_url: string;
  weekly_day_off?: string; 
}

// --- CLASS (ROMBEL) ---
export interface Class extends BaseEntity {
  institution_id: string;
  name: string;
  level: string;
  major: string;

  // Field Wali Kelas
  teacher_id?: string;
  teacher?: Profile; // Relasi ke Profile Guru

  // Relasi
  institution?: Institution;
  student_count?: number;
}

// --- SUBJECT (MATA PELAJARAN) ---
export interface Subject extends BaseEntity {
  institution_id: string;
  code: string;
  name: string;
}

export interface TeacherSubject {
  id: string;
  institution_id: string;
  teacher_id: string;
  subject_id: string;
  class_id: string;
  kkm: number;

  teacher?: Profile;
  subject?: Subject;
  class?: Class;
}

// --- FILTERS ---
export interface ClassFilter extends PaginationParams {
  institution_id?: string;
  level?: string;
  major?: string;
}

export interface SubjectFilter extends PaginationParams {
  institution_id?: string;
}