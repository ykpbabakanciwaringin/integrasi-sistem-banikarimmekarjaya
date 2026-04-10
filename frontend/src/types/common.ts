// src/types/common.ts

export interface BaseEntity {
  id: string; // UUID
  created_at: string; // ISO Date String
  updated_at: string;
  // deleted_at tidak perlu di frontend biasanya, kecuali untuk admin restore data
}

export interface ApiResponse<T> {
  // Menyesuaikan format JSON response standar Golang Anda
  message: string;
  data: T;
  meta?: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

// Untuk Pagination Query
export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
}

// Mapping common.go -> DashboardStats
export interface DashboardStats {
  total_teachers: number;
  total_students: number;
  total_classes: number;
  active_exams: number;
}
