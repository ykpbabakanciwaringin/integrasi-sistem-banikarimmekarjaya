// LOKASI: src/services/class.service.ts
import { apiClient as api, downloadBlob } from "@/lib/axios";

export interface ClassParams {
  page?: number;
  limit?: number;
  search?: string;
  level?: string;
  major?: string;
  institution_id?: string;
}

export const classService = {
  // 1. Ambil Semua Kelas
  async getAll(params?: ClassParams) {
    const response = await api.get("/academic/classes", { params });
    //  FIX BUG: Kembalikan response.data UTUH (bukan hanya array-nya)
    // agar variabel 'total' dan 'data' bisa dibaca oleh Paginasi di page.tsx
    return response.data; 
  },

  // 2. Ambil Detail Satu Kelas
  async getDetail(id: string) {
    const response = await api.get(`/academic/classes/${id}`);
    return response.data?.data || response.data;
  },

  // 3. Buat Kelas Baru
  async create(data: any) {
    const response = await api.post("/academic/classes", data);
    return response.data; 
  },

  // 4. Update Data Kelas
  async update(id: string, data: any) {
    const response = await api.put(`/academic/classes/${id}`, data);
    return response.data; 
  },

  // 5. Atur Wali Kelas
  async assignHomeroom(classId: string, teacherId: string) {
    const response = await api.put(`/academic/classes/${classId}/homeroom`, {
      teacher_id: teacherId,
    });
    return response.data; 
  },

  // 6. Hapus Kelas
  async delete(id: string) {
    const response = await api.delete(`/academic/classes/${id}`);
    return response.data;
  },

  // 7. Import Excel
  async importClasses(file: File, institutionId: string) {
    const formData = new FormData();
    formData.append("file", file);
    if (institutionId) formData.append("institution_id", institutionId);

    const response = await api.post("/academic/classes/import", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  // 8. Download Template
  async downloadTemplate() {
    try {
      await downloadBlob("/utils/templates/classes", "Template_Kelas.xlsx");
    } catch (error: any) {
      throw error;
    }
  },
};