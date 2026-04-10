import { apiClient as api } from "@/lib/axios";
import { AcademicYear, AcademicYearFilter } from "@/types/master-academic";

export const academicYearService = {
  async getAll(params?: AcademicYearFilter) {
    //  KEMBALIKAN TANPA /api/v1, TAPI PERTAHANKAN response.data UTUH
    const response = await api.get("/academic-years", { params });
    return response.data; 
  },

  async getActive(institution_id?: string) {
    const params = institution_id ? { institution_id } : {};
    const response = await api.get("/academic-years/active", { params });
    return response.data?.data as AcademicYear;
  },

  async create(data: Partial<AcademicYear>) {
    const response = await api.post("/academic-years", data);
    return response.data;
  },

  async update(id: string, data: Partial<AcademicYear>) {
    const response = await api.put(`/academic-years/${id}`, data);
    return response.data;
  },

  async delete(id: string) {
    const response = await api.delete(`/academic-years/${id}`);
    return response.data;
  },

  async setActive(id: string) {
    const response = await api.put(`/academic-years/${id}/active`);
    return response.data;
  },
};