// LOKASI: src/services/institution.service.ts
import { apiClient as api, downloadBlob } from "@/lib/axios";

export interface Institution {
  id: string;
  code: string;
  name: string;
  category: string;
  level_code: string;
  logo_url?: string;
  address_city?: string;
  address_detail?: string;
  contact_phone?: string;
  contact_email?: string;
  website?: string;
  header1?: string;
  header2?: string;
  updated_at?: string;
  class_count?: number;
  student_count?: number;
  //  TAMBAHKAN INI:
  weekly_day_off?: string;
}

export const institutionService = {
  // Paginasi Utama
  async getAllPaginated(params?: { page?: number; limit?: number; search?: string }) {
    const response = await api.get("/institutions", { params });
    return response.data; 
  },

  //  [PENYEMPURNAAN] Pisahkan Upload Logo dan Pengiriman JSON
  async create(data: Partial<Institution>, logoFile?: File) {
    const payload = { ...data };

    if (logoFile) {
      const fileData = new FormData();
      fileData.append("image", logoFile);
      fileData.append("category", "institutions"); 
      const uploadRes = await api.post("/utils/upload", fileData);
      
      // Mengambil URL dari respons murni
      payload.logo_url = uploadRes.data.url;
    }

    const response = await api.post("/institutions", payload);
    // Kembalikan response.data utuh yang sekarang berisi { message: "...", data: { ... } }
    return response.data;
  },

  async update(id: string, data: Partial<Institution>, logoFile?: File) {
    const payload = { ...data };

    if (logoFile) {
      const fileData = new FormData();
      fileData.append("image", logoFile);
      fileData.append("category", "institutions"); 
      const uploadRes = await api.post("/utils/upload", fileData);
      
      payload.logo_url = uploadRes.data.url;
    }

    const response = await api.put(`/institutions/${id}`, payload);
    return response.data;
  },

  async delete(id: string) {
    const response = await api.delete(`/institutions/${id}`);
    return response.data;
  },

  //  FUNGSI BARU: Update Hari Libur Mingguan secara Dinamis
  async updateWeeklyDayOff(day: string, institutionId?: string) {
    // Parameter institutionId bersifat opsional (digunakan oleh Super Admin)
    const response = await api.put(
      "/academic/weekly-day-off", 
      { weekly_day_off: day }, 
      { params: { institution_id: institutionId } }
    );
    return response.data;
  },

  async importInstitutions(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post("/institutions/import", formData);
    return response.data;
  },

  async downloadTemplate() {
    try {
      await downloadBlob("/utils/templates/institutions", "Template_Lembaga.xlsx");
    } catch (error: any) {
      throw error;
    }
  },
  async updatePqSettings(id: string, enabled: boolean, partnerKey: string) {
    const response = await api.patch(`/institutions/${id}/pq-settings`, {
      is_pq_integration_enabled: enabled,
      pq_partner_key: partnerKey,
    });
    return response.data;
  },
};