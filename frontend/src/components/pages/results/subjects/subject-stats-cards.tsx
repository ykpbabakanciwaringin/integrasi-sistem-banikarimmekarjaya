// LOKASI: src/components/pages/results/subjects/subject-stats-cards.tsx
import React from "react";
import { Calculator, Trophy, ArrowDownToLine, Users } from "lucide-react";

export function SubjectStatsCards({ stats }: { stats: any }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 no-print">
      <StatsCard title="Rata-Rata Kelas" value={stats.avg} icon={<Calculator className="text-emerald-600 h-5 w-5" />} />
      <StatsCard title="Nilai Tertinggi" value={stats.max} icon={<Trophy className="text-amber-500 h-5 w-5" />} />
      <StatsCard title="Nilai Terendah" value={stats.min} icon={<ArrowDownToLine className="text-rose-500 h-5 w-5" />} />
      <StatsCard title="Tuntas / Remedial" value={`${stats.pass} / ${stats.fail}`} icon={<Users className="text-blue-500 h-5 w-5" />} />
    </div>
  );
}

const StatsCard = ({ title, value, icon }: any) => (
  <div className="p-4 rounded-xl border bg-white border-slate-200 flex items-center gap-3 transition-all shadow-sm hover:shadow-md">
    <div className="h-10 w-10 rounded-lg bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100">{icon}</div>
    <div className="min-w-0">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 line-clamp-1">{title}</p>
      <div className="text-lg md:text-xl font-black text-slate-800 truncate" title={value}>{value}</div>
    </div>
  </div>
);