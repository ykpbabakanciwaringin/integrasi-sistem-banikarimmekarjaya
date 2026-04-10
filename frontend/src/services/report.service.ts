// LOKASI: src/services/report.service.ts
import { apiClient as api } from "@/lib/axios";

export const reportService = {
  //  FIX: Fungsi baru untuk mengambil data Leger & Rapor secara massal
  getClassLeger: async (classId: string) => {
    const response = await api.get(`/reports/class/${classId}/leger`);
    return response.data?.data; // Mengambil data sesuai struktur respons Backend kita
  },

  // Fungsi lama untuk input report individu tetap dipertahankan
  inputReport: async (data: any) => {
    const response = await api.post("/reports", data);
    return response.data;
  },
};