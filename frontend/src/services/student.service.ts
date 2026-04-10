// LOKASI: src/services/student.service.ts
import { apiClient, downloadBlob } from "@/lib/axios";
import { StudentFilter, User } from "@/types/user";

export const studentService = {
  // GET ALL dengan dukungan Paginasi
  async getAll(
    params?: StudentFilter,
  ): Promise<{ data: User[]; total?: number }> {
    const response = await apiClient.get("/students", { params });
    const rawData = response.data?.data || response.data || [];
    return {
      data: Array.isArray(rawData) ? rawData : [],
      total: response.data?.total || 0,
    };
  },

  // PRAKTIK TERBAIK: 2-Step Upload
  async create(data: any, photoFile?: File | null) {
    const payload = { ...data };

    if (photoFile) {
      const fileData = new FormData();
      fileData.append("image", photoFile);
      fileData.append("category", "students");
      const uploadRes = await apiClient.post("/utils/upload", fileData);
      payload.image = uploadRes.data.url;
    }

    const response = await apiClient.post("/students", payload);
    return response.data;
  },

  // PRAKTIK TERBAIK: 2-Step Upload
  async update(id: string, data: any, photoFile?: File | null) {
    const payload = { ...data };

    if (photoFile) {
      const fileData = new FormData();
      fileData.append("image", photoFile);
      fileData.append("category", "students");
      const uploadRes = await apiClient.post("/utils/upload", fileData);
      payload.image = uploadRes.data.url;
    }

    const response = await apiClient.put(`/students/${id}`, payload);
    return response.data;
  },

  async delete(id: string) {
    const response = await apiClient.delete(`/students/${id}`);
    return response.data;
  },

  async importBatch(file: File, institutionId: string) {
    const formData = new FormData();
    formData.append("file", file);
    if (institutionId) formData.append("institution_id", institutionId);

    const response = await apiClient.post("/students/import", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  async downloadTemplate(institutionId?: string) {
    try {
      const queryParam = institutionId
        ? `?institution_id=${institutionId}`
        : "";
      await downloadBlob(
        `/utils/templates/students${queryParam}`,
        "Template_Siswa.xlsx",
      );
    } catch (error: any) {
      console.error("Download error:", error);
      throw error;
    }
  },
  
  async resetPassword(id: string, newPassword: string) {
    const response = await apiClient.put(`/students/${id}/password`, {
      password: newPassword,
    });
    return response.data;
  },

  // Ekspor Data Siswa ke Excel (Batch Update Ready)
  async exportExcel(params?: StudentFilter) {
    try {
      // Bersihkan param agar nilai undefined/null tidak ikut terkirim
      const cleanParams = Object.fromEntries(
        Object.entries(params || {}).filter(([_, v]) => v != null && v !== "")
      );
      const queryString = new URLSearchParams(cleanParams as any).toString();
      await downloadBlob(`/students/export-excel?${queryString}`, "Data_Siswa_Eksport.xlsx");
    } catch (error) {
      console.error("Export Excel error:", error);
      throw error;
    }
  },

  // Ekspor Data Siswa ke PDF
  async exportPdf(params?: StudentFilter) {
    try {
      const cleanParams = Object.fromEntries(
        Object.entries(params || {}).filter(([_, v]) => v != null && v !== "")
      );
      const queryString = new URLSearchParams(cleanParams as any).toString();
      await downloadBlob(`/students/export-pdf?${queryString}`, "Laporan_Biodata_Siswa.pdf");
    } catch (error) {
      console.error("Export PDF error:", error);
      throw error;
    }
  },
};