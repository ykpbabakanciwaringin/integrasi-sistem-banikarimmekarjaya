// LOKASI: src/services/curriculum.service.ts
import { apiClient as api } from "@/lib/axios";
import { Curriculum, SubjectGroup } from "@/types/master-academic";
import { PaginationParams } from "@/types/common";

export interface CurriculumParams extends PaginationParams {
  institution_id?: string;
}

export interface HolidayParams extends PaginationParams {
  institution_id?: string;
  month?: string; // Format: YYYY-MM
}

export const curriculumService = {
  // --- KURIKULUM UTAMA ---
  async getCurriculums(params?: CurriculumParams) {
    const response = await api.get("/curriculums", { params });
    // Backend Golang kini konsisten mengembalikan { data, total, page, limit, totalPages }
    return response.data;
  },
  
  async createCurriculum(data: Partial<Curriculum>) {
    const response = await api.post("/curriculums", data);
    return response.data;
  },
  
  async updateCurriculum(id: string, data: Partial<Curriculum>) {
    const response = await api.put(`/curriculums/${id}`, data);
    return response.data;
  },
  
  async deleteCurriculum(id: string) {
    const response = await api.delete(`/curriculums/${id}`);
    return response.data;
  },

  // --- KELOMPOK MAPEL ---
  async getSubjectGroups(curriculumId: string) {
    const response = await api.get(`/curriculums/${curriculumId}/groups`);
    // Kelompok Mapel tidak butuh paginasi karena datanya sedikit
    return response.data?.data || response.data || [];
  },
  
  async createSubjectGroup(curriculumId: string, data: Partial<SubjectGroup>) {
    const response = await api.post(`/curriculums/${curriculumId}/groups`, data);
    return response.data;
  },
  
  async deleteSubjectGroup(curriculumId: string, groupId: string) {
    const response = await api.delete(`/curriculums/${curriculumId}/groups/${groupId}`);
    return response.data;
  },

  // --- MANAJEMEN HARI LIBUR ---
  async getHolidays(params?: HolidayParams) {
    const response = await api.get("/academic/holidays", { params });
    // Menggunakan standar paginasi baru
    return response.data;
  },

  async createHoliday(data: any) {
    const response = await api.post("/academic/holidays", data);
    return response.data;
  },

  async updateHoliday(id: string, data: any) {
    const response = await api.put(`/academic/holidays/${id}`, data);
    return response.data;
  },

  async deleteHoliday(id: string) {
    const response = await api.delete(`/academic/holidays/${id}`);
    return response.data;
  },
};