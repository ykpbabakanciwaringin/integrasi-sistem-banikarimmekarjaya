// LOKASI: src/types/exam.ts

import { BaseEntity, PaginationParams } from "./common";
import { Institution } from "./academic";

// ==========================================
// 1. FILTER PARAMS (Menyesuaikan BaseFilter Backend)
// ==========================================

export interface BaseFilterParams extends PaginationParams {
  sort_by?: string;
  sort_order?: 'ASC' | 'DESC';
}

export interface EventFilterParams extends BaseFilterParams {
  institution_id?: string;
  is_active?: boolean;
}

export interface SessionFilterParams extends BaseFilterParams {
  institution_id?: string;
  exam_event_id?: string;
  status?: string; 
  subject?: string;
}

export interface ParticipantFilterParams extends BaseFilterParams {
  status?: string;
  gender?: string;
  class_id?: string;
}

// ==========================================
// 2. ENTITIES (Menyesuaikan Database)
// ==========================================

export interface ExamEvent extends BaseEntity {
  institution_id: string;
  title: string;
  description?: string;
  start_date: string; 
  end_date: string;   
  room_count: number;       
  subject_count: number;    // [TAMBAHAN BARU] Batas maksimal kolom Mapel
  is_active: boolean;
  is_seb_required: boolean; 
  status: string;           
  institution?: Institution;
  sessions?: ExamSession[];
}

export interface ExamSession extends BaseEntity {
  exam_event_id: string;
  institution_id?: string;
  title: string;
  token: string;
  start_time: string;
  end_time: string;
  duration_min: number;
  is_active: boolean;
  subject_list: string;     // [PERBAIKAN] Sekarang menggunakan string gabungan
  participant_count?: number;
  institution?: Institution;
  supervisors?: any[];      // [TAMBAHAN BARU] Relasi Pengawas Ruang
  proctors?: any[];         // [TAMBAHAN BARU] Relasi Proktor / Teknisi
}

export interface ParticipantStats {
  total: number;
  ongoing: number;
  finished: number;
  blocked: number;
}

export interface ExamParticipant extends BaseEntity {
  exam_session_id: string;
  student_id: string;
  question_bank_id: string;
  exam_number: string;
  status: string;
  ip_address?: string;
  last_heartbeat_at?: string;
  started_at?: string;
  finished_at?: string;
  final_score: number;
  student?: any; 
}

// ==========================================
// 3. INPUT DTOs (Data Transfer Objects)
// ==========================================

export interface CreateEventInput {
  institution_id?: string;
  title: string;
  description?: string;
  start_date: string;
  end_date: string;
  room_count: number;       
  subject_count: number;    // [TAMBAHAN BARU]
  is_active: boolean;
  is_seb_required: boolean; 
  status?: string;          
}

export interface CreateSessionInput {
  exam_event_id: string;
  institution_id: string; 
  title: string;
  token?: string;
  start_time: string;
  end_time: string;
  duration_min: number;
  subject_list: string;     
  supervisor_ids: string[]; 
  proctor_ids: string[];   
}