import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, Printer, Building2 } from "lucide-react";
import Link from "next/link";

export function LegerDetailHeader({ classInfo, isLoading, onPrint }: any) {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 no-print">
      <div className="w-full md:w-auto">
        <Link href="/dashboard/results">
          <Button variant="ghost" className="text-sm font-bold text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 mb-2 h-8 px-2 -ml-2 transition-colors">
            <ChevronLeft className="h-4 w-4 mr-1" /> Kembali ke Pusat Hasil Belajar
          </Button>
        </Link>

        {isLoading ? (
          <div className="space-y-2 mt-2">
            <Skeleton className="h-8 w-64 bg-slate-200 animate-pulse" />
            <Skeleton className="h-4 w-48 bg-slate-100 animate-pulse" />
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight uppercase">
              LEGER KELAS: {classInfo?.name}
            </h1>
            <p className="text-sm text-slate-500 font-medium mt-1 flex items-center gap-2">
              <span>Wali Kelas: <span className="text-slate-800 font-bold uppercase">{classInfo?.teacher_name || "Belum Ditentukan"}</span></span>
              <span className="text-slate-300">|</span>
              <span className="flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5 text-slate-400" /> {classInfo?.institution_name}</span>
            </p>
          </>
        )}
      </div>

      <div className="flex flex-wrap gap-2 w-full md:w-auto mt-2 md:mt-0">
        <Button onClick={onPrint} disabled={isLoading} className="h-10 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 rounded-lg shadow-sm active:scale-95 transition-all">
          <Printer className="w-4 h-4 mr-2" /> Cetak Leger & Rapor
        </Button>
      </div>
    </div>
  );
}