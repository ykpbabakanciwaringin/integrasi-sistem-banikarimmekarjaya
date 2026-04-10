// LOKASI: src/components/pages/classes/class-filters.tsx
"use client";

import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, RefreshCcw } from "lucide-react";

const LEVEL_OPTIONS = ["1","2","3","4","5","6","VII","VIII","IX","X","XI","XII","ULA","WUSTHA","ULYA","SMT-I","SMT-II","SMT-III","SMT-IV","SMT-V","SMT-VI","SMT-VII","SMT-VIII"];
const MAJOR_OPTIONS = ["TIDAK ADA JURUSAN","UMUM","MIPA","IIS","IBB","IIK","EKOS","MPI","FIQH","AL-QURAN","HADITS","BAHASA ARAB"];

interface ClassFiltersProps {
  searchInput: string;
  setSearchInput: (val: string) => void;
  filter: any;
  setFilter: (val: any) => void;
  institutions: any[];
  isSuperAdmin: boolean;
}

export function ClassFilters({
  searchInput, setSearchInput, filter, setFilter, institutions, isSuperAdmin
}: ClassFiltersProps) {
  
  const handleFilterChange = (key: string, value: string) => {
    setFilter((prev: any) => ({ ...prev, [key]: value, page: 1 }));
  };

  const handleClear = () => {
    setSearchInput("");
    setFilter((prev: any) => ({ ...prev, institution_id: "ALL", level: "ALL", major: "ALL", page: 1 }));
  };

  const hasActiveFilters = searchInput || filter.level !== "ALL" || filter.major !== "ALL" || (isSuperAdmin && filter.institution_id !== "ALL");

  return (
    <div className="p-4 border-b border-slate-100 bg-slate-50/50 rounded-t-xl">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
        
        {/* 1. Pencarian DENGAN Tombol Clear di dalamnya (Lebar menyesuaikan role) */}
        <div className={`relative flex items-center ${isSuperAdmin ? 'md:col-span-4' : 'md:col-span-6'}`}>
          <Search className="absolute left-3 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Cari Nama Kelas..."
            className="pl-9 pr-10 bg-white border-slate-200 focus-visible:ring-emerald-500 w-full h-10 shadow-sm"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClear}
              className="absolute right-1 h-8 w-8 text-rose-500 hover:bg-rose-50 hover:text-rose-600"
              title="Reset Semua Filter"
            >
              <RefreshCcw className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* 2. Filter Lembaga (Hanya Super Admin) */}
        {isSuperAdmin && (
          <div className="md:col-span-3">
            <Select value={filter.institution_id} onValueChange={(v) => handleFilterChange("institution_id", v)}>
              <SelectTrigger className="h-10 bg-white border-slate-200 text-xs focus:ring-emerald-500 shadow-sm"><SelectValue placeholder="Semua Lembaga" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Semua Lembaga</SelectItem>
                {institutions.map((i) => (<SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* 3. Filter Tingkat */}
        <div className={`md:col-span-2 ${!isSuperAdmin && 'md:col-span-3'}`}>
          <Select value={filter.level} onValueChange={(v) => handleFilterChange("level", v)}>
            <SelectTrigger className={`h-10 bg-white border-slate-200 text-xs focus:ring-emerald-500 shadow-sm ${filter.level !== "ALL" ? 'text-emerald-700 font-semibold' : ''}`}>
              <SelectValue placeholder="Semua Tingkat" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua Tingkat</SelectItem>
              {LEVEL_OPTIONS.map((opt) => (<SelectItem key={opt} value={opt}>Tingkat {opt}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>

        {/* 4. Filter Jurusan */}
        <div className={`md:col-span-3 ${!isSuperAdmin && 'md:col-span-3'}`}>
          <Select value={filter.major} onValueChange={(v) => handleFilterChange("major", v)}>
            <SelectTrigger className={`h-10 bg-white border-slate-200 text-xs focus:ring-emerald-500 shadow-sm ${filter.major !== "ALL" ? 'text-indigo-700 font-semibold' : ''}`}>
              <SelectValue placeholder="Semua Jurusan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua Jurusan</SelectItem>
              {MAJOR_OPTIONS.map((opt) => (<SelectItem key={opt} value={opt}>{opt}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>

      </div>
    </div>
  );
}