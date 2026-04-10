// LOKASI: src/types/student-exam.ts

// ==========================================
// 1. DTO: BUNDEL SOAL (OFFLINE READY)
// ==========================================

export interface StudentQuestionItem {
  id: string;
  type: "PG" | "ESSAY";
  content: any; 
  order_num: number;
}

export interface StudentExamBundle {
  session_id: string;
  title: string;
  duration_min: number;
  end_time: string;
  is_seb_required: boolean;
  questions: StudentQuestionItem[];
  last_answers: Record<string, string>;
  
  // [PEMBAHARUAN FASE 6] Field Pendukung Multi-Mapel & Jeda Waktu
  status: "ONGOING" | "WAITING" | "FINISHED";
  time_remaining?: number; // Sisa waktu jeda dalam detik (Jika status WAITING)
  active_subject?: string; // Nama mapel yang sedang aktif
}

// ==========================================
// 2. DTO: SINKRONISASI JAWABAN
// ==========================================

export interface StudentAnswerItem {
  question_id: string;
  answer: string;
}

export interface BulkSubmitAnswerInput {
  session_id: string;
  answers: StudentAnswerItem[];
}

// ==========================================
// 3. DTO: ANTI-CHEAT & HEARTBEAT (DIPERBARUI)
// ==========================================

export interface ExamHeartbeatInput {
  session_id: string;
  violation_count: number;
  snapshot_base64?: string; 
  violation_type?: string;  
}

export interface ExamHeartbeatResponse {
  action: "CONTINUE" | "BLOCK" | "FORCE_SUBMIT";
  time_remaining: number; 
  message: string;
}