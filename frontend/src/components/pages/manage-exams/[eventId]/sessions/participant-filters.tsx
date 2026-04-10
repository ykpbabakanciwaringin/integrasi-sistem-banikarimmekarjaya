// LOKASI: src/components/pages/manage-exams/[eventId]/sessions/participant-filters.tsx
"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, XCircle } from "lucide-react";

interface ParticipantFiltersProps {
  search: string;
  onSearchChange: (val: string) => void;
  filterStatus: string;
  onFilterStatusChange: (val: string) => void;
  filterGender: string;
  onFilterGenderChange: (val: string) => void;
  filterClassId: string;
  onFilterClassIdChange: (val: string) => void;
  onClearFilters: () => void;
  classes: any[];
}

export function ParticipantFilters({
  search,
  onSearchChange,
  filterStatus,
  onFilterStatusChange,
  filterGender,
  onFilterGenderChange,
  filterClassId,
  onFilterClassIdChange,
  onClearFilters,
  classes,
}: ParticipantFiltersProps) {
  
  const hasActiveFilters = search !== "" || filterStatus !== "ALL" || filterGender !== "ALL" || filterClassId !== "ALL";

  return (
    <div className="bg-slate-50/50 border-b border-slate-100 p-4 rounded-t-xl">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-end">
        
        {/* 1. Pencarian Peserta */}
        <div className={hasActiveFilters ? "lg:col-span-3 relative" : "lg:col-span-4 relative"}>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Cari nama, NISN, atau username..."
            className="pl-9 h-10 bg-white border-slate-200 text-sm focus-visible:ring-emerald-500 w-full shadow-sm"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        {/* 2. Filter Status Aktivitas */}
        <div className="lg:col-span-3">
          <Select value={filterStatus} onValueChange={onFilterStatusChange}>
            <SelectTrigger className="h-10 bg-white border-slate-200 text-xs focus:ring-emerald-500 shadow-sm w-full">
              <SelectValue placeholder="Semua Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL" className="font-bold text-emerald-700">Semua Status</SelectItem>
              <SelectItem value="WORKING">Sedang Mengerjakan</SelectItem>
              <SelectItem value="FINISHED">Selesai Ujian</SelectItem>
              <SelectItem value="BLOCKED">Terblokir Sistem</SelectItem>
              <SelectItem value="REGISTERED">Belum Login</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 3. Filter Kelas */}
        <div className="lg:col-span-3">
          <Select value={filterClassId} onValueChange={onFilterClassIdChange}>
            <SelectTrigger className="h-10 bg-white border-slate-200 text-xs focus:ring-emerald-500 shadow-sm w-full">
              <SelectValue placeholder="Semua Kelas" />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              <SelectItem value="ALL" className="font-bold text-emerald-700">Semua Kelas</SelectItem>
              {classes?.map((c: any) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 4. Filter Gender */}
        <div className="lg:col-span-2">
          <Select value={filterGender} onValueChange={onFilterGenderChange}>
            <SelectTrigger className="h-10 bg-white border-slate-200 text-xs focus:ring-emerald-500 shadow-sm w-full">
              <SelectValue placeholder="Semua Gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL" className="font-bold text-emerald-700">Semua Gender</SelectItem>
              <SelectItem value="L">Laki-laki (L)</SelectItem>
              <SelectItem value="P">Perempuan (P)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 5. Tombol Reset Filter */}
        {hasActiveFilters && (
          <div className="lg:col-span-1 flex justify-end">
            <Button 
              variant="outline" 
              onClick={onClearFilters}
              className="h-10 w-full text-rose-500 border-rose-200 hover:text-rose-700 hover:bg-rose-50 font-bold px-3 shadow-sm bg-white"
              title="Hapus Semua Filter"
            >
              <XCircle className="h-4 w-4" />
            </Button>
          </div>
        )}

      </div>
    </div>
  );
}