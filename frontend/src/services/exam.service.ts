// LOKASI: src/services/exam.service.ts

import { apiClient, downloadBlob } from '@/lib/axios';
import { 
  EventFilterParams, 
  SessionFilterParams, 
  ParticipantFilterParams, 
  CreateEventInput, 
  CreateSessionInput 
} from '@/types/exam';

export const examService = {
  // ==========================================
  // 1. MANAJEMEN INDUK KEGIATAN UJIAN (EVENTS)
  // ==========================================
  
  async getEvents(params?: EventFilterParams) {
    const response = await apiClient.get('/exams/events', { params });
    return {
      data: response.data?.data || [],
      total: response.data?.total || 0,
      total_pages: response.data?.total_pages || 1,
      page: response.data?.page || 1,
      limit: response.data?.limit || 10,
    };
  },

  async getEventDetail(id: string) {
    const response = await apiClient.get(`/exams/events/${id}`);
    return response.data?.data;
  },

  async createEvent(payload: CreateEventInput) {
    const response = await apiClient.post('/exams/events', payload);
    return response.data;
  },

  async updateEvent(id: string, payload: CreateEventInput) {
    const response = await apiClient.put(`/exams/events/${id}`, payload);
    return response.data;
  },

  async deleteEvent(id: string) {
    const response = await apiClient.delete(`/exams/events/${id}`);
    return response.data;
  },

  async downloadSEBConfig(eventId: string) {
    try {
      await downloadBlob(`/exams/events/${eventId}/seb-config`, `Ujian_YKP.seb`);
    } catch (err: any) {
      throw new Error(err.message || "Gagal mengunduh file konfigurasi SEB");
    }
  },

  // ==========================================
  // 2. MANAJEMEN SESI UJIAN (SESSIONS)
  // ==========================================
  
  async getSessions(params?: SessionFilterParams) {
    const response = await apiClient.get('/exams/sessions', { params });
    // [PERBAIKAN FASE 6] Menangkap struktur dari utils.SuccessResponse Backend
    const resData = response.data?.data || response.data; 
    return {
      data: resData?.list || [],
      total: resData?.total || 0,
      total_pages: resData?.total_pages || 1,
      page: resData?.page || 1,
      limit: resData?.limit || 10,
    };
  },

  async getSessionDetail(id: string) {
    const response = await apiClient.get(`/exams/sessions/${id}`);
    return response.data?.data || response.data;
  },

  async createSession(payload: CreateSessionInput) {
    const response = await apiClient.post('/exams/sessions', payload);
    return response.data;
  },

  async updateSession(id: string, payload: CreateSessionInput) {
    const response = await apiClient.put(`/exams/sessions/${id}`, payload);
    return response.data;
  },

  async deleteSession(id: string) {
    const response = await apiClient.delete(`/exams/sessions/${id}`);
    return response.data;
  },

  async stopSession(id: string) {
    const response = await apiClient.post(`/exams/sessions/${id}/stop`);
    return response.data;
  },

  async resumeSession(id: string) {
    const response = await apiClient.post(`/exams/sessions/${id}/resume`);
    return response.data;
  },

  // ==========================================
  // 3. IMPORT & EXPORT JADWAL SESI
  // ==========================================

  async importSessions(eventId: string, file: File, institutionId?: string) {
    const formData = new FormData();
    formData.append("file", file);
    if (institutionId) {
      formData.append("institution_id", institutionId);
    }
    
    const response = await apiClient.post(`/exams/events/${eventId}/sessions/import`, formData, {
      headers: { "Content-Type": "multipart/form-data" }
    });
    return response.data;
  },


  async downloadSessionTemplate(institutionId: string, eventId: string) {
    try {
      await downloadBlob(
        `/utils/templates/exam-sessions?institution_id=${institutionId}&event_id=${eventId}`, 
        `Template_Jadwal_Sesi.xlsx`
      );
    } catch (err: any) {
      throw new Error(err.message || "Gagal mengunduh template sesi");
    }
  },

  async exportSessionsExcel(eventId: string, institutionId?: string) {
    try {
      const params = institutionId ? `?institution_id=${institutionId}` : "";
      await downloadBlob(`/exams/events/${eventId}/sessions/export/excel${params}`, `Jadwal_Sesi_Ujian.xlsx`);
    } catch (err: any) {
      throw new Error(err.message || "Gagal mengunduh Jadwal Excel");
    }
  },

  async exportSessionsPDF(eventId: string, institutionId?: string) {
    try {
      const params = institutionId ? `?institution_id=${institutionId}` : "";
      await downloadBlob(`/exams/events/${eventId}/sessions/export/pdf${params}`, `Jadwal_Sesi_Ujian.pdf`);
    } catch (err: any) {
      throw new Error(err.message || "Gagal mengunduh Jadwal PDF");
    }
  },

  // ==========================================
  // 4. MANAJEMEN PESERTA (PARTICIPANTS)
  // ==========================================

  async getSessionParticipants(sessionId: string, params?: ParticipantFilterParams) {
    const response = await apiClient.get(`/exams/sessions/${sessionId}/participants`, { params });
    // [PERBAIKAN FASE 6] Menyelaraskan dengan utils.SuccessResponse di Backend
    const rawData = response.data?.data || response.data;
    return {
      data: rawData?.list || [],
      stats: rawData?.stats || { total: 0, ongoing: 0, finished: 0, blocked: 0 },
      total: rawData?.total || 0,
      page: rawData?.page || 1,
      total_pages: rawData?.total_pages || 1,
    };
  },

  async addParticipant(sessionId: string, payload: any) {
    // [PEMBAHARUAN FASE 6] Mendukung array Mapel (question_bank_ids)
    if (!payload.question_bank_ids || payload.question_bank_ids.length === 0) {
      if (payload.question_bank_id) {
        payload.question_bank_ids = [payload.question_bank_id];
      }
    }
    const response = await apiClient.post(`/exams/sessions/${sessionId}/participants`, payload);
    return response.data;
  },

  async updateParticipant(sessionId: string, studentId: string, payload: any) {
    const finalPayload = { ...payload, student_id: studentId };
    return this.addParticipant(sessionId, finalPayload);
  },

  async removeParticipantWithSession(sessionId: string, studentId: string) {
    const response = await apiClient.delete(`/exams/sessions/${sessionId}/participants/${studentId}`);
    return response.data;
  },

  async addBulkParticipants(sessionId: string, studentIds: string[], qbankIds: string[]) {
    // [PEMBAHARUAN FASE 6] Payload sekarang mengirim Array Mapel
    const response = await apiClient.post(`/exams/sessions/${sessionId}/participants/bulk`, {
      student_ids: studentIds,
      question_bank_ids: qbankIds
    });
    return response.data;
  },

  async importParticipants(sessionId: string, file: File) {
    const formData = new FormData();
    formData.append("file", file);
    const response = await apiClient.post(`/exams/sessions/${sessionId}/participants/import`, formData, {
      headers: { "Content-Type": "multipart/form-data" }
    });
    return response.data;
  },

  async downloadParticipantTemplate(sessionId: string) {
    try {
      await downloadBlob(`/exams/sessions/${sessionId}/template-participants`, `Template_Peserta_Ujian.xlsx`);
    } catch (err: any) {
      throw new Error(err.message || "Gagal mengunduh template peserta ujian");
    }
  },

  // ==========================================
  // 5. PENGAWAS & KARTU UJIAN
  // ==========================================

  async assignProctors(sessionId: string, payload: { supervisor_ids: string[], proctor_ids: string[] }) {
    const response = await apiClient.post(`/exams/sessions/${sessionId}/proctors`, payload);
    return response.data;
  },

  async downloadExamCards(sessionId: string) {
    const response = await apiClient.get(`/exams/sessions/${sessionId}/participants-cards`);
    return response.data?.data || response.data;
  },

  async downloadEventExamCards(eventId: string) {
    const response = await apiClient.get(`/exams/events/${eventId}/participants-cards`);
    return response.data?.data || response.data;
  },

  async downloadPhotoReference(sessionId: string) {
    try {
      await downloadBlob(
        `/exams/sessions/${sessionId}/photo-reference`, 
        `Acuan_Foto_${sessionId.substring(0,8)}.xlsx`
      );
    } catch (err: any) {
      throw new Error(err.message || "Gagal mengunduh file acuan");
    }
  },

  async bulkUploadPhotos(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    const response = await apiClient.post(`/exams/bulk-upload-photos`, formData, {
      headers: { "Content-Type": "multipart/form-data" }
    });
    return response.data;
  },

  // ==========================================
  // 6. LIVE MONITORING KENDALI PENGAWAS
  // ==========================================

  async resetStudentLogin(sessionId: string, studentId: string) {
    const response = await apiClient.post(`/exams/sessions/${sessionId}/participants/${studentId}/reset-login`);
    return response.data;
  },

  async generateStudentPassword(sessionId: string, studentId: string) {
    const response = await apiClient.post(`/exams/sessions/${sessionId}/participants/${studentId}/generate-password`);
    return response.data;
  },

  async generateBulkStudentPassword(sessionId: string, studentIds: string[]) {
    const response = await apiClient.post(`/exams/sessions/${sessionId}/participants/bulk-generate-password`, {
      student_ids: studentIds
    });
    return response.data;
  },

  async toggleBlockStudent(sessionId: string, studentId: string) {
    const response = await apiClient.post(`/exams/sessions/${sessionId}/participants/${studentId}/toggle-block`);
    return response.data;
  },

  async forceFinishStudent(sessionId: string, studentId: string) {
    // [PEMBAHARUAN] API dipaksa selesai oleh proktor mengirimkan student_id
    const response = await apiClient.post('/exams/finish', {
      session_id: sessionId,
      student_id: studentId
    });
    return response.data;
  },

  // ==========================================
  // 7. REKAP NILAI UJIAN (PDF, EXCEL, & BERITA ACARA)
  // ==========================================
  
  async getExamResults(sessionId: string) {
    try {
      const response = await apiClient.get(`/exams/sessions/${sessionId}/results`);
      // [PERBAIKAN FASE 6] Menyelaraskan dengan utils.SuccessResponse (hasil ada di property .data)
      const dataArray = response.data?.data || response.data; 
      return Array.isArray(dataArray) ? dataArray : [];
    } catch (err) {
      console.error("Gagal load results:", err);
      return [];
    }
  },

  async downloadExamResultsExcel(sessionId: string) {
    try {
      await downloadBlob(`/exams/sessions/${sessionId}/results/export`, `Rekap_Nilai_CBT.xlsx`);
    } catch (err: any) {
      throw new Error(err.message || "Gagal mengunduh Excel Rekap Nilai");
    }
  },

  async downloadExamResultsPDF(sessionId: string) {
    try {
      await downloadBlob(`/exams/sessions/${sessionId}/results/pdf`, `Rekap_Nilai_CBT.pdf`);
    } catch (err: any) {
      throw new Error(err.message || "Gagal mengunduh PDF Rekap Nilai");
    }
  },

  async downloadBeritaAcaraPDF(sessionId: string) {
    try {
      await downloadBlob(`/exams/sessions/${sessionId}/berita-acara/pdf`, `Berita_Acara_Ujian.pdf`);
    } catch (err: any) {
      throw new Error(err.message || "Gagal mengunduh Berita Acara");
    }
  },
};