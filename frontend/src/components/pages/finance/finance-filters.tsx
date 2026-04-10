// LOKASI: src/components/pages/finance/finance-filters.tsx
"use client";

import { useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, School, Home, BookOpen, Layers } from "lucide-react";
import { FinanceCategory } from "@/types/finance";

interface FinanceFiltersProps {
  search: string;
  onSearchChange: (val: string) => void;
  filterStatus: string;
  onFilterStatusChange: (val: string) => void;
  filterCategoryId: string;
  onFilterCategoryIdChange: (val: string) => void;
  
  filterCategoryType: string;
  onFilterCategoryTypeChange: (val: string) => void;
  filterPondok: string;
  onFilterPondokChange: (val: string) => void;
  filterSekolah: string;
  onFilterSekolahChange: (val: string) => void;
  filterProgram: string; //  Diselaraskan
  onFilterProgramChange: (val: string) => void;

  categories?: FinanceCategory[];
  options?: { pondoks: string[]; sekolahs: string[]; programs: string[] }; //  Diselaraskan
}

export function FinanceFilters({
  search, onSearchChange,
  filterStatus, onFilterStatusChange,
  filterCategoryId, onFilterCategoryIdChange,
  filterCategoryType, onFilterCategoryTypeChange,
  filterPondok, onFilterPondokChange,
  filterSekolah, onFilterSekolahChange,
  filterProgram, onFilterProgramChange, //  Diselaraskan
  categories = [],
  options = { pondoks: [], sekolahs: [], programs: [] }
}: FinanceFiltersProps) {

  const filteredCategories = useMemo(() => {
    if (filterCategoryType === "ALL") return categories;
    return categories.filter(cat => cat.category_type === filterCategoryType);
  }, [categories, filterCategoryType]);

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 mb-6 space-y-5 shadow-sm">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        <div className="md:col-span-3 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Cari NIS atau Nama..." 
            className="pl-9 h-10 bg-slate-50/50 border-slate-200 text-sm focus-visible:ring-emerald-500"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        <div className="md:col-span-3">
          <Select value={filterSekolah} onValueChange={onFilterSekolahChange}>
            <SelectTrigger className="h-10 bg-white border-slate-200 text-sm">
              <div className="flex items-center gap-2"><School className="h-3.5 w-3.5 text-slate-400"/> <SelectValue placeholder="Lembaga" /></div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL" className="font-bold">Semua Lembaga</SelectItem>
              {options.sekolahs.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="md:col-span-3">
          <Select value={filterProgram} onValueChange={onFilterProgramChange}>
            <SelectTrigger className="h-10 bg-white border-slate-200 text-sm">
               <div className="flex items-center gap-2"><BookOpen className="h-3.5 w-3.5 text-slate-400"/> <SelectValue placeholder="Program" /></div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL" className="font-bold">Semua Program</SelectItem>
              {options.programs?.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="md:col-span-3">
          <Select value={filterPondok} onValueChange={onFilterPondokChange}>
            <SelectTrigger className="h-10 bg-white border-slate-200 text-sm">
               <div className="flex items-center gap-2"><Home className="h-3.5 w-3.5 text-slate-400"/> <SelectValue placeholder="Pondok" /></div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL" className="font-bold">Semua Pondok</SelectItem>
              {options.pondoks.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-4 border-t border-slate-100">
        <div className="md:col-span-3">
          <Select value={filterCategoryType} onValueChange={(v) => { 
              onFilterCategoryTypeChange(v); 
              onFilterCategoryIdChange("ALL");
          }}>
            <SelectTrigger className="h-10 bg-emerald-50 border-emerald-100 text-emerald-700 font-bold text-xs uppercase tracking-wider">
              <div className="flex items-center gap-2"><Layers className="h-3.5 w-3.5"/> <SelectValue placeholder="Sifat Tagihan" /></div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL" className="font-bold">SEMUA SIFAT TAGIHAN</SelectItem>
              <SelectItem value="Bulanan">BULANAN</SelectItem>
              <SelectItem value="Tahunan">TAHUNAN</SelectItem>
              <SelectItem value="Lainnya">LAINNYA</SelectItem>
              <SelectItem value="Tunggakan">TUNGGAKAN LALU</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="md:col-span-6">
          <Select value={filterCategoryId} onValueChange={onFilterCategoryIdChange}>
            <SelectTrigger className="h-10 bg-white border-slate-200 text-sm">
              <SelectValue placeholder="Pilih Kategori Spesifik" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL" className="font-bold">Semua Kategori Spesifik ({filteredCategories.length})</SelectItem>
              {filteredCategories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="md:col-span-3">
          <Select value={filterStatus} onValueChange={onFilterStatusChange}>
            <SelectTrigger className="h-10 bg-white border-slate-200 text-sm">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL" className="font-bold">Semua Status</SelectItem>
              <SelectItem value="unpaid" className="text-rose-600">Belum Lunas</SelectItem>
              <SelectItem value="partial" className="text-amber-600">Cicilan</SelectItem>
              <SelectItem value="paid" className="text-emerald-600">Lunas</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}