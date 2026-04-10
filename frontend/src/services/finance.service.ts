// LOKASI: src/services/finance.service.ts
import { apiClient, downloadBlob } from "@/lib/axios";
import { FinanceBillingFilter, ProcessPaymentInput, CreateRukhsohInput, FinanceSummary } from "@/types/finance";

export const financeService = {
  // GET Data Tagihan dengan Paginasi & Filter
  async getBillings(params?: FinanceBillingFilter) {
    const response = await apiClient.get("/finance/billings", { params });
    const payload = response.data?.data; 
    const items = payload?.data || [];   
    return {
      data: Array.isArray(items) ? items : [],
      total: payload?.total || 0,
    };
  },

  // POST Proses Pembayaran
  async processPayment(payload: ProcessPaymentInput) {
    const response = await apiClient.post("/finance/payments", payload);
    return response.data;
  },

  // GET Download Excel Laporan
  async exportExcel(params?: FinanceBillingFilter) {
    try {
      const cleanParams = Object.fromEntries(
        Object.entries(params || {}).filter(([_, v]) => v != null && v !== "")
      );
      const queryString = new URLSearchParams(cleanParams as any).toString();
      await downloadBlob(`/finance/export/excel?${queryString}`, "Laporan_Pembayaran.xlsx");
    } catch (error) {
      console.error("Export Excel error:", error);
      throw error;
    }
  },

  // GET Cetak Kartu Pembayaran PDF
  async downloadKartuPembayaran(studentId: string) {
    try {
      await downloadBlob(`/finance/billings/${studentId}/kartu-pembayaran`, "Kartu_Pembayaran.pdf");
    } catch (error) {
      console.error("Download PDF error:", error);
      throw error;
    }
  },

  // POST Cetak Surat Pernyataan Rukhsoh PDF
  async generateSuratPernyataan(payload: CreateRukhsohInput) {
    try {
      const response = await apiClient.post("/finance/rukhsoh/pdf", payload, {
        responseType: "blob", 
      });
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "Surat_Pernyataan_Rukhsoh.pdf");
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Generate Surat Pernyataan error:", error);
      throw error;
    }
  },

  async getFinanceSummary(params?: FinanceBillingFilter) {
    const response = await apiClient.get("/finance/summary", { params });
    return response.data?.data; 
  },

  // ==========================================
  //  INTEGRASI CRUD KATEGORI & EXCEL ETL
  // ==========================================
  
  // GET Kategori
  async getCategories() {
    const response = await apiClient.get("/finance/categories");
    return response.data?.data || [];
  },

  // POST Buat Kategori Baru (Akan dipanggil saat validasi Excel)
  async createCategory(payload: { name: string; category_type: string; description?: string }) {
    const response = await apiClient.post("/finance/categories", payload);
    return response.data;
  },

  // PUT Update Kategori
  async updateCategory(id: string, payload: { name: string; category_type: string; description?: string }) {
    const response = await apiClient.put(`/finance/categories/${id}`, payload);
    return response.data;
  },

  // DELETE Kategori
  async deleteCategory(id: string) {
    const response = await apiClient.delete(`/finance/categories/${id}`);
    return response.data;
  },

  //  PERBAIKAN: Fase 1 - Preview Excel (Hanya ekstrak kategori unik)
  async previewExcel(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    const response = await apiClient.post("/finance/import/preview", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data?.data || []; // Mengembalikan array string kategori
  },

  async executeImport(file: File, mappings: { original_name: string; category_type: string }[]) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("mappings", JSON.stringify(mappings)); // Kirim mapping sebagai JSON string
    const response = await apiClient.post("/finance/import/execute", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  async getFilterOptions() {
    const response = await apiClient.get("/finance/filter-options");
    return response.data?.data || { pondoks: [], sekolahs: [], programs: [] };
  },

};