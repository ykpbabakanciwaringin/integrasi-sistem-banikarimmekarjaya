// LOKASI: src/services/student-exam.service.ts

import { apiClient } from "@/lib/axios";
import { dbProvider } from "@/lib/db";
import { 
  StudentExamBundle, 
  BulkSubmitAnswerInput, 
  ExamHeartbeatInput, 
  ExamHeartbeatResponse 
} from "@/types/student-exam";

export const StudentExamService = {
  startExam: async (token: string): Promise<StudentExamBundle> => {
    // API Call ke Backend
    const response = await apiClient.post("/exams/student/execute/start", { token });
    const bundle: StudentExamBundle = response.data?.data || response.data;
    
    // [PEMBAHARUAN FASE 6]
    // Jangan simpan ke IndexedDB jika statusnya WAITING (Siswa sedang Jeda), 
    // karena belum ada soal mapel baru yang bisa dikerjakan secara offline.
    if (bundle && bundle.status !== "WAITING") {
      await dbProvider.saveExamBundle(bundle);
    }
    
    return bundle;
  },

  syncAnswers: async (payload: BulkSubmitAnswerInput): Promise<void> => {
    await apiClient.post("/exams/student/execute/sync", payload);
  },

  finishExam: async (sessionId: string): Promise<any> => {
    const response = await apiClient.post("/exams/student/finish", { session_id: sessionId });
    return response.data?.data || response.data;
  },

  pingHeartbeat: async (payload: ExamHeartbeatInput): Promise<ExamHeartbeatResponse> => {
    const response = await apiClient.post("/exams/student/execute/heartbeat", payload);
    return response.data?.data || response.data;
  },

  // Menarik Riwayat Ujian Siswa (Daftar Matriks Nilai)
  getHistory: async (): Promise<any[]> => {
    const response = await apiClient.get("/exams/student/history");
    return response.data?.data || [];
  }
};