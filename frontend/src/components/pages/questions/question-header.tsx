// LOKASI: src/components/pages/questions/question-header.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Plus, BookOpen, FileDown, Loader2, FileText, UploadCloud, List } from "lucide-react"; 

interface QuestionHeaderProps {
  onCreateClick: () => void;
  onExportClick: () => void; 
  isExporting: boolean;      
  onExportPdfClick: () => void; 
  isExportingPdf: boolean;   
  
  //  PROPS BARU UNTUK FITUR BATCH & LAPORAN
  onImportBatchClick: () => void; 
  onExportListClick: () => void;  
  isExportingList: boolean;       
}

export function QuestionHeader({ 
  onCreateClick, 
  onExportClick, 
  isExporting,
  onExportPdfClick,    
  isExportingPdf,
  onImportBatchClick,
  onExportListClick,
  isExportingList
}: QuestionHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2 tracking-tight">
          <BookOpen className="h-6 w-6 text-emerald-600" /> Bank Soal
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Kelola pangkalan data soal untuk ujian pilihan ganda & essay.
        </p>
      </div>
      
      <div className="flex flex-wrap items-center gap-2">

        {/*  FITUR BARU: Tombol Export Laporan (Warna Indigo) */}
        <Button
          variant="outline"
          onClick={onExportListClick}
          disabled={isExportingList}
          className="bg-white hover:bg-indigo-50 text-indigo-600 border-indigo-200 shadow-sm"
        >
          {isExportingList ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Mengekspor...</>
          ) : (
            <><List className="mr-2 h-4 w-4" /> Unduh List Daftar Paket Soal</>
          )}
        </Button>

        {/*  FITUR BARU: Tombol Import Batch (Warna Sky/Biru) */}
        <Button
          variant="outline"
          onClick={onImportBatchClick}
          className="bg-white hover:bg-sky-50 text-sky-600 border-sky-200 shadow-sm"
        >
          <UploadCloud className="mr-2 h-4 w-4" /> Unggah Massal Paket Soal
        </Button>
        
        {/* Tombol Export PDF (Warna Rose/Merah) */}
        <Button
          variant="outline"
          onClick={onExportPdfClick}
          disabled={isExportingPdf}
          className="bg-white hover:bg-rose-50 text-rose-600 border-rose-200 shadow-sm"
        >
          {isExportingPdf ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Mengekspor...</>
          ) : (
            <><FileText className="mr-2 h-4 w-4" /> Unduh PDF Soal & Butir Pertanyaan</>
          )}
        </Button>

        {/* Tombol Export Excel ZIP (Warna Emerald) */}
        <Button
          variant="outline"
          onClick={onExportClick}
          disabled={isExporting}
          className="bg-white hover:bg-emerald-50 text-emerald-600 border-emerald-200 shadow-sm"
        >
          {isExporting ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Mengekspor...</>
          ) : (
            <><FileDown className="mr-2 h-4 w-4" /> ZIP Excel</>
          )}
        </Button>

        {/* Tombol Utama (Buat Paket Soal) */}
        <Button
          onClick={onCreateClick}
          className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md active:scale-95 transition-all"
        >
          <Plus className="mr-2 h-4 w-4" /> Buat Paket Manual
        </Button>

      </div>
    </div>
  );
}