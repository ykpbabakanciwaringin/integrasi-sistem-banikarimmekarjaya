// LOKASI: src/components/pages/teachers/teacher-filters.tsx
"use client";

import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";

interface TeacherFiltersProps {
  activeTab: "ACTIVE" | "PENDING";
  setActiveTab: (val: "ACTIVE" | "PENDING") => void;
  pendingCount: number;
  search: string;
  onSearchChange: (val: string) => void;
  filterInstId: string;
  onFilterInstIdChange: (val: string) => void;
  filterGender: string;
  onFilterGenderChange: (val: string) => void;
  filterPosition: string; 
  onFilterPositionChange: (val: string) => void; 
  institutions: any[];
  isSuperAdmin: boolean;
}

export function TeacherFilters({
  activeTab,
  setActiveTab,
  pendingCount,
  search,
  onSearchChange,
  filterInstId,
  onFilterInstIdChange,
  filterGender,
  onFilterGenderChange,
  filterPosition,
  onFilterPositionChange,
  institutions,
  isSuperAdmin,
}: TeacherFiltersProps) {
  
  return (
    <div className="space-y-0">
      {/*  TABS STATUS (Terintegrasi Lencana Merah Berkedip) */}
      <div className="border-b border-slate-100 px-6 pt-4 bg-white rounded-t-xl">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="bg-transparent h-12 p-0 gap-6">
            <TabsTrigger 
              value="ACTIVE" 
              className="data-[state=active]:border-b-2 data-[state=active]:border-emerald-600 data-[state=active]:text-emerald-700 rounded-none px-2 font-semibold text-slate-500 transition-colors"
            >
              Guru Aktif
            </TabsTrigger>
            <TabsTrigger 
              value="PENDING" 
              className="data-[state=active]:border-b-2 data-[state=active]:border-amber-500 data-[state=active]:text-amber-600 rounded-none px-2 font-semibold text-slate-500 flex items-center gap-2 transition-colors"
            >
              Menunggu Verifikasi 
              {pendingCount > 0 && (
                <Badge className="bg-rose-500 text-white px-1.5 py-0 h-5 text-[10px] animate-pulse">
                  {pendingCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/*  SEARCH & DINAMIC DROPDOWN FILTERS (Layout 12 Kolom) */}
      <div className="bg-slate-50/50 border-b border-slate-100 p-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-end">
          
          {/* 1. Pencarian (Lebar menyesuaikan Role) */}
          <div className={isSuperAdmin ? "lg:col-span-3 relative" : "lg:col-span-4 relative"}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Cari Nama, NIP, atau Username..."
              className="pl-9 h-10 bg-white border-slate-200 text-sm focus-visible:ring-emerald-500 w-full shadow-sm"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>

          {/* 2. Filter Lembaga (Hanya Super Admin) */}
          {isSuperAdmin && (
            <div className="lg:col-span-3">
              <Select value={filterInstId} onValueChange={onFilterInstIdChange}>
                <SelectTrigger className="h-10 bg-white border-slate-200 text-xs focus:ring-emerald-500 shadow-sm">
                  <SelectValue placeholder="Semua Lembaga" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL" className="font-bold text-emerald-700">Semua Lembaga</SelectItem>
                  {institutions?.map((inst: any) => (
                    <SelectItem key={inst.id} value={inst.id}>
                      {inst.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* 3. Filter Jabatan Utama */}
          <div className={isSuperAdmin ? "lg:col-span-3" : "lg:col-span-4"}>
            <Select value={filterPosition} onValueChange={onFilterPositionChange}>
              <SelectTrigger className="h-10 bg-white border-slate-200 text-xs focus:ring-emerald-500 shadow-sm">
                <SelectValue placeholder="Semua Jabatan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL" className="font-bold text-emerald-700">Semua Jabatan</SelectItem>
                <SelectItem value="GURU MAPEL">Guru Mapel</SelectItem>
                <SelectItem value="WALI KELAS">Wali Kelas</SelectItem>
                <SelectItem value="KEPALA MADRASAH">Kepala Madrasah</SelectItem>
                <SelectItem value="WAKA KURIKULUM">Waka Bid Kurikulum</SelectItem>
                <SelectItem value="KEPALA STAFF TU">Kepala Staff TU</SelectItem>
                <SelectItem value="TATA USAHA">Tata Usaha</SelectItem>
                <SelectItem value="BENDAHARA">Bendahara</SelectItem>
                <SelectItem value="GURU PIKET">Guru Piket</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 4. Filter Gender */}
          <div className={isSuperAdmin ? "lg:col-span-3" : "lg:col-span-4"}>
            <Select value={filterGender} onValueChange={onFilterGenderChange}>
              <SelectTrigger className="h-10 bg-white border-slate-200 text-xs focus:ring-emerald-500 shadow-sm">
                <SelectValue placeholder="Semua Gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL" className="font-bold text-emerald-700">Semua Gender</SelectItem>
                <SelectItem value="L">Laki-laki (L)</SelectItem>
                <SelectItem value="P">Perempuan (P)</SelectItem>
              </SelectContent>
            </Select>
          </div>

        </div>
      </div>
    </div>
  );
}