// LOKASI: src/services/account.service.ts
import { apiClient as api } from "@/lib/axios";
import { AccountPayload } from "@/types/user";

export const accountService = {
  // GET ALL dengan Paginasi & Filter Lengkap
  async getAll(params: {
    page: number;
    limit: number;
    search: string;
    role?: string;
    institution_id?: string;
    status?: string;
  }) {
    const cleanParams = { ...params };
    // Bersihkan parameter default agar tidak memberatkan query backend
    if (cleanParams.role === "ALL") delete cleanParams.role;
    if (cleanParams.institution_id === "ALL") delete cleanParams.institution_id;
    if (cleanParams.status === "ALL") delete cleanParams.status;

    const response = await api.get("/accounts", { params: cleanParams });
    return response.data; // Mengembalikan object { data: [], total: x, page: y, ... }
  },

  async create(data: Partial<AccountPayload>) {
    const response = await api.post("/accounts", data);
    return response.data;
  },

  //  PRAKTIK TERBAIK: 2-Step Upload untuk Update Akun
  async update(id: string, data: Partial<AccountPayload>) {
    const payload = { ...data };

    // 1. Standarisasi tipe boolean untuk backend Golang
    if (payload.is_active !== undefined) {
      payload.is_active = payload.is_active === true || payload.is_active === "true" as any;
    }

    // 2. Lakukan Upload Gambar ke layanan Media secara terpisah jika berupa File
    if (payload.image instanceof File) {
      const fileData = new FormData();
      fileData.append("image", payload.image);
      fileData.append("category", "profiles"); 
      
      const uploadRes = await api.post("/utils/upload", fileData);
      
      // Ganti File dengan String URL yang dikembalikan server
      payload.image = uploadRes.data.url; 
    }

    // 3. Tembak endpoint Update dengan format JSON murni
    const response = await api.put(`/accounts/${id}`, payload);
    return response.data;
  },

  async delete(id: string) {
    const response = await api.delete(`/accounts/${id}`);
    return response.data;
  },

  // --- ENROLLMENTS (Penugasan Lembaga) ---
  
  //  PERBAIKAN: Tambahkan position pada parameter data
  async addEnrollment(userId: string, data: { institution_id: string; role: string; position?: string }) {
    const response = await api.post(`/accounts/${userId}/enrollments`, data);
    return response.data;
  },
  
  //  PERBAIKAN: Tambahkan parameter position dan letakkan pada payload body
  async updateEnrollment(userId: string, enrollmentId: string, role: string, position?: string) {
    const response = await api.put(`/accounts/${userId}/enrollments/${enrollmentId}`, { role, position });
    return response.data;
  },
  
  async deleteEnrollment(userId: string, enrollmentId: string) {
    const response = await api.delete(`/accounts/${userId}/enrollments/${enrollmentId}`);
    return response.data;
  }
};