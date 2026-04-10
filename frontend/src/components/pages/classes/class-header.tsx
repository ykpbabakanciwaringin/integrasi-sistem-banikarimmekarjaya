"use client";

import { Button } from "@/components/ui/button";
import { School, FileSpreadsheet, Plus } from "lucide-react";

interface ClassHeaderProps {
  onOpenImport: () => void;
  onOpenCreate: () => void;
}

export function ClassHeader({ onOpenImport, onOpenCreate }: ClassHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2 tracking-tight">
          <School className="h-6 w-6 text-emerald-600" /> Data Kelas
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Manajemen rombongan belajar, tingkatan, dan penugasan wali kelas.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          className="bg-white hover:bg-emerald-50 text-emerald-600 border-emerald-200 shadow-sm transition-colors"
          onClick={onOpenImport}
        >
          <FileSpreadsheet className="mr-2 h-4 w-4" /> Import Excel
        </Button>
        <Button
          className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition-all active:scale-95"
          onClick={onOpenCreate}
        >
          <Plus className="mr-2 h-4 w-4" /> Tambah Kelas
        </Button>
      </div>
    </div>
  );
}