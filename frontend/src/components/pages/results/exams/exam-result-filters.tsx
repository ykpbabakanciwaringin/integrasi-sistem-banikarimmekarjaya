// LOKASI: src/components/pages/results/exams/exam-result-filters.tsx
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";

export function ExamResultFilters({ state, uniqueClasses, uniqueGenders, uniqueSubjects }: any) {
  return (
    <div className="p-4 border-b border-slate-100 bg-slate-50/50">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-end">
        
        {/* 1. Pencarian (3 Kolom) */}
        <div className="lg:col-span-3 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Cari Nama / Username..." 
            className="pl-9 h-10 bg-white border-slate-200 text-sm focus-visible:ring-emerald-500 w-full shadow-sm transition-all" 
            value={state.search} 
            onChange={(e) => state.setSearch(e.target.value)} 
          />
        </div>

        {/* 2. Filter Mata Pelajaran (3 Kolom) -  KHUSUS SESI CAMPURAN */}
        <div className="lg:col-span-3">
          <Select value={state.filterSubject} onValueChange={state.setFilterSubject}>
            <SelectTrigger className="h-10 bg-white border-slate-200 text-xs focus:ring-emerald-500 shadow-sm font-semibold text-slate-700">
              <SelectValue placeholder="Semua Mata Pelajaran" />
            </SelectTrigger>
            <SelectContent className="max-w-[250px]">
              <SelectItem value="ALL" className="font-bold text-emerald-700">Semua Mata Pelajaran</SelectItem>
              {uniqueSubjects?.map((subj: string) => (
                <SelectItem key={subj} value={subj} className="truncate">{subj}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* 3. Filter Status (2 Kolom) */}
        <div className="lg:col-span-2">
          <Select value={state.filterStatus} onValueChange={state.setFilterStatus}>
            <SelectTrigger className="h-10 bg-white border-slate-200 text-xs focus:ring-emerald-500 shadow-sm">
              <SelectValue placeholder="Status Ujian" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL" className="font-bold text-emerald-700">Semua Status</SelectItem>
              <SelectItem value="DONE">Selesai Ujian</SelectItem>
              <SelectItem value="WORKING">Mengerjakan</SelectItem>
              <SelectItem value="BLOCKED">Terblokir</SelectItem>
              <SelectItem value="BELUM UJIAN">Belum Ujian</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 4. Filter Kelas (2 Kolom) */}
        <div className="lg:col-span-2">
          <Select value={state.filterClass} onValueChange={state.setFilterClass}>
            <SelectTrigger className="h-10 bg-white border-slate-200 text-xs focus:ring-emerald-500 shadow-sm">
              <SelectValue placeholder="Semua Kelas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL" className="font-bold text-emerald-700">Semua Kelas</SelectItem>
              {uniqueClasses?.map((cls: string) => (
                <SelectItem key={cls} value={cls}>{cls}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 5. Filter Gender (2 Kolom) */}
        <div className="lg:col-span-2">
          <Select value={state.filterGender} onValueChange={state.setFilterGender}>
            <SelectTrigger className="h-10 bg-white border-slate-200 text-xs focus:ring-emerald-500 shadow-sm">
              <SelectValue placeholder="Semua Gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL" className="font-bold text-emerald-700">Semua Gender</SelectItem>
              {uniqueGenders?.map((g: string) => (
                <SelectItem key={g} value={g}>{g === "L" ? "Laki-laki (L)" : "Perempuan (P)"}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

      </div>
    </div>
  );
}