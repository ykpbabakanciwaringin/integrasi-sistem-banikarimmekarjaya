// LOKASI: src/components/pages/results/exams/exam-detail-header.tsx
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, FileDown, FileText, MonitorPlay, Loader2, BookOpen, FileSignature } from "lucide-react";

export function ExamDetailHeader({ sessionData, isLoading, exportState, handlers }: any) {
  return (
    <div className="flex flex-col gap-4 mb-2">
      <Button variant="ghost" className="w-fit -ml-2 text-slate-500 hover:text-emerald-700 h-8 px-2 transition-colors" onClick={handlers.handleBack}>
        <ChevronLeft className="mr-1 h-4 w-4" /> Kembali ke Pusat Nilai
      </Button>
      
      <div className="bg-gradient-to-br from-[#043425] to-[#065f46] rounded-2xl p-6 md:p-8 border border-[#065f46] shadow-xl relative overflow-hidden flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 text-white">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
        
        {isLoading ? (
          <div className="space-y-3 z-10 w-full">
            <Skeleton className="h-10 w-3/4 bg-white/20 rounded-lg animate-pulse" />
            <Skeleton className="h-5 w-1/2 bg-white/10 rounded-md animate-pulse" />
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-2 z-10 flex-1 w-full">
              <h1 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-3">
                <MonitorPlay className="h-7 w-7 text-emerald-400 shrink-0" /> 
                <span className="line-clamp-2">{sessionData?.title || "Analisis Hasil CBT"}</span>
              </h1>
              <div className="flex flex-wrap items-center gap-3 mt-1 font-medium text-emerald-100">
                <span className="flex items-center gap-1.5 text-sm">
                  <BookOpen className="h-4 w-4 opacity-70" /> 
                  <span className="truncate max-w-[250px] md:max-w-[400px]">{sessionData?.subject_list || "Mata Pelajaran Campuran"}</span>
                </span>
              </div>
            </div>

            <div className="flex flex-col md:flex-row items-start md:items-center gap-4 z-10 shrink-0 w-full xl:w-auto">
              <div className="bg-white/10 border border-white/20 rounded-xl p-2.5 px-5 flex flex-col items-center shadow-inner backdrop-blur-sm w-full md:w-auto">
                <span className="text-[10px] font-bold text-emerald-200 uppercase tracking-widest mb-0.5">Token Ujian</span>
                <span className="text-2xl font-black tracking-widest text-white uppercase font-mono">
                  {sessionData?.token || "------"}
                </span>
              </div>

              {/*  FIX: Tiga Tombol Ekspor Sesuai Acuan */}
              <div className="grid grid-cols-1 sm:grid-cols-3 xl:flex xl:flex-col gap-2 w-full xl:w-auto">
                <Button 
                  className="bg-indigo-600 hover:bg-indigo-700 text-white border-0 shadow-md transition-all active:scale-95 h-10 w-full" 
                  onClick={handlers.handleExportBeritaAcara} 
                  disabled={isLoading || exportState.isExportingBeritaAcara}
                >
                  {exportState.isExportingBeritaAcara ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileSignature className="mr-2 h-4 w-4" />} 
                  Berita Acara
                </Button>
                <Button 
                  className="bg-rose-600 hover:bg-rose-700 text-white border-0 shadow-md transition-all active:scale-95 h-10 w-full" 
                  onClick={handlers.handleExportPdf} 
                  disabled={isLoading || exportState.isExportingPdf}
                >
                  {exportState.isExportingPdf ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />} 
                  Laporan PDF
                </Button>
                <Button 
                  className="bg-white text-[#043425] hover:bg-emerald-50 border-0 shadow-md transition-all active:scale-95 h-10 w-full font-bold" 
                  onClick={handlers.handleExportExcel} 
                  disabled={isLoading || exportState.isExportingExcel}
                >
                  {exportState.isExportingExcel ? <Loader2 className="mr-2 h-4 w-4 animate-spin text-[#043425]" /> : <FileDown className="mr-2 h-4 w-4" />} 
                  Ekspor Excel
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}