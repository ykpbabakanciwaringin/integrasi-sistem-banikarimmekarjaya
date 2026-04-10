import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, Printer, Users, School } from "lucide-react";
import { useRouter } from "next/navigation";

export function RaporHeader({ data, handlers }: any) {
  const router = useRouter();
  const { classInfo, isLoading, totalItems } = data;

  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 no-print">
      <div className="space-y-1">
        <Button 
          variant="ghost" 
          onClick={() => router.back()}
          className="p-0 h-auto text-emerald-600 hover:text-emerald-700 hover:bg-transparent font-bold flex items-center gap-1 transition-all mb-2"
        >
          <ChevronLeft className="w-4 h-4" /> Kembali ke Leger
        </Button>

        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-64 bg-slate-200" />
            <Skeleton className="h-4 w-48 bg-slate-100" />
          </div>
        ) : (
          <>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3 uppercase">
              CETAK RAPOR: {classInfo?.name}
            </h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500 font-medium">
              <span className="flex items-center gap-1.5"><School className="w-4 h-4 text-slate-400" /> {classInfo?.institution_name}</span>
              <span className="text-slate-300">|</span>
              <span className="flex items-center gap-1.5"><Users className="w-4 h-4 text-slate-400" /> {totalItems} Siswa Terdaftar</span>
            </div>
          </>
        )}
      </div>

      <div className="flex gap-3 w-full md:w-auto">
        <Button 
          onClick={handlers.handlePrintAll}
          disabled={isLoading || totalItems === 0}
          className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-11 px-6 rounded-xl shadow-md shadow-emerald-100 transition-all active:scale-95"
        >
          <Printer className="w-4 h-4 mr-2" /> Cetak Semua Rapor
        </Button>
      </div>
    </div>
  );
}