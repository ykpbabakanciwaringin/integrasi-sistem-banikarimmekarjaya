// LOKASI: src/services/subject.service.ts
import { apiClient as api, downloadBlob } from "@/lib/axios";

export interface SubjectParams {
  page?: number;
  limit?: number;
  search?: string;
  institution_id?: string;
}

export const subjectService = {
  // --- SUBJECTS (Mata Pelajaran) ---
  async getAllSubjects(params?: SubjectParams) {
    const response = await api.get("/academic/subjects", { params });
    return response.data;
  },

  async createSubject(data: any) {
    const response = await api.post("/academic/subjects", data);
    return response.data;
  },

  async updateSubject(id: string, data: any) {
    const response = await api.put(`/academic/subjects/${id}`, data);
    return response.data;
  },

  async deleteSubject(id: string) {
    const response = await api.delete(`/academic/subjects/${id}`);
    return response.data;
  },

  async importSubjects(file: File, institutionId: string) {
    const formData = new FormData();
    formData.append("file", file);
    if (institutionId) formData.append("institution_id", institutionId);

    const response = await api.post("/academic/subjects/import", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  async downloadSubjectTemplate() {
    try {
      await downloadBlob("/utils/templates/subjects", "Template_Mapel.xlsx");
    } catch (error) {
      throw error;
    }
  },

  // =======================================================
  // FUNGSI TUGASAN GURU (ASSIGNMENTS) 
  // =======================================================
  async getAssignments(params?: {
    institution_id?: string;
    class_id?: string;
    teacher_id?: string;
    subject_id?: string;
  }) {
    const response = await api.get("/academic/assignments", { params });

    const list = (response.data?.data || []).map((item: any) => ({
      id: item.id,
      class_id: item.class_id,
      class_name: item.class
        ? `${item.class.level} - ${item.class.name}`
        : "N/A",
      subject_name: item.subject?.name || "N/A",
      teacher_name: item.teacher?.full_name || "Belum ada guru",
      institution_name: item.class?.institution?.name || "-",
      institution_id: item.institution_id,
      kkm: item.kkm || 75,
    }));
    return list;
  },

  async assignTeacher(payload: any) {
    const response = await api.post("/academic/assignments", payload);
    return response.data;
  },

  async deleteAssignment(id: string) {
    const response = await api.delete(`/academic/assignments/${id}`);
    return response.data;
  },

  async getAssignmentDetail(id: string) {
    const response = await api.get(`/academic/assignments/${id}`);
    return response.data?.data || response.data;
  },

  async getAssignmentGrades(id: string) {
    const response = await api.get(`/academic/assignments/${id}/grades`);
    return response.data?.data || [];
  },

  async updateKKM(id: string, kkm: number) {
    const response = await api.put(`/academic/assignments/${id}/kkm`, { kkm });
    return response.data;
  },

  // --- EXPORT REKAP NILAI ---
  async downloadRekap(assignmentId: string) {
    return await downloadBlob(`/academic/assignments/${assignmentId}/export`, `Rekap_Nilai.xlsx`);
  },

  async downloadRekapPDF(assignmentId: string, subjectName: string) {
    const safeName = subjectName ? subjectName.replace(/\s+/g, '_') : 'Mapel';
    const fileName = `Rekap_Nilai_${safeName}.pdf`;
    return await downloadBlob(`/academic/assignments/${assignmentId}/pdf`, fileName);
  },

  // =======================================================
  // TEMPLATE, BATCH IMPORT, & EXPORT LIST
  // =======================================================
  
  async downloadAssignmentTemplate(institutionId?: string) {
    const url = institutionId 
      ? `/utils/templates/assignments?institution_id=${institutionId}` 
      : `/utils/templates/assignments`;
    return await downloadBlob(url, "Template_Penugasan.xlsx");
  },

  async importAssignments(file: File, institutionId: string) {
    const formData = new FormData();
    formData.append("file", file);
    if (institutionId) formData.append("institution_id", institutionId);

    const response = await api.post("/academic/assignments/import", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  async exportAssignmentsExcel(params?: { institution_id?: string; class_id?: string; teacher_id?: string; }) {
    let url = `/academic/assignments/export-list/excel`;
    const query = new URLSearchParams(params as any).toString();
    if (query) url += `?${query}`;
    
    return await downloadBlob(url, "Daftar_Penugasan.xlsx");
  },

  async exportAssignmentsPDF(params?: { institution_id?: string; class_id?: string; teacher_id?: string; }) {
    let url = `/academic/assignments/export-list/pdf`;
    const query = new URLSearchParams(params as any).toString();
    if (query) url += `?${query}`;
    
    return await downloadBlob(url, "Daftar_Penugasan.pdf");
  }
};