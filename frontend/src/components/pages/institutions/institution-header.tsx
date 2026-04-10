// LOKASI: src/components/pages/institutions/institution-header.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Building2, FileSpreadsheet, Plus, FileDown, FileText } from "lucide-react"; // <-- Import Icon Tambahan

interface InstitutionHeaderProps {
  onOpenImport: () => void;
  onOpenCreate: () => void;
  onExportExcel: () => void; // <-- Wajib ditambahkan agar TypeScript tidak error
  onExportPdf: () => void;   // <-- Wajib ditambahkan agar TypeScript tidak error
}

export function InstitutionHeader({ onOpenImport, onOpenCreate, onExportExcel, onExportPdf }: InstitutionHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2 tracking-tight">
          <Building2 className="h-6 w-6 text-emerald-600" /> Data Lembaga
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Kelola data sekolah dan unit pendidikan untuk cetak administrasi.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        
        {/* TOMBOL UNDUH PDF */}
        <Button
          variant="outline"
          className="bg-white hover:bg-rose-50 text-rose-600 border-rose-200 shadow-sm transition-colors"
          onClick={onExportPdf}
          title="Unduh Laporan PDF"
        >
          <FileText className="mr-2 h-4 w-4" /> Unduh PDF Data Lembaga
        </Button>

        {/* TOMBOL UNDUH EXCEL */}
        <Button
          variant="outline"
          className="bg-white hover:bg-emerald-50 text-emerald-600 border-emerald-200 shadow-sm transition-colors"
          onClick={onExportExcel}
          title="Unduh Laporan Excel"
        >
          <FileDown className="mr-2 h-4 w-4" /> Unduh Excel Data Lembaga
        </Button>

        {/* TOMBOL IMPORT */}
        <Button
          variant="outline"
          className="bg-white hover:bg-blue-50 text-blue-600 border-blue-200 shadow-sm transition-colors"
          onClick={onOpenImport}
        >
          <FileSpreadsheet className="mr-2 h-4 w-4" /> Unggah Excel Data Lembaga
        </Button>

        {/* TOMBOL TAMBAH (Utama) */}
        <Button
          className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition-all active:scale-95"
          onClick={onOpenCreate}
        >
          <Plus className="mr-2 h-4 w-4" /> Tambah Lembaga
        </Button>

      </div>
    </div>
  );
}