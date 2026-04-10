// LOKASI: src/app/dashboard/manage-exams/manage-exams-header.tsx
"use client";

import { Button } from "@/components/ui/button";
import { CalendarRange, Plus } from "lucide-react";

interface ManageExamsHeaderProps {
  onAddClick: () => void;
  role: string; 
}

export function ManageExamsHeader({ onAddClick, role }: ManageExamsHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2 tracking-tight">
          <CalendarRange className="h-6 w-6 text-emerald-600" /> Manajemen Ujian
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Kelola jadwal, sesi ujian, dan pantau aktivitas peserta secara real-time.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {role !== "TEACHER" && (
          <Button
            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md active:scale-95 transition-all"
            onClick={onAddClick}
          >
            <Plus className="mr-2 h-4 w-4" />
            Buat Kegiatan Ujian
          </Button>
        )}
      </div>
    </div>
  );
}