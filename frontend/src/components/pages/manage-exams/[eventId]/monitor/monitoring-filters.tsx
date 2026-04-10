// LOKASI: src/components/pages/manage-exams/[eventId]/monitor/monitoring-filters.tsx
"use client";

import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Activity, UserCheck, Ban, Clock } from "lucide-react";

interface MonitoringFiltersProps {
  search: string;
  onSearchChange: (val: string) => void;
  filterStatus: string;
  onFilterStatusChange: (val: string) => void;
}

export function MonitoringFilters({ search, onSearchChange, filterStatus, onFilterStatusChange }: MonitoringFiltersProps) {
  return (
    <div className="bg-slate-50/50 border-b border-slate-100 p-4 rounded-t-xl">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-end">
        
        {/* 1. Pencarian Peserta (8 Kolom) */}
        <div className="lg:col-span-8 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
          <Input
            placeholder="Cari nama peserta atau username..."
            className="pl-9 h-10 bg-white border-slate-200 text-sm focus-visible:ring-emerald-500 w-full shadow-sm transition-all"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        {/* 2. Filter Status Aktivitas (4 Kolom) */}
        <div className="lg:col-span-4 relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10 pointer-events-none">
            <Activity className="h-4 w-4 text-slate-400" />
          </div>
          <Select value={filterStatus} onValueChange={onFilterStatusChange}>
            <SelectTrigger className="pl-9 h-10 bg-white border-slate-200 text-xs focus:ring-emerald-500 shadow-sm w-full transition-all">
              <SelectValue placeholder="Semua Status" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-slate-200 shadow-lg">
              <SelectItem value="ALL" className="font-bold text-emerald-700">Semua Status</SelectItem>
              <SelectItem value="WORKING">
                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500" /> Sedang Mengerjakan</div>
              </SelectItem>
              <SelectItem value="FINISHED">
                <div className="flex items-center gap-2 text-emerald-600"><UserCheck className="h-3.5 w-3.5" /> Selesai Ujian</div>
              </SelectItem>
              <SelectItem value="BLOCKED">
                <div className="flex items-center gap-2 text-rose-600"><Ban className="h-3.5 w-3.5" /> Terblokir Sistem</div>
              </SelectItem>
              <SelectItem value="REGISTERED">
                <div className="flex items-center gap-2 text-slate-500"><Clock className="h-3.5 w-3.5" /> Belum Login</div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

      </div>
    </div>
  );
}