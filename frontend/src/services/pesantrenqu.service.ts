// frontend/src/services/pesantrenqu.service.ts

// 1. PERBAIKAN IMPORT: Gunakan kurung kurawal {} dan panggil 'api' atau 'apiClient'
import { api } from '@/lib/axios'; 
import { PQStudent, PQBalance, PQAttendancePayload } from '@/types/pesantrenqu';

export const pesantrenQuService = {
  getStudents: async (): Promise<PQStudent[]> => {
    // 2. Gunakan 'api.get' bukan 'axiosInstance.get'
    const response = await api.get('/thirdparty/pesantrenqu/students');
    return response.data.data; 
  },

  getBalanceByRFID: async (rfid: string): Promise<PQBalance> => {
    const response = await api.get('/thirdparty/pesantrenqu/balance', {
      params: { rfid }
    });
    return response.data.data;
  },

  recordAttendance: async (payload: PQAttendancePayload): Promise<{ message: string }> => {
    const response = await api.post('/thirdparty/pesantrenqu/attendance', payload);
    return response.data;
  }
};