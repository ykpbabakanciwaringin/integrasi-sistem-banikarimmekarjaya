// LOKASI: src/app/dashboard/manage-exams/manage-exams-filters.tsx
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
import { Search } from "lucide-react";

interface ManageExamsFiltersProps {
  activeTab: string; 
  setActiveTab: (val: string) => void;
  search: string;
  onSearchChange: (val: string) => void;
  filterInstId: string;
  onFilterInstIdChange: (val: string) => void;
  institutions: any[]; 
  isSuperAdmin: boolean;
}

export function ManageExamsFilters({
  activeTab,
  setActiveTab,
  search,
  onSearchChange,
  filterInstId,
  onFilterInstIdChange,
  institutions,
  isSuperAdmin,
}: ManageExamsFiltersProps) {
  return (
    <div className="space-y-0">
      
      {/*  TABS STATUS KEGIATAN UJIAN (Selaras dengan Data Siswa) */}
      <div className="border-b border-slate-100 px-6 pt-4 bg-white rounded-t-xl">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-transparent h-12 p-0 gap-6">
            <TabsTrigger 
              value="ALL" 
              className="data-[state=active]:border-b-2 data-[state=active]:border-emerald-600 data-[state=active]:text-emerald-700 rounded-none px-2 font-semibold text-slate-500 transition-colors"
            >
              Semua Kegiatan
            </TabsTrigger>
            <TabsTrigger 
              value="true" 
              className="data-[state=active]:border-b-2 data-[state=active]:border-emerald-600 data-[state=active]:text-emerald-700 rounded-none px-2 font-semibold text-slate-500 transition-colors"
            >
              Aktif Berjalan
            </TabsTrigger>
            <TabsTrigger 
              value="false" 
              className="data-[state=active]:border-b-2 data-[state=active]:border-slate-400 data-[state=active]:text-slate-700 rounded-none px-2 font-semibold text-slate-500 transition-colors"
            >
              Selesai / Non-Aktif
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/*  PENCARIAN & FILTER DROPDOWN DINAMIS (Layout 12 Kolom) */}
      <div className="bg-slate-50/50 border-b border-slate-100 p-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-end">
          
          <div className={isSuperAdmin ? "lg:col-span-8 relative" : "lg:col-span-12 relative"}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
            <Input
              placeholder="Cari nama atau deskripsi kegiatan ujian..."
              className="pl-9 h-10 bg-white border-slate-200 text-sm focus-visible:ring-emerald-500 w-full shadow-sm transition-all"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>

          {isSuperAdmin && (
            <div className="lg:col-span-4">
              <Select value={filterInstId} onValueChange={onFilterInstIdChange}>
                <SelectTrigger className="h-10 bg-white border-slate-200 text-xs focus:ring-emerald-500 shadow-sm transition-all">
                  <SelectValue placeholder="Semua Lembaga" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-200 shadow-lg">
                  <SelectItem value="ALL" className="font-bold text-emerald-700">
                    Semua Lembaga
                  </SelectItem>
                  {institutions?.map((inst: any) => (
                    <SelectItem key={inst.id} value={inst.id}>
                      {inst.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}