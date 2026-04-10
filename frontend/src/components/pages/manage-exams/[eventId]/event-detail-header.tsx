// LOKASI: src/components/pages/manage-exams/[eventId]/event-detail-header.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ChevronLeft, Plus, ShieldAlert, FileSpreadsheet, 
  FileDown, FileText 
} from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";

interface EventDetailHeaderProps {
  eventDetail: any;
  onBack: () => void;
  onAddClick: () => void;
  isLoading?: boolean;
  role: string; 
  onImportClick: () => void;
  onExportData: (type: "excel" | "pdf") => void;
}

export function EventDetailHeader({ 
  eventDetail, onBack, onAddClick, isLoading, role,
  onImportClick, onExportData 
}: EventDetailHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
      <div className="flex flex-col gap-1.5 w-full md:w-auto">
        <Button variant="ghost" className="w-fit -ml-2 text-slate-500 hover:text-slate-900 mb-1 h-8 px-2" onClick={onBack}>
          <ChevronLeft className="mr-1 h-4 w-4" /> Kembali ke Induk Ujian
        </Button>
        
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-64 bg-slate-200" />
            <Skeleton className="h-4 w-48 bg-slate-200" />
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2 tracking-tight">
              {eventDetail?.title}
            </h1>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              {eventDetail?.is_active ? (
                <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-0 flex items-center justify-center gap-1.5 px-2 py-0.5 shadow-none w-fit font-bold text-[10px] tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> AKTIF
                </Badge>
              ) : (
                <Badge className="bg-slate-100 text-slate-500 border-0 flex items-center justify-center px-2 py-0.5 shadow-none w-fit font-bold text-[10px] tracking-wider">
                  SELESAI
                </Badge>
              )}
              
              {eventDetail?.is_seb_required && (
                <Badge variant="default" className="bg-rose-100 text-rose-700 hover:bg-rose-200 border-0 flex items-center justify-center gap-1 px-2 py-0.5 shadow-none w-fit font-bold text-[10px] tracking-wider">
                  <ShieldAlert className="w-3 h-3" /> WAJIB SEB
                </Badge>
              )}
            </div>
            {eventDetail && (
              <p className="text-slate-500 text-sm font-medium flex items-center gap-1.5 mt-1">
                Rentang Pelaksanaan:{" "}
                <span className="text-slate-800 font-semibold bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                  {format(new Date(eventDetail.start_date), "dd MMM yyyy", { locale: idLocale })} -{" "}
                  {format(new Date(eventDetail.end_date), "dd MMM yyyy", { locale: idLocale })}
                </span>
              </p>
            )}
          </>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
        {role !== "TEACHER" && (
          <>
            <Button variant="outline" className="bg-white hover:bg-rose-50 text-rose-600 border-rose-200 shadow-sm" onClick={() => onExportData("pdf")} title="Export Data ke PDF">
              <FileText className="mr-2 h-4 w-4" /> PDF Jadwal
            </Button>
            <Button variant="outline" className="bg-white hover:bg-emerald-50 text-emerald-600 border-emerald-200 shadow-sm" onClick={() => onExportData("excel")} title="Export Data ke Excel">
              <FileDown className="mr-2 h-4 w-4" /> Excel Jadwal
            </Button>
            <Button variant="outline" className="bg-white border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300 shadow-sm transition-all" onClick={onImportClick} disabled={isLoading}>
              <FileSpreadsheet className="mr-2 h-4 w-4" /> Unggah Jadwal
            </Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md active:scale-95 transition-all" onClick={onAddClick} disabled={isLoading}>
              <Plus className="mr-2 h-4 w-4" /> Buat Sesi Manual
            </Button>
          </>
        )}
      </div>
    </div>
  );
}