import React from "react";
import { Users, GraduationCap, School } from "lucide-react";

export function LegerStatsCards({ classInfo, totalStudents }: any) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 no-print">
      <StatsCard title="Total Siswa" value={`${totalStudents || 0} Siswa`} icon={<Users className="text-blue-500 h-5 w-5" />} />
      <StatsCard title="Wali Kelas" value={classInfo?.teacher_name || "-"} icon={<GraduationCap className="text-emerald-500 h-5 w-5" />} />
      <StatsCard title="Tingkat/Jenjang" value={`Kelas ${classInfo?.level || "-"}`} icon={<School className="text-amber-500 h-5 w-5" />} />
    </div>
  );
}

const StatsCard = ({ title, value, icon }: any) => (
  <div className="p-4 rounded-xl border bg-white border-slate-200 flex items-center gap-3 shadow-sm hover:shadow-md transition-all">
    <div className="h-10 w-10 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{title}</p>
      <p className="text-sm font-black text-slate-700 truncate">{value}</p>
    </div>
  </div>
);