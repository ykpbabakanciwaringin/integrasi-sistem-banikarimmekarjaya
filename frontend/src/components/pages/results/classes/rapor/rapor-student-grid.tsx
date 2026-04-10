import { RaporStudentCard } from "./rapor-student-card";
import { Skeleton } from "@/components/ui/skeleton";
import { ClipboardX } from "lucide-react";

export function RaporStudentGrid({ data }: any) {
  const { students, isLoading, totalItems } = data;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 no-print">
        {[...Array(8)].map((_, i) => (
          <Skeleton key={i} className="h-[280px] w-full rounded-2xl bg-slate-200 animate-pulse" />
        ))}
      </div>
    );
  }

  if (totalItems === 0) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-slate-400 no-print">
        <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
          <ClipboardX className="h-10 w-10 text-slate-200" />
        </div>
        <p className="font-bold text-lg text-slate-600">Siswa Tidak Ditemukan</p>
        <p className="text-sm">Cobalah kata kunci pencarian yang berbeda.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 no-print animate-in slide-in-from-bottom-4 duration-700">
      {students.map((student: any) => (
        <RaporStudentCard key={student.student_id} student={student} />
      ))}
    </div>
  );
}