// LOKASI: src/components/pages/results/subjects/subject-detail-header.tsx
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, Printer, FileSpreadsheet, BookOpen, Building2, Loader2 } from "lucide-react";

export function SubjectDetailHeader({ detail, isLoading, exportState, handlers }: any) {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 no-print">
      <div className="w-full md:w-auto">
        <Button 
          variant="ghost" 
          className="text-sm font-bold text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 mb-2 h-8 px-2 -ml-2 transition-colors" 
          onClick={handlers.handleBack}
        >
          <ChevronLeft className="h-4 w-4 mr-1" /> Kembali ke Pusat Hasil Belajar
        </Button>

        {isLoading ? (
          <div className="space-y-2 mt-2">
            <Skeleton className="h-8 w-64 bg-slate-200 animate-pulse" />
            <Skeleton className="h-4 w-48 bg-slate-100 animate-pulse" />
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-black text-[#043425] tracking-tight flex items-center gap-3">
              <div className="h-10 w-10 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0 border border-emerald-200">
                <BookOpen className="h-6 w-6 text-emerald-600" />
              </div>
              Rekap Nilai: {detail?.subject_name}
            </h1>
            <p className="text-slate-500 text-sm mt-1.5 font-medium flex items-center gap-2">
              <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200 flex items-center gap-1.5">
                Kelas: <span className="text-slate-800 font-bold uppercase">{detail?.class_name}</span>
              </span>
              <span className="text-slate-300">|</span>
              <span className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-400" /> {detail?.institution_name}
              </span>
            </p>
          </>
        )}
      </div>

      <div className="flex flex-wrap gap-2 w-full md:w-auto mt-2 md:mt-0">
        <Button 
          variant="outline" 
          onClick={handlers.handlePrint} 
          disabled={isLoading || exportState.isExportingPdf} 
          className="h-10 bg-white border-slate-200 text-slate-700 hover:bg-slate-50 font-bold px-5 rounded-lg shadow-sm active:scale-95 transition-all"
        >
          {exportState.isExportingPdf ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Printer className="w-4 h-4 mr-2 text-slate-500" />} 
          Cetak PDF
        </Button>
        <Button 
          onClick={handlers.handleExportExcel} 
          disabled={isLoading || exportState.isExportingExcel} 
          className="h-10 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 rounded-lg shadow-sm active:scale-95 transition-all"
        >
          {exportState.isExportingExcel ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileSpreadsheet className="w-4 h-4 mr-2" />} 
          Unduh Excel
        </Button>
      </div>
    </div>
  );
}