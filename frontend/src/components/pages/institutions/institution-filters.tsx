// LOKASI: src/components/pages/institutions/institution-filters.tsx
"use client";

import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, RefreshCcw, Zap } from "lucide-react";

interface InstitutionFiltersProps {
  searchInput: string;
  setSearchInput: (val: string) => void;
  filter: { 
    category: string; 
    level_code: string; 
    is_pq_active?: string; 
    page?: number; 
    limit?: number 
  };
  setFilter: (val: any) => void;
}

const CATEGORY_OPTIONS = ["FORMAL", "PONDOK", "PROGRAM"];
const LEVEL_OPTIONS = [
  "SD/MI/SEDERAJAT",
  "SMP/MTs/SEDERAJAT",
  "SMA/MA/SMK/SEDERAJAT",
  "PERGURUAN TINGGI",
];

export function InstitutionFilters({
  searchInput,
  setSearchInput,
  filter,
  setFilter,
}: InstitutionFiltersProps) {
  
  // Fungsi pembantu agar setiap kali filter diubah, paginasi kembali ke halaman 1
  const handleFilterChange = (key: string, value: string) => {
    setFilter((prev: any) => ({ ...prev, [key]: value, page: 1 })); 
  };

  const handleClearSearch = () => {
    setSearchInput("");
    setFilter((prev: any) => ({ ...prev, page: 1 }));
  };

  return (
    <div className="p-4 border-b border-slate-100 bg-slate-50/50 rounded-t-xl">
      {/* PENYEMPURNAAN RESPONSIVITAS: Menggunakan lg:grid-cols-12 agar di tablet dropdown tidak menyempit */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        
        {/* 1. Pencarian (lg: 4 Kolom) */}
        <div className="lg:col-span-4 relative flex items-center">
          <Search className="absolute left-3 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Cari Nama, Kode, atau Kota..."
            className="pl-9 pr-10 bg-white border-slate-200 focus-visible:ring-emerald-500 w-full h-10 shadow-sm text-sm"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          {searchInput && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClearSearch}
              className="absolute right-1 h-8 w-8 text-rose-500 hover:bg-rose-50 hover:text-rose-600"
              title="Hapus Pencarian"
            >
              <RefreshCcw className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* 2. Filter Kategori (lg: 3 Kolom) */}
        <div className="lg:col-span-3">
          <Select value={filter.category} onValueChange={(v) => handleFilterChange("category", v)}>
            <SelectTrigger className="h-10 bg-white border-slate-200 text-xs focus:ring-emerald-500 shadow-sm">
              <SelectValue placeholder="Semua Kategori" />
            </SelectTrigger>
            <SelectContent>
              {/* PENYEMPURNAAN UI: Highlight opsi reset dengan text-emerald-700 font-bold */}
              <SelectItem value="ALL" className="font-bold text-emerald-700">Semua Kategori</SelectItem>
              {CATEGORY_OPTIONS.map((opt) => (
                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 3. Filter Jenjang (lg: 3 Kolom) */}
        <div className="lg:col-span-3">
          <Select value={filter.level_code} onValueChange={(v) => handleFilterChange("level_code", v)}>
            <SelectTrigger className="h-10 bg-white border-slate-200 text-xs focus:ring-emerald-500 shadow-sm">
              <SelectValue placeholder="Semua Jenjang" />
            </SelectTrigger>
            <SelectContent>
              {/* PENYEMPURNAAN UI: Highlight opsi reset dengan text-emerald-700 font-bold */}
              <SelectItem value="ALL" className="font-bold text-emerald-700">Semua Jenjang</SelectItem>
              {LEVEL_OPTIONS.map((opt) => (
                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 4. FILTER STATUS INTEGRASI (lg: 2 Kolom) - FASE 3 */}
        <div className="lg:col-span-2">
          <Select 
            value={filter.is_pq_active || "ALL"} 
            onValueChange={(v) => handleFilterChange("is_pq_active", v)}
          >
            <SelectTrigger className="h-10 bg-white border-slate-200 text-xs focus:ring-amber-500 shadow-sm">
              <div className="flex items-center gap-2">
                <SelectValue placeholder="PQ Status" />
              </div>
            </SelectTrigger>
            <SelectContent>
              {/* PENYEMPURNAAN UI: Highlight opsi reset dengan text-emerald-700 font-bold */}
              <SelectItem value="ALL" className="font-bold text-emerald-700">Semua Status</SelectItem>
              <SelectItem value="TRUE">Integrasi Pihak Ketiga Aktif</SelectItem>
              <SelectItem value="FALSE">Integrasi Pihak Ketiga Non-Aktif</SelectItem>
            </SelectContent>
          </Select>
        </div>

      </div>
    </div>
  );
}