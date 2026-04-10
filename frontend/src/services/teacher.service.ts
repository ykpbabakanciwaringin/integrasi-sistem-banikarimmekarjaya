// LOKASI: src/services/teacher.service.ts
import { apiClient, downloadBlob } from "@/lib/axios";
import { User } from "@/types/user";

export const teacherService = {
  getAll: async (params?: any): Promise<{ data: User[]; total?: number }> => {
    const cleanParams = { ...params };
    // Membersihkan parameter "ALL" agar tidak dikirim ke backend
    if (cleanParams.gender === "ALL") delete cleanParams.gender;
    if (cleanParams.institution_id === "ALL") delete cleanParams.institution_id;
    if (cleanParams.status === "ALL") delete cleanParams.status;
    if (cleanParams.position === "ALL") delete cleanParams.position;

    const response = await apiClient.get("/teachers", { params: cleanParams });
    const rawData = response.data?.data || response.data || [];
    
    return {
      data: Array.isArray(rawData) ? rawData : [],
      total: response.data?.total || 0,
    };
  },

  async create(data: any, photoFile?: File | null) {
    const payload = { ...data };

    // Step 1: Upload Foto Terlebih Dahulu (Jika Ada)
    if (photoFile) {
      const fileData = new FormData();
      fileData.append("image", photoFile);
      fileData.append("category", "profiles"); 
      
      const uploadRes = await apiClient.post("/utils/upload", fileData);
      payload.image = uploadRes.data.url; 
    }

    // Step 2: Kirim Payload Murni JSON
    const response = await apiClient.post("/teachers", payload);
    return response.data;
  },

  async update(id: string, data: any, photoFile?: File | null) {
    const payload = { ...data };

    // Step 1: Upload Foto Terlebih Dahulu (Jika Ada Perubahan)
    if (photoFile) {
      const fileData = new FormData();
      fileData.append("image", photoFile);
      fileData.append("category", "profiles"); 
      
      const uploadRes = await apiClient.post("/utils/upload", fileData);
      payload.image = uploadRes.data.url; 
    }

    // Step 2: Kirim Payload Murni JSON
    const response = await apiClient.put(`/teachers/${id}`, payload);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/teachers/${id}`);
  },

  importBatch: async (file: File, institution_id?: string) => {
    const formData = new FormData();
    formData.append("file", file);
    if (institution_id) {
      formData.append("institution_id", institution_id);
    }
    const response = await apiClient.post("/teachers/import", formData);
    return response.data;
  },

  downloadTemplate: async (institutionId?: string) => {
    try {
      const queryParam = institutionId ? `?institution_id=${institutionId}` : "";
      await downloadBlob(`/utils/templates/teachers${queryParam}`, "Template_Guru.xlsx");
    } catch (error: any) {
      console.error("Gagal download template guru:", error);
      throw error; 
    }
  },

  // Export Excel
  exportExcel: async (params?: any) => {
    const cleanParams = { ...params };
    Object.keys(cleanParams).forEach(key => {
      if (cleanParams[key] === "ALL" || cleanParams[key] === undefined) {
        delete cleanParams[key];
      }
    });
    
    const queryString = new URLSearchParams(cleanParams).toString();
    const url = `/teachers/export/excel${queryString ? `?${queryString}` : ''}`;
    await downloadBlob(url, "Data_Guru.xlsx");
  },

  // Export PDF
  exportPdf: async (params?: any) => {
    const cleanParams = { ...params };
    Object.keys(cleanParams).forEach(key => {
      if (cleanParams[key] === "ALL" || cleanParams[key] === undefined) {
        delete cleanParams[key];
      }
    });
    
    const queryString = new URLSearchParams(cleanParams).toString();
    const url = `/teachers/export/pdf${queryString ? `?${queryString}` : ''}`;
    await downloadBlob(url, "Laporan_Data_Guru.pdf");
  },

  // --- OPERASIONAL GURU PIKET ---
  async submitAttendance(data: { teacher_id: string; date: string; status: string; notes?: string }) {
    const response = await apiClient.post("/teachers/attendance", data);
    return response.data;
  },

  async getAttendances(params?: { institution_id?: string; month?: string }) {
    const response = await apiClient.get("/teachers/attendance", { params });
    return response.data?.data || [];
  },
};