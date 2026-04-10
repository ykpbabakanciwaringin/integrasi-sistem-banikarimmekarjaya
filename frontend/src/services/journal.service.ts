// LOKASI: src/services/journal.service.ts
import { apiClient as api, downloadBlob } from "@/lib/axios";
import {
  ClassJournal,
  StudentAttendance,
  JournalFilter,
} from "@/types/master-academic";

export const journalService = {
  // Jurnal Harian
  async getJournals(params?: JournalFilter) {
    const response = await api.get("/journals", { params });
    return response.data?.data || response.data || [];
  },
  
  async createJournal(data: Partial<ClassJournal>) {
    const response = await api.post("/journals", data);
    return response.data;
  },

  async updateJournal(id: string, data: Partial<ClassJournal>) {
    const response = await api.put(`/journals/${id}`, data);
    return response.data;
  },

  async deleteJournal(id: string) {
    const response = await api.delete(`/journals/${id}`);
    return response.data;
  },

  // Absensi per Jurnal
  async getAttendances(journalId: string) {
    const response = await api.get(`/journals/${journalId}/attendances`);
    return response.data?.data || response.data || [];
  },

  async submitAttendances(
    journalId: string,
    attendances: Partial<StudentAttendance>[],
  ) {
    const response = await api.post(`/journals/${journalId}/attendances`, attendances);
    return response.data;
  },

  async verifyJournal(id: string) {
    const response = await api.put(`/journals/${id}/verify`);
    return response.data;
  },

  //  FUNGSI BARU: SISTEM PEMULIHAN SINKRONISASI (RETRY SYNC)
  async retrySyncAttendance(journalId: string) {
    const response = await api.post(`/journals/${journalId}/retry-sync`);
    return response.data;
  },

  //  FUNGSI BARU: EXPORT REKAP EXCEL & PDF
  async exportRecap(type: string, month: string, format: string, classId?: string, allocId?: string) {
    // Membangun URL Query Parameter
    let queryString = `?type=${type}&month=${month}&format=${format}`;
    if (classId) queryString += `&class_id=${classId}`;
    if (allocId) queryString += `&teaching_allocation_id=${allocId}`;

    // Nama file otomatis saat terunduh
    const fileName = `Rekap_${type}_${month}.${format === 'excel' ? 'xlsx' : 'pdf'}`;
    
    // Menembak endpoint Backend Golang
    await downloadBlob(`/journals/export${queryString}`, fileName);
  }
};