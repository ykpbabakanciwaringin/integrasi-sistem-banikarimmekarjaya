// LOKASI: src/services/question.service.ts
import { apiClient, downloadBlob } from "@/lib/axios";
import { QuestionBank, QuestionFilter } from "@/types/question";

export const questionService = {
  // --- 1. MANAJEMEN PAKET SOAL (HEADER) ---

  async getAll(params?: QuestionFilter) {
    const response = await apiClient.get("/questions/packets", { params });

    const rawData = response.data?.data || response.data || [];
    
    const meta = response.data?.meta || response.data?.pagination || response.data || {};
    let total = meta.total || meta.total_items || meta.totalItems || 0;

    if (total === 0 && Array.isArray(rawData) && rawData.length > 0) {
      total = rawData.length; 
    }

    const list = (Array.isArray(rawData) ? rawData : []).map((item: any) => ({
      ...item,
      subject_name: item.subject?.name || "-",
      subject_code: item.subject?.code || "?",
      institution_name: item.institution?.name || "-",
      author_name:
        item.teacher?.profile?.full_name || item.teacher?.username || "Admin / Guru",
      item_count: item.item_count || 0,
    }));

    return { data: list as QuestionBank[], total: total };
  },

  async getDetail(id: string) {
    const response = await apiClient.get(`/questions/packets/${id}`);
    return response.data?.data || response.data;
  },

  async create(payload: Partial<QuestionBank>) {
    const response = await apiClient.post("/questions/packets", payload);
    return response.data?.data || response.data;
  },

  async update(id: string, payload: Partial<QuestionBank>) {
    const response = await apiClient.put(`/questions/packets/${id}`, payload);
    return response.data?.data || response.data;
  },

  async delete(id: string) {
    const response = await apiClient.delete(`/questions/packets/${id}`);
    return response.data?.data || response.data;
  },

  // --- 2. MANAJEMEN BUTIR SOAL (ITEMS) ---

  async createItem(payload: any) {
    const response = await apiClient.post("/questions/items", payload);
    return response.data?.data || response.data;
  },

  async updateItem(id: string, payload: any) {
    const response = await apiClient.put(`/questions/items/${id}`, payload);
    return response.data?.data || response.data;
  },

  async deleteItem(id: string) {
    const response = await apiClient.delete(`/questions/items/${id}`);
    return response.data?.data || response.data;
  },

  // --- 3. UTILITIES (IMPORT, UPLOAD, TEMPLATE, EXPORT) ---

  async importQuestions(file: File, parentId: string) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("parent_id", parentId);

    // [PERBAIKAN]: Menghapus headers manual agar Axios otomatis set Boundary String
    const response = await apiClient.post("/questions/import", formData);
    return response.data?.data || response.data;
  },

  async uploadImage(file: File) {
    const formData = new FormData();
    formData.append("image", file);
    formData.append("category", "questions");

    // [PERBAIKAN]: Menghapus headers manual agar Axios otomatis set Boundary String
    const response = await apiClient.post("/utils/upload", formData);
    return response.data?.data?.url || response.data?.url;
  },

  async downloadTemplate() {
    try {
      await downloadBlob("/utils/templates/questions", "Template_Soal.xlsx");
    } catch (error: any) {
      console.error("Download Error:", error);
      throw new Error(error.message || "Gagal download template soal");
    }
  },

  async exportExcel(params?: QuestionFilter, institutionName?: string) {
    try {
      const query = new URLSearchParams();
      if (params?.institution_id && params.institution_id !== "all") query.append("institution_id", params.institution_id);
      if (params?.subject_id && params.subject_id !== "all") query.append("subject_id", params.subject_id);
      if (params?.search) query.append("search", params.search);

      const queryString = query.toString();
      const url = queryString ? `/questions/packets/export?${queryString}` : "/questions/packets/export";

      const zipName = institutionName 
        ? `KUMPULAN BANK SOAL ${institutionName.toUpperCase()}.zip` 
        : "KUMPULAN BANK SOAL.zip";

      await downloadBlob(url, zipName);
    } catch (error: any) {
      console.error("Export Error:", error);
      throw new Error(error.message || "Gagal mengekspor data bank soal");
    }
  },
  
  async exportPDF(params?: QuestionFilter, institutionName?: string) {
    try {
      const query = new URLSearchParams();
      if (params?.institution_id && params.institution_id !== "all") query.append("institution_id", params.institution_id);
      if (params?.subject_id && params.subject_id !== "all") query.append("subject_id", params.subject_id);
      if (params?.search) query.append("search", params.search);

      const queryString = query.toString();
      const url = queryString ? `/questions/packets/export/pdf?${queryString}` : "/questions/packets/export/pdf";

      const zipName = institutionName 
        ? `KUMPULAN BANK SOAL ${institutionName.toUpperCase()} (PDF).zip` 
        : "KUMPULAN BANK SOAL (PDF).zip";

      await downloadBlob(url, zipName);
    } catch (error: any) {
      console.error("Export Error:", error);
      throw new Error(error.message || "Gagal mengekspor data bank soal ke PDF");
    }
  },

  // ==========================================================================
  // BATCH UPLOAD & EXPORT LIST PAKET SOAL (INDUK)
  // ==========================================================================

  async downloadBatchTemplate(institutionId?: string) {
    try {
      const url = (institutionId && institutionId !== "all") 
        ? `/questions/packets/template-batch?institution_id=${institutionId}` 
        : "/questions/packets/template-batch";
        
      await downloadBlob(url, "Template_Batch_Paket_Soal.xlsx");
    } catch (error: any) {
      console.error("Download Template Error:", error);
      throw new Error(error.message || "Gagal mengunduh template Excel");
    }
  },

  async importBatchPackets(file: File, institutionId?: string) {
    const formData = new FormData();
    formData.append("file", file);
    
    if (institutionId && institutionId !== "all") {
      formData.append("institution_id", institutionId);
    }

    // [PERBAIKAN]: Menghapus headers manual agar Axios otomatis set Boundary String
    const response = await apiClient.post("/questions/packets/import-batch", formData);
    return response.data?.data || response.data;
  },

  async exportPacketList(params?: QuestionFilter, institutionName?: string) {
    try {
      const query = new URLSearchParams();
      if (params?.institution_id && params.institution_id !== "all") query.append("institution_id", params.institution_id);
      if (params?.subject_id && params.subject_id !== "all") query.append("subject_id", params.subject_id);
      if (params?.search) query.append("search", params.search);

      const queryString = query.toString();
      const url = queryString ? `/questions/packets/export-list?${queryString}` : "/questions/packets/export-list";

      const fileName = institutionName 
        ? `LAPORAN_DAFTAR_PAKET_SOAL_${institutionName.toUpperCase()}.xlsx` 
        : "LAPORAN_DAFTAR_PAKET_SOAL.xlsx";

      await downloadBlob(url, fileName);
    } catch (error: any) {
      console.error("Export List Error:", error);
      throw new Error(error.message || "Gagal mengekspor laporan daftar paket soal");
    }
  },
};