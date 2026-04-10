// LOKASI: src/components/pages/questions/question-filter.tsx
"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, BookOpen, X, Building2 } from "lucide-react"; // [PERBAIKAN]: Mengganti RefreshCcw dengan X
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface QuestionFilterProps {
  isSuperAdmin: boolean;
  filterInst: string;
  setFilterInst: (v: string) => void;
  institutions: any[];
  filterSubject: string;
  setFilterSubject: (v: string) => void;
  subjects: any[];
  searchInput: string;
  setSearchInput: (v: string) => void;
}

export function QuestionFilter({
  isSuperAdmin, filterInst, setFilterInst, institutions,
  filterSubject, setFilterSubject, subjects, searchInput, setSearchInput,
}: QuestionFilterProps) {
  
  const searchColSpan = isSuperAdmin ? "md:col-span-4" : "md:col-span-6";
  const filterColSpan = isSuperAdmin ? "md:col-span-4" : "md:col-span-6";

  return (
    <div className="bg-slate-50/50 border-b border-slate-100 p-4 rounded-t-xl">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
        
        {/* 1. Pencarian */}
        <div className={`${searchColSpan} relative flex items-center`}>
          <Search className="absolute left-3 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Cari judul paket soal..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9 pr-10 h-10 bg-white border-slate-200 text-sm focus-visible:ring-emerald-500 w-full shadow-sm"
          />
          {searchInput && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setSearchInput("")} 
              className="absolute right-1 h-8 w-8 text-rose-500 hover:bg-rose-50 hover:text-rose-600 transition-colors" 
              title="Hapus Pencarian"
            >
              <X className="h-4 w-4" /> {/* [PERBAIKAN]: Menggunakan ikon X agar sesuai standar UX */}
            </Button>
          )}
        </div>

        {/* 2. Filter Lembaga (Hanya untuk Super Admin) */}
        {isSuperAdmin && (
          <div className="md:col-span-4">
            <Select value={filterInst} onValueChange={setFilterInst}>
              <SelectTrigger className="h-10 bg-white border-slate-200 text-xs focus:ring-emerald-500 shadow-sm">
                <div className="flex items-center gap-2 text-slate-600 font-semibold">
                  <Building2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <SelectValue placeholder="Semua Lembaga" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="font-bold text-emerald-700">Semua Lembaga</SelectItem>
                {institutions?.map((inst: any) => (
                  <SelectItem key={inst.id} value={inst.id}>{inst.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        
        {/* 3. Filter Mata Pelajaran */}
        <div className={filterColSpan}>
          <Select value={filterSubject} onValueChange={setFilterSubject}>
            <SelectTrigger className="h-10 bg-white border-slate-200 text-xs focus:ring-emerald-500 shadow-sm">
              <div className="flex items-center gap-2 text-slate-600 font-semibold">
                <BookOpen className="h-4 w-4 text-emerald-600 shrink-0" />
                <SelectValue placeholder="Semua Mata Pelajaran" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="font-bold text-emerald-700">Semua Mata Pelajaran</SelectItem>
              {subjects?.map((sub: any) => (
                <SelectItem key={sub.id} value={sub.id}>
                  {sub.name} <span className="text-slate-400 ml-1">({sub.code})</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

      </div>
    </div>
  );
}