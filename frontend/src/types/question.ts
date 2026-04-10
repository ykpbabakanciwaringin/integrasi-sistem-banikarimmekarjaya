// src/types/question.ts
import { BaseEntity, PaginationParams } from "./common";

// Struktur Konten Soal (Strict JSON)
export interface QuestionContent {
  question: string;
  options?: { [key: string]: string }; // A, B, C, D, E (Opsional jika Essay)
  image_url?: string;
}

export interface QuestionBank extends BaseEntity {
  institution_id: string;
  teacher_id: string;
  subject_id: string;

  // Hierarchy
  parent_id?: string | null;

  grade_level: string;
  title: string;
  type: "PG" | "ESSAY" | "MIXED"; 

  content: QuestionContent;

  answer_key: string;
  score_weight: number;

  // Virtual Field & Relasi dari Backend
  item_count?: number;
  subject_name?: string;
  subject_code?: string;
  institution_name?: string;
  author_name?: string;

  institution?: {
    id: string;
    name: string;
    level_code: string;
  };
  subject?: {
    id: string;
    name: string;
    code: string;
  };

  // [BARU] Relasi ke anak soal (Butir Soal)
  items?: QuestionBank[];
}

// Filter
export interface QuestionFilter extends PaginationParams {
  institution_id?: string;
  subject_id?: string;
  search?: string;
}
