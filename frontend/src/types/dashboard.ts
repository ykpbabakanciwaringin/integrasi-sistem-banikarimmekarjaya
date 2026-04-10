// LOKASI: src/types/dashboard.ts

export interface DashboardStats {
  total_teachers: number;
  total_students: number;
  total_staff: number;         //  BARU: Untuk Admin & Staf
  pending_accounts: number;    //  BARU: Akun menunggu verifikasi
  total_classes: number;
  active_exams: number;
  total_institutions: number;
}

export interface SystemHealth {
  status: "stable" | "unstable";
  message?: string;
  latency: number;
}