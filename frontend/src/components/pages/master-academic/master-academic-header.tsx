// LOKASI: src/components/pages/master-academic/master-academic-header.tsx
import { Settings2 } from "lucide-react";

export function MasterAcademicHeader() {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex items-center gap-4">
        {/* Tambahan Icon Wrapper Premium */}
        <div className="h-12 w-12 bg-emerald-100 rounded-xl flex items-center justify-center border border-emerald-200/50 shadow-inner">
          <Settings2 className="h-6 w-6 text-emerald-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Master Akademik
          </h1>
          <p className="text-slate-500 text-sm mt-1 font-medium">
            Konfigurasi pusat tahun ajaran, kurikulum, mata pelajaran, dan jadwal libur.
          </p>
        </div>
      </div>
    </div>
  );
}