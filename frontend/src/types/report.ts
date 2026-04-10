// frontend\src\types\report.ts

/**
 * Mapping dari entitas report di backend ke interface frontend.
 * Digunakan untuk manajemen absensi dan catatan wali kelas.
 */
export interface StudentReport {
  id: string;
  student_id: string;
  class_id: string;

  sick: number; // Sakit
  permission: number; // Izin
  absent: number; // Alpha
  note: string; // Catatan Wali Kelas
  is_promoted: boolean; // Status Kenaikan Kelas

  created_at: string;
  updated_at: string;
}

/** *  SOLUSI RALAT 2305:
 * Membuat alias ReportData agar sesuai dengan pemanggilan di halaman rapor.
 */
export type ReportData = StudentReport;
