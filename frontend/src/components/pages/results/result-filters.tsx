// LOKASI: src/components/pages/results/result-filters.tsx
"use client";

import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search } from "lucide-react";
import { useAuthStore } from "@/stores/use-auth-store";

interface ResultFiltersProps {
  activeTab: "mapel" | "wali" | "rapor" | "ujian";
  setActiveTab: (val: "mapel" | "wali" | "rapor" | "ujian") => void;
  search: string;
  onSearchChange: (val: string) => void;
  isHomeroomTeacher?: boolean; //  TAMBAHKAN BARIS INI UNTUK MENGHILANGKAN ERROR
}

export function ResultFilters({
  activeTab,
  setActiveTab,
  search,
  onSearchChange,
  isHomeroomTeacher = false, // Berikan default value false
}: ResultFiltersProps) {
  
  const { user } = useAuthStore() as any;
  const isAdmin = ["SUPER_ADMIN", "ADMIN", "ADMIN_ACADEMIC"].includes(user?.role);
  const isTeacher = user?.role === "TEACHER";

  return (
    <div className="space-y-0">
      <div className="border-b border-slate-100 px-6 pt-4 bg-white rounded-t-xl overflow-x-auto no-scrollbar">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="bg-transparent h-12 p-0 gap-2 sm:gap-6 flex w-max min-w-full">
            
            {/* Rekap Guru Mapel: Admin & Semua Guru */}
            {(isAdmin || isTeacher) && (
              <TabsTrigger 
                value="mapel" 
                className="data-[state=active]:border-b-2 data-[state=active]:border-emerald-600 data-[state=active]:text-emerald-700 rounded-none px-2 font-semibold text-slate-500 transition-colors whitespace-nowrap"
              >
                Rekap Nilai Per Mata Pelajaran
              </TabsTrigger>
            )}

            {/* Leger & Rapor: Admin ATAU Guru yang merupakan Wali Kelas */}
            {(isAdmin || (isTeacher && isHomeroomTeacher)) && (
              <>
                <TabsTrigger 
                  value="wali" 
                  className="data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-700 rounded-none px-2 font-semibold text-slate-500 transition-colors whitespace-nowrap"
                >
                  Leger Wali Kelas
                </TabsTrigger>
                <TabsTrigger 
                  value="rapor" 
                  className="data-[state=active]:border-b-2 data-[state=active]:border-amber-500 data-[state=active]:text-amber-600 rounded-none px-2 font-semibold text-slate-500 transition-colors whitespace-nowrap"
                >
                  Cetak Rapor Fisik
                </TabsTrigger>
              </>
            )}

            {/* Hasil Ujian Per Sesi: Hanya Admin */}
            {isAdmin && (
              <TabsTrigger 
                value="ujian" 
                className="data-[state=active]:border-b-2 data-[state=active]:border-rose-600 data-[state=active]:text-rose-700 rounded-none px-2 font-semibold text-slate-500 transition-colors whitespace-nowrap"
              >
                Rekap Hasil Per Sesi Ujian
              </TabsTrigger>
            )}

          </TabsList>
        </Tabs>
      </div>

      <div className="bg-slate-50/50 border-b border-slate-100 p-4">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder={
              activeTab === "mapel" ? "Cari mata pelajaran..." :
              activeTab === "ujian" ? "Cari judul sesi ujian CBT..." :
              "Cari kelas rombel..."
            }
            className="pl-9 h-10 bg-white border-slate-200 text-sm focus-visible:ring-emerald-500 w-full shadow-sm"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}