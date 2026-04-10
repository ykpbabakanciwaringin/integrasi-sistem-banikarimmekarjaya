import { useMemo } from "react";

export interface ParsedStudentData {
  className: string;
  institutionName: string;
}

export function useStudentParser(activeUser: any): ParsedStudentData {
  return useMemo(() => {
    if (!activeUser) return { className: "-", institutionName: "-" };

    let className = "-";
    let institutionName = "-";

    // CARI DI LEVEL 1: Relasi Enrollments (Prioritas Utama)
    if (activeUser.enrollments && activeUser.enrollments.length > 0) {
      const enr: any = activeUser.enrollments[0];
      className = 
        enr?.classroom?.name || 
        enr?.class?.name || 
        enr?.rombel?.name || 
        "-";
      institutionName = enr?.institution?.name || "-";
    }

    // CARI DI LEVEL 2: Relasi Profile 
    if (className === "-" && activeUser.profile) {
      const prof: any = activeUser.profile;
      className = 
        prof?.class?.name || 
        prof?.class_name || 
        prof?.classroom_name || 
        "-";
    }

    // CARI DI LEVEL 3: Root Objek (Fallback terakhir)
    if (className === "-") {
      className = activeUser.class_name || "-";
    }

    return { className, institutionName };
  }, [activeUser]);
}