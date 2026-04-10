// LOKASI: src/types/master-academic.ts
import { BaseEntity, PaginationParams } from "./common";
import { Profile } from "./user";
import { Class } from "./academic"; 

// 1. MODUL TAHUN AJARAN
export interface AcademicYear extends BaseEntity {
  institution_id: string;
  name: string;
  semester: "Ganjil" | "Genap";
  is_active: boolean;
}

export interface AcademicYearFilter extends PaginationParams {
  institution_id?: string;
}

// 2. MODUL KURIKULUM & KELOMPOK
export interface Curriculum extends BaseEntity {
  institution_id: string;
  name: string;
  is_active: boolean;
}

export interface SubjectGroup extends BaseEntity {
  curriculum_id: string;
  name: string;
}

// 3. MODUL MATA PELAJARAN (Versi Lengkap / Master)
export interface Subject extends BaseEntity {
  institution_id: string;
  code: string;
  name: string;
  curriculum_id?: string | null;
  subject_group_id?: string | null;
  type?: "TEORI" | "PRAKTIK";

  // Relasi Preload dari Backend
  curriculum?: Curriculum;
  subject_group?: SubjectGroup;
}

// 4. MODUL MASTER SESI
export interface ClassSession extends BaseEntity {
  institution_id: string;
  name: string;               
  start_time: string;         
  end_time: string;           
  pesantrenqu_event_id: number;
}

// 5. MODUL PENJADWALAN & ALOKASI
export interface ClassSchedule extends BaseEntity {
  teaching_allocation_id: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  room_name?: string;
  pesantrenqu_event_id?: number; 
}

export interface TeachingAllocation extends BaseEntity {
  academic_year_id: string;
  institution_id: string;
  teacher_id: string;
  subject_id: string;
  class_id: string;

  // Relasi
  academic_year?: AcademicYear;
  teacher?: Profile;
  subject?: Subject;
  class?: Class;
  schedules?: ClassSchedule[];
}

//  FIX ERROR: Menambahkan extends PaginationParams agar mendukung 'limit'
export interface AllocationFilter extends PaginationParams {
  academic_year_id?: string;
  institution_id?: string;
  class_id?: string;
  teacher_id?: string;
}

// 6. MODUL JURNAL & ABSENSI
export interface ClassJournal extends BaseEntity {
  institution_id: string;
  teaching_allocation_id: string;
  teacher_id: string;
  date: string; // Format YYYY-MM-DD
  topic: string;
  description?: string;

  allocation?: TeachingAllocation;
  teacher?: Profile;
}

export interface StudentAttendance {
  id: string;
  class_journal_id: string;
  student_id: string;
  status: "HADIR" | "SAKIT" | "IZIN" | "ALPA";
  note?: string;
  behavior?: string; 
  synced_to_third_party?: boolean; 
  sync_error_message?: string;    
  
  student?: Profile;
}

//  Disederhanakan menggunakan extends
export interface JournalFilter extends PaginationParams {
  institution_id?: string;
  teaching_allocation_id?: string;
  teacher_id?: string;
  class_id?: string;    
  status?: string;      
  start_date?: string;
  end_date?: string;
}

export interface Holiday extends BaseEntity {
  //  UBAH: Sekarang opsional (?) dan bisa null untuk mendukung Libur Global
  institution_id?: string | null; 
  date: string; // YYYY-MM-DD
  name: string;
  is_global: boolean;
}

export interface TeacherAttendance extends BaseEntity {
  institution_id: string;
  teacher_id: string;
  date: string;
  status: "SAKIT" | "IZIN" | "CUTI" | "HADIR_MANUAL";
  notes?: string;
  created_by: string;
  
  teacher?: Profile;
}

//  TAMBAHKAN: Sinkronisasi Institution dengan field baru
export interface Institution extends BaseEntity {
  code: string;
  name: string;
  category: string;
  address_city: string;
  level_code: string;
  logo_url: string;
  weekly_day_off?: string; 
  is_pq_integration_enabled: boolean;
  pq_partner_key?: string;            
}