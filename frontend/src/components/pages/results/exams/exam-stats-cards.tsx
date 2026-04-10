// LOKASI: src/components/pages/results/exams/exam-stats-cards.tsx
import { Calculator, Trophy, ArrowDownToLine, Users } from "lucide-react";

export function ExamStatsCards({ stats }: { stats: any }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <StatsCard title="Siswa Selesai" value={`${stats.done} / ${stats.total}`} icon={<Users className="text-blue-600 h-6 w-6" />} bgColor="bg-blue-50" borderColor="border-blue-100" />
      <StatsCard title="Rata-Rata Nilai" value={stats.avg} icon={<Calculator className="text-emerald-600 h-6 w-6" />} bgColor="bg-emerald-50" borderColor="border-emerald-100" />
      <StatsCard title="Nilai Tertinggi" value={stats.max} icon={<Trophy className="text-amber-500 h-6 w-6" />} bgColor="bg-amber-50" borderColor="border-amber-100" />
      <StatsCard title="Nilai Terendah" value={stats.min} icon={<ArrowDownToLine className="text-rose-500 h-6 w-6" />} bgColor="bg-rose-50" borderColor="border-rose-100" />
    </div>
  );
}

const StatsCard = ({ title, value, icon, bgColor, borderColor }: any) => (
  <div className="p-5 rounded-2xl border bg-white border-slate-200 flex items-center gap-5 transition-all duration-300 shadow-sm hover:shadow-md hover:border-emerald-300 hover:-translate-y-1 group">
    <div className={`h-14 w-14 rounded-xl flex items-center justify-center shrink-0 border transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 ${bgColor} ${borderColor}`}>
      {icon}
    </div>
    <div className="min-w-0 flex flex-col justify-center">
      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1 line-clamp-1">{title}</p>
      <div className="text-2xl md:text-3xl font-black text-slate-800 truncate tracking-tight leading-none font-mono" title={value}>{value}</div>
    </div>
  </div>
);