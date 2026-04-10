// frontend/src/types/pesantrenqu.ts
export interface PQStudent {
  name: string;
  nis: string;
  rfid: string;
}

export interface PQBalance {
  nis: string;
  name: string;
  rfid?: string;
  balance: string;
}

export interface PQAttendancePayload {
  status: 'present' | 'late' | 'excused' | 'sick' | 'absent' | 'not_presence' | 'udzur';
  nis: number;
  status_check: 'in' | 'out';
  event_id: number;
  for_subject: string;
  for_building: string;
}