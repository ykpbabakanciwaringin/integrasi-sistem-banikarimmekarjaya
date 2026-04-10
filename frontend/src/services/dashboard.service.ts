// LOKASI: src/services/dashboard.service.ts
import { apiClient } from "@/lib/axios";
import { ApiResponse } from "@/types/common";
import { DashboardStats, SystemHealth } from "@/types/dashboard";

export const dashboardService = {
  // 1. Mengambil data statistik faktual
  getStats: async (): Promise<DashboardStats> => {
    const { data } = await apiClient.get<ApiResponse<DashboardStats>>("/dashboard/stats");
    return data.data;
  },

  // 2. Memeriksa kesehatan sistem & latensi (Real-time)
  checkHealth: async (): Promise<SystemHealth> => {
    const startTime = Date.now();
    try {
      const { data } = await apiClient.get("/health");
      const endTime = Date.now();
      
      return {
        status: data.status || "stable",
        message: data.message,
        latency: endTime - startTime, // Menghitung durasi asli (ms)
      };
    } catch (error) {
      return {
        status: "unstable",
        message: "Koneksi server terputus",
        latency: 0,
      };
    }
  },
};