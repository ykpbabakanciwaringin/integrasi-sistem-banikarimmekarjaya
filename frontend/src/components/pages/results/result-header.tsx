// LOKASI: src/components/pages/results/result-header.tsx
import { Layers } from "lucide-react";

export function ResultHeader() {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2 tracking-tight">
          <Layers className="h-6 w-6 text-emerald-600" /> Pusat Hasil Belajar
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Akses rekapitulasi nilai mata pelajaran, leger kelas, cetak rapor, dan hasil per sesi Ujian.
        </p>
      </div>
    </div>
  );
}