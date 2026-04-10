// LOKASI: src/services/schedule.service.ts
import { apiClient as api } from "@/lib/axios";
import {
  TeachingAllocation,
  ClassSchedule,
  AllocationFilter,
  ClassSession, //  Import tipe baru
} from "@/types/master-academic";

export const scheduleService = {
  // --- ALOKASI MENGAJAR ---
  async getAllocations(params?: AllocationFilter) {
    const response = await api.get("/schedules/allocations", { params });
    return response.data?.data || response.data || [];
  },


  async createAllocation(data: {
    academic_year_id: string;
    teacher_id: string;
    subject_id: string;
    class_id: string;
    institution_id: string; 
  }) {
    const response = await api.post("/schedules/allocations", data);
    return response.data;
  },

  async deleteAllocation(id: string) {
    const response = await api.delete(`/schedules/allocations/${id}`);
    return response.data;
  },

  // --- DETAIL JADWAL (HARI & JAM) ---
  async addScheduleDetail(allocationId: string, data: Partial<ClassSchedule>) {
    // Data sekarang bisa mengirimkan pesantrenqu_event_id secara otomatis
    const response = await api.post(
      `/schedules/allocations/${allocationId}/detail`,
      data,
    );
    return response.data;
  },

  async deleteScheduleDetail(scheduleId: string) {
    const response = await api.delete(`/schedules/detail/${scheduleId}`);
    return response.data;
  },

  // =======================================================
  //  SERVICE BARU: MASTER SESI PESANTRENQU
  // =======================================================
  
  /**
   * Mengambil daftar sesi jam pelajaran (Sesi 1, Sesi 2, dst)
   */
  async getSessions(institutionId?: string) {
    const response = await api.get("/schedules/sessions", {
      params: { institution_id: institutionId }
    });
    return response.data?.data || response.data || [];
  },

  /**
   * Menambahkan master sesi baru beserta ID Event PesantrenQu
   */
  async createSession(data: {
    name: string;
    start_time: string;
    end_time: string;
    pesantrenqu_event_id: number;
    institution_id?: string;
  }) {
    const response = await api.post("/schedules/sessions", data);
    return response.data;
  },

  /**
   * Menghapus master sesi
   */
  async deleteSession(id: string) {
    const response = await api.delete(`/schedules/sessions/${id}`);
    return response.data;
  }
};